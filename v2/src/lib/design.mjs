/** Shared visual contract: no assets, scripts, or URLs supplied by untrusted config. */
const required=['edition','search','all','topics','featured','stories','filter','empty','clear','method','methodText','illustration','ad','draft','return','guide','guideText','about','network'];
const nonblank=x=>typeof x==='string'&&x.trim().length>0;
const need=(ok,msg)=>{if(!ok)throw new Error(msg);};
export function validateDesign(config){
  const d=config.design;
  need(d?.version===1&&['pitch','table','abstract'].includes(d.motif),'Invalid design motif');
  const categories=new Set(config.categories.map(c=>c.slug));
  need(Array.isArray(d.mainCategories)&&d.mainCategories.length>0&&new Set(d.mainCategories).size===d.mainCategories.length&&d.mainCategories.every(x=>categories.has(x)),'Invalid primary categories');
  need(categories.has(d.featureCategory),'Invalid feature category');
  need(Array.isArray(d.cardCategories)&&d.cardCategories.length===config.preview.cards.length&&d.cardCategories.every(x=>categories.has(x)),'Invalid card category mapping');
  for(const edition of config.international.editions)need(required.every(k=>nonblank(d.copy?.[edition.locale]?.[k])),'Incomplete design translation');
  return d;
}
export function designView(config,view){
  const d=validateDesign(config);
  const labels=new Map(view.categories.map(c=>[c.slug,c.label]));
  return {motif:d.motif,ui:d.copy[view.language],primary:d.mainCategories.map(slug=>({slug,label:labels.get(slug)})),featured:{...view.preview.featured,category:labels.get(d.featureCategory)},cards:view.preview.cards.map((card,i)=>({...card,slug:d.cardCategories[i],category:labels.get(d.cardCategories[i])}))};
}
export function normalizeSearch(text){
  return String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
}
export function matchesPitch(text,category,query,selected='all'){
  return (selected==='all'||selected===category)&&normalizeSearch(query).split(' ').every(word=>normalizeSearch(text).includes(word));
}
