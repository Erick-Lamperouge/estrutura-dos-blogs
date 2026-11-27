import {resolve,relative,sep} from 'node:path';
import {lstatSync,readdirSync} from 'node:fs';
import {readBoundedJson,readLocalMedia,validateIntakeCatalog,planIntake,LIMITS} from '../src/lib/content-intake.mjs';
const config=readBoundedJson('config/futebolando.json'),current=readBoundedJson('content/articles.json');
const options={asOf:new Date().toISOString().slice(0,10),readMedia:p=>readLocalMedia(resolve('public'),p)};
const [candidate,...extra]=process.argv.slice(2);
if(extra.length)throw Error('Usage: npm run intake:check -- [candidate.json]');
if(candidate)console.log(JSON.stringify(planIntake(config,current,readBoundedJson(candidate,LIMITS.batchBytes),options),null,2));
else{
 const rows=validateIntakeCatalog(config,current,options);
 const publicRoot=resolve('public'),mediaRoot=resolve(publicRoot,config.slug);
 const declared=new Set([config.design.media.featured,...config.design.media.cards,...(config.design.articleMedia??[]),...rows.map(a=>a.media)].filter(m=>m?.source==='local').map(m=>m.path));
 function verifyAssets(dir){const st=lstatSync(dir);if(st.isSymbolicLink()||!st.isDirectory())throw Error('Unsafe public directory');for(const name of readdirSync(dir)){const f=resolve(dir,name),s=lstatSync(f);if(s.isSymbolicLink())throw Error('Public symlink forbidden');if(s.isDirectory())verifyAssets(f);else{const url='/'+relative(publicRoot,f).split(sep).join('/');if(!declared.has(url))throw Error('Undeclared blog asset');options.readMedia(url);}}}
 verifyAssets(mediaRoot);
 for(const file of declared)options.readMedia(file);
 console.log('PASS content intake: '+rows.length+' articles; local static media and source metadata checked; no network or publication');}
