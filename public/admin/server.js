/* Same-origin writer API. Cookies are HttpOnly; CSRF stays in memory. */
(() => {
 'use strict';
 class Client{
  #csrf;#busy=false;
  constructor(csrf){this.#csrf=csrf;this.posts=[];this.profile=window.BlogProfile.defaults();this.user={login:'Incloing'};this.revision='';}
  async request(path,data,headers={}){
   const response=await fetch('/api/'+path,{method:data===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(45000),headers:{...(data===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':this.#csrf}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});
   let value;try{value=await response.json();}catch{throw new Error('服务器没有返回有效结果，请稍后再试。');}
   if(!response.ok){const error=new Error(value.error||'操作未完成。');error.code=value.code;throw error;}return value;
  }
  async refresh(){const document=await this.request('writer');this.posts=document.posts;this.profile=window.BlogProfile.fromDocument(document);this.revision=document.revision;return this.posts;}
  async publish(value,images=[],basePost=null,onProgress=()=>{},files=[]){
   if(this.#busy)throw new Error('正在保存，请稍候。');this.#busy=true;
   try{
    const post={...value};let total=0;const referenced=images.filter(image=>post.markdown.includes(image.path)||post.cover===image.path);
    if(referenced.length>30)throw new Error('一次最多上传 30 张新图片。');for(const image of referenced)total+=image.blob.size;if(total>30*1024*1024)throw new Error('本次图片总量超过 30MB。');
    for(let i=0;i<referenced.length;i++){
     onProgress(`上传图片 ${i+1} / ${referenced.length}…`);const image=referenced[i];
     const response=await fetch('/api/images',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':this.#csrf,'X-Post-Id':post.id},body:image.blob,signal:AbortSignal.timeout(60000)}),result=await response.json();
     if(!response.ok){const error=new Error(result.error||'图片上传失败。');error.code=result.code;throw error;}post.markdown=post.markdown.split(image.path).join(result.path);if(post.cover===image.path)post.cover=result.path;window.dispatchEvent(new Event('incloing:uploaded'));
    }
    const pending=files.filter(file=>post.attachments?.some(a=>a.path===file.path));
    if(pending.length>10||pending.reduce((n,f)=>n+f.blob.size,0)>30*1024*1024)throw new Error('附件数量或大小超出限制。');
    post.attachments=window.BlogAttachments.normalize(post.attachments);
    for(let i=0;i<pending.length;i++){
     const file=pending[i],item=post.attachments.find(a=>a.path===file.path);onProgress(`上传附件 ${i+1} / ${pending.length}…`);
     const response=await fetch('/api/attachments',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':this.#csrf,'X-Post-Id':post.id,'X-File-Name':encodeURIComponent(item.name)},body:file.blob,signal:AbortSignal.timeout(120000)}),value=await response.json();
     if(!response.ok){const error=new Error(value.error||'附件上传失败。');error.code=value.code;throw error;}
     post.attachments=post.attachments.map(a=>a.path===file.path?value:a);window.dispatchEvent(new Event('incloing:uploaded'));
    }
    if(!post.attachments.length)delete post.attachments;
    onProgress('保存文章…');const result=await this.request('posts',{post,basePost});this.posts=result.posts;this.revision=result.revision;return result;
   }finally{this.#busy=false;}
  }
  async publishProfile(profile,baseProfile,onProgress=()=>{}){if(this.#busy)throw new Error('正在保存，请稍候。');this.#busy=true;try{onProgress('保存个人简介…');const result=await this.request('profile',{profile,baseProfile});this.profile=result.profile;this.revision=result.revision;return result;}finally{this.#busy=false;}}
  async uploadImage(blob,postId='profile'){const response=await fetch('/api/images',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':this.#csrf,'X-Post-Id':postId},body:blob,signal:AbortSignal.timeout(60000)}),value=await response.json();if(!response.ok)throw new Error(value.error||'图片上传失败。');window.dispatchEvent(new Event('incloing:uploaded'));return value.path;}
  async remove(post){const result=await this.request('posts/delete',{id:post.id,basePost:post});this.posts=result.posts;this.revision=result.revision;return result;}
  async removeExamples(){const result=await this.request('posts/delete-examples',{revision:this.revision});this.posts=result.posts;this.revision=result.revision;return result;}
  async logout(){await this.request('auth/logout',{});this.disconnect();}
  disconnect(){this.#csrf='';}
 }
 window.BlogServer=Object.freeze({async connect(csrf){const client=new Client(csrf);await client.refresh();return client;}});
})();
