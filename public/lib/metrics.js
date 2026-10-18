/* Own-site anonymous counts. Home scene changes do not create extra page views. */
(() => {
 'use strict';
 function browserId(){try{let id=localStorage.getItem('incloing-visitor-v1');if(!/^[a-f0-9]{64}$/.test(id||'')){id=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');localStorage.setItem('incloing-visitor-v1',id);}return id;}catch{return '';}}
 const listeners=new Set(),preview=['localhost','127.0.0.1'].includes(location.hostname);let state={views:null,visitors:null,status:'loading'},lastRoute=null,queue=Promise.resolve();
 const get=()=>({...state}),update=value=>{state={...state,...value};for(const fn of listeners){try{fn(get());}catch{}}};
 async function read(){try{const response=await fetch(window.IncloingRuntime.api('/api/metrics'),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();const result=await response.json();if(!Number.isSafeInteger(result.views)||!Number.isSafeInteger(result.visitors))throw new Error();update({...result,status:'ready'});}catch{if(state.views===null)update({status:'unavailable'});}}
 function track(route){if(route===lastRoute)return;lastRoute=route;queue=queue.then(async()=>{if(!preview){try{await fetch(window.IncloingRuntime.api('/api/metrics/view'),{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:crypto.randomUUID(),visitor:browserId()}),signal:AbortSignal.timeout(10000)});}catch{}}await read();});}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void read();});
 window.IncloingMetrics=Object.freeze({get,track,retry:read,subscribe(fn){listeners.add(fn);fn(get());return ()=>listeners.delete(fn);}});
})();
