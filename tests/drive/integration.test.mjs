import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { applyPackageArchive } from '../../src/lib/application/archive-edition-package.mjs';
import { createGoogleDriveArchiveAdapter } from '../../src/lib/infrastructure/google/google-drive.mjs';
import { inspectPackage } from '../../cli/packager-core.mjs';

const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json', ...headers } });
const sha = (algorithm, bytes) => createHash(algorithm).update(bytes).digest('hex');

test('ciclo integrado cria caminho, envia, confirma, baixa e registra sem URL privada', async () => {
  const packagePath = 'fixtures/packager/golden/r1.zip';
  const bytes = await readFile(packagePath);
  const manifest = inspectPackage(bytes).manifest;
  const folders = new Map();
  let folderCounter = 0;
  let archived = false;
  let uploadCount = 0;
  const fileId = 'drive-package-integrated';
  const remote = {
    id: fileId,
    name: path.basename(packagePath),
    mimeType: 'application/zip',
    parents: ['folder-4'],
    appProperties: {
      subsolo_kind: 'edition-package',
      subsolo_package_sha256: sha('sha256', bytes),
      subsolo_edition_id: manifest.edition_id,
      subsolo_run_id: manifest.run_id,
      subsolo_revision: String(manifest.revision),
      subsolo_schema_version: manifest.schema_version,
    },
    size: String(bytes.length),
    md5Checksum: sha('md5', bytes),
    createdTime: '2026-07-20T18:00:00.000Z',
    modifiedTime: '2026-07-20T18:00:00.000Z',
    trashed: false,
    driveId: null,
  };
  const fetchImpl = async (url, options = {}) => {
    const target = new URL(String(url));
    const method = options.method ?? 'GET';
    if (target.pathname === '/drive/v3/files/root') return json({ id: 'root', name: 'SUBSOLO', mimeType: 'application/vnd.google-apps.folder', trashed: false, driveId: null });
    if (target.pathname === '/drive/v3/files' && method === 'GET') {
      const q = target.searchParams.get('q') ?? '';
      if (q.includes('subsolo_package_sha256')) return json({ files: archived ? [remote] : [] });
      const name = /name = '([^']+)'/.exec(q)?.[1];
      const parent = /'([^']+)' in parents/.exec(q)?.[1];
      const found = folders.get(`${parent}/${name}`);
      return json({ files: found ? [found] : [] });
    }
    if (target.pathname === '/drive/v3/files' && method === 'POST') {
      const body = JSON.parse(options.body); folderCounter += 1;
      const folder = { id: `folder-${folderCounter}`, name: body.name, mimeType: body.mimeType, parents: body.parents, appProperties: body.appProperties, trashed: false };
      folders.set(`${body.parents[0]}/${body.name}`, folder);
      return json(folder, 201);
    }
    if (target.pathname === '/upload/drive/v3/files' && target.searchParams.get('uploadType') === 'resumable') {
      return new Response('', { status: 200, headers: { location: 'https://upload.example/integrated' } });
    }
    if (target.toString() === 'https://upload.example/integrated' && method === 'PUT') {
      uploadCount += 1; archived = true; return json({ id: fileId }, 200);
    }
    if (target.pathname === `/drive/v3/files/${fileId}` && target.searchParams.get('alt') === 'media') return new Response(bytes, { status: 200, headers: { 'content-type': 'application/zip' } });
    if (target.pathname === `/drive/v3/files/${fileId}`) return json(remote);
    throw new Error(`requisição inesperada: ${method} ${target}`);
  };
  const adapter = createGoogleDriveArchiveAdapter({ tokenProvider: { async getToken() { return 'token'; } }, fetchImpl, sleep: async () => {} });
  const directory = await mkdtemp(path.join(tmpdir(), 'subsolo-drive-integrated-'));
  const receiptPath = path.join(directory, 'receipt.json');
  const receipt = await applyPackageArchive({ packagePath, rootFolderId: 'root', receiptPath, adapter, now: () => new Date('2026-07-20T18:30:00.000Z') });
  assert.equal(receipt.file_id, fileId);
  assert.equal(receipt.disposition, 'uploaded');
  assert.equal(uploadCount, 1);
  const persisted = JSON.parse(await readFile(receiptPath, 'utf8'));
  assert.doesNotMatch(JSON.stringify(persisted), /https?:\/\//);

  const secondReceiptPath = path.join(directory, 'receipt-second.json');
  const second = await applyPackageArchive({ packagePath, rootFolderId: 'root', receiptPath: secondReceiptPath, adapter, now: () => new Date('2026-07-20T18:35:00.000Z') });
  assert.equal(second.disposition, 'already-archived');
  assert.equal(uploadCount, 1);
});
