import {lstatSync,readFileSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep,extname} from 'node:path';
import {validateArticles} from './articles.mjs';
import {articleFingerprint} from './publication-plan.mjs';

const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safeKeys=(x,keys)=>record(x)&&Object.keys(x).every(k=>keys.includes(k));
const bytes=x=>Buffer.byteLength(x,'utf8');
export const LIMITS=Object.freeze({batchBytes:4*1024*1024,catalogBytes:32*1024*1024,batchArticles:100,catalogArticles:5000,articleBytes:256*1024,mediaBytes:5*1024*1024,svgBytes:1024*1024});
const cleanText=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)&&!/<\s*\/?\s*[a-z!][^>]*>/i.test(value);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
function publicSource(value){
 try{
  const u=new URL(value),h=u.hostname.toLowerCase();
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&h.includes('.')&&!h.endsWith('.local')&&!h.endsWith('.localhost')&&!h.endsWith('.internal')&&!h.endsWith('.invalid')&&!/^[\d.]+$/.test(h)&&!h.includes(':')&&![...u.searchParams.keys()].some(k=>/^(?:access[_-]?token|api[_-]?key|secret|password|signature|auth|credential)$/i.test(k));
 }catch{return false;}
}
export function readBoundedJson(file,limit=LIMITS.catalogBytes){
 const st=lstatSync(file);need(st.isFile()&&!st.isSymbolicLink()&&st.size<=limit,'JSON input exceeds limit or is not a regular file');
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(file)));
}
// Deliberately small subset for original static editorial diagrams; not a general SVG sanitizer.
const TAGS=new Set(['svg','g','title','desc','path','rect','circle','ellipse','line','polyline','polygon','text','tspan']);
const ATTRS=new Set(['xmlns','viewBox','role','width','height','fill','fill-opacity','stroke','stroke-opacity','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','x','y','x1','y1','x2','y2','d','cx','cy','r','rx','ry','points','transform','text-anchor','font-family','font-weight','font-size','opacity','preserveAspectRatio']);
export function validateStaticSvg(raw){
 need(Buffer.isBuffer(raw)&&raw.length<=LIMITS.svgBytes,'SVG size or type');
 const s=new TextDecoder('utf-8',{fatal:true}).decode(raw),stack=[];
 need(!/<!|<\?|&(?!(?:amp|lt|gt|quot|apos);)/i.test(s),'SVG declarations, comments or entities outside static subset');
 const token=/<(\/?)([A-Za-z][\w-]*)([^<>]*)>|([^<]+)/gy;
 let pos=0,roots=0,count=0;
 while(pos<s.length){
  token.lastIndex=pos;const m=token.exec(s);need(m&&m.index===pos,'Malformed SVG token');pos=token.lastIndex;
  if(m[4]!==undefined){need(!m[4].trim()||['title','desc','text','tspan'].includes(stack.at(-1)),'Unexpected SVG text');continue;}
  const [,close,tag,tail]=m;need(TAGS.has(tag)&&++count<=10000,'Unsupported or excessive SVG elements');
  if(close){need(!tail.trim()&&stack.pop()===tag,'Malformed SVG closing tag');continue;}
  if(!stack.length){need(tag==='svg'&&++roots===1,'SVG must have exactly one root');}else need(tag!=='svg','Nested SVG unsupported');
  const self=/\/\s*$/.test(tail),attrs=tail.replace(/\/\s*$/,'');let i=0;const seen=new Set();
  const attr=/\s+([A-Za-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gy;
  while(i<attrs.length&&attrs.slice(i).trim()){
   attr.lastIndex=i;const a=attr.exec(attrs);need(a&&a.index===i,'Malformed SVG attribute');i=attr.lastIndex;
   const k=a[1],v=a[2]??a[3];need(ATTRS.has(k)&&!seen.has(k)&&v.length<=20000,'Unsupported or duplicate SVG attribute');seen.add(k);
   if(k==='xmlns')need(tag==='svg'&&v==='http://www.w3.org/2000/svg','Unexpected SVG namespace');
   else need(!/url\s*\(|(?:https?|data|javascript|file):|[&<>\u0000-\u001f]/i.test(v),'External or active SVG attribute');
   if(k==='viewBox'){const n=v.trim().split(/[\s,]+/).map(Number);need(n.length===4&&n.every(Number.isFinite)&&n[2]>0&&n[3]>0&&n[2]<=10000&&n[3]<=10000,'Unsupported SVG dimensions');}
  }
  if(tag==='svg')need(seen.has('xmlns')&&seen.has('viewBox'),'SVG requires namespace and viewBox');
  if(!self)stack.push(tag);
 }
 need(roots===1&&stack.length===0,'Unclosed SVG');
 return true;
}
export function readLocalMedia(root,urlPath){
 need(typeof urlPath==='string'&&/^\/[a-z0-9-]+\/media\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:avif|webp|png|jpe?g|svg)$/.test(urlPath),'Unsafe media path');
 const base=resolve(root),file=resolve(base,urlPath.slice(1)),rel=relative(base,file);
 const baseStat=lstatSync(base);need(baseStat.isDirectory()&&!baseStat.isSymbolicLink(),'Public root must be a real directory');
 need(rel&&!isAbsolute(rel)&&!rel.startsWith('..'+sep),'Media outside public root');
 let current=base;const parts=rel.split(sep);
 for(const [i,part] of parts.entries()){current=resolve(current,part);const s=lstatSync(current);need(!s.isSymbolicLink()&&(i===parts.length-1?s.isFile()&&s.size<=LIMITS.mediaBytes:s.isDirectory()),'Unsafe media file or oversized asset');}
 const b=readFileSync(file),ext=extname(file);
 if(ext==='.svg')validateStaticSvg(b);
 else if(ext==='.png')need(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'PNG signature');
 else if(ext==='.jpg'||ext==='.jpeg')need(b.length>=4&&b[0]===255&&b[1]===216&&b[2]===255,'JPEG signature');
 else if(ext==='.webp')need(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','WebP signature');
 else if(ext==='.avif')need(b.toString('ascii',4,8)==='ftyp'&&['avif','avis'].includes(b.toString('ascii',8,12)),'AVIF signature');
 return b;
}
export function validateIntakeCatalog(config,catalog,{readMedia,asOf}){
 need(date(asOf)&&typeof readMedia==='function','Invalid intake context');
 need(Array.isArray(catalog)&&catalog.length<=LIMITS.catalogArticles&&bytes(JSON.stringify(catalog))<=LIMITS.catalogBytes,'Catalog limit exceeded');
 for(const a of catalog){
  need(safeKeys(a,['blog','id','category','format','status','preparedAt','reviewedAt','previewCardIndex','media','sources','related','editions','analysisEvidence'])&&a.blog===config.slug,'Foreign blog or unsupported article fields');
  need(bytes(JSON.stringify(a))<=LIMITS.articleBytes&&date(a.preparedAt)&&a.preparedAt<=asOf,'Article size or future preparation date');
  need(Array.isArray(a.sources)&&a.sources.length<=40&&a.sources.every(s=>safeKeys(s,['id','title','url','checkedAt'])&&cleanText(s.title,400)&&typeof s.url==='string'&&s.url.length<=2048&&publicSource(s.url)),'Invalid source metadata');
  need(record(a.editions),'Invalid editions');
  for(const e of Object.values(a.editions)){
   need(safeKeys(e,['slug','title','summary','sections'])&&cleanText(e.title,240)&&cleanText(e.summary,1500)&&Array.isArray(e.sections)&&e.sections.length<=80,'Invalid localized text');
   for(const s of e.sections)need(safeKeys(s,['id','role','heading','paragraphs','sourceIds'])&&cleanText(s.role,60)&&cleanText(s.heading,240)&&Array.isArray(s.paragraphs)&&s.paragraphs.length<=80&&s.paragraphs.every(p=>cleanText(p,12000)),'Invalid section text or markup');
  }
  if(a.media!==null)need(record(a.media)&&cleanText(a.media.credit,240)&&record(a.media.alt)&&Object.values(a.media.alt).every(x=>cleanText(x,1200)),'Invalid media credit or alt');
 }
 const rows=validateArticles(config,catalog);
 need(rows.length===catalog.length,'Catalog must belong to one blog');
 for(const path of new Set(rows.flatMap(a=>a.media?[a.media.path]:[])))readMedia(path);
 return rows;
}
// Dry run only. No fetches, writes, deletion, automatic approvals or automatic publication.
export function planIntake(config,current,batch,options){
 const rows=validateIntakeCatalog(config,current,options);
 need(safeKeys(batch,['version','blog','add','update'])&&batch.version===1&&batch.blog===config.slug&&Array.isArray(batch.add)&&Array.isArray(batch.update),'Invalid intake envelope');
 need(batch.add.length+batch.update.length>0&&batch.add.length+batch.update.length<=LIMITS.batchArticles&&bytes(JSON.stringify(batch))<=LIMITS.batchBytes,'Invalid batch size');
 const candidate=structuredClone(rows),seen=new Set(),changes=[];
 for(const a of batch.add){
  need(record(a)&&typeof a.id==='string'&&!seen.has(a.id)&&!candidate.some(x=>x.id===a.id),'Article already exists or duplicate in batch');
  seen.add(a.id);candidate.push(a);changes.push({id:a.id,action:'add'});
 }
 for(const u of batch.update){
  need(safeKeys(u,['expectedFingerprint','article'])&&record(u.article)&&!seen.has(u.article.id),'Invalid or duplicate update');
  const i=rows.findIndex(a=>a.id===u.article.id);need(i>=0,'Update target missing');
  const before=rows[i];need(u.expectedFingerprint===articleFingerprint(before,options.readMedia),'Stale update fingerprint');
  need(Object.keys(before.editions).every(l=>u.article.editions?.[l]?.slug===before.editions[l].slug),'Existing article route cannot change or disappear');
  seen.add(before.id);candidate[i]=u.article;changes.push({id:before.id,action:'update'});
 }
 validateIntakeCatalog(config,candidate,options);
 const titleGroups=new Map();
 for(const a of candidate)for(const [locale,e] of Object.entries(a.editions)){const key=locale+'|'+e.title.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();const ids=titleGroups.get(key)??[];ids.push(a.id);titleGroups.set(key,ids);}
 return {status:'review-required',writesPerformed:false,publicationAuthorized:false,changes:changes.map(c=>({...c,fingerprint:articleFingerprint(candidate.find(a=>a.id===c.id),options.readMedia)})),duplicateTitleWarnings:[...titleGroups.values()].filter(ids=>ids.length>1),articleCount:candidate.length};
}
