import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {publicationPlan,CHECKS} from '../src/lib/publication-plan.mjs';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const p=publicationPlan(load('config/futebolando.json'),load('content/articles.json'),load('content/series.json'),load('content/publication.json'),{asOf:new Date().toISOString().slice(0,10),readMedia:p=>readFileSync('public'+p)});
const report={mode:p.live?'publication':'preview',indexable:p.indexable,requiredChecks:CHECKS,articles:p.queue};
mkdirSync('review-shots',{recursive:true});writeFileSync('review-shots/publication-queue.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
