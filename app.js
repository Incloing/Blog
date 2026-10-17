(() => {
  'use strict';
  const blog = window.BLOG;
  const main = document.querySelector('#main');
  const dialog = document.querySelector('#search-dialog');
  const searchInput = document.querySelector('#search-input');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const category = id => blog.categories.find(item => item.id === id);
  const count = id => blog.posts.filter(post => post.category === id).length;
  const sortedPosts = () => [...blog.posts].sort((a,b) => b.date.localeCompare(a.date));
  const tagList = post => `<span class="tags">${post.tags.map(tag => `<span># ${escape(tag)}</span>`).join('')}</span>`;
  const meta = post => `<div class="post-meta"><span class="category-label">${escape(category(post.category)?.title || '')}</span><span>·</span><time datetime="${escape(post.date)}">${escape(post.date.replaceAll('-','.'))}</time>${post.demo?'<span class="sample">示例</span>':''}${post.pinned?'<span class="pin">↟ 置顶</span>':''}</div>`;
  const postRow = post => `<a class="post-row" href="#/post/${encodeURIComponent(post.id)}">${meta(post)}<h3>${escape(post.title)}</h3><p>${escape(post.excerpt)}</p><div class="post-bottom">${tagList(post)}<span class="read-arrow" aria-hidden="true">↗</span></div></a>`;
  const sectionHead = (number,title,english,link,label) => `<div class="section-head"><div class="section-title"><small>${number}</small><h2>${title}</h2><span class="english">${english}</span></div>${link?`<a class="text-link" href="${link}">${label} <span aria-hidden="true">↗</span></a>`:''}</div>`;
  const notice = '<p class="notice">✳ 这是网站的第一版预览。目前的文章与项目为示例内容，后续将替换为 Incloing 的真实记录。</p>';
  function home() {
    main.innerHTML = `<section class="hero"><div class="hero-copy"><div class="eyebrow">A SMALL CORNER OF THE INTERNET</div><h1>记录，探索，<br><em>慢慢生长。</em></h1><p>${escape(blog.intro)}</p><div class="hero-buttons"><a href="#latest" class="button">翻翻最近的记录 <span aria-hidden="true">↗</span></a><a href="#/about" class="text-link">认识一下我 <span aria-hidden="true">→</span></a></div></div><div class="hero-art"><span class="art-note">Stay curious, keep growing.</span><img src="./landscape.svg" alt="手绘的绿色山丘、树木和一条向远方延伸的小路" width="700" height="530"></div></section><div class="hero-foot"><span><span class="tiny-star">✳</span> 不急着抵达，先认真走过。</span><span>NOTES ON LEARNING & LIVING</span></div>
    <section class="section">${sectionHead('01','随意逛逛','EXPLORE MY WORLD')}<div class="categories">${blog.categories.map(cat => `<a href="#/${cat.id}" class="category ${cat.color}"><div class="category-top"><span class="category-icon" aria-hidden="true">${cat.icon}</span><span>${String(count(cat.id)).padStart(2,'0')} 篇示例</span></div><h3>${escape(cat.title)}</h3><p>${escape(cat.description)}</p><div class="category-bottom"><span>${cat.english}</span><span aria-hidden="true">↗</span></div></a>`).join('')}</div></section>
    <div class="main-grid"><section class="section" id="latest">${sectionHead('02','最近的记录','LATEST ENTRIES','#/archive','全部归档')}<div class="filter-row" role="group" aria-label="按分类筛选"><button class="filter" data-filter="all" aria-pressed="true">全部</button>${blog.categories.map(cat => `<button class="filter" data-filter="${cat.id}" aria-pressed="false">${escape(cat.title)}</button>`).join('')}</div><div id="post-list">${homePosts('all')}</div></section><aside><section class="profile"><div class="avatar" aria-hidden="true">i</div><h2>Incloing</h2><p>保持好奇，持续记录。<br>在自己的节奏里，慢慢往前走。</p><div class="profile-stats"><div><strong>${blog.posts.length}</strong><small>篇示例记录</small></div><div><strong>${blog.categories.length}</strong><small>个内容分类</small></div></div><a href="#/about" class="text-link">更多关于我 <span aria-hidden="true">↗</span></a></section><section class="aside-note"><h3><span>✳</span> 小站近况</h3><p><span class="status-dot"></span> 正在慢慢搭建这个小角落。<br>先种下一颗种子，再等待生长。</p></section><section class="aside-note"><h3><span>⌁</span> 写在前面</h3><p>当前内容为排版示例，<br>真正的故事，即将在这里发生。</p></section><div class="quiet-quote">让每一次好奇，<br>都有迹可循。<span>One page at a time.</span></div></aside></div>`;
    main.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      main.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed',String(item === button)));
      main.querySelector('#post-list').innerHTML = homePosts(button.dataset.filter);
    }));
  }
  function homePosts(filter) {
    return sortedPosts().filter(post => filter === 'all' || post.category === filter).sort((a,b) => Number(!!b.pinned)-Number(!!a.pinned)).slice(0,4).map(postRow).join('') || '<p class="empty">这个分类还没有内容，敬请期待。</p>';
  }
  function pageIntro(title,description) { return `<section class="page-intro"><div class="breadcrumbs"><a href="#/">首页</a><span>/</span><span>${escape(title)}</span></div><h1>${escape(title)}</h1><p>${escape(description)}</p></section>`; }
  function categoryPage(id) {
    const cat = category(id);
    const posts = sortedPosts().filter(post => post.category === id);
    main.innerHTML = pageIntro(cat.title,cat.description) + `<div class="sub-content">${notice}${id === 'projects'?`<div class="project-grid">${posts.map((post,index) => `<a class="project-card" href="#/post/${encodeURIComponent(post.id)}"><div class="project-visual ${index?'browser':''}">${index?'<span class="project-symbol">⌘</span>':'<div class="mini-browser"><div class="mini-bar">···</div><div class="mini-content"><div class="mini-lines"><b>Incloing.</b><i></i><i></i><i></i></div><div class="mini-landscape"></div></div></div>'}<small>${escape(post.status || '项目')}</small></div><div class="project-card-content">${meta(post)}<h2>${escape(post.title)}</h2><p>${escape(post.excerpt)}</p><div class="post-bottom">${tagList(post)}<span class="read-arrow">↗</span></div></div></a>`).join('')}</div>`:posts.map(postRow).join('') || '<p class="empty">还没有文章。</p>'}</div>`;
  }
  function about() {
    main.innerHTML = pageIntro('关于我','让这个小小的站点，成为认识彼此的开始。') + `<div class="sub-content"><div class="about-layout"><div><div class="eyebrow">HELLO, I'M INCLOING</div><h2>你好，很高兴在这里遇见你。</h2>${blog.about.map(p => `<p>${escape(p)}</p>`).join('')}<h2>这个站点的三个角落</h2><p>学习笔记，记录理解与思考。<br>项目，记录想法与实践。<br>生活随笔，记录日常与心情。</p><div class="about-links">${blog.categories.map(cat => `<a href="#/${cat.id}">${escape(cat.title)} ↗</a>`).join('')}</div></div><div class="about-side"><div class="avatar" aria-hidden="true">i</div><p>Incloing.</p><span class="post-meta">Stay curious, keep growing.</span></div></div></div>`;
  }
  function article(id) {
    const post = blog.posts.find(item => item.id === id);
    if (!post) return notFound();
    const posts = sortedPosts().filter(item => item.category === post.category);
    const index = posts.findIndex(item => item.id === id);
    const next = posts[(index+1)%posts.length];
    main.innerHTML = `<article class="article"><div class="breadcrumbs"><a href="#/">首页</a><span>/</span><a href="#/${post.category}">${escape(category(post.category).title)}</a></div><header class="article-header">${meta(post)}<h1>${escape(post.title)}</h1>${tagList(post)}</header>${post.demo?notice:''}<div class="article-body">${post.body.map(block => `${block.heading?`<h2>${escape(block.heading)}</h2>`:''}<p>${escape(block.text).replaceAll('\n','<br>')}</p>`).join('')}</div><div class="article-end"><a href="#/${post.category}" class="text-link">← 返回${escape(category(post.category).title)}</a>${next && next.id !== id?`<a class="text-link" href="#/post/${encodeURIComponent(next.id)}">下一篇：${escape(next.title)} →</a>`:''}</div></article>`;
    document.title = `${post.title} · Incloing`;
  }
  function archive() {
    const years = [...new Set(sortedPosts().map(post => post.date.slice(0,4)))];
    main.innerHTML = pageIntro('归档','每一篇记录，都是走过的一小段路。') + `<div class="sub-content">${notice}${years.map(year => `<section class="archive-group"><h2>${year}<small style="font:12px sans-serif;margin-left:15px">${blog.posts.filter(post => post.date.startsWith(year)).length} 篇</small></h2>${sortedPosts().filter(post => post.date.startsWith(year)).map(post => `<a class="archive-link" href="#/post/${encodeURIComponent(post.id)}"><time>${escape(post.date.slice(5).replace('-','.'))}</time><span>${escape(post.title)}</span></a>`).join('')}</section>`).join('')}</div>`;
  }
  function notFound() { main.innerHTML = pageIntro('这一页还没有写下','也许是走错了路。不妨回到首页，重新翻一翻。') + '<div class="sub-content"><a class="button" href="#/">返回首页 →</a></div>'; }
  function route() {
    const hash = location.hash || '#/';
    if (hash === '#latest') { if (!document.querySelector('#latest')) home(); setTimeout(() => document.querySelector('#latest')?.scrollIntoView(),0); return; }
    const [page,id] = hash.replace(/^#\/?/,'').split('/');
    document.title = `${page && category(page)?category(page).title+' · ':page === 'about'?'关于我 · ':page === 'archive'?'归档 · ':''}Incloing`;
    if (!page) home(); else if (category(page)) categoryPage(page); else if (page === 'about') about(); else if (page === 'archive') archive(); else if (page === 'post') { try { article(decodeURIComponent(id || '')); } catch { notFound(); } } else notFound();
    const active = page === 'post'?blog.posts.find(post => post.id === id)?.category:page || 'home';
    document.querySelectorAll('[data-nav]').forEach(link => {link.classList.toggle('active',link.dataset.nav === active); if(link.dataset.nav === active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');});
    window.scrollTo(0,0);
  }
  function search() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const results = query?sortedPosts().filter(post => [post.title,post.excerpt,...post.tags,category(post.category).title,...post.body.map(block => block.text)].join(' ').toLocaleLowerCase().includes(query)):sortedPosts();
    document.querySelector('#search-results').innerHTML = results.length?results.map(post => `<a class="search-result" href="#/post/${encodeURIComponent(post.id)}"><strong>${escape(post.title)}</strong><small>${escape(category(post.category).title)} · ${escape(post.date)}${post.demo?' · 示例':''}</small></a>`).join(''):'<p class="empty">没有找到相关内容，试试其他关键词。</p>';
  }
  function openSearch() { searchInput.value=''; search(); dialog.showModal(); searchInput.focus(); }
  document.querySelector('#search-open').addEventListener('click',openSearch);
  document.querySelector('#search-close').addEventListener('click',() => dialog.close());
  searchInput.addEventListener('input',search);
  dialog.addEventListener('keydown',event => { if(event.key === 'Escape') {event.preventDefault(); dialog.close();} });
  document.querySelector('#search-results').addEventListener('click',event => { if (event.target.closest('a')) dialog.close(); });
  dialog.addEventListener('click',event => { if(event.target === dialog) { const rect = dialog.getBoundingClientRect(); if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  document.addEventListener('keydown',event => { if ((event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {event.preventDefault(); if(!dialog.open) openSearch();} });
  const themeButton = document.querySelector('#theme');
  function setTheme(dark) { document.body.classList.toggle('dark',dark); themeButton.setAttribute('aria-label',dark?'切换浅色模式':'切换深色模式'); themeButton.setAttribute('aria-pressed',String(dark)); document.querySelector('meta[name="theme-color"]').content = dark?'#1e2822':'#f7f8f3'; }
  let theme = ''; try { theme = localStorage.getItem('incloing-theme') || ''; } catch {}
  setTheme(theme === 'dark');
  themeButton.addEventListener('click',() => { const dark = !document.body.classList.contains('dark'); setTheme(dark); try { localStorage.setItem('incloing-theme',dark?'dark':'light'); } catch {} });
  document.querySelector('#year').textContent = new Date().getFullYear();
  window.addEventListener('hashchange',route); route();
})();
