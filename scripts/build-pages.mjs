// Package the same application for a free Pages address, using its existing D1 data.
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'pages-dist');
fs.mkdirSync(output,{recursive:true});
fs.cpSync(path.join(root,'public'),output,{recursive:true});
await build({stdin:{contents:"import worker from './src/worker.mjs'; export default worker;",resolveDir:root},outfile:path.join(output,'_worker.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:false});
fs.writeFileSync(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/api/*','/content/posts.json','/assets/uploads/*','/assets/attachments/*'],exclude:[]},null,2)+'\n');
console.log('Pages package ready; dynamic routes use the existing DB binding.');
