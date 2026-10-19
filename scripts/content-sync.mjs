import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
export const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export const bodyText=p=>typeof p.markdown==='string'?p.markdown:(p.body||[]).map(s=>`${s.heading?'## '+s.heading+'\n\n':''}${s.text||''}`).join('\n\n');
const articleFile=p=>`# ${p.title.replace(/[\r\n]/g,' ')}\n\n${bodyText(p)}\n`;
const comparable=p=>p?{id:p.id,title:p.title,category:p.category,date:p.date,tags:p.tags||[],excerpt:p.excerpt||'',cover:p.cover||'',markdown:bodyText(p),demo:p.demo===true,pinned:p.pinned===true,attachments:p.attachments||[]}:null;
const equal=(a,b)=>stable(a)===stable(b);
function choose(base,local,remote,label,normalize=v=>v){if(equal(normalize(local),normalize(base)))return remote;if(equal(normalize(remote),normalize(base))||equal(normalize(local),normalize(remote)))return local;throw new Error(`同步冲突：${label} 在网页和 GitHub 都有不同修改。两边均已保留，请手动对照后重跑。`);}
export function merge(base,local,remote){
 const maps=[base,local,remote].map(m=>new Map((m.posts||[]).map(p=>[p.id,p]))),ids=new Set(maps.flatMap(m=>[...m.keys()])),posts=[];
 for(const id of [...ids].sort()){const value=choose(maps[0].get(id)||null,maps[1].get(id)||null,maps[2].get(id)||null,'文章 '+id,comparable);if(value)posts.push(value);}
 const profile={};for(const field of ['school','major','qq','bio','rewardQr'])profile[field]=choose(base.profile?.[field]||'',local.profile?.[field]||'',remote.profile?.[field]||'','个人简介 '+field);
 return {...remote,posts,profile};
}
const validId=id=>/^[a-z0-9][a-z0-9_-]{0,95}$/.test(id);
const readJSON=(name,fallback)=>{try{return JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}};
export function readArticles(manifest,base,directory=root){
 const result=new Map((manifest.posts||[]).map(p=>[p.id,p])),baseMap=new Map((base.posts||[]).map(p=>[p.id,p])),found=new Set();
 for(const category of ['notes','projects','life']){
  const folder=path.join(directory,'content',category);if(!fs.existsSync(folder))continue;
  for(const filename of fs.readdirSync(folder)){
   if(!filename.endsWith('.md'))continue;const id=filename.slice(0,-3);if(!validId(id)||found.has(id))throw new Error('文章文件标识无效或重复：'+filename);found.add(id);
   const text=fs.readFileSync(path.join(folder,filename),'utf8').replace(/\r\n/g,'\n'),old=baseMap.get(id),local=result.get(id);
   if(old&&text===articleFile(old)&&old.category===category)continue;
   if(old&&!local)throw new Error('文章在清单中删除，但 Markdown 又被修改：'+id);
   const match=/^# ([^\n]+)\n(?:\n)?([\s\S]*)$/.exec(text);if(!match)throw new Error('文章第一行应为 # 标题：'+filename);
   let title=match[1].trim(),markdown=match[2].replace(/\n$/,'');const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   if(!markdown.trim())throw new Error('文章正文为空：'+filename);
   if(old&&local){title=choose(old.title,local.title,title,id+' 的标题');markdown=choose(bodyText(old),bodyText(local),markdown,id+' 的正文');}
   const chosenCategory=old&&local?choose(old.category,local.category,category,id+' 的分类'):category;
   const value={...(local||old||{id,date,tags:[],excerpt:'',demo:false}),id,title,category:chosenCategory,markdown};delete value.body;result.set(id,value);
  }
 }
 for(const [id,old] of baseMap)if(!found.has(id)&&result.has(id)){if(!equal(comparable(result.get(id)),comparable(old)))throw new Error('Markdown 已删除，但文章清单又被修改：'+id);result.delete(id);}
 return {...manifest,posts:[...result.values()]};
}
const refs=manifest=>{const values=new Set();for(const p of manifest.posts){if(p.cover)values.add(p.cover);for(const match of bodyText(p).matchAll(/assets\/uploads\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)/g))values.add(match[0]);}if(manifest.profile?.rewardQr)values.add(manifest.profile.rewardQr);return values;};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const attachmentKey=key=>/^assets\/attachments\/[a-z0-9][a-z0-9_-]{0,95}\/[a-zA-Z0-9_-]{8,96}\.(?:pdf|docx?|xlsx?|pptx?|odt|ods|odp|zip|7z|rar|tar|gz|txt|md|csv|json|yaml|yml|xml|log|py|c|cpp|h|hpp|java|js|ts|tsx|jsx|ipynb|r|rs|go|sql|css)$/.test(key);
const imageKey=key=>/^assets\/uploads\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)$/.test(key);
function writeJSON(name,value){const dest=path.join(root,name),text=JSON.stringify(value,null,2)+'\n';fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==text)fs.writeFileSync(dest,text);}
export async function run(){
 const origin=process.env.BLOG_ORIGIN||'https://incloing-blog.pages.dev',token=process.env.CONTENT_SYNC_TOKEN;if(!/^https:\/\/incloing-blog(?:\.pages\.dev|\.incloing-cloudflare\.workers\.dev)$/.test(origin)||!token)throw new Error('请配置 CONTENT_SYNC_TOKEN；同步仅允许本站的 HTTPS 入口。');
 async function api(endpoint,data,headers={}){const raw=data instanceof Uint8Array,response=await fetch(origin+'/api/sync/'+endpoint,{method:data===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,...(data!==undefined&&!raw?{'Content-Type':'application/json'}:{}),...headers},body:data===undefined?undefined:raw?data:JSON.stringify(data),signal:AbortSignal.timeout(60000)});const value=await response.json();if(!response.ok)throw new Error(value.error||'同步接口未能完成请求：'+response.status);return value;}
 if(process.argv.includes('--ack')){const base=readJSON('content/.sync-base.json',null);if(!base)throw new Error('缺少同步基线');const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();await api('ack',{revision:base.revision,commit});console.log('GitHub 快照已确认。');return;}
 let snapshot=await api('export');const base=readJSON('content/.sync-base.json',snapshot.manifest),manifest=readJSON('content/posts.json',base);
 const local=process.env.SYNC_EXPORT_ONLY==='1'?snapshot.manifest:readArticles(manifest,base),merged=merge(base,local,snapshot.manifest);
 const remoteImages=new Map(snapshot.images.map(i=>[i.key,i]));
 for(const key of refs(merged)){
  if(!imageKey(key))throw new Error('图片路径无效：'+key);const file=path.join(root,'public',key);
  if(fs.existsSync(file)){const bytes=fs.readFileSync(file);if(hash(bytes)!==remoteImages.get(key)?.etag)await api('images',bytes,{'X-Image-Key':key});}
  else if(!remoteImages.has(key)){const check=await fetch(origin+'/'+key,{method:'HEAD',signal:AbortSignal.timeout(20000)});if(!check.ok)throw new Error('文章引用的图片未上传：'+key);}
 }
 const remoteAttachments=new Map((snapshot.attachments||[]).map(i=>[i.key,i]));
 for(const item of merged.posts.flatMap(p=>p.attachments||[])){
  if(!attachmentKey(item.path)||!Number.isSafeInteger(item.size)||item.size<1||item.size>10*1024*1024)throw new Error('附件元数据无效');
  const file=path.join(root,'public',item.path);
  if(fs.existsSync(file)){const bytes=fs.readFileSync(file);if(bytes.length!==item.size)throw new Error('附件大小与清单不一致：'+item.name);if(hash(bytes)!==remoteAttachments.get(item.path)?.etag)await api('attachments',bytes,{'X-Attachment-Key':item.path,'X-File-Name':encodeURIComponent(item.name)});}
  else if(!remoteAttachments.has(item.path))throw new Error('附件尚未上传：'+item.name);
 }
 if(!equal(merged.posts.map(comparable),snapshot.manifest.posts.map(comparable))||!equal(merged.profile,snapshot.manifest.profile)){await api('import',{baseRevision:snapshot.manifest.revision,posts:merged.posts,profile:merged.profile});snapshot=await api('export');}
 const live=snapshot.manifest;
 for(const item of snapshot.images){if(!imageKey(item.key)||!Number.isSafeInteger(item.size)||item.size>2*1024*1024)throw new Error('服务器图片元数据无效');const dest=path.join(root,'public',item.key);if(fs.existsSync(dest)&&hash(fs.readFileSync(dest))===item.etag)continue;const response=await fetch(origin+'/'+item.key,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error('下载图片失败：'+item.key);const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length!==item.size||hash(bytes)!==item.etag)throw new Error('图片校验失败：'+item.key);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);}
 for(const item of snapshot.attachments||[]){
  if(!attachmentKey(item.key)||!Number.isSafeInteger(item.size)||item.size<1||item.size>10*1024*1024)throw new Error('服务器附件元数据无效');
  const dest=path.join(root,'public',item.key);if(fs.existsSync(dest)&&hash(fs.readFileSync(dest))===item.etag)continue;
  const response=await fetch(origin+'/'+item.key,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error('下载附件失败：'+item.key);
  const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length!==item.size||hash(bytes)!==item.etag)throw new Error('附件校验失败：'+item.key);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
 }
 writeJSON('content/posts.json',live);writeJSON('content/.sync-base.json',live);writeJSON('content/comments.json',{version:1,comments:snapshot.comments});writeJSON('content/metrics.json',{version:1,...snapshot.metrics});
 const expected=new Set();for(const p of live.posts){if(!validId(p.id)||!['notes','projects','life'].includes(p.category))throw new Error('服务器文章标识无效');const relative=`content/${p.category}/${p.id}.md`;expected.add(relative);const dest=path.join(root,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,articleFile(p));}
 for(const category of ['notes','projects','life']){const folder=path.join(root,'content',category);fs.mkdirSync(folder,{recursive:true});for(const file of fs.readdirSync(folder))if(file.endsWith('.md')&&validId(file.slice(0,-3))&&!expected.has(`content/${category}/${file}`))fs.unlinkSync(path.join(folder,file));}
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`revision=${live.revision}\n`);
 console.log(JSON.stringify({articles:live.posts.length,images:snapshot.images.length,comments:snapshot.comments.length,revision:live.revision,privateTablesExported:false}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))run().catch(error=>{console.error(error.message);process.exitCode=1});
