/* Password verification and sessions are enforced by the server. */
(() => {
 'use strict';
 const form=document.getElementById('unlock-form'),input=document.getElementById('writer-password'),button=document.getElementById('unlock-button'),error=document.getElementById('unlock-error');let busy=false;
 async function open(csrf){
  window.BlogWriter=await window.BlogServer.connect(csrf);
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./admin.js?v=reading-20261018-r2';script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('后台载入失败，请刷新重试。'));};document.head.append(script);});
  const shell=document.getElementById('writer-shell');shell.hidden=false;shell.inert=false;document.getElementById('writer-lock').remove();
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;busy=true;button.disabled=true;error.textContent='';let password=input.value;input.value='';
  try{
   const pending=fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password}),signal:AbortSignal.timeout(15000)});password='';
   const response=await pending,result=await response.json();if(!response.ok)throw new Error(result.error||'登录未完成。');button.textContent='正在打开…';await open(result.csrf);
  }catch(cause){password='';error.textContent=cause.message||'网络未连接，请重试。';button.textContent='登录写作空间';input.focus();}finally{busy=false;button.disabled=false;}
 });
 busy=true;button.disabled=true;
 fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000)}).then(async response=>{if(response.ok){const result=await response.json();await open(result.csrf);}else if(response.status!==401)error.textContent='网站正在准备，请稍后登录。';}).catch(()=>{error.textContent='暂时无法连接服务器，请重试。';}).finally(()=>{busy=false;button.disabled=false;});
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
})();
