/** Shared locale, geographic and payment policy. Preview only. */
const nonblank = x => typeof x === 'string' && x.trim().length > 0;
const slug = x => typeof x === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x);
const country = x => typeof x === 'string' && /^[A-Z]{2}$/.test(x);
const unique = a => new Set(a).size === a.length;
const require = (ok,msg) => {if(!ok) throw new Error(msg);};
const locale = x => {try{return nonblank(x) && Intl.getCanonicalLocales(x)[0] === x;}catch{return false;}};
const uiKeys = ["skip","notice","navigation","home","categories","pitches","content","advertising","proposal","preparation","filter","placeholder","draft","complementary","about","products","productDescription","footer","count","language","preview"];
export function validateInternational(config) {
  const i = config.international;
  require(i && locale(i.defaultLocale) && i.defaultLocale === config.language,'Invalid default locale');
  require(Array.isArray(i.editions) && i.editions.length && unique(i.editions.map(e=>e.locale)) && unique(i.editions.map(e=>e.path)),'Duplicate or missing editions');
  require(i.editions.filter(e=>e.locale===i.defaultLocale && e.path==='').length===1,'Default edition must use root path');
  for(const e of i.editions){
    require(locale(e.locale) && nonblank(e.label) && (e.locale===i.defaultLocale ? e.path==='' : e.path===e.locale.toLowerCase() && slug(e.path)),'Invalid locale edition');
    require(uiKeys.every(k=>nonblank(e.ui?.[k])),'Incomplete localized interface');
    if(e.locale!==i.defaultLocale){
      const c=e.copy;
      require(nonblank(c?.description)&&nonblank(c?.tagline)&&Array.isArray(c.categories)&&c.categories.length===config.categories.length&&c.categories.every(nonblank),'Incomplete translated categories');
      require(nonblank(c.featured?.title)&&nonblank(c.featured?.summary)&&nonblank(c.featured?.category)&&Array.isArray(c.cards)&&c.cards.length===config.preview.cards.length&&c.cards.every(p=>nonblank(p?.title)&&nonblank(p?.category)),'Incomplete translated content');
    }
  }
  require(Array.isArray(i.candidateLocales)&&unique(i.candidateLocales)&&i.candidateLocales.every(x=>locale(x)&&!i.editions.some(e=>e.locale===x)),'Invalid candidate locales');
  const a=i.audience;
  require(a&&['global','national'].includes(a.scope)&&a.expansion==='evidence_driven','Invalid audience policy');
  require(a.scope==='national'?country(a.jurisdiction):a.jurisdiction===null,'Invalid jurisdiction');
  for(const list of [a.seedMarkets,a.watchMarkets]) require(Array.isArray(list)&&unique(list)&&list.every(country),'Invalid markets');
  require(a.scope!=='national'||a.seedMarkets.length===1&&a.seedMarkets[0]===a.jurisdiction,'National editorial scope must match jurisdiction');
  require(!a.seedMarkets.some(x=>a.watchMarkets.includes(x)),'Overlapping market tiers');
  require(Array.isArray(a.seedTopics)&&a.seedTopics.length&&unique(a.seedTopics)&&a.seedTopics.every(slug),'Invalid seed topics');
  const shares=a.allocation;
  require(shares&&['core','demand','exploration'].every(k=>Number.isInteger(shares[k])&&shares[k]>0)&&shares.core+shares.demand+shares.exploration===100,'Invalid editorial allocation');
  require(Number.isInteger(a.minObservedImpressions)&&a.minObservedImpressions>0&&Number.isInteger(a.minSources)&&a.minSources>0,'Invalid evidence thresholds');
  const p=i.payments;
  require(p?.activated===false&&Array.isArray(p.markets)&&p.markets.length&&unique(p.markets.map(x=>x.market))&&p.markets.some(x=>x.market==='default'),'Payments must remain disabled with fallback');
  for(const m of p.markets){
    require((m.market==='default'||country(m.market))&&(m.currency===null||/^[A-Z]{3}$/.test(m.currency))&&Array.isArray(m.candidates)&&m.candidates.length&&unique(m.candidates)&&m.candidates.every(x=>['pix','boleto','card','crypto'].includes(x)),'Invalid payment market');
    require(m.market==='BR'||!m.candidates.some(x=>['pix','boleto'].includes(x)),'Brazil payment methods must not be assumed abroad');
  }
  require(config.editorial.mode==='hybrid'&&config.editorial.betting===false&&['sporting_analysis_only','not_applicable'].includes(config.editorial.forecasts),'Invalid editorial mode or betting policy');
  return config;
}
export function localePath(config, language, ...segments){
  validateInternational(config);
  const edition=config.international.editions.find(e=>e.locale===language);
  require(edition,'Edition not enabled');
  require(slug(config.slug)&&segments.every(slug),'Invalid path');
  return '/'+[config.slug,edition.path,...segments].filter(Boolean).join('/')+'/';
}
export function localizedView(config,language){
  validateInternational(config);
  const e=config.international.editions.find(e=>e.locale===language);
  require(e,'Edition not enabled');
  const c=e.copy;
  return {language:e.locale,ui:e.ui,home:localePath(config,language),editions:config.international.editions.map(x=>({locale:x.locale,label:x.label,href:localePath(config,x.locale)})),description:c?.description??config.description,tagline:c?.tagline??config.tagline,categories:config.categories.map((x,index)=>({...x,label:c?.categories[index]??x.label})),preview:c?{featured:c.featured,cards:c.cards}:config.preview};
}
export function paymentCandidates(config,market){
  validateInternational(config);
  require(country(market),'Invalid market');
  const m=config.international.payments.markets.find(x=>x.market===market)??config.international.payments.markets.find(x=>x.market==='default');
  return {market,currency:m.currency,planned:[...m.candidates],enabled:[]};
}
