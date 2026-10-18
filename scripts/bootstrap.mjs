// Generate idempotent import SQL outside the public directory. Password is stdin only.
import fs from 'node:fs';import path from 'node:path';import {randomBytes,pbkdf2Sync} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(root,'data/seed.json'),'utf8')),metadata=JSON.parse(fs.readFileSync(path.join(root,'data/export-metadata.json'),'utf8')),comments=JSON.parse(fs.readFileSync(path.join(root,'data/guestbook.json'),'utf8'));
let input='';for await(const chunk of process.stdin)input+=chunk;const password=input.trim();input='';if(!password||password.length>128)throw new Error('Password required through stdin.');
const salt=randomBytes(16),verifier=pbkdf2Sync(password,salt,100000,32,'sha256');
const sql=value=>"'"+String(value).replaceAll("'","''")+"'";
seed.profile??={school:'东北林业大学',major:'人工智能',qq:'3468692947',bio:''};
seed.revision='migration-'+metadata.sourceCommit;
const {posts,...document}=seed;
const lines=[`INSERT OR IGNORE INTO document(id,revision,value) VALUES(1,${sql(seed.revision)},${sql(JSON.stringify(document))});`,`INSERT OR IGNORE INTO admin(id,salt,verifier,iterations) VALUES(1,${sql(salt.toString('hex'))},${sql(verifier.toString('hex'))},100000);`];
for(const post of posts)lines.push(`INSERT OR IGNORE INTO posts(id,value) VALUES(${sql(post.id)},${sql(JSON.stringify(post))});`);
// Retain only known real historical counters; unknown counts stay 0 with provenance.
const known=metadata.metricsReadOnlySnapshot||{};lines.push(`UPDATE metrics SET views=${Number.isSafeInteger(known.views)?known.views:0},visitors=${Number.isSafeInteger(known.visitors)?known.visitors:0} WHERE id=1 AND views=0 AND visitors=0;`);
for(const comment of comments){if(!Number.isSafeInteger(comment.id)||typeof comment.body!=='string')continue;lines.push(`INSERT OR IGNORE INTO comments(name,body,created_at,source_id) VALUES(${sql(comment.user?.login||'访客')},${sql(comment.body)},${sql(comment.created_at)},${sql('github-'+comment.id)});`);}
fs.writeFileSync(path.join(root,'data/bootstrap.sql'),lines.join('\n')+'\n');console.log(JSON.stringify({prepared:true,posts:seed.posts.length,comments:comments.length,plaintextPasswordWritten:false}));
