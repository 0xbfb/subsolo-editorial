
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const workbook = await readJson('templates/google/sheets/workbook.schema.json');
const authors = await readJson('src/data/editorial/catalogs/authors.json');
const channels = await readJson('src/data/editorial/catalogs/channels.json');
const frames = await readJson('src/data/editorial/catalogs/frames.json');

test('workbook declara as doze abas obrigatórias', () => {
  assert.deepEqual(Object.keys(workbook.tabs), [
    'PAUTAS', 'ARTIGOS', 'EDICOES', 'AUTORES', 'CANAIS', 'QUADROS',
    'TEMAS', 'FONTES', 'PUBLICACOES', 'CORRECOES', 'AUTOMACOES', 'CONFIGURACOES',
  ]);
});

test('cada aba possui bootstrap CSV e JSON', async () => {
  const files = new Set(await readdir('templates/google/sheets/bootstrap'));
  for (const tab of Object.keys(workbook.tabs)) {
    assert.ok(files.has(`${tab}.csv`), `CSV ausente: ${tab}`);
    assert.ok(files.has(`${tab}.json`), `JSON ausente: ${tab}`);
  }
});

test('catálogos iniciais correspondem aos documentos canônicos', () => {
  assert.equal(authors.length, 44);
  assert.equal(channels.length, 9);
  assert.ok(frames.length >= 60);
  assert.equal(new Set(authors.map((author) => author.author_id)).size, authors.length);
  assert.equal(new Set(channels.map((channel) => channel.channel_id)).size, channels.length);
  assert.equal(new Set(frames.map((frame) => frame.frame_id)).size, frames.length);
});

test('todo canal possui editor existente e todo quadro possui canal', () => {
  const authorIds = new Set(authors.map((author) => author.author_id));
  const channelIds = new Set(channels.map((channel) => channel.channel_id));
  for (const channel of channels) assert.ok(authorIds.has(channel.editor_id), channel.channel_id);
  for (const frame of frames) assert.ok(channelIds.has(frame.channel_id), frame.frame_id);
});
