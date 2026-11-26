/** Decision support only. No collection, personal data or automatic publishing. */
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const iso=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const days=(a,b)=>(Date.parse(b)-Date.parse(a))/86400000;
const count=x=>Number.isSafeInteger(x)&&x>=0;
export function reviewSeries(input){
  need(input&&['fixture','observed'].includes(input.mode)&&typeof input.seriesId==='string'&&/^[A-Z]{2}$/.test(input.market??'')&&typeof input.locale==='string'&&input.locale.length>0,'Invalid scope');
  const result={seriesId:input.seriesId,market:input.market,locale:input.locale,dataStatus:input.mode==='fixture'?'simulation':'provided-unverified',automatic:false};
  if(input.windows===null)return {...result,decision:'collect-more',reason:'no-data'};
  need(Array.isArray(input.windows)&&input.windows.length===2,'Two comparison windows required');
  const [previous,current]=input.windows;
  for(const w of input.windows){
    need(iso(w.start)&&iso(w.end)&&days(w.start,w.end)===27&&w.market===input.market&&w.locale===input.locale&&w.mode===input.mode&&w.provider==='search-console'&&typeof w.cohort==='string'&&w.cohort.length>0,'Invalid evidence window');
    need(count(w.impressions)&&count(w.clicks)&&w.clicks<=w.impressions&&count(w.publishedEpisodes)&&count(w.eligibleEpisodes)&&w.eligibleEpisodes<=w.publishedEpisodes,'Invalid metrics');
  }
  need(days(previous.end,current.start)===1&&previous.cohort===current.cohort,'Non-comparable periods');
  if(input.windows.some(w=>w.eligibleEpisodes<3||w.impressions<300))return {...result,decision:'collect-more',reason:'insufficient-sample'};
  const rates=input.windows.map(w=>w.clicks/w.impressions),change=(current.clicks-previous.clicks)/Math.max(previous.clicks,1);
  return {...result,decision:previous.clicks<10?'continue-test':change>=0.25&&rates[1]>=rates[0]?'consider-expand':change<=-0.25&&rates[1]<rates[0]?'investigate-adjustment':'continue-test',ctr:rates,clickChange:change,reason:'experimental-thresholds-human-review'};
}
