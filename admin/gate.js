/* Entry privacy lock. GitHub separately authenticates the owner before any write. */
(() => {
 'use strict';
 const saltHex='fbdc92b47a21ebd64eb9a02347d0a747',expected='7cb98149ad350a3594d45f7d22165a1bbe105f09953e410e117581431c38ae0b';
 const form=document.getElementById('unlock-form'),input=document.getElementById('writer-password'),button=document.getElementById('unlock-button'),error=document.getElementById('unlock-error');
 let attempts=0,cooldown=0,loading=false;
 const bytes=hex=>Uint8Array.from(hex.match(/../g),part=>parseInt(part,16));
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(loading)return;
  if(Date.now()<cooldown){error.textContent='请稍候几秒，再试一次。';return;}
  loading=true;button.disabled=true;error.textContent='';
  let password=input.value;input.value='';
  try{
   if(!window.isSecureContext||!crypto.subtle)throw new Error('请通过 HTTPS 打开写作后台。');
   const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);password='';
   const result=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes(saltHex),iterations:210000,hash:'SHA-256'},key,256));
   const wanted=bytes(expected);let mismatch=0;for(let i=0;i<wanted.length;i++)mismatch|=result[i]^wanted[i];result.fill(0);wanted.fill(0);
   if(mismatch){attempts++;if(attempts>=5)cooldown=Date.now()+10000;throw new Error('密码不正确，请重新输入。');}
   button.textContent='正在打开…';
   const script=document.createElement('script');script.src='./admin.js?v=light-20261017-r13';
   await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('后台载入失败，请刷新后重试。'));};document.head.append(script);});
   const shell=document.getElementById('writer-shell');shell.hidden=false;shell.inert=false;document.getElementById('writer-lock').remove();
   document.getElementById('title').focus({preventScroll:true});
  }catch(cause){password='';error.textContent=cause.message;button.textContent='解锁写作空间';input.focus();}
  finally{loading=false;button.disabled=false;}
 });
 // No password or unlock flag is persisted. Reopening the page requires unlocking.
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
})();
