/*
 * Public anonymous visit counts, requested as JSON only. No remote script runs.
 * Service/API documentation: https://counterapi.com/#accessing-the-api
 * Counts start when this integration is enabled. No invented historical counts.
 */
(() => {
 'use strict';
 const NAMESPACE='incloing-blog-259068355-20261017';
 const ENDPOINT='https://counterapi.com/api/'+NAMESPACE+'/view/';
 const production=location.hostname==='incloing.github.io'&&location.pathname.startsWith('/Blog/')&&!location.pathname.startsWith('/Blog/admin/');
 const listeners=new Set(),queue=[];
 let state={visitors:null,views:null,status:production?'loading':'unavailable'},lastRoute=null,running=false;
 const get=()=>({...state});
 function update(next){state={...state,...next};for(const callback of listeners){try{callback(get());}catch{}}}
 function subscribe(callback){
  if(typeof callback!=='function')return ()=>{};
  listeners.add(callback);try{callback(get());}catch{}
  return ()=>listeners.delete(callback);
 }
 function routeName(route){
  const value=String(route||'#/');
  if(value==='#/'||value==='#')return 'home';
  const section=value.match(/^#\/(about|notes|projects|life|archive|guestbook)\/?$/);
  if(section)return section[1];
  const post=value.match(/^#\/post\/([a-z0-9][a-z0-9_-]{0,95})\/?$/);
  return post?'post-'+post[1]:null;
 }
 async function request(key,readOnly=false,unique=false){
  const params=new URLSearchParams({timeline:'total'});
  if(readOnly)params.set('readOnly','true');
  if(unique)params.set('unique','true');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(ENDPOINT+encodeURIComponent(key)+'?'+params.toString(),{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'strict-origin-when-cross-origin',signal:controller.signal});
   if(!response.ok)throw new Error('Counter temporarily unavailable');
   const contentType=response.headers.get('content-type')||'';
   if(!/^application\/json(?:\s*;|$)/i.test(contentType))throw new Error('Counter did not return JSON');
   const result=await response.json();
   // Ignore iconSvg, formatted text and all other remotely supplied markup.
   if(!Number.isSafeInteger(result?.value)||result.value<0)throw new Error('Invalid counter value');
   return result.value;
  }finally{clearTimeout(timeout);}
 }
 async function refresh(){
  const [views,visitors]=await Promise.all([request('any',true),request('any',true,true)]);
  update({views,visitors,status:'ready'});
 }
 async function drain(){
  if(running||!production)return;
  running=true;
  try{
   while(queue.length){
    const job=queue.shift();update({status:'loading'});
    try{
     // A route records one view. Home scene scrolling keeps the same #/ key.
     if(job.kind==='view')await request(job.key);
     await refresh();
    }catch{update({status:'unavailable'});}
   }
  }finally{running=false;}
 }
 function track(route){
  if(!production)return;
  const key=routeName(route);
  if(!key||key===lastRoute)return;
  lastRoute=key;queue.push({kind:'view',key});void drain();
 }
 function retry(){
  if(!production||queue.some(job=>job.kind==='read'))return;
  // A failed response might have recorded its view already: never replay writes.
  queue.push({kind:'read'});void drain();
 }
 window.IncloingMetrics=Object.freeze({track,subscribe,get,retry});
})();
