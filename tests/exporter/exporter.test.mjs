import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildExport, loadFixtureInput, planExport, applyExport, ExportFailure, deterministicEntityId } from '../../cli/exporter-core.mjs';

const validSheet='fixtures/exporter/valid/sheet-row.json';
const validDocument='fixtures/exporter/valid/document.json';
const fixture=(name)=>`fixtures/exporter/invalid/${name}`;
const capture=async(fn)=>{ try { await fn(); assert.fail('esperava falha'); } catch(error) { assert.ok(error instanceof ExportFailure); return error; } };

test('dry-run é determinístico e não grava destino', async()=>{
  const destination=path.join(tmpdir(),`subsolo-plan-${Date.now()}`);
  const a=await planExport({sheetPath:validSheet,documentPath:validDocument,destination});
  const b=await planExport({sheetPath:validSheet,documentPath:validDocument,destination});
  assert.deepEqual(a,b); assert.equal(a.files.length,5); assert.match(a.publication_id,/^pub_[0-9A-HJKMNP-TV-Z]{26}$/);
});

test('apply gera os cinco arquivos públicos esperados', async()=>{
  const destination=await mkdtemp(path.join(tmpdir(),'subsolo-export-'));
  const target=path.join(destination,'publication');
  const result=await applyExport({sheetPath:validSheet,documentPath:validDocument,destination:target});
  assert.equal(result.written.length,5);
  assert.deepEqual((await readdir(target)).sort(),['corrections.json','media.json','provenance.public.json','publication.md','sources.json']);
  const markdown=await readFile(path.join(target,'publication.md'),'utf8');
  assert.match(markdown,/^---\nschema_version:/); assert.match(markdown,/:::fact/); assert.match(markdown,/\| Horário \| Evento \|/);
  assert.doesNotMatch(markdown,/drive\.google\.com|docs\.google\.com|NOTA INTERNA/i);
});

test('mesma entrada gera bytes iguais ao golden', async()=>{
  const {row,document}=await loadFixtureInput(validSheet,validDocument); const output=buildExport({row,document});
  for (const [name,content] of output.files) assert.equal(content,await readFile(`fixtures/exporter/golden/${name}`,'utf8'),name);
});

test('IDs derivados são estáveis e mudam por seed',()=>{
  assert.equal(deterministicEntityId('pub','x'),deterministicEntityId('pub','x'));
  assert.notEqual(deterministicEntityId('pub','x'),deterministicEntityId('pub','y'));
});



test('proveniência pública usa hashes e não expõe IDs do Google', async()=>{
  const {row,document}=await loadFixtureInput(validSheet,validDocument); const output=buildExport({row,document});
  const provenance=JSON.parse(output.files.get('provenance.public.json'));
  assert.match(provenance.source_snapshots.sheet_sha256,/^[a-f0-9]{64}$/);
  assert.match(provenance.source_snapshots.document_sha256,/^[a-f0-9]{64}$/);
  const text=JSON.stringify(provenance);
  assert.doesNotMatch(text,/document_id|document_revision|fixture-transporte|rev-17|docs\.google|drive\.google/i);
});

test('allowlist remove campos privados de fontes, correções e mídia', async()=>{
  const {row,document}=await loadFixtureInput(validSheet,validDocument);
  row.fontes[0].notes_private='segredo';
  row.correcoes=[{type:'esclarecimento',published_at:'2026-07-20T16:00:00-03:00',summary:'Descrição pública.',impact:'Sem mudança de conclusão.',previous_revision:1,new_revision:2,notes_private:'não exportar'}];
  row.midia=[{type:'imagem',alt:'Imagem pública.',caption:null,credit:'Subsolo',license:'Uso editorial',derivatives:[{path:'/media/teste.webp',width:1200,height:675,format:'webp',notes_private:'ignorar'}],notes_private:'não exportar'}];
  const output=buildExport({row,document});
  const corpus=[...output.files.values()].join('\n');
  assert.doesNotMatch(corpus,/notes_private|segredo|não exportar/i);
  assert.equal(JSON.parse(output.files.get('corrections.json')).length,1);
  assert.equal(JSON.parse(output.files.get('media.json')).length,1);
});

test('overwrite atômico remove arquivo obsoleto', async()=>{
  const destination=await mkdtemp(path.join(tmpdir(),'subsolo-overwrite-'));
  const target=path.join(destination,'publication');
  await applyExport({sheetPath:validSheet,documentPath:validDocument,destination:target});
  await writeFile(path.join(target,'stale.txt'),'obsoleto');
  await applyExport({sheetPath:validSheet,documentPath:validDocument,destination:target,overwrite:true});
  assert.deepEqual((await readdir(target)).sort(),['corrections.json','media.json','provenance.public.json','publication.md','sources.json']);
});

test('rejeita sugestão pendente',async()=>{ const sheet=JSON.parse(await readFile(validSheet)); sheet.document_id='fixture-suggestion'; sheet.titulo='Documento pendente'; const doc=JSON.parse(await readFile(fixture('document-suggestion.json'))); const error=await capture(async()=>buildExport({row:sheet,document:doc})); assert.equal(error.code,'SUBSOLO_EXPORT_SUGGESTIONS_PENDING'); });
test('rejeita comentários internos',async()=>{ const sheet=JSON.parse(await readFile(validSheet)); sheet.document_id='fixture-comment'; sheet.titulo='Documento comentado'; const doc=JSON.parse(await readFile(fixture('document-comment.json'))); const error=await capture(async()=>buildExport({row:sheet,document:doc})); assert.equal(error.code,'SUBSOLO_EXPORT_COMMENTS_PENDING'); });
test('rejeita link privado',async()=>{ const sheet=JSON.parse(await readFile(validSheet)); sheet.document_id='fixture-private'; sheet.titulo='Documento privado'; const doc=JSON.parse(await readFile(fixture('document-private-link.json'))); const error=await capture(async()=>buildExport({row:sheet,document:doc})); assert.equal(error.code,'SUBSOLO_EXPORT_PRIVATE_URL'); });
test('rejeita metadado obrigatório ausente',async()=>{ const error=await capture(()=>planExport({sheetPath:fixture('sheet-missing-title.json'),documentPath:validDocument,destination:'/tmp/x'})); assert.equal(error.code,'SUBSOLO_EXPORT_METADATA_MISSING'); });
test('rejeita revisão factual pendente',async()=>{ const error=await capture(()=>planExport({sheetPath:fixture('sheet-review-pending.json'),documentPath:validDocument,destination:'/tmp/x'})); assert.equal(error.code,'SUBSOLO_EXPORT_REVIEW_PENDING'); });
test('rejeita conflito de título',async()=>{ const error=await capture(()=>planExport({sheetPath:fixture('sheet-title-conflict.json'),documentPath:validDocument,destination:'/tmp/x'})); assert.equal(error.code,'SUBSOLO_EXPORT_TITLE_CONFLICT'); });


test('imagem de capa é reconstruída por allowlist', async()=>{
  const {row,document}=await loadFixtureInput(validSheet,validDocument);
  row.imagem_publica={src:'/media/capa.webp',alt:'Descrição pública.',notes_private:'segredo'};
  const output=buildExport({row,document});
  assert.deepEqual(output.metadata.image,{src:'/media/capa.webp',alt:'Descrição pública.'});
  assert.doesNotMatch(output.files.get('publication.md'),/notes_private|segredo/);
});

test('rejeita imagem de capa privada', async()=>{
  const {row,document}=await loadFixtureInput(validSheet,validDocument);
  row.imagem_publica={src:'https://drive.google.com/file/d/private',alt:'Imagem privada.'};
  const error=await capture(async()=>buildExport({row,document}));
  assert.equal(error.code,'SUBSOLO_EXPORT_PRIVATE_URL');
});

test('rejeita data pública sem fuso explícito', async()=>{
  const {row,document}=await loadFixtureInput(validSheet,validDocument);
  row.publicado_em='2026-07-20T15:00:00';
  const error=await capture(async()=>buildExport({row,document}));
  assert.equal(error.code,'SUBSOLO_EXPORT_DATETIME_INVALID');
});

test('rejeita mídia sem derivado público', async()=>{
  const {row,document}=await loadFixtureInput(validSheet,validDocument);
  row.midia=[{type:'imagem',alt:'Imagem.',caption:null,credit:'Subsolo',license:'Uso editorial',derivatives:[]}];
  const error=await capture(async()=>buildExport({row,document}));
  assert.equal(error.code,'SUBSOLO_EXPORT_MEDIA_DERIVATIVES_EMPTY');
});

test('rejeita booleano textual em destaque', async()=>{
  const {row,document}=await loadFixtureInput(validSheet,validDocument);
  row.destaque='false';
  const error=await capture(async()=>buildExport({row,document}));
  assert.equal(error.code,'SUBSOLO_EXPORT_BOOLEAN_INVALID');
});
test('rejeita destino existente sem overwrite',async()=>{ const destination=await mkdtemp(path.join(tmpdir(),'subsolo-existing-')); const error=await capture(()=>applyExport({sheetPath:validSheet,documentPath:validDocument,destination})); assert.equal(error.code,'SUBSOLO_EXPORT_DESTINATION_EXISTS'); });
