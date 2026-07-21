
import { readFile, readdir } from 'node:fs/promises';

const fail = (code, message) => {
  console.error(`${code}: ${message}`);
  process.exitCode = 1;
};

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const root = 'fixtures/editorial/edition-2026-07-20';

try {
  const workbook = await readJson('templates/google/sheets/workbook.schema.json');
  const authors = await readJson(`${root}/authors.json`);
  const channels = await readJson(`${root}/channels.json`);
  const frames = await readJson(`${root}/frames.json`);
  const pitches = await readJson(`${root}/pitches.json`);
  const articles = await readJson(`${root}/articles.json`);
  const edition = await readJson(`${root}/edition.json`);
  const files = new Set(await readdir('templates/google/sheets/bootstrap'));

  const expectedTabs = [
    'PAUTAS', 'ARTIGOS', 'EDICOES', 'AUTORES', 'CANAIS', 'QUADROS',
    'TEMAS', 'FONTES', 'PUBLICACOES', 'CORRECOES', 'AUTOMACOES', 'CONFIGURACOES',
  ];
  if (JSON.stringify(Object.keys(workbook.tabs)) !== JSON.stringify(expectedTabs)) {
    fail('SUBSOLO_WORKBOOK_TABS_INVALID', 'As doze abas obrigatórias não estão na ordem canônica.');
  }
  for (const tab of expectedTabs) {
    if (!files.has(`${tab}.csv`) || !files.has(`${tab}.json`)) {
      fail('SUBSOLO_WORKBOOK_BOOTSTRAP_MISSING', `Bootstrap ausente para ${tab}.`);
    }
  }

  if (authors.length !== 44) fail('SUBSOLO_AUTHORS_COUNT_INVALID', `Esperado 44; recebido ${authors.length}.`);
  if (channels.length !== 9) fail('SUBSOLO_CHANNELS_COUNT_INVALID', `Esperado 9; recebido ${channels.length}.`);
  if (frames.length < 60) fail('SUBSOLO_FRAMES_COUNT_INVALID', `Esperado ao menos 60; recebido ${frames.length}.`);
  if (edition.edition_id !== 'ed_2026-07-20') fail('SUBSOLO_EDITION_FIXTURE_INVALID', 'edition_id inesperado.');

  const authorIds = new Set(authors.map((item) => item.author_id));
  const channelIds = new Set(channels.map((item) => item.channel_id));
  const frameById = new Map(frames.map((item) => [item.frame_id, item]));
  const pitchIds = new Set(pitches.map((item) => item.pauta_id));

  for (const article of articles) {
    if (!pitchIds.has(article.pauta_id)) fail('SUBSOLO_ARTICLE_PITCH_UNKNOWN', article.artigo_id);
    if (!authorIds.has(article.autor)) fail('SUBSOLO_ARTICLE_AUTHOR_UNKNOWN', article.artigo_id);
    if (!authorIds.has(article.editor)) fail('SUBSOLO_ARTICLE_EDITOR_UNKNOWN', article.artigo_id);
    if (!channelIds.has(article.canal)) fail('SUBSOLO_ARTICLE_CHANNEL_UNKNOWN', article.artigo_id);
    if (article.quadro) {
      const frame = frameById.get(article.quadro);
      if (!frame) fail('SUBSOLO_ARTICLE_FRAME_UNKNOWN', article.artigo_id);
      else if (frame.channel_id !== article.canal) fail('SUBSOLO_ARTICLE_FRAME_CHANNEL_MISMATCH', article.artigo_id);
    }
    if (article.status === 'PRONTO_PARA_PUBLICAR') {
      for (const field of ['revisao_editorial', 'revisao_factual', 'revisao_tecnica']) {
        if (!['APROVADA', 'NAO_APLICAVEL'].includes(article[field])) {
          fail('SUBSOLO_ARTICLE_REVIEW_INCOMPLETE', `${article.artigo_id}: ${field}`);
        }
      }
    }
  }

  if (!process.exitCode) {
    console.log(JSON.stringify({
      status: 'passed',
      tabs: expectedTabs.length,
      authors: authors.length,
      channels: channels.length,
      frames: frames.length,
      pitches: pitches.length,
      articles: articles.length,
      edition: edition.edition_id,
    }, null, 2));
  }
} catch (error) {
  fail('SUBSOLO_EDITORIAL_VALIDATION_ERROR', error instanceof Error ? error.message : String(error));
}
