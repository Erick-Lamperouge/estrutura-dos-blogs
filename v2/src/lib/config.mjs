import { validateInternational } from './international.mjs';
import { validateDesign } from './design.mjs';
/** Contrato compartilhado v1. Os bloqueios são deliberados na fase de pré-produção. */
export function validateBlogConfig(config){
  const fail=(message)=>{throw new Error(message)};
  const nonblank=v=>typeof v==="string"&&v.trim().length>0;
  const slug=v=>typeof v==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
  if(!config||typeof config!=="object"||config.schemaVersion!==1) fail("schemaVersion inválida");
  if(!slug(config.slug)) fail("slug inválido");
  for(const key of ["name","description","tagline","language"]) if(!nonblank(config[key])) fail("campo obrigatório: "+key);
  if(config.language!=="pt-BR"||!["draft","active"].includes(config.status)) fail("idioma ou status inválido");
  for(const key of ["background","surface","text","muted","primary","accent","border"]) if(!/^#[0-9a-fA-F]{6}$/.test(config.theme?.[key]??"")) fail("cor inválida: "+key);
  if(!Array.isArray(config.categories)||config.categories.length<1) fail("categorias obrigatórias");
  const slugs=new Set();
  for(const cat of config.categories){if(!slug(cat?.slug)||!nonblank(cat?.label)||slugs.has(cat.slug)) fail("categoria inválida ou duplicada");slugs.add(cat.slug)}
  const e=config.editorial;
  if(!nonblank(e?.voice)||!nonblank(e?.audience)||!Array.isArray(e.formats)||!e.formats.length||e.formats.some(f=>!slug(f))) fail("perfil editorial inválido");
  if(e.review!=="human_required"||e.opinion!=="approved_only"||e.requireSources!==true||e.allowAutomaticPublishing!==false) fail("proteções editoriais obrigatórias nesta fase");
  if(e.timeZone!=="America/Fortaleza"||!Array.isArray(e.initialResearchWindows)||e.initialResearchWindows.some(t=>typeof t!=="string"||!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) fail("janelas editoriais inválidas");
  const m=config.monetization;
  for(const channel of [m?.adsense,m?.affiliates,m?.products,m?.donations?.pix,m?.donations?.crypto]){
    if(typeof channel?.planned!=="boolean"||channel.enabled!==false) fail("monetização deve permanecer desativada nesta fase");
  }
  if(m.sponsorship!==false) fail("patrocínios fora do escopo");
  const p=config.preview;
  if(!nonblank(p?.featured?.title)||!nonblank(p?.featured?.category)||!nonblank(p?.featured?.summary)||!Array.isArray(p?.cards)||p.cards.some(c=>!nonblank(c?.category)||!nonblank(c?.title))) fail("conteúdo demonstrativo inválido");
  validateInternational(config);
  validateDesign(config);
  return config;
}

export function blogPath(config,...segments){
  validateBlogConfig(config);
  if(segments.some(s=>typeof s!=="string"||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))) throw new Error("segmento inválido");
  return "/"+[config.slug,...segments].join("/")+"/";
}
