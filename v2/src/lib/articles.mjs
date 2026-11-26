import {localePath,localizedView} from './international.mjs';
import {validateBlogConfig} from './config.mjs';
const need=(ok,msg)=>{if(!ok)throw new Error(msg);};
const slug=x=>typeof x==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const unique=xs=>new Set(xs).size===xs.length;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const https=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function validateArticles(config,catalog){
  validateBlogConfig(config);
  need(Array.isArray(catalog),'Invalid article catalog');
  const rows=catalog.filter(a=>a?.blog===config.slug);
  need(unique(rows.map(a=>a.id)),'Duplicate article id');
  const available=config.international.editions.map(e=>e.locale);
  const routeKeys=[];
  const cards=[];
  for(const a of rows){
    need(slug(a.id)&&config.categories.some(c=>c.slug===a.category)&&config.editorial.formats.includes(a.format),'Invalid article identity');
    need(a.status==='draft'&&date(a.preparedAt)&&a.reviewedAt===null,'Only unpublished, unreviewed drafts in preview');
    need(a.previewCardIndex===null||Number.isInteger(a.previewCardIndex)&&a.previewCardIndex>=0&&a.previewCardIndex<config.preview.cards.length,'Invalid card reference');
    if(a.previewCardIndex!==null){cards.push(a.previewCardIndex);need(config.design.cardCategories[a.previewCardIndex]===a.category,'Article/card category mismatch');}
    need(Array.isArray(a.sources)&&a.sources.length>0&&unique(a.sources.map(s=>s.id)),'Article requires references');
    for(const s of a.sources)need(slug(s.id)&&text(s.title)&&https(s.url)&&date(s.checkedAt)&&s.checkedAt<=a.preparedAt,'Invalid article source');
    need(a.editions&&Object.keys(a.editions).length>0&&Object.keys(a.editions).every(l=>available.includes(l))&&a.editions[config.language],'Invalid article editions');
    for(const [locale,edition] of Object.entries(a.editions)){
      need(slug(edition.slug)&&text(edition.title)&&text(edition.summary)&&Array.isArray(edition.sections)&&edition.sections.length>0,'Invalid localized article');
      routeKeys.push(locale+':'+edition.slug);
      need(unique(edition.sections.map(s=>s.id)),'Duplicate section');
      for(const s of edition.sections)need(slug(s.id)&&text(s.heading)&&Array.isArray(s.paragraphs)&&s.paragraphs.length>0&&s.paragraphs.every(text)&&Array.isArray(s.sourceIds)&&s.sourceIds.length>0&&unique(s.sourceIds)&&s.sourceIds.every(id=>a.sources.some(src=>src.id===id)),'Invalid section or reference');
    }
    if(a.media!==null){
      const known=[config.design.media.featured,...config.design.media.cards].filter(m=>m?.source==='local');
      need(known.some(m=>JSON.stringify(m)===JSON.stringify(a.media)),'Article media must match validated local asset');
    }
    need(Array.isArray(a.related)&&unique(a.related)&&a.related.every(id=>id!==a.id&&rows.some(r=>r.id===id)),'Invalid related articles');
  }
  need(unique(cards)&&unique(routeKeys),'Duplicate route or preview card');
  return rows;
}
export function articlePath(config,article,locale){
  need(article.editions?.[locale],'Article translation unavailable');
  return localePath(config,locale,locale===config.language?'artigos':'articles',article.editions[locale].slug);
}
export function previewArticleLinks(config,catalog,locale){
  return new Map(validateArticles(config,catalog).filter(a=>a.previewCardIndex!==null&&a.editions[locale]).map(a=>[a.previewCardIndex,articlePath(config,a,locale)]));
}
export function articleView(config,catalog,id,locale){
  const rows=validateArticles(config,catalog);
  const a=rows.find(r=>r.id===id);
  need(a&&a.editions[locale],'Article not available');
  const copy=a.editions[locale];
  const categories=localizedView(config,locale).categories;
  const words=copy.sections.flatMap(s=>s.paragraphs).join(' ').trim().split(/\s+/).length;
  return {...a,...copy,categoryLabel:categories.find(c=>c.slug===a.category).label,readingMinutes:Math.max(1,Math.ceil(words/220)),links:config.international.editions.filter(e=>a.editions[e.locale]).map(e=>({locale:e.locale,label:e.label,href:articlePath(config,a,e.locale)})),relatedArticles:a.related.map(r=>rows.find(x=>x.id===r)).filter(x=>x.editions[locale]).map(x=>({title:x.editions[locale].title,href:articlePath(config,x,locale)}))};
}
