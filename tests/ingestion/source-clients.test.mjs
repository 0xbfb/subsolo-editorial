import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFreshRssClient,
  createGmailIngestionClient,
  createSearxngClient,
} from '../../src/lib/infrastructure/ingestion/source-clients.mjs';

const response = (body, { status = 200, headers = {} } = {}) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

test('FreshRSS requires an endpoint', () =>
  assert.throws(
    () => createFreshRssClient({}),
    (e) => e.code === 'SUBSOLO_INGEST_FRESHRSS_URL_MISSING',
  ));

test('FreshRSS authenticates with ClientLogin and reads the reading list', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return calls.length === 1
      ? response('SID=x\nAuth=token-123\n')
      : response({ items: [{ id: '1' }], continuation: 'next' });
  };
  const client = createFreshRssClient({
    baseUrl: 'http://127.0.0.1:8080/api/greader.php',
    username: 'reader',
    apiPassword: 'secret',
    fetchImpl,
  });
  const result = await client.listReadingList({ limit: 25 });
  assert.equal(result.entries.length, 1);
  assert.equal(result.continuation, 'next');
  assert.match(calls[0].url, /accounts\/ClientLogin$/);
  assert.match(calls[0].options.body, /Email=reader/);
  assert.match(calls[1].url, /stream\/contents\/reading-list/);
  assert.equal(calls[1].options.headers.Authorization, 'GoogleLogin auth=token-123');
});

test('Gmail client only lists and reads messages', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return response(
      calls.length === 1 ? { messages: [{ id: 'm1' }] } : { id: 'm1', payload: { headers: [] } },
    );
  };
  const client = createGmailIngestionClient({ accessToken: 'token', fetchImpl });
  const list = await client.listMessages({
    query: 'label:SUBSOLO/Pautas',
    labelIds: ['LBL'],
    maxResults: 10,
  });
  await client.getMessage(list.messages[0].id);
  assert.match(calls[0], /users\/me\/messages\?/);
  assert.match(calls[0], /q=label/);
  assert.match(calls[1], /messages\/m1\?format=full/);
  assert.ok(calls.every((url) => !/send|modify|trash/.test(url)));
});

test('Gmail requires a readonly token', () =>
  assert.throws(
    () => createGmailIngestionClient({}),
    (e) => e.code === 'SUBSOLO_INGEST_GMAIL_AUTH_MISSING',
  ));

test('SearXNG sends JSON search and reports unresponsive engines', async () => {
  let called = '';
  const client = createSearxngClient({
    baseUrl: 'http://127.0.0.1:8081',
    fetchImpl: async (url) => {
      called = String(url);
      return response({
        results: [{ url: 'https://example.com' }],
        unresponsive_engines: [['x', 'timeout']],
      });
    },
  });
  const result = await client.search({ query: 'contrato público', categories: 'news' });
  assert.match(called, /\/search\?/);
  assert.match(called, /format=json/);
  assert.equal(result.partial, true);
  assert.deepEqual(result.failedEngines, ['x']);
});

test('SearXNG unavailable is normalized as retryable network failure', async () => {
  const client = createSearxngClient({
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });
  await assert.rejects(
    () => client.search({ query: 'teste' }),
    (e) => e.code === 'SUBSOLO_INGEST_NETWORK_ERROR' && e.retryable === true,
  );
});

test('upstream HTTP 500 is retryable and actionable', async () => {
  const client = createSearxngClient({
    fetchImpl: async () => response({ error: 'down' }, { status: 500 }),
  });
  await assert.rejects(
    () => client.search({ query: 'teste' }),
    (e) => e.code === 'SUBSOLO_INGEST_UPSTREAM_UNAVAILABLE' && e.retryable === true,
  );
});

import {
  createGoogleSheetsPitchRepository,
  createIngestionTokenProvider,
} from '../../src/lib/infrastructure/ingestion/google-sheets-pitch-writer.mjs';

test('Sheets writer reads existing PAUTAS and appends RAW rows only', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return calls.length === 1
      ? response({
          values: [
            ['pauta_id', 'status'],
            ['p1', 'TRIAGEM'],
          ],
        })
      : response({ updates: { updatedRange: 'PAUTAS!A3:B3' } });
  };
  const repo = createGoogleSheetsPitchRepository({
    spreadsheetId: 'sheet-id',
    range: 'PAUTAS!A:B',
    headers: ['pauta_id', 'status'],
    tokenProvider: {
      async getToken() {
        return 'write-token';
      },
    },
    fetchImpl,
  });
  assert.deepEqual(await repo.list(), [{ pauta_id: 'p1', status: 'TRIAGEM' }]);
  const result = await repo.insert({ pauta_id: 'p2', status: 'TRIAGEM' });
  assert.equal(result.updated_range, 'PAUTAS!A3:B3');
  assert.match(calls[1].url, /:append\?/);
  assert.match(calls[1].url, /valueInputOption=RAW/);
  assert.equal(calls[1].options.method, 'POST');
});

test('Sheets writer token provider uses a separate spreadsheets scope', async () => {
  const env = { SUBSOLO_GOOGLE_SHEETS_WRITE_ACCESS_TOKEN: 'ephemeral' };
  const provider = createIngestionTokenProvider({ env });
  assert.equal(await provider.getToken(), 'ephemeral');
});
