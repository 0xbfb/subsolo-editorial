import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  PackageFailure,
  applyPackage,
  applyRestore,
  buildPackage,
  inspectPackage,
  planPackage,
  planRestore,
} from '../../cli/packager-core.mjs';

const r1='fixtures/packager/edition-r1';
const r2='fixtures/packager/edition-r2';
const capture=async(fn)=>{ try { await fn(); assert.fail('esperava falha'); } catch(error) { assert.ok(error instanceof PackageFailure, String(error)); return error; } };

test('dry-run é determinístico e não grava ZIP', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-package-plan-'));
  const destination=path.join(dir,'edition.zip');
  const a=await planPackage({workspace:r1,destination});
  const b=await planPackage({workspace:r1,destination});
  assert.deepEqual(a,b);
  await assert.rejects(readFile(destination));
  assert.equal(a.revision,1);
  assert.match(a.package_sha256,/^[a-f0-9]{64}$/);
});

test('apply gera ZIP determinístico em destinos diferentes', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-package-'));
  const a=path.join(dir,'a.zip'); const b=path.join(dir,'b.zip');
  const ra=await applyPackage({workspace:r1,destination:a});
  const rb=await applyPackage({workspace:r1,destination:b});
  assert.equal(ra.package_sha256,rb.package_sha256);
  assert.deepEqual(await readFile(a),await readFile(b));
});

test('pacote contém estrutura pública e checksums válidos', async()=>{
  const built=await buildPackage({workspace:r1});
  const names=[...built.entries.keys()];
  assert.deepEqual(names,[...names].sort());
  for (const required of ['manifest.json','edition.md','publication-run.json','checksums.sha256','reports/validation.json','reports/provenance.public.json','publications/pub_MB76FYPQZ5RTPENBAR5611AJJ0/publication.md']) assert.ok(names.includes(required), required);
  const inspected=inspectPackage(built.zip);
  assert.equal(inspected.manifest.revision,1);
  assert.equal(inspected.checksums.valid,true);
});

test('nome padrão inclui timestamp, fuso e revisão', async()=>{
  const plan=await planPackage({workspace:r1,destination:await mkdtemp(path.join(tmpdir(),'subsolo-name-'))});
  assert.match(plan.destination,/subsolo-edicao-20260720T150000-0300-r1\.zip$/);
});

test('restore dry-run não grava e apply reconstrói os arquivos', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-restore-'));
  const zip=path.join(dir,'edition.zip'); await applyPackage({workspace:r1,destination:zip});
  const target=path.join(dir,'restored'); const dry=await planRestore({packagePath:zip,destination:target});
  assert.equal(dry.checksums_valid,true); await assert.rejects(readdir(target));
  const applied=await applyRestore({packagePath:zip,destination:target});
  assert.ok(applied.written > 5);
  assert.equal(JSON.parse(await readFile(path.join(target,'manifest.json'),'utf8')).revision,1);
});

test('restore rejeita pacote corrompido', async()=>{
  const built=await buildPackage({workspace:r1}); const corrupt=Buffer.from(built.zip); corrupt[80]^=0xff;
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-corrupt-')); const zip=path.join(dir,'bad.zip'); await writeFile(zip,corrupt);
  const error=await capture(()=>planRestore({packagePath:zip,destination:path.join(dir,'out')}));
  assert.match(error.code,/CORRUPT|CHECKSUM|CRC/);
});

test('r2 exige pacote anterior e valida supersedes', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-revision-'));
  let error=await capture(()=>planPackage({workspace:r2,destination:path.join(dir,'r2.zip')}));
  assert.equal(error.code,'SUBSOLO_PACKAGE_PREVIOUS_REQUIRED');
  const previous=path.join(dir,'r1.zip'); await applyPackage({workspace:r1,destination:previous});
  const plan=await planPackage({workspace:r2,destination:path.join(dir,'r2.zip'),previousPackage:previous});
  assert.equal(plan.revision,2);
});

test('r2 rejeita supersedes divergente', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-supersedes-'));
  const previous=path.join(dir,'r1.zip'); await applyPackage({workspace:r1,destination:previous});
  const copy=path.join(dir,'r2'); await mkdir(copy); // fixture será clonada no helper da implementação se necessário
  const edition=JSON.parse(await readFile(path.join(r2,'edition.json'),'utf8')); edition.supersedes='run_inexistente';
  await writeFile(path.join(dir,'edition.json'),JSON.stringify(edition));
  const error=await capture(()=>planPackage({workspace:r2,destination:path.join(dir,'r2.zip'),previousPackage:previous,editionOverride:edition}));
  assert.equal(error.code,'SUBSOLO_PACKAGE_SUPERSEDES_INVALID');
});

test('destino existente idêntico é detectado como duplicado', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-duplicate-')); const zip=path.join(dir,'edition.zip');
  await applyPackage({workspace:r1,destination:zip});
  const error=await capture(()=>applyPackage({workspace:r1,destination:zip}));
  assert.equal(error.code,'SUBSOLO_PACKAGE_DUPLICATE');
});

test('rejeita revisão inválida', async()=>{
  const edition=JSON.parse(await readFile(path.join(r1,'edition.json'),'utf8')); edition.revision=0;
  const error=await capture(()=>planPackage({workspace:r1,destination:'/tmp/x.zip',editionOverride:edition}));
  assert.equal(error.code,'SUBSOLO_PACKAGE_REVISION_INVALID');
});

test('rejeita symlink no workspace', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-symlink-'));
  await symlink('/etc/passwd',path.join(dir,'leak'));
  const error=await capture(()=>buildPackage({workspace:r1,extraWorkspaceRoot:dir}));
  assert.equal(error.code,'SUBSOLO_PACKAGE_SYMLINK_REJECTED');
});

test('rejeita caminho de publicação fora da raiz permitida', async()=>{
  const edition=JSON.parse(await readFile(path.join(r1,'edition.json'),'utf8')); edition.publications[0].path='../private';
  const error=await capture(()=>planPackage({workspace:r1,destination:'/tmp/x.zip',editionOverride:edition}));
  assert.equal(error.code,'SUBSOLO_PACKAGE_PATH_INVALID');
});

test('restore rejeita path traversal forjado no ZIP', async()=>{
  const built=await buildPackage({workspace:r1});
  const malicious=Buffer.from(built.zip);
  const original=Buffer.from('checksums.sha256');
  const replacement=Buffer.from('../escape.txtxxx');
  assert.equal(original.length,replacement.length);
  const offset=malicious.indexOf(original);
  assert.ok(offset>0);
  replacement.copy(malicious,offset);
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-traversal-')); const zip=path.join(dir,'bad.zip'); await writeFile(zip,malicious);
  const error=await capture(()=>planRestore({packagePath:zip,destination:path.join(dir,'out')}));
  assert.equal(error.code,'SUBSOLO_PACKAGE_PATH_INVALID');
});
