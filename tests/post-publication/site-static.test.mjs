import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createDiscoveryEntries, parseArchiveRecords } from '../../src/lib/domain/discovery.mjs';

const fixture = JSON.parse(await readFile(new URL('../../src/data/fixtures/editorial-site.json', import.meta.url), 'utf8'));
const archive = JSON.parse(await readFile(new URL('../../src/data/fixtures/archive-history.json', import.meta.url), 'utf8'));
const routeSource = await readFile(new URL('../../src/pages/[year]/[month]/[day]/[slug].astro', import.meta.url), 'utf8');
const correctionComponent = await readFile(new URL('../../src/components/article/CorrectionNotice.astro', import.meta.url), 'utf8');
const tombstoneComponent = await readFile(new URL('../../src/components/article/WithdrawalTombstone.astro', import.meta.url), 'utf8');

test('fixture pública distingue correção, mudança de slug e retirada', () => {
  const corrected = fixture.publications.find((item) => item.state === 'Corrigido');
  const withdrawn = fixture.publications.find((item) => item.state === 'Retirado');
  assert.equal(corrected.corrections[0].type, 'correcao-factual');
  assert.equal(corrected.corrections[0].previousRevision, 1);
  assert.equal(corrected.corrections[0].newRevision, 2);
  assert.equal(withdrawn.bodyVisibility, 'tombstone');
  assert.ok(withdrawn.tombstone.reason.length > 20);
  assert.equal(fixture.redirects[0].statusCode, 308);
});

test('rota dinâmica gera redirect permanente e página-túmulo no canonical', () => {
  assert.match(routeSource, /Astro\.redirect/);
  assert.match(routeSource, /redirect\.statusCode/);
  assert.match(routeSource, /WithdrawalTombstone/);
  assert.match(routeSource, /bodyVisibility === 'tombstone'/);
  assert.match(tombstoneComponent, /Esta publicação foi retirada/);
  assert.match(tombstoneComponent, /URL.*preservada/s);
});

test('nota pública mostra tipo, impacto e cadeia de revisão', () => {
  assert.match(correctionComponent, /Correção factual/);
  assert.match(correctionComponent, /Atualização material/);
  assert.match(correctionComponent, /r\{correction\.previousRevision\} → r\{correction\.newRevision\}/);
  assert.match(correctionComponent, /Impacto:/);
});

test('retirada permanece no arquivo e na busca sem indexar o corpo ocultado', () => {
  const entries = createDiscoveryEntries({ publications: fixture.publications, archiveRecords: parseArchiveRecords(archive) });
  const withdrawn = entries.find((item) => item.bodyVisibility === 'tombstone');
  const source = fixture.publications.find((item) => item.id === withdrawn.id);
  assert.equal(withdrawn.state, 'Retirado');
  assert.equal(withdrawn.summary, source.tombstone.impact);
  assert.equal(withdrawn.latestCorrection.type, 'retirada');
  assert.notEqual(withdrawn.summary, source.subtitle);
});
