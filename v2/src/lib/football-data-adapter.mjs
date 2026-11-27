/** Server-side contract for Football-Data v4. No browser import, no persistence or publication. */
const need=(ok,msg)=>{if(!ok)throw new Error(msg);};
const int=(n,min=0,max=1000000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const clean=(s,n=100)=>typeof s==='string'&&s.trim()===s&&s.length>0&&s.length<=n&&!/[<>\u0000-\u001f\u007f]/.test(s);
const isoDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const instant=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().replace('.000','')===s;
const toInstant=s=>new Date(s).toISOString().replace(/\.\d{3}Z$/,'Z');
const safeCode=/^[A-Z0-9]{2,4}$/;
const LIMIT=2_000_000;
export const ATTRIBUTION='Football data provided by the Football-Data.org API';
export const API_BASE='https://api.football-data.org/v4/';
export const MAX_AGE_MS=24*60*60*1000;
export const MIN_REQUEST_INTERVAL_MS=6500;
export const KNOWN_CODES=Object.freeze(['BSA','PL','CL','WC','EC']);
export function validateRegistry(r){
 need(r?.version===1&&r.provider==='football-data.org'&&r.domain==='senhoritaminuto.com.br'&&typeof r.enabled==='boolean','Invalid provider registry');
 need(Array.isArray(r.competitions)&&r.competitions.length>0&&r.competitions.length<=5,'Invalid competition count');
 const ids=new Set(),codes=new Set();
 for(const c of r.competitions){
  need(clean(c.id)&&/^[a-z0-9-]+$/.test(c.id)&&!ids.has(c.id)&&KNOWN_CODES.includes(c.code)&&!codes.has(c.code),'Invalid competition identity');ids.add(c.id);codes.add(c.code);
  need(['clubs','national'].includes(c.kind)&&['LEAGUE','LEAGUE_CUP','CUP'].includes(c.type)&&clean(c.title?.['pt-BR'])&&clean(c.title?.en),'Invalid competition metadata');
  need(c.seasonStart===null||int(c.seasonStart,2000,2100),'Invalid season');
  need(typeof c.table==='boolean'&&(!c.table||c.type==='LEAGUE'&&int(c.teamCount,2,50)),'Only supported league TOTAL standings');
 }
 if(!r.enabled)need(r.authorization===null,'Disabled provider cannot have active authorization');
 else need(r.authorization?.termsAccepted===true&&r.authorization?.cacheAllowed===true&&r.authorization?.displayAllowed===true&&r.authorization?.privacyReviewed===true&&clean(r.authorization.reference,200)&&isoDay(r.authorization.validUntil),'Missing actual provider authorization');
 return r;
}
export function authorized(registry,now){
 validateRegistry(registry);need(instant(now),'Invalid collection time');
 return registry.enabled&&registry.authorization.validUntil>=now.slice(0,10);
}
export function requestPaths(spec,now,days=14){
 need(instant(now)&&int(days,1,30)&&KNOWN_CODES.includes(spec.code)&&safeCode.test(spec.code),'Invalid request parameters');
 need(spec.seasonStart!==null,'Season must be explicitly selected');
 const start=now.slice(0,10),end=new Date(Date.parse(start)+days*86400000).toISOString().slice(0,10);
 const prefix='competitions/'+spec.code;
 // Include today, then filter by kickoff instant. Season explicit to avoid rollover.
 const paths=[prefix+'/matches?season='+spec.seasonStart+'&dateFrom='+start+'&dateTo='+end];
 if(spec.table)paths.push(prefix+'/standings?season='+spec.seasonStart);
 return paths;
}
const team=t=>{need(int(t?.id,1)&&clean(t.name),'Invalid team');return {id:t.id,name:t.name};};
function checkCompetition(payload,spec){
 need(payload?.competition?.code===spec.code&&payload.competition.type===spec.type,'Unexpected competition/type');
}
function seasonMatches(s,spec){
 need(isoDay(s?.startDate)&&isoDay(s?.endDate)&&s.startDate<=s.endDate&&Number(s.startDate.slice(0,4))===spec.seasonStart,'Unexpected season');
}
const allowedStatus=['SCHEDULED','TIMED','IN_PLAY','PAUSED','EXTRA_TIME','PENALTY_SHOOTOUT','FINISHED','SUSPENDED','POSTPONED','CANCELLED','AWARDED'];
export function normalizeFixtures(payload,spec,now,days=14){
 checkCompetition(payload,spec);need(instant(now)&&int(days,1,30),'Invalid normalization time');
 need(Array.isArray(payload.matches)&&payload.matches.length<=500&&payload.resultSet?.count===payload.matches.length,'Truncated or invalid fixture response');
 const ids=new Set(),rows=[];const today=now.slice(0,10),end=new Date(Date.parse(today)+days*86400000).toISOString().slice(0,10);
 for(const m of payload.matches){
  need(int(m.id,1)&&!ids.has(m.id)&&instant(m.utcDate)&&allowedStatus.includes(m.status),'Invalid or duplicate fixture');ids.add(m.id);seasonMatches(m.season,spec);
  if(m.competition)need(m.competition.code===spec.code,'Mixed competitions');
  // Keep only future confirmed pairings. A rough date is not a confirmed kickoff time.
  if(!['SCHEDULED','TIMED'].includes(m.status)||m.utcDate<now||m.utcDate.slice(0,10)>end)continue;
  const home=team(m.homeTeam),away=team(m.awayTeam);need(home.id!==away.id,'Identical teams');
  need(m.score?.fullTime==null||m.score.fullTime.home===null&&m.score.fullTime.away===null,'Future fixture has a result');
  need(m.matchday===null||m.matchday===undefined||int(m.matchday,1,100),'Invalid matchday');
  rows.push({id:m.id,home,away,dateUtc:m.utcDate.slice(0,10),kickoffAt:m.status==='TIMED'?m.utcDate:null,matchday:m.matchday??null,stage:clean(m.stage)?m.stage:null});
 }
 return rows.sort((a,b)=>a.dateUtc.localeCompare(b.dateUtc)||(a.kickoffAt??'').localeCompare(b.kickoffAt??'')||a.id-b.id);
}
export function normalizeStandings(payload,spec){
 need(spec.table&&spec.type==='LEAGUE','Standings unsupported for this competition');
 checkCompetition(payload,spec);seasonMatches(payload.season,spec);
 need(Array.isArray(payload.standings),'Missing standings');
 const overall=payload.standings.filter(s=>s.type==='TOTAL'&&s.stage==='REGULAR_SEASON'&&(s.group===null||s.group===undefined));
 need(overall.length===1&&Array.isArray(overall[0].table)&&overall[0].table.length===spec.teamCount,'Incomplete overall standings');
 const ids=new Set(),ranks=new Set();
 const rows=overall[0].table.map(r=>{
  const t=team(r.team);
  need(!ids.has(t.id)&&int(r.position,1,spec.teamCount)&&!ranks.has(r.position),'Duplicate rank/team');ids.add(t.id);ranks.add(r.position);
  need([r.playedGames,r.won,r.draw,r.lost,r.goalsFor,r.goalsAgainst].every(x=>int(x))&&r.playedGames===r.won+r.draw+r.lost,'Inconsistent games');
  need(Number.isSafeInteger(r.points)&&Math.abs(r.points)<=10000&&r.goalDifference===r.goalsFor-r.goalsAgainst,'Invalid points or goal difference');
  // Preserve provider ordering and points, including deductions. Never recalculate official tie-breaks.
  return {rank:r.position,team:t,played:r.playedGames,won:r.won,drawn:r.draw,lost:r.lost,gf:r.goalsFor,ga:r.goalsAgainst,gd:r.goalDifference,points:r.points};
 });
 return rows.sort((a,b)=>a.rank-b.rank);
}
export function assembleSnapshot(spec,{fixtures,standings},now){
 need(instant(now),'Invalid collection timestamp');
 const upcoming=normalizeFixtures(fixtures,spec,now);
 const table=spec.table?normalizeStandings(standings,spec):null;
 return {version:1,provider:'football-data.org',competition:spec.id,code:spec.code,seasonStart:spec.seasonStart,checkedAt:now,expiresAt:toInstant(Date.parse(now)+MAX_AGE_MS),latency:'delayed',attribution:ATTRIBUTION,table,upcoming};
}
export function isFresh(snapshot,now){
 return instant(now)&&instant(snapshot?.checkedAt)&&instant(snapshot.expiresAt)&&Date.parse(snapshot.expiresAt)===Date.parse(snapshot.checkedAt)+MAX_AGE_MS&&snapshot.checkedAt<=now&&now<snapshot.expiresAt;
}
async function boundedJson(response){
 need(response.headers.get('content-type')?.toLowerCase().includes('application/json'),'Unexpected API content type');
 const length=Number(response.headers.get('content-length')??0);need(Number.isFinite(length)&&length>=0&&length<=LIMIT,'API response too large');
 const reader=response.body?.getReader();need(reader,'Missing API response');
 const chunks=[];let count=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;need(count<=LIMIT,'API response too large');chunks.push(value);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export function createClient({token,fetchImpl=globalThis.fetch,clock=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 need(typeof token==='string'&&/^[A-Za-z0-9]{8,128}$/.test(token),'Missing or invalid API credential');
 let last=-Infinity,tail=Promise.resolve();
 const run=async path=>{
  need(/^competitions\/(BSA|PL|CL|WC|EC)\/(?:standings\?season=\d{4}|matches\?season=\d{4}&dateFrom=\d{4}-\d{2}-\d{2}&dateTo=\d{4}-\d{2}-\d{2})$/.test(path),'API route outside allowlist');
  const delay=MIN_REQUEST_INTERVAL_MS-(clock()-last);if(delay>0)await sleep(delay);last=clock();
  try{
   const response=await fetchImpl(API_BASE+path,{headers:{'X-Auth-Token':token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000),cache:'no-store'});
   if(response.status===429)throw new Error('RATE_LIMIT');
   if([401,403].includes(response.status))throw new Error('ACCESS_DENIED');
   if(!response.ok)throw new Error('UPSTREAM_ERROR');
   return await boundedJson(response);
  }catch(e){const message=['RATE_LIMIT','ACCESS_DENIED','UPSTREAM_ERROR','Unexpected API content type','API response too large','Missing API response'].includes(e?.message)?e.message:'API_REQUEST_FAILED';throw new Error(message);}
 };
 return {get(path){const result=tail.then(()=>run(path));tail=result.catch(()=>{});return result;}};
}
export async function collectCompetition(registry,id,{now,token,fetchImpl,clock,sleep}={}){
 need(authorized(registry,now),'Provider activation not authorized');
 const spec=registry.competitions.find(c=>c.id===id);need(spec,'Unknown competition');
 const paths=requestPaths(spec,now);const client=createClient({token,fetchImpl,clock,sleep});
 const fixtures=await client.get(paths[0]);const standings=spec.table?await client.get(paths[1]):null;
 return assembleSnapshot(spec,{fixtures,standings},now);
}
