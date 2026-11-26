/** Preview-safe statistical evidence. No live data, odds or forecasts. */
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function summarizeXg(evidence){
  need(evidence?.mode==='illustrative'&&evidence.metric==='xg'&&evidence.period===null&&evidence.competition===null,'Only fictional xG examples in this stage');
  need(typeof evidence.provider==='string'&&evidence.provider.trim().length>0,'Missing data attribution');
  need(Array.isArray(evidence.groups)&&evidence.groups.length>=2&&evidence.groups.length<=8,'Invalid comparison groups');
  const ids=new Set();
  return evidence.groups.map(g=>{
    need(typeof g.id==='string'&&/^[a-z][a-z0-9-]*$/.test(g.id)&&!ids.has(g.id),'Invalid or duplicate group');
    ids.add(g.id);
    need(Array.isArray(g.shots)&&g.shots.length>0&&g.shots.length<=200&&g.shots.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1),'Invalid shot values');
    return {id:g.id,shots:g.shots.length,total:Math.round(g.shots.reduce((sum,n)=>sum+n,0)*100)/100};
  });
}
export function validateStatArticle(article){
  if(article.format!=='estatistica'){need(article.analysisEvidence===undefined,'Unexpected statistical evidence');return null;}
  const e=article.analysisEvidence;
  const totals=summarizeXg(e);
  need(Array.isArray(e.sourceIds)&&e.sourceIds.length>0&&new Set(e.sourceIds).size===e.sourceIds.length&&e.sourceIds.every(id=>article.sources.some(s=>s.id===id)),'Missing metric methodology source');
  need(article.media?.kind==='chart','Statistical example requires a credited chart');
  for(const ed of Object.values(article.editions))need(['definition','example','method','limitations'].every(role=>ed.sections.some(s=>s.role===role)),'Statistical article requires definition, example, method and limitations');
  return totals;
}
