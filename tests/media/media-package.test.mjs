import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPackage, inspectPackage } from '../../cli/packager-core.mjs';

test('pacote inclui somente derivados em media/derived', async () => {
  const temp=await mkdtemp(join(tmpdir(),'subsolo-media-package-'));
  const workspace=join(temp,'workspace');
  await cp('fixtures/packager/edition-r1',workspace,{recursive:true});
  const target=join(workspace,'media/derived/portraits/cora-fixture');
  await mkdir(target,{recursive:true});
  const filename='cora-fixture-0b69ff6088ae1257-card.webp';
  await copyFile(join('fixtures/media/golden/portraits/cora-fixture',filename),join(target,filename));
  const built=await buildPackage({workspace});
  const inspected=inspectPackage(built.zip);
  assert.ok(inspected.entries.has(`media/derived/portraits/cora-fixture/${filename}`));
  assert.ok([...inspected.entries.keys()].every(name=>!/(^|\/)(?:originals?|masters?)(\/|$)/i.test(name)));
  await rm(temp,{recursive:true,force:true});
});

test('workspace com original é rejeitado antes do pacote', async () => {
  const temp=await mkdtemp(join(tmpdir(),'subsolo-media-private-'));
  const workspace=join(temp,'workspace');
  await cp('fixtures/packager/edition-r1',workspace,{recursive:true});
  const target=join(workspace,'media/originals');await mkdir(target,{recursive:true});
  await copyFile('fixtures/media/source/cora-fixture-master.jpg',join(target,'cora.jpg'));
  await assert.rejects(()=>buildPackage({workspace}),/privado rejeitado/);
  await rm(temp,{recursive:true,force:true});
});
