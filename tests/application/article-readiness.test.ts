
import { describe, expect, it } from 'vitest';
import authors from '../../src/data/editorial/catalogs/authors.json';
import channels from '../../src/data/editorial/catalogs/channels.json';
import frames from '../../src/data/editorial/catalogs/frames.json';
import { buildEditorialCatalogIndex } from '@domain/editorial-catalog';
import { validateArticleReadiness, type ArticleReadinessInput } from '@application/validate-article-readiness';

const catalogs = buildEditorialCatalogIndex({ authors, channels, frames });

const validArticle: ArticleReadinessInput = {
  artigo_id: 'artigo-2026-07-20-transporte',
  titulo: 'A cidade terceirizou o relógio',
  slug: 'a-cidade-terceirizou-o-relogio',
  canal: 'sao-paulo-sob-o-capo',
  quadro: 'sao-paulo-sob-o-capo--falhou-de-novo',
  autor: 'redacao011-malu',
  editor: 'redacao011-trilho',
  status: 'PRONTO_PARA_PUBLICAR',
  documento: 'https://docs.google.com/document/d/fixture',
  revisao_editorial: 'APROVADA',
  revisao_factual: 'APROVADA',
  revisao_tecnica: 'APROVADA',
  imagem_capa: 'https://drive.google.com/file/d/capa',
  texto_alt: 'Plataforma ferroviária vista por uma grade.',
};

describe('prontidão do artigo', () => {
  it('aceita artigo com catálogos e revisões válidas', () => {
    expect(validateArticleReadiness(validArticle, catalogs)).toEqual([]);
  });

  it('rejeita autor, canal e quadro desconhecidos', () => {
    const errors = validateArticleReadiness({
      ...validArticle,
      autor: 'redacao011-inexistente',
      canal: 'canal-inexistente',
      quadro: 'quadro-inexistente',
    }, catalogs);
    expect(errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      'SUBSOLO_ARTICLE_AUTHOR_UNKNOWN',
      'SUBSOLO_ARTICLE_CHANNEL_UNKNOWN',
      'SUBSOLO_ARTICLE_FRAME_UNKNOWN',
    ]));
  });

  it('rejeita PRONTO_PARA_PUBLICAR sem revisões concluídas', () => {
    const errors = validateArticleReadiness({
      ...validArticle,
      revisao_factual: 'EM_REVISAO',
      revisao_tecnica: 'PENDENTE',
    }, catalogs);
    expect(errors.filter((error) => error.code === 'SUBSOLO_ARTICLE_REVIEW_INCOMPLETE')).toHaveLength(2);
  });

  it('rejeita quadro de outro canal', () => {
    const errors = validateArticleReadiness({
      ...validArticle,
      quadro: 'poder-de-plataforma--mudanca-de-regra',
    }, catalogs);
    expect(errors.map((error) => error.code)).toContain('SUBSOLO_ARTICLE_FRAME_CHANNEL_MISMATCH');
  });
});
