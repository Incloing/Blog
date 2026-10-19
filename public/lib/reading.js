/* Full-screen article previews and shared reading dialogs. */
(() => {
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const image=p=>window.BlogArticle.imageUrl(p.cover||'')||`./assets/google-${{notes:'cloud',projects:'liquid',life:'moss'}[p.category]||'cloud'}.webp`;
 const close=id=>`<button class="icon-button glass" type="button" data-close="${id}" aria-label="关闭"><span class="close-mark" aria-hidden="true"></span></button>`;
 const listIcon='<svg class="reader-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M3 6h.1M3 12h.1M3 18h.1"/></svg>';
 const heartIcon='<svg class="reader-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z"/></svg>';
 document.body.insertAdjacentHTML('beforeend',`<dialog id="collection-directory" class="glass reading-dialog" aria-labelledby="directory-heading"><div class="dialog-heading"><h2 id="directory-heading">文章目录</h2>${close('collection-directory')}</div><nav id="directory-list" aria-label="当前分类文章"></nav></dialog><dialog id="reward-dialog" class="glass reading-dialog reward-dialog" aria-labelledby="reward-heading"><div class="dialog-heading"><h2 id="reward-heading">谢谢你的心意。</h2>${close('reward-dialog')}</div><div id="reward-content"></div><p class="reward-note">自愿赞赏，感谢你对这片小天地的支持。</p></dialog>`);
 let jump=null;
 function mount({onScene}){
  jump=onScene;const key=(location.hash||'#/').replace(/^#\/?/,'').split('/'),category=window.BLOG.categories.find(c=>c.id===key[0]),main=document.getElementById('main');
  if(category&&main.querySelector('#post-list')){
   const posts=[...window.BLOG.posts].filter(p=>p.category===category.id).sort((a,b)=>b.date.localeCompare(a.date)),host=main.querySelector('.inner-page');
   host.className='collection-stage';
   host.innerHTML=`<div class="collection-tools"><span>${esc(category.title)} <small>${posts.length} 篇</small></span><button class="pill-link glass" type="button" data-directory-open>${listIcon} 目录</button></div>${posts.length?posts.map((post,index)=>{const beginning=window.BlogArticle.excerpt(window.BlogArticle.toMarkdown(post)).slice(0,145)||post.excerpt;return `<section class="story-scene" id="story-${esc(post.id)}" aria-label="第 ${index+1} 篇，共 ${posts.length} 篇"><a class="story-card glass" href="#/post/${encodeURIComponent(post.id)}"><div class="story-image"><img src="${esc(image(post))}" alt="${esc(post.title)}的封面" decoding="async" ${index?'loading="lazy"':'fetchpriority="high"'}><span class="story-order">${post.demo?'示例 · ':''}${String(index+1).padStart(2,'0')} / ${String(posts.length).padStart(2,'0')}</span></div><div class="story-copy"><time datetime="${esc(post.date)}">${esc(post.date.replaceAll('-','.'))}</time><h1>${esc(post.title)}</h1><p>${esc(beginning)}</p><span class="story-more">阅读这篇 <span class="mi" aria-hidden="true">arrow_forward</span></span></div></a><p class="story-hint">${index===posts.length-1?'已经读到这个分类的最后一篇':'轻轻向下滑，遇见下一篇'}</p></section>`;}).join(''):`<section class="story-scene" id="story-empty"><div class="story-empty glass"><h1>${esc(category.title)}</h1><p>故事还在酝酿，下一篇很快见。</p><a class="pill-link glass" href="#/">回到首页</a></div></section>`}`;
   document.getElementById('directory-list').innerHTML=posts.length?posts.map((p,i)=>`<button type="button" class="directory-item" data-story-target="story-${esc(p.id)}"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(p.title)}</strong><time>${esc(p.date)}</time></button>`).join(''):'<p>这个分类还没有文章。</p>';
  }
  if(key[0]==='post'){
   let id='';try{id=decodeURIComponent(key[1]||'');}catch{return;}const post=window.BLOG.posts.find(p=>p.id===id),article=main.querySelector('.article');if(!post||!article)return;
   const updated=post.updatedAt?new Date(post.updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):post.date.replaceAll('-','/');
   article.querySelector('.article-bottom').insertAdjacentHTML('beforebegin',`${post.attachments?.length?`<section class="article-attachments" aria-label="文章附件"><h2>随文附件</h2>${post.attachments.map(a=>`<a class="attachment-download glass" href="${esc(window.BlogAttachments.url(a.path))}" download="${esc(a.name)}"><svg class="reader-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-4-4 4 4 4-4M5 15v5h14v-5"/></svg><span>${esc(a.name)}<small>${window.BlogAttachments.size(a.size)}</small></span><span aria-hidden="true">↗</span></a>`).join('')}</section>`:''}<section class="reading-end"><p class="reading-thanks">感谢阅读。</p><p class="reading-updated">更新于 <time datetime="${esc(post.updatedAt||post.date)}">${esc(updated)}</time></p><button class="pill-link glass reward-button" type="button" data-reward-open>${heartIcon} 赞赏</button><p class="reward-note">如果这些文字对你有帮助，欢迎请我喝一杯茶。</p></section>`);
  }
 }
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-directory-open]'))window.IncloingDialogs?.open('collection-directory');
  const target=event.target.closest('[data-story-target]');if(target){window.IncloingDialogs?.close();jump?.(target.dataset.storyTarget);}
  if(event.target.closest('[data-reward-open]')){const source=window.BlogArticle.imageUrl(window.BLOG.profile.rewardQr||'');document.getElementById('reward-content').innerHTML=source?`<img class="reward-qr" src="${esc(source)}" alt="Incloing 的微信收款码"><p class="reward-note">微信扫码，或保存图片后在微信中识别。</p>`:'<p>谢谢你的心意，赞赏方式稍后开放。</p>';window.IncloingDialogs?.open('reward-dialog');}
 });
 window.IncloingReading=Object.freeze({mount});
})();
