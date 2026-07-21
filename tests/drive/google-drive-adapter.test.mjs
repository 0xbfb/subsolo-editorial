import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  GOOGLE_DRIVE_FILE_SCOPE,
  GoogleDriveArchiveFailure,
  createGoogleDriveArchiveAdapter,
  createGoogleDriveTokenProvider,
} from '../../src/lib/infrastructure/google/google-drive.mjs';

const folderMime = 'application/vnd.google-apps.folder';
const tokenProvider = { async getToken() { return 'drive-test-token'; } };
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json', ...headers } });
const capture = async (fn) => { try { await fn(); assert.fail('esperava falha'); } catch (error) { assert.ok(error instanceof GoogleDriveArchiveFailure, String(error)); return error; } };

test('valida raiz e cria somente a hierarquia técnica ausente', async () => {
  let created = 0;
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const target = new URL(String(url));
    calls.push({ method: options.method ?? 'GET', url: target.toString(), body: options.body });
    if (target.pathname === '/drive/v3/files/root') return json({ id: 'root', name: 'SUBSOLO', mimeType: folderMime, parents: [], trashed: false, driveId: null });
    if (target.pathname === '/drive/v3/files' && (options.method ?? 'GET') === 'GET') return json({ files: [] });
    if (target.pathname === '/drive/v3/files' && options.method === 'POST') {
      const body = JSON.parse(options.body); created += 1;
      return json({ id: `folder-${created}`, name: body.name, mimeType: folderMime, parents: body.parents, appProperties: body.appProperties, trashed: false }, 201);
    }
    throw new Error(`requisição inesperada: ${options.method ?? 'GET'} ${target}`);
  };
  const adapter = createGoogleDriveArchiveAdapter({ tokenProvider, fetchImpl, sleep: async () => {} });
  const root = await adapter.validateRoot('root');
  assert.equal(root.name, 'SUBSOLO');
  const result = await adapter.ensurePath('root', '2026', '07');
  assert.equal(result.folderId, 'folder-4');
  assert.deepEqual(result.segments.map((item) => item.status), ['create', 'create', 'create', 'create']);
  assert.equal(created, 4);
  assert.ok(calls.every((call) => !String(call.body ?? '').includes('private_url')));
});

test('dry-run marca pastas faltantes sem criar recursos', async () => {
  let writes = 0;
  const fetchImpl = async (url, options = {}) => {
    const target = new URL(String(url));
    if (target.pathname.endsWith('/root')) return json({ id: 'root', name: 'SUBSOLO', mimeType: folderMime, trashed: false });
    if (options.method === 'POST') writes += 1;
    return json({ files: [] });
  };
  const adapter = createGoogleDriveArchiveAdapter({ tokenProvider, fetchImpl });
  await adapter.validateRoot('root');
  const plan = await adapter.planPath('root', '2026', '07');
  assert.equal(plan.folderId, null);
  assert.equal(writes, 0);
  assert.deepEqual(plan.segments.map((item) => item.status), ['create', 'create', 'create', 'create']);
});

test('busca duplicidade por pasta, MIME e appProperties, não apenas pelo nome', async () => {
  let query = '';
  const fetchImpl = async (url) => {
    const target = new URL(String(url)); query = target.searchParams.get('q') ?? '';
    return json({ files: [{ id: 'same-file', name: 'outro-nome.zip', mimeType: 'application/zip', parents: ['month'], appProperties: { subsolo_package_sha256: 'a'.repeat(64) }, size: '10', trashed: false }] });
  };
  const adapter = createGoogleDriveArchiveAdapter({ tokenProvider, fetchImpl });
  const found = await adapter.findByPackageSha256('month', 'a'.repeat(64));
  assert.equal(found.id, 'same-file');
  assert.match(query, /'month' in parents/);
  assert.match(query, /appProperties has/);
  assert.match(query, /mimeType = 'application\/zip'/);
});

test('upload resumível envia chunks e conclui com metadata', async () => {
  const ranges = [];
  const total = 600_000;
  const fetchImpl = async (url, options = {}) => {
    if (String(url).includes('uploadType=resumable')) return new Response('', { status: 200, headers: { location: 'https://upload.example/session/1' } });
    if (String(url) === 'https://upload.example/session/1') {
      ranges.push(options.headers['content-range']);
      if (ranges.length === 1) return new Response('', { status: 308, headers: { range: 'bytes=0-262143' } });
      if (ranges.length === 2) return new Response('', { status: 308, headers: { range: 'bytes=0-524287' } });
      return json({ id: 'uploaded-file' }, 200);
    }
    throw new Error(`URL inesperada: ${url}`);
  };
  const adapter = createGoogleDriveArchiveAdapter({ tokenProvider, fetchImpl, chunkSize: 262_144, sleep: async () => {} });
  const result = await adapter.uploadResumable({ folderId: 'month', name: 'edition.zip', bytes: Buffer.alloc(total), metadata: { subsolo_package_sha256: 'b'.repeat(64) } });
  assert.equal(result.id, 'uploaded-file');
  assert.deepEqual(ranges, [`bytes 0-262143/${total}`, `bytes 262144-524287/${total}`, `bytes 524288-599999/${total}`]);
});

test('interrupção consulta a sessão e retoma do último byte confirmado', async () => {
  const ranges = [];
  let failed = false;
  const fetchImpl = async (url, options = {}) => {
    if (String(url).includes('uploadType=resumable')) return new Response('', { status: 200, headers: { location: 'https://upload.example/session/2' } });
    const range = options.headers['content-range'];
    ranges.push(range);
    if (range?.startsWith('bytes 0-') && !failed) { failed = true; throw new Error('rede caiu'); }
    if (range?.startsWith('bytes */')) return new Response('', { status: 308, headers: { range: 'bytes=0-262143' } });
    return json({ id: 'resumed-file' }, 200);
  };
  const adapter = createGoogleDriveArchiveAdapter({ tokenProvider, fetchImpl, chunkSize: 262_144, maxAttempts: 3, sleep: async () => {} });
  const result = await adapter.uploadResumable({ folderId: 'month', name: 'edition.zip', bytes: Buffer.alloc(400_000), metadata: { subsolo_package_sha256: 'c'.repeat(64) } });
  assert.equal(result.id, 'resumed-file');
  assert.ok(ranges.some((range) => range === 'bytes */400000'));
  assert.ok(ranges.some((range) => range === 'bytes 262144-399999/400000'));
});

test('raiz sem autorização gera erro acionável e não é tratada como pasta ausente', async () => {
  const adapter = createGoogleDriveArchiveAdapter({ tokenProvider, fetchImpl: async () => json({ error: { status: 'PERMISSION_DENIED' } }, 403) });
  const error = await capture(() => adapter.validateRoot('private-root'));
  assert.equal(error.code, 'SUBSOLO_DRIVE_ACCESS_DENIED');
  assert.equal(error.retryable, false);
});

test('conta de serviço solicita drive.file por padrão', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const directory = await mkdtemp(path.join(tmpdir(), 'subsolo-drive-auth-'));
  const credentialPath = path.join(directory, 'service-account.json');
  // secret-scan: allow-next-line — chave efêmera gerada em runtime para o teste.
  await writeFile(credentialPath, JSON.stringify({ client_email: 'drive-test@example.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), token_uri: 'https://oauth2.googleapis.com/token' }));
  let assertion = '';
  const provider = createGoogleDriveTokenProvider({
    env: { SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE: credentialPath },
    fetchImpl: async (_url, options) => {
      assertion = new URLSearchParams(options.body).get('assertion');
      return json({ access_token: 'token', expires_in: 3600 });
    },
  });
  assert.equal(await provider.getToken(), 'token');
  const payload = JSON.parse(Buffer.from(assertion.split('.')[1], 'base64url').toString('utf8'));
  assert.equal(payload.scope, GOOGLE_DRIVE_FILE_SCOPE);
});

test('quota 429 é repetida e termina quando o Drive responde', async () => {
  let attempts = 0;
  const adapter = createGoogleDriveArchiveAdapter({
    tokenProvider,
    maxAttempts: 2,
    sleep: async () => {},
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return json({ error: { errors: [{ reason: 'rateLimitExceeded' }] } }, 429);
      return json({ id: 'root', name: 'SUBSOLO', mimeType: folderMime, trashed: false });
    },
  });
  assert.equal((await adapter.validateRoot('root')).id, 'root');
  assert.equal(attempts, 2);
});

test('timeout do Drive é normalizado como retryable', async () => {
  const adapter = createGoogleDriveArchiveAdapter({
    tokenProvider,
    timeoutMs: 5,
    maxAttempts: 1,
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' })));
    }),
  });
  const error = await capture(() => adapter.validateRoot('root'));
  assert.equal(error.code, 'SUBSOLO_DRIVE_TIMEOUT');
  assert.equal(error.retryable, true);
});

test('sessão que não confirma a conclusão é rejeitada como upload parcial', async () => {
  const total = 262_144;
  const fetchImpl = async (url, options = {}) => {
    if (String(url).includes('uploadType=resumable')) return new Response('', { status: 200, headers: { location: 'https://upload.example/session/partial' } });
    const range = options.headers['content-range'];
    if (range === `bytes 0-${total - 1}/${total}`) return new Response('', { status: 308, headers: { range: `bytes=0-${total - 1}` } });
    if (range === `bytes */${total}`) return new Response('', { status: 308, headers: { range: `bytes=0-${total - 1}` } });
    throw new Error(`range inesperado: ${range}`);
  };
  const adapter = createGoogleDriveArchiveAdapter({ tokenProvider, fetchImpl, chunkSize: 262_144, maxAttempts: 1 });
  const error = await capture(() => adapter.uploadResumable({ folderId: 'month', name: 'edition.zip', bytes: Buffer.alloc(total), metadata: { subsolo_package_sha256: 'd'.repeat(64) } }));
  assert.equal(error.code, 'SUBSOLO_DRIVE_UPLOAD_INCOMPLETE');
});
