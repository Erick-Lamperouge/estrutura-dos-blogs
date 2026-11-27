/** Audience totals are supplied only after privacy/measurement approval; no tracking here. */
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const days=(a,b)=>(Date.parse(b)-Date.parse(a))/86400000;
const int=x=>Number.isSafeInteger(x)&&x>=0;
const id=x=>typeof x==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x);
export const HIGHLIGHT_POLICY=Object.freeze({slots:3,recencyWeight:.6,viewsWeight:.4,windowDays:7,minTotalViews:100,maxAgeDays:2,halfLifeDays:7});
export function validateAudience(input,blog,asOf){
 need(day(asOf)&&input?.version===1&&input.blog===blog&&Array.isArray(input.batches)&&Object.keys(input).length===3,'Invalid audience envelope');
 const scopes=new Set();
 for(const b of input.batches){
  need(Object.keys(b).sort().join('|')==='locale|mode|provider|rows|windowEnd|windowStart'&&['fixture','observed'].includes(b.mode)&&typeof b.provider==='string'&&b.provider.trim().length>0&&b.provider.length<=80&&typeof b.locale==='string','Invalid audience scope');
  need(day(b.windowStart)&&day(b.windowEnd)&&days(b.windowStart,b.windowEnd)===6&&b.windowEnd<=asOf,'Invalid audience window');
  need(!scopes.has(b.locale)&&Array.isArray(b.rows)&&b.rows.length<=10000,'Duplicate audience scope');scopes.add(b.locale);
  const ids=new Set();
  for(const r of b.rows){need(Object.keys(r).sort().join('|')==='articleId|views'&&id(r.articleId)&&int(r.views)&&!ids.has(r.articleId),'Invalid aggregate views');ids.add(r.articleId);}
 }
 return input;
}
export function rankHighlights(cards,{blog,locale,records,live,audience,asOf}){
 validateAudience(audience,blog,asOf);
 const policy=HIGHLIGHT_POLICY;
 const chronological=cards.filter(c=>!live||records[c.id]?.publishedAt).map((c,i)=>({...c,ordinal:i,publishedAt:live?records[c.id].publishedAt:null}));
 if(!live)return {mode:'curated-preview',items:chronological.slice(0,policy.slots).map((c,i)=>({...c,reason:i===0?'editorial':'discover'}))};
 for(const c of chronological)need(day(c.publishedAt)&&c.publishedAt<=asOf,'Invalid publication date in highlights');
 chronological.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
 const batch=audience.batches.find(b=>b.locale===locale&&b.mode==='observed'&&days(b.windowEnd,asOf)<=policy.maxAgeDays);
 const eligible=new Set(chronological.map(c=>c.id));
 const totals=new Map((batch?.rows??[]).filter(r=>eligible.has(r.articleId)).map(r=>[r.articleId,r.views]));
 // Missing counts are unknown, not zero. A complete cohort is required for hybrid ranking.
 const useViews=!!batch&&chronological.every(c=>totals.has(c.id))&&[...totals.values()].reduce((a,b)=>a+b,0)>=policy.minTotalViews;
 const max=useViews?Math.max(...totals.values(),1):1;
 const score=c=>{
  const recency=Math.pow(.5,days(c.publishedAt,asOf)/policy.halfLifeDays);
  return useViews?recency*policy.recencyWeight+Math.log1p(totals.get(c.id))/Math.log1p(max)*policy.viewsWeight:recency;
 };
 const lead=chronological[0],rest=chronological.slice(1).sort((a,b)=>score(b)-score(a)||b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
 // Reserve lead for the newest. Only call a card popular when aggregate evidence exists.
 const popular=useViews?[...rest].filter(c=>totals.get(c.id)>0).sort((a,b)=>totals.get(b.id)-totals.get(a.id)||score(b)-score(a)||a.id.localeCompare(b.id))[0]:null;
 const selected=[...(lead?[{...lead,reason:'recent'}]:[]),...(popular?[{...popular,reason:'popular'}]:[]),...rest.filter(c=>c.id!==popular?.id).map(c=>({...c,reason:'discover'}))].slice(0,policy.slots);
 return {mode:useViews?'hybrid':'recency-only',items:selected};
}
