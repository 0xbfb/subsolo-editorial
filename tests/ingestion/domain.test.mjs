import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  canonicalizeUrl,
  createPreliminaryPitch,
  createSourceFingerprint,
  findDuplicate,
  normalizeFreshRssItem,
  normalizeGmailMessage,
  normalizeSearxngResult,
} from '../../src/lib/domain/editorial-ingestion.mjs';
import { ingestEditorialEntries } from '../../src/lib/application/editorial-ingestion.mjs';

const fixture = async (name) =>
  JSON.parse(await readFile(new URL(`../../fixtures/ingestion/${name}`, import.meta.url), 'utf8'));
const memoryRepository = (initial = []) => {
  const rows = [...initial];
  return {
    rows,
    async list() {
      return [...rows];
    },
    async insert(p) {
      rows.push(p);
      return { inserted: true };
    },
  };
};
const memoryQuarantine = () => {
  const rows = [];
  return {
    rows,
    async record(v) {
      rows.push(v);
    },
  };
};
const fixedNow = () => new Date('2026-07-20T18:00:00-03:00');

test('canonical URL removes tracking and sorts query params', () => {
  assert.equal(
    canonicalizeUrl('https://WWW.Example.com/a/?utm_source=rss&b=2&a=1#top'),
    'https://example.com/a?a=1&b=2',
  );
});

test('FreshRSS preserves publication date separately from fact date', () => {
  const entry = normalizeFreshRssItem({
    title: 'Fato',
    url: 'https://example.com/fato',
    published_at: '2026-07-20T12:00:00-03:00',
    fact_occurred_at: '2026-07-19T22:00:00-03:00',
  });
  assert.equal(entry.published_at, '2026-07-20T15:00:00.000Z');
  assert.equal(entry.fact_occurred_at, '2026-07-20T01:00:00.000Z');
});

test('release remains an unverified communication', () => {
  const entry = normalizeFreshRssItem({
    title: 'Press release: produto',
    url: 'https://corp.example/release',
  });
  const pitch = createPreliminaryPitch(entry);
  assert.equal(entry.claim_nature, 'COMUNICADO_OU_RELEASE');
  assert.equal(pitch.verificacao, 'NAO_VERIFICADO');
  assert.equal(pitch.status, 'TRIAGEM');
  assert.equal(pitch.nivel_cobertura, 0);
  assert.equal(pitch.canal_provavel, '');
});

test('same fingerprint is an exact duplicate', () => {
  const entry = normalizeFreshRssItem({
    title: 'Mesmo título',
    url: 'https://example.com/x',
    origin: { title: 'Origem' },
  });
  const pitch = createPreliminaryPitch(entry);
  const duplicate = findDuplicate(entry, [pitch]);
  assert.equal(duplicate.kind, 'exact');
});

test('same canonical URL with changed release title is probable duplicate', async () => {
  const input = await fixture('freshrss-release-repeat.json');
  const first = normalizeFreshRssItem(input.items[0]);
  const second = normalizeFreshRssItem(input.items[1]);
  const duplicate = findDuplicate(second, [createPreliminaryPitch(first)]);
  assert.equal(duplicate.kind, 'probable');
});

test('trusted Gmail attachment is quarantined but not downloaded or opened', async () => {
  const input = await fixture('gmail-trusted.json');
  const repository = memoryRepository();
  const quarantine = memoryQuarantine();
  const report = await ingestEditorialEntries({
    source: 'gmail',
    entries: input.messages,
    repository,
    quarantine,
    config: { trustedSenders: ['pauta@fonte-confiavel.example'] },
    mode: 'apply',
    now: fixedNow,
  });
  assert.equal(report.created_count, 1);
  assert.equal(report.quarantine_count, 1);
  assert.equal(repository.rows[0].status, 'TRIAGEM');
  assert.match(repository.rows[0].url_origem, /^https:\/\/mail\.google\.com\//);
  assert.equal(quarantine.rows[0].filename, 'relatorio.pdf');
});

test('untrusted Gmail sender is rejected', async () => {
  const input = await fixture('gmail-untrusted.json');
  const report = await ingestEditorialEntries({
    source: 'gmail',
    entries: input.messages,
    repository: memoryRepository(),
    quarantine: memoryQuarantine(),
    config: { trustedSenders: ['pauta@fonte-confiavel.example'] },
    mode: 'dry-run',
    now: fixedNow,
  });
  assert.equal(report.rejected_count, 1);
  assert.equal(report.outcomes[0].code, 'SUBSOLO_INGEST_GMAIL_UNTRUSTED_SENDER');
});

test('suspicious attachment rejects pitch and still plans quarantine metadata', async () => {
  const input = await fixture('gmail-suspicious.json');
  const repository = memoryRepository();
  const quarantine = memoryQuarantine();
  const report = await ingestEditorialEntries({
    source: 'gmail',
    entries: input.messages,
    repository,
    quarantine,
    config: { trustedSenders: ['pauta@fonte-confiavel.example'] },
    mode: 'apply',
    now: fixedNow,
  });
  assert.equal(report.created_count, 0);
  assert.equal(report.rejected_count, 1);
  assert.equal(report.outcomes[0].code, 'SUBSOLO_INGEST_ATTACHMENT_SUSPICIOUS');
  assert.equal(quarantine.rows[0].suspicious, true);
});

test('SearXNG snippet is explicitly unverified and partial search is warned', async () => {
  const input = await fixture('searxng.json');
  const normalized = normalizeSearxngResult(input.results[0], { query: input.query });
  assert.equal(normalized.snippet_natureza, 'SNIPPET_DE_BUSCA_NAO_VERIFICADO');
  const report = await ingestEditorialEntries({
    source: 'searxng',
    entries: input.results,
    repository: memoryRepository(),
    quarantine: memoryQuarantine(),
    config: { partial: true, failedEngines: ['engine-x'] },
    mode: 'dry-run',
    now: fixedNow,
  });
  assert.equal(report.warnings[0].code, 'SUBSOLO_INGEST_SEARCH_PARTIAL');
  assert.equal(report.publication_effects, false);
  assert.equal(report.editorial_transition, 'TRIAGEM_ONLY');
});

test('dry-run never writes repository or quarantine', async () => {
  const input = await fixture('gmail-trusted.json');
  const repository = memoryRepository();
  const quarantine = memoryQuarantine();
  const report = await ingestEditorialEntries({
    source: 'gmail',
    entries: input.messages,
    repository,
    quarantine,
    config: { trustedSenders: ['pauta@fonte-confiavel.example'] },
    mode: 'dry-run',
    now: fixedNow,
  });
  assert.equal(report.planned_count, 1);
  assert.equal(repository.rows.length, 0);
  assert.equal(quarantine.rows.length, 0);
});

test('all generated pitches remain preliminary and never approved', async () => {
  const input = await fixture('freshrss.json');
  const repository = memoryRepository();
  await ingestEditorialEntries({
    source: 'freshrss',
    entries: input.items,
    repository,
    quarantine: memoryQuarantine(),
    mode: 'apply',
    now: fixedNow,
  });
  assert.equal(repository.rows.length, 2);
  assert.ok(
    repository.rows.every(
      (p) =>
        p.status === 'TRIAGEM' &&
        p.classificacao_preliminar === 'PRELIMINAR_NAO_EDITORIAL' &&
        p.status !== 'APROVADA',
    ),
  );
});

test('source fingerprint includes canonical URL, title and origin', () => {
  const a = createSourceFingerprint({
    url: 'https://example.com/x?utm_source=a',
    title: 'Título',
    source_origin: 'Origem',
  });
  const b = createSourceFingerprint({
    url: 'https://example.com/x',
    title: 'Título',
    source_origin: 'Origem',
  });
  const c = createSourceFingerprint({
    url: 'https://example.com/x',
    title: 'Outro',
    source_origin: 'Origem',
  });
  assert.equal(a, b);
  assert.notEqual(a, c);
});
