/* Shared attachment rules. Uploaded files are downloaded, never executed as pages. */
(() => {
 'use strict';
 const extensions='pdf doc docx xls xlsx ppt pptx odt ods odp zip 7z rar tar gz txt md csv json yaml yml xml log py c cpp h hpp java js ts tsx jsx ipynb r rs go sql css'.split(' '),limit=10*1024*1024;
 const validPath=value=>typeof value==='string'&&/^assets\/attachments\/[a-z0-9][a-z0-9_-]{0,95}\/[a-zA-Z0-9_-]{8,96}\.[a-z0-9]+$/.test(value)&&extensions.includes(value.split('.').pop());
 const name=value=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f/\\]/g,'').trim().slice(0,180):'';
 function normalize(items){
  if(items===undefined)return [];
  if(!Array.isArray(items)||items.length>10)throw new Error('每篇文章最多添加 10 个附件。');
  const seen=new Set();return items.map(item=>{
   if(!item||!validPath(item.path)||!name(item.name)||name(item.name)!==item.name||item.name.split('.').pop().toLowerCase()!==item.path.split('.').pop()||!Number.isSafeInteger(item.size)||item.size<1||item.size>limit||seen.has(item.path))throw new Error('附件信息无效，单个文件最大支持 10MB。');
   seen.add(item.path);return {path:item.path,name:item.name,size:item.size};
  });
 }
 const size=n=>n>=1024*1024?(n/1024/1024).toFixed(1)+' MB':Math.max(1,Math.ceil(n/1024))+' KB';
 const base=typeof document==='object'?new URL('../',document.currentScript.src):null;
 const url=path=>validPath(path)?(globalThis.IncloingRuntime?.upload(path)||new URL(path,base).href):'';
 globalThis.BlogAttachments=Object.freeze({extensions,limit,validPath,name,normalize,size,url});
})();
