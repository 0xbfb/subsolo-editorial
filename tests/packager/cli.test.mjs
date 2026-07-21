import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const run=(args)=>spawnSync(process.execPath,['cli/subsolo.mjs',...args],{encoding:'utf8'});

test('CLI package dry-run retorna plano sem escrever', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-cli-plan-')); const zip=path.join(dir,'edition.zip');
  const result=run(['package','--workspace','fixtures/packager/edition-r1','--destination',zip,'--dry-run']);
  assert.equal(result.status,0,result.stderr); const json=JSON.parse(result.stdout); assert.equal(json.mode,'dry-run'); await assert.rejects(readFile(zip));
});

test('CLI package, validate-package e restore completam o ciclo', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-cli-cycle-')); const zip=path.join(dir,'edition.zip'); const out=path.join(dir,'restored');
  const packaged=run(['package','--workspace','fixtures/packager/edition-r1','--destination',zip,'--apply']); assert.equal(packaged.status,0,packaged.stderr);
  const validated=run(['validate-package','--package',zip]); assert.equal(validated.status,0,validated.stderr); assert.equal(JSON.parse(validated.stdout).checksums_valid,true);
  const restored=run(['restore','--package',zip,'--destination',out,'--apply']); assert.equal(restored.status,0,restored.stderr); assert.equal(JSON.parse(restored.stdout).written,11);
});

test('CLI retorna erro estruturado para revisão sem pacote anterior', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-cli-error-'));
  const result=run(['package','--workspace','fixtures/packager/edition-r2','--destination',path.join(dir,'r2.zip'),'--dry-run']);
  assert.equal(result.status,2); assert.equal(JSON.parse(result.stderr).code,'SUBSOLO_PACKAGE_PREVIOUS_REQUIRED');
});
