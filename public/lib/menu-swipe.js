/* Drag the open drawer left to dismiss; vertical scrolling stays native. */
(() => {
 'use strict';
 for(const drawer of document.querySelectorAll('dialog')){drawer.classList.add('swipe-dialog');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let gesture=null,animation=null,suppressClickUntil=0;
 const position=x=>`translate3d(${x}px,0,0)`;
 function clear(){
  const active=animation;animation=null;active?.cancel();gesture=null;
  drawer.classList.remove('menu-dragging','menu-settling');
  drawer.style.removeProperty('transform');drawer.style.removeProperty('--menu-swipe-veil');
 }
 function settle(state,dismiss){
  if(!drawer.open){clear();return;}
  gesture=null;
  if(drawer.hasPointerCapture(state.id))drawer.releasePointerCapture(state.id);
  drawer.classList.remove('menu-dragging');drawer.classList.add('menu-settling');
  const destination=dismiss?-state.width-24:0;
  if(reduced.matches){if(dismiss)drawer.close();clear();return;}
  const active=drawer.animate([{transform:position(state.offset)},{transform:position(destination)}],{duration:dismiss?220:180,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
  animation=active;
  active.finished.then(()=>{if(animation!==active)return;animation=null;if(dismiss&&drawer.open)drawer.close();active.cancel();clear();}).catch(()=>{});
 }
 drawer.addEventListener('pointerdown',event=>{
  if(!drawer.open||animation)return;
  if(event.isPrimary)suppressClickUntil=0;
  if(event.pointerType==='mouse'||event.target.closest('input,textarea,select,[contenteditable]'))return;
  if(!event.isPrimary){if(gesture?.mode==='dragging')settle(gesture,false);else gesture=null;return;}
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY,width:drawer.getBoundingClientRect().width,offset:0,mode:'pending'};
 },{passive:true});
 drawer.addEventListener('pointermove',event=>{
  const state=gesture;if(!state||state.id!==event.pointerId||state.mode==='native')return;
  const dx=event.clientX-state.x,dy=event.clientY-state.y;
  if(state.mode==='pending'){
   if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)*1.1){state.mode='native';return;}
   if(dx>12&&Math.abs(dx)>Math.abs(dy)*1.2){state.mode='native';return;}
   if(dx>=-12||Math.abs(dx)<=Math.abs(dy)*1.2)return;
   state.mode='dragging';drawer.classList.add('menu-dragging');drawer.setPointerCapture(event.pointerId);
  }
  if(event.cancelable)event.preventDefault();
  state.offset=Math.max(-state.width,Math.min(0,dx));drawer.style.transform=position(state.offset);
  drawer.style.setProperty('--menu-swipe-veil',String(1-Math.min(1,-state.offset/state.width)));
 },{passive:false});
 drawer.addEventListener('pointerup',event=>{
  const state=gesture;if(!state||state.id!==event.pointerId)return;
  gesture=null;if(state.mode!=='dragging')return;
  suppressClickUntil=performance.now()+450;
  settle(state,-state.offset>=Math.min(64,state.width*.18));
 });
 drawer.addEventListener('pointercancel',event=>{
  const state=gesture;if(!state||state.id!==event.pointerId)return;
  gesture=null;if(state.mode==='dragging'){suppressClickUntil=performance.now()+450;settle(state,false);}
 });
 drawer.addEventListener('click',event=>{
  if(performance.now()<suppressClickUntil&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 drawer.addEventListener('close',clear);
 }
})();
