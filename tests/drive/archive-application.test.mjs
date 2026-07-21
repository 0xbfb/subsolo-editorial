import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { PackageArchiveFailure, applyPackageArchive, planPackageArchive } from '../../src/lib/application/archive-edition-package.mjs';

const packagePath = 'fixtures/packager/golden/r1.zip';
const digest = (algorithm, bytes) => createHash(algorithm).update(bytes).digest('hex');
const fixedNow = () => new Date('2026-07-20T18:30:00.000Z');
const capture = async (fn) => {
  try { await fn(); assert.fail('esperava falha'); }
  catch (error) { assert.ok(error instanceof PackageArchiveFailure, String(error)); return error; }
};

const remoteFor = async ({ id = 'drive-file-1', folderId = 'month-folder', name = 'r1.zip' } = {}) => {
  const bytes = await readFile(packagePath);
  const manifest = JSON.parse((await import('../../cli/packager-core.mjs')).inspectPackage(bytes).entries.get('manifest.json').toString('utf8'));
  return {
    id,
    name,
    mimeType: 'application/zip',
    parents: [folderId],
    size: String(bytes.length),
    md5Checksum: digest('md5', bytes),
    trashed: false,
    createdTime: '2026-07-20T18:00:00.000Z',
    appProperties: {
      subsolo_kind: 'edition-package',
      subsolo_package_sha256: digest('sha256', bytes),
      subsolo_edition_id: manifest.edition_id,
      subsolo_run_id: manifest.run_id,
      subsolo_revision: String(manifest.revision),
      subsolo_schema_version: manifest.schema_version,
    },
  };
};

const baseAdapter = async (overrides = {}) => {
  const bytes = await readFile(packagePath);
  const remote = await remoteFor({ name: path.basename(packagePath) });
  return {
    async validateRoot() { return { id: 'root', name: 'SUBSOLO', driveId: null }; },
    async planPath() { return { folderId: 'month-folder', path: '90_ARQUIVO_TECNICO/edicoes/2026/07', segments: [{ name: '90_ARQUIVO_TECNICO', status: 'existing', folderId: 'technical' }] }; },
    async ensurePath() { return { folderId: 'month-folder', path: '90_ARQUIVO_TECNICO/edicoes/2026/07', segments: [] }; },
    async findByPackageSha256() { return null; },
    async uploadResumable() { return { id: remote.id }; },
    async getMetadata() { return remote; },
    async download() { return bytes; },
    ...overrides,
  };
};

test('dry-run descreve caminho e não grava recibo', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'subsolo-drive-plan-'));
  const receipt = path.join(directory, 'receipt.json');
  const plan = await planPackageArchive({ packagePath, rootFolderId: 'root', receiptPath: receipt, adapter: await baseAdapter() });
  assert.equal(plan.mode, 'dry-run');
  assert.equal(plan.disposition, 'planned');
  assert.equal(plan.duplicate_file_id, null);
  assert.match(plan.drive_path, /90_ARQUIVO_TECNICO\/edicoes\/2026\/07/);
  await assert.rejects(readFile(receipt));
});

test('apply só persiste file ID depois de metadata e download verificados', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'subsolo-drive-apply-'));
  const receiptPath = path.join(directory, 'receipt.json');
  const receipt = await applyPackageArchive({ packagePath, rootFolderId: 'root', receiptPath, adapter: await baseAdapter(), now: fixedNow });
  assert.equal(receipt.disposition, 'uploaded');
  assert.equal(receipt.file_id, 'drive-file-1');
  assert.equal(receipt.verified_at, '2026-07-20T18:30:00.000Z');
  const persisted = JSON.parse(await readFile(receiptPath, 'utf8'));
  assert.deepEqual(persisted, receipt);
  assert.equal('url' in persisted, false);
});

test('reexecução encontra checksum remoto e não envia outro arquivo', async () => {
  let uploads = 0;
  const remote = await remoteFor({ name: path.basename(packagePath) });
  const adapter = await baseAdapter({
    async findByPackageSha256() { return remote; },
    async uploadResumable() { uploads += 1; return { id: 'unexpected' }; },
  });
  const directory = await mkdtemp(path.join(tmpdir(), 'subsolo-drive-duplicate-'));
  const receipt = await applyPackageArchive({ packagePath, rootFolderId: 'root', receiptPath: path.join(directory, 'receipt.json'), adapter, now: fixedNow });
  assert.equal(receipt.disposition, 'already-archived');
  assert.equal(uploads, 0);
});

test('metadata incompatível impede persistência do recibo', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'subsolo-drive-metadata-'));
  const receiptPath = path.join(directory, 'receipt.json');
  const invalid = { ...(await remoteFor({ name: path.basename(packagePath) })), size: '1' };
  const adapter = await baseAdapter({ async getMetadata() { return invalid; } });
  const error = await capture(() => applyPackageArchive({ packagePath, rootFolderId: 'root', receiptPath, adapter }));
  assert.equal(error.code, 'SUBSOLO_ARCHIVE_REMOTE_METADATA_INVALID');
  await assert.rejects(readFile(receiptPath));
});

test('download divergente impede persistência do recibo', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'subsolo-drive-download-'));
  const receiptPath = path.join(directory, 'receipt.json');
  const adapter = await baseAdapter({ async download() { return Buffer.from('corrompido'); } });
  const error = await capture(() => applyPackageArchive({ packagePath, rootFolderId: 'root', receiptPath, adapter }));
  assert.equal(error.code, 'SUBSOLO_ARCHIVE_DOWNLOAD_CHECKSUM_INVALID');
  await assert.rejects(readFile(receiptPath));
});
