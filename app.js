(() => {
 'use strict';
 const blog=window.BLOG, main=document.querySelector('#main'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=n=>`<span class="mi" aria-hidden="true">${n}</span>`;
 const art={notes:'cloud',projects:'liquid',life:'moss'}, cat=id=>blog.categories.find(c=>c.id===id), cover=id=>`./assets/google-${art[id]||'cloud'}.webp`;
 const sorted=()=>[...blog.posts].sort((a,b)=>b.date.localeCompare(a.date));
 const notice=`<p class="notice">${icon('info')}<span>当前文章与项目为示例，后续会替换成我的真实记录。</span></p>`;
 const crumbs=title=>`<div class="breadcrumbs"><a href="#/">首页</a>${icon('chevron_right')}<span>${esc(title)}</span></div>`;
 const meta=p=>`<div class="post-meta"><span>${esc(cat(p.category)?.title)}</span><span>·</span><time datetime="${esc(p.date)}">${esc(p.date.replaceAll('-','.'))}</time>${p.demo?'<span class="sample">示例</span>':''}</div>`;
 const tags=p=>`<div class="tags">${p.tags.map(t=>`<span># ${esc(t)}</span>`).join('')}</div>`;
 const row=(p,i)=>`<a class="post-row" href="#/post/${encodeURIComponent(p.id)}"><span class="post-number">${String(i+1).padStart(2,'0')}</span><div class="post-copy">${meta(p)}<h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p>${tags(p)}</div>${icon('arrow_outward').replace('class="mi"','class="mi post-arrow"')}</a>`;
 const qqIcon='<svg class="qq-icon" viewBox="0 0 24 26" aria-hidden="true"><path d="M7 10C5 4 8 2 12 2s7 2 5 8c2 2 3 5 3 8l-2-1c1 3-2 5-6 5s-7-2-6-5l-2 1c0-3 1-6 3-8Z"/><path d="M8 12c2 1 6 1 8 0M8 22l-2 2h5m5-2 2 2h-5M10 7h.01M14 7h.01M11 10h2"/></svg>';
 let observer,typingTimer,bootReady=false,currentRoute='',lockedScroll=null,scrollFrame=0,saveTimer=0,routeToken=0,activeSection='',sectionScrollActive=false,sectionScrollTarget=0,sectionScrollTimer;
 const homeSections=['top','intro','category-notes','category-projects','category-life'];
 let pageLocked=false,wheelGesture=false,wheelGestureTimer,wheelTotal=0,touchGesture=null,touchHeld=false;
 const editing=target=>target.closest('input,textarea,select,[contenteditable="true"]');
 function homePaging(){return Boolean(main.querySelector('.hero'))&&!document.querySelector('dialog[open]');}
 function releasePageLock(){if(!sectionScrollActive&&!wheelGesture&&!touchHeld){pageLocked=false;wheelTotal=0;}}
 function startSectionScroll(top){
  cancelSectionScroll();sectionScrollTarget=top;
  sectionScrollActive=!reduced.matches&&Math.abs(window.scrollY-top)>2;
  if(sectionScrollActive)sectionScrollTimer=setTimeout(()=>{sectionScrollActive=false;releasePageLock();},2500);
  window.scrollTo({top,behavior:reduced.matches?'instant':'smooth'});
  if(!sectionScrollActive)releasePageLock();
 }
 function homeStops(){
  const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),stops=[];
  for(const id of homeSections){const el=id==='top'?main.querySelector('.hero'):document.getElementById(id);if(!el)continue;stops.push(Math.min(max,el.offsetTop));
   // A short landscape screen must still reach the profile and category buttons.
   const content=el.querySelector('.about-inner,.category-copy');
   if(content&&el.offsetHeight>window.innerHeight+48&&content.offsetTop+content.offsetHeight>window.innerHeight+2)stops.push(Math.min(max,el.offsetTop+el.offsetHeight-window.innerHeight));
  }
  stops.push(max);return [...new Set(stops.map(Math.round))].sort((a,b)=>a-b);
 }
 function pageHome(direction){
  if(pageLocked||!homePaging())return;
  const y=window.scrollY,stops=homeStops(),top=direction>0?stops.find(v=>v>y+8):[...stops].reverse().find(v=>v<y-8);
  if(top===undefined)return;
  pageLocked=true;startSectionScroll(top);
 }
 function fact(id,label,content,graphic){return `<div class="fact"><button class="icon-button fact-button glass" data-fact="${id}" aria-label="${esc(label)}" aria-expanded="false" aria-controls="fact-${id}">${graphic}</button><div class="fact-pop" id="fact-${id}" role="tooltip">${esc(content)}</div></div>`;}
 function about(standalone=false){
  const p=blog.profile;
  return `<section class="about-section ${standalone?'route-enter':''}" id="intro" aria-labelledby="about-heading"><div class="about-inner reveal"><p class="section-kicker">01 / A LITTLE ABOUT ME</p><div class="avatar-wrap glass"><img src="./assets/avatar.webp" alt="Incloing 的头像" width="96" height="96" loading="lazy"></div><h${standalone?'1':'2'} class="about-title" id="about-heading">你好，我是 <em>Incloing</em>。</h${standalone?'1':'2'}><p class="about-tagline">${esc(blog.tagline)}</p><div class="profile-facts" aria-label="个人资料，点击图标查看">${fact('school',p.school,p.school,icon('school'))}${fact('major',p.major,p.major,icon('psychology'))}${fact('qq',p.qq?'QQ：'+p.qq:'QQ，待补充',p.qq?'QQ · '+p.qq:'QQ · 待补充',qqIcon)}</div><div class="bio-placeholder">${p.bio?esc(p.bio):'关于我的故事，留在这里慢慢写。'}${p.bio?'':'<span>自我介绍待补充</span>'}</div>${standalone?`<a class="about-next" href="#/">回到首页 ${icon('arrow_forward')}</a>`:`<button class="text-button about-next" data-scroll="category-notes">继续探索 ${icon('arrow_downward')}</button>`}</div></section>`;
 }
 function home(){return `<section class="hero" aria-label="欢迎来到 Incloing"><picture><source media="(max-width:700px) and (orientation:portrait)" srcset="./assets/hero-pastel-mobile.webp"><img class="hero-bg" src="./assets/hero-pastel.webp" alt="浅粉与淡紫的天空、镜面圆环和绿色起伏的山丘" width="1672" height="941" fetchpriority="high"></picture><div class="hero-copy"><p class="hero-eyebrow">A LITTLE CORNER OF THE INTERNET</p><h1 class="poem" aria-label="${esc(blog.heroText)}"><span class="poem-reserve" aria-hidden="true">${esc(blog.heroText)}</span><span class="poem-typed" aria-hidden="true"><span id="typed-text"></span><i class="typing-cursor"></i></span></h1><p class="welcome">欢迎来到Incloing的个人主页</p></div><button class="scroll-cue text-button" data-scroll="intro"><span>向下，认识一下我</span><span class="icon-button glass">${icon('arrow_downward')}</span></button></section>${about()}${blog.categories.map((c,i)=>`<section class="category-section ${c.id}-scene" id="category-${c.id}" aria-labelledby="category-title-${c.id}"><img class="category-art" src="${cover(c.id)}" alt="${esc(c.artAlt)}" loading="lazy" width="1000" height="1000"><div class="category-copy glass reveal"><span class="section-no">0${i+2} / ${esc(c.english)}</span><h2 id="category-title-${c.id}">${esc(c.title)}</h2><p class="category-english">${esc(c.subtitle)}</p><p class="category-desc">${esc(c.description)}</p><a class="pill-link glass" href="#/${c.id}">进入${esc(c.title)} ${icon('arrow_forward')}</a></div><span class="section-edge" aria-hidden="true">THINK · BUILD · LIVE</span></section>`).join('')}`;}
 function collection(id){
  const c=cat(id),posts=sorted().filter(p=>p.category===id),allTags=[...new Set(posts.flatMap(p=>p.tags))];
  return `<section class="inner-page route-enter">${crumbs(c.title)}<div class="collection-header"><div><span class="collection-count">${esc(c.english)} / ${String(posts.length).padStart(2,'0')} 篇</span><h1>${esc(c.title)}</h1><p>${esc(c.description)}</p></div><img class="collection-cover" src="${cover(id)}" alt="${esc(c.artAlt)}" width="500" height="300"></div><div class="filters" aria-label="按主题筛选"><button class="filter-button" data-tag="" aria-pressed="true">全部</button>${allTags.map(t=>`<button class="filter-button" data-tag="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('')}</div><div id="post-list" aria-live="polite">${posts.map(row).join('')}</div>${notice}</section>`;
 }
 function article(id){
  const p=blog.posts.find(p=>p.id===id);if(!p)return missing();
  return `<article class="inner-page article route-enter">${crumbs(p.title)}${meta(p)}<h1>${esc(p.title)}</h1>${tags(p)}<p class="article-lead">${esc(p.excerpt)}</p><div class="article-body">${p.body.map(b=>`<section><h2>${esc(b.heading)}</h2><p>${esc(b.text)}</p></section>`).join('')}</div>${p.demo?notice:''}<div class="article-bottom"><a href="#/${p.category}">${icon('arrow_back')} 返回${esc(cat(p.category).title)}</a><a href="#/">回到首页 ${icon('arrow_outward')}</a></div></article>`;
 }
 function missing(){return `<section class="inner-page"><h1>这一页还在路上。</h1><p>暂时没有找到这篇内容。</p><a class="pill-link glass" href="#/">回到首页 ${icon('arrow_forward')}</a></section>`;}
 function routeKey(){return location.hash || '#/';}
 function rememberScroll(){if(lockedScroll===null)history.replaceState({...history.state,scroll:window.scrollY},'',location.href);}
 function navigate(hash){
  cancelSectionScroll();closeAll();rememberScroll();
  if(routeKey()===hash){window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});return;}
  history.pushState({scroll:0},'',hash);render(0,true);
 }
 function scrollHomeTo(id){
  cancelSectionScroll();closeAll();
  if(!main.querySelector('.hero')){rememberScroll();history.pushState({scroll:0},'','#/');render(0,false);}
  const target=id==='top'?main.querySelector('.hero'):document.getElementById(id);
  if(!target)return;
  startSectionScroll(target.offsetTop);
 }
 function cancelSectionScroll(){
  if(!sectionScrollActive)return;
  sectionScrollActive=false;clearTimeout(sectionScrollTimer);
  window.scrollTo({top:window.scrollY,left:window.scrollX,behavior:'instant'});
  releasePageLock();
 }
 function updateSectionNav(){
  const home=Boolean(main.querySelector('.hero'));
  let id=document.body.dataset.scene?'category-'+document.body.dataset.scene:(main.querySelector('#intro')?'intro':'top');
  if(home){const at=window.scrollY+Math.min(window.innerHeight*.35,250);id='top';for(const key of homeSections.slice(1)){const section=document.getElementById(key);if(section&&section.offsetTop<=at)id=key;}}
  const nav=document.querySelector('.section-nav');
  const link=nav.querySelector(`[data-home-section="${id}"]`)||nav.querySelector('a');
  if(activeSection!==id){
   activeSection=id;
   nav.querySelectorAll('a').forEach(a=>{a.classList.toggle('is-active',a===link);if(a===link)a.setAttribute('aria-current',home?'location':'page');else a.removeAttribute('aria-current');});
  }else if(link.getAttribute('aria-current')!==(home?'location':'page'))link.setAttribute('aria-current',home?'location':'page');
  const pill=nav.querySelector('.section-nav-indicator');pill.style.width=link.offsetWidth+'px';pill.style.transform=`translateX(${link.offsetLeft}px)`;
 }
 function render(top=0,focus=false){
  cancelSectionScroll();clearTimeout(wheelGestureTimer);pageLocked=false;wheelGesture=false;wheelTotal=0;touchGesture=null;touchHeld=false;clearTimeout(saveTimer);clearTimeout(typingTimer);observer?.disconnect();closeAll();routeToken++;
  const key=routeKey(),parts=key.replace(/^#\/?/,'').split('/');currentRoute=key;
  document.body.classList.toggle('home-paging',!parts[0]);
  let label='首页';
  if(!parts[0])main.innerHTML=home();
  else if(parts[0]==='about'){main.innerHTML=about(true);label='关于我';}
  else if(cat(parts[0])){main.innerHTML=collection(parts[0]);label=cat(parts[0]).title;}
  else if(parts[0]==='archive'){main.innerHTML=`<section class="inner-page">${crumbs('全部文章')}<h1>全部文章</h1><div id="post-list">${sorted().map(row).join('')}</div>${notice}</section>`;label='全部文章';}
  else if(parts[0]==='post'){let id='';try{id=decodeURIComponent(parts[1]||'')}catch{}main.innerHTML=article(id);label=blog.posts.find(p=>p.id===id)?.title||'未找到内容';}
  else main.innerHTML=missing();
  let scene=cat(parts[0])?.id;
  if(parts[0]==='post'){try{scene=blog.posts.find(p=>p.id===decodeURIComponent(parts[1]||''))?.category;}catch{}}
  const backdrop=document.querySelector('#page-backdrop');backdrop.hidden=!scene;
  backdrop.style.backgroundImage=scene?`linear-gradient(rgba(248,249,245,.72),rgba(248,249,245,.72)),url("${cover(scene)}")`:'';
  document.body.classList.toggle('has-scene',Boolean(scene));document.body.dataset.scene=scene||'';
  document.title=label==='首页'?'Incloing · 记录，探索，慢慢生长':`${label} · Incloing`;
  document.querySelectorAll('.drawer-nav a').forEach(a=>{if(a.getAttribute('href')==='#/'+(parts[0]==='post'?(blog.posts.find(p=>p.id===parts[1])?.category||''):parts[0]))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  window.scrollTo({top,behavior:'instant'});if(focus)main.focus({preventScroll:true});
  if(!reduced.matches && 'IntersectionObserver' in window){
   observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pending','scene-pending');if(e.target.classList.contains('category-section'))e.target.classList.add('scene-visible');observer.unobserve(e.target);}}),{threshold:.1,rootMargin:'0px 0px -5% 0px'});
   main.querySelectorAll('.reveal:not(.category-copy)').forEach(el=>{el.classList.add('pending');observer.observe(el);});
   main.querySelectorAll('.category-section').forEach(el=>{el.classList.add('scene-pending');observer.observe(el);});
  }
  if(bootReady)typePoem();
  document.querySelector('#live-announcement').textContent=label==='首页'?'已进入 Incloing 首页':`已进入${label}`;
  updateHeader();
 }
 function typePoem(){
  clearTimeout(typingTimer);const target=document.querySelector('#typed-text');if(!target)return;
  const token=routeToken,chars=Array.from(blog.heroText);let i=0;
  if(reduced.matches){target.textContent=blog.heroText;target.closest('.poem').classList.add('done');return;}
  function type(){if(token!==routeToken)return;target.textContent=chars.slice(0,i++).join('');if(i<=chars.length)typingTimer=setTimeout(type,chars[i-1]==='\n'?280:90);else target.closest('.poem').classList.add('done');}
  typingTimer=setTimeout(type,250);
 }
 function lockScroll(){if(lockedScroll!==null)return;lockedScroll=window.scrollY;document.body.classList.add('modal-open');Object.assign(document.body.style,{position:'fixed',top:`-${lockedScroll}px`,width:'100%'});}
 function unlockScroll(){if(lockedScroll===null||document.querySelector('dialog[open]'))return;const y=lockedScroll;lockedScroll=null;document.body.classList.remove('modal-open');Object.assign(document.body.style,{position:'',top:'',width:''});window.scrollTo({top:y,behavior:'instant'});document.querySelector('#menu-open').setAttribute('aria-expanded','false');}
 function closeAll(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());unlockScroll();}
 function openDialog(id){cancelSectionScroll();closeAll();const d=document.getElementById(id);lockScroll();try{d.showModal();}catch{unlockScroll();return;}if(id==='menu-dialog')document.querySelector('#menu-open').setAttribute('aria-expanded','true');if(id==='search-dialog'){search();document.querySelector('#search-input').focus();}}
 document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',unlockScroll);d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){d.close();unlockScroll();}});});
 document.querySelector('#menu-open').addEventListener('click',()=>openDialog('menu-dialog'));
 document.querySelector('#search-open').addEventListener('click',()=>openDialog('search-dialog'));
 document.querySelector('#credits-open').addEventListener('click',()=>openDialog('credits-dialog'));
 function glassClick(e){
  if(e.button>0)return;
  const control=e.target.closest('a,button,input,textarea,select,summary,[role="button"]');
  if(control?.matches(':disabled,[aria-disabled="true"]'))return;
  if(e.detail===0&&!control)return;
  const box=control?.getBoundingClientRect();
  const x=e.detail===0&&box?box.left+box.width/2:e.clientX,y=e.detail===0&&box?box.top+box.height/2:e.clientY;
  const root=document.querySelector('#glass-click-layer');
  function wave(host,left,top,local=false){
   while(host.querySelectorAll(':scope > .glass-click-wave').length>=6)host.querySelector(':scope > .glass-click-wave').remove();
   const el=document.createElement('span');el.className='glass-click-wave';el.setAttribute('aria-hidden','true');
   el.style.left=left+'px';el.style.top=top+'px';if(local)el.classList.add('dialog-glass-wave');
   host.append(el);setTimeout(()=>el.remove(),reduced.matches?180:760);
  }
  // This layer survives route changes, so article links flash as clearly as buttons.
  wave(root,x,y);
  const dialog=e.target.closest('dialog[open]')||document.querySelector('dialog[open]');
  if(dialog){const r=dialog.getBoundingClientRect();wave(dialog,x-r.left+dialog.scrollLeft-dialog.clientLeft,y-r.top+dialog.scrollTop-dialog.clientTop,true);}
  if(control){control.classList.add('glass-pressed');setTimeout(()=>control.classList.remove('glass-pressed'),reduced.matches?180:420);}
 }
 document.addEventListener('click',glassClick);
 document.addEventListener('click',e=>{
  const closer=e.target.closest('[data-close]');if(closer){document.getElementById(closer.dataset.close).close();unlockScroll();return;}
  const sectionLink=e.target.closest('[data-home-section]');if(sectionLink&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&e.button===0){e.preventDefault();scrollHomeTo(sectionLink.dataset.homeSection);return;}
  const scroll=e.target.closest('[data-scroll]');if(scroll){scrollHomeTo(scroll.dataset.scroll);return;}
  const link=e.target.closest('a[href^="#/"]');if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&e.button===0){e.preventDefault();navigate(link.getAttribute('href'));return;}
  const factButton=e.target.closest('[data-fact]');if(factButton){const expanded=factButton.getAttribute('aria-expanded')==='true';document.querySelectorAll('[data-fact]').forEach(b=>b.setAttribute('aria-expanded','false'));factButton.setAttribute('aria-expanded',String(!expanded));return;}
  if(!e.target.closest('.fact'))document.querySelectorAll('[data-fact]').forEach(b=>b.setAttribute('aria-expanded','false'));
  const filter=e.target.closest('[data-tag]');if(filter){const id=routeKey().slice(2),tag=filter.dataset.tag;document.querySelectorAll('[data-tag]').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));document.querySelector('#post-list').innerHTML=sorted().filter(p=>p.category===id&&(!tag||p.tags.includes(tag))).map(row).join('');}
 });
 function search(){const q=document.querySelector('#search-input').value.trim().toLocaleLowerCase(),results=sorted().filter(p=>!q||[p.title,p.excerpt,...p.tags,...p.body.map(b=>b.heading+' '+b.text)].join(' ').toLocaleLowerCase().includes(q));document.querySelector('#search-results').innerHTML=results.length?results.map(p=>`<a class="search-result" href="#/post/${encodeURIComponent(p.id)}"><span>${esc(cat(p.category).title)} · ${esc(p.date)}${p.demo?' · 示例':''}</span><strong>${esc(p.title)}</strong></a>`).join(''):`<p class="search-empty">换个关键词试试，还没找到相关内容。</p>`;}
 document.querySelector('#search-input').addEventListener('input',search);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('[data-fact]').forEach(b=>b.setAttribute('aria-expanded','false'));if(document.querySelector('dialog[open]')){e.preventDefault();closeAll();}return;}if(((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')||(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)&&!document.querySelector('dialog[open]'))){e.preventDefault();openDialog('search-dialog');}});
 function updateHeader(){if(lockedScroll===null){document.querySelector('.site-header').classList.toggle('scrolled',window.scrollY>80||!document.querySelector('.hero'));updateSectionNav();}scrollFrame=0;}
 window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateHeader);clearTimeout(saveTimer);saveTimer=setTimeout(rememberScroll,180);},{passive:true});
 // Homepage gestures advance one scene. Lists, articles and dialogs keep native scroll.
 window.addEventListener('wheel',e=>{
  if(!homePaging()||e.ctrlKey||editing(e.target)||Math.abs(e.deltaX)>Math.abs(e.deltaY)){cancelSectionScroll();return;}
  if(!e.deltaY)return;
  if(e.cancelable)e.preventDefault();
  wheelGesture=true;clearTimeout(wheelGestureTimer);wheelGestureTimer=setTimeout(()=>{wheelGesture=false;releasePageLock();},220);
  if(pageLocked)return;
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1);
  if(wheelTotal&&Math.sign(wheelTotal)!==Math.sign(delta))wheelTotal=0;
  wheelTotal+=delta;if(Math.abs(wheelTotal)>=10)pageHome(Math.sign(wheelTotal));
 },{passive:false});
 window.addEventListener('pointerdown',cancelSectionScroll,{passive:true});
 window.addEventListener('touchstart',e=>{
  if(!homePaging()||editing(e.target)||e.touches.length!==1){touchGesture=null;touchHeld=false;return;}
  cancelSectionScroll();touchHeld=true;touchGesture={x:e.touches[0].clientX,y:e.touches[0].clientY,used:false};
 },{passive:true});
 window.addEventListener('touchmove',e=>{
  if(!touchGesture||!homePaging()||e.touches.length!==1)return;
  const dy=touchGesture.y-e.touches[0].clientY,dx=touchGesture.x-e.touches[0].clientX;
  if(touchGesture.used){if(e.cancelable)e.preventDefault();return;}
  if(Math.abs(dy)>=16&&Math.abs(dy)>Math.abs(dx)*1.15){if(e.cancelable)e.preventDefault();touchGesture.used=true;pageHome(Math.sign(dy));}
 },{passive:false});
 for(const event of ['touchend','touchcancel'])window.addEventListener(event,()=>{touchGesture=null;touchHeld=false;releasePageLock();},{passive:true});
 window.addEventListener('scrollend',()=>{if(Math.abs(window.scrollY-sectionScrollTarget)<2){sectionScrollActive=false;clearTimeout(sectionScrollTimer);releasePageLock();}},{passive:true});
 document.addEventListener('keydown',e=>{
  if(homePaging()&&!e.target.closest('a,button,input,textarea,select,[contenteditable="true"]')&&['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key)){
   e.preventDefault();if(!e.repeat)pageHome(['ArrowUp','PageUp'].includes(e.key)||(e.key===' '&&e.shiftKey)?-1:1);
  }else if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))cancelSectionScroll();
 });
 window.addEventListener('resize',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateHeader);},{passive:true});
 document.fonts.ready.then(()=>{activeSection='';updateHeader();});
 window.addEventListener('popstate',()=>render(history.state?.scroll||0,true));
 window.addEventListener('hashchange',()=>{if(routeKey()!==currentRoute)render(0,true);});
 reduced.addEventListener('change',()=>{main.querySelectorAll('.pending,.scene-pending').forEach(e=>e.classList.remove('pending','scene-pending'));if(reduced.matches)typePoem();});
 function uptime(){let seconds=Math.max(0,Math.floor((Date.now()-Date.parse(blog.startedAt))/1000));const days=Math.floor(seconds/86400);seconds%=86400;const hours=Math.floor(seconds/3600);seconds%=3600;document.querySelector('#uptime').textContent=`${days} 天 ${String(hours).padStart(2,'0')} 时 ${String(Math.floor(seconds/60)).padStart(2,'0')} 分 ${String(seconds%60).padStart(2,'0')} 秒`;}
 document.querySelector('#year').textContent=new Date().getFullYear();document.querySelector('.uptime').title='首次上线：'+new Date(blog.startedAt).toLocaleString('zh-CN');uptime();setInterval(uptime,1000);
 if('scrollRestoration' in history)history.scrollRestoration='manual';history.replaceState({scroll:0},'',location.href);render();
 const start=performance.now(),hero=document.querySelector('.hero-bg');
 Promise.race([Promise.allSettled([document.fonts.ready,hero?hero.decode():Promise.resolve()]),new Promise(resolve=>setTimeout(resolve,2200))]).then(()=>new Promise(resolve=>setTimeout(resolve,Math.max(0,(reduced.matches?0:500)-(performance.now()-start))))).then(()=>{clearTimeout(window.__bootFallback);const loader=document.querySelector('#boot-loader');loader?.classList.add('is-done');setTimeout(()=>loader?.remove(),reduced.matches?0:420);bootReady=true;typePoem();});
})();
