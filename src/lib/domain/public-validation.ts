import {
  AUTHOR_ROLES,
  CATALOG_STATUSES,
  CORRECTION_TYPES,
  EDITION_STATUSES,
  MEDIA_TYPES,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  PUBLIC_LANGUAGE,
  PUBLIC_SCHEMA_VERSION,
  PUBLIC_TIMEZONE,
  SOURCE_TYPES,
  STORY_STATUSES,
  type ContractIssue,
  type ContractResult,
  type PublicAuthor,
  type PublicChannel,
  type PublicCorrection,
  type PublicEdition,
  type PublicMedia,
  type PublicRedirect,
  type PublicTombstone,
  type PublicPublication,
  type PublicSource,
  type PublicStory,
  type PublicTopic,
} from './public-contract.js';
import { isEditionId, isEntityId, isSlug, isValidRevisionStep } from './identifiers.js';

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, min = 1): value is string => typeof value === 'string' && value.trim().length >= min;
const stringArray = (value: unknown, min = 0): value is readonly string[] => Array.isArray(value) && value.length >= min && value.every((item) => text(item));
const isoDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const isoDateTime = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value));
const publicationPath = (value: unknown): value is string => typeof value === 'string' && /^\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(value);
const publicUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/')) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};
const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T => typeof value === 'string' && allowed.some((item) => item === value);
const issue = (code: string, path: string, message: string, action: string): ContractIssue => ({ code, path, message, action });
const noUnknown = (issues: Issues, value: Record<string, unknown>, allowed: readonly string[], path = '$'): void => {
  const accepted = new Set(allowed);
  for (const key of Object.keys(value)) {
    issues.add(accepted.has(key), 'SUBSOLO_CONTRACT_FIELD_UNKNOWN', `${path}.${key}`, `Campo público desconhecido: ${key}.`, 'Remova campos privados ou adicione uma nova versão de schema explicitamente.');
  }
};

class Issues {
  readonly values: ContractIssue[] = [];
  add(condition: boolean, code: string, path: string, message: string, action: string): void {
    if (!condition) this.values.push(issue(code, path, message, action));
  }
  result<T>(value: T): ContractResult<T> { return this.values.length === 0 ? { ok: true, value } : { ok: false, issues: this.values }; }
}

const schema = (issues: Issues, value: Record<string, unknown>): void => {
  issues.add(value.schema_version === PUBLIC_SCHEMA_VERSION, 'SUBSOLO_SCHEMA_VERSION_UNSUPPORTED', '$.schema_version', `Schema esperado: ${PUBLIC_SCHEMA_VERSION}.`, 'Migre o documento antes da publicação.');
};

const image = (issues: Issues, value: unknown, path: string): void => {
  if (value === null) return;
  issues.add(object(value), 'SUBSOLO_IMAGE_INVALID', path, 'Imagem precisa ser objeto ou null.', 'Use src e alt.');
  if (!object(value)) return;
  noUnknown(issues, value, ['src', 'alt'], path);
  issues.add(publicUrl(value.src), 'SUBSOLO_IMAGE_SRC_INVALID', `${path}.src`, 'Caminho ou URL de imagem inválido.', 'Use HTTPS ou caminho público absoluto.');
  issues.add(text(value.alt), 'SUBSOLO_IMAGE_ALT_MISSING', `${path}.alt`, 'Texto alternativo é obrigatório.', 'Descreva objetivamente a imagem.');
};

export const validatePublicPublication = (input: unknown): ContractResult<PublicPublication> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_PUBLICATION_INVALID', '$', 'Publicação precisa ser objeto.', 'Forneça front matter estruturado.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','edition_id','title','slug','description','channel','section','type','status','authors','editor','topics','territories','story_id','published_at','updated_at','featured','language','image']);
  issues.add(isEntityId(input.id, 'pub'), 'SUBSOLO_PUBLICATION_ID_INVALID', '$.id', 'ID de publicação inválido.', 'Use pub_<ULID>.');
  issues.add(isEditionId(input.edition_id), 'SUBSOLO_EDITION_ID_INVALID', '$.edition_id', 'ID de edição inválido.', 'Use ed_YYYY-MM-DD.');
  issues.add(text(input.title), 'SUBSOLO_PUBLICATION_TITLE_MISSING', '$.title', 'Título obrigatório.', 'Informe o título.');
  issues.add(isSlug(input.slug), 'SUBSOLO_PUBLICATION_SLUG_INVALID', '$.slug', 'Slug inválido.', 'Use ASCII minúsculo e hífens.');
  issues.add(text(input.description), 'SUBSOLO_PUBLICATION_DESCRIPTION_MISSING', '$.description', 'Descrição obrigatória.', 'Informe descrição curta.');
  issues.add(isSlug(input.channel), 'SUBSOLO_PUBLICATION_CHANNEL_INVALID', '$.channel', 'Canal inválido.', 'Use o ID público do canal.');
  issues.add(isSlug(input.section), 'SUBSOLO_PUBLICATION_SECTION_INVALID', '$.section', 'Seção inválida.', 'Use slug de seção.');
  issues.add(oneOf(input.type, PUBLICATION_TYPES), 'SUBSOLO_PUBLICATION_TYPE_INVALID', '$.type', 'Tipo de publicação inválido.', 'Use um tipo público conhecido.');
  issues.add(oneOf(input.status, PUBLICATION_STATUSES), 'SUBSOLO_PUBLICATION_STATUS_INVALID', '$.status', 'Estado público inválido.', 'Não use o status interno do Sheets.');
  issues.add(stringArray(input.authors, 1), 'SUBSOLO_PUBLICATION_AUTHORS_INVALID', '$.authors', 'Ao menos um autor é obrigatório.', 'Informe IDs públicos de autores.');
  issues.add(typeof input.editor === 'string' && isSlug(input.editor), 'SUBSOLO_PUBLICATION_EDITOR_INVALID', '$.editor', 'Editor inválido.', 'Use ID público do editor.');
  issues.add(stringArray(input.topics, 1) && (input.topics as readonly string[]).every(isSlug), 'SUBSOLO_PUBLICATION_TOPICS_INVALID', '$.topics', 'Ao menos um tema válido é obrigatório.', 'Use IDs públicos de temas.');
  issues.add(stringArray(input.territories), 'SUBSOLO_PUBLICATION_TERRITORIES_INVALID', '$.territories', 'Territórios precisam ser lista.', 'Use lista de slugs.');
  issues.add(input.story_id === null || isEntityId(input.story_id, 'story'), 'SUBSOLO_PUBLICATION_STORY_INVALID', '$.story_id', 'História inválida.', 'Use story_<ULID> ou null.');
  issues.add(isoDateTime(input.published_at), 'SUBSOLO_PUBLICATION_DATE_INVALID', '$.published_at', 'Data de publicação inválida.', 'Use ISO 8601 com fuso.');
  issues.add(input.updated_at === null || isoDateTime(input.updated_at), 'SUBSOLO_PUBLICATION_UPDATED_INVALID', '$.updated_at', 'Data de atualização inválida.', 'Use ISO 8601 com fuso ou null.');
  issues.add(typeof input.featured === 'boolean', 'SUBSOLO_PUBLICATION_FEATURED_INVALID', '$.featured', 'featured precisa ser booleano.', 'Use true ou false.');
  issues.add(input.language === PUBLIC_LANGUAGE, 'SUBSOLO_PUBLICATION_LANGUAGE_INVALID', '$.language', `Idioma esperado: ${PUBLIC_LANGUAGE}.`, 'Use pt-BR na versão inicial.');
  image(issues, input.image, '$.image');
  return issues.result(input as unknown as PublicPublication);
};

export const validatePublicEdition = (input: unknown): ContractResult<PublicEdition> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_EDITION_INVALID', '$', 'Edição precisa ser objeto.', 'Forneça manifest estruturado.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','date','revision','status','timezone','published_at','sealed_at','supersedes','publications']);
  issues.add(isEditionId(input.id), 'SUBSOLO_EDITION_ID_INVALID', '$.id', 'ID inválido.', 'Use ed_YYYY-MM-DD.');
  issues.add(isoDate(input.date), 'SUBSOLO_EDITION_DATE_INVALID', '$.date', 'Data inválida.', 'Use YYYY-MM-DD.');
  issues.add(Number.isSafeInteger(input.revision) && Number(input.revision) >= 1, 'SUBSOLO_EDITION_REVISION_INVALID', '$.revision', 'Revisão inválida.', 'Use inteiro positivo.');
  issues.add(oneOf(input.status, EDITION_STATUSES), 'SUBSOLO_EDITION_STATUS_INVALID', '$.status', 'Estado público de edição inválido.', 'Use publicada, selada ou corrigida.');
  issues.add(input.timezone === PUBLIC_TIMEZONE, 'SUBSOLO_EDITION_TIMEZONE_INVALID', '$.timezone', `Fuso esperado: ${PUBLIC_TIMEZONE}.`, 'Normalize para America/Sao_Paulo.');
  issues.add(isoDateTime(input.published_at), 'SUBSOLO_EDITION_PUBLISHED_INVALID', '$.published_at', 'Data de publicação inválida.', 'Use ISO 8601 com fuso.');
  issues.add(input.sealed_at === null || isoDateTime(input.sealed_at), 'SUBSOLO_EDITION_SEALED_INVALID', '$.sealed_at', 'Data de fechamento inválida.', 'Use ISO 8601 ou null.');
  issues.add(input.supersedes === null || text(input.supersedes), 'SUBSOLO_EDITION_SUPERSEDES_INVALID', '$.supersedes', 'Referência supersedes inválida.', 'Use run_id ou null.');
  const itemsValid = Array.isArray(input.publications) && input.publications.length > 0 && input.publications.every((entry) => object(entry) && Object.keys(entry).every((key) => ['id', 'position', 'featured'].includes(key)) && isEntityId(entry.id, 'pub') && Number.isSafeInteger(entry.position) && Number(entry.position) >= 0 && typeof entry.featured === 'boolean');
  issues.add(itemsValid, 'SUBSOLO_EDITION_PUBLICATIONS_INVALID', '$.publications', 'Lista de publicações inválida.', 'Informe ID, posição e destaque.');
  return issues.result(input as unknown as PublicEdition);
};

export const validatePublicSource = (input: unknown): ContractResult<PublicSource> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_SOURCE_INVALID', '$', 'Fonte precisa ser objeto.', 'Forneça uma fonte pública estruturada.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','type','title','publisher','url','published_at','accessed_at','archived_url','supports']);
  issues.add(isEntityId(input.id, 'src'), 'SUBSOLO_SOURCE_ID_INVALID', '$.id', 'ID de fonte inválido.', 'Use src_<ULID>.');
  issues.add(oneOf(input.type, SOURCE_TYPES), 'SUBSOLO_SOURCE_TYPE_INVALID', '$.type', 'Tipo de fonte inválido.', 'Use um tipo permitido.');
  issues.add(text(input.title), 'SUBSOLO_SOURCE_TITLE_MISSING', '$.title', 'Título obrigatório.', 'Identifique a fonte.');
  issues.add(text(input.publisher), 'SUBSOLO_SOURCE_PUBLISHER_MISSING', '$.publisher', 'Publicador obrigatório.', 'Identifique órgão, pessoa ou veículo.');
  issues.add(publicUrl(input.url), 'SUBSOLO_SOURCE_URL_INVALID', '$.url', 'URL inválida.', 'Use HTTP ou HTTPS público.');
  issues.add(input.published_at === null || isoDateTime(input.published_at), 'SUBSOLO_SOURCE_PUBLISHED_INVALID', '$.published_at', 'Data da fonte inválida.', 'Use ISO 8601 ou null.');
  issues.add(isoDateTime(input.accessed_at), 'SUBSOLO_SOURCE_ACCESSED_INVALID', '$.accessed_at', 'Data de acesso inválida.', 'Use ISO 8601 com fuso.');
  issues.add(input.archived_url === null || publicUrl(input.archived_url), 'SUBSOLO_SOURCE_ARCHIVE_INVALID', '$.archived_url', 'URL arquivada inválida.', 'Use URL pública ou null.');
  issues.add(stringArray(input.supports), 'SUBSOLO_SOURCE_SUPPORTS_INVALID', '$.supports', 'supports precisa ser lista.', 'Use IDs de afirmações públicas.');
  return issues.result(input as unknown as PublicSource);
};

export const validatePublicCorrection = (input: unknown): ContractResult<PublicCorrection> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_CORRECTION_INVALID', '$', 'Correção precisa ser objeto.', 'Forneça registro estruturado.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','publication_id','type','published_at','summary','impact','previous_revision','new_revision']);
  issues.add(isEntityId(input.id, 'corr'), 'SUBSOLO_CORRECTION_ID_INVALID', '$.id', 'ID inválido.', 'Use corr_<ULID>.');
  issues.add(isEntityId(input.publication_id, 'pub'), 'SUBSOLO_CORRECTION_PUBLICATION_INVALID', '$.publication_id', 'Publicação inválida.', 'Use pub_<ULID>.');
  issues.add(oneOf(input.type, CORRECTION_TYPES), 'SUBSOLO_CORRECTION_TYPE_INVALID', '$.type', 'Tipo inválido.', 'Use taxonomia pública.');
  issues.add(isoDateTime(input.published_at), 'SUBSOLO_CORRECTION_DATE_INVALID', '$.published_at', 'Data inválida.', 'Use ISO 8601 com fuso.');
  issues.add(text(input.summary), 'SUBSOLO_CORRECTION_SUMMARY_MISSING', '$.summary', 'Resumo obrigatório.', 'Explique o que mudou.');
  issues.add(text(input.impact), 'SUBSOLO_CORRECTION_IMPACT_MISSING', '$.impact', 'Impacto obrigatório.', 'Explique o efeito da alteração.');
  issues.add(typeof input.previous_revision === 'number' && typeof input.new_revision === 'number' && isValidRevisionStep(input.previous_revision, input.new_revision), 'SUBSOLO_CORRECTION_REVISION_INVALID', '$.new_revision', 'Cadeia de revisão inválida.', 'A nova revisão deve ser exatamente a anterior + 1.');
  return issues.result(input as unknown as PublicCorrection);
};

export const validatePublicRedirect = (input: unknown): ContractResult<PublicRedirect> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_REDIRECT_INVALID', '$', 'Redirect precisa ser objeto.', 'Forneça redirect público estruturado.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','publication_id','from_path','to_path','status_code','effective_at','reason']);
  issues.add(isEntityId(input.id, 'redirect'), 'SUBSOLO_REDIRECT_ID_INVALID', '$.id', 'ID de redirect inválido.', 'Use redirect_<ULID>.');
  issues.add(isEntityId(input.publication_id, 'pub'), 'SUBSOLO_REDIRECT_PUBLICATION_INVALID', '$.publication_id', 'Publicação inválida.', 'Use pub_<ULID>.');
  issues.add(publicationPath(input.from_path), 'SUBSOLO_REDIRECT_FROM_INVALID', '$.from_path', 'Origem inválida.', 'Use /YYYY/MM/DD/slug/.');
  issues.add(publicationPath(input.to_path), 'SUBSOLO_REDIRECT_TO_INVALID', '$.to_path', 'Destino inválido.', 'Use /YYYY/MM/DD/slug/.');
  issues.add(input.from_path !== input.to_path, 'SUBSOLO_REDIRECT_SELF', '$.to_path', 'Redirect não pode apontar para si próprio.', 'Use um destino diferente.');
  issues.add(input.status_code === 308, 'SUBSOLO_REDIRECT_STATUS_INVALID', '$.status_code', 'Status precisa ser 308.', 'Use redirect permanente 308.');
  issues.add(isoDateTime(input.effective_at), 'SUBSOLO_REDIRECT_DATE_INVALID', '$.effective_at', 'Data inválida.', 'Use ISO 8601 com fuso.');
  issues.add(text(input.reason, 8), 'SUBSOLO_REDIRECT_REASON_MISSING', '$.reason', 'Motivo obrigatório.', 'Explique a mudança de URL.');
  return issues.result(input as unknown as PublicRedirect);
};

export const validatePublicTombstone = (input: unknown): ContractResult<PublicTombstone> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_TOMBSTONE_INVALID', '$', 'Tombstone precisa ser objeto.', 'Forneça página-túmulo estruturada.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','publication_id','canonical_path','title','reason','impact','published_at','original_published_at','body_hidden']);
  issues.add(isEntityId(input.id, 'tomb'), 'SUBSOLO_TOMBSTONE_ID_INVALID', '$.id', 'ID de tombstone inválido.', 'Use tomb_<ULID>.');
  issues.add(isEntityId(input.publication_id, 'pub'), 'SUBSOLO_TOMBSTONE_PUBLICATION_INVALID', '$.publication_id', 'Publicação inválida.', 'Use pub_<ULID>.');
  issues.add(publicationPath(input.canonical_path), 'SUBSOLO_TOMBSTONE_PATH_INVALID', '$.canonical_path', 'Canonical inválido.', 'Preserve /YYYY/MM/DD/slug/.');
  issues.add(text(input.title), 'SUBSOLO_TOMBSTONE_TITLE_MISSING', '$.title', 'Título obrigatório.', 'Preserve o título público.');
  issues.add(text(input.reason, 8), 'SUBSOLO_TOMBSTONE_REASON_MISSING', '$.reason', 'Motivo obrigatório.', 'Explique a retirada.');
  issues.add(text(input.impact, 8), 'SUBSOLO_TOMBSTONE_IMPACT_MISSING', '$.impact', 'Impacto obrigatório.', 'Explique o efeito editorial da retirada.');
  issues.add(isoDateTime(input.published_at), 'SUBSOLO_TOMBSTONE_DATE_INVALID', '$.published_at', 'Data da retirada inválida.', 'Use ISO 8601 com fuso.');
  issues.add(isoDateTime(input.original_published_at), 'SUBSOLO_TOMBSTONE_ORIGINAL_DATE_INVALID', '$.original_published_at', 'Data original inválida.', 'Preserve a data original.');
  issues.add(input.body_hidden === true, 'SUBSOLO_TOMBSTONE_BODY_INVALID', '$.body_hidden', 'Tombstone exige body_hidden=true.', 'Oculte o corpo e preserve a nota pública.');
  return issues.result(input as unknown as PublicTombstone);
};

export const validatePublicMedia = (input: unknown): ContractResult<PublicMedia> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_MEDIA_INVALID', '$', 'Mídia precisa ser objeto.', 'Forneça manifesto estruturado.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','type','alt','caption','credit','license','derivatives']);
  issues.add(isEntityId(input.id, 'media'), 'SUBSOLO_MEDIA_ID_INVALID', '$.id', 'ID inválido.', 'Use media_<ULID>.');
  issues.add(oneOf(input.type, MEDIA_TYPES), 'SUBSOLO_MEDIA_TYPE_INVALID', '$.type', 'Tipo inválido.', 'Use taxonomia de mídia.');
  issues.add(text(input.alt), 'SUBSOLO_MEDIA_ALT_MISSING', '$.alt', 'Texto alternativo obrigatório.', 'Descreva o conteúdo informativo.');
  issues.add(input.caption === null || text(input.caption), 'SUBSOLO_MEDIA_CAPTION_INVALID', '$.caption', 'Legenda inválida.', 'Use texto ou null.');
  issues.add(text(input.credit), 'SUBSOLO_MEDIA_CREDIT_MISSING', '$.credit', 'Crédito obrigatório.', 'Informe autoria ou origem.');
  issues.add(text(input.license), 'SUBSOLO_MEDIA_LICENSE_MISSING', '$.license', 'Licença obrigatória.', 'Informe licença ou autorização.');
  const derivativesValid = Array.isArray(input.derivatives) && input.derivatives.length > 0 && input.derivatives.every((entry) => object(entry) && Object.keys(entry).every((key) => ['path', 'width', 'height', 'format'].includes(key)) && publicUrl(entry.path) && Number.isSafeInteger(entry.width) && Number(entry.width) > 0 && Number.isSafeInteger(entry.height) && Number(entry.height) > 0 && oneOf(entry.format, ['avif', 'webp', 'jpeg', 'png'] as const));
  issues.add(derivativesValid, 'SUBSOLO_MEDIA_DERIVATIVES_INVALID', '$.derivatives', 'Derivados inválidos.', 'Informe caminho, dimensões e formato.');
  return issues.result(input as unknown as PublicMedia);
};

export const validatePublicStory = (input: unknown): ContractResult<PublicStory> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_STORY_INVALID', '$', 'História precisa ser objeto.', 'Forneça história estruturada.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','slug','title','status','summary','started_at','topics','actors','next_expected_event']);
  issues.add(isEntityId(input.id, 'story'), 'SUBSOLO_STORY_ID_INVALID', '$.id', 'ID inválido.', 'Use story_<ULID>.');
  issues.add(isSlug(input.slug), 'SUBSOLO_STORY_SLUG_INVALID', '$.slug', 'Slug inválido.', 'Use ASCII e hífens.');
  issues.add(text(input.title), 'SUBSOLO_STORY_TITLE_MISSING', '$.title', 'Título obrigatório.', 'Informe título.');
  issues.add(oneOf(input.status, STORY_STATUSES), 'SUBSOLO_STORY_STATUS_INVALID', '$.status', 'Estado inválido.', 'Use estado público de história.');
  issues.add(text(input.summary), 'SUBSOLO_STORY_SUMMARY_MISSING', '$.summary', 'Resumo obrigatório.', 'Descreva o estado atual.');
  issues.add(isoDate(input.started_at), 'SUBSOLO_STORY_STARTED_INVALID', '$.started_at', 'Data inicial inválida.', 'Use YYYY-MM-DD.');
  issues.add(stringArray(input.topics, 1) && (input.topics as readonly string[]).every(isSlug), 'SUBSOLO_STORY_TOPICS_INVALID', '$.topics', 'Temas inválidos.', 'Use IDs de temas.');
  issues.add(stringArray(input.actors), 'SUBSOLO_STORY_ACTORS_INVALID', '$.actors', 'Atores precisam ser lista.', 'Use nomes públicos.');
  issues.add(input.next_expected_event === null || isoDate(input.next_expected_event), 'SUBSOLO_STORY_NEXT_EVENT_INVALID', '$.next_expected_event', 'Próximo evento inválido.', 'Use YYYY-MM-DD ou null.');
  return issues.result(input as unknown as PublicStory);
};

export const validatePublicAuthor = (input: unknown): ContractResult<PublicAuthor> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_AUTHOR_INVALID', '$', 'Autor precisa ser objeto.', 'Forneça perfil público.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','nickname','slug','role','title','bio','status','portrait']);
  issues.add(isEntityId(input.id, 'author'), 'SUBSOLO_AUTHOR_ID_INVALID', '$.id', 'ID inválido.', 'Use author_<ULID>.');
  issues.add(text(input.nickname), 'SUBSOLO_AUTHOR_NICKNAME_MISSING', '$.nickname', 'Apelido obrigatório.', 'Informe assinatura pública.');
  issues.add(isSlug(input.slug), 'SUBSOLO_AUTHOR_SLUG_INVALID', '$.slug', 'Slug inválido.', 'Use ASCII e hífens.');
  issues.add(oneOf(input.role, AUTHOR_ROLES), 'SUBSOLO_AUTHOR_ROLE_INVALID', '$.role', 'Função inválida.', 'Use função pública permitida.');
  issues.add(text(input.title), 'SUBSOLO_AUTHOR_TITLE_MISSING', '$.title', 'Cargo obrigatório.', 'Informe título editorial.');
  issues.add(text(input.bio), 'SUBSOLO_AUTHOR_BIO_MISSING', '$.bio', 'Biografia obrigatória.', 'Informe biografia pública.');
  issues.add(oneOf(input.status, CATALOG_STATUSES), 'SUBSOLO_AUTHOR_STATUS_INVALID', '$.status', 'Estado inválido.', 'Use ativo ou arquivado.');
  image(issues, input.portrait, '$.portrait');
  return issues.result(input as unknown as PublicAuthor);
};

export const validatePublicChannel = (input: unknown): ContractResult<PublicChannel> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_CHANNEL_INVALID', '$', 'Canal precisa ser objeto.', 'Forneça canal estruturado.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','name','slug','question','description','periodicity','editor_id','status','accent']);
  issues.add(isSlug(input.id), 'SUBSOLO_CHANNEL_ID_INVALID', '$.id', 'ID inválido.', 'Use slug estável.');
  issues.add(text(input.name), 'SUBSOLO_CHANNEL_NAME_MISSING', '$.name', 'Nome obrigatório.', 'Informe nome.');
  issues.add(isSlug(input.slug), 'SUBSOLO_CHANNEL_SLUG_INVALID', '$.slug', 'Slug inválido.', 'Use ASCII e hífens.');
  issues.add(text(input.question), 'SUBSOLO_CHANNEL_QUESTION_MISSING', '$.question', 'Pergunta editorial obrigatória.', 'Informe a função distinta do canal.');
  issues.add(text(input.description), 'SUBSOLO_CHANNEL_DESCRIPTION_MISSING', '$.description', 'Descrição obrigatória.', 'Descreva o canal.');
  issues.add(text(input.periodicity), 'SUBSOLO_CHANNEL_PERIODICITY_MISSING', '$.periodicity', 'Periodicidade obrigatória.', 'Informe periodicidade.');
  issues.add(typeof input.editor_id === 'string' && isSlug(input.editor_id), 'SUBSOLO_CHANNEL_EDITOR_INVALID', '$.editor_id', 'Editor inválido.', 'Use slug público de autor.');
  issues.add(oneOf(input.status, CATALOG_STATUSES), 'SUBSOLO_CHANNEL_STATUS_INVALID', '$.status', 'Estado inválido.', 'Use ativo ou arquivado.');
  issues.add(typeof input.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(input.accent), 'SUBSOLO_CHANNEL_ACCENT_INVALID', '$.accent', 'Cor funcional inválida.', 'Use hexadecimal #RRGGBB.');
  return issues.result(input as unknown as PublicChannel);
};

export const validatePublicTopic = (input: unknown): ContractResult<PublicTopic> => {
  const issues = new Issues();
  issues.add(object(input), 'SUBSOLO_TOPIC_INVALID', '$', 'Tema precisa ser objeto.', 'Forneça tema estruturado.');
  if (!object(input)) return { ok: false, issues: issues.values };
  schema(issues, input);
  noUnknown(issues, input, ['schema_version','id','name','slug','description','status']);
  issues.add(isSlug(input.id), 'SUBSOLO_TOPIC_ID_INVALID', '$.id', 'ID inválido.', 'Use slug estável.');
  issues.add(text(input.name), 'SUBSOLO_TOPIC_NAME_MISSING', '$.name', 'Nome obrigatório.', 'Informe nome.');
  issues.add(isSlug(input.slug), 'SUBSOLO_TOPIC_SLUG_INVALID', '$.slug', 'Slug inválido.', 'Use ASCII e hífens.');
  issues.add(text(input.description), 'SUBSOLO_TOPIC_DESCRIPTION_MISSING', '$.description', 'Descrição obrigatória.', 'Descreva o tema.');
  issues.add(oneOf(input.status, CATALOG_STATUSES), 'SUBSOLO_TOPIC_STATUS_INVALID', '$.status', 'Estado inválido.', 'Use ativo ou arquivado.');
  return issues.result(input as unknown as PublicTopic);
};
