import {localePath} from './international.mjs';
const need=(x,msg)=>{if(!x)throw Error(msg);};
const txt=(x,max=1000)=>typeof x==='string'&&x.trim()&&x.length<=max&&!/[\u0000-\u001f<>]/.test(x);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
export const TRUST_BLOG='futebolando';
export const TRUST_LINKS=Object.freeze({
 host:'https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages',
 privacy:'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
 law:'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm',
 anpd:'https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais'
});
export function trustPath(config,locale){return localePath(config,locale,locale===config.language?'transparencia':'transparency');}
export function trustLabels(locale){return locale==='en'?{title:'About, editorial standards and privacy',description:'How Futebolando works, checks its content and handles privacy.',link:'About & transparency'}:{title:'Sobre, política editorial e privacidade',description:'Como o Futebolando funciona, revisa seus conteúdos e trata a privacidade.',link:'Sobre e transparência'};}
export function validateTrustProfile(config,p,{live=false,asOf}={}){
 need(p?.version===1&&p.blog===config.slug&&p.brand===config.name&&txt(p.network,120)&&date(p.noticeVersion)&&date(asOf)&&p.noticeVersion<=asOf&&p.hosting==='github-pages','Invalid trust profile');
 const services=['analytics','ads','comments','accounts','forms','payments'];
 need(Object.keys(p.services??{}).length===services.length&&services.every(k=>p.services[k]===false),'New data or commercial services require separate privacy review');
 const o=p.operator;
 if(o!==null){
  need(o&&txt(o.name,180)&&typeof o.contactEmail==='string'&&o.contactEmail.length<=254&&/^[A-Za-z0-9.!#$%&'*+/=?^_{}|~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(o.contactEmail)&&o.contactVerified===true,'Verified authorized public contact required');
  need(date(o.reviewedAt)&&o.reviewedAt>=p.noticeVersion&&o.reviewedAt<=asOf&&txt(o.approvalReference,200),'Trust notice approval required');
  for(const locale of config.international.editions.map(e=>e.locale))need(txt(o.disclosure?.[locale]?.purposes)&&txt(o.disclosure?.[locale]?.legalBasis)&&txt(o.disclosure?.[locale]?.retention)&&txt(o.disclosure?.[locale]?.sharing),'Missing localized operator disclosure');
 }
 need(!live||o!==null,'Publication blocked: confirm responsible operator, private contact and privacy disclosures');
 return p;
}
