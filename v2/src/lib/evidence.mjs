import {validateInternational} from './international.mjs';
import {rankOpportunities,allocateSlots} from './priorities.mjs';
const need=(value,message)=>{if(!value)throw new Error(message);};
const nonblank=x=>typeof x==='string'&&x.trim().length>0;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const locale=x=>{try{return typeof x==='string'&&Intl.getCanonicalLocales(x)[0]===x;}catch{return false;}};
const https=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const bounded=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=100;
const count=x=>Number.isSafeInteger(x)&&x>=0;
function evidenceMatches(e,b,kind){
  return e&&e.kind===kind&&e.mode===b.mode&&nonblank(e.provider)&&e.windowStart===b.windowStart&&e.windowEnd===b.windowEnd&&e.cohort===b.cohort&&https(e.referenceUrl);
}
/**
 * Pipeline boundary for future real collectors: one comparable market/locale/time cohort.
 * Provenance is structurally validated, not independently authenticated.
 * "observed" means supplied observations pending verification, never a publication approval.
 * No cross-cohort comparisons and no network or personal data access.
 */
export function rankEvidenceBatch(config,b,asOf){
  validateInternational(config);
  need(b&&['fixture','observed'].includes(b.mode)&&/^[A-Z]{2}$/.test(b.market??'')&&locale(b.locale)&&nonblank(b.cohort)&&date(b.windowStart)&&date(b.windowEnd)&&date(asOf),'invalid batch scope');
  need(b.windowStart<=b.windowEnd&&b.windowEnd<=asOf&&(Date.parse(b.windowEnd)-Date.parse(b.windowStart))/86400000<=90&&(Date.parse(asOf)-Date.parse(b.windowEnd))/86400000<=30,'invalid evidence window');
  need(Array.isArray(b.candidates)&&b.candidates.length<=1000,'invalid candidates');
  const providerByKind=new Map();
  const checkEvidence=(e,kind)=>{
    need(evidenceMatches(e,b,kind),'missing or mismatched '+kind+' evidence');
    need(!providerByKind.has(kind)||providerByKind.get(kind)===e.provider,'mixed providers within '+kind+' cohort');
    providerByKind.set(kind,e.provider);
  };
  for(const c of b.candidates){
    need(c&&c.market===b.market&&c.locale===b.locale&&c.mode===b.mode&&c.observedOn===b.windowEnd,'mixed batch scope or data mode');
    need(c.externalInterest===null||bounded(c.externalInterest),'invalid external signal');
    if(c.externalInterest!==null)checkEvidence(c.externalEvidence,'external');
    need(c.observedPerformance===null||bounded(c.observedPerformance),'invalid internal signal');
    if(c.observedPerformance!==null){
      need(count(c.impressions)&&count(c.clicks)&&c.clicks<=c.impressions,'invalid observed counts');
      checkEvidence(c.internalEvidence,'internal');
    }
    if(c.observedPerformance===null)need((c.impressions===null&&c.clicks===null)||(count(c.impressions)&&count(c.clicks)&&c.clicks<=c.impressions),'incomplete observed counts');
  }
  const result=rankOpportunities(config,b.candidates,asOf);
  return {...result,scope:{market:b.market,locale:b.locale,cohort:b.cohort,windowStart:b.windowStart,windowEnd:b.windowEnd},mode:b.mode,dataStatus:b.mode==='fixture'?'simulation':'provided-unverified',status:'recommendations-only'};
}
/** Apply configurable lane quotas inside one scope; do not refill vacancies with weak or unavailable content. */
export function planEditorialBatch(config,b,asOf,total){
  const result=rankEvidenceBatch(config,b,asOf);
  const quotas=allocateSlots(config,total);
  const selected=[];
  const remaining={...quotas};
  for(const candidate of result.eligible){
    if(remaining[candidate.lane]>0){
      selected.push({...candidate,dataStatus:result.dataStatus});
      remaining[candidate.lane]--;
    }
  }
  return {...result,quotas,selected,remaining};
}
