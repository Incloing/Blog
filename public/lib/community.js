/* Same-origin visitor totals and a persistent on-site guestbook. */
(() => {
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const icon=name=>`<span class="mi" aria-hidden="true">${name}</span>`;
 let loadPromise=Promise.resolve();
 let unsubscribe,comments=[],cacheAt=0,loading=false,error='',previousPage=0,refreshTimer=0,returnTimer=0,visibilityObserver;
 const writeLink=()=>`<button class="pill-link glass" type="button" data-comment-open>写一条留言 ${icon('edit_note')}</button>`;
 const note='<p class="guestbook-note">留言会保留在这里，无需注册账号。谢谢你留下的一点回声。</p>';
 const actions=()=>`<div class="guestbook-actions">${writeLink()}<button type="button" class="text-button guestbook-refresh" data-community-refresh>${icon('refresh')} 刷新留言</button></div>`;
 const board=()=>'<div class="guestbook-scroll" data-guestbook-scroll tabindex="0" role="region" aria-label="留言内容，可上下滚动阅读"><div class="guestbook-list guestbook-full" data-guestbook-list="full" aria-live="polite"><p class="guestbook-state">正在打开留言簿…</p></div><div class="guestbook-more" data-guestbook-more></div></div>';
 function sections(){return `<section class="community-section visitors-section" id="visitors" aria-labelledby="visitors-title"><div class="community-card glass reveal"><p class="community-kicker">06 / PEOPLE &amp; MOMENTS</p><h2 id="visitors-title">有人来过，便有了回响。</h2><p class="community-subtitle">谢谢你，经过我的一小片互联网。</p><div class="visitor-totals"><div>${icon('group')}<strong data-metric="visitors">--</strong><span>访问用户总数</span></div><div>${icon('visibility')}<strong data-metric="views">--</strong><span>总浏览次数</span></div></div><p class="metrics-state" data-metrics-state role="status">正在读取访问统计…</p><p class="metrics-caption">自功能启用起累计，访客按浏览器匿名标识去重。</p></div></section><section class="community-section guestbook-section" id="guestbook" aria-labelledby="guestbook-title"><div class="community-card guestbook-card glass reveal"><p class="community-kicker">07 / LEAVE A LITTLE HELLO</p><h2 id="guestbook-title">留下一点回声。</h2><p class="community-subtitle">一个招呼，一点想法，都很欢迎。</p>${actions()}${board()}${note}</div><button type="button" class="text-button guestbook-continue" data-scroll="footer">继续向下 ${icon('arrow_downward')}</button></section>`;}
 function page(){return `<section class="inner-page community-page route-enter"><div class="breadcrumbs"><a href="#/">首页</a>${icon('chevron_right')}<span>留言板</span></div><p class="community-kicker">LEAVE A LITTLE HELLO</p><h1>留言板</h1><p class="community-subtitle">谢谢你的来访。把想说的话，留在这里。</p>${actions()}${note}${board()}</section>`;}
 function metricsUpdate(value=window.IncloingMetrics?.get?.()){
  const metrics=value||{};
  for(const field of ['visitors','views'])document.querySelectorAll(`[data-metric="${field}"]`).forEach(node=>{node.textContent=Number.isFinite(metrics[field])&&metrics[field]>=0?new Intl.NumberFormat('zh-CN').format(metrics[field]):'--';});
  const message=metrics.status==='ready'?'每一次相遇，都值得被记住。':metrics.status==='unavailable'?'统计暂时不可用，稍后再来看看。':'正在读取访问统计…';
  document.querySelectorAll('[data-metrics-state]').forEach(node=>{node.textContent=message;});
 }
 function messageHtml(comment){
  const text=comment.body;
  const author=esc(comment.name||'访客');
  return `<article class="guestbook-message" data-comment-id="${comment.id}"><div class="guestbook-message-meta"><strong>${author}</strong>${comment.owner?'<span class="guestbook-badge">站主</span>':''}${comment.pinned?'<span class="guestbook-badge guestbook-pin">置顶</span>':''}<time class="guestbook-date" datetime="${esc(comment.date)}">${esc(new Date(comment.date).toLocaleDateString('zh-CN'))}</time></div><p>${esc(text)}</p></article>`;
 }
 function paint(){
  const active=document.activeElement,readers=[...document.querySelectorAll('[data-guestbook-scroll]')].map(pane=>({pane,top:pane.scrollTop,focus:pane.contains(active),more:active?.matches('[data-community-more]'),href:active?.getAttribute('href')}));
  document.querySelectorAll('[data-guestbook-list]').forEach(host=>{
   const visible=comments;
   let html=visible.map(comment=>messageHtml(comment)).join('');
   if(!visible.length)html=`<p class="guestbook-state">${loading?'正在打开留言簿…':error?'留言暂时没有读取成功。':'这里还没有留言，来留下第一声问候吧。'}</p>`;
   if(error)html+=`<p class="guestbook-error" role="status">${esc(error)} <button class="text-button" type="button" data-community-refresh>重试</button></p>`;
   host.innerHTML=html;
  });
  document.querySelectorAll('[data-guestbook-more]').forEach(host=>{host.innerHTML=loading?'<p class="guestbook-state" role="status">正在读取留言…</p>':previousPage?'<button type="button" class="pill-link glass" data-community-more>再看一些留言 <span class="mi" aria-hidden="true">expand_more</span></button>':comments.length?'<p class="guestbook-state">已经读到最后一条留言了。</p>':'';});
  document.querySelectorAll('[data-community-refresh]').forEach(button=>{button.disabled=loading;});
  for(const reader of readers){reader.pane.scrollTop=reader.top;if(reader.focus&&!reader.pane.contains(document.activeElement)){const target=reader.more?reader.pane.querySelector('[data-community-more]'):[...reader.pane.querySelectorAll('a')].find(link=>link.getAttribute('href')===reader.href);(target||reader.pane).focus({preventScroll:true});}}
 }
 function normalized(list){
  if(!Array.isArray(list))throw new Error('留言格式不正确。');
  return list.filter(item=>item&&Number.isSafeInteger(item.id)&&item.id>0&&typeof item.body==='string'&&!Number.isNaN(Date.parse(item.created_at))).map(item=>({id:item.id,body:item.body.slice(0,66000),date:item.created_at,name:typeof item.name==='string'?item.name.slice(0,40):'访客',pinned:item.pinned===1||item.pinned===true,owner:item.is_owner===1||item.is_owner===true}));
 }
 async function load({more=false,force=false}={}){
  if(loading){if(force){await loadPromise;return load({force:true});}return;}if(!more&&!force&&Date.now()-cacheAt<60000){paint();return;}
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);loading=true;let complete;loadPromise=new Promise(resolve=>{complete=resolve;});error='';paint();
  try{
   const response=await fetch(window.IncloingRuntime.api('/api/comments'+(more&&previousPage?'?before='+encodeURIComponent(previousPage):'')),{cache:'no-store',signal:controller.signal});
   if(!response.ok)throw new Error('暂时无法读取留言，请稍后再试。');const result=await response.json();
   const merged=more?new Map(comments.map(comment=>[comment.id,comment])):new Map();normalized(result.comments).forEach(comment=>merged.set(comment.id,comment));
   comments=[...merged.values()].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.id-a.id);previousPage=result.next||0;cacheAt=Date.now();
  }catch(reason){error=reason.name==='AbortError'?'读取稍慢，可以再试一次。':reason.message||'暂时无法读取留言。';}
  finally{clearTimeout(timeout);loading=false;paint();complete();}
 }
 function mount(){
  unsubscribe?.();unsubscribe=undefined;
  clearTimeout(refreshTimer);clearTimeout(returnTimer);visibilityObserver?.disconnect();
  if(document.querySelector('[data-metric]')){
   metricsUpdate();
   if(window.IncloingMetrics?.subscribe)unsubscribe=window.IncloingMetrics.subscribe(metricsUpdate);
  }
  if(document.querySelector('[data-guestbook-list]')){
   paint();load();
   const section=document.querySelector('.guestbook-section,.community-page');
   if(section&&'IntersectionObserver' in window){visibilityObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))scheduleRefresh();else clearTimeout(refreshTimer);},{threshold:.05});visibilityObserver.observe(section);}
   scheduleRefresh();
  }
 }
 function boardVisible(){const section=document.querySelector('.guestbook-section,.community-page');if(!section||document.hidden||document.querySelector('dialog[open]'))return false;const rect=section.getBoundingClientRect();return rect.bottom>0&&rect.top<innerHeight;}
 function scheduleRefresh(){clearTimeout(refreshTimer);if(!boardVisible())return;refreshTimer=setTimeout(async()=>{if(boardVisible())await load({force:true});scheduleRefresh();},180000);}
 function refreshOnReturn(){clearTimeout(returnTimer);if(!boardVisible())return;returnTimer=setTimeout(()=>{if(boardVisible())load({force:true});scheduleRefresh();},500);}
 window.addEventListener('focus',refreshOnReturn);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(refreshTimer);clearTimeout(returnTimer);}else refreshOnReturn();});
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-community-refresh]'))load({force:true});
  if(event.target.closest('[data-community-more]'))load({more:true});
 });
 const form=document.getElementById('comment-form');let submitting=false;
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting)return;submitting=true;const button=document.getElementById('comment-submit'),status=document.getElementById('comment-status');button.disabled=true;status.textContent='正在保存留言…';
  try{
   const headers={'Content-Type':'application/json'};if(!window.IncloingRuntime.mirror){try{const session=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(5000)});if(session.ok)headers['X-CSRF-Token']=(await session.json()).csrf;}catch{}}
   const response=await fetch(window.IncloingRuntime.api('/api/comments'),{method:'POST',headers,credentials:'same-origin',body:JSON.stringify({name:document.getElementById('comment-name').value,message:document.getElementById('comment-message').value,website:document.getElementById('comment-website').value}),signal:AbortSignal.timeout(12000)}),result=await response.json();
   if(!response.ok)throw new Error(result.error||'留言未能保存，请稍后再试。');document.getElementById('comment-message').value='';status.textContent=result.comment?.is_owner?'站主留言已发布并置顶。':'留言已发布，谢谢你的来访。';await load({force:true});
  }catch(reason){status.textContent=reason.name==='TimeoutError'?'网络较慢，请先刷新留言查看是否已提交，再决定重试。':reason.message;}
  finally{submitting=false;button.disabled=false;}
 });
 window.IncloingCommunity=Object.freeze({sections,page,mount});
})();
