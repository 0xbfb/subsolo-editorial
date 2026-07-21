import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildArchiveIndex,
  buildRss,
  buildRobots,
  buildSitemap,
  collectDateRoutes,
  createDiscoveryEntries,
  entriesForDate,
  facetCounts,
  paginateEntries,
  parseArchiveRecords,
} from '../src/lib/domain/discovery.mjs';
const archive = JSON.parse(
  await readFile(new URL('../src/data/fixtures/archive-history.json', import.meta.url), 'utf8'),
);
const site = JSON.parse(
  await readFile(new URL('../src/data/fixtures/editorial-site.json', import.meta.url), 'utf8'),
);
const records = parseArchiveRecords(archive);
const entries = createDiscoveryEntries({
  publications: site.publications,
  archiveRecords: records,
});
test('arquivo combina publicações e registros em ordem reversa', () => {
  assert.equal(entries.length, 25);
  assert.equal(entries[0].date, '2026-07-20');
  assert.equal(entries.at(-1).date, '2026-07-13');
});
test('paginação é determinística e rejeita página inexistente', () => {
  const page = paginateEntries(entries, 2, 8);
  assert.equal(page.items.length, 8);
  assert.equal(page.pageCount, 4);
  assert.throws(() => paginateEntries(entries, 5, 8), /OUT_OF_RANGE/);
});
test('rotas anuais mensais e diárias são únicas', () => {
  const dates = collectDateRoutes(entries);
  assert.deepEqual(dates.years, ['2026']);
  assert.equal(dates.months.length, 1);
  assert.equal(dates.days.length, 8);
});
test('filtro por data retorna o dia correto', () => {
  assert.equal(entriesForDate(entries, '2026', '07', '13').length, 3);
});
test('facetas incluem canal tema autor tipo estado e história', () => {
  const facets = facetCounts(entries);
  for (const key of ['channel', 'topic', 'author', 'type', 'state', 'story'])
    assert.ok(facets[key]);
  assert.equal(facets.channel['bom-dia-distopia'], 8);
});
test('archive-index é compacto e não contém corpo editorial', () => {
  const index = buildArchiveIndex(entries, '2026-07-21T00:00:00.000Z');
  assert.equal(index.total, 25);
  assert.ok(!JSON.stringify(index).includes('sections'));
});
test('feeds RSS escapam conteúdo e têm GUID estável', () => {
  const rss = buildRss({
    entries,
    title: 'A & B',
    description: 'Teste',
    origin: 'https://example.com',
    feedPath: '/rss.xml',
  });
  assert.match(rss, /A &amp; B/);
  assert.match(rss, /guid isPermaLink="true"/);
});
test('sitemap e robots apontam para URLs absolutas', () => {
  const sitemap = buildSitemap({
    entries,
    staticPaths: ['/'],
    origin: 'https://example.com',
    basePath: '/subsolo/',
  });
  const robots = buildRobots({ origin: 'https://example.com', basePath: '/subsolo/' });
  assert.match(sitemap, /https:\/\/example.com\/subsolo\//);
  assert.match(robots, /Sitemap: https:\/\/example.com\/subsolo\/sitemap.xml/);
});
test('registro inválido é rejeitado', () => {
  assert.throws(() => parseArchiveRecords([{ ...archive[0], slug: '../x' }]), /slug inválido/);
});
