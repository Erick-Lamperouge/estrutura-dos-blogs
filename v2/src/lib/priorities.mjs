import { validateInternational } from './international.mjs';
const slug=x=>typeof x==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x);
const country=x=>typeof x==='string'&&/^[A-Z]{2}$/.test(x);
const bounded=x=>Number.isFinite(x)&&x>=0&&x<=100;
const https=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const iso=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
/**
 * Recommend drafts from supplied aggregate signals. This module never fetches analytics or publishes.
 * External interest and observed performance must be normalized upstream inside the same market/topic/window.
 * Missing/undersampled observed metrics are null, not zero; use available signals with re-normalized weights.
 */
export function rankOpportunities(config, candidates, asOf){
  validateInternational(config);
  if(!iso(asOf)||!Array.isArray(candidates)) throw new Error('Invalid input');
  const a=config.international.audience;
  const seen=new Set(), eligible=[], rejected=[];
  for(const c of candidates){
    const key=JSON.stringify([c?.topic,c?.market,c?.locale]);
    const reject=reason=>rejected.push({key,reason});
    if(!slug(c?.topic)||!country(c?.market)||typeof c.locale!=='string'||!iso(c.observedOn)||c.observedOn>asOf){reject('invalid');continue;}
    if(seen.has(key)){reject('duplicate');continue;}
    if(a.scope==='national'&&c.market!==a.jurisdiction){reject('outside-jurisdiction');continue;}
    if(c.betting!==false||c.editorialValue!==true){reject('editorial-policy');continue;}
    if(!Array.isArray(c.sourceUrls)||c.sourceUrls.length<a.minSources||!c.sourceUrls.every(https)||new Set(c.sourceUrls).size<a.minSources){reject('missing-evidence');continue;}
    if((Date.parse(asOf)-Date.parse(c.observedOn))/86400000>30){reject('stale');continue;}
    const external=bounded(c.externalInterest)?c.externalInterest:null;
    const internal=Number.isInteger(c.impressions)&&c.impressions>=a.minObservedImpressions&&bounded(c.observedPerformance)?c.observedPerformance:null;
    if(external===null&&internal===null){reject('insufficient-signal');continue;}
    seen.add(key);
    const weight=(external===null?0:55)+(internal===null?0:45);
    const score=Math.round(((external??0)*55+(internal??0)*45)/weight*100)/100;
    const editionAvailable=config.international.editions.some(e=>e.locale===c.locale);
    const lane=!editionAvailable||!a.seedMarkets.includes(c.market)?'exploration':a.seedTopics.includes(c.topic)?'core':'demand';
    eligible.push({topic:c.topic,market:c.market,locale:c.locale,score,signals:{external,internal},lane,editionAvailable,action:editionAvailable?'draft-review':'review-locale-expansion',observedOn:c.observedOn,sourceUrls:[...c.sourceUrls],status:'recommendation-only'});
  }
  eligible.sort((x,y)=>y.score-x.score||x.topic.localeCompare(y.topic)||x.market.localeCompare(y.market)||x.locale.localeCompare(y.locale));
  return {eligible,rejected};
}
/** Largest-remainder quota. Unfilled slots stay unfilled; never invent a story or automatically publish. */
export function allocateSlots(config, total){
  validateInternational(config);
  if(!Number.isInteger(total)||total<0||total>1000)throw new Error('Invalid slot count');
  const shares=config.international.audience.allocation;
  const items=Object.keys(shares).map(key=>({key,n:Math.floor(total*shares[key]/100),remainder:total*shares[key]%100}));
  items.sort((a,b)=>b.remainder-a.remainder||a.key.localeCompare(b.key));
  let remaining=total-items.reduce((sum,x)=>sum+x.n,0);
  for(let i=0;i<remaining;i++)items[i].n++;
  return Object.fromEntries(items.map(x=>[x.key,x.n]));
}
