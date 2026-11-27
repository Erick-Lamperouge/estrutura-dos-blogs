import {localePath,localizedView} from './international.mjs';
import {validateArticles,articlePath} from './articles.mjs';
import {validateSeries,seriesPath} from './series.mjs';
import {trustPath,trustLabels} from './trust.mjs';

/** Phase 06A: public technical preview, not a publication switch.
 * The only deployed blog is Futebolando; other fixtures must not claim its domain.
 * Canonical/alternates are prepared; noindex stays mandatory and sitemap empty.
 */
export const PREVIEW_ROBOTS='noindex,nofollow';
export const DEPLOYED_PREVIEW=Object.freeze({slug:'futebolando',origin:'https://senhoritaminuto.com.br',mode:'technical-preview'});
const need=(ok,message)=>{if(!ok)throw new Error(message);};
const distinct=xs=>new Set(xs).size===xs.length;
function route(config,path){
  need(typeof path==='string'&&/^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*\/?$/.test(path),'Unsafe SEO route');
  const normalized=path.endsWith('/')?path:path+'/';
  need(normalized.startsWith('/'+config.slug+'/'),'SEO route outside blog');
  return normalized;
}
export function previewSeo(config,locale,editions,path){
  if(config.slug!==DEPLOYED_PREVIEW.slug)return {robots:PREVIEW_ROBOTS,canonical:null,alternates:[]};
  const actual=config.international.editions.map(e=>e.locale);
  need(Array.isArray(editions)&&editions.length>0&&distinct(editions.map(e=>e.locale)),'Duplicate or missing SEO language links');
  need(editions.every(e=>actual.includes(e.locale)),'Unknown SEO edition');
  const links=editions.map(e=>({locale:e.locale,href:route(config,e.href)}));
  need(distinct(links.map(e=>e.href)),'Duplicate SEO alternate URL');
  const current=links.find(e=>e.locale===locale);
  need(current&&current.href===route(config,path),'Canonical must match this localized page');
  const alternates=links.map(e=>({locale:e.locale,href:DEPLOYED_PREVIEW.origin+e.href}));
  return {robots:PREVIEW_ROBOTS,canonical:DEPLOYED_PREVIEW.origin+current.href,alternates};
}
export function buildSeoInventory(config,articles,seriesCatalog){
  need(config.slug===DEPLOYED_PREVIEW.slug,'Only deployed preview has an SEO inventory');
  const rows=validateArticles(config,articles);
  const series=validateSeries(config,articles,seriesCatalog).filter(s=>s.state!=='planned');
  const languages=config.international.editions.map(e=>e.locale);
  const pages=[];
  function addGroup(kind,id,links,labels){
    for(const link of links){
      const meta=previewSeo(config,link.locale,links,link.href);
      const label=labels(link.locale);
      need(typeof label.title==='string'&&label.title.trim()&&typeof label.description==='string'&&label.description.trim(),'Missing SEO title or description');
      pages.push({kind,id,locale:link.locale,path:link.href,title:label.title,description:label.description,...meta,indexEligible:false});
    }
  }
  addGroup('home','home',languages.map(locale=>({locale,href:localePath(config,locale)})),locale=>{
    const v=localizedView(config,locale);
    return {title:config.name+' — '+v.ui.preview,description:v.description};
  });
  addGroup('trust','transparency',languages.map(locale=>({locale,href:trustPath(config,locale)})),locale=>{const t=trustLabels(locale);return {title:t.title+' — '+config.name,description:t.description};});
  addGroup('series-index','series',languages.map(locale=>({locale,href:localePath(config,locale,'series')})),locale=>locale==='en'?{title:'Editorial series — '+config.name,description:'Explore connected reading paths.'}:{title:'Séries editoriais — '+config.name,description:'Explore trilhas de leitura conectadas.'});
  for(const s of series)addGroup('series',s.id,languages.filter(l=>s.copy[l]).map(locale=>({locale,href:seriesPath(config,s,locale)})),locale=>({title:s.copy[locale].title+' — '+config.name,description:s.copy[locale].description}));
  for(const a of rows)addGroup('article',a.id,languages.filter(l=>a.editions[l]).map(locale=>({locale,href:articlePath(config,a,locale)})),locale=>({title:a.editions[locale].title+' — '+config.name,description:a.editions[locale].summary}));
  need(distinct(pages.map(p=>p.path)),'Duplicate SEO page');
  for(const p of pages)for(const alt of p.alternates){
    const target=pages.find(q=>q.canonical===alt.href);
    need(target&&target.kind===p.kind&&target.id===p.id&&target.locale===alt.locale,'SEO alternate points to a different page or missing translation');
    need(target.alternates.some(x=>x.href===p.canonical&&x.locale===p.locale),'SEO alternates must be reciprocal');
  }
  return {
    mode:DEPLOYED_PREVIEW.mode,origin:DEPLOYED_PREVIEW.origin,
    indexingAllowed:false,eligibleSitemapUrls:[],pages,
    editorialReview:rows.map(a=>({id:a.id,status:a.status,reviewedAt:a.reviewedAt,locales:Object.keys(a.editions),references:a.sources.map(s=>({id:s.id,url:s.url,recordedCheckedAt:s.checkedAt})),media:a.media?.path??null,releaseRequirements:['verify-source-and-edition','fact-and-prose-review','translation-review','media-rights-and-accuracy','approved-by-owner'],releaseAllowed:false})),
  };
}
