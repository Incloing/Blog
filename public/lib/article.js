/* Shared by the public blog and the writing desk. Raw HTML is displayed as text. */
(() => {
 'use strict';
 const ownScript=document.currentScript;
 const siteRoot=new URL('../',ownScript?.src||new URL('lib/article.js',document.baseURI));
 const officialRoot=new URL('https://incloing.github.io/Blog/');
 const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const plain=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
 const string=(value,max)=>typeof value==='string'&&value.length<=max;
 const markdownText=value=>String(value??'').replace(/[\\`*{}\[\]()#+.!_>|~-]/g,'\\$&');

 function toMarkdown(post){
  if(typeof post?.markdown==='string')return post.markdown;
  return (Array.isArray(post?.body)?post.body:[]).map(section=>`${section.heading?'## '+markdownText(section.heading)+'\n\n':''}${markdownText(section.text)}`).join('\n\n');
 }
 function uploadPath(path){
  return /^assets\/uploads\/[A-Za-z0-9][A-Za-z0-9_./-]*\.(?:png|jpe?g|webp|gif)$/i.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..');
 }
 function imageUrl(source,resolveImage){
  if(typeof source!=='string'||/[\u0000-\u0020\u007f]/.test(source))return '';
  let value=source;
  if(typeof resolveImage==='function'){
   try{
    const resolved=resolveImage(source);
    // Only a caller-supplied mapping can introduce a temporary local preview URL.
    if(typeof resolved==='string'&&/^blob:https?:\/\//.test(resolved))return resolved;
    if(typeof resolved==='string'&&resolved)value=resolved;
   }catch{return '';}
  }
  if(value.startsWith('./'))value=value.slice(2);
  if(uploadPath(value))return window.IncloingRuntime?.upload(value)||new URL(value,siteRoot).href;
  let parsed;try{parsed=new URL(value);}catch{return '';}
  for(const root of [siteRoot,officialRoot]){
   if(parsed.origin!==root.origin||!parsed.pathname.startsWith(root.pathname)||parsed.search||parsed.hash||parsed.username||parsed.password)continue;
   const relative=parsed.pathname.slice(root.pathname.length);
   if(uploadPath(relative))return window.IncloingRuntime?.upload(relative)||new URL(relative,siteRoot).href;
  }
  return '';
 }
 function linkUrl(value){
  if(typeof value!=='string'||/[\u0000-\u0020\u007f]/.test(value))return '';
  if(/^#[A-Za-z0-9_/-]*$/.test(value))return value;
  if(!/^(?:https?:\/\/|mailto:)/i.test(value))return '';
  try{const url=new URL(value);return ['http:','https:','mailto:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
 }
 function renderMarkdown(markdown,{resolveImage}={}){
  const source=typeof markdown==='string'?markdown.slice(0,500000):'';
  if(!window.marked?.parse||!window.DOMPurify?.sanitize)return `<p>${escape(source).replace(/\n/g,'<br>')}</p>`;
  const renderer=new window.marked.Renderer();
  renderer.html=token=>escape(typeof token==='string'?token:token.text);
  renderer.image=function(token,title,text){
   const modern=typeof token==='object',src=imageUrl(modern?token.href:token,resolveImage),alt=modern?token.text:text,caption=modern?token.title:title;
   return src?`<img src="${escape(src)}" alt="${escape(alt)}"${caption?` title="${escape(caption)}"`:''} loading="lazy" decoding="async">`:escape(alt||'');
  };
  renderer.link=function(token,title,text){
   const modern=typeof token==='object',href=linkUrl(modern?token.href:token),label=modern?this.parser.parseInline(token.tokens):text,caption=modern?token.title:title;
   if(!href)return label;
   const external=/^https?:/i.test(href)&&new URL(href).origin!==location.origin;
   return `<a href="${escape(href)}"${caption?` title="${escape(caption)}"`:''}${external?' target="_blank" rel="noopener noreferrer"':''}>${label}</a>`;
  };
  const html=window.marked.parse(source,{gfm:true,breaks:true,async:false,renderer});
  return window.DOMPurify.sanitize(html,{
   ALLOWED_TAGS:['h1','h2','h3','h4','h5','h6','p','br','strong','em','del','blockquote','ul','ol','li','a','img','pre','code','hr','table','thead','tbody','tr','th','td'],
   ALLOWED_ATTR:['href','title','target','rel','alt','src','loading','decoding','start','colspan','rowspan'],
   // Keep DOMPurify's ordinary non-URL attribute values, plus explicitly mapped blob previews.
   ALLOWED_URI_REGEXP:/^(?:(?:https?|mailto|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
   FORBID_TAGS:['script','style','svg','math','iframe','object','embed','form','input','button','textarea','select'],
   ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,SANITIZE_DOM:true,RETURN_TRUSTED_TYPE:false
  });
 }
 function excerpt(markdown){
  const template=document.createElement('template');template.innerHTML=renderMarkdown(markdown);
  const text=template.content.textContent.replace(/\s+/g,' ').trim();
  return text.length>180?text.slice(0,177)+'…':text;
 }
 function validateManifest(manifest,categories=['notes','projects','life']){
  const known=new Set(categories.map(item=>typeof item==='string'?item:item.id)),ids=new Set();
  if(!plain(manifest)||manifest.version!==1||!string(manifest.revision,200)||!Array.isArray(manifest.posts)||manifest.posts.length>5000)throw new Error('文章清单格式不正确。');
  const posts=manifest.posts.map(post=>{
   if(!plain(post)||!string(post.id,96)||!/^[a-z0-9][a-z0-9_-]{0,95}$/.test(post.id)||ids.has(post.id)||!known.has(post.category))throw new Error('文章标识或分类不正确。');
   ids.add(post.id);
   if(!string(post.title,160)||!post.title.trim()||!string(post.date,10)||!/^\d{4}-\d{2}-\d{2}$/.test(post.date)||Number.isNaN(Date.parse(post.date+'T00:00:00Z'))||new Date(post.date+'T00:00:00Z').toISOString().slice(0,10)!==post.date)throw new Error('文章标题或日期不正确。');
   if(!string(post.excerpt,500)||!Array.isArray(post.tags)||post.tags.length>20||post.tags.some(tag=>!string(tag,40)||!tag.trim()))throw new Error('文章摘要或标签不正确。');
   const normalized={id:post.id,category:post.category,title:post.title,date:post.date,tags:[...new Set(post.tags)],excerpt:post.excerpt};
   if(post.markdown!==undefined){if(!string(post.markdown,500000))throw new Error('文章正文过长或格式不正确。');normalized.markdown=post.markdown;}
   else{
    if(!Array.isArray(post.body)||post.body.length>200||post.body.some(section=>!plain(section)||!string(section.heading,240)||!string(section.text,100000)))throw new Error('文章正文格式不正确。');
    normalized.body=post.body.map(({heading,text})=>({heading,text}));
   }
   if(post.demo===true)normalized.demo=true;
   if(post.pinned===true)normalized.pinned=true;
   if(string(post.status,160))normalized.status=post.status;
   if(string(post.updatedAt,40)&&!Number.isNaN(Date.parse(post.updatedAt)))normalized.updatedAt=post.updatedAt;
   if(post.cover!==undefined){if(!string(post.cover,220)||(post.cover&&!uploadPath(post.cover)))throw new Error('文章封面路径无效。');normalized.cover=post.cover;}
   return normalized;
  });
  return {version:1,revision:manifest.revision,posts};
 }
 window.BlogArticle=Object.freeze({toMarkdown,renderMarkdown,excerpt,validateManifest,imageUrl});
})();
