import { createHash } from 'node:crypto';

const TRACKING_PARAMS = new Set(['fbclid','gclid','mc_cid','mc_eid','ref','ref_src','source','spm']);
const SUSPICIOUS_EXTENSIONS = new Set(['exe','msi','bat','cmd','com','scr','ps1','vbs','js','jar','apk','dmg','pkg','iso','lnk']);
const SUSPICIOUS_MIME = [/application\/x-msdownload/i,/application\/x-dosexec/i,/application\/x-sh/i,/application\/java-archive/i,/application\/vnd\.android\.package-archive/i];
const SOURCE_MAP = Object.freeze({freshrss:'FRESHRSS',gmail:'GMAIL',searxng:'SEARXNG'});
const htmlEntities = Object.freeze({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' '});
const sha256=(v)=>createHash('sha256').update(String(v)).digest('hex');
const clean=(v)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
export const sanitizeSnippet=(value,max=600)=>clean(String(value??'').replace(/<[^>]*>/g,' ').replace(/&(amp|lt|gt|quot|#39|nbsp);/g,m=>htmlEntities[m]??' ')).slice(0,max);
export const normalizeTitle=(value)=>sanitizeSnippet(value,300).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const normalizeOrigin=(value)=>clean(value).toLowerCase().replace(/^www\./,'').slice(0,240);
export const canonicalizeUrl=(value)=>{
  const raw=clean(value); if(!raw) return '';
  let url; try{url=new URL(raw);}catch{throw Object.assign(new Error('URL de origem inválida.'),{code:'SUBSOLO_INGEST_URL_INVALID'});}
  if(!['http:','https:'].includes(url.protocol)) throw Object.assign(new Error('Protocolo de URL não permitido.'),{code:'SUBSOLO_INGEST_URL_UNSAFE'});
  url.hash=''; url.hostname=url.hostname.toLowerCase().replace(/^www\./,'');
  if((url.protocol==='https:'&&url.port==='443')||(url.protocol==='http:'&&url.port==='80'))url.port='';
  for(const key of [...url.searchParams.keys()]) if(key.toLowerCase().startsWith('utm_')||TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  const sorted=[...url.searchParams.entries()].sort(([a,av],[b,bv])=>a.localeCompare(b)||av.localeCompare(bv)); url.search=''; for(const [k,v] of sorted)url.searchParams.append(k,v);
  url.pathname=url.pathname.replace(/\/{2,}/g,'/'); if(url.pathname.length>1)url.pathname=url.pathname.replace(/\/$/,'');
  return url.toString();
};
const parseDate=(value)=>{if(value==null||value==='')return null; const d=new Date(value); if(Number.isNaN(d.valueOf()))return null; return d.toISOString();};
const originFromUrl=(url)=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return 'origem-desconhecida';}};
const header=(headers,name)=>headers.find(h=>String(h.name).toLowerCase()===name.toLowerCase())?.value??'';
const base64urlDecode=(value)=>{if(!value)return ''; try{return Buffer.from(value,'base64url').toString('utf8');}catch{return '';}};
const messageParts=(part,out=[])=>{if(!part)return out; out.push(part); for(const child of part.parts??[])messageParts(child,out); return out;};
const parseSender=(raw)=>{const match=String(raw??'').match(/<([^>]+)>/); return clean(match?.[1]??raw).toLowerCase();};
export const classifyAttachment=({filename='',mimeType='',size=0,attachmentId=null})=>{
  const ext=filename.includes('.')?filename.split('.').pop().toLowerCase():'';
  const suspicious=SUSPICIOUS_EXTENSIONS.has(ext)||SUSPICIOUS_MIME.some(x=>x.test(mimeType));
  return Object.freeze({filename:clean(filename)||'sem-nome',mime_type:clean(mimeType)||'application/octet-stream',size_bytes:Number(size)||0,attachment_id:attachmentId?String(attachmentId):null,suspicious,reason:suspicious?'tipo executável ou potencialmente ativo':'aguarda inspeção humana'});
};
export const normalizeFreshRssItem=(item,{observedAt=new Date().toISOString()}={})=>{
  const url=canonicalizeUrl(item?.alternate?.find(x=>x?.href)?.href??item?.canonical?.find(x=>x?.href)?.href??item?.url??'');
  const sourceOrigin=clean(item?.origin?.title??item?.origin?.htmlUrl??originFromUrl(url));
  return Object.freeze({source:'freshrss',source_record_id:clean(item?.id??sha256(url).slice(0,20)),title:sanitizeSnippet(item?.title,300),url,source_origin:sourceOrigin,published_at:parseDate(item?.published?Number(item.published)*1000:item?.published_at),fact_occurred_at:parseDate(item?.fact_occurred_at),observed_at:parseDate(observedAt),snippet:sanitizeSnippet(item?.summary?.content??item?.content?.content??item?.snippet),snippet_natureza:'RESUMO_DE_AGREGADOR_NAO_VERIFICADO',categories:(item?.categories??[]).map(clean),attachments:[],claim_nature:/\b(release|comunicado|press release)\b/i.test(`${item?.title??''} ${item?.summary?.content??''}`)?'COMUNICADO_OU_RELEASE':'ITEM_DE_AGREGADOR'});
};
export const normalizeGmailMessage=(message,{trustedSenders=[],trustedDomains=[],observedAt=new Date().toISOString()}={})=>{
  const headers=message?.payload?.headers??[]; const sender=parseSender(header(headers,'From')); const domain=sender.split('@')[1]??'';
  const trusted=trustedSenders.map(x=>x.toLowerCase()).includes(sender)||trustedDomains.map(x=>x.toLowerCase()).includes(domain);
  if(!sender||!trusted)throw Object.assign(new Error('E-mail sem remetente confiável.'),{code:'SUBSOLO_INGEST_GMAIL_UNTRUSTED_SENDER',details:{sender_hash:sha256(sender).slice(0,12)}});
  const parts=messageParts(message.payload); const textPart=parts.find(x=>x.mimeType==='text/plain')??parts.find(x=>x.mimeType==='text/html');
  const body=base64urlDecode(textPart?.body?.data); const subject=sanitizeSnippet(header(headers,'Subject'),300);
  const messageId=clean(header(headers,'Message-ID')||message.id); const url=`https://mail.google.com/mail/u/0/?message=${encodeURIComponent(message.id??messageId)}`;
  const attachments=parts.filter(x=>x?.filename||x?.body?.attachmentId).map(x=>classifyAttachment({filename:x.filename,mimeType:x.mimeType,size:x.body?.size,attachmentId:x.body?.attachmentId}));
  return Object.freeze({source:'gmail',source_record_id:messageId,title:subject||'Mensagem sem assunto',url,source_origin:sender,published_at:parseDate(message?.internalDate?Number(message.internalDate):header(headers,'Date')),fact_occurred_at:parseDate(message?.fact_occurred_at),observed_at:parseDate(observedAt),snippet:sanitizeSnippet(body||message?.snippet),snippet_natureza:'ALEGACAO_DO_REMETENTE_NAO_VERIFICADA',categories:(message?.labelIds??[]).map(clean),attachments,claim_nature:/\b(release|comunicado|press release|assessoria)\b/i.test(`${subject} ${body}`)?'COMUNICADO_OU_RELEASE':'MENSAGEM_DE_FONTE'});
};
export const normalizeSearxngResult=(result,{query='',observedAt=new Date().toISOString()}={})=>{
  const url=canonicalizeUrl(result?.url??'');
  return Object.freeze({source:'searxng',source_record_id:clean(result?.id??sha256(`${url}\0${result?.title??''}`).slice(0,20)),title:sanitizeSnippet(result?.title,300),url,source_origin:clean(result?.engine??result?.engines?.join(',')??originFromUrl(url)),published_at:parseDate(result?.publishedDate??result?.published_at),fact_occurred_at:parseDate(result?.fact_occurred_at),observed_at:parseDate(observedAt),snippet:sanitizeSnippet(result?.content??result?.snippet),snippet_natureza:'SNIPPET_DE_BUSCA_NAO_VERIFICADO',categories:[clean(result?.category??'pesquisa'),clean(query)].filter(Boolean),attachments:[],claim_nature:'RESULTADO_DE_METABUSCA'});
};
export const normalizeSourceEntry=(source,entry,config={})=>source==='freshrss'?normalizeFreshRssItem(entry,config):source==='gmail'?normalizeGmailMessage(entry,config):source==='searxng'?normalizeSearxngResult(entry,config):(()=>{throw Object.assign(new Error('Fonte de captação desconhecida.'),{code:'SUBSOLO_INGEST_SOURCE_INVALID'});})();
export const createSourceFingerprint=({url,title,source_origin})=>sha256(`${canonicalizeUrl(url)}\0${normalizeTitle(title)}\0${normalizeOrigin(source_origin)}`);
const tokens=(value)=>new Set(normalizeTitle(value).split(' ').filter(x=>x.length>2));
export const titleSimilarity=(a,b)=>{const A=tokens(a),B=tokens(b); if(!A.size||!B.size)return 0; const intersection=[...A].filter(x=>B.has(x)).length; return intersection/(A.size+B.size-intersection);};
export const findDuplicate=(entry,existing,{threshold=0.82}={})=>{
  const fingerprint=createSourceFingerprint(entry); const canonical=canonicalizeUrl(entry.url); const origin=normalizeOrigin(entry.source_origin);
  for(const pitch of existing){if(pitch.source_fingerprint===fingerprint)return{kind:'exact',pitch};}
  for(const pitch of existing){const sameUrl=canonical&&pitch.url_origem===canonical; const sameOrigin=normalizeOrigin(pitch.source_origin)===origin; const similar=sameOrigin&&titleSimilarity(entry.title,pitch.titulo_provisorio)>=threshold; if(sameUrl||similar)return{kind:'probable',pitch,similarity:titleSimilarity(entry.title,pitch.titulo_provisorio)};}
  return null;
};
export const createPreliminaryPitch=(entry)=>{
  const fingerprint=createSourceFingerprint(entry); const date=(entry.observed_at??new Date().toISOString()).slice(0,10);
  return Object.freeze({pauta_id:`pauta-${date}-${fingerprint.slice(0,16)}`,titulo_provisorio:entry.title,origem:SOURCE_MAP[entry.source],url_origem:canonicalizeUrl(entry.url),prioridade:'D',nivel_cobertura:0,destino_inicial:'ACOMPANHAMENTO_INTERNO',canal_provavel:'',quadro_provavel:'',responsavel:'redacao011-cora',editor:'redacao011-cora',guardiao_editorial:'',status:'TRIAGEM',prazo:'',proximo_gatilho:'Confirmar a alegação em fonte primária ou independente antes de decisão editorial.',documento:'',pasta_drive:'',criado_em:entry.observed_at,atualizado_em:entry.observed_at,observacoes_privadas:'Entrada automatizada. A classificação é preliminar e não representa decisão da Mesa de Abertura.',classificacao_preliminar:'PRELIMINAR_NAO_EDITORIAL',verificacao:'NAO_VERIFICADO',claim_nature:entry.claim_nature,source_fingerprint:fingerprint,source_record_id:entry.source_record_id,source_origin:entry.source_origin,source_published_at:entry.published_at,fact_occurred_at:entry.fact_occurred_at,snippet_preliminar:entry.snippet,snippet_natureza:entry.snippet_natureza,origin_trace_json:JSON.stringify({source:entry.source,record_id:entry.source_record_id,origin:entry.source_origin,url:canonicalizeUrl(entry.url),categories:entry.categories}),quarantine_manifest_json:JSON.stringify(entry.attachments??[])});
};
