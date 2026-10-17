/* GitHub-backed writer. Credentials live only in this object's private memory. */
(() => {
 'use strict';
 const API='https://api.github.com',REPO='/repos/Incloing/Blog',OWNER_ID=259068355,MANIFEST='content/posts.json';
 const categories=new Set(['notes','projects','life']);
 const copy=value=>JSON.parse(JSON.stringify(value));
 const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 class WriterError extends Error{constructor(message,code='API'){super(message);this.name='WriterError';this.code=code;}}
 function decode64(text){return new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
 function documentFrom(data){
  if(data?.version!==1||!Array.isArray(data.posts))throw new WriterError('文章目录格式不正确，请保留草稿后联系维护者。','FORMAT');
  const ids=new Set();
  for(const p of data.posts){
   if(typeof p.id!=='string'||ids.has(p.id)||!categories.has(p.category)||typeof p.title!=='string'||typeof p.date!=='string'||!Array.isArray(p.tags)||(typeof p.markdown!=='string'&&!Array.isArray(p.body)))throw new WriterError('文章目录包含无效内容，已停止发布。','FORMAT');
   ids.add(p.id);
  }
  return data;
 }
 function validatePost(value,base){
  if(!value||!/^[a-z0-9][a-z0-9_-]{0,95}$/.test(value.id)||!categories.has(value.category))throw new WriterError('文章标识或分类无效。','VALIDATION');
  const title=String(value.title||'').trim(),markdown=String(value.markdown||'').trim(),date=String(value.date||'');
  if(!title||title.length>160)throw new WriterError('请填写标题，最多 160 个字。','VALIDATION');
  if(!markdown||markdown.length>250000)throw new WriterError('请填写正文，最多 25 万个字符。','VALIDATION');
  if(/!\[[^\]]*\]\(\s*<?(?:blob:|data:)/i.test(markdown))throw new WriterError('正文包含临时图片地址，请使用上传图片按钮重新添加。','IMAGE');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new WriterError('请选择有效的发布日期。','VALIDATION');
  if(!Array.isArray(value.tags)||value.tags.length>12||value.tags.some(t=>typeof t!=='string'||t.length>40))throw new WriterError('标签最多 12 个，每个最多 40 个字。','VALIDATION');
  // Avoid accidentally publishing a pasted access token as prose.
  if(/(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})/.test(title+'\n'+markdown+'\n'+value.excerpt))throw new WriterError('正文中疑似包含 GitHub 授权令牌，请移除后再发布。','VALIDATION');
  const now=new Date().toISOString();
  return {id:value.id,title,category:value.category,date,tags:[...new Set(value.tags.map(t=>t.trim()).filter(Boolean))],excerpt:String(value.excerpt||'').trim().slice(0,400),markdown,demo:false,createdAt:base?.createdAt||now,updatedAt:now};
 }
 function base64Blob(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new WriterError('图片读取失败，请重新选择。','IMAGE'));reader.readAsDataURL(blob);});}
 class GitHubClient{
  #token;#busy=false;
  constructor(token){this.#token=token;this.posts=[];this.user=null;}
  disconnect(){this.#token='';this.posts=[];this.user=null;}
  async request(method,path,data){
   if(path!=='/user'&&!path.startsWith(REPO+'/')&&path!==REPO)throw new WriterError('不允许访问其他仓库。','SCOPE');
   if(!this.#token)throw new WriterError('请先连接 GitHub。','AUTH');
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
   try{
    const response=await fetch(API+path,{method,redirect:'error',cache:'no-store',signal:controller.signal,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+this.#token,'X-GitHub-Api-Version':'2026-03-10',...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
    if(!response.ok){
     if(response.status===401)throw new WriterError('授权已失效，请重新连接 GitHub。','AUTH');
     if(response.status===403)throw new WriterError('GitHub 未允许此操作。请确认授权选择了 Blog 仓库和 Contents 的读写权限；若请求过于频繁，请稍后重试。','PERMISSION');
     if(response.status===404)throw new WriterError('找不到 Blog 仓库或文章文件，请确认令牌已授权 Blog 仓库。','NOT_FOUND');
     if([409,422].includes(response.status))throw new WriterError('仓库内容有变化，请刷新文章列表后重试。你的草稿已保留。','CONFLICT');
     if(response.status===429)throw new WriterError('GitHub 请求过于频繁，请稍后重试。','RATE_LIMIT');
     throw new WriterError('GitHub 暂时无法完成请求（'+response.status+'），请稍后重试。','API');
    }
    return await response.json();
   }catch(error){if(error instanceof WriterError)throw error;throw new WriterError('网络连接中断，请保留草稿并重试。','NETWORK');}finally{clearTimeout(timer);}
  }
  async snapshot(){
   const head=(await this.request('GET',REPO+'/git/ref/heads/main')).object.sha;
   const [commit,file]=await Promise.all([this.request('GET',REPO+'/git/commits/'+head),this.request('GET',REPO+'/contents/'+MANIFEST+'?ref='+head)]);
   // The Contents endpoint omits content above 1 MB; Git blobs still provide it.
   const source=file.encoding==='base64'?file:await this.request('GET',REPO+'/git/blobs/'+file.sha);
   if(source.encoding!=='base64'||typeof source.content!=='string')throw new WriterError('无法读取文章目录。','FORMAT');
   let document;try{document=documentFrom(JSON.parse(decode64(source.content)));}catch(error){if(error instanceof WriterError)throw error;throw new WriterError('文章目录读取失败，请保留草稿。','FORMAT');}
   return {head,tree:commit.tree.sha,document};
  }
  async refresh(){const snapshot=await this.snapshot();this.posts=copy(snapshot.document.posts);return this.posts;}
  async publish(value,images=[],basePost=null,onProgress=()=>{}){
   if(this.#busy)throw new WriterError('正在发布，请等待当前操作完成。','BUSY');
   this.#busy=true;
   try{
    const post=validatePost(value,basePost);
    onProgress('检查最新文章…');
    const snapshot=await this.snapshot(),existing=snapshot.document.posts.find(p=>p.id===post.id);
    if(basePost?(!existing||basePost.id!==post.id||stable(existing)!==stable(basePost)):Boolean(existing))throw new WriterError('这篇文章已在其他页面修改，或标识已被使用。请保留本地草稿，重新载入线上文章后合并。','CONFLICT');
    if(!Array.isArray(images)||images.length>30)throw new WriterError('单篇文章最多上传 30 张新图片。','IMAGE');
    const referenced=images.filter(image=>post.markdown.includes(image.path));
    let total=0;
    for(const image of referenced){
     if(!image.path.startsWith('assets/uploads/'+post.id+'/')||!/^assets\/uploads\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g|gif)$/.test(image.path)||!(image.blob instanceof Blob)||!['image/webp','image/png','image/jpeg','image/gif'].includes(image.blob.type)||image.blob.size>8*1024*1024)throw new WriterError('有图片格式或大小无效，请重新添加（单张最多 8MB）。','IMAGE');
     total+=image.blob.size;
    }
    if(total>30*1024*1024)throw new WriterError('本次图片总量超过 30MB，请减少图片后重试。','IMAGE');
    const entries=[];
    for(let i=0;i<referenced.length;i++){
     onProgress('上传图片 '+(i+1)+' / '+referenced.length+'…');
     const image=referenced[i],blob=await this.request('POST',REPO+'/git/blobs',{encoding:'base64',content:await base64Blob(image.blob)});
     entries.push({path:image.path,mode:'100644',type:'blob',sha:blob.sha});
    }
    const revision='pub-'+Date.now().toString(36)+'-'+crypto.randomUUID().slice(0,8);
    const posts=snapshot.document.posts.filter(p=>p.id!==post.id);posts.unshift(post);
    const document={...snapshot.document,version:1,revision,posts};
    entries.push({path:MANIFEST,mode:'100644',type:'blob',content:JSON.stringify(document,null,2)+'\n'});
    onProgress('保存文章与图片…');
    const tree=await this.request('POST',REPO+'/git/trees',{base_tree:snapshot.tree,tree:entries});
    if((await this.request('GET',REPO+'/git/ref/heads/main')).object.sha!==snapshot.head)throw new WriterError('发布期间仓库有新修改，请再次点击发布以合并最新内容。草稿仍在。','CONFLICT');
    const identity={name:'Incloing',email:'259068355+Incloing@users.noreply.github.com'};
    const commit=await this.request('POST',REPO+'/git/commits',{message:(basePost?'Update article: ':'Publish article: ')+post.title.replace(/[\r\n]/g,' ').slice(0,100),tree:tree.sha,parents:[snapshot.head],author:identity,committer:identity});
    try{await this.request('PATCH',REPO+'/git/refs/heads/main',{sha:commit.sha,force:false});}
    catch(error){
     // A timed-out response may still have completed. Verify before reporting failure.
     let current;try{current=(await this.request('GET',REPO+'/git/ref/heads/main')).object.sha;}catch{}
     if(current!==commit.sha)throw error;
    }
    this.posts=copy(posts);
    return {commit:commit.sha,revision,post:copy(post),posts:copy(posts)};
   }finally{this.#busy=false;}
  }
 }
 window.BlogGitHub=Object.freeze({
  async connect(token){
   if(typeof token!=='string'||token.trim().length<20||token.trim().length>512||/\s/.test(token.trim()))throw new WriterError('请粘贴有效的 GitHub 授权令牌。','AUTH');
   const client=new GitHubClient(token.trim());
   try{
    const user=await client.request('GET','/user');
    if(user.id!==OWNER_ID)throw new WriterError('此后台只允许 Incloing 本人发布，请使用站主账号的授权令牌。','OWNER');
    const repo=await client.request('GET',REPO);
    if(repo.owner?.id!==OWNER_ID||repo.name!=='Blog'||repo.permissions?.push===false)throw new WriterError('此授权没有 Blog 仓库的写入权限。','PERMISSION');
    client.user={login:user.login,avatar_url:'../assets/avatar.webp'};
    await client.refresh();return client;
   }catch(error){client.disconnect();throw error;}
  }
 });
})();
