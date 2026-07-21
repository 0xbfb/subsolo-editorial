export class ReconciliationFailure extends Error {
  constructor(code, message, action, details = {}) { super(message); this.name='ReconciliationFailure'; this.code=code; this.action=action; this.details=details; }
  toJSON(){ return {code:this.code,message:this.message,action:this.action,retryable:false,details:this.details}; }
}
const keyOf = (entry) => `${entry.article_id}:r${entry.revision}`;
const groupBy = (entries, keyFn) => entries.reduce((map, entry) => { const key=keyFn(entry); map.set(key,[...(map.get(key)??[]),entry]); return map; }, new Map());
const issue = (code,severity,key,action,details={}) => ({code,severity,key,action,auto_fix:false,details});

export const planOperationalReconciliation = ({ sheets = [], drive = [], github = [], deployments = [], generated_at = new Date().toISOString() } = {}) => {
  const sheetByKey=groupBy(sheets,keyOf); const driveByKey=groupBy(drive,keyOf); const githubByKey=groupBy(github,keyOf);
  const issues=[];
  for (const [key, records] of sheetByKey) if(records.length>1) issues.push(issue('SHEETS_RECORD_AMBIGUOUS','error',key,'Remova ou consolide as linhas duplicadas no Sheets.',{count:records.length}));
  for (const [key, records] of driveByKey) if(records.length>1) issues.push(issue('DRIVE_PACKAGE_AMBIGUOUS','error',key,'Identifique o pacote canônico no Drive sem apagar revisões.',{count:records.length}));
  for (const [key, records] of githubByKey) if(records.length>1) issues.push(issue('GITHUB_PULL_REQUEST_AMBIGUOUS','error',key,'Feche ou documente o PR duplicado antes de continuar.',{count:records.length}));
  for (const [key, records] of sheetByKey) {
    const sheet=records[0]; const driveRecord=driveByKey.get(key)?.[0]??null; const pr=githubByKey.get(key)?.[0]??null;
    if(sheet.package_sha256 && !driveRecord) issues.push(issue('DRIVE_PACKAGE_MISSING','error',key,'Rearquive o pacote validado antes de retomar Git ou publicação.',{package_sha256:sheet.package_sha256}));
    if(sheet.drive_file_id && driveRecord && sheet.drive_file_id!==driveRecord.file_id) issues.push(issue('DRIVE_FILE_ID_DIVERGED','error',key,'Confirme manualmente qual file_id corresponde ao checksum.',{sheet_file_id:sheet.drive_file_id,drive_file_id:driveRecord.file_id}));
    if(['PR_CRIADO','AGUARDANDO_MERGE'].includes(sheet.status) && !pr) issues.push(issue('GITHUB_PULL_REQUEST_MISSING','error',key,'Recrie o PR ou corrija o status editorial após confirmação humana.'));
    if(pr?.state==='open' && !['PR_CRIADO','AGUARDANDO_MERGE'].includes(sheet.status)) issues.push(issue('SHEETS_PULL_REQUEST_DIVERGED','warning',key,'Atualize o Sheets após conferir o PR aberto.',{sheet_status:sheet.status,pr_url:pr.pr_url}));
    if(pr?.state==='merged' && sheet.status!=='PUBLICADO') issues.push(issue('SHEETS_MERGE_DIVERGED','warning',key,'Confirme o deploy e então atualize o Sheets para PUBLICADO.',{sheet_status:sheet.status}));
    if(sheet.status==='PUBLICADO') {
      const deployment=deployments.find((item)=>item.commit_sha===pr?.merge_commit_sha && item.state==='success');
      if(!deployment) issues.push(issue('PUBLIC_DEPLOYMENT_UNCONFIRMED','warning',key,'Execute o smoke test externo e confirme o deployment antes de encerrar.',{commit_sha:pr?.merge_commit_sha??null}));
    }
  }
  for (const [key, records] of driveByKey) if(!sheetByKey.has(key)) issues.push(issue('DRIVE_PACKAGE_ORPHAN','warning',key,'Associe o pacote a uma revisão conhecida; não apague automaticamente.',{file_id:records[0].file_id}));
  for (const [key, records] of githubByKey) if(!sheetByKey.has(key)) issues.push(issue('GITHUB_PULL_REQUEST_ORPHAN','warning',key,'Associe o PR a uma linha editorial ou feche-o manualmente.',{pr_url:records[0].pr_url}));
  const ordered=issues.sort((a,b)=>a.key.localeCompare(b.key)||a.code.localeCompare(b.code));
  return Object.freeze({mode:'dry-run',generated_at,counts:{sheets:sheets.length,drive:drive.length,github:github.length,deployments:deployments.length,issues:ordered.length},issues:ordered,writes:false});
};

export const executeOperationalReconciliation = ({ snapshot, mode='dry-run' }) => {
  const plan=planOperationalReconciliation(snapshot);
  if(mode==='apply' && plan.issues.length) throw new ReconciliationFailure('SUBSOLO_RECONCILIATION_REQUIRES_HUMAN','A reconciliação encontrou divergências ambíguas.','Resolva cada item explicitamente; nenhuma correção silenciosa foi aplicada.',{issues:plan.issues});
  return {...plan,mode,disposition:plan.issues.length?'human-review-required':'consistent'};
};
