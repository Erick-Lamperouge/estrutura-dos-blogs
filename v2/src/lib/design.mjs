/** Shared visual contract: local media only; no remote script or unreviewed embeds. */
const required=['edition','search','all','topics','featured','stories','filter','empty','clear','method','methodText','illustration','ad','draft','return','guide','guideText','about','network','appearance','system','light','dark','photo','chart','mediaCredit','readArticle','readDraft','articleDraft','contents','sources','related','prepared','updated','backHome','noReview','reading','fontLicenses'];
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
  validateAppearance(config);
  validateMedia(config);
  validateRefinement(config);
  return d;
}
export function designView(config,view){
  const d=validateDesign(config);
  const labels=new Map(view.categories.map(c=>[c.slug,c.label]));
  return {motif:d.motif,density:d.density,appearance:d.appearance,ui:d.copy[view.language],primary:d.mainCategories.map(slug=>({slug,label:labels.get(slug)})),featured:{...view.preview.featured,category:labels.get(d.featureCategory),media:d.media.featured},cards:view.preview.cards.map((card,i)=>({...card,slug:d.cardCategories[i],category:labels.get(d.cardCategories[i]),media:d.media.cards[i]}))};
}
export function normalizeSearch(text){
  return String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
}
export function matchesPitch(text,category,query,selected='all'){
  return (selected==='all'||selected===category)&&normalizeSearch(query).split(' ').every(word=>normalizeSearch(text).includes(word));
}

const colors=['background','surface','text','muted','primary','accent','border'];
const hex=x=>typeof x==='string'&&/^#[a-fA-F0-9]{6}$/.test(x);
function luminance(color){
  need(hex(color),'Invalid color');
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}
export function contrastRatio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
export function validateAppearance(config){
  const d=config.design;
  need(['minimal','balanced','dense'].includes(d?.density),'Invalid layout density');
  need(d.appearance&&['system','light','dark'].includes(d.appearance.default),'Invalid theme preference');
  for(const palette of [config.theme,d.appearance.light]){
    need(colors.every(k=>hex(palette?.[k])),'Incomplete palette');
    for(const fg of ['text','muted','primary','accent'])for(const bg of ['background','surface'])need(contrastRatio(palette[fg],palette[bg])>=4.5,'Insufficient contrast: '+fg+'/'+bg);
  }
  return d.appearance;
}
export function themeVariables(config){
  validateAppearance(config);
  return ['dark','light'].flatMap(mode=>colors.map(key=>'--blog-'+mode+'-'+key+':'+(mode==='dark'?config.theme:config.design.appearance.light)[key])).join(';');
}
const https=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function validateMedia(config){
  const d=config.design;
  need(d.mediaPolicy==='mixed'&&d.media&&Array.isArray(d.media.cards)&&d.media.cards.length===config.preview.cards.length,'Invalid media policy');
  const check=(m,featured)=>{
    if(m===null&&!featured)return;
    need(m&&['photo','chart','illustration'].includes(m.kind),'Invalid media kind');
    if(m.source==='builtin'){need(featured&&m.kind==='illustration'&&Object.keys(m).every(k=>['kind','source'].includes(k)),'Invalid built-in media');return;}
    need(m.source==='local'&&typeof m.path==='string'&&m.path.startsWith('/'+config.slug+'/media/')&&/^\/[a-z0-9-]+\/media\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:avif|webp|png|jpe?g|svg)$/.test(m.path),'Unsafe media path');
    need(['original','licensed'].includes(m.rights)&&nonblank(m.credit),'Media rights and credit required');
    if(m.rights==='licensed')need(nonblank(m.license)&&https(m.sourceUrl),'Licensed media provenance required');
    if(m.path.endsWith('.svg'))need(m.kind!=='photo'&&m.rights==='original','Only reviewed original SVG artwork');
    need(config.international.editions.every(e=>nonblank(m.alt?.[e.locale])),'Localized alt text required');
  };
  check(d.media.featured,true);
  for(const m of d.media.cards)check(m,false);
  if(d.articleMedia!==undefined){need(Array.isArray(d.articleMedia),'Invalid article media');for(const m of d.articleMedia){need(m!==null,'Invalid article media');check(m,false);}}
  return d.media;
}

export function validateRefinement(config){
  const r=config.design?.refinement;
  need(r&&['hybrid','classic','system'].includes(r.typography),'Invalid typography preset');
  need(['circular','underline','pill'].includes(r.navigation),'Invalid navigation preset');
  need(['editorial','filled','outline'].includes(r.action),'Invalid action preset');
  need(['emerald','custom'].includes(r.palette)&&['subtle','none'].includes(r.motion)&&r.minTarget===44,'Invalid design refinement');
  return r;
}
