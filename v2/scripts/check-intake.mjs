import {resolve} from 'node:path';
import {readBoundedJson,readLocalMedia,validateIntakeCatalog,planIntake,LIMITS} from '../src/lib/content-intake.mjs';
const config=readBoundedJson('config/futebolando.json'),current=readBoundedJson('content/articles.json');
const options={asOf:new Date().toISOString().slice(0,10),readMedia:p=>readLocalMedia(resolve('public'),p)};
const [candidate,...extra]=process.argv.slice(2);
if(extra.length)throw Error('Usage: npm run intake:check -- [candidate.json]');
if(candidate)console.log(JSON.stringify(planIntake(config,current,readBoundedJson(candidate,LIMITS.batchBytes),options),null,2));
else{const rows=validateIntakeCatalog(config,current,options);console.log('PASS content intake: '+rows.length+' articles; local static media and source metadata checked; no network or publication');}
