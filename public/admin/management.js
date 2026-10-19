(() => {
 'use strict';
 window.BlogManagement={init({getClient,getCurrent,confirm,busy,setBusy,onRemoved,save,status,toast}){
  const $=id=>document.getElementById(id);let next=null,commentsBusy=false,ownerPosting=false;
  async function storage(){try{const result=await getClient().request('storage');$('storage-state').textContent=`文件空间 ${(result.used/1024/1024).toFixed(1)} / ${result.limit/1024/1024} MB · 图片 2MB · 附件 10MB`;}catch{$('storage-state').textContent='暂时无法读取文件空间';}}
  void storage();window.addEventListener('incloing:uploaded',()=>void storage());
  const sync=document.createElement('p');sync.className='storage-state';sync.id='github-sync-state';$('storage-state').after(sync);
  getClient().request('sync/status').then(value=>{const text=document.createElement('span');text.textContent=value.last?'GitHub 快照更新于 '+new Date(value.last.at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):value.configured?'GitHub 定时同步已配置':'GitHub 同步准备中';const link=document.createElement('a');link.href='https://github.com/Incloing/Blog/actions/workflows/blog.yml';link.target='_blank';link.rel='noopener noreferrer';link.textContent=' 查看同步 / 手动运行 ↗';sync.append(text,document.createElement('br'),link);}).catch(()=>{sync.textContent='暂时无法读取 GitHub 同步状态。';});
  $('delete-post-button').addEventListener('click',async()=>{
   const post=getCurrent()?.basePost;if(!post||busy())return;
   if(!await confirm('删除这篇已发布文章？','“'+post.title+'”将从网站移除。删除后可通过你导出的备份恢复。','删除文章'))return;
   await save();setBusy(true);try{await getClient().remove(post);await onRemoved();status('文章已从网站删除。');}catch(error){status(error.message,true);}finally{setBusy(false);}
  });
  $('examples-button').addEventListener('click',async()=>{
   if(busy())return;const client=getClient();try{await client.refresh();}catch(error){toast(error.message);return;}
   const count=client.posts.filter(p=>p.demo===true).length;if(!count){toast('没有需要清理的示例文章');return;}
   if(!await confirm('清理 '+count+' 篇示例文章？','仅移除标记为示例的文章，你已发布的正式文章和个人资料会保留。','清理示例'))return;
   await save();setBusy(true);try{const result=await client.removeExamples();await onRemoved();status('已清理 '+result.removed+' 篇示例文章。');}catch(error){status(error.message,true);}finally{setBusy(false);}
  });
  function messageElement(item){
   const article=document.createElement('article');article.className='managed-comment';const name=document.createElement('strong'),body=document.createElement('p'),date=document.createElement('time'),button=document.createElement('button');
   name.textContent=item.name;body.textContent=item.body;date.textContent=new Date(item.created_at).toLocaleString('zh-CN');button.type='button';button.className='quiet danger';button.textContent='删除留言';
   button.addEventListener('click',async()=>{if(!await confirm('删除这条留言？','留言删除后，将不再在网站上显示。','删除留言'))return;button.disabled=true;try{await getClient().request('comments/delete',{id:item.id});article.remove();}catch(error){$('admin-comments-status').textContent=error.message;button.disabled=false;}});
   const pin=document.createElement('button'),actions=document.createElement('div');actions.className='managed-comment-actions';pin.type='button';pin.className='quiet';
   function paintPin(){pin.textContent=item.pinned?'取消置顶':'置顶留言';pin.setAttribute('aria-pressed',String(Boolean(item.pinned)));name.textContent=item.name+(item.is_owner?' · 站主':'')+(item.pinned?' · 置顶':'');}
   pin.addEventListener('click',async()=>{if(commentsBusy||ownerPosting)return;pin.disabled=true;try{const result=await getClient().request('comments/pin',{id:item.id,pinned:!item.pinned});item=result.comment;paintPin();await load();}catch(error){$('admin-comments-status').textContent=error.message;}finally{pin.disabled=false;}});
   paintPin();actions.append(pin,button);article.append(name,date,body,actions);return article;
  }
  async function load(more=false){if(commentsBusy)return;commentsBusy=true;$('admin-comments-status').textContent='正在读取留言…';
   try{const result=await getClient().request('comments'+(more&&next?'?before='+next:''));if(!more)$('admin-comments').replaceChildren();for(const item of result.comments)$('admin-comments').append(messageElement(item));next=result.next;$('admin-comments-more').hidden=!next;$('admin-comments-status').textContent=$('admin-comments').children.length?'':'还没有留言。';}
   catch(error){$('admin-comments-status').textContent=error.message;}finally{commentsBusy=false;}
  }
  $('owner-comment-form').addEventListener('submit',async event=>{
   event.preventDefault();if(commentsBusy||ownerPosting||busy())return;const input=$('owner-comment-message'),button=$('owner-comment-submit'),message=input.value.trim();if(!message)return;ownerPosting=true;button.disabled=true;$('admin-comments-status').textContent='正在发布站主留言…';
   try{await getClient().request('comments',{message});input.value='';await load();$('admin-comments-status').textContent='站主留言已发布并置顶。';}
   catch(error){$('admin-comments-status').textContent=error.message;}finally{ownerPosting=false;button.disabled=false;}
  });
  $('comments-open').addEventListener('click',()=>{$('comments-dialog').showModal();void load();});$('admin-comments-more').addEventListener('click',()=>void load(true));
  $('password-form').addEventListener('submit',async event=>{
   event.preventDefault();if(busy())return;$('password-submit').disabled=true;$('password-status').textContent='';let currentPassword=$('current-password').value,newPassword=$('new-password').value;$('current-password').value='';$('new-password').value='';
   try{await save();await getClient().request('auth/password',{currentPassword,newPassword});currentPassword='';newPassword='';location.reload();}
   catch(error){$('password-status').textContent=error.message;}finally{currentPassword='';newPassword='';$('password-submit').disabled=false;}
  });
 }};
})();
