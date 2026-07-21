import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const data = JSON.parse(
  await readFile(new URL('../../src/data/fixtures/editorial-site.json', import.meta.url), 'utf8'),
);
test('fixture possui edição e publicações de canais diferentes', () => {
  assert.equal(data.edition.id, 'ed_2026-07-20');
  assert.ok(data.publications.length >= 3);
  assert.ok(new Set(data.publications.map((item) => item.channel)).size >= 3);
});
test('todas as publicações possuem sumário, seções, fontes e conexões válidas', () => {
  const ids = new Set(data.publications.map((item) => item.id));
  const sources = new Set(data.sources.map((item) => item.id));
  for (const item of data.publications) {
    assert.ok(item.toc.length > 0);
    assert.ok(item.sections.length > 0);
    assert.ok(item.sourceIds.every((id) => sources.has(id)));
    assert.ok(item.connectionIds.every((id) => ids.has(id)));
  }
});
test('conteúdo não contém html executável', () => {
  const text = JSON.stringify(data).toLowerCase();
  assert.doesNotMatch(text, /<script|<iframe|javascript:/);
});
