/* Personal profile editor; only plain-text drafts are persisted locally. */
(() => {
 'use strict';
 window.BlogProfileEditor=Object.freeze({init({getClient,requestConnect}){
  const $=id=>document.getElementById(id),dialog=$('profile-dialog'),form=$('profile-form'),fields=['school','major','qq','bio','rewardQr'],key='incloing-profile-draft-v1';
  let base=null,busy=false,timer=0,dirty=false,releaseCheck=0,editVersion=0;
  const message=(text,error=false)=>{$('profile-status').textContent=text;$('profile-status').classList.toggle('is-error',error);};
  const value=()=>Object.fromEntries(fields.map(name=>[name,$('profile-'+name).value]));
  function fill(profile){for(const name of fields)$('profile-'+name).value=profile[name]||'';$('profile-count').textContent=$('profile-bio').value.length+' / 3000';rewardPreview();}
  function persist(){
   clearTimeout(timer);if(!dirty||!base)return;
   try{localStorage.setItem(key,JSON.stringify({profile:value(),baseProfile:base,updatedAt:new Date().toISOString()}));dirty=false;}
   catch{message('本机存储不可用，请先复制文字留存。',true);}
  }
  function localDraft(){try{const raw=JSON.parse(localStorage.getItem(key));if(raw?.profile&&raw.baseProfile){window.BlogProfile.normalize(raw.baseProfile);for(const name of fields)if(typeof raw.profile[name]!=='string'||raw.profile[name].length>(name==='bio'?3000:name==='rewardQr'?220:100))return null;return raw;}}catch{}return null;}
  function setBusy(value){busy=value;for(const item of form.elements)item.disabled=value;$('profile-close').disabled=value;$('profile-load').disabled=value;}
  async function loadRemote(){
   const client=getClient();if(!client){requestConnect();message('登录后台 后，可以载入线上简介；本机文字会保留。');return;}
   if(dirty||localDraft()){message('请先复制保留当前文字，再点击“确认载入”替换。');$('profile-load').textContent='确认载入线上简介';if(!$('profile-load').dataset.confirm){$('profile-load').dataset.confirm='true';return;}}
   setBusy(true);try{await client.refresh();base={...client.profile};fill(base);localStorage.removeItem(key);dirty=false;message('已载入线上个人简介。');}
   catch(error){message(error.message,true);}finally{setBusy(false);delete $('profile-load').dataset.confirm;$('profile-load').textContent='载入线上简介';}
  }
  async function open(){
   releaseCheck++;editVersion++;message('个人简介保存后，会同步到“关于我”。');
   const draft=localDraft();base=draft?.baseProfile||{...(getClient()?.profile||window.BlogProfile.defaults())};fill(draft?.profile||base);dirty=false;
   delete $('profile-load').dataset.confirm;$('profile-load').textContent='载入线上简介';dialog.showModal();
   if(draft){message('已恢复本机个人简介草稿。');return;}
   const version=editVersion;
   if(getClient())return;
   try{
    const response=await fetch('../content/posts.json?profile='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error();
    const profile=window.BlogProfile.fromDocument(await response.json());
    if(dialog.open&&version===editVersion&&!dirty){base=profile;fill(profile);}
   }catch{if(dialog.open&&version===editVersion)message('暂未读取到线上资料。可以先写，登录后台 后再核对保存。');}
  }
  async function watchRelease(profile,run){
   const end=Date.now()+90000;
   while(run===releaseCheck&&Date.now()<end){
    await new Promise(resolve=>setTimeout(resolve,5000));if(run!==releaseCheck)return;
    try{const response=await fetch('../content/posts.json?profile='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(8000)});if(response.ok&&JSON.stringify(window.BlogProfile.fromDocument(await response.json()))===JSON.stringify(profile)){message('个人简介已更新到网站。');return;}}catch{}
   }
   if(run===releaseCheck)message('已保存，稍后打开主页查看。');
  }
  form.addEventListener('input',()=>{editVersion++;dirty=true;releaseCheck++;clearTimeout(timer);timer=setTimeout(persist,450);$('profile-count').textContent=$('profile-bio').value.length+' / 3000';delete $('profile-load').dataset.confirm;$('profile-load').textContent='载入线上简介';});
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(busy)return;persist();let profile;
   try{profile=window.BlogProfile.normalize(value());}catch(error){message(error.message,true);return;}
   const client=getClient();if(!client){requestConnect();message('已保留本机文字。登录后台 后，再点击“保存并更新主页”。');return;}
   setBusy(true);const run=++releaseCheck;
   try{const result=await client.publishProfile(profile,base,text=>message(text));base=result.profile;fill(base);dirty=false;try{localStorage.removeItem(key);}catch{}message('已保存，网站正在更新…');void watchRelease(result.profile,run);}
   catch(error){dirty=true;persist();message(error.message,true);}
   finally{setBusy(false);}
  });
  function rewardPreview(){const source=window.BlogArticle.imageUrl($('profile-rewardQr').value),preview=$('profile-reward-preview');preview.hidden=!source;if(source)preview.src=source;else preview.removeAttribute('src');}
  $('profile-reward-upload').addEventListener('click',()=>$('profile-reward-file').click());
  $('profile-reward-clear').addEventListener('click',()=>{$('profile-rewardQr').value='';dirty=true;editVersion++;rewardPreview();persist();});
  $('profile-reward-file').addEventListener('change',async()=>{const file=$('profile-reward-file').files[0],client=getClient();if(!file||busy)return;if(!client){requestConnect();return;}setBusy(true);try{message('正在上传收款码…');const {blob}=await window.BlogMedia.prepareImage(file);$('profile-rewardQr').value=await client.uploadImage(blob,'profile');dirty=true;editVersion++;rewardPreview();persist();message('收款码已准备好，请点击保存个人简介使它生效。');}catch(error){message(error.message,true);}finally{setBusy(false);$('profile-reward-file').value='';}});
  $('profile-open').addEventListener('click',()=>void open());$('profile-load').addEventListener('click',()=>void loadRemote());
  $('profile-close').addEventListener('click',()=>{if(!busy){persist();dialog.close();}});
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();else persist();});dialog.addEventListener('close',()=>{persist();releaseCheck++;});
  dialog.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();event.stopPropagation();persist();message('个人简介草稿已保存在本机。');}},{capture:true});
  window.addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
 }});
})();
