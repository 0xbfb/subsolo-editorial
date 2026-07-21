import { createHash } from 'node:crypto';
import { access, lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SCHEMA_VERSION='1.0.0';
const PACKAGE_FORMAT='subsolo-edition-package';
const REQUIRED_PUBLICATION_FILES=['publication.md','sources.json','corrections.json','media.json','provenance.public.json'];
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const EDITION_ID=/^ed_\d{4}-\d{2}-\d{2}$/;
const PUBLICATION_ID=/^pub_[0-9A-HJKMNP-TV-Z]{26}$/;
const RUN_ID=/^run_\d{8}T\d{6}[+-]\d{4}_r[1-9]\d*$/;
const SAFE_SEGMENT=/^[A-Za-z0-9._-]+$/;

export class PackageFailure extends Error {
  constructor(code,message,action,details={}) { super(message); this.name='PackageFailure'; this.code=code; this.action=action; this.details=details; }
  toJSON(){ return {code:this.code,message:this.message,action:this.action,details:this.details}; }
}

const stableValue=(value)=>Array.isArray(value)?value.map(stableValue):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map((key)=>[key,stableValue(value[key])])):value;
const stableStringify=(value)=>`${JSON.stringify(stableValue(value),null,2)}\n`;
const sha256=(data)=>createHash('sha256').update(data).digest('hex');
const exists=async(target)=>{ try { await access(target); return true; } catch(error){ if(error?.code==='ENOENT') return false; throw error; } };
const fail=(code,message,action,details)=>{ throw new PackageFailure(code,message,action,details); };

const normalizeRelative=(value,label='caminho')=>{
  if(typeof value!=='string'||value.trim()==='') fail('SUBSOLO_PACKAGE_PATH_INVALID',`${label} vazio.`,`Use um caminho relativo dentro do pacote.`);
  const normalized=value.replaceAll('\\','/').replace(/^\.\//,'');
  if(path.posix.isAbsolute(normalized)||normalized.includes('\0')) fail('SUBSOLO_PACKAGE_PATH_INVALID',`${label} absoluto ou inválido: ${value}.`,`Use caminho relativo seguro.`);
  const segments=normalized.split('/');
  if(segments.some((segment)=>segment===''||segment==='.'||segment==='..'||!SAFE_SEGMENT.test(segment))) fail('SUBSOLO_PACKAGE_PATH_INVALID',`${label} contém segmento inseguro: ${value}.`,`Remova travessia, espaços ambíguos e caracteres especiais.`);
  return segments.join('/');
};

const assertWorkspaceSafe=async(root)=>{
  const walk=async(current,relative='')=>{
    const entries=await readdir(current,{withFileTypes:true});
    for(const entry of entries){
      const rel=relative?`${relative}/${entry.name}`:entry.name;
      const full=path.join(current,entry.name);
      const stat=await lstat(full);
      if(stat.isSymbolicLink()) fail('SUBSOLO_PACKAGE_SYMLINK_REJECTED',`Symlink rejeitado: ${rel}.`,`Substitua por arquivo regular dentro do workspace.`);
      const lowered=rel.toLowerCase();
      if(lowered.split('/').some((segment)=>['.git','node_modules','.env','original','originals','originais'].includes(segment))) fail('SUBSOLO_PACKAGE_PRIVATE_FILE',`Arquivo ou diretório privado rejeitado: ${rel}.`,`Remova originais, segredos e dependências do workspace público.`);
      if(entry.isDirectory()) await walk(full,rel);
    }
  };
  await walk(root);
};

const readJson=async(file,label)=>{ try { return JSON.parse(await readFile(file,'utf8')); } catch(error){ fail('SUBSOLO_PACKAGE_JSON_INVALID',`${label} inválido: ${file}.`,`Corrija o JSON antes de empacotar.`,{cause:error.message}); } };
const scalarFromFrontMatter=(source,key)=>{
  const block=/^---\n([\s\S]*?)\n---(?:\n|$)/.exec(source)?.[1];
  if(!block) fail('SUBSOLO_PACKAGE_PUBLICATION_INVALID','publication.md sem front matter.','Exporte novamente a publicação.');
  const match=new RegExp(`^${key}:\\s*(.+)$`,'m').exec(block);
  if(!match) return undefined;
  const raw=match[1].trim();
  if(raw==='null') return null;
  if(raw==='true') return true;
  if(raw==='false') return false;
  if(raw.startsWith('"')) { try { return JSON.parse(raw); } catch {} }
  return raw;
};

const validateEdition=(edition)=>{
  if(!edition||typeof edition!=='object'||Array.isArray(edition)) fail('SUBSOLO_PACKAGE_EDITION_INVALID','edition.json deve ser um objeto.','Corrija a edição.');
  if(edition.schema_version!==SCHEMA_VERSION) fail('SUBSOLO_PACKAGE_SCHEMA_INVALID',`Schema não suportado: ${edition.schema_version}.`,`Use ${SCHEMA_VERSION}.`);
  if(!EDITION_ID.test(edition.id??'')||edition.id!==`ed_${edition.date}`||!ISO_DATE.test(edition.date??'')) fail('SUBSOLO_PACKAGE_EDITION_INVALID','ID e data da edição são incompatíveis.','Use ed_YYYY-MM-DD e a mesma data.');
  if(!Number.isInteger(edition.revision)||edition.revision<1) fail('SUBSOLO_PACKAGE_REVISION_INVALID',`Revisão inválida: ${edition.revision}.`,'Use inteiro a partir de 1.');
  if(!RUN_ID.test(edition.run_id??'')||!edition.run_id.endsWith(`_r${edition.revision}`)) fail('SUBSOLO_PACKAGE_RUN_ID_INVALID',`run_id inválido: ${edition.run_id}.`,'Use run_YYYYMMDDTHHMMSS±HHMM_rN.');
  if(edition.timezone!=='America/Sao_Paulo') fail('SUBSOLO_PACKAGE_TIMEZONE_INVALID','Timezone da edição inválida.','Use America/Sao_Paulo.');
  for(const field of ['generated_at','published_at']) if(!ISO_DATETIME.test(edition[field]??'')) fail('SUBSOLO_PACKAGE_DATETIME_INVALID',`${field} inválido.`,`Use ISO 8601 com fuso explícito.`);
  if(!['publicada','selada','corrigida'].includes(edition.status)) fail('SUBSOLO_PACKAGE_STATUS_INVALID',`Estado público inválido: ${edition.status}.`,'Use publicada, selada ou corrigida.');
  if(edition.status==='publicada'&&edition.sealed_at!==null) fail('SUBSOLO_PACKAGE_SEAL_INVALID','Edição publicada não pode possuir sealed_at.','Use status selada/corrigida ou remova sealed_at.');
  if(edition.status==='selada'&&!ISO_DATETIME.test(edition.sealed_at??'')) fail('SUBSOLO_PACKAGE_SEAL_INVALID','Edição selada exige sealed_at.','Informe o fechamento em ISO 8601.');
  if(edition.status==='corrigida'&&edition.sealed_at!==null&&!ISO_DATETIME.test(edition.sealed_at??'')) fail('SUBSOLO_PACKAGE_SEAL_INVALID','sealed_at inválido em edição corrigida.','Use null ou ISO 8601 com fuso.');
  if(edition.revision===1&&edition.supersedes!==null) fail('SUBSOLO_PACKAGE_SUPERSEDES_INVALID','A revisão 1 não pode substituir pacote anterior.','Use supersedes: null.');
  if(edition.revision>1&&(typeof edition.supersedes!=='string'||edition.supersedes==='')) fail('SUBSOLO_PACKAGE_SUPERSEDES_INVALID','Revisão posterior exige supersedes.','Informe o run_id da revisão anterior.');
  if(!Array.isArray(edition.publications)||edition.publications.length===0) fail('SUBSOLO_PACKAGE_PUBLICATIONS_EMPTY','A edição não possui publicações.','Inclua ao menos uma publicação.');
  const ids=new Set(); const positions=new Set();
  for(const item of edition.publications){
    if(!PUBLICATION_ID.test(item.id??'')) fail('SUBSOLO_PACKAGE_PUBLICATION_INVALID',`ID de publicação inválido: ${item.id}.`,'Use um ID público válido.');
    if(ids.has(item.id)) fail('SUBSOLO_PACKAGE_PUBLICATION_DUPLICATE',`Publicação duplicada: ${item.id}.`,'Remova duplicidade.'); ids.add(item.id);
    if(!Number.isInteger(item.position)||item.position<0||positions.has(item.position)) fail('SUBSOLO_PACKAGE_POSITION_INVALID',`Posição inválida ou duplicada: ${item.position}.`,'Use posições inteiras únicas.'); positions.add(item.position);
    if(typeof item.featured!=='boolean'||typeof item.channel!=='string'||item.channel==='') fail('SUBSOLO_PACKAGE_PUBLICATION_INVALID',`Metadados inválidos em ${item.id}.`,'Corrija channel e featured.');
    const rel=normalizeRelative(item.path,'path da publicação');
    if(rel!==`publications/${item.id}`) fail('SUBSOLO_PACKAGE_PATH_INVALID',`Caminho incompatível para ${item.id}: ${rel}.`,`Use publications/${item.id}.`);
  }
  return edition;
};

const readWorkspace=async({workspace,editionOverride=null,extraWorkspaceRoot=null})=>{
  const root=path.resolve(workspace);
  if(!await exists(root)) fail('SUBSOLO_PACKAGE_WORKSPACE_MISSING',`Workspace inexistente: ${root}.`,'Informe uma pasta válida.');
  await assertWorkspaceSafe(root); if(extraWorkspaceRoot) await assertWorkspaceSafe(path.resolve(extraWorkspaceRoot));
  const edition=validateEdition(editionOverride??await readJson(path.join(root,'edition.json'),'edition.json'));
  const editionMarkdown=await readFile(path.join(root,'edition.md'),'utf8').catch(()=>fail('SUBSOLO_PACKAGE_EDITION_MARKDOWN_MISSING','edition.md ausente.','Crie o texto público da edição.'));
  const files=new Map(); const provenance=[];
  for(const item of [...edition.publications].sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id))){
    const publicationRoot=path.join(root,...item.path.split('/'));
    if(!await exists(publicationRoot)) fail('SUBSOLO_PACKAGE_PUBLICATION_MISSING',`Diretório ausente: ${item.path}.`,'Exporte a publicação antes de empacotar.');
    const actual=(await readdir(publicationRoot)).sort();
    for(const expected of REQUIRED_PUBLICATION_FILES) if(!actual.includes(expected)) fail('SUBSOLO_PACKAGE_PUBLICATION_FILE_MISSING',`${item.path}/${expected} ausente.`,'Exporte novamente a publicação.');
    for(const name of actual) if(!REQUIRED_PUBLICATION_FILES.includes(name)) fail('SUBSOLO_PACKAGE_PUBLICATION_FILE_UNEXPECTED',`Arquivo não permitido: ${item.path}/${name}.`,'Remova arquivo não público.');
    for(const name of REQUIRED_PUBLICATION_FILES){
      const content=await readFile(path.join(publicationRoot,name));
      files.set(`${item.path}/${name}`,content);
      if(name==='publication.md'){
        const source=content.toString('utf8');
        const id=scalarFromFrontMatter(source,'id'); const editionId=scalarFromFrontMatter(source,'edition_id'); const channel=scalarFromFrontMatter(source,'channel'); const featured=scalarFromFrontMatter(source,'featured');
        if(id!==item.id||editionId!==edition.id||channel!==item.channel||featured!==item.featured) fail('SUBSOLO_PACKAGE_PUBLICATION_MISMATCH',`Front matter diverge do manifest para ${item.id}.`,'Corrija a edição ou reexporte a publicação.',{id,editionId,channel,featured});
      }
      if(name==='provenance.public.json') provenance.push({publication_id:item.id,...JSON.parse(content.toString('utf8'))});
      else if(name.endsWith('.json')) JSON.parse(content.toString('utf8'));
    }
  }
  const derivedRoot=path.join(root,'media','derived');
  if(await exists(derivedRoot)){
    const walk=async(current,rel='media/derived')=>{
      for(const entry of await readdir(current,{withFileTypes:true})){
        const child=path.join(current,entry.name); const childRel=`${rel}/${entry.name}`;
        if(entry.isDirectory()) await walk(child,childRel); else files.set(normalizeRelative(childRel),await readFile(child));
      }
    }; await walk(derivedRoot);
  }
  return {root,edition,editionMarkdown,files,provenance};
};

const validatePrevious=(edition,previous)=>{
  if(edition.revision===1) return null;
  if(!previous) fail('SUBSOLO_PACKAGE_PREVIOUS_REQUIRED',`A revisão ${edition.revision} exige o pacote anterior.`,'Informe --previous-package.');
  const inspected=inspectPackage(previous);
  const prior=inspected.manifest;
  if(prior.edition_id!==edition.id||prior.revision!==edition.revision-1||prior.run_id!==edition.supersedes) fail('SUBSOLO_PACKAGE_SUPERSEDES_INVALID','O pacote anterior não corresponde a supersedes ou à revisão anterior.','Use o ZIP imediatamente anterior da mesma edição.',{expected_run_id:edition.supersedes,actual_run_id:prior.run_id,expected_revision:edition.revision-1,actual_revision:prior.revision});
  return prior;
};

const manifestFor=(edition)=>({
  schema_version:SCHEMA_VERSION,
  package_format:PACKAGE_FORMAT,
  edition_id:edition.id,
  edition_date:edition.date,
  run_id:edition.run_id,
  revision:edition.revision,
  status:edition.status,
  timezone:edition.timezone,
  generated_at:edition.generated_at,
  published_at:edition.published_at,
  sealed_at:edition.sealed_at??null,
  supersedes:edition.supersedes??null,
  publications:[...edition.publications].sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id)).map(({id,path:publicationPath,channel,position,featured})=>({id,path:publicationPath,channel,position,featured})),
});

const sourceDigest=(entries)=>sha256(Buffer.concat([...entries.entries()].sort(([a],[b])=>a.localeCompare(b)).flatMap(([name,data])=>[Buffer.from(`${name}\0`),Buffer.from(data)])));

const crcTable=(()=>{ const table=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?0xedb88320^(c>>>1):c>>>1; table[n]=c>>>0; } return table; })();
const crc32=(buffer)=>{ let c=0xffffffff; for(const byte of buffer) c=crcTable[(c^byte)&0xff]^(c>>>8); return (c^0xffffffff)>>>0; };
const dosTimestamp=(iso)=>{
  const match=ISO_DATETIME.exec(iso); if(!match) fail('SUBSOLO_PACKAGE_DATETIME_INVALID','Timestamp ZIP inválido.','Corrija generated_at.');
  const [,y,m,d,h,min,s]=match; const year=Math.max(1980,Math.min(2107,Number(y)));
  return {date:((year-1980)<<9)|(Number(m)<<5)|Number(d),time:(Number(h)<<11)|(Number(min)<<5)|Math.floor(Number(s)/2)};
};
const createZip=(entries,generatedAt)=>{
  const {date,time}=dosTimestamp(generatedAt); const locals=[]; const centrals=[]; let offset=0;
  for(const [name,value] of [...entries.entries()].sort(([a],[b])=>a.localeCompare(b))){
    const filename=Buffer.from(normalizeRelative(name),'utf8'); const data=Buffer.isBuffer(value)?value:Buffer.from(value); const crc=crc32(data);
    const local=Buffer.alloc(30); local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4); local.writeUInt16LE(0x0800,6); local.writeUInt16LE(0,8); local.writeUInt16LE(time,10); local.writeUInt16LE(date,12); local.writeUInt32LE(crc,14); local.writeUInt32LE(data.length,18); local.writeUInt32LE(data.length,22); local.writeUInt16LE(filename.length,26); local.writeUInt16LE(0,28);
    locals.push(local,filename,data);
    const central=Buffer.alloc(46); central.writeUInt32LE(0x02014b50,0); central.writeUInt16LE(0x0314,4); central.writeUInt16LE(20,6); central.writeUInt16LE(0x0800,8); central.writeUInt16LE(0,10); central.writeUInt16LE(time,12); central.writeUInt16LE(date,14); central.writeUInt32LE(crc,16); central.writeUInt32LE(data.length,20); central.writeUInt32LE(data.length,24); central.writeUInt16LE(filename.length,28); central.writeUInt16LE(0,30); central.writeUInt16LE(0,32); central.writeUInt16LE(0,34); central.writeUInt16LE(0,36); central.writeUInt32LE(0,38); central.writeUInt32LE(offset,42);
    centrals.push(central,filename); offset+=local.length+filename.length+data.length;
  }
  const centralBuffer=Buffer.concat(centrals); const eocd=Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50,0); eocd.writeUInt16LE(0,4); eocd.writeUInt16LE(0,6); eocd.writeUInt16LE(entries.size,8); eocd.writeUInt16LE(entries.size,10); eocd.writeUInt32LE(centralBuffer.length,12); eocd.writeUInt32LE(offset,16); eocd.writeUInt16LE(0,20);
  return Buffer.concat([...locals,centralBuffer,eocd]);
};

const parseZip=(zip)=>{
  const entries=new Map(); let offset=0;
  while(offset+4<=zip.length){
    const signature=zip.readUInt32LE(offset); if(signature===0x02014b50||signature===0x06054b50) break;
    if(signature!==0x04034b50) fail('SUBSOLO_PACKAGE_CORRUPT',`Assinatura ZIP inválida no offset ${offset}.`,'Use um pacote Subsolo íntegro.');
    if(offset+30>zip.length) fail('SUBSOLO_PACKAGE_CORRUPT','Cabeçalho ZIP truncado.','Baixe o pacote novamente.');
    const flags=zip.readUInt16LE(offset+6); const method=zip.readUInt16LE(offset+8); const crc=zip.readUInt32LE(offset+14); const compressed=zip.readUInt32LE(offset+18); const size=zip.readUInt32LE(offset+22); const nameLength=zip.readUInt16LE(offset+26); const extraLength=zip.readUInt16LE(offset+28);
    if(method!==0||compressed!==size||(flags&0x0008)!==0) fail('SUBSOLO_PACKAGE_ZIP_UNSUPPORTED','ZIP usa recurso não suportado.','Use pacote gerado pela CLI Subsolo.');
    const nameStart=offset+30; const dataStart=nameStart+nameLength+extraLength; const dataEnd=dataStart+size;
    if(dataEnd>zip.length) fail('SUBSOLO_PACKAGE_CORRUPT','Entrada ZIP truncada.','Baixe o pacote novamente.');
    const name=normalizeRelative(zip.subarray(nameStart,nameStart+nameLength).toString('utf8'),'entrada ZIP');
    if(entries.has(name)) fail('SUBSOLO_PACKAGE_CORRUPT',`Entrada ZIP duplicada: ${name}.`,'Use pacote íntegro.');
    const data=Buffer.from(zip.subarray(dataStart,dataEnd)); if(crc32(data)!==crc) fail('SUBSOLO_PACKAGE_CRC_INVALID',`CRC inválido em ${name}.`,'Baixe ou gere o pacote novamente.');
    entries.set(name,data); offset=dataEnd;
  }
  if(entries.size===0) fail('SUBSOLO_PACKAGE_CORRUPT','ZIP não contém entradas locais.','Use pacote válido.');
  return entries;
};

const checksumText=(entries)=>[...entries.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([name,data])=>`${sha256(data)}  ${name}`).join('\n')+'\n';
const verifyChecksums=(entries)=>{
  const raw=entries.get('checksums.sha256'); if(!raw) fail('SUBSOLO_PACKAGE_CHECKSUM_MISSING','checksums.sha256 ausente.','Use pacote completo.');
  const expected=new Map();
  for(const line of raw.toString('utf8').trim().split('\n')){ const match=/^([a-f0-9]{64})  (.+)$/.exec(line); if(!match) fail('SUBSOLO_PACKAGE_CHECKSUM_INVALID','Linha de checksum inválida.','Gere novamente o pacote.'); expected.set(normalizeRelative(match[2]),match[1]); }
  for(const [name,data] of entries){ if(name==='checksums.sha256') continue; if(expected.get(name)!==sha256(data)) fail('SUBSOLO_PACKAGE_CHECKSUM_INVALID',`Checksum divergente em ${name}.`,'Use pacote íntegro.'); }
  if(expected.size!==entries.size-1) fail('SUBSOLO_PACKAGE_CHECKSUM_INVALID','A lista de checksums não corresponde às entradas.','Gere novamente o pacote.');
  return {valid:true,count:expected.size};
};

export const inspectPackage=(input)=>{
  const zip=Buffer.isBuffer(input)?input:null;
  if(!zip) fail('SUBSOLO_PACKAGE_INPUT_INVALID','inspectPackage exige Buffer.','Leia o ZIP antes de inspecionar.');
  const entries=parseZip(zip); const checksums=verifyChecksums(entries);
  const manifest=JSON.parse(entries.get('manifest.json')?.toString('utf8')??fail('SUBSOLO_PACKAGE_MANIFEST_MISSING','manifest.json ausente.','Use pacote completo.'));
  if(manifest.package_format!==PACKAGE_FORMAT) fail('SUBSOLO_PACKAGE_MANIFEST_INVALID','Formato de pacote desconhecido.','Use pacote Subsolo.');
  return {entries,manifest,checksums,package_sha256:sha256(zip)};
};

export const buildPackage=async({workspace,previousPackage=null,editionOverride=null,extraWorkspaceRoot=null})=>{
  const input=await readWorkspace({workspace,editionOverride,extraWorkspaceRoot});
  const previousBuffer=previousPackage?Buffer.isBuffer(previousPackage)?previousPackage:await readFile(previousPackage):null;
  validatePrevious(input.edition,previousBuffer);
  const manifest=manifestFor(input.edition); const entries=new Map();
  entries.set('manifest.json',Buffer.from(stableStringify(manifest)));
  entries.set('edition.md',Buffer.from(input.editionMarkdown));
  for(const [name,data] of input.files) entries.set(name,data);
  const aggregateProvenance={schema_version:SCHEMA_VERSION,edition_id:input.edition.id,run_id:input.edition.run_id,revision:input.edition.revision,publications:input.provenance.map((item)=>({publication_id:item.publication_id,source_snapshots:item.source_snapshots,source_counts:item.source_counts,sanitization:item.sanitization}))};
  entries.set('reports/provenance.public.json',Buffer.from(stableStringify(aggregateProvenance)));
  const validation={schema_version:SCHEMA_VERSION,status:'passed',edition_id:input.edition.id,run_id:input.edition.run_id,revision:input.edition.revision,publication_count:input.edition.publications.length,issues:[],validated_files:[...entries.keys()].sort()};
  entries.set('reports/validation.json',Buffer.from(stableStringify(validation)));
  const run={schema_version:SCHEMA_VERSION,run_id:input.edition.run_id,edition_id:input.edition.id,revision:input.edition.revision,state:'packaged',generated_at:input.edition.generated_at,source_workspace_sha256:sourceDigest(entries),validation:{status:'passed',issues:0}};
  entries.set('publication-run.json',Buffer.from(stableStringify(run)));
  entries.set('checksums.sha256',Buffer.from(checksumText(entries)));
  const sorted=new Map([...entries.entries()].sort(([a],[b])=>a.localeCompare(b))); const zip=createZip(sorted,input.edition.generated_at);
  return {edition:input.edition,manifest,entries:sorted,zip,package_sha256:sha256(zip)};
};

const defaultFilename=(edition)=>{
  const match=ISO_DATETIME.exec(edition.generated_at); const [,y,m,d,h,min,s,zone]=match; const offset=zone==='Z'?'+0000':zone.replace(':','');
  return `subsolo-edicao-${y}${m}${d}T${h}${min}${s}${offset}-r${edition.revision}.zip`;
};
const resolveDestination=async(destination,edition)=>{
  const absolute=path.resolve(destination); const isDirectory=await exists(absolute)?(await lstat(absolute)).isDirectory():!absolute.toLowerCase().endsWith('.zip');
  return isDirectory?path.join(absolute,defaultFilename(edition)):absolute;
};

export const planPackage=async(options)=>{
  const built=await buildPackage(options); const destination=await resolveDestination(options.destination,built.edition);
  return {mode:'dry-run',edition_id:built.edition.id,run_id:built.edition.run_id,revision:built.edition.revision,destination,package_bytes:built.zip.length,package_sha256:built.package_sha256,entries:[...built.entries].map(([name,data])=>({name,bytes:data.length,sha256:sha256(data)}))};
};
export const applyPackage=async(options)=>{
  const built=await buildPackage(options); const destination=await resolveDestination(options.destination,built.edition); await mkdir(path.dirname(destination),{recursive:true});
  if(await exists(destination)){ const current=await readFile(destination); if(sha256(current)===built.package_sha256) fail('SUBSOLO_PACKAGE_DUPLICATE',`Pacote idêntico já existe: ${destination}.`,'Não repita a publicação.'); fail('SUBSOLO_PACKAGE_DESTINATION_EXISTS',`Destino já existe com conteúdo diferente: ${destination}.`,'Use outro destino; pacotes publicados são imutáveis.'); }
  const temporary=`${destination}.tmp-${process.pid}-${Date.now()}`; try { await writeFile(temporary,built.zip); await rename(temporary,destination); } catch(error){ await rm(temporary,{force:true}); throw error; }
  return {mode:'apply',edition_id:built.edition.id,run_id:built.edition.run_id,revision:built.edition.revision,destination,package_bytes:built.zip.length,package_sha256:built.package_sha256,entries:built.entries.size};
};

const loadInspected=async(packagePath)=>inspectPackage(await readFile(packagePath));
export const planRestore=async({packagePath,destination})=>{ const inspected=await loadInspected(packagePath); return {mode:'dry-run',package:path.resolve(packagePath),destination:path.resolve(destination),edition_id:inspected.manifest.edition_id,run_id:inspected.manifest.run_id,revision:inspected.manifest.revision,entries:inspected.entries.size,checksums_valid:inspected.checksums.valid,package_sha256:inspected.package_sha256}; };
export const applyRestore=async({packagePath,destination,overwrite=false})=>{
  const inspected=await loadInspected(packagePath); const target=path.resolve(destination); const parent=path.dirname(target); const temporary=path.join(parent,`.${path.basename(target)}.tmp-${process.pid}-${Date.now()}`); const backup=path.join(parent,`.${path.basename(target)}.bak-${process.pid}-${Date.now()}`); const targetExists=await exists(target);
  if(targetExists&&!overwrite) fail('SUBSOLO_RESTORE_DESTINATION_EXISTS',`Destino já existe: ${target}.`,'Use outro destino ou --overwrite.');
  await mkdir(temporary,{recursive:true}); let backupCreated=false;
  try{
    for(const [name,data] of inspected.entries){ const output=path.join(temporary,...name.split('/')); await mkdir(path.dirname(output),{recursive:true}); await writeFile(output,data); }
    if(targetExists){ await rename(target,backup); backupCreated=true; }
    await rename(temporary,target); if(backupCreated) await rm(backup,{recursive:true,force:true});
    return {mode:'apply',destination:target,edition_id:inspected.manifest.edition_id,run_id:inspected.manifest.run_id,revision:inspected.manifest.revision,written:inspected.entries.size,checksums_valid:true};
  }catch(error){ await rm(temporary,{recursive:true,force:true}); if(backupCreated&&!await exists(target)&&await exists(backup)) await rename(backup,target); throw error; }
};

export const validatePackageFile=async(packagePath)=>{ const inspected=await loadInspected(packagePath); return {status:'passed',package:path.resolve(packagePath),edition_id:inspected.manifest.edition_id,run_id:inspected.manifest.run_id,revision:inspected.manifest.revision,entries:inspected.entries.size,checksums_valid:true,package_sha256:inspected.package_sha256}; };
