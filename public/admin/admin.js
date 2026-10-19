(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const categories = {notes:'学习笔记',projects:'个人项目',life:'生活随笔'};
  const fields = ['title','category','date','tags','excerpt','markdown','cover'];
  $('markdown').placeholder='从这里开始写吧。\n\n支持 Markdown，也可以直接写文字。\n图片可以从相册选择。';
  let client = window.BlogWriter, current = null, drafts = [], libraryMode = 'posts';
  let dirty = false, busy = false, saving = null, saveTimer = 0, editVersion = 0;
  let toastTimer = 0, imageBusy = false, releaseCheck = 0, draftDb = null;
  const previewURLs = new Map();
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2,'0')).join('');
  const localDate = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const clone = obj => typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
  function toast(message) {$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
  function saveState(message,error=false) {$('save-state').textContent=message;$('save-state').classList.toggle('error',error);}
  function errorMessage(error) {return error?.code==='CONFLICT' ? '这篇文章已在别处更新。本机草稿已保留；请先导出备份，刷新已发布列表后再对照合并。' : error?.message || '操作未完成，请稍后再试。';}
  function status(message,error=false) {$('publish-status').textContent=message;$('publish-status').classList.toggle('error',error);}
  function db() {
    if (draftDb) return draftDb;
    draftDb = new Promise((resolve,reject)=>{
      const request=indexedDB.open('incloing-writer-v1',1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('drafts'))request.result.createObjectStore('drafts',{keyPath:'draftId'});};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new Error('浏览器未允许保存本机草稿。请导出备份，或开启此网站的本地存储。'));
      request.onblocked=()=>reject(new Error('本机草稿数据库正在被另一个页面占用，请关闭旧的写作页面后重试。'));
    });
    return draftDb;
  }
  async function store(mode,callback) {
    const database=await db();
    return new Promise((resolve,reject)=>{
      const tx=database.transaction('drafts',mode), request=callback(tx.objectStore('drafts'));
      let value;
      request.onsuccess=()=>{value=request.result;};
      tx.oncomplete=()=>resolve(value);
      tx.onerror=tx.onabort=()=>reject(new Error('本机草稿未能保存，可能是浏览器存储空间不足。请先导出备份。'));
    });
  }
  async function refreshDrafts(){drafts=await store('readonly',s=>s.getAll());drafts.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));renderLibrary();}
  function getPost() {
    return {...current.post,title:$('title').value.trim(),category:$('category').value,date:$('date').value,
      tags:[...new Set($('tags').value.split(/[,，、\n]/).map(s=>s.trim()).filter(Boolean))],excerpt:$('excerpt').value.trim(),markdown:$('markdown').value,cover:$('cover').value,demo:false};
  }
  function snapshot(){return {...current,post:getPost(),updatedAt:new Date().toISOString()};}
  async function saveDraft({quiet=false}={}) {
    clearTimeout(saveTimer);
    if(!current || !dirty) return true;
    if(saving) {await saving;return dirty ? saveDraft({quiet}) : true;}
    const saved=snapshot(), version=editVersion;
    saveState('正在保存…');
    saving=(async()=>{
      try {
        await store('readwrite',s=>s.put(saved));
        if(current?.draftId===saved.draftId && editVersion===version){current=saved;dirty=false;saveState(`已保存 · ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`);}
        await refreshDrafts();
        if(!quiet) toast('草稿已保存在当前浏览器');
        return true;
      } catch(error) {saveState('未保存，请导出备份',true);if(!quiet)toast(errorMessage(error));return false;}
    })();
    const result=await saving;saving=null;return result;
  }
  function changed() {
    if(!current)return;
    dirty=true;editVersion++;saveState('正在编辑…');clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>saveDraft({quiet:true}),650);
    updateCounts();if($('preview-button').getAttribute('aria-pressed')==='true')renderPreview();
  }
  function cleanupURLs(){for(const url of previewURLs.values())URL.revokeObjectURL(url);previewURLs.clear();}
  function imageResolver(path) {
    const normalized=String(path).replace(/^\.\//,'');
    const staged=current?.images.find(image=>image.path===normalized);
    if(staged){if(!previewURLs.has(staged.path))previewURLs.set(staged.path,URL.createObjectURL(staged.blob));return previewURLs.get(staged.path);}
    return undefined;
  }
  function updateCounts(){const text=$('markdown').value;$('word-count').textContent=`${text.replace(/\s/g,'').length.toLocaleString('zh-CN')} 字`;$('image-count').textContent=current?.images.length ? `${current.images.length} 张待发布图片` : '支持拖入、粘贴图片';renderCover();renderAttachments();}
  function renderPreview() {
    const markdown=$('markdown').value, preview=$('preview');
    preview.classList.toggle('empty-preview',!markdown.trim());
    if(!markdown.trim())preview.textContent='文字与图片，将在这里慢慢成形。';
    else if(window.BlogArticle)preview.innerHTML=window.BlogArticle.renderMarkdown(markdown,{resolveImage:imageResolver});
    else preview.textContent=markdown;
  }
  function setPreview(enabled) {$('preview-button').setAttribute('aria-pressed',String(enabled));$('preview-button').textContent=enabled?'继续编辑':'预览';$('markdown').hidden=enabled;$('preview').hidden=!enabled;if(enabled)renderPreview();else $('markdown').focus();}
  function setEditor(draft) {
    cleanupURLs();current=draft;current.files??=[];dirty=false;editVersion++;clearTimeout(saveTimer);
    const post=draft.post;
    for(const key of fields)$(`${key}`).value=key==='tags'?(post.tags||[]).join('，'):post[key]||'';
    $('editor-heading').textContent=draft.basePost?'编辑已发布文章':'新的记录';
    $('publish-button').innerHTML=draft.basePost?'更新到网站 <span aria-hidden="true">↗</span>':'发布到网站 <span aria-hidden="true">↗</span>';
    $('delete-post-button').hidden=!draft.basePost;
    saveState('本机草稿');setPreview(false);updateCounts();renderLibrary();
  }
  async function canSwitch(){if(busy||imageBusy){toast('请等待当前操作完成');return false;}if(dirty && !await saveDraft({quiet:true})){toast('草稿尚未保存。请先导出备份，再重试。');return false;}return true;}
  function freshDraft(){const id=`post-${localDate().replaceAll('-','')}-${uuid().replaceAll('-','').slice(0,12)}`;return {draftId:uuid(),post:{id,title:'',category:'notes',date:localDate(),tags:[],excerpt:'',markdown:'',demo:false},basePost:null,images:[],files:[],updatedAt:new Date().toISOString()};}
  async function newArticle(){if(!await canSwitch())return;setEditor(freshDraft());status('');$('title').focus();}
  async function openDraft(id){if(current?.draftId===id)return;if(!await canSwitch())return;const item=await store('readonly',s=>s.get(id));if(item){setEditor(item);status('');}}
  async function openPublished(id) {
    if(!await canSwitch())return;
    const existing=drafts.find(d=>d.basePost && d.post.id===id);
    if(existing){await openDraft(existing.draftId);toast('已打开这篇文章在本机的草稿');return;}
    const post=client?.posts.find(p=>p.id===id);if(!post)return;
    const basePost=clone(post), editable={...clone(post),markdown:window.BlogArticle.toMarkdown(post),demo:false};
    delete editable.body;
    setEditor({draftId:uuid(),post:editable,basePost,images:[],updatedAt:new Date().toISOString()});
    status('修改内容会先保存为本机草稿，点击“更新到网站”后才会发布。');
  }
  function renderLibrary() {
    $('draft-count').textContent=drafts.length;$('post-count').textContent=client?.posts.length||0;
    $('drafts-tab').setAttribute('aria-selected',String(libraryMode==='drafts'));$('posts-tab').setAttribute('aria-selected',String(libraryMode==='posts'));$('import-button').hidden=libraryMode!=='drafts';
    $('library-list').setAttribute('aria-labelledby',libraryMode==='drafts'?'drafts-tab':'posts-tab');$('refresh-button').hidden=libraryMode!=='posts';
    $('library-caption').textContent=libraryMode==='drafts'?'仅保存在当前浏览器':client?'已发布到网站':'登录后可编辑已发布文章';
    const list=libraryMode==='drafts'?drafts:(client?.posts||[]);
    if(!list.length){$('library-list').innerHTML=`<div class="empty-list"><strong>${libraryMode==='drafts'?'还没有草稿':client?'还没有文章':'尚未连接'}</strong>${libraryMode==='drafts'?'开始写下你的第一句话。':client?'写好后，就可以发布到网站。':'本机写作与自动保存依然可用。'}</div>`;return;}
    const sorted=libraryMode==='posts'?[...list].sort((a,b)=>b.date.localeCompare(a.date)):list;
    $('library-list').innerHTML=sorted.map(item=>{const post=item.post||item,isDraft=libraryMode==='drafts',active=isDraft?item.draftId===current?.draftId:post.id===current?.basePost?.id;return `<button type="button" class="entry${active?' is-active':''}" data-entry="${escapeHTML(isDraft?item.draftId:post.id)}"${active?' aria-current="true"':''}${busy?' disabled':''}><span class="entry-title">${escapeHTML(post.title||'未命名的记录')}</span><span class="entry-meta"><span class="entry-category">${escapeHTML(categories[post.category]||post.category)}</span><span>${escapeHTML(isDraft?new Date(item.updatedAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):post.date)}</span>${post.demo?'<span class="entry-sample">示例</span>':''}</span></button>`;}).join('');
  }
  function validate(post) {
    if(!post.title)throw new Error('请先写一个文章标题。');
    if(!post.markdown.trim())throw new Error('请先写下正文，再发布文章。');
    if(post.title.length>160)throw new Error('标题请控制在 160 个字以内。');
    if(post.markdown.length>250000)throw new Error('正文过长，请控制在 25 万个字符以内。');
    const timestamp=Date.parse(`${post.date}T12:00:00Z`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(post.date)||!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==post.date)throw new Error('请选择有效的文章日期。');
    if(post.tags.length>12||post.tags.some(tag=>tag.length>40))throw new Error('最多添加 12 个标签，每个标签不超过 40 个字。');
    if(post.excerpt.length>400)throw new Error('摘要请控制在 400 个字以内。');
    return post;
  }
  function setBusy(value) {
    busy=value;document.body.classList.toggle('is-publishing',value);
    for(const item of $('article-form').elements)item.disabled=value;
    $('examples-button').disabled=value;$('comments-open').disabled=value;$('profile-open').disabled=value;$('new-button').disabled=value;$('connect-button').disabled=value;$('refresh-button').disabled=value;$('import-button').disabled=value;
    for(const button of document.querySelectorAll('.library-tabs button,.entry'))button.disabled=value;
  }
  async function publish(event) {
    event.preventDefault();if(busy||imageBusy)return;
    if(!client){status('请刷新页面重新登录。草稿已保留。',true);await saveDraft({quiet:true});return;}
    let post;
    try{post=validate(getPost());if(!post.excerpt)post.excerpt=window.BlogArticle.excerpt(post.markdown).slice(0,400);}
    catch(error){status(errorMessage(error),true);return;}
    releaseCheck++;setBusy(true);status('正在保存草稿并准备发布…');
    const editingDraftId=current.draftId;
    try {
      await saveDraft({quiet:true});
      const result=await client.publish(post,current.images,current.basePost,progress=>status(typeof progress==='string'?progress:progress?.message||'正在发布…'),current.files);
      const published=result.post||post;
      current={...current,post:{...published,markdown:window.BlogArticle.toMarkdown(published)},basePost:clone(published),images:[],files:[],updatedAt:new Date().toISOString()};
      delete current.post.body;dirty=true;editVersion++;cleanupURLs();
      $('markdown').value=current.post.markdown;$('cover').value=current.post.cover||'';renderCover();
      $('excerpt').value=current.post.excerpt||'';
      await saveDraft({quiet:true});
      $('editor-heading').textContent='编辑已发布文章';$('publish-button').innerHTML='更新到网站 <span aria-hidden="true">↗</span>';$('delete-post-button').hidden=false;
      updateCounts();renderLibrary();status('文章已保存，正在确认网站更新…');
      toast('文章已发布');
      const check=++releaseCheck;void waitForSite(published,result.revision,check,editingDraftId);
    } catch(error){status(errorMessage(error),true);await saveDraft({quiet:true});}
    finally{setBusy(false);renderLibrary();}
  }
  async function waitForSite(post,revision,check,draftId) {
    const link=new URL('../',location.href);if(revision)link.searchParams.set('v',revision);link.hash=`/post/${encodeURIComponent(post.id)}`;
    const start=Date.now();let deployed=false;
    while(Date.now()-start<90000 && check===releaseCheck){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
      try{
        const response=await fetch(new URL(`../content/posts.json?writer-check=${Date.now()}`,location.href),{cache:'no-store',signal:controller.signal});
        if(response.ok){const manifest=await response.json(),live=manifest.posts?.find(item=>item.id===post.id);deployed=!!live && ((revision && manifest.revision===revision)||(post.updatedAt && live.updatedAt===post.updatedAt)||(!post.updatedAt && live.title===post.title && live.markdown===post.markdown));}
      }catch(_){/* The commit is saved even when a deployment check cannot complete. */}finally{clearTimeout(timer);}
      if(deployed)break;
      await new Promise(resolve=>setTimeout(resolve,5000));
    }
    if(check!==releaseCheck||current?.draftId!==draftId)return;
    const container=$('publish-status');container.classList.remove('error');container.textContent=deployed?'网站已更新。':'文章已保存，稍后打开网站即可查看。';
    const a=document.createElement('a');a.href=link.href;a.textContent='查看文章 ↗';a.target='_blank';a.rel='noopener noreferrer';container.append(a);
  }
  function insertText(before,after='',placeholder='') {
    if(busy)return;setPreview(false);const input=$('markdown'),start=input.selectionStart,end=input.selectionEnd,selected=input.value.slice(start,end)||placeholder;
    const text=before+selected+after;
    input.setRangeText(text,start,end,'end');input.focus();input.setSelectionRange(start+before.length,start+before.length+selected.length);changed();
  }
  function format(kind){const formats={heading:['\n## ','\n','小标题'],bold:['**','**','加粗文字'],list:['\n- ','\n','列表内容'],quote:['\n> ','\n','引用内容'],code:['\n```\n','\n```\n','在这里粘贴代码'],link:['[','](https://example.com)','链接文字']};if(formats[kind])insertText(...formats[kind]);}
  async function fileType(file) {
    const b=new Uint8Array(await file.slice(0,16).arrayBuffer());
    if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'jpeg';
    if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return 'png';
    if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'webp';
    if(['GIF87a','GIF89a'].includes(String.fromCharCode(...b.slice(0,6))))return 'gif';
    throw new Error('仅支持 JPG、PNG、WebP 和 GIF 图片。');
  }
  async function prepareImage(file) {
    if(file.size>20*1024*1024)throw new Error('单张原图请小于 20 MB。');
    const type=await fileType(file);
    if(type==='gif'){if(file.size>2*1024*1024)throw new Error('GIF 动图请小于 2 MB。');return {blob:new Blob([file],{type:'image/gif'}),extension:'gif'};}
    let image=null,url=null;
    try{
      if(typeof createImageBitmap==='function')image=await createImageBitmap(file);
      else{url=URL.createObjectURL(file);image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('图片无法读取，请换一张图片。'));img.src=url;});}
      const width=image.width||image.naturalWidth,height=image.height||image.naturalHeight;
      if(!width||!height)throw new Error('图片尺寸无效。');
      const ratio=Math.min(1,1920/Math.max(width,height));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
      const context=canvas.getContext('2d');if(!context)throw new Error('浏览器未能处理图片。');context.drawImage(image,0,0,canvas.width,canvas.height);
      let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.85));
      if(blob?.size>2*1024*1024)blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.65));
      if(!blob)throw new Error('图片处理失败，请换一张图片。');
      if(blob.size>2*1024*1024)throw new Error('图片压缩后仍大于 2MB，请缩小尺寸后重新添加。');
      return {blob,extension:blob.type==='image/webp'?'webp':'png'};
    } finally {if(image?.close)image.close();if(url)URL.revokeObjectURL(url);}
  }
  function renderCover(){const source=$('cover').value,preview=$('cover-preview');preview.hidden=!source;$('cover-clear').hidden=!source;if(source){const url=window.BlogArticle.imageUrl(source,imageResolver);if(url&&preview.src!==url)preview.src=url;}else preview.removeAttribute('src');}
  async function addCover(file){if(!file||busy||imageBusy)return;imageBusy=true;$('cover-button').disabled=true;const draftId=current.draftId;try{const {blob,extension}=await prepareImage(file);if(current.draftId!==draftId)throw new Error('文章已切换，请重新选择封面。');const old=$('cover').value;current.images=current.images.filter(i=>i.path!==old||$('markdown').value.includes(i.path));if(current.images.length>=30||current.images.reduce((n,i)=>n+i.blob.size,0)+blob.size>30*1024*1024)throw new Error('图片数量或大小超过草稿限制。');const path=`assets/uploads/${current.post.id}/${uuid()}.${extension}`;current.images.push({path,blob});$('cover').value=path;changed();await saveDraft({quiet:true});status('封面已加入草稿，发布后生效。');}catch(error){status(errorMessage(error),true);}finally{imageBusy=false;$('cover-button').disabled=false;$('cover-input').value='';}}
  window.BlogMedia=Object.freeze({prepareImage});
  $('cover-button').addEventListener('click',()=>$('cover-input').click());$('cover-input').addEventListener('change',()=>void addCover($('cover-input').files[0]));$('cover-clear').addEventListener('click',()=>{$('cover').value='';changed();});
  async function addImages(files) {
    if(busy||imageBusy||!files.length)return;
    if(current.images.length+files.length>30){toast('一篇文章最多暂存 30 张图片，请分篇发布。');return;}
    imageBusy=true;$('image-button').disabled=true;
    const draftId=current.draftId,selection=$('markdown').selectionStart;
    let inserted='',count=0;
    try{
      for(const file of files){
        status(`正在处理图片 ${count+1}/${files.length}…`);
        const {blob,extension}=await prepareImage(file);
        if(current.draftId!==draftId)throw new Error('文章已切换，请重新添加图片。');
        const total=current.images.reduce((sum,item)=>sum+item.blob.size,0)+blob.size;
        if(total>30*1024*1024)throw new Error('待发布图片总计超过 30 MB，请减少图片数量。');
        const path=`assets/uploads/${current.post.id}/${uuid()}.${extension}`;
        current.images.push({path,blob});
        const alt=(file.name||'图片').replace(/\.[^.]+$/,'').replace(/[\[\]()\r\n]/g,' ').trim().slice(0,80)||'图片';
        inserted+=`\n![${alt}](./${path})\n`;count++;
      }
    }catch(error){status(errorMessage(error),true);toast(errorMessage(error));}
    finally{
      if(inserted){const input=$('markdown');input.setRangeText(inserted,selection,selection,'end');changed();await saveDraft({quiet:true});if(count===files.length){status('图片已加入本机草稿，发布时会与文章一起上传。');toast(`已添加 ${count} 张图片`);}}
      imageBusy=false;$('image-button').disabled=false;$('image-input').value='';updateCounts();
    }
  }
  function renderAttachments(){
    const list=$('attachment-list');if(!list)return;
    list.innerHTML=(current?.post.attachments||[]).map((item,index)=>`<li><span><strong>${escapeHTML(item.name)}</strong><small>${window.BlogAttachments.size(item.size)}${current.files?.some(f=>f.path===item.path)?' · 待发布':''}</small></span><button type="button" class="quiet" data-remove-attachment="${index}" aria-label="移除 ${escapeHTML(item.name)}" ${busy?'disabled':''}>移除</button></li>`).join('');
  }
  async function addAttachments(files){
    if(busy||imageBusy||!files.length)return;imageBusy=true;$('attachment-button').disabled=true;
    try{
      current.files??=[];current.post.attachments??=[];
      for(const file of files){
        const name=window.BlogAttachments.name(file.name),ext=name.split('.').pop().toLowerCase();
        if(!name||!window.BlogAttachments.extensions.includes(ext))throw new Error('暂不支持这个文件格式，请选择文档、压缩包、文本或代码。');
        if(!file.size||file.size>window.BlogAttachments.limit)throw new Error('单个附件请控制在 10MB 以内。');
        if(current.post.attachments.length>=10)throw new Error('每篇文章最多添加 10 个附件。');
        if(current.files.reduce((n,f)=>n+f.blob.size,0)+file.size>30*1024*1024)throw new Error('待发布附件总量最多 30MB，请分篇上传。');
        const path=`assets/attachments/${current.post.id}/${uuid()}.${ext}`;
        current.files.push({path,blob:file});current.post.attachments.push({path,name,size:file.size});changed();
      }
      status('附件已加入本机草稿，发布文章后可供读者下载。');
    }catch(error){status(errorMessage(error),true);}
    finally{await saveDraft({quiet:true});imageBusy=false;$('attachment-button').disabled=false;$('attachment-input').value='';renderAttachments();}
  }
  $('attachment-button').addEventListener('click',()=>$('attachment-input').click());
  $('attachment-input').accept=window.BlogAttachments.extensions.map(ext=>'.'+ext).join(',');
  $('attachment-input').addEventListener('change',()=>void addAttachments([...$('attachment-input').files]));
  $('attachment-list').addEventListener('click',event=>{const button=event.target.closest('[data-remove-attachment]');if(!button||busy||imageBusy)return;const [removed]=current.post.attachments.splice(Number(button.dataset.removeAttachment),1);current.files=current.files.filter(f=>f.path!==removed.path);changed();});
  async function disconnect(){
    if(busy||imageBusy)return;await saveDraft({quiet:true});
    try{await client.logout();dirty=false;location.reload();}catch(error){toast(errorMessage(error));}
  }
  function confirmDelete(title='删除本机草稿？',description='这只会删除当前浏览器内的草稿，网站上已发布的文章会保留。',label='删除草稿'){$('confirm-title').textContent=title;$('confirm-description').textContent=description;$('confirm-ok').textContent=label;return new Promise(resolve=>{const dialog=$('confirm-dialog');dialog.showModal();const done=value=>{dialog.close();$('confirm-ok').onclick=null;$('confirm-cancel').onclick=null;dialog.oncancel=null;resolve(value);};$('confirm-ok').onclick=()=>done(true);$('confirm-cancel').onclick=()=>done(false);dialog.oncancel=event=>{event.preventDefault();done(false);};});}
  async function deleteDraft(){if(busy||imageBusy)return;if(!await confirmDelete())return;clearTimeout(saveTimer);if(saving)await saving;try{await store('readwrite',s=>s.delete(current.draftId));dirty=false;setEditor(freshDraft());await refreshDrafts();status('');toast('已删除本机草稿，网站内容保持原样');}catch(error){toast(errorMessage(error));}}
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  async function exportDraft(){
    if(!current)return;
    const saved=snapshot(),title=(saved.post.title||'未命名记录').replace(/[\\/:*?"<>|]/g,'-').slice(0,70);
    const images=[];for(const image of saved.images){const dataURL=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('图片备份失败。'));reader.readAsDataURL(image.blob);});images.push({path:image.path,dataURL});}
    const files=[];for(const file of saved.files||[]){const dataURL=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('附件备份失败。'));reader.readAsDataURL(new Blob([file.blob],{type:'application/octet-stream'}));});files.push({path:file.path,dataURL});}
    download(new Blob([JSON.stringify({format:'incloing-draft-v1',post:saved.post,basePost:saved.basePost,images,files,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),`${title}.incloing.json`);
    download(new Blob([`# ${saved.post.title}\n\n${saved.post.markdown}`],{type:'text/markdown;charset=utf-8'}),`${title}.md`);toast('已导出 Markdown 与含图片和附件的 JSON 备份');
  }
  async function importDraft(file){
    if(!file||!await canSwitch())return;
    try{
      if(file.size>90*1024*1024)throw new Error('备份文件过大，最大支持 90 MB。');
      const backup=JSON.parse(await file.text());
      if(backup?.format!=='incloing-draft-v1'||!backup.post||!Array.isArray(backup.images)||backup.images.length>30)throw new Error('请选择从写作空间导出的 .incloing.json 备份。');
      const post=window.BlogArticle.validateManifest({version:1,revision:'local-backup',posts:[backup.post]}).posts[0];
      post.markdown=window.BlogArticle.toMarkdown(post);delete post.body;post.demo=false;
      if(post.markdown.length>250000||post.tags.length>12||post.excerpt.length>400)throw new Error('备份中的正文、标签或摘要超过写作空间支持的长度。');
      let basePost=null;
      if(backup.basePost){window.BlogArticle.validateManifest({version:1,revision:'local-backup',posts:[backup.basePost]});if(backup.basePost.id!==post.id)throw new Error('备份的文章标识不一致。');basePost=clone(backup.basePost);}
      const images=[],paths=new Set();let total=0;
      for(const image of backup.images){
        const prefix=`assets/uploads/${post.id}/`;
        if(typeof image.path!=='string'||!image.path.startsWith(prefix)||!/^[-a-zA-Z0-9_]{8,96}\.(?:webp|png|jpe?g|gif)$/.test(image.path.slice(prefix.length))||paths.has(image.path))throw new Error('备份中包含无效的图片路径。');
        const matched=typeof image.dataURL==='string'&&/^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(image.dataURL);
        if(!matched)throw new Error('备份中的图片格式不受支持。');
        const decoded=atob(matched[2]),bytes=Uint8Array.from(decoded,c=>c.charCodeAt(0));
        total+=bytes.length;if(bytes.length>8*1024*1024||total>30*1024*1024)throw new Error('备份图片超过大小限制。');
        const blob=new Blob([bytes],{type:`image/${matched[1]}`}),type=await fileType(blob);
        const extension=image.path.split('.').pop();
        if(type!==matched[1]||!(type===extension||(type==='jpeg'&&extension==='jpg'))||(type==='gif'&&blob.size>5*1024*1024))throw new Error('备份中的图片内容与格式不一致，或 GIF 大于 5 MB。');
        images.push({path:image.path,blob});paths.add(image.path);
      }
      const files=[];let fileTotal=0;
      if(backup.files!==undefined&&(!Array.isArray(backup.files)||backup.files.length>10))throw new Error('备份的附件列表无效。');
      for(const item of backup.files||[]){
        const metadata=post.attachments?.find(a=>a.path===item.path),matched=typeof item.dataURL==='string'&&/^data:application\/octet-stream;base64,([A-Za-z0-9+/=]+)$/.exec(item.dataURL);
        if(!metadata||!item.path.startsWith(`assets/attachments/${post.id}/`)||files.some(f=>f.path===item.path)||!matched)throw new Error('附件备份格式无效。');
        const bytes=Uint8Array.from(atob(matched[1]),c=>c.charCodeAt(0));fileTotal+=bytes.length;
        if(bytes.length!==metadata.size||fileTotal>30*1024*1024)throw new Error('附件备份大小无效。');files.push({path:item.path,blob:new Blob([bytes],{type:'application/octet-stream'})});
      }
      const imported={draftId:uuid(),post,basePost,images,files,updatedAt:new Date().toISOString()};
      await store('readwrite',s=>s.put(imported));setEditor(imported);libraryMode='drafts';await refreshDrafts();status('备份已恢复为本机草稿，点击发布才会更新网站。');toast('文章与图片备份已恢复');
    }catch(error){toast(error instanceof SyntaxError?'备份文件不是有效的 JSON。':errorMessage(error));}
    finally{$('import-input').value='';}
  }
  function clickGlass(event){
    const target=event.target.closest('button,a,input,select,textarea');if(!target||target.disabled)return;
    const r=target.getBoundingClientRect(),wave=document.createElement('i');wave.className='glass-wave';
    wave.style.left=`${event.detail===0?r.left+r.width/2:event.clientX}px`;wave.style.top=`${event.detail===0?r.top+r.height/2:event.clientY}px`;
    const dialog=target.closest('dialog[open]');(dialog||$('click-layer')).append(wave);setTimeout(()=>wave.remove(),720);
  }
  for(const name of fields)$(name).addEventListener('input',changed);
  $('article-form').addEventListener('submit',publish);
  $('new-button').addEventListener('click',newArticle);
  $('save-button').addEventListener('click',()=>saveDraft());
  $('export-button').addEventListener('click',()=>exportDraft().catch(error=>toast(errorMessage(error))));
  $('delete-button').addEventListener('click',deleteDraft);
  $('import-button').addEventListener('click',()=>$('import-input').click());
  $('import-input').addEventListener('change',()=>void importDraft($('import-input').files[0]));
  $('preview-button').addEventListener('click',()=>setPreview($('preview-button').getAttribute('aria-pressed')!=='true'));
  document.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>format(button.dataset.format)));
  document.querySelectorAll('[data-library]').forEach(button=>{button.addEventListener('click',()=>{libraryMode=button.dataset.library;renderLibrary();});button.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'drafts':event.key==='End'?'posts':button.dataset.library==='drafts'?'posts':'drafts';document.querySelector(`[data-library="${next}"]`).click();document.querySelector(`[data-library="${next}"]`).focus();}});});
  $('library-list').addEventListener('click',event=>{const entry=event.target.closest('[data-entry]');if(entry)(libraryMode==='drafts'?openDraft(entry.dataset.entry):openPublished(entry.dataset.entry)).catch(error=>toast(errorMessage(error)));});
  $('refresh-button').addEventListener('click',async()=>{if(!client){$('connect-dialog').showModal();return;}$('refresh-button').disabled=true;try{await client.refresh();renderLibrary();toast('已刷新发布列表');}catch(error){toast(errorMessage(error));}finally{$('refresh-button').disabled=false;}});
  $('image-button').addEventListener('click',()=>$('image-input').click());
  $('image-input').addEventListener('change',()=>addImages([...$('image-input').files]));
  $('markdown').addEventListener('paste',event=>{const images=[...event.clipboardData.files].filter(file=>file.type.startsWith('image/'));if(images.length){event.preventDefault();void addImages(images);}});
  const drop=$('drop-area');let dragDepth=0;
  drop.addEventListener('dragenter',event=>{if(event.dataTransfer.types.includes('Files')){event.preventDefault();dragDepth++;drop.classList.add('dragover');}});
  drop.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('Files'))event.preventDefault();});
  drop.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;drop.classList.remove('dragover');}});
  drop.addEventListener('drop',async event=>{event.preventDefault();dragDepth=0;drop.classList.remove('dragover');const files=[...event.dataTransfer.files],images=files.filter(f=>/^image\//.test(f.type));await addImages(images);await addAttachments(files.filter(f=>!images.includes(f)));});
  $('connect-button').addEventListener('click',()=>{$('connect-dialog').showModal();});
  $('disconnect-button').addEventListener('click',()=>void disconnect());
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
  $('connect-dialog').addEventListener('close',()=>{$('current-password').value='';$('new-password').value='';});
  document.addEventListener('click',clickGlass,{capture:true});
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();void saveDraft();}});
  window.addEventListener('beforeunload',event=>{if(dirty||busy||imageBusy){void saveDraft({quiet:true});event.preventDefault();event.returnValue='';}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&dirty)void saveDraft({quiet:true});});
  window.addEventListener('pagehide',()=>{client?.disconnect?.();});
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  window.BlogProfileEditor.init({getClient:()=>client,requestConnect:()=>toast('登录已过期，请刷新后台重新登录。文字会保留在本机。')});
  window.BlogManagement.init({getClient:()=>client,getCurrent:()=>current,confirm:confirmDelete,busy:()=>busy||imageBusy,setBusy,onRemoved:async()=>{clearTimeout(saveTimer);if(saving)await saving;if(current?.basePost&&!client.posts.some(p=>p.id===current.basePost.id)){await store('readwrite',s=>s.delete(current.draftId));dirty=false;setEditor(freshDraft());await refreshDrafts();}renderLibrary();},save:()=>saveDraft({quiet:true}),status,toast});
  $('connect-button').classList.add('is-connected');
  setEditor(freshDraft());
  refreshDrafts().then(()=>{if(drafts.length&&!dirty){setEditor(drafts[0]);saveState('已恢复本机草稿');toast('已恢复最近编辑的草稿');}}).catch(error=>{saveState('本机存储不可用，请导出备份',true);toast(errorMessage(error));});
})();
