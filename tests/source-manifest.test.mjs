import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { verifySourceManifest } from '../scripts/source-manifest-core.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');

async function makeFixture({ includeFile = true, external = null } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'subsolo-source-manifest-'));
  const sourceRoot = join(root, 'references', 'source-materials');
  await mkdir(sourceRoot, { recursive: true });
  const bytes = Buffer.from('fonte canônica\n');
  const manifest = {
    schema_version: '1.0.0',
    files: [{ file: 'fonte.md', size_bytes: bytes.length, sha256: hash(bytes) }],
  };
  await writeFile(join(sourceRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (includeFile) await writeFile(join(sourceRoot, 'fonte.md'), bytes);
  if (external) {
    await writeFile(
      join(root, '.subsolo-external-artifacts.json'),
      `${JSON.stringify(external, null, 2)}\n`,
    );
  }
  return { root, bytes };
}

test('valida uma fonte presente pelo checksum', async () => {
  const { root } = await makeFixture();
  const result = await verifySourceManifest({ root });
  assert.equal(result.ok, true);
  assert.equal(result.verified, 1);
  assert.equal(result.externallyPreserved, 0);
});

test('aceita fonte omitida quando o manifesto Git preserva tamanho e checksum', async () => {
  const bytes = Buffer.from('fonte canônica\n');
  const external = {
    omitted_count: 1,
    omitted: [
      {
        path: 'references/source-materials/fonte.md',
        size_bytes: bytes.length,
        sha256: hash(bytes),
        classification: 'generated-or-archival-binary',
      },
    ],
  };
  const { root } = await makeFixture({ includeFile: false, external });
  const result = await verifySourceManifest({ root });
  assert.equal(result.ok, true);
  assert.equal(result.verified, 0);
  assert.equal(result.externallyPreserved, 1);
});

test('rejeita fonte ausente sem registro externo correspondente', async () => {
  const { root } = await makeFixture({ includeFile: false });
  const result = await verifySourceManifest({ root });
  assert.equal(result.ok, false);
  assert.deepEqual(result.failures, ['fonte.md: arquivo ausente']);
});
