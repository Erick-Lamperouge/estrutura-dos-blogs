/** Normalized sports snapshots, local only; no scraping, credentials, odds or live promises. */
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const diff=(a,b)=>(Date.parse(b)-Date.parse(a))/86400000;
const safe=x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=100&&!/[<>\r\n]/.test(x);
const slug=x=>typeof x==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x);
const web=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash;}catch{return false;}};
const num=x=>Number.isSafeInteger(x)&&x>=0;
const timestamp=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(x)&&Number.isFinite(Date.parse(x));
export const SPORTS_MAX_AGE_DAYS=2;
export function validateSports(input,{asOf}){
 need(date(asOf)&&input?.version===1&&input.blog==='futebolando'&&Array.isArray(input.competitions)&&input.competitions.length<=20&&Array.isArray(input.officialLinks),'Invalid sports envelope');
 const ids=new Set();
 for(const c of input.competitions){
  need(slug(c.id)&&!ids.has(c.id)&&['clubs','national'].includes(c.kind)&&safe(c.title?.['pt-BR'])&&safe(c.title?.en)&&safe(c.season)&&['archive','current'].includes(c.mode),'Invalid competition');ids.add(c.id);
  need(date(c.coverageThrough)&&c.coverageThrough<=asOf&&num(c.expectedResults)&&c.expectedResults>0&&c.expectedResults<=2000&&num(c.groupSize)&&c.groupSize>=2&&c.groupSize<=50&&['points-wins-gd-gf','points-gd-gf'].includes(c.tiebreak),'Invalid coverage');
  need(Array.isArray(c.groups)&&c.groups.length>0&&c.groups.every(safe)&&new Set(c.groups).size===c.groups.length,'Invalid groups');
  need(safe(c.source?.provider)&&['CC0-1.0','licensed-authorized'].includes(c.source.license)&&web(c.source.url)&&web(c.source.licenseUrl)&&/^[a-f0-9]{40}$/.test(c.source.commit??'')&&/^[a-f0-9]{40}$/.test(c.source.blob??''),'Missing reusable source provenance');
  need(web(c.officialUrl)&&web(c.agendaUrl),'Invalid official link');
  need(c.scheduleCheckedAt===null||date(c.scheduleCheckedAt)&&c.scheduleCheckedAt<=asOf,'Invalid schedule check date');
  need(Array.isArray(c.matches)&&c.matches.length<=2500,'Invalid matches');
  const keys=new Set(),pairDates=new Set(),teams=new Map(c.groups.map(g=>[g,new Set()]));
  let final=0;
  for(const m of c.matches){
   need(slug(m.id)&&!keys.has(m.id)&&c.groups.includes(m.group)&&date(m.date)&&safe(m.home)&&safe(m.away)&&m.home!==m.away&&['final','scheduled','postponed','cancelled'].includes(m.status),'Invalid match');keys.add(m.id);
   const pair=JSON.stringify([m.group,m.date,...[m.home,m.away].sort()]);need(!pairDates.has(pair),'Duplicate match');pairDates.add(pair);
   teams.get(m.group).add(m.home);teams.get(m.group).add(m.away);
   need(m.kickoffAt===null||timestamp(m.kickoffAt)&&m.kickoffAt.slice(0,10)===m.date,'Invalid kickoff offset/date');
   if(m.status==='final'){need(m.date<=c.coverageThrough&&Array.isArray(m.score)&&m.score.length===2&&m.score.every(n=>num(n)&&n<=99),'Invalid final score');final++;}
   else need(m.score===null,'Unplayed match has score');
   if(c.mode==='archive')need(m.status==='final','Archive cannot contain upcoming claims');
  }
  need(final<=c.expectedResults&&[...teams.values()].every(s=>s.size===c.groupSize),'Incomplete teams or result overflow');
 }
 for(const l of input.officialLinks)need(slug(l.id)&&web(l.url)&&(safe(l.name)||safe(l.name?.['pt-BR'])&&safe(l.name?.en)),'Invalid source directory');
 return input;
}
export function standings(c,group){
 const table=new Map();
 const add=name=>{if(!table.has(name))table.set(name,{name,p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0});return table.get(name);};
 for(const m of c.matches.filter(m=>m.group===group)){
  const a=add(m.home),b=add(m.away);
  if(m.status!=='final')continue;
  const [x,y]=m.score;a.p++;b.p++;a.gf+=x;a.ga+=y;b.gf+=y;b.ga+=x;
  if(x>y){a.w++;b.l++;}else if(x<y){b.w++;a.l++;}else{a.d++;b.d++;}
 }
 for(const r of table.values()){r.gd=r.gf-r.ga;r.pts=3*r.w+r.d;}
 const compare=(a,b)=>b.pts-a.pts||(c.tiebreak==='points-wins-gd-gf'?b.w-a.w:0)||b.gd-a.gd||b.gf-a.gf;
 const rows=[...table.values()].sort((a,b)=>compare(a,b)||a.name.localeCompare(b.name,'en'));
 return rows.map((r,i)=>({...r,rank:i&&compare(rows[i-1],r)===0?null:i+1}));
}
export function sportsView(input,asOf){
 validateSports(input,{asOf});
 return input.competitions.map(c=>{
  const final=c.matches.filter(m=>m.status==='final').length;
  const fresh=c.mode==='current'&&diff(c.coverageThrough,asOf)<=SPORTS_MAX_AGE_DAYS;
  const agendaFresh=c.mode==='current'&&c.scheduleCheckedAt!==null&&diff(c.scheduleCheckedAt,asOf)<=SPORTS_MAX_AGE_DAYS;
  const expiry=d=>new Date(Date.parse(d)+(SPORTS_MAX_AGE_DAYS+1)*86400000).toISOString();
  return {...c,final,complete:final===c.expectedResults,fresh,agendaFresh,tableExpiresAt:fresh?expiry(c.coverageThrough):null,agendaExpiresAt:agendaFresh?expiry(c.scheduleCheckedAt):null,
   tables:c.groups.map(group=>({group,rows:standings(c,group)})),
   upcoming:agendaFresh?c.matches.filter(m=>m.status==='scheduled'&&m.date>asOf).sort((a,b)=>a.date.localeCompare(b.date)||(a.kickoffAt??'').localeCompare(b.kickoffAt??'')||a.id.localeCompare(b.id)).slice(0,10):[]};
 });
}
