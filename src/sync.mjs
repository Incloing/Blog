/* GitHub gets only an explicit public snapshot. This token cannot access admin or sessions. */
export async function handleSync(request,env,h){
 const {json,fail,digest,query,document,save,profile,post,imageType,boundedBytes,stable,metrics}=h,db=env.DB,url=new URL(request.url);
 if(url.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))fail('同步必须通过 HTTPS。',400);
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');
 if(!env.CONTENT_SYNC_TOKEN)fail('GitHub 同步尚未配置。',503,'SYNC_SETUP');
 if(!token||await digest(token)!==await digest(env.CONTENT_SYNC_TOKEN))fail('同步授权无效。',401,'SYNC_AUTH');
 const path=url.pathname;
 if(path==='/api/sync/export'&&request.method==='GET'){
  const snapshot=(await document(db)).value,manifest={version:1,revision:snapshot.revision,posts:snapshot.posts,profile:profile(snapshot.profile||{})};
  if(snapshot.profileUpdatedAt)manifest.profileUpdatedAt=snapshot.profileUpdatedAt;
  const {results:comments}=await query(db,'SELECT id,name,body,created_at FROM comments ORDER BY id LIMIT 5001').all();
  if(comments.length>5000)fail('留言数量超过单次快照限制，请分批导出。',413);
  const paths=new Set();for(const p of manifest.posts){if(p.cover)paths.add(p.cover);for(const match of (p.markdown||'').matchAll(/assets\/uploads\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)/g))paths.add(match[0]);}if(manifest.profile.rewardQr)paths.add(manifest.profile.rewardQr);
  const images=[];for(const key of paths){const row=await query(db,'SELECT key,mime,size,etag FROM images WHERE key=?',key).first();if(row){images.push(row);continue;}
   const response=await env.ASSETS.fetch(new Request(new URL('/'+key,url)));if(!response.ok)continue;const bytes=new Uint8Array(await response.arrayBuffer());images.push({key,mime:response.headers.get('Content-Type'),size:bytes.length,etag:await crypto.subtle.digest('SHA-256',bytes).then(b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join(''))});
  }
  return json({manifest,comments,metrics:await metrics(db),images});
 }
 if(path==='/api/sync/import'&&request.method==='POST'){
  const data=JSON.parse(new TextDecoder().decode(await boundedBytes(request,2*1024*1024))),snapshot=await document(db);
  if(data.baseRevision!==snapshot.revision)fail('网站已更新，请重新读取并合并后再同步。',409,'CONFLICT');
  if(!Array.isArray(data.posts)||data.posts.length>5000)fail('同步文章格式无效。');const ids=new Set(),existing=new Map(snapshot.value.posts.map(p=>[p.id,p]));
  const comparable=p=>({id:p.id,title:p.title,category:p.category,date:p.date,tags:p.tags,excerpt:p.excerpt||'',cover:p.cover||'',markdown:p.markdown,body:p.body,demo:p.demo===true,pinned:p.pinned===true});
  const posts=data.posts.map(value=>{if(!value||ids.has(value.id))fail('同步文章标识重复。');ids.add(value.id);const old=existing.get(value.id);if(old&&stable(comparable(old))===stable(comparable(value)))return old;
   let markdown=value.markdown;if(typeof markdown!=='string'&&Array.isArray(value.body))markdown=value.body.map(s=>`${s.heading?'## '+s.heading+'\n\n':''}${s.text||''}`).join('\n\n');return post({...value,markdown},old);
  });
  const nextProfile=profile(data.profile),unchanged=stable(posts)===stable(snapshot.value.posts)&&stable(nextProfile)===stable(profile(snapshot.value.profile));
  const revision=unchanged?snapshot.revision:await save(db,snapshot,{...snapshot.value,posts,profile:nextProfile,profileUpdatedAt:stable(nextProfile)===stable(profile(snapshot.value.profile))?snapshot.value.profileUpdatedAt:new Date().toISOString()});
  return json({revision,changed:!unchanged});
 }
 if(path==='/api/sync/images'&&request.method==='POST'){
  const key=request.headers.get('X-Image-Key');if(!/^assets\/uploads\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)$/.test(key||''))fail('同步图片路径无效。');
  const bytes=await boundedBytes(request,2*1024*1024),[ext,mime]=imageType(bytes),extension=key.split('.').pop().toLowerCase();if(extension!==ext&&!(ext==='jpg'&&extension==='jpeg'))fail('图片内容与扩展名不一致。',415);
  const etag=await crypto.subtle.digest('SHA-256',bytes).then(b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('')),existing=await query(db,'SELECT etag FROM images WHERE key=?',key).first();
  if(existing){if(existing.etag!==etag)fail('同名图片内容不同，请使用新的文件名。',409,'CONFLICT');return json({path:key,unchanged:true});}
  const commands=[query(db,'INSERT INTO images(key,mime,size,etag,created) SELECT ?,?,?,?,? WHERE (SELECT COALESCE(SUM(size),0) FROM images)+?<=?',key,mime,bytes.length,etag,Date.now(),bytes.length,200*1024*1024)];
  for(let offset=0,part=0;offset<bytes.length;offset+=256*1024,part++)commands.push(query(db,'INSERT INTO image_chunks(key,part,data) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM images WHERE key=?)',key,part,bytes.slice(offset,offset+256*1024).buffer,key));
  const result=await db.batch(commands);if(result[0].meta.changes!==1)fail('图片空间已满。',413,'STORAGE');return json({path:key},201);
 }
 if(path==='/api/sync/ack'&&request.method==='POST'){
  const data=JSON.parse(new TextDecoder().decode(await boundedBytes(request,2048)));if(typeof data.revision!=='string'||data.revision.length>200||!/^[a-f0-9]{40}$/.test(data.commit||''))fail('同步确认格式无效。');
  const value={revision:data.revision,commit:data.commit,at:new Date().toISOString()};await query(db,"INSERT INTO sync_state(key,value) VALUES('last',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify(value)).run();return json({ok:true});
 }
 fail('同步接口不存在。',404);
}
