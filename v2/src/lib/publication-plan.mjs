import {createHash} from 'node:crypto';
import {validateArticles,articlePath} from './articles.mjs';
import {validateSeries} from './series.mjs';
import {buildSeoInventory,PREVIEW_ROBOTS} from './seo.mjs';
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const text=x=>typeof x==='string'&&x.trim().length>0;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const sha=x=>createHash('sha256').update(x).digest('hex');
export const CHECKS=Object.freeze(['facts','sources','writing','media','rights','humanReview']);
export function articleFingerprint(article,readMedia){
  const media=article.media?sha(readMedia(article.media.path)):null;
  return sha(JSON.stringify(canonical({article,media})));
}
function authorization(a,asOf){return !!a&&text(a.by)&&text(a.reference)&&date(a.date)&&a.date<=asOf;}
/** Immutable source articles stay draft. This separate ledger controls actual publication.
 * A reference records the owner's decision; it is NOT cryptographic identity verification. */
export function publicationPlan(config,catalog,seriesCatalog,ledger,{readMedia,asOf}){
 const rows=validateArticles(config,catalog);
 const series=validateSeries(config,catalog,seriesCatalog);
 need(date(asOf)&&typeof readMedia==='function','Invalid publication context');
 need(ledger?.version===1&&ledger.blog===config.slug&&['preview','publication'].includes(ledger.mode)&&Array.isArray(ledger.records),'Invalid publication ledger');
 const live=ledger.mode==='publication';
 need(live?authorization(ledger.launchAuthorization,asOf):ledger.launchAuthorization===null,'Launch requires recorded owner authorization');
 need(ledger.indexingAuthorization===null||live&&authorization(ledger.indexingAuthorization,asOf)&&ledger.indexingAuthorization.date>=ledger.launchAuthorization.date,'Indexing requires separate authorization');
 const records=new Map();
 const fingerprints=Object.fromEntries(rows.map(a=>[a.id,articleFingerprint(a,readMedia)]));
 for(const r of ledger.records){
  const article=rows.find(a=>a.id===r?.articleId);
  need(article&&!records.has(r.articleId),'Unknown or duplicate release record');
  need(['approved','published'].includes(r.state)&&r.fingerprint===fingerprints[r.articleId],'Stale or invalid review: '+r.articleId);
  need(authorization(r.review,asOf)&&r.review.date>=article.preparedAt,'Real human review record required');
  need(Object.keys(r.checks??{}).length===CHECKS.length&&CHECKS.every(k=>r.checks[k]===true),'Incomplete review checklist');
  need(Object.keys(r.localeReviews??{}).sort().join('|')===Object.keys(article.editions).sort().join('|')&&Object.values(r.localeReviews).every(x=>authorization(x,asOf)&&x.date>=article.preparedAt&&x.date<=r.review.date),'Every available language must be reviewed');
  need(r.author&&['Person','Organization'].includes(r.author.type)&&text(r.author.name),'Actual public author required');
  if(r.state==='approved')need(r.release===null&&r.publishedAt===null&&r.modifiedAt===null,'Approved is not published');
  else {
   need(authorization(r.release,asOf)&&r.release.date>=r.review.date,'Publication authorization required');
   need(date(r.publishedAt)&&date(r.modifiedAt)&&r.publishedAt>=article.preparedAt&&r.modifiedAt>=r.publishedAt&&r.modifiedAt>=r.review.date&&r.modifiedAt>=r.release.date&&r.modifiedAt<=asOf,'Invalid real publication dates');
   // Initial publication cannot predate approval. A later revision may retain the historical publication date.
   need(r.publishedAt>=r.review.date||r.modifiedAt>r.publishedAt,'Earlier publication date requires later modification');
  }
  records.set(r.articleId,r);
 }
 const released=rows.filter(a=>records.get(a.id)?.state==='published');
 need(!live||released.length>0,'Publication requires at least one authorized article');
 const selected=live?released:rows,ids=new Set(selected.map(a=>a.id));
 const projected=selected.map(a=>({...a,related:a.related.filter(id=>ids.has(id))}));
 const projectedSeries=live?series.filter(s=>s.state!=='planned'&&s.episodes.some(e=>ids.has(e.article))).map(s=>({...s,episodes:s.episodes.map(e=>({...e,article:ids.has(e.article)?e.article:null}))})):series;
 const indexable=live&&ledger.indexingAuthorization!==null;
 const inventory=buildSeoInventory(config,projected,projectedSeries);
 // An empty public series catalog has no index route.
 const pages=inventory.pages.filter(p=>!live||p.kind!=='series-index'||projectedSeries.length>0).map(p=>({...p,indexEligible:indexable,robots:indexable?'index,follow':PREVIEW_ROBOTS}));
 const allowed=new Set(pages.map(p=>p.path));
 const publicRecords=live?Object.fromEntries(released.map(a=>{const r=records.get(a.id);return [a.id,{author:r.author,publishedAt:r.publishedAt,modifiedAt:r.modifiedAt}];})):{};
 return {live,indexable,articles:projected,series:projectedSeries,records:publicRecords,pages,
  queue:rows.map(a=>({id:a.id,fingerprint:fingerprints[a.id],locales:Object.keys(a.editions),state:records.get(a.id)?.state??'draft',visible:live?ids.has(a.id):true})),
  seo(path){const p=path.endsWith('/')?path:path+'/';need(allowed.has(p),'Page is not in publication plan: '+p);return pages.find(x=>x.path===p);}};
}
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&apos;");
export function sitemapXml(plan){
 const pages=plan.pages.filter(p=>p.indexEligible);
 if(!pages.length)return null;
 return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+pages.map(p=>'  <url><loc>'+xml(p.canonical)+'</loc>'+p.alternates.filter(a=>pages.some(x=>x.canonical===a.href)).map(a=>'<xhtml:link rel="alternate" hreflang="'+xml(a.locale)+'" href="'+xml(a.href)+'"/>').join('')+(p.kind==='article'?'<lastmod>'+xml(plan.records[p.id].modifiedAt)+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>\n';
}
export function articleSchema(config,article,locale,record){
 need(record&&article.editions[locale],'Schema only for released articles');
 const e=article.editions[locale],url='https://senhoritaminuto.com.br'+articlePath(config,article,locale);
 return {'@context':'https://schema.org','@type':'Article',headline:e.title,description:e.summary,inLanguage:locale,author:{'@type':record.author.type,name:record.author.name},datePublished:record.publishedAt,dateModified:record.modifiedAt,mainEntityOfPage:{'@type':'WebPage','@id':url},...(article.media?{image:['https://senhoritaminuto.com.br'+article.media.path]}:{})};
}
export const safeJson=x=>JSON.stringify(x).replace(/</g,'\\u003c');
