/* Category navigation blends the old scene into the new reading collection. */
(() => {
 'use strict';
 const main=document.getElementById('main'),root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const categories=new Set(['notes','projects','life']),effects=new Set();
 let serial=0,active=null,oldBackdrop=null;
 const category=hash=>categories.has(String(hash).replace(/^#\/?/,'').split('/')[0]);
 function clearEffects(){for(const effect of effects)effect.cancel();effects.clear();oldBackdrop?.remove();oldBackdrop=null;}
 function stop(){serial++;active?.view?.skipTransition();active=null;root.classList.remove('category-changing');clearEffects();}
 function animate(element,frames,options){
  if(!element)return null;const effect=element.animate(frames,options);effects.add(effect);
  effect.finished.then(()=>effects.delete(effect),()=>effects.delete(effect));return effect;
 }
 function enter(){
  if(active?.kind==='native')return;
  // Keep a fading old background, but discard animations on replaced content.
  for(const effect of effects)if(effect.effect?.target!==oldBackdrop){effect.cancel();effects.delete(effect);}
  const stage=main.querySelector('.collection-stage');if(!stage||reduced.matches)return;
  const options={duration:620,easing:'cubic-bezier(.22,1,.36,1)'},scenes=[...stage.querySelectorAll('.story-scene')],scene=scenes.find(el=>{const r=el.getBoundingClientRect();return r.top<=innerHeight*.6&&r.bottom>=innerHeight*.4;})||scenes[0];
  animate(stage.querySelector('.collection-tools'),[{opacity:0,translate:'0 -10px'},{opacity:1,translate:'0 0'}],{...options,duration:450});
  animate(scene?.querySelector('.story-card,.story-empty'),[{opacity:0,transform:'translateY(28px) scale(.975)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}],options);
  animate(scene?.querySelector('.story-hint'),[{opacity:0},{opacity:1}],{...options,delay:100,fill:'backwards'});
 }
 function rememberBackdrop(){
  const backdrop=document.getElementById('page-backdrop');if(!backdrop)return;
  const layer=backdrop.cloneNode(false);layer.removeAttribute('id');layer.removeAttribute('hidden');layer.classList.add('category-old-backdrop');
  if(backdrop.hidden||getComputedStyle(backdrop).display==='none'){
   const visible=[...main.querySelectorAll('.category-section,.hero,.about-section')].find(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight/2&&r.bottom>innerHeight/2;});
   const image=visible?.querySelector('.category-art,.hero-bg');
   if(!image)return;layer.style.backgroundImage=`linear-gradient(#f8f9f5b8,#f8f9f5b8),url("${image.currentSrc||image.src}")`;
  }
  backdrop.after(layer);oldBackdrop=layer;
 }
 async function fallback(state,update){
  rememberBackdrop();
  const outgoing=animate(main,[{opacity:1},{opacity:0}],{duration:130,easing:'ease-out',fill:'forwards'});
  await outgoing?.finished.catch(()=>{});if(active!==state)return;
  outgoing?.cancel();state.applied=true;update();
  const layer=oldBackdrop;
  if(layer){const fade=animate(layer,[{opacity:1},{opacity:0}],{duration:580,easing:'ease-out',fill:'forwards'});fade.finished.then(()=>{layer.remove();if(oldBackdrop===layer)oldBackdrop=null;},()=>{});}
  if(active===state)active=null;
 }
 function go(hash,update){
  if(active?.hash===hash)return;
  stop();
  if(!category(hash)||reduced.matches){update();return;}
  const state={id:serial,hash,kind:'fallback',view:null,applied:false};active=state;
  if(typeof document.startViewTransition==='function'){
   state.kind='native';root.classList.add('category-changing');
   try{
    state.view=document.startViewTransition(async()=>{
     if(active!==state)return;state.applied=true;update();
     const image=main.querySelector('.story-card img');
     if(image&&!image.complete)await Promise.race([image.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,140))]);
    });
    state.view.ready.catch(()=>{if(active===state&&state.applied){state.kind='fallback';enter();}});
    state.view.finished.then(()=>{if(active===state){active=null;root.classList.remove('category-changing');}},()=>{if(active===state){active=null;root.classList.remove('category-changing');}});
    return;
   }catch{root.classList.remove('category-changing');state.kind='fallback';}
  }
  fallback(state,update);
 }
 function interrupt(){if(main.querySelector('.collection-stage')){active?.view?.skipTransition();clearEffects();}}
 document.addEventListener('wheel',interrupt,{passive:true});document.addEventListener('touchstart',interrupt,{passive:true});
 reduced.addEventListener('change',()=>{if(reduced.matches){active?.view?.skipTransition();clearEffects();}});
 window.IncloingCategoryMotion=Object.freeze({go,enter,stop});
})();
