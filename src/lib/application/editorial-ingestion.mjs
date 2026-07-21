import { createPreliminaryPitch, findDuplicate, normalizeSourceEntry } from '../domain/editorial-ingestion.mjs';
export class IngestionFailure extends Error{constructor(code,message,action,details={},retryable=false){super(message);this.name='IngestionFailure';this.code=code;this.action=action;this.details=details;this.retryable=retryable;}toJSON(){return{code:this.code,message:this.message,action:this.action,retryable:this.retryable,details:this.details};}}
const safeError=(error)=>({code:error?.code??'SUBSOLO_INGEST_ENTRY_INVALID',message:String(error?.message??error).slice(0,300),action:error?.action??'Revise a entrada e encaminhe para triagem manual.',retryable:Boolean(error?.retryable),details:error?.details??{}});
export const planEditorialIngestion=async({source,entries,repository,config={},now=()=>new Date()})=>ingestEditorialEntries({source,entries,repository,quarantine:{record:async()=>{}},config,mode:'dry-run',now});
export const ingestEditorialEntries=async({source,entries,repository,quarantine,config={},mode='dry-run',now=()=>new Date()})=>{
  if(!['dry-run','apply'].includes(mode))throw new IngestionFailure('SUBSOLO_INGEST_MODE_INVALID','Modo de ingestão inválido.','Use dry-run ou apply.');
  if(!Array.isArray(entries))throw new IngestionFailure('SUBSOLO_INGEST_BATCH_INVALID','O lote de entrada não é uma lista.','Forneça uma lista de entradas.');
  const existing=await repository.list(); const working=[...existing]; const outcomes=[]; const quarantinePlans=[];
  for(const raw of entries){
    try{
      const normalized=normalizeSourceEntry(source,raw,{...config,observedAt:config.observedAt??now().toISOString()});
      if(!normalized.title||!normalized.url)throw Object.assign(new Error('Entrada sem título ou URL rastreável.'),{code:'SUBSOLO_INGEST_ENTRY_INCOMPLETE'});
      const attachments=normalized.attachments??[]; const suspicious=attachments.filter(x=>x.suspicious);
      for(const item of attachments)quarantinePlans.push({source,source_record_id:normalized.source_record_id,...item});
      if(suspicious.length){outcomes.push({disposition:'rejected',code:'SUBSOLO_INGEST_ATTACHMENT_SUSPICIOUS',source_record_id:normalized.source_record_id,count:suspicious.length});continue;}
      const duplicate=findDuplicate(normalized,working,{threshold:config.duplicateThreshold??0.82});
      if(duplicate){outcomes.push({disposition:duplicate.kind==='exact'?'duplicate':'probable-duplicate',code:duplicate.kind==='exact'?'SUBSOLO_INGEST_DUPLICATE':'SUBSOLO_INGEST_DUPLICATE_PROBABLE',source_record_id:normalized.source_record_id,duplicate_of:duplicate.pitch.pauta_id,similarity:duplicate.similarity??1});continue;}
      const pitch=createPreliminaryPitch(normalized); working.push(pitch);
      if(mode==='apply')await repository.insert(pitch);
      outcomes.push({disposition:mode==='apply'?'created':'planned',pauta_id:pitch.pauta_id,status:pitch.status,classification:pitch.classificacao_preliminar,source_record_id:pitch.source_record_id,claim_nature:pitch.claim_nature});
    }catch(error){const failure=safeError(error);outcomes.push({disposition:'rejected',...failure});}
  }
  if(mode==='apply')for(const item of quarantinePlans)await quarantine.record(item);
  const count=(d)=>outcomes.filter(x=>x.disposition===d).length;
  const warnings=[]; if(config.partial===true)warnings.push({code:'SUBSOLO_INGEST_SEARCH_PARTIAL',failed_engines:config.failedEngines??[]});
  return Object.freeze({schema_version:'1.0.0',mode,source,generated_at:now().toISOString(),input_count:entries.length,created_count:count('created'),planned_count:count('planned'),duplicate_count:count('duplicate'),probable_duplicate_count:count('probable-duplicate'),rejected_count:count('rejected'),quarantine_count:quarantinePlans.length,editorial_transition:'TRIAGEM_ONLY',publication_effects:false,warnings,outcomes});
};
export const triageReportMarkdown=(report)=>`# Relatório de triagem — ${report.source}\n\n**Gerado:** ${report.generated_at}\n**Modo:** ${report.mode}\n\n| Métrica | Total |\n|---|---:|\n| Entradas | ${report.input_count} |\n| Pautas criadas | ${report.created_count} |\n| Pautas planejadas | ${report.planned_count} |\n| Duplicatas | ${report.duplicate_count} |\n| Duplicatas prováveis | ${report.probable_duplicate_count} |\n| Rejeitadas | ${report.rejected_count} |\n| Anexos em quarentena | ${report.quarantine_count} |\n\nTodas as pautas permanecem em **TRIAGEM**, com classificação **PRELIMINAR NÃO EDITORIAL**. Nenhuma publicação foi criada.\n`;
