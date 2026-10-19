/* Own-site anonymous counts. Home scene changes do not create extra page views. */
(() => {
 'use strict';
 function browserId(){try{let id=localStorage.getItem('incloing-visitor-v1');if(!/^[a-f0-9]{64}$/.test(id||'')){id=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');localStorage.setItem('incloing-visitor-v1',id);}return id;}catch{return '';}}
 const listeners=new Set(),preview=['localhost','127.0.0.1'].includes(location.hostname);let state={views:null,visitors:null,status:'loading'},lastRoute=null,queue=Promise.resolve(),internalLeave=false,visitSent=false;
 const get=()=>({...state}),update=value=>{state={...state,...value};for(const fn of listeners){try{fn(get());}catch{}}};
 async function read(){try{const response=await fetch(window.IncloingRuntime.api('/api/metrics'),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();const result=await response.json();if(!Number.isSafeInteger(result.views)||!Number.isSafeInteger(result.visitors))throw new Error();update({...result,status:'ready'});}catch{if(state.views===null)update({status:'unavailable'});}}
 const visitKey='incloing-visit-v2';let eventId;
 function begin(reuse=false){try{eventId=reuse?sessionStorage.getItem(visitKey):null;}catch{}eventId||=crypto.randomUUID();try{sessionStorage.setItem(visitKey,eventId);}catch{}visitSent=false;}
 const navigation=performance.getEntriesByType('navigation')[0];
 let fromSite=false;try{const ref=new URL(document.referrer);fromSite=ref.origin===location.origin&&ref.pathname.startsWith(window.IncloingRuntime?.mirror?'/Blog/':'/');}catch{}
 begin(navigation?.type==='reload'||(navigation?.type!=='back_forward'&&fromSite));
 function track(route){
  lastRoute=route;const id=eventId;
  queue=queue.then(async()=>{
   if(!preview&&!visitSent&&id===eventId){try{const response=await fetch(window.IncloingRuntime.api('/api/metrics/view'),{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:id,visitor:browserId()}),signal:AbortSignal.timeout(10000)});if(response.ok&&id===eventId)visitSent=true;}catch{}}
   await read();
  });
 }
 document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a||a.target==='_blank'||a.download||event.ctrlKey||event.metaKey)return;try{const target=new URL(a.href);internalLeave=target.origin===location.origin&&(target.pathname!==location.pathname||target.search!==location.search);}catch{internalLeave=false;}},true);
 window.addEventListener('pageshow',event=>{if(event.persisted){if(!internalLeave)begin();internalLeave=false;track(lastRoute||location.hash||'#/');}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void read();});
 window.IncloingMetrics=Object.freeze({get,track,retry:read,subscribe(fn){listeners.add(fn);fn(get());return ()=>listeners.delete(fn);}});
})();
