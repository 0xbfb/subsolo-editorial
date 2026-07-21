import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

const root = 'fixtures/editorial/edition-2026-07-20';
const readJson = async (name) => JSON.parse(await readFile(`${root}/${name}`, 'utf8'));
const [pitches, articles, edition, authors, channels, frames, sources, publications, corrections] =
  await Promise.all([
    readJson('pitches.json'),
    readJson('articles.json'),
    readJson('edition.json'),
    readJson('authors.json'),
    readJson('channels.json'),
    readJson('frames.json'),
    readJson('sources.json'),
    readJson('publications.json'),
    readJson('corrections.json'),
  ]);

test('fixture representa edição, pauta, artigo, autor, canal, quadro, fonte, publicação e correção', () => {
  assert.equal(edition.edition_id, 'ed_2026-07-20');
  assert.ok(pitches.length >= 2);
  assert.ok(articles.length >= 3);
  assert.equal(authors.length, 44);
  assert.equal(channels.length, 9);
  assert.ok(frames.length >= 60);
  assert.ok(sources.length >= 2);
  assert.ok(publications.length >= 1);
  assert.ok(corrections.length >= 1);
});

test('referências principais da fixture são resolvíveis', () => {
  const pitchIds = new Set(pitches.map((item) => item.pauta_id));
  const authorIds = new Set(authors.map((item) => item.author_id));
  const channelIds = new Set(channels.map((item) => item.channel_id));
  const frameIds = new Set(frames.map((item) => item.frame_id));
  for (const article of articles) {
    assert.ok(pitchIds.has(article.pauta_id), article.artigo_id);
    assert.ok(authorIds.has(article.autor), article.artigo_id);
    assert.ok(authorIds.has(article.editor), article.artigo_id);
    assert.ok(channelIds.has(article.canal), article.artigo_id);
    if (article.quadro) assert.ok(frameIds.has(article.quadro), article.artigo_id);
  }
});

test('campos privados permanecem explicitamente privados no workbook', async () => {
  const workbook = JSON.parse(
    await readFile('templates/google/sheets/workbook.schema.json', 'utf8'),
  );
  const observations = workbook.tabs.PAUTAS.find((field) => field.name === 'observacoes_privadas');
  assert.equal(observations.visibility, 'private');
  const publicTitle = workbook.tabs.ARTIGOS.find((field) => field.name === 'titulo');
  assert.equal(publicTitle.visibility, 'candidate_public');
});
