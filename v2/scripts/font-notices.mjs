import {copyFileSync,mkdirSync} from 'node:fs';
const out='public/blog-font-licenses';
mkdirSync(out,{recursive:true});
for(const [pkg,name] of [['@fontsource/barlow-condensed','barlow-condensed'],['@fontsource-variable/source-serif-4','source-serif-4'],['@fontsource-variable/inter','inter']])copyFileSync('node_modules/'+pkg+'/LICENSE',out+'/'+name+'.txt');
