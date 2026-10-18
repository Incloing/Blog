/* Shared plain-text profile validation for the public page and the writer. */
(() => {
 'use strict';
 const fields={school:100,major:100,qq:12,bio:3000,rewardQr:220};
 function normalize(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('个人资料格式不正确。');
  const result={};
  for(const [key,max] of Object.entries(fields)){
   if(value[key]!==undefined&&typeof value[key]!=='string')throw new Error('个人资料只能填写文字。');
   result[key]=String(value[key]??'').replace(/\r\n?/g,'\n').trim();
   if(result[key].length>max)throw new Error((key==='bio'?'个人简介':key==='qq'?'QQ 号':'学校或专业')+'超过长度限制。');
  }
  if(result.qq&&!/^[1-9]\d{4,11}$/.test(result.qq))throw new Error('请填写有效的 QQ 号，或留空。');
  if(result.rewardQr&&!/^assets\/uploads\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)$/.test(result.rewardQr))throw new Error('收款码图片路径无效。');
  if(/(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})/.test(Object.values(result).join('\n')))throw new Error('个人资料中疑似包含 GitHub 令牌，请移除后再保存。');
  return result;
 }
 const defaults=normalize(window.BLOG?.profile||{});
 window.BlogProfile=Object.freeze({normalize,defaults:()=>({...defaults}),fromDocument:doc=>normalize(doc?.profile??defaults)});
})();
