import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { test } from 'node:test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkAccessibility } from '../../scripts/check-a11y.mjs';

const rootPath = new URL('../..', import.meta.url).pathname;
const root = new URL('../../', import.meta.url);
const text = async (path) => readFile(new URL(path, root), 'utf8');

test('fontes Astro passam na auditoria de acessibilidade estática', async () => {
  const report = await checkAccessibility({ root: rootPath });
  assert.equal(report.status, 'pass');
  assert.ok(report.source.pageSources >= 20);
});

test('preview representativo possui landmarks, h1 único, labels e imagens dimensionadas', async () => {
  const report = await checkAccessibility({
    root: rootPath,
    site: new URL('../../reports/prompt-06/preview', import.meta.url).pathname,
  });
  assert.equal(report.status, 'pass');
  assert.ok(report.rendered.htmlFiles >= 100);
});

test('redirect estático não exige semântica de página editorial', async () => {
  const site = await mkdtemp(join(tmpdir(), 'subsolo-a11y-redirect-'));
  try {
    await writeFile(
      join(site, 'index.html'),
      '<!doctype html><title>Redirecting</title><meta http-equiv="refresh" content="0;url=/destino/">',
    );
    const report = await checkAccessibility({ root: rootPath, site });
    assert.equal(report.status, 'pass', report.issues.join('\n'));
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});

test('tema oferece foco, movimento reduzido, alto contraste e cores forçadas', async () => {
  const css = await text('src/styles/jornal-concreto.css');
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-contrast: more/);
  assert.match(css, /forced-colors: active/);
  assert.doesNotMatch(css, /outline\s*:\s*(?:none|0)/i);
});

test('hierarquia de destaques começa em h2 após a manchete h1', async () => {
  const story = await text('src/components/editorial/StorySummary.astro');
  assert.match(story, /<h2>/);
  assert.doesNotMatch(story, /<h3>/);
  assert.match(await text('src/pages/canais/index.astro'), /id="diretorio-canais"/);
  assert.match(await text('src/pages/redacao/index.astro'), /id="diretorio-redacao"/);
});

test('busca permanece navegável sem JavaScript', async () => {
  const search = await text('src/components/discovery/SearchInterface.astro');
  assert.match(search, /<noscript>/);
  assert.match(search, /arquivo por data, canal, tema e autor/i);
  assert.match(search, /aria-live="polite"/);
  assert.match(search, /<script src=\{searchScriptHref\} defer><\/script>/);
});

test('retratos mantêm placeholder quando mídia não existe ou falha', async () => {
  const portrait = await text('src/components/media/Portrait.astro');
  const css = await text('src/styles/jornal-concreto.css');
  assert.match(portrait, /portrait__media/);
  assert.ok((portrait.match(/portrait-placeholder/g) ?? []).length >= 2);
  assert.match(css, /\.portrait__media > \* \{ grid-area: 1 \/ 1; \}/);
});
