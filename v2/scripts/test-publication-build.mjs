import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,symlinkSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {articleFingerprint,CHECKS} from '../src/lib/publication-plan.mjs';
const root=process.cwd(),tmp=mkdtempSync(join(tmpdir(),'futebolando-publication-fixture-'));
const read=p=>readFileSync(join(tmp,p),'utf8');
try{
 for(const p of ['src','config','content','public','scripts','astro.config.mjs','package.json'])cpSync(join(root,p),join(tmp,p),{recursive:true});
 symlinkSync(join(root,'node_modules'),join(tmp,'node_modules'),'junction');
 const articles=JSON.parse(read('content/articles.json')),a=articles.find(a=>a.id==='offside-guide');
 const date=new Date().toISOString().slice(0,10);
 assert.ok(date>=a.preparedAt,'Fixture date before preparation');
 const auth={by:'Synthetic fixture reviewer',date,reference:'isolated-ci-only'};
 const ledger={version:1,blog:'futebolando',mode:'publication',launchAuthorization:auth,indexingAuthorization:auth,records:[{articleId:a.id,state:'published',fingerprint:articleFingerprint(a,p=>readFileSync(join(tmp,'public',p))),review:auth,checks:Object.fromEntries(CHECKS.map(k=>[k,true])),localeReviews:Object.fromEntries(Object.keys(a.editions).map(k=>[k,auth])),author:{type:'Organization',name:'Synthetic fixture author'},release:auth,publishedAt:date,modifiedAt:date}]};
 writeFileSync(join(tmp,'content/publication.json'),JSON.stringify(ledger));
 const trust=JSON.parse(read('config/futebolando-trust.json'));
 trust.operator={name:'Synthetic operator',contactEmail:'fixture@example.invalid',contactVerified:true,reviewedAt:date,approvalReference:'isolated-fixture',disclosure:Object.fromEntries(['pt-BR','en'].map(l=>[l,{purposes:'Synthetic purposes',legalBasis:'Synthetic basis',retention:'Synthetic retention',sharing:'Synthetic sharing'}]))};
 writeFileSync(join(tmp,'config/futebolando-trust.json'),JSON.stringify(trust));
 execFileSync('npm',['run','build'],{cwd:tmp,stdio:'inherit'});
 const home=read('dist/futebolando/index.html'),pt=read('dist/futebolando/artigos/impedimento/index.html'),en=read('dist/futebolando/en/articles/offside/index.html'),xml=read('dist/futebolando/sitemap.xml');
 assert.ok(home.includes('data-article-id="offside-guide"'));assert.ok(!home.includes('data-article-id="libertadores-format"'));assert.ok(pt.includes('Synthetic fixture author'));assert.ok(en.includes('application/ld+json'));
 assert.ok(!existsSync(join(tmp,'dist/futebolando/artigos/libertadores-formato/index.html')));assert.ok(!existsSync(join(tmp,'dist/culinaria-demo')));assert.ok(!existsSync(join(tmp,'dist/futebolando/media/libertadores-format-2026.svg')));
 assert.ok(read('dist/futebolando/transparencia/index.html').includes('fixture@example.invalid'));assert.ok(read('dist/futebolando/en/transparency/index.html').includes('Synthetic operator'));assert.ok(xml.includes('/futebolando/en/articles/offside/'));assert.ok(!xml.includes('libertadores-formato'));
 assert.equal(JSON.parse(readFileSync(join(root,'content/publication.json'),'utf8')).mode,'preview');
 console.log('PASS isolated publication fixture: actual Astro HTML, sitemap and draft isolation; real ledger unchanged');
}finally{rmSync(tmp,{recursive:true,force:true});}
