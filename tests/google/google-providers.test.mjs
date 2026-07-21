import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  GOOGLE_READONLY_SCOPES,
  GoogleWorkspaceFailure,
  createEnvironmentAccessTokenProvider,
  createGoogleDocsProvider,
  createGoogleSheetsProvider,
  createServiceAccountTokenProvider,
  createStructuredLogger,
  loadGoogleEditorialInput,
  requestGoogleJson,
  rowsFromSheetValues,
  transformGoogleDocument,
} from '../../src/lib/infrastructure/google/google-workspace.mjs';
import { buildExport } from '../../cli/exporter-core.mjs';

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const documentResponse = 'fixtures/google/docs/document-response.json';
const multiTabResponse = 'fixtures/google/docs/document-multi-tab.json';
const suggestionResponse = 'fixtures/google/docs/document-suggestion.json';
const sheetPage1 = 'fixtures/google/sheets/page-1.json';
const sheetPage2 = 'fixtures/google/sheets/page-2.json';
const goldenDir = 'fixtures/exporter/golden';
const tokenProvider = { async getToken() { return 'test-access-token'; } };
const jsonResponse = (data, init = {}) => new Response(JSON.stringify(data), {
  status: init.status ?? 200,
  headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
});
const captureFailure = async (fn) => {
  try {
    await fn();
    assert.fail('esperava falha');
  } catch (error) {
    assert.ok(error instanceof GoogleWorkspaceFailure, String(error));
    return error;
  }
};

test('transforma Google Docs com headings, blocos, lista, tabela, citação e link', async () => {
  const apiDocument = await readJson(documentResponse);
  const document = transformGoogleDocument(apiDocument, { etag: '"rev-google-17"' });
  assert.equal(document.documentId, 'fixture-transporte');
  assert.equal(document.revisionId, 'rev-google-17');
  assert.equal(document.unresolvedSuggestions, 0);
  assert.equal(document.nodes[0].type, 'heading');
  assert.ok(document.nodes.some((node) => node.type === 'editorial-block' && node.kind === 'fact'));
  assert.ok(document.nodes.some((node) => node.type === 'list' && node.items.length === 2));
  assert.ok(document.nodes.some((node) => node.type === 'table' && node.rows.length === 2));
  assert.ok(document.nodes.some((node) => node.type === 'quote'));
  assert.match(document.nodes.at(-1).text, /\[Documento de origem\]\(https:\/\/example\.org/);
});

test('documento com múltiplas abas exige seleção explícita', async () => {
  const apiDocument = await readJson(multiTabResponse);
  const error = await captureFailure(() => Promise.resolve(transformGoogleDocument(apiDocument)));
  assert.equal(error.code, 'SUBSOLO_GOOGLE_DOCS_TAB_REQUIRED');
  const selected = transformGoogleDocument(apiDocument, { tabId: 'tab-main' });
  assert.equal(selected.title, 'A cidade terceirizou o relógio');
});

test('detecta sugestões pendentes na resposta do Docs', async () => {
  const apiDocument = await readJson(suggestionResponse);
  const document = transformGoogleDocument(apiDocument);
  assert.ok(document.unresolvedSuggestions > 0);
  const row = await readJson('fixtures/exporter/valid/sheet-row.json');
  assert.throws(() => buildExport({ row, document }), /sugest/i);
});

test('provider Docs usa endpoint somente leitura, includeTabsContent e cache efêmero', async () => {
  const apiDocument = await readJson(documentResponse);
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), authorization: options.headers.authorization });
    return jsonResponse(apiDocument, { headers: { etag: '"rev-cache"' } });
  };
  const provider = createGoogleDocsProvider({ tokenProvider, fetchImpl, cacheTtlMs: 60_000 });
  const first = await provider.read('fixture-transporte');
  const second = await provider.read('fixture-transporte');
  assert.deepEqual(first, second);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/docs\.googleapis\.com\/v1\/documents\/fixture-transporte/);
  assert.match(calls[0].url, /includeTabsContent=true/);
  assert.equal(calls[0].authorization, 'Bearer test-access-token');
});

test('converte linhas do Sheets e preserva tipos estruturados', async () => {
  const page = await readJson(sheetPage1);
  const rows = rowsFromSheetValues(page.values);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].destaque, false);
  assert.ok(Array.isArray(rows[0].autores_publicos));
  assert.ok(Array.isArray(rows[0].fontes));
  assert.equal(rows[0].story_id, null);
});

test('provider Sheets pagina por faixas e encontra artigo na segunda página', async () => {
  const page1 = await readJson(sheetPage1);
  const page2 = await readJson(sheetPage2);
  const calls = [];
  const fetchImpl = async (url) => {
    const decoded = decodeURIComponent(String(url));
    calls.push(decoded);
    if (decoded.includes('A1:AZ2')) return jsonResponse(page1);
    if (decoded.includes('A3:AZ4')) return jsonResponse(page2);
    return jsonResponse({ values: [] });
  };
  const provider = createGoogleSheetsProvider({
    spreadsheetId: 'sheet-test',
    range: 'ARTIGOS!A:AZ',
    pageSize: 2,
    tokenProvider,
    fetchImpl,
  });
  const row = await provider.read('artigo-2026-07-20-transporte');
  assert.equal(row.document_id, 'fixture-transporte');
  assert.equal(row.titulo, 'A cidade terceirizou o relógio');
  assert.equal(calls.length, 2);
});

test('providers Google produzem exatamente os mesmos bytes do provider fixture', async () => {
  const apiDocument = await readJson(documentResponse);
  const page1 = await readJson(sheetPage1);
  const page2 = await readJson(sheetPage2);
  const fetchImpl = async (url) => {
    const target = decodeURIComponent(String(url));
    if (target.startsWith('https://docs.googleapis.com/')) return jsonResponse(apiDocument, { headers: { etag: '"rev-google"' } });
    if (target.includes('A1:AZ2')) return jsonResponse(page1);
    if (target.includes('A3:AZ4')) return jsonResponse(page2);
    throw new Error(`URL inesperada: ${target}`);
  };
  const sheetProvider = createGoogleSheetsProvider({ spreadsheetId: 'sheet-test', range: 'ARTIGOS!A:AZ', pageSize: 2, tokenProvider, fetchImpl });
  const documentProvider = createGoogleDocsProvider({ tokenProvider, fetchImpl });
  const input = await loadGoogleEditorialInput({ articleId: 'artigo-2026-07-20-transporte', sheetProvider, documentProvider });
  const output = buildExport(input);
  for (const [name, content] of output.files) {
    assert.equal(content, await readFile(path.join(goldenDir, name), 'utf8'), name);
  }
});

test('request repete 429 e respeita Retry-After', async () => {
  let attempts = 0;
  const waits = [];
  const result = await requestGoogleJson({
    url: 'https://docs.googleapis.com/v1/documents/x',
    tokenProvider,
    maxAttempts: 3,
    sleep: async (ms) => waits.push(ms),
    random: () => 0,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return jsonResponse({ error: { status: 'RESOURCE_EXHAUSTED' } }, { status: 429, headers: { 'retry-after': '1' } });
      return jsonResponse({ ok: true });
    },
  });
  assert.equal(result.data.ok, true);
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [1000]);
});

test('request normaliza acesso negado sem retry', async () => {
  let attempts = 0;
  const error = await captureFailure(() => requestGoogleJson({
    url: 'https://docs.googleapis.com/v1/documents/x',
    tokenProvider,
    maxAttempts: 3,
    fetchImpl: async () => {
      attempts += 1;
      return jsonResponse({ error: { status: 'PERMISSION_DENIED' } }, { status: 403 });
    },
  }));
  assert.equal(error.code, 'SUBSOLO_GOOGLE_ACCESS_DENIED');
  assert.equal(attempts, 1);
});

test('request encerra chamadas que excedem timeout', async () => {
  const error = await captureFailure(() => requestGoogleJson({
    url: 'https://docs.googleapis.com/v1/documents/x',
    tokenProvider,
    timeoutMs: 5,
    maxAttempts: 1,
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' })));
    }),
  }));
  assert.equal(error.code, 'SUBSOLO_GOOGLE_TIMEOUT');
  assert.equal(error.retryable, true);
});

test('logger redige tokens, chaves e IDs privados', () => {
  const entries = [];
  const logger = createStructuredLogger({ sink: (entry) => entries.push(entry), verbose: true });
  logger.debug('test', {
    authorization: 'Bearer secret-token',
    private_key: 'PRIVATE',
    document_id: 'doc-secret-id',
    spreadsheetId: 'sheet-secret-id',
  });
  const text = JSON.stringify(entries);
  assert.doesNotMatch(text, /secret-token|PRIVATE|doc-secret-id|sheet-secret-id/);
  assert.match(text, /REDACTED|sha256:/);
});

test('token efêmero ausente produz erro acionável', async () => {
  const provider = createEnvironmentAccessTokenProvider({ env: {} });
  const error = await captureFailure(() => provider.getToken());
  assert.equal(error.code, 'SUBSOLO_GOOGLE_CREDENTIAL_MISSING');
});

test('conta de serviço cria JWT, usa somente scopes de leitura e reutiliza token', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const directory = await mkdtemp(path.join(tmpdir(), 'subsolo-google-auth-'));
  const credentialPath = path.join(directory, 'service-account.json');
  await writeFile(credentialPath, JSON.stringify({
    client_email: 'subsolo-test@example.iam.gserviceaccount.com',
    // secret-scan: allow-next-line — chave efêmera gerada em runtime para o teste.
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    token_uri: 'https://oauth2.googleapis.com/token',
  }));
  const bodies = [];
  const provider = createServiceAccountTokenProvider({
    credentialPath,
    now: () => 1_700_000_000_000,
    fetchImpl: async (_url, options) => {
      bodies.push(String(options.body));
      // secret-scan: allow-next-line — token sintético de resposta fixture.
      return jsonResponse({ access_token: 'service-token', expires_in: 3600 });
    },
  });
  assert.equal(await provider.getToken(), 'service-token');
  assert.equal(await provider.getToken(), 'service-token');
  assert.equal(bodies.length, 1);
  const assertion = new URLSearchParams(bodies[0]).get('assertion');
  const payload = JSON.parse(Buffer.from(assertion.split('.')[1], 'base64url').toString('utf8'));
  assert.deepEqual(payload.scope.split(' '), GOOGLE_READONLY_SCOPES);
  assert.ok(payload.scope.endsWith('spreadsheets.readonly'));
});

test('JSON inválido em coluna estruturada é rejeitado', async () => {
  const error = await captureFailure(() => Promise.resolve(rowsFromSheetValues([
    ['artigo_id', 'fontes'],
    ['artigo-1', '{invalido'],
  ])));
  assert.equal(error.code, 'SUBSOLO_GOOGLE_SHEETS_JSON_INVALID');
});

test('integração Google exige confirmação humana de comentários resolvidos', async () => {
  const row = await readJson('fixtures/exporter/valid/sheet-row.json');
  row.comentarios_resolvidos = false;
  const error = await captureFailure(() => loadGoogleEditorialInput({
    articleId: row.artigo_id,
    sheetProvider: { async read() { return row; } },
    documentProvider: { async read() { return readJson('fixtures/exporter/valid/document.json'); } },
  }));
  assert.equal(error.code, 'SUBSOLO_GOOGLE_COMMENTS_GATE_PENDING');
});

test('provider Sheets falha fechado ao atingir limite de páginas', async () => {
  const page = await readJson(sheetPage1);
  const provider = createGoogleSheetsProvider({
    spreadsheetId: 'sheet-test',
    range: 'ARTIGOS!A:AZ',
    pageSize: 2,
    maxPages: 1,
    tokenProvider,
    fetchImpl: async () => jsonResponse(page),
  });
  const error = await captureFailure(() => provider.read('ausente'));
  assert.equal(error.code, 'SUBSOLO_GOOGLE_SHEETS_PAGE_LIMIT');
});
