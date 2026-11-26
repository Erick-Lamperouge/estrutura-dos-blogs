import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {buildSeoInventory} from '../src/lib/seo.mjs';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const inventory=buildSeoInventory(load('config/futebolando.json'),load('content/articles.json'),load('content/series.json'));
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
function tags(head,tag){return [...head.matchAll(new RegExp('<'+tag+'\\b[^>]*>','gi'))].map(m=>Object.fromEntries([...m[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])));}
const expected=new Set(inventory.pages.map(p=>path.join('dist',p.path,'index.html')));
const generated=walk('dist/futebolando').filter(f=>f.endsWith('.html'));
assert.deepEqual([...generated].sort(),[...expected].sort(),'Inventory matches actual generated routes');
for(const p of inventory.pages){
 const file=path.join('dist',p.path,'index.html'),html=readFileSync(file,'utf8'),head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
 assert.ok(head,file+' head');
 const links=tags(head,'link'),meta=tags(head,'meta');
 assert.deepEqual(links.filter(x=>x.rel==='canonical').map(x=>x.href),[p.canonical],file);
 assert.deepEqual(links.filter(x=>x.rel==='alternate'&&x.hreflang).map(x=>({locale:x.hreflang,href:x.href})),p.alternates,file);
 assert.deepEqual(meta.filter(x=>x.name==='robots').map(x=>x.content),[p.robots],file);
 assert.ok(meta.some(x=>x.name==='description'&&x.content?.trim()),file+' description');
 assert.ok(meta.some(x=>x.property==='og:url'&&x.content===p.canonical),file+' og:url');
 assert.ok(!head.includes('application/ld+json'),file+' no premature published article schema');
}
for(const file of walk('dist/culinaria-demo').filter(f=>f.endsWith('.html'))){
 const html=readFileSync(file,'utf8'),head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
 assert.ok(head);assert.ok(!tags(head,'link').some(x=>x.rel==='canonical'||x.hreflang));assert.ok(tags(head,'meta').some(x=>x.name==='robots'&&x.content==='noindex,nofollow'));
}
assert.equal(inventory.eligibleSitemapUrls.length,0);
assert.ok(!walk('dist').some(f=>/sitemap[^/]*\.xml$/i.test(f)),'No premature sitemap');
mkdirSync('review-shots',{recursive:true});writeFileSync('review-shots/seo-inventory.json',JSON.stringify({...inventory,verification:'generated-heads-checked'},null,2)+'\n');
console.log('PASS SEO inventory: '+inventory.pages.length+' canonical pages, '+inventory.pages.reduce((n,p)=>n+p.alternates.length,0)+' reciprocal language links, '+inventory.eligibleSitemapUrls.length+' sitemap-eligible URLs');
