import {validateArticles,articlePath} from './articles.mjs';
import {localePath} from './international.mjs';
const need=(x,msg)=>{if(!x)throw Error(msg);};
const slug=x=>typeof x==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x);
const nonblank=x=>typeof x==='string'&&x.trim().length>0;
const unique=x=>new Set(x).size===x.length;
const templates=['rules-learning','club-profile','competition-guide','data-analysis','tactical-analysis','historical-analysis'];
export function validateSeries(config,articles,catalog){
  const rows=validateArticles(config,articles);
  need(Array.isArray(catalog),'Invalid series catalog');
  const list=catalog.filter(s=>s?.blog===config.slug),locales=config.international.editions.map(e=>e.locale),members=new Set(),routes=[];
  need(unique(list.map(s=>s.id)),'Duplicate series');
  for(const s of list){
    need(slug(s.id)&&['pilot','planned','paused','completed'].includes(s.state)&&templates.includes(s.template),'Invalid series');
    need(locales.every(l=>slug(s.copy?.[l]?.slug)&&nonblank(s.copy[l].title)&&nonblank(s.copy[l].description)),'Incomplete series translation');
    for(const l of locales)routes.push(l+':'+s.copy[l].slug);
    need(Array.isArray(s.episodes)&&s.episodes.every((e,i)=>e.number===i+1&&locales.every(l=>nonblank(e.title?.[l]))),'Invalid episode sequence');
    for(const e of s.episodes){
      if(e.article===null)continue;
      const a=rows.find(r=>r.id===e.article);
      need(a&&!members.has(a.id),'Invalid or duplicated series article');
      members.add(a.id);
      if(s.template==='rules-learning'){
        need(a.category==='regras'&&a.format==='guia','Invalid rules article');
        for(const ed of Object.values(a.editions)){
          const roles=ed.sections.map(x=>x.role);
          need(roles.length===5&&roles.slice(0,4).join(',')==='quick,example,rule,exception'&&['history','curiosity'].includes(roles[4]),'Rules episode must have five editorial layers');
        }
      }
    }
    need(s.state!=='pilot'||s.episodes.some(e=>e.article!==null),'Pilot requires draft episode');
    need(s.state!=='planned'||s.episodes.every(e=>e.article===null),'Planned series cannot expose articles');
  }
  need(unique(routes),'Duplicate series routes');
  return list;
}
export function seriesPath(config,s,locale){
  need(s.copy?.[locale]&&s.state!=='planned','Unavailable series route');
  return localePath(config,locale,'series',s.copy[locale].slug);
}
export function seriesList(config,articles,catalog,locale){
  const rows=validateSeries(config,articles,catalog);
  return rows.map(s=>({...s,...s.copy[locale],href:s.state==='planned'?null:seriesPath(config,s,locale),ready:s.episodes.filter(e=>e.article&&articles.find(a=>a.id===e.article)?.editions[locale]).length,total:s.episodes.length}));
}
export function seriesView(config,articles,catalog,id,locale){
  const s=validateSeries(config,articles,catalog).find(x=>x.id===id);
  need(s&&s.state!=='planned','Series not available');
  return {...s,...s.copy[locale],links:config.international.editions.map(e=>({locale:e.locale,label:e.label,href:seriesPath(config,s,e.locale)})),episodes:s.episodes.map(e=>{const a=articles.find(a=>a.id===e.article&&a.blog===config.slug);return {number:e.number,title:e.title[locale],href:a?.editions[locale]?articlePath(config,a,locale):null};})};
}
export function episodeView(config,articles,catalog,id,locale){
  const list=validateSeries(config,articles,catalog),s=list.find(s=>s.episodes.some(e=>e.article===id));
  if(!s||s.state==='planned')return null;
  const view=seriesView(config,articles,catalog,s.id,locale),index=s.episodes.findIndex(e=>e.article===id);
  return {title:view.title,href:seriesPath(config,s,locale),number:index+1,total:s.episodes.length,previous:view.episodes[index-1]?.href?view.episodes[index-1]:null,next:view.episodes[index+1]?.href?view.episodes[index+1]:null};
}
export const seriesLabels=locale=>locale==='en'?{title:'Editorial series',intro:'Explore connected reading paths.',planned:'Planned',draft:'Draft preview',episode:'Episode',previous:'Previous episode',next:'Next episode',all:'All series',open:'Explore series',ready:'drafts available',soon:'Planned episode',status:'Not published · review required',law:'Laws of the Game'}:{title:'Séries editoriais',intro:'Explore trilhas de leitura conectadas.',planned:'Planejada',draft:'Prévia em revisão',episode:'Episódio',previous:'Episódio anterior',next:'Próximo episódio',all:'Todas as séries',open:'Explorar série',ready:'rascunhos disponíveis',soon:'Episódio planejado',status:'Não publicado · revisão obrigatória',law:'Regras do jogo'};
