(() => {
 'use strict';
 const blog=window.BLOG, main=document.querySelector('#main'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=n=>`<span class="mi" aria-hidden="true">${n}</span>`;
 const art={notes:'cloud',projects:'liquid',life:'moss'}, cat=id=>blog.categories.find(c=>c.id===id), cover=id=>`./assets/google-${art[id]||'cloud'}.webp`;
 const sorted=()=>[...blog.posts].sort((a,b)=>b.date.localeCompare(a.date));
 const notice=`<p class="notice">${icon('info')}<span>当前文章与项目为示例，后续会替换成我的真实记录。</span></p>`;
 const sampleNotice=posts=>posts.length>0&&posts.every(post=>post.demo)?notice:'';
 const crumbs=title=>`<div class="breadcrumbs"><a href="#/">首页</a>${icon('chevron_right')}<span>${esc(title)}</span></div>`;
 const meta=p=>`<div class="post-meta"><span>${esc(cat(p.category)?.title)}</span><span>·</span><time datetime="${esc(p.date)}">${esc(p.date.replaceAll('-','.'))}</time>${p.demo?'<span class="sample">示例</span>':''}</div>`;
 const tags=p=>`<div class="tags">${p.tags.map(t=>`<span># ${esc(t)}</span>`).join('')}</div>`;
 const row=(p,i)=>`<a class="post-row" href="#/post/${encodeURIComponent(p.id)}"><span class="post-number">${String(i+1).padStart(2,'0')}</span><div class="post-copy">${meta(p)}<h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p>${tags(p)}</div>${icon('arrow_outward').replace('class="mi"','class="mi post-arrow"')}</a>`;
 const qqIcon='<img class="qq-icon" src="./assets/qq-official.png" width="26" height="28" alt="" aria-hidden="true">';
 let observer,typingTimer,bootReady=false,currentRoute='',lockedScroll=null,scrollFrame=0,saveTimer=0,routeToken=0,activeSection='',sectionScrollActive=false,sectionScrollTarget=0,sectionScrollTimer;
 let contentState='loading',lastMetricRoute='',pendingFlip=null,flipAnimation=null;
 const homeSections=['top','intro','category-notes','category-projects','category-life','visitors','guestbook'];
 let pageAnchorId='top',pageQueue=[],pageDrainFrame=0,wheelConsumed=false,wheelPaneGesture=false,wheelGestureTimer,touchGesture=null;
 const editing=target=>target.closest('input,textarea,select,[contenteditable="true"]');
 const paneEdge=(pane,direction)=>direction>0?pane.scrollHeight-pane.clientHeight-pane.scrollTop<=3:pane.scrollTop<=3;
 function homePaging(){return Boolean(main.querySelector('.hero,.collection-stage'))&&!document.querySelector('dialog[open]');}
 function startSectionScroll(top,id){
  const direction=Math.sign(top-window.scrollY)||1;
  pendingFlip=id?{id,direction}:null;
  sectionScrollTarget=top;pageAnchorId=id||nearestHomePage(top).id;
  sectionScrollActive=!reduced.matches&&Math.abs(window.scrollY-top)>2;
  clearTimeout(sectionScrollTimer);
  if(sectionScrollActive)sectionScrollTimer=setTimeout(()=>{window.scrollTo({top:sectionScrollTarget,behavior:'instant'});finishSectionScroll();},2500);
  window.scrollTo({top,behavior:reduced.matches?'instant':'smooth'});
  playPendingFlip();
  if(!sectionScrollActive)drainPageQueue();
 }
 function playPendingFlip(){
  if(!pendingFlip)return;
  const {id,direction}=pendingFlip,section=document.getElementById(id),card=section?.querySelector('.category-copy,.community-card,.story-card');
  if(!card||reduced.matches){pendingFlip=null;return;}
  const box=card.getBoundingClientRect();
  if(box.top>window.innerHeight*.92||box.bottom<125)return;
  pendingFlip=null;flipAnimation?.cancel();
  card.style.transformOrigin=direction>0?'left center':'right center';
  flipAnimation=card.animate([
   {transform:`perspective(1100px) translateX(${direction>0?-22:22}px) rotateY(${direction>0?58:-58}deg)`,opacity:.12},
   {transform:'perspective(1100px) translateX(0) rotateY(0deg)',opacity:1}
  ],{duration:850,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
 }
 function homePages(){
  const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),pages=[];
  if(main.querySelector('.collection-stage'))return [...main.querySelectorAll('.story-scene[id]')].map(el=>({id:el.id,top:Math.min(max,el.getBoundingClientRect().top+window.scrollY)})).concat({id:'footer',top:max});
  for(const id of homeSections){const el=id==='top'?main.querySelector('.hero'):document.getElementById(id);if(el)pages.push({id,top:Math.min(max,el.offsetTop)});
  }
  pages.push({id:'footer',top:max});return pages;
 }
 function nearestHomePage(y=window.scrollY){return homePages().reduce((a,b)=>Math.abs(a.top-y)<=Math.abs(b.top-y)?a:b,{id:'top',top:0});}
 function finishSectionScroll(){sectionScrollActive=false;clearTimeout(sectionScrollTimer);playPendingFlip();drainPageQueue();}
 function drainPageQueue(){
  if(pageDrainFrame||sectionScrollActive||!homePaging()||!pageQueue.length)return;
  pageDrainFrame=requestAnimationFrame(()=>{
   pageDrainFrame=0;if(sectionScrollActive||!homePaging()||!pageQueue.length)return;
   const pages=homePages(),from=Math.max(0,pages.findIndex(p=>p.id===pageAnchorId)),direction=pageQueue.shift();
   const to=Math.max(0,Math.min(pages.length-1,from+direction));
   if(to===from){drainPageQueue();return;}
   // One gesture selects exactly one adjacent named scene, independent of distance.
   startSectionScroll(pages[to].top,pages[to].id);
  });
 }
 function pageHome(direction){
  if(!homePaging())return;
  if(!sectionScrollActive&&!pageQueue.length&&!pageDrainFrame)pageAnchorId=nearestHomePage().id;
  pageQueue.push(direction>0?1:-1);drainPageQueue();
 }
 function fact(id,label,content,graphic){return `<div class="fact"><button class="icon-button fact-button glass" data-fact="${id}" aria-label="${esc(label)}" aria-expanded="false" aria-controls="fact-${id}">${graphic}</button><div class="fact-pop" id="fact-${id}" role="tooltip">${esc(content)}</div></div>`;}
 function bioHtml(standalone){
  const bio=blog.profile.bio;
  if(!bio)return '关于我的故事，留在这里慢慢写。<span>自我介绍待补充</span>';
  const short=!standalone&&(bio.length>60||bio.split('\n').length>3);
  const text=short?bio.slice(0,60).split('\n').slice(0,3).join('\n'):bio;
  return `<p class="bio-text">${esc(text)}${short?'…':''}</p>${short?'<a class="bio-more" href="#/about">阅读完整简介 ↗</a>':''}`;
 }
 function profileFacts(){const p=blog.profile;return fact('school',p.school||'学校，待补充',p.school||'学校 · 待补充',icon('school'))+fact('major',p.major||'专业，待补充',p.major||'专业 · 待补充',icon('psychology'))+fact('qq',p.qq?'QQ：'+p.qq:'QQ，待补充',p.qq?'QQ · '+p.qq:'QQ · 待补充',qqIcon);}
 function updateProfileView(){
  const intro=document.querySelector('#intro');if(!intro)return;
  intro.querySelector('.profile-facts').innerHTML=profileFacts();
  intro.querySelector('.bio-placeholder').innerHTML=bioHtml(intro.classList.contains('route-enter'));
 }
 function about(standalone=false){
  return `<section class="about-section ${standalone?'route-enter':''}" id="intro" aria-labelledby="about-heading"><div class="about-inner reveal"><p class="section-kicker">01 / A LITTLE ABOUT ME</p><div class="avatar-wrap glass"><img src="./assets/avatar.webp" alt="Incloing 的头像" width="96" height="96" loading="lazy"></div><h${standalone?'1':'2'} class="about-title" id="about-heading">你好，我是 <em>Incloing</em>。</h${standalone?'1':'2'}><p class="about-tagline">${esc(blog.tagline)}</p><div class="profile-facts" aria-label="个人资料，点击图标查看">${profileFacts()}</div><div class="bio-placeholder">${bioHtml(standalone)}</div>${standalone?`<a class="about-next" href="#/">回到首页 ${icon('arrow_forward')}</a>`:`<button class="text-button about-next" data-scroll="category-notes">继续探索 ${icon('arrow_downward')}</button>`}</div></section>`;
 }
 function home(){return `<section class="hero" aria-label="欢迎来到 Incloing"><picture><source media="(max-width:700px) and (orientation:portrait)" srcset="./assets/hero-pastel-mobile.webp"><img class="hero-bg" src="./assets/hero-pastel.webp" alt="浅粉与淡紫的天空、镜面圆环和绿色起伏的山丘" width="1672" height="941" fetchpriority="high"></picture><div class="hero-copy"><p class="hero-eyebrow">A LITTLE CORNER OF THE INTERNET</p><h1 class="poem" aria-label="${esc(blog.heroText)}"><span class="poem-reserve" aria-hidden="true">${esc(blog.heroText)}</span><span class="poem-typed" aria-hidden="true"><span id="typed-text"></span><i class="typing-cursor"></i></span></h1><p class="welcome">欢迎来到Incloing的个人主页</p></div><button class="scroll-cue text-button" data-scroll="intro"><span>向下，认识一下我</span><span class="icon-button glass">${icon('arrow_downward')}</span></button></section>${about()}${blog.categories.map((c,i)=>`<section class="category-section ${c.id}-scene" id="category-${c.id}" aria-labelledby="category-title-${c.id}"><img class="category-art" src="${cover(c.id)}" alt="${esc(c.artAlt)}" loading="lazy" width="1000" height="1000"><div class="category-copy glass reveal"><span class="section-no">0${i+2} / ${esc(c.english)}</span><h2 id="category-title-${c.id}">${esc(c.title)}</h2><p class="category-english">${esc(c.subtitle)}</p><p class="category-desc">${esc(c.description)}</p><a class="pill-link glass" href="#/${c.id}">进入${esc(c.title)} ${icon('arrow_forward')}</a></div><span class="section-edge" aria-hidden="true">THINK · BUILD · LIVE</span></section>`).join('')}${window.IncloingCommunity?.sections()||''}`;}
 function collection(id){
  const c=cat(id),posts=sorted().filter(p=>p.category===id),allTags=[...new Set(posts.flatMap(p=>p.tags))];
  return `<section class="inner-page route-enter">${crumbs(c.title)}<div class="collection-header"><div><span class="collection-count">${esc(c.english)} / ${String(posts.length).padStart(2,'0')} 篇</span><h1>${esc(c.title)}</h1><p>${esc(c.description)}</p></div><img class="collection-cover" src="${cover(id)}" alt="${esc(c.artAlt)}" width="500" height="300"></div><div class="filters" aria-label="按主题筛选"><button class="filter-button" data-tag="" aria-pressed="true">全部</button>${allTags.map(t=>`<button class="filter-button" data-tag="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('')}</div><div id="post-list" aria-live="polite">${posts.map(row).join('')}</div><div id="collection-notice">${sampleNotice(posts)}</div></section>`;
 }
 function article(id){
  const p=blog.posts.find(p=>p.id===id);if(!p)return missing();
  const markdown=typeof p.markdown==='string',body=markdown?(window.BlogArticle?.renderMarkdown(p.markdown)||`<p>${esc(p.markdown)}</p>`):(p.body||[]).map(b=>`<section><h2>${esc(b.heading)}</h2><p>${esc(b.text)}</p></section>`).join('');
  return `<article class="inner-page article route-enter">${crumbs(p.title)}${meta(p)}<h1>${esc(p.title)}</h1>${tags(p)}<p class="article-lead">${esc(p.excerpt)}</p><div class="article-body${markdown?' is-markdown':''}">${body}</div>${p.demo?notice:''}<div class="article-bottom"><a href="#/${p.category}">${icon('arrow_back')} 返回${esc(cat(p.category).title)}</a><a href="#/">回到首页 ${icon('arrow_outward')}</a></div></article>`;
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
  const returningHome=Boolean(main.querySelector('.hero'));
  cancelSectionScroll();closeAll();if(returningHome&&id==='top'&&bootReady)typePoem();
  if(!main.querySelector('.hero')){rememberScroll();history.pushState({scroll:0},'','#/');render(0,false);}
  const target=id==='top'?main.querySelector('.hero'):id==='footer'?document.querySelector('.site-footer'):document.getElementById(id);
  if(!target)return;
  startSectionScroll(Math.min(target.offsetTop,Math.max(0,document.documentElement.scrollHeight-window.innerHeight)),id);
 }
 function cancelSectionScroll(){
  pendingFlip=null;flipAnimation?.cancel();flipAnimation=null;
  pageQueue=[];cancelAnimationFrame(pageDrainFrame);pageDrainFrame=0;clearTimeout(sectionScrollTimer);
  if(sectionScrollActive){sectionScrollActive=false;window.scrollTo({top:window.scrollY,left:window.scrollX,behavior:'instant'});}
  if(main.querySelector('.hero'))pageAnchorId=nearestHomePage().id;
 }
 function updateSectionNav(){
  const home=Boolean(main.querySelector('.hero'));
  let id=document.body.dataset.scene?'category-'+document.body.dataset.scene:(main.querySelector('#intro')?'intro':'top');
  if(home){const at=window.scrollY+Math.min(window.innerHeight*.35,250);id='top';for(const key of homeSections.slice(1)){const section=document.getElementById(key);if(section&&section.offsetTop<=at)id=key;}}
  const nav=document.querySelector('.section-nav');
  const navId=['visitors','guestbook'].includes(id)?'category-life':id;
  const link=nav.querySelector(`[data-home-section="${navId}"]`)||nav.querySelector('a');
  if(activeSection!==id){
   activeSection=id;
   nav.querySelectorAll('a').forEach(a=>{a.classList.toggle('is-active',a===link);if(a===link)a.setAttribute('aria-current',home?'location':'page');else a.removeAttribute('aria-current');});
  }else if(link.getAttribute('aria-current')!==(home?'location':'page'))link.setAttribute('aria-current',home?'location':'page');
  const pill=nav.querySelector('.section-nav-indicator');pill.style.width=link.offsetWidth+'px';pill.style.transform=`translateX(${link.offsetLeft}px)`;
 }
 function render(top=0,focus=false){
  cancelSectionScroll();clearTimeout(wheelGestureTimer);pageAnchorId='top';wheelConsumed=false;wheelPaneGesture=false;touchGesture=null;clearTimeout(saveTimer);clearTimeout(typingTimer);window.IncloingPoems?.stop();observer?.disconnect();closeAll();routeToken++;
  const key=routeKey(),parts=key.replace(/^#\/?/,'').split('/');currentRoute=key;
  document.body.classList.toggle('home-paging',!parts[0]);
  const needsPosts=Boolean(cat(parts[0]))||['archive','post'].includes(parts[0]);
  let label='首页';
  if(needsPosts&&contentState==='loading'){main.innerHTML=`<section class="inner-page article-loading" aria-busy="true"><span class="content-spinner" aria-hidden="true"></span><h1>正在载入文章</h1><p>稍等一下，文字正在路上。</p></section>`;label=cat(parts[0])?.title||'载入文章';}
  else if(!parts[0])main.innerHTML=home();
  else if(parts[0]==='about'){main.innerHTML=about(true);label='关于我';}
  else if(parts[0]==='guestbook'&&window.IncloingCommunity){main.innerHTML=window.IncloingCommunity.page();label='留言板';}
  else if(cat(parts[0])){main.innerHTML=collection(parts[0]);label=cat(parts[0]).title;}
  else if(parts[0]==='archive'){main.innerHTML=`<section class="inner-page">${crumbs('全部文章')}<h1>全部文章</h1><div id="post-list">${sorted().map(row).join('')}</div>${sampleNotice(blog.posts)}</section>`;label='全部文章';}
  else if(parts[0]==='post'){let id='';try{id=decodeURIComponent(parts[1]||'')}catch{}main.innerHTML=article(id);label=blog.posts.find(p=>p.id===id)?.title||'未找到内容';}
  else main.innerHTML=missing();
  if(needsPosts&&contentState==='backup')main.querySelector('.inner-page')?.insertAdjacentHTML('afterbegin','<p class="content-status" role="status">暂时无法获取最新文章，当前显示本地备份。可以稍后刷新重试。</p>');
  let scene=cat(parts[0])?.id;
  if(parts[0]==='post'){try{scene=blog.posts.find(p=>p.id===decodeURIComponent(parts[1]||''))?.category;}catch{}}
  const backdrop=document.querySelector('#page-backdrop');backdrop.hidden=!scene;
  backdrop.style.backgroundImage=scene?`linear-gradient(rgba(248,249,245,.72),rgba(248,249,245,.72)),url("${cover(scene)}")`:'';
  document.body.classList.toggle('has-scene',Boolean(scene));document.body.dataset.scene=scene||'';
  document.title=label==='首页'?'Incloing · 记录，探索，慢慢生长':`${label} · Incloing`;
  document.querySelectorAll('.drawer-nav a').forEach(a=>{if(a.getAttribute('href')==='#/'+(parts[0]==='post'?(blog.posts.find(p=>p.id===parts[1])?.category||''):parts[0]))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  window.IncloingReading?.mount({onScene:id=>{const el=document.getElementById(id);if(el)startSectionScroll(Math.min(el.getBoundingClientRect().top+window.scrollY,document.documentElement.scrollHeight-innerHeight),id);}});
  window.scrollTo({top,behavior:'instant'});if(focus)main.focus({preventScroll:true});
  if(!reduced.matches && 'IntersectionObserver' in window){
   observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pending','scene-pending');if(e.target.classList.contains('category-section'))e.target.classList.add('scene-visible');observer.unobserve(e.target);}}),{threshold:.1,rootMargin:'0px 0px -5% 0px'});
   main.querySelectorAll('.reveal:not(.category-copy)').forEach(el=>{el.classList.add('pending');observer.observe(el);});
   main.querySelectorAll('.category-section').forEach(el=>{el.classList.add('scene-pending');observer.observe(el);});
  }
  if(bootReady)typePoem();
  document.querySelector('#live-announcement').textContent=label==='首页'?'已进入 Incloing 首页':`已进入${label}`;
  updateHeader();
  window.IncloingCommunity?.mount();
  if(lastMetricRoute!==key){lastMetricRoute=key;window.IncloingMetrics?.track(key);}
 }
 function typePoem(){const token=routeToken;window.IncloingPoems?.start(document.querySelector('#typed-text'),()=>token===routeToken);}
 function lockScroll(){if(lockedScroll!==null)return;lockedScroll=window.scrollY;document.body.classList.add('modal-open');Object.assign(document.body.style,{position:'fixed',top:`-${lockedScroll}px`,width:'100%'});}
 function unlockScroll(){if(lockedScroll===null||document.querySelector('dialog[open]'))return;const y=lockedScroll;lockedScroll=null;document.body.classList.remove('modal-open');Object.assign(document.body.style,{position:'',top:'',width:''});window.scrollTo({top:y,behavior:'instant'});document.querySelector('#menu-open').setAttribute('aria-expanded','false');}
 function closeAll(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());unlockScroll();}
 function openDialog(id){cancelSectionScroll();closeAll();const d=document.getElementById(id);lockScroll();try{d.showModal();}catch{unlockScroll();return;}if(id==='menu-dialog')document.querySelector('#menu-open').setAttribute('aria-expanded','true');if(id==='search-dialog'){search();document.querySelector('#search-input').focus();}}
 window.IncloingDialogs=Object.freeze({open:openDialog,close:closeAll});
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
  if(e.target.closest('#dino-open')){cancelSectionScroll();closeAll();window.IncloingDino?.open();return;}
  const closer=e.target.closest('[data-close]');if(closer){document.getElementById(closer.dataset.close).close();unlockScroll();return;}
  const pendingSocial=e.target.closest('[data-social-pending]');if(pendingSocial){document.querySelector('#social-status').textContent=pendingSocial.dataset.socialPending+'的个人主页链接待补充';return;}
  const sectionLink=e.target.closest('[data-home-section]');if(sectionLink&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&e.button===0){e.preventDefault();scrollHomeTo(sectionLink.dataset.homeSection);return;}
  if(e.target.closest('[data-comment-open]')){openDialog('comment-dialog');return;}
  const scroll=e.target.closest('[data-scroll]');if(scroll){scrollHomeTo(scroll.dataset.scroll);return;}
  const link=e.target.closest('a[href^="#/"]');if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&e.button===0){e.preventDefault();navigate(link.getAttribute('href'));return;}
  const factButton=e.target.closest('[data-fact]');if(factButton){const expanded=factButton.getAttribute('aria-expanded')==='true';document.querySelectorAll('[data-fact]').forEach(b=>b.setAttribute('aria-expanded','false'));factButton.setAttribute('aria-expanded',String(!expanded));return;}
  if(!e.target.closest('.fact'))document.querySelectorAll('[data-fact]').forEach(b=>b.setAttribute('aria-expanded','false'));
  const filter=e.target.closest('[data-tag]');if(filter){const id=routeKey().slice(2),tag=filter.dataset.tag,posts=sorted().filter(p=>p.category===id&&(!tag||p.tags.includes(tag)));document.querySelectorAll('[data-tag]').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));document.querySelector('#post-list').innerHTML=posts.map(row).join('');document.querySelector('#collection-notice').innerHTML=sampleNotice(posts);}
 });
 function search(){if(contentState==='loading'){document.querySelector('#search-results').innerHTML='<p class="search-empty" role="status">正在载入文章…</p>';return;}const q=document.querySelector('#search-input').value.trim().toLocaleLowerCase(),results=sorted().filter(p=>!q||[p.title,p.excerpt,...p.tags,p.markdown||'',...(p.body||[]).map(b=>b.heading+' '+b.text)].join(' ').toLocaleLowerCase().includes(q));document.querySelector('#search-results').innerHTML=results.length?results.map(p=>`<a class="search-result" href="#/post/${encodeURIComponent(p.id)}"><span>${esc(cat(p.category).title)} · ${esc(p.date)}${p.demo?' · 示例':''}</span><strong>${esc(p.title)}</strong></a>`).join(''):`<p class="search-empty">换个关键词试试，还没找到相关内容。</p>`;}
 document.querySelector('#search-input').addEventListener('input',search);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('[data-fact]').forEach(b=>b.setAttribute('aria-expanded','false'));if(document.querySelector('dialog[open]')){e.preventDefault();closeAll();}return;}if(((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')||(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)&&!document.querySelector('dialog[open]'))){e.preventDefault();openDialog('search-dialog');}});
 function updateHeader(){if(lockedScroll===null){document.querySelector('.site-header').classList.toggle('scrolled',window.scrollY>80||!document.querySelector('.hero'));updateSectionNav();playPendingFlip();}scrollFrame=0;}
 window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateHeader);clearTimeout(saveTimer);saveTimer=setTimeout(rememberScroll,180);},{passive:true});
 // Homepage gestures advance one scene. Lists, articles and dialogs keep native scroll.
 window.addEventListener('wheel',e=>{
  if(!homePaging()||e.ctrlKey||editing(e.target)){cancelSectionScroll();return;}
  const pane=e.target.closest('[data-guestbook-scroll]');
  if(!e.deltaY&&!wheelConsumed&&!wheelPaneGesture)return;
  clearTimeout(wheelGestureTimer);wheelGestureTimer=setTimeout(()=>{wheelConsumed=false;wheelPaneGesture=false;},650);
  if(wheelPaneGesture){if(!pane&&e.cancelable)e.preventDefault();return;}
  if(wheelConsumed){if(e.cancelable)e.preventDefault();return;}
  if(pane&&!paneEdge(pane,Math.sign(e.deltaY))){wheelPaneGesture=true;return;}
  if(e.cancelable)e.preventDefault();
  if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  wheelConsumed=true;pageHome(Math.sign(e.deltaY));
 },{passive:false});
 window.addEventListener('touchstart',e=>{
  if(!homePaging()||editing(e.target)||e.touches.length!==1){touchGesture=null;return;}
  const pane=e.target.closest('[data-guestbook-scroll]');
  touchGesture={x:e.touches[0].clientX,y:e.touches[0].clientY,used:false,native:false,pane,atStart:pane&&paneEdge(pane,-1),atEnd:pane&&paneEdge(pane,1)};
 },{passive:true});
 window.addEventListener('touchmove',e=>{
  if(!touchGesture||touchGesture.native||!homePaging()||e.touches.length!==1)return;
  const dy=touchGesture.y-e.touches[0].clientY,dx=touchGesture.x-e.touches[0].clientX;
  if(touchGesture.used){if(e.cancelable)e.preventDefault();return;}
  if(Math.abs(dy)>=8&&Math.abs(dy)>Math.abs(dx)*1.15){
   // A gesture that begins inside the list stays native until the finger lifts.
   // Only a fresh gesture at an edge can turn the surrounding homepage.
   if(touchGesture.pane&&!(dy>0?touchGesture.atEnd:touchGesture.atStart)){touchGesture.native=true;return;}
   if(e.cancelable)e.preventDefault();touchGesture.used=true;pageHome(Math.sign(dy));
  }
 },{passive:false});
 for(const event of ['touchend','touchcancel'])window.addEventListener(event,()=>{touchGesture=null;},{passive:true});
 window.addEventListener('scrollend',()=>{if(Math.abs(window.scrollY-sectionScrollTarget)<2)finishSectionScroll();},{passive:true});
 document.addEventListener('keydown',e=>{
  const pane=e.target.closest('[data-guestbook-scroll]');
  if(pane){
   if(homePaging()&&e.target===pane&&['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key)){
    const direction=['ArrowUp','PageUp'].includes(e.key)||(e.key===' '&&e.shiftKey)?-1:1;
    if(paneEdge(pane,direction)){e.preventDefault();if(!e.repeat)pageHome(direction);}
   }
   return;
  }
  if(homePaging()&&!e.target.closest('a,button,input,textarea,select,[contenteditable="true"],[data-guestbook-scroll]')&&['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key)){
   e.preventDefault();if(!e.repeat)pageHome(['ArrowUp','PageUp'].includes(e.key)||(e.key===' '&&e.shiftKey)?-1:1);
  }else if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))cancelSectionScroll();
 });
 window.addEventListener('resize',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateHeader);},{passive:true});
 document.fonts.ready.then(()=>{activeSection='';updateHeader();});
 window.addEventListener('popstate',()=>render(history.state?.scroll||0,true));
 window.addEventListener('hashchange',()=>{if(routeKey()!==currentRoute)render(0,true);});
 reduced.addEventListener('change',()=>{main.querySelectorAll('.pending,.scene-pending').forEach(e=>e.classList.remove('pending','scene-pending'));if(reduced.matches)typePoem();});
 function uptime(){let seconds=Math.max(0,Math.floor((Date.now()-Date.parse(blog.startedAt))/1000));const days=Math.floor(seconds/86400);seconds%=86400;const hours=Math.floor(seconds/3600);seconds%=3600;document.querySelector('#uptime').textContent=`${days} 天 ${String(hours).padStart(2,'0')} 时 ${String(Math.floor(seconds/60)).padStart(2,'0')} 分 ${String(seconds%60).padStart(2,'0')} 秒`;}
 document.querySelector('#social-links').innerHTML=(blog.social||[]).map(s=>{
  const graphic=`<img src="./assets/social/${esc(s.id)}.svg" width="22" height="22" alt="" loading="lazy"><span class="social-tooltip" aria-hidden="true">${esc(s.label)}</span>`;
  return /^https?:\/\//i.test(s.href)?`<a class="social-link glass" href="${esc(s.href)}" aria-label="${esc(s.label)}个人主页" target="_blank" rel="noopener noreferrer">${graphic}</a>`:`<button class="social-link glass" type="button" data-social-pending="${esc(s.label)}" aria-label="${esc(s.label)}个人主页，链接待补充">${graphic}</button>`;
 }).join('');
 document.querySelector('#year').textContent=new Date().getFullYear();document.querySelector('.uptime').title='首次上线：'+new Date(blog.startedAt).toLocaleString('zh-CN');uptime();setInterval(uptime,1000);
 async function loadPublishedPosts(){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch((window.IncloingRuntime?.content()||'./content/posts.json')+'?read='+Date.now().toString(36),{cache:'no-store',signal:controller.signal});
   if(!response.ok)throw new Error('Content unavailable');
   const text=await response.text();if(text.length>8000000)throw new Error('Content too large');
   const contentDoc=JSON.parse(text),manifest=window.BlogArticle.validateManifest(contentDoc,blog.categories);
   try{blog.profile=window.BlogProfile.fromDocument(contentDoc);updateProfileView();}catch{console.warn('个人简介格式暂不可用，已保留本地资料。');}
   blog.posts=manifest.posts;contentState='published';document.body.dataset.contentSource='published';
  }catch{
   contentState='backup';document.body.dataset.contentSource='backup';
   console.warn('文章暂时无法读取，请稍后刷新。');
  }finally{clearTimeout(timer);}
 }
 if('scrollRestoration' in history)history.scrollRestoration='manual';history.replaceState({scroll:0},'',location.href);
 const start=performance.now();render();
 window.__blogContentReady=loadPublishedPosts().then(()=>{
  const page=routeKey().replace(/^#\/?/,'').split('/')[0];
  if(cat(page)||['archive','post'].includes(page))render(lockedScroll??window.scrollY);
  if(document.querySelector('#search-dialog[open]'))search();
 });
 const hero=document.querySelector('.hero-bg');
 Promise.race([Promise.allSettled([document.fonts.ready,hero?hero.decode():Promise.resolve()]),new Promise(resolve=>setTimeout(resolve,2200))]).then(()=>new Promise(resolve=>setTimeout(resolve,Math.max(0,(reduced.matches?0:500)-(performance.now()-start))))).then(()=>{clearTimeout(window.__bootFallback);const loader=document.querySelector('#boot-loader');loader?.classList.add('is-done');setTimeout(()=>loader?.remove(),reduced.matches?0:420);bootReady=true;typePoem();});
})();
