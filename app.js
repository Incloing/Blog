(() => {
  'use strict';
  const blog = window.BLOG;
  const main = document.querySelector('#main');
  const dialog = document.querySelector('#search-dialog');
  const searchInput = document.querySelector('#search-input');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = name => `<span class="mi" aria-hidden="true">${name}</span>`;
  const art = {notes:'gold', projects:'blue', life:'green'};
  const artAlt = {notes:'流动的琥珀色玻璃雕塑', projects:'蓝紫色的冰晶与液态金属层叠', life:'生长着青绿色苔藓的微型植物世界'};
  const image = id => `./assets/cover-${art[id] || 'gold'}.webp`;
  const category = id => blog.categories.find(cat => cat.id === id);
  const sorted = () => [...blog.posts].sort((a,b) => b.date.localeCompare(a.date));
  const tags = post => `<span class="tags">${post.tags.map(tag => `<span># ${escape(tag)}</span>`).join('')}</span>`;
  const meta = post => `<div class="post-meta"><span class="category-label">${escape(category(post.category)?.title || '')}</span><span>·</span><time datetime="${escape(post.date)}">${escape(post.date.replaceAll('-','.'))}</time>${post.demo?'<span class="sample">示例</span>':''}${post.pinned?`<span class="pin">${icon('keep')}置顶</span>`:''}</div>`;
  const row = (post,index) => `<a class="post-row" href="#/post/${encodeURIComponent(post.id)}"><span class="post-number">${String(index+1).padStart(2,'0')}</span><div>${meta(post)}<h3>${escape(post.title)}</h3><p>${escape(post.excerpt)}</p>${tags(post)}</div>${icon('arrow_outward').replace('class="mi"','class="mi post-arrow"')}</a>`;
  const notice = `<p class="notice">${icon('info')}<span>目前的文章与项目为内容示例，之后将替换为 Incloing 的真实记录。</span></p>`;
  const crumbs = title => `<div class="breadcrumbs"><a href="#/">首页</a>${icon('chevron_right')}<span>${escape(title)}</span></div>`;
  const topics = () => `<div class="about-topics">${blog.categories.map(cat => `<a href="#/${cat.id}">${escape(cat.title)}${icon('arrow_outward')}</a>`).join('')}</div>`;
  let lenis, observer, transition, visualQueued = false, firstRender = true, homeFilter = 'all';
  let heroMouseX = 0, heroMouseY = 0;
  function setupMotion() {
    lenis?.destroy(); lenis = null;
    document.documentElement.classList.toggle('motion-ready',!reduced.matches);
    if (!reduced.matches && window.Lenis) {
      lenis = new Lenis({autoRaf:true,lerp:.095,smoothWheel:true,syncTouch:false,allowNestedScroll:true,stopInertiaOnNavigate:true});
      lenis.on('scroll',scheduleVisual);
    }
    if (reduced.matches) main.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }
  function scrollTo(target,immediate=false) {
    if (lenis) lenis.scrollTo(target,{immediate,offset:typeof target === 'string'?-110:0,duration:1.2});
    else if (typeof target === 'number') window.scrollTo({top:target,behavior:immediate || reduced.matches?'instant':'smooth'});
    else document.querySelector(target)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
  }
  function updateNav(active) {
    document.querySelectorAll('[data-nav]').forEach(link => {if(link.dataset.nav === active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    movePill();
  }
  function movePill() {
    const nav = document.querySelector('.main-nav');
    const active = nav.querySelector('[aria-current=page]') || nav.querySelector('[data-nav=home]');
    const pill = nav.querySelector('.nav-indicator');
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
  }
  function scheduleVisual() {if(!visualQueued){visualQueued=true;requestAnimationFrame(updateVisual);}}
  function updateVisual() {
    visualQueued=false;
    const scroll = window.scrollY;
    document.querySelector('#site-header').classList.toggle('is-scrolled',scroll>70 || !main.querySelector('.hero'));
    const max = document.documentElement.scrollHeight-window.innerHeight;
    document.querySelector('#scroll-progress').style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,scroll/max)):0})`;
    const hero=main.querySelector('.hero');
    if (hero && !reduced.matches) {
      const visible=scroll<hero.offsetHeight;
      hero.querySelector('img').style.animationPlayState=visible?'running':'paused';
      if(visible){hero.style.setProperty('--hx',`${heroMouseX}px`);hero.style.setProperty('--hy',`${scroll*.12+heroMouseY}px`);}
    }
  }
  function enhancePage() {
    observer?.disconnect();
    if('IntersectionObserver' in window && !reduced.matches){
      observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
      main.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
    }else main.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
    requestAnimationFrame(()=>{lenis?.resize();scheduleVisual();movePill();});
  }
  function homePosts() {
    return sorted().filter(post=>homeFilter==='all' || post.category===homeFilter).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)).slice(0,4).map(row).join('') || '<p class="empty">这个分类还没有记录，敬请期待。</p>';
  }
  function home() {
    main.innerHTML=`<section class="hero"><div class="hero-art" aria-hidden="true"><img src="./assets/hero-glass.webp" alt="" width="1792" height="1024" fetchpriority="high"></div><div class="hero-shade"></div><div class="hero-inner page-width"><div class="hero-copy"><div class="eyebrow hero-enter">INCLOING / PERSONAL SPACE</div><h1 class="hero-enter"><span>保持好奇。</span><br><span class="quiet">不止于此。</span></h1><p class="hero-description hero-enter">${escape(blog.intro)}</p><div class="hero-buttons hero-enter"><a class="button button-primary" href="#explore">开始探索${icon('arrow_downward')}</a><a class="button button-secondary glass" href="#/about">认识一下我${icon('arrow_outward')}</a></div></div></div><div class="scene-label glass" aria-hidden="true"><span></span><span>IDEAS IN MOTION<small>A LITTLE ROOM TO GROW</small></span></div><div class="hero-bottom"><a class="scroll-cue" href="#explore">${icon('arrow_downward')}SCROLL TO DISCOVER</a><span>THINK. BUILD. LIVE.</span></div></section>
    <div class="page-width"><div class="intro-strip reveal"><span>A SMALL CORNER<br>OF THE INTERNET</span><p>想法、实践，与日常。<br><span>把生活慢慢写成自己的版本。</span></p></div>
    <section class="section" id="explore"><div class="section-heading reveal"><div><span class="eyebrow">01 — THE COLLECTION</span><h2>从这里，<span>随意走走。</span></h2></div><a class="small-link" href="#/archive">全部归档${icon('arrow_outward')}</a></div><div class="collection-grid reveal" aria-label="浏览内容分类" data-lenis-prevent-horizontal>${blog.categories.map((cat,index)=>{const posts=blog.posts.filter(p=>p.category===cat.id);return `<a class="collection-card" href="#/${cat.id}" aria-label="浏览${escape(cat.title)}"><img src="${image(cat.id)}" alt="${artAlt[cat.id]}" width="1024" height="1024" loading="lazy"><div class="card-shade"></div><div class="collection-meta"><span class="badge glass">0${index+1} / ${['LEARN','MAKE','LIVE'][index]}</span><span class="collection-count">${posts.length} 篇${posts.every(p=>p.demo)?'示例':'记录'}</span></div><div class="collection-content"><h3>${escape(cat.title)}</h3><p>${escape(cat.description)}</p><span class="round-link glass" aria-hidden="true">${icon('arrow_outward')}</span></div></a>`;}).join('')}</div><div class="mobile-swipe-hint"><span>SWIPE TO EXPLORE / 滑动探索</span>${icon('arrow_forward')}</div></section>
    <section class="latest-section" id="latest"><div class="section-heading reveal"><div><span class="eyebrow">02 — LATEST ENTRIES</span><h2>最近，<span>在记录。</span></h2></div><div class="filter-bar" role="group" aria-label="按分类筛选记录"><button class="filter" data-filter="all" aria-pressed="${homeFilter==='all'}">全部</button>${blog.categories.map(cat=>`<button class="filter" data-filter="${cat.id}" aria-pressed="${homeFilter===cat.id}">${escape(cat.title)}</button>`).join('')}</div></div><div class="latest-grid"><div class="reveal"><div class="post-list" id="post-list">${homePosts()}</div><div class="post-list-footer"><span>ONE PAGE AT A TIME.</span><a class="small-link" href="#/archive">继续翻翻${icon('arrow_forward')}</a></div></div><aside class="reveal"><div class="now-card glass"><img src="./assets/hero-glass.webp" alt="" loading="lazy"><div class="card-shade"></div><div class="now-top"><span class="eyebrow">CURRENTLY</span>${icon('auto_awesome')}</div><div class="now-content"><span>此刻 / NOW</span><h3>让想法，<br>慢慢有形。</h3><p>整理学过的东西，<br>也给新念头留一点空间。</p><a class="small-link" href="#/projects">看看项目${icon('arrow_outward')}</a></div></div></aside></div></section>
    <section class="about-teaser"><div class="reveal"><span class="eyebrow">03 — A LITTLE ABOUT ME</span><h2>一个人，<br><span>不止一面。</span></h2></div><a class="about-teaser-card glass reveal" href="#/about">${icon('person')}<h3>你好，我是 Incloing。</h3><p>在这里，分享学习的过程、动手的尝试，和日常里的小小发现。</p><span class="round-link glass" aria-hidden="true">${icon('arrow_outward')}</span></a></section></div>`;
    main.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
      homeFilter=button.dataset.filter;
      main.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      const list=main.querySelector('#post-list');list.innerHTML=homePosts();
      if(!reduced.matches)list.animate([{opacity:.25,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
      document.querySelector('#live-announcement').textContent=`已显示${homeFilter==='all'?'全部':category(homeFilter).title}记录`;
      lenis?.resize();scheduleVisual();
    }));
  }
  function categoryPage(id) {
    const cat=category(id),posts=sorted().filter(post=>post.category===id);
    main.innerHTML=`<div class="subpage-shell page-width">${crumbs(cat.title)}<section class="page-banner"><img src="${image(id)}" alt="${artAlt[id]}" width="1024" height="1024"><div class="card-shade"></div><span class="eyebrow">${escape(cat.english)}</span><h1>${escape(cat.title)}</h1><p>${escape(cat.description)}</p></section><div class="subpage-content">${posts.some(p=>p.demo)?notice:''}${id==='projects'?`<div class="project-grid">${posts.map((post,index)=>`<a class="project-card glass reveal" href="#/post/${encodeURIComponent(post.id)}"><div class="project-visual"><img src="${index?image('notes'):image('projects')}" alt="" loading="lazy"><span class="badge glass">${escape(post.status || '项目')}</span>${icon('arrow_outward')}</div><div class="project-card-content">${meta(post)}<h2>${escape(post.title)}</h2><p>${escape(post.excerpt)}</p>${tags(post)}</div></a>`).join('')}</div>`:`<div class="post-list">${posts.map(row).join('') || '<p class="empty">这个角落还没有记录。</p>'}</div>`}</div></div>`;
  }
  function about() {
    main.innerHTML=`<div class="subpage-shell page-width">${crumbs('关于我')}<div class="about-hero"><div class="about-copy"><span class="eyebrow">HELLO, I'M INCLOING</span><h1>认真生活。<br><span>持续生长。</span></h1>${blog.about.map(p=>`<p>${escape(p)}</p>`).join('')}${topics()}</div><div class="identity-card glass"><img src="./assets/hero-glass.webp" alt="流动的琥珀与紫色玻璃雕塑"><div class="card-shade"></div><span class="badge glass">PERSONAL SPACE / 个人空间</span><div><h2>Incloing.</h2><p>STAY CURIOUS. KEEP GROWING.</p></div></div></div><section class="about-detail reveal"><h2>给好奇，留一个位置。</h2><div><p>学习笔记，记录从不理解到理解的过程。<br>项目，记录从一个念头到一次实践的过程。<br>生活随笔，记录那些值得停留的普通片刻。</p><p>它们放在一起，成为这个还在慢慢生长的个人空间。</p></div></section></div>`;
  }
  function article(id) {
    const post=blog.posts.find(item=>item.id===id);if(!post)return notFound();
    const peers=sorted().filter(item=>item.category===post.category),next=peers[(peers.findIndex(item=>item.id===id)+1)%peers.length];
    main.innerHTML=`<div class="subpage-shell page-width"><article class="article"><div class="breadcrumbs"><a href="#/">首页</a>${icon('chevron_right')}<a href="#/${post.category}">${escape(category(post.category).title)}</a></div><div class="article-cover"><img src="${image(post.category)}" alt="${artAlt[post.category]}"></div><header class="article-header">${meta(post)}<h1>${escape(post.title)}</h1>${tags(post)}</header>${post.demo?notice:''}<div class="article-body">${post.body.map(block=>`${block.heading?`<h2>${escape(block.heading)}</h2>`:''}<p>${escape(block.text).replaceAll('\n','<br>')}</p>`).join('')}</div><div class="article-end"><a class="small-link" href="#/${post.category}">${icon('arrow_back')}返回${escape(category(post.category).title)}</a>${next && next.id!==id?`<a class="small-link" href="#/post/${encodeURIComponent(next.id)}">${escape(next.title)}${icon('arrow_forward')}</a>`:''}</div></article></div>`;
    document.title=`${post.title} · Incloing`;
  }
  function archive() {
    const years=[...new Set(sorted().map(post=>post.date.slice(0,4)))];
    main.innerHTML=`<div class="subpage-shell page-width">${crumbs('归档')}<div class="plain-heading"><span class="eyebrow">THE ARCHIVE</span><h1>走过的，<br>都留在这里。</h1><p>每一篇记录，都是一小段时间的切片。</p></div><div class="subpage-content">${blog.posts.some(p=>p.demo)?notice:''}${years.map(year=>`<section class="archive-group"><h2>${year}<small>${blog.posts.filter(post=>post.date.startsWith(year)).length} 篇记录</small></h2>${sorted().filter(post=>post.date.startsWith(year)).map(post=>`<a class="archive-link" href="#/post/${encodeURIComponent(post.id)}"><time datetime="${post.date}">${post.date.slice(5).replace('-','.')}</time><span>${escape(post.title)}</span>${icon('arrow_outward')}</a>`).join('')}</section>`).join('')}</div></div>`;
  }
  function notFound() {main.innerHTML=`<div class="subpage-shell page-width not-found"><span class="eyebrow">404 / AN UNWRITTEN PAGE</span><h1>这一页，还没有写下。</h1><p>回到首页，换一个方向继续探索。</p><a class="button button-primary" href="#/">返回首页${icon('arrow_forward')}</a></div>`;}
  function renderRoute() {
    const hash=location.hash || '#/';
    if(['#explore','#latest'].includes(hash)){
      if(!main.querySelector('.hero')){home();updateNav('home');enhancePage();}
      requestAnimationFrame(()=>scrollTo(hash));return;
    }
    if(hash==='#main'){main.focus({preventScroll:true});scrollTo(0);return;}
    const parts=hash.replace(/^#\/?/,'').split('/'),page=parts[0];let id='';
    try{id=decodeURIComponent(parts[1] || '');}catch{}
    const active=page==='post'?blog.posts.find(post=>post.id===id)?.category:page || 'home';
    document.title=`${category(page)?category(page).title+' · ':page==='about'?'关于我 · ':page==='archive'?'归档 · ':''}Incloing`;
    const commit=()=>{
      if(!page)home();else if(category(page))categoryPage(page);else if(page==='about')about();else if(page==='archive')archive();else if(page==='post')article(id);else notFound();
      heroMouseX=0;heroMouseY=0;updateNav(active);scrollTo(0,true);enhancePage();
      if(!firstRender)main.focus({preventScroll:true});
      firstRender=false;
    };
    if(!firstRender && !reduced.matches && document.startViewTransition && !document.hidden){
      transition?.skipTransition();transition=document.startViewTransition(commit);transition.ready.catch(()=>{});transition.finished.catch(()=>{});
    }else commit();
  }
  function search() {
    const query=searchInput.value.trim().toLocaleLowerCase();
    const matches=query?sorted().filter(post=>[post.title,post.excerpt,...post.tags,category(post.category).title,...post.body.flatMap(block=>[block.heading,block.text])].join(' ').toLocaleLowerCase().includes(query)):sorted();
    document.querySelector('#search-results').innerHTML=matches.length?matches.map(post=>`<a class="search-result" href="#/post/${encodeURIComponent(post.id)}"><span><strong>${escape(post.title)}</strong><small>${escape(category(post.category).title)} · ${escape(post.date)}${post.demo?' · 示例':''}</small></span>${icon('arrow_outward')}</a>`).join(''):'<p class="empty">没有找到相关内容，换个关键词试试。</p>';
  }
  function openSearch(){if(dialog.open)return;searchInput.value='';search();lenis?.stop();document.documentElement.classList.add('modal-open');dialog.showModal();searchInput.focus();}
  document.querySelector('#search-open').addEventListener('click',openSearch);
  document.querySelector('#search-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.documentElement.classList.remove('modal-open');lenis?.start();});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)dialog.close();}});
  searchInput.addEventListener('input',search);
  document.querySelector('#search-results').addEventListener('click',event=>{if(event.target.closest('a'))dialog.close();});
  document.addEventListener('keydown',event=>{if((event.key==='/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='k')) && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable){event.preventDefault();openSearch();}});
  const themeButton=document.querySelector('#theme');
  function setTheme(light){document.documentElement.dataset.theme=light?'light':'dark';themeButton.setAttribute('aria-label',light?'切换深色模式':'切换浅色模式');themeButton.querySelector('.mi').textContent=light?'dark_mode':'light_mode';document.querySelector('meta[name=theme-color]').content=light?'#f0f1f5':'#101114';}
  let savedTheme='';try{savedTheme=localStorage.getItem('incloing-glass-theme') || '';}catch{}
  setTheme(savedTheme==='light');
  themeButton.addEventListener('click',()=>{const light=document.documentElement.dataset.theme!=='light';setTheme(light);try{localStorage.setItem('incloing-glass-theme',light?'light':'dark');}catch{}});
  let hovered, pointerFrame, pointerData;
  function resetHover(){if(hovered){hovered.style.setProperty('--lit','0');hovered.style.setProperty('--rx','0deg');hovered.style.setProperty('--ry','0deg');hovered=null;}}
  document.addEventListener('pointermove',event=>{
    if(reduced.matches || !finePointer.matches)return;
    pointerData={x:event.clientX,y:event.clientY,target:event.target};
    if(pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{
      pointerFrame=0;const {x,y,target}=pointerData;
      const surface=target.closest('.glass,.collection-card');
      if(surface!==hovered){resetHover();hovered=surface;}
      if(surface){const rect=surface.getBoundingClientRect();const px=x-rect.left,py=y-rect.top;surface.style.setProperty('--mx',`${px}px`);surface.style.setProperty('--my',`${py}px`);surface.style.setProperty('--lit','1');if(surface.matches('.collection-card')){surface.style.setProperty('--rx',`${-(py/rect.height-.5)*5}deg`);surface.style.setProperty('--ry',`${(px/rect.width-.5)*6}deg`);}}
      heroMouseX=(x/window.innerWidth-.5)*9;heroMouseY=(y/window.innerHeight-.5)*7;scheduleVisual();
    });
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',resetHover);
  document.addEventListener('pointerdown',event=>{
    if(reduced.matches || event.button!==0)return;
    const surface=event.target.closest('button,.collection-card,.button,.main-nav,.about-teaser-card,.project-card');
    if(!surface)return;
    const rect=surface.getBoundingClientRect(),ripple=document.createElement('span');ripple.className='click-ripple';ripple.setAttribute('aria-hidden','true');
    ripple.style.setProperty('--x',`${event.clientX-rect.left}px`);ripple.style.setProperty('--y',`${event.clientY-rect.top}px`);ripple.style.setProperty('--size',`${Math.max(rect.width,rect.height)*2}px`);surface.append(ripple);ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});setTimeout(()=>ripple.remove(),1000);
  },{passive:true});
  document.querySelector('#year').textContent=new Date().getFullYear();
  reduced.addEventListener('change',setupMotion);
  window.addEventListener('scroll',scheduleVisual,{passive:true});
  window.addEventListener('resize',()=>{movePill();scheduleVisual();},{passive:true});
  window.addEventListener('hashchange',renderRoute);
  document.fonts.ready.then(()=>{movePill();lenis?.resize();});
  setupMotion();renderRoute();
})();
