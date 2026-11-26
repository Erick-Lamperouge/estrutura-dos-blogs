import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import path from 'node:path';
import {publicationPlan,sitemapXml} from '../src/lib/publication-plan.mjs';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const plan=publicationPlan(load('config/futebolando.json'),load('content/articles.json'),load('content/series.json'),load('content/publication.json'),{asOf:new Date().toISOString().slice(0,10),readMedia:p=>readFileSync('public'+p)});
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const html=walk('dist/futebolando').filter(f=>f.endsWith('.html')).sort();
assert.deepEqual(html,plan.pages.map(p=>path.join('dist',p.path,'index.html')).sort(),'Publication plan must match emitted routes');
for(const p of plan.pages){
 const h=readFileSync(path.join('dist',p.path,'index.html'),'utf8');
 assert.ok(h.includes('name="robots" content="'+p.robots+'"'),p.path+' robots');
 assert.ok(h.includes('rel="canonical" href="'+p.canonical+'"'),p.path+' canonical');
 assert.equal(h.includes('application/ld+json'),plan.live&&p.kind==='article',p.path+' schema');
 if(plan.live)assert.ok(!h.includes('class="draft-label"')&&!h.includes('class="ad-preview"'),p.path+' no draft/advertising placeholders');
}
const xml=sitemapXml(plan),file='dist/futebolando/sitemap.xml';
if(xml)writeFileSync(file,xml);
else if(existsSync(file))throw Error('Unexpected sitemap in unindexed build');
if(plan.live){
 assert.ok(!existsSync('dist/culinaria-demo'),'Fixture not in publication build');
 const allowedMedia=new Set(plan.articles.filter(a=>a.media).map(a=>path.normalize(path.join('dist',a.media.path))));
 const folder='dist/futebolando/media';
 if(existsSync(folder))for(const f of walk(folder))if(!allowedMedia.has(path.normalize(f)))rmSync(f);
 for(const f of allowedMedia)assert.ok(existsSync(f),'Missing released media: '+f);
 // Ensure article/series navigation cannot link to an excluded draft route.
 const allowed=new Set(plan.pages.map(p=>p.path));
 for(const p of plan.pages){
  const html=readFileSync(path.join('dist',p.path,'index.html'),'utf8');
  for(const match of html.matchAll(/href="(\/futebolando\/(?:[a-z0-9-]+\/)*)(?:[?#][^"]*)?"/g))assert.ok(allowed.has(match[1]),p.path+' links to non-public route '+match[1]);
 }
}
console.log('PASS publication build: '+plan.pages.length+' pages, '+Object.keys(plan.records).length+' published articles, '+plan.pages.filter(p=>p.indexEligible).length+' indexable URLs');
