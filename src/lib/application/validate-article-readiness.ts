
import type { EditorialCatalogIndex } from '../domain/editorial-catalog';
import type { EditorialStatus } from '../domain/editorial-state';

export const REVIEW_STATES = [
  'PENDENTE',
  'EM_REVISAO',
  'APROVADA',
  'REPROVADA',
  'NAO_APLICAVEL',
] as const;

export type ReviewState = (typeof REVIEW_STATES)[number];

export type ArticleReadinessInput = Readonly<{
  artigo_id: string;
  titulo: string;
  slug: string;
  canal: string;
  quadro?: string | null;
  autor: string;
  editor: string;
  status: EditorialStatus;
  documento: string;
  revisao_editorial: ReviewState;
  revisao_factual: ReviewState;
  revisao_tecnica: ReviewState;
  imagem_capa?: string | null;
  texto_alt?: string | null;
}>;

export type ArticleReadinessError = Readonly<{
  code:
    | 'SUBSOLO_ARTICLE_AUTHOR_UNKNOWN'
    | 'SUBSOLO_ARTICLE_EDITOR_UNKNOWN'
    | 'SUBSOLO_ARTICLE_CHANNEL_UNKNOWN'
    | 'SUBSOLO_ARTICLE_FRAME_UNKNOWN'
    | 'SUBSOLO_ARTICLE_FRAME_CHANNEL_MISMATCH'
    | 'SUBSOLO_ARTICLE_REVIEW_INCOMPLETE'
    | 'SUBSOLO_ARTICLE_REQUIRED_FIELD_MISSING'
    | 'SUBSOLO_ARTICLE_IMAGE_ALT_MISSING';
  field: string;
  message: string;
}>;

const approved = (state: ReviewState): boolean => state === 'APROVADA' || state === 'NAO_APLICAVEL';

export const validateArticleReadiness = (
  article: ArticleReadinessInput,
  catalogs: EditorialCatalogIndex,
): readonly ArticleReadinessError[] => {
  const errors: ArticleReadinessError[] = [];

  for (const [field, value] of [
    ['artigo_id', article.artigo_id],
    ['titulo', article.titulo],
    ['slug', article.slug],
    ['documento', article.documento],
  ] as const) {
    if (value.trim().length === 0) {
      errors.push({
        code: 'SUBSOLO_ARTICLE_REQUIRED_FIELD_MISSING',
        field,
        message: `O campo ${field} é obrigatório antes de PRONTO_PARA_PUBLICAR.`,
      });
    }
  }

  if (!catalogs.authorIds.has(article.autor)) {
    errors.push({
      code: 'SUBSOLO_ARTICLE_AUTHOR_UNKNOWN',
      field: 'autor',
      message: `Autor desconhecido: ${article.autor}.`,
    });
  }

  if (!catalogs.authorIds.has(article.editor)) {
    errors.push({
      code: 'SUBSOLO_ARTICLE_EDITOR_UNKNOWN',
      field: 'editor',
      message: `Editor desconhecido: ${article.editor}.`,
    });
  }

  if (!catalogs.channelIds.has(article.canal)) {
    errors.push({
      code: 'SUBSOLO_ARTICLE_CHANNEL_UNKNOWN',
      field: 'canal',
      message: `Canal desconhecido: ${article.canal}.`,
    });
  }

  if (article.quadro) {
    if (!catalogs.frameIds.has(article.quadro)) {
      errors.push({
        code: 'SUBSOLO_ARTICLE_FRAME_UNKNOWN',
        field: 'quadro',
        message: `Quadro desconhecido: ${article.quadro}.`,
      });
    } else if (catalogs.frameChannelById.get(article.quadro) !== article.canal) {
      errors.push({
        code: 'SUBSOLO_ARTICLE_FRAME_CHANNEL_MISMATCH',
        field: 'quadro',
        message: `O quadro ${article.quadro} não pertence ao canal ${article.canal}.`,
      });
    }
  }

  for (const [field, state] of [
    ['revisao_editorial', article.revisao_editorial],
    ['revisao_factual', article.revisao_factual],
    ['revisao_tecnica', article.revisao_tecnica],
  ] as const) {
    if (!approved(state)) {
      errors.push({
        code: 'SUBSOLO_ARTICLE_REVIEW_INCOMPLETE',
        field,
        message: `${field} precisa estar APROVADA ou NAO_APLICAVEL; estado atual: ${state}.`,
      });
    }
  }

  if (article.imagem_capa && !(article.texto_alt?.trim())) {
    errors.push({
      code: 'SUBSOLO_ARTICLE_IMAGE_ALT_MISSING',
      field: 'texto_alt',
      message: 'Uma imagem de capa exige texto alternativo antes da publicação.',
    });
  }

  return errors;
};

export const canMarkArticleReady = (
  article: ArticleReadinessInput,
  catalogs: EditorialCatalogIndex,
): boolean => validateArticleReadiness(article, catalogs).length === 0;
