import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'github-dist');fs.mkdirSync(output,{recursive:true});fs.cpSync(path.join(root,'public'),output,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'content/posts.json'),'utf8'));
fs.writeFileSync(path.join(output,'snapshot.js'),`window.BLOG.posts=${JSON.stringify(manifest.posts)};window.BLOG.profile=${JSON.stringify(manifest.profile)};\n`);
const html=fs.readFileSync(path.join(output,'index.html'),'utf8').replace(/(<script src="\.\/lib\/profile\.js[^>]*>)/,'<script src="./snapshot.js" defer></script>$1');fs.writeFileSync(path.join(output,'index.html'),html);
fs.mkdirSync(path.join(output,'content'),{recursive:true});for(const name of ['posts.json','comments.json','metrics.json'])fs.copyFileSync(path.join(root,'content',name),path.join(output,'content',name));
fs.mkdirSync(path.join(output,'admin'),{recursive:true});fs.writeFileSync(path.join(output,'admin/index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=https://incloing-blog.pages.dev/admin/"><title>Incloing 写作后台</title><body><p>正在前往写作后台……</p><a href="https://incloing-blog.pages.dev/admin/">打开 Incloing 写作后台</a></body></html>');
fs.writeFileSync(path.join(output,'.nojekyll'),'');console.log('GitHub Pages artifact ready; public live data shares the Cloudflare backend.');
