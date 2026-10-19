import '../public/lib/attachments.js';
export const rules=globalThis.BlogAttachments;
export async function storeAttachment(db,key,name,bytes,{query,fail}){
 if(!rules.validPath(key)||!name||rules.name(name)!==name||name.split('.').pop().toLowerCase()!==key.split('.').pop()||bytes.length<1||bytes.length>rules.limit)fail('附件格式或大小无效。',400);
 const etag=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 const existing=await query(db,'SELECT etag,name,size FROM attachments WHERE key=?',key).first();
 if(existing){if(existing.etag!==etag||existing.name!==name)fail('同名附件内容不同，请使用新的文件名。',409,'CONFLICT');return {path:key,name,size:existing.size};}
 const commands=[query(db,'INSERT INTO attachments(key,name,size,etag,created) SELECT ?,?,?,?,? WHERE (SELECT COALESCE(SUM(size),0) FROM images)+(SELECT COALESCE(SUM(size),0) FROM attachments)+?<=?',key,name,bytes.length,etag,Date.now(),bytes.length,200*1024*1024)];
 for(let offset=0,part=0;offset<bytes.length;offset+=256*1024,part++)commands.push(query(db,'INSERT INTO attachment_chunks(key,part,data) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM attachments WHERE key=?)',key,part,bytes.slice(offset,offset+256*1024).buffer,key));
 const result=await db.batch(commands);if(result[0].meta.changes!==1)fail('文件空间已满，请先导出备份。',413,'STORAGE');return {path:key,name,size:bytes.length};
}
export async function checkAttachments(db,posts,{query,fail}){
 const items=posts.flatMap(p=>p.attachments||[]);if(!items.length)return;
 const {results}=await query(db,'SELECT key,name,size FROM attachments WHERE key IN (SELECT value FROM json_each(?))',JSON.stringify([...new Set(items.map(a=>a.path))])).all(),known=new Map(results.map(r=>[r.key,r]));
 for(const item of items){const row=known.get(item.path);if(!row||row.size!==item.size||row.name!==item.name)fail('附件尚未上传完成，请保留草稿后重试。',409,'ATTACHMENT');}
}
