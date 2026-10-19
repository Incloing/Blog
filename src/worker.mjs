import {handleSync} from './sync.mjs';
import {rules,storeAttachment,checkAttachments} from './attachments.mjs';
const encoder=new TextEncoder(),DAY=86400000;
const json=(value,status=200,extra={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
class ApiError extends Error{constructor(message,status=400,code='VALIDATION'){super(message);this.status=status;this.code=code;}}
const fail=(message,status=400,code)=>{throw new ApiError(message,status,code);};
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const hex=bytes=>Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
const unhex=value=>Uint8Array.from(value.match(/../g)||[],n=>parseInt(n,16));
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const digest=async text=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text))));
const cookie=(request,name)=>request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';
const local=request=>['localhost','127.0.0.1','[::1]'].includes(new URL(request.url).hostname);
const sessionName=request=>local(request)?'incloing_session':'__Host-incloing_session';
const cookieValue=(request,name,value,age)=>`${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${local(request)?'':'; Secure'}`;
const query=(db,sql,...values)=>db.prepare(sql).bind(...values);
function originCheck(request){
 if(new URL(request.url).protocol!=='https:'&&!local(request))fail('请使用 HTTPS 访问后台。',400);
 const origin=request.headers.get('Origin'),url=new URL(request.url),publicWrite=['/api/comments','/api/metrics/view'].includes(url.pathname);
 if(origin!==url.origin&&!(publicWrite&&origin==='https://incloing.github.io'))fail('请求来源不正确。',403,'ORIGIN');
}
async function body(request,max=1100000){
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))fail('请求格式不正确。',415);
 const bytes=await boundedBytes(request,max);
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail('请求内容不是有效的 JSON。');}
}
async function boundedBytes(request,max){
 const length=Number(request.headers.get('Content-Length')||0);if(length>max)fail('上传内容过大。',413);
 if(!request.body)return new Uint8Array();const reader=request.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();fail('上传内容过大。',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
async function limit(db,request,kind,max,period){
 const ip=request.headers.get('CF-Connecting-IP')||(local(request)?'local':'unknown'),window=Math.floor(Date.now()/period);
 const key=kind+':'+await digest(ip+':'+window);
 const result=await query(db,'INSERT INTO limits(key,hits,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits',key,Date.now()+period).first();
 if(result.hits>max)fail('操作过于频繁，请稍后再试。',429,'RATE_LIMIT');
}
async function passwordMatches(password,admin){
 if(typeof password!=='string'||password.length<1||password.length>128||!admin)return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(admin.salt),iterations:admin.iterations},key,256)),expected=unhex(admin.verifier);
 let mismatch=actual.length^expected.length;for(let i=0;i<actual.length;i++)mismatch|=actual[i]^(expected[i]||0);actual.fill(0);return mismatch===0;
}
async function issueSession(request,db){
 const token=random(),csrf=random(),expires=Date.now()+30*DAY;
 await query(db,'INSERT INTO sessions(id,csrf,expires) VALUES(?,?,?)',await digest(token),csrf,expires).run();
 return {csrf,expires,header:cookieValue(request,sessionName(request),token,30*86400)};
}
async function session(request,db,write=false){
 const token=cookie(request,sessionName(request));if(!/^[a-f0-9]{64}$/.test(token))fail('登录已过期，请重新输入后台密码。',401,'AUTH');
 const item=await query(db,'SELECT id,csrf,expires FROM sessions WHERE id=? AND expires>?',await digest(token),Date.now()).first();
 if(!item)fail('登录已过期，请重新输入后台密码。',401,'AUTH');
 if(write&&request.headers.get('X-CSRF-Token')!==item.csrf)fail('登录校验已更新，请刷新后台后重试。',403,'CSRF');
 return item;
}
async function document(db){const result=await db.batch([query(db,'SELECT revision,value FROM document WHERE id=1'),query(db,'SELECT value FROM posts ORDER BY id')]),row=result[0].results[0];if(!row)fail('网站内容尚未导入，请完成首次部署。',503,'SETUP');return {revision:row.revision,value:{...JSON.parse(row.value),posts:result[1].results.map(p=>JSON.parse(p.value))}};}
async function save(db,snapshot,value){
 const revision=crypto.randomUUID();value.revision=revision;
 const {posts,...metadata}=value,old=new Map(snapshot.value.posts.map(p=>[p.id,p])),next=new Map(posts.map(p=>[p.id,p]));
 const commands=[query(db,'UPDATE document SET revision=?,value=? WHERE id=1 AND revision=?',revision,JSON.stringify(metadata),snapshot.revision)];
 for(const [id] of old)if(!next.has(id))commands.push(query(db,'DELETE FROM posts WHERE id=? AND EXISTS(SELECT 1 FROM document WHERE id=1 AND revision=?)',id,revision));
 for(const [id,p] of next)if(stable(p)!==stable(old.get(id)))commands.push(query(db,'INSERT INTO posts(id,value) SELECT ?,? WHERE EXISTS(SELECT 1 FROM document WHERE id=1 AND revision=?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',id,JSON.stringify(p),revision));
 if(commands.length>40)fail('本次修改文章过多，请分批操作。');const result=await db.batch(commands);
 if(result[0].meta.changes!==1)fail('保存期间出现其他修改，请保留草稿后重试。',409,'CONFLICT');return revision;
}
function text(value,max,label,optional=false){if(typeof value!=='string')fail(label+'应为文字。');const result=value.trim();if((!optional&&!result)||result.length>max)fail(label+'为空或超过长度限制。');return result;}
function profile(value){
 if(!value||typeof value!=='object')fail('个人资料格式不正确。');
 const result={school:text(value.school??'',100,'学校',true),major:text(value.major??'',100,'专业',true),qq:text(value.qq??'',12,'QQ 号',true),bio:text(value.bio??'',3000,'个人简介',true).replace(/\r\n?/g,'\n')};
 if(result.qq&&!/^[1-9]\d{4,11}$/.test(result.qq))fail('QQ 号格式不正确。');result.rewardQr=imagePath(value.rewardQr);return result;
}
function imagePath(value){if(value===undefined||value==='')return '';if(typeof value!=='string'||!/^assets\/uploads\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)$/.test(value))fail('图片路径无效。');return value;}
function post(value,base){
 if(!value||!/^[a-z0-9][a-z0-9_-]{0,95}$/.test(value.id)||!['notes','projects','life'].includes(value.category))fail('文章标识或分类无效。');
 const title=text(value.title,160,'标题'),markdown=text(value.markdown,250000,'正文'),date=text(value.date,10,'日期');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)fail('文章日期无效。');
 if(!Array.isArray(value.tags)||value.tags.length>12||value.tags.some(tag=>typeof tag!=='string'||tag.length>40))fail('标签格式或长度不正确。');
 if(/!\[[^\]]*\]\(\s*<?(?:blob:|data:)/i.test(markdown))fail('请使用上传按钮添加图片，正文仍包含临时图片。');
 let attachments;try{attachments=rules.normalize(value.attachments);}catch(error){fail(error.message);}
 const now=new Date().toISOString();return {...(attachments.length?{attachments}:{}),id:value.id,title,markdown,category:value.category,date,tags:[...new Set(value.tags.map(t=>t.trim()).filter(Boolean))],excerpt:text(value.excerpt??'',400,'摘要',true),cover:imagePath(value.cover),demo:false,createdAt:base?.createdAt||now,updatedAt:now};
}
function samePost(snapshot,id,base){const existing=snapshot.value.posts.find(item=>item.id===id);if(base?(!existing||base.id!==id||stable(base)!==stable(existing)):Boolean(existing))fail('这篇文章已被修改，请先保留草稿，再刷新线上文章。',409,'CONFLICT');return existing;}
function imageType(bytes){
 if(bytes.length>=12&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return ['png','image/png'];
 if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return ['jpg','image/jpeg'];
 const start=new TextDecoder().decode(bytes.slice(0,12));if(start.startsWith('GIF87a')||start.startsWith('GIF89a'))return ['gif','image/gif'];if(start.startsWith('RIFF')&&start.slice(8,12)==='WEBP')return ['webp','image/webp'];
 fail('只支持真实的 PNG、JPEG、WebP 或 GIF 图片。',415,'IMAGE');
}
async function metrics(db){return query(db,'SELECT views+(SELECT COUNT(*) FROM view_events) AS views, visitors+(SELECT COUNT(*) FROM visits) AS visitors FROM metrics WHERE id=1').first();}
async function handle(request,env,ctx){
 const url=new URL(request.url),path=url.pathname,db=env.DB;
 if(path==='/api/sync/status'&&request.method==='GET'){await session(request,db);const row=await query(db,"SELECT value FROM sync_state WHERE key='last'").first();return json({configured:Boolean(env.CONTENT_SYNC_TOKEN),last:row?JSON.parse(row.value):null,repository:'https://github.com/Incloing/Blog'});}
 if(path.startsWith('/api/sync/'))return handleSync(request,env,{json,fail,digest,query,document,save,profile,post,imageType,boundedBytes,stable,metrics});
 if(path==='/content/posts.json'&&['GET','HEAD'].includes(request.method)){const value=(await document(db)).value;return request.method==='HEAD'?new Response(null,{headers:{'Cache-Control':'no-store'}}):json(value);}
 if(path.startsWith('/assets/uploads/')&&['GET','HEAD'].includes(request.method)){
  const key=decodeURIComponent(path.slice(1));if(!/^assets\/uploads\/[a-z0-9_-]+\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)$/.test(key))return new Response('Not found',{status:404});
  const image=await query(db,'SELECT mime,size,etag FROM images WHERE key=?',key).first();if(!image)return env.ASSETS.fetch(request);
  const headers={'Content-Type':image.mime,'Content-Length':String(image.size),'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff','ETag':'"'+image.etag+'"'};
  if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
  if(request.method==='HEAD')return new Response(null,{headers});
  const {results}=await query(db,'SELECT data FROM image_chunks WHERE key=? ORDER BY part',key).all(),bytes=new Uint8Array(image.size);let offset=0;
  for(const row of results){const chunk=new Uint8Array(row.data);bytes.set(chunk,offset);offset+=chunk.length;}if(offset!==image.size)fail('图片暂时无法读取。',503);
  return new Response(bytes,{headers});
 }
 if(path.startsWith('/assets/attachments/')&&['GET','HEAD'].includes(request.method)){
  const key=decodeURIComponent(path.slice(1));if(!rules.validPath(key))return new Response('Not found',{status:404});
  const file=await query(db,'SELECT name,size,etag FROM attachments WHERE key=?',key).first();if(!file)return new Response('Not found',{status:404});
  const published=await query(db,"SELECT 1 FROM posts,json_each(posts.value,'$.attachments') AS a WHERE json_extract(a.value,'$.path')=? LIMIT 1",key).first();
  if(!published){try{await session(request,db);}catch{return new Response('Not found',{status:404});}}
  const headers={'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename=download."+key.split('.').pop()+"; filename*=UTF-8''"+encodeURIComponent(file.name).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16)),'Content-Length':String(file.size),'Cache-Control':published?'public,max-age=0,must-revalidate':'private,no-store','X-Content-Type-Options':'nosniff','ETag':'"'+file.etag+'"'};
  if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
  if(request.method==='HEAD')return new Response(null,{headers});
  const {results}=await query(db,'SELECT data FROM attachment_chunks WHERE key=? ORDER BY part',key).all(),bytes=new Uint8Array(file.size);let offset=0;
  for(const row of results){const chunk=new Uint8Array(row.data);bytes.set(chunk,offset);offset+=chunk.length;}if(offset!==file.size)fail('附件暂时无法读取。',503);
  return new Response(bytes,{headers});
 }
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(request.method==='OPTIONS')return new Response(null,{status:405});
 if(request.method!=='GET')originCheck(request);
 if(path==='/api/auth/login'&&request.method==='POST'){
  await limit(db,request,'login',8,10*60000);const data=await body(request,1024),admin=await query(db,'SELECT salt,verifier,iterations FROM admin WHERE id=1').first();
  if(!admin)fail('后台尚未初始化。',503,'SETUP');if(!await passwordMatches(data.password,admin))fail('密码不正确。',401,'PASSWORD');
  const old=cookie(request,sessionName(request));if(old)await query(db,'DELETE FROM sessions WHERE id=?',await digest(old)).run();
  const issued=await issueSession(request,db);ctx?.waitUntil?.(db.batch([query(db,'DELETE FROM sessions WHERE expires<?',Date.now()),query(db,'DELETE FROM limits WHERE expires<?',Date.now())]));
  return json({csrf:issued.csrf,expires:issued.expires},200,{'Set-Cookie':issued.header});
 }
 if(path==='/api/auth/session'&&request.method==='GET'){const item=await session(request,db);return json({csrf:item.csrf,expires:item.expires});}
 if(path==='/api/auth/logout'&&request.method==='POST'){const item=await session(request,db,true);await query(db,'DELETE FROM sessions WHERE id=?',item.id).run();return json({ok:true},200,{'Set-Cookie':cookieValue(request,sessionName(request),'',0)});}
 if(path==='/api/auth/password'&&request.method==='POST'){
  await session(request,db,true);await limit(db,request,'password',6,10*60000);const data=await body(request,1024),admin=await query(db,'SELECT salt,verifier,iterations FROM admin WHERE id=1').first();
  if(!await passwordMatches(data.currentPassword,admin))fail('当前密码不正确。',401,'PASSWORD');
  const password=text(data.newPassword,128,'新密码');if(password.length<6)fail('新密码至少需要 6 位。');
  const salt=hex(crypto.getRandomValues(new Uint8Array(16))),iterations=100000,key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const verifier=hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(salt),iterations},key,256)));
  const result=await query(db,'UPDATE admin SET salt=?,verifier=?,iterations=? WHERE id=1 AND verifier=?',salt,verifier,iterations,admin.verifier).run();if(result.meta.changes!==1)fail('密码刚刚被修改，请重新登录。',409,'CONFLICT');
  await query(db,'DELETE FROM sessions').run();return json({ok:true},200,{'Set-Cookie':cookieValue(request,sessionName(request),'',0)});
 }
 if(path==='/api/writer'&&request.method==='GET'){await session(request,db);return json((await document(db)).value);}
 if(path==='/api/posts'&&request.method==='POST'){
  await session(request,db,true);const data=await body(request),snapshot=await document(db),published=post(data.post,data.basePost);samePost(snapshot,published.id,data.basePost);await checkAttachments(db,[published],{query,fail});
  const posts=[published,...snapshot.value.posts.filter(p=>p.id!==published.id)],revision=await save(db,snapshot,{...snapshot.value,posts});return json({post:published,posts,revision});
 }
 if(path==='/api/posts/delete'&&request.method==='POST'){
  await session(request,db,true);const data=await body(request),snapshot=await document(db);if(!data.basePost)fail('请先载入线上文章。');samePost(snapshot,data.id,data.basePost);
  const posts=snapshot.value.posts.filter(p=>p.id!==data.id),revision=await save(db,snapshot,{...snapshot.value,posts});return json({posts,revision});
 }
 if(path==='/api/posts/delete-examples'&&request.method==='POST'){
  await session(request,db,true);const data=await body(request,1024),snapshot=await document(db);if(data.revision!==snapshot.revision)fail('文章列表有变化，请刷新后再次清理。',409,'CONFLICT');
  const posts=snapshot.value.posts.filter(p=>p.demo!==true),removed=snapshot.value.posts.length-posts.length,revision=await save(db,snapshot,{...snapshot.value,posts});return json({posts,removed,revision});
 }
 if(path==='/api/profile'&&request.method==='POST'){
  await session(request,db,true);const data=await body(request,20000),snapshot=await document(db),value=profile(data.profile);
  if(stable(profile(snapshot.value.profile||{school:'东北林业大学',major:'人工智能',qq:'3468692947',bio:''}))!==stable(profile(data.baseProfile)))fail('个人简介已在别处修改，请先保留文字再载入线上资料。',409,'CONFLICT');
  const revision=await save(db,snapshot,{...snapshot.value,profile:value,profileUpdatedAt:new Date().toISOString()});return json({profile:value,revision});
 }
 if(path==='/api/attachments'&&request.method==='POST'){
  await session(request,db,true);await limit(db,request,'attachment',20,60000);
  const id=request.headers.get('X-Post-Id');if(!/^[a-z0-9][a-z0-9_-]{0,95}$/.test(id||''))fail('附件所属文章无效。');
  let name;try{name=decodeURIComponent(request.headers.get('X-File-Name')||'');}catch{fail('附件名称无效。');}
  const ext=name.split('.').pop().toLowerCase();if(!rules.extensions.includes(ext)||rules.name(name)!==name||!name)fail('不支持此附件格式或名称。',415);
  const bytes=await boundedBytes(request,rules.limit),key=`assets/attachments/${id}/${crypto.randomUUID()}.${ext}`;
  return json(await storeAttachment(db,key,name,bytes,{query,fail}),201);
 }
 if(path==='/api/images'&&request.method==='POST'){
  await session(request,db,true);await limit(db,request,'image',60,60000);const id=request.headers.get('X-Post-Id');if(!/^[a-z0-9][a-z0-9_-]{0,95}$/.test(id||''))fail('图片所属文章无效。');
  const bytes=await boundedBytes(request,2*1024*1024),[ext,mime]=imageType(bytes),key=`assets/uploads/${id}/${crypto.randomUUID()}.${ext}`,etag=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
  // Each BLOB stays below D1's row limit; the metadata insert reserves quota atomically.
  const commands=[query(db,'INSERT INTO images(key,mime,size,etag,created) SELECT ?,?,?,?,? WHERE (SELECT COALESCE(SUM(size),0) FROM images)+(SELECT COALESCE(SUM(size),0) FROM attachments)+?<=?',key,mime,bytes.length,etag,Date.now(),bytes.length,200*1024*1024)];
  for(let offset=0,part=0;offset<bytes.length;offset+=256*1024,part++)commands.push(query(db,'INSERT INTO image_chunks(key,part,data) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM images WHERE key=?)',key,part,bytes.slice(offset,offset+256*1024).buffer,key));
  const results=await db.batch(commands);if(results[0].meta.changes!==1)fail('当前图片空间已用满，请先导出备份，再联系站点维护者扩容。',413,'STORAGE');return json({path:key,size:bytes.length},201);
 }
 if(path==='/api/storage'&&request.method==='GET'){await session(request,db);const row=await query(db,'SELECT (SELECT COALESCE(SUM(size),0) FROM images)+(SELECT COALESCE(SUM(size),0) FROM attachments) AS used,(SELECT COUNT(*) FROM images) AS images,(SELECT COUNT(*) FROM attachments) AS attachments').first();return json({...row,limit:200*1024*1024,singleImageLimit:2*1024*1024,singleAttachmentLimit:rules.limit});}
 if(path==='/api/comments'&&request.method==='GET'){
  const before=Number(url.searchParams.get('before')||Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)fail('留言分页参数无效。');
  const {results}=await query(db,'SELECT id,name,body,created_at FROM comments WHERE id<? ORDER BY id DESC LIMIT 21',before).all(),items=results.slice(0,20);return json({comments:items,next:results.length>20?items.at(-1).id:null});
 }
 if(path==='/api/comments'&&request.method==='POST'){
  const data=await body(request,16000);if(data.website)fail('留言未提交，请稍后再试。');await limit(db,request,'comment',3,10*60000);
  const name=text(data.name,40,'昵称'),message=text(data.message,2000,'留言'),created=new Date().toISOString();
  const comment=await query(db,'INSERT INTO comments(name,body,created_at) VALUES(?,?,?) RETURNING id,name,body,created_at',name,message,created).first();return json({comment},201);
 }
 if(path==='/api/comments/delete'&&request.method==='POST'){
  await session(request,db,true);const data=await body(request,1024);if(!Number.isSafeInteger(data.id)||data.id<1)fail('留言标识无效。');await query(db,'DELETE FROM comments WHERE id=?',data.id).run();return json({ok:true});
 }
 if(path==='/api/metrics'&&request.method==='GET')return json(await metrics(db));
 if(path==='/api/metrics/view'&&request.method==='POST'){
  await limit(db,request,'view',120,60000);const data=await body(request,1024);if(!/^[a-zA-Z0-9-]{16,80}$/.test(data.eventId||''))fail('浏览标识无效。');
  let visitor=cookie(request,'incloing_visitor');if(!/^[a-f0-9]{64}$/.test(visitor))visitor=/^[a-f0-9]{64}$/.test(data.visitor||'')?data.visitor:random();const id=await digest(visitor),now=Date.now();
  await db.batch([query(db,'INSERT OR IGNORE INTO visits(id,last_seen) VALUES(?,?)',id,now),query(db,'INSERT OR IGNORE INTO view_events(id,created) VALUES(?,?)',data.eventId,now)]);
  return json(await metrics(db),200,{'Set-Cookie':cookieValue(request,'incloing_visitor',visitor,365*86400)});
 }
 fail('没有找到这个接口。',404,'NOT_FOUND');
}
export default {async fetch(request,env,ctx){
 const publicCors=request.headers.get('Origin')==='https://incloing.github.io'&&['/api/comments','/api/metrics','/api/metrics/view','/content/posts.json'].includes(new URL(request.url).pathname);
 const cors={'Access-Control-Allow-Origin':'https://incloing.github.io','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
 if(publicCors&&request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 let response;try{response=await handle(request,env,ctx);}catch(error){response=error instanceof ApiError?json({error:error.message,code:error.code},error.status):json({error:'服务暂时未能完成请求，请稍后再试。',code:'SERVER'},503);}
 if(publicCors){response=new Response(response.body,response);for(const [key,value] of Object.entries(cors))response.headers.set(key,value);}return response;
}};
export {passwordMatches,post,profile,imageType};
