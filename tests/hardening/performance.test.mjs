import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { test } from 'node:test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkDegradedModes } from '../../scripts/check-degraded-modes.mjs';
import { checkPerformance } from '../../scripts/check-performance.mjs';
import { runScaleTest } from '../../scripts/test-scale.mjs';

const rootPath = new URL('../..', import.meta.url).pathname;
const previewPath = new URL('../../reports/prompt-06/preview', import.meta.url).pathname;
const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, new URL('../../', import.meta.url)), 'utf8'));

test('preview respeita budgets de HTML, CSS, JS, imagem e transferência', async () => {
  const report = await checkPerformance({ root: rootPath, site: previewPath });
  assert.equal(report.status, 'pass');
  assert.ok(report.routes >= 100);
  assert.ok(
    report.worstRoute.blockingJs <= report.budgets.route.blocking_javascript_uncompressed_bytes,
  );
});

test('conteúdo crítico funciona sem JS e no perfil de conexão lenta', async () => {
  const report = await checkDegradedModes({ root: rootPath, site: previewPath });
  assert.equal(report.status, 'pass');
  assert.equal(report.pagesWithCriticalContentWithoutJs, report.htmlFiles);
  assert.ok(report.worstHtmlOnlySeconds < report.profile.critical_content_seconds);
});

test('canonical absoluta da própria origem não é dependência externa', async () => {
  const site = await mkdtemp(join(tmpdir(), 'subsolo-degraded-origin-'));
  try {
    await writeFile(
      join(site, 'index.html'),
      '<!doctype html><html><head><link rel="canonical" href="http://localhost:4321/"></head><body><main id="conteudo"><h1>Conteúdo</h1></main></body></html>',
    );
    const report = await checkDegradedModes({ root: rootPath, site });
    assert.equal(report.status, 'pass', report.issues.join('\n'));
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});

test('recurso absoluto de outra origem continua bloqueado', async () => {
  const site = await mkdtemp(join(tmpdir(), 'subsolo-degraded-external-'));
  try {
    await writeFile(
      join(site, 'index.html'),
      '<!doctype html><html><head><link rel="canonical" href="http://localhost:4321/"><link rel="stylesheet" href="https://tracker.invalid/style.css"></head><body><main id="conteudo"><h1>Conteúdo</h1></main></body></html>',
    );
    const report = await checkDegradedModes({ root: rootPath, site });
    assert.equal(report.status, 'fail');
    assert.ok(report.issues.some((issue) => issue.includes('tracker.invalid')));
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});

test('escala de dez mil publicações cabe no orçamento', async () => {
  const report = await runScaleTest({ root: rootPath });
  assert.equal(report.status, 'pass');
  assert.equal(report.publications, 10000);
  assert.equal(report.facets.channels, 9);
  assert.equal(report.facets.authors, 44);
});

test('teste de escala é estruturalmente determinístico', async () => {
  const first = await runScaleTest({ root: rootPath, count: 1000 });
  const second = await runScaleTest({ root: rootPath, count: 1000 });
  for (const key of ['publications', 'archiveIndexBytes', 'pageCount', 'rssItems'])
    assert.equal(first[key], second[key]);
  assert.deepEqual(first.facets, second.facets);
});

test('gatilhos de capacidade exigem decisão antes do crescimento', async () => {
  const policy = await readJson('config/hardening/capacity-policy.json');
  assert.equal(policy.automatic_deletion_allowed, false);
  assert.ok(policy.review_triggers.publications > 10000);
  assert.match(policy.required_response, /decision record/i);
});
