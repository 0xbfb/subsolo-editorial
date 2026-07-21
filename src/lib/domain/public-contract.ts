export const PUBLIC_SCHEMA_VERSION = '1.0.0' as const;
export const PUBLIC_LANGUAGE = 'pt-BR' as const;
export const PUBLIC_TIMEZONE = 'America/Sao_Paulo' as const;

export const PUBLICATION_TYPES = [
  'noticia',
  'reportagem',
  'analise',
  'investigacao',
  'editorial',
  'guia',
  'documento-comentado',
  'boletim',
  'acompanhamento',
  'perfil',
  'ensaio',
  'analise-de-partida',
] as const;
export type PublicationType = (typeof PUBLICATION_TYPES)[number];

export const PUBLICATION_STATUSES = [
  'publicado',
  'em-desenvolvimento',
  'atualizado',
  'corrigido',
  'concluido',
  'inconclusivo',
  'aguardando-confirmacao',
  'arquivado',
  'retirado',
] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const EDITION_STATUSES = ['publicada', 'selada', 'corrigida'] as const;
export type EditionStatus = (typeof EDITION_STATUSES)[number];

export const SOURCE_TYPES = [
  'documento-primario',
  'base-oficial',
  'comunicado-oficial',
  'entrevista',
  'apuracao-propria',
  'pesquisa-academica',
  'documentacao-tecnica',
  'dados-de-mercado',
  'alerta-meteorologico',
  'reportagem-secundaria',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const CORRECTION_TYPES = [
  'correcao-factual',
  'esclarecimento',
  'atualizacao-material',
  'retirada',
] as const;
export type CorrectionType = (typeof CORRECTION_TYPES)[number];

export const MEDIA_TYPES = [
  'imagem',
  'audio',
  'video',
  'documento',
  'grafico',
  'mapa',
  'posicao-de-xadrez',
] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const STORY_STATUSES = ['aberta', 'monitoramento', 'concluida', 'arquivada'] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];

export const AUTHOR_ROLES = ['editor', 'jornalista', 'colunista', 'convidado'] as const;
export type AuthorRole = (typeof AUTHOR_ROLES)[number];

export const CATALOG_STATUSES = ['ativo', 'arquivado'] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export type PublicImageReference = Readonly<{
  src: string;
  alt: string;
}>;

export type PublicPublication = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  edition_id: string;
  title: string;
  slug: string;
  description: string;
  channel: string;
  section: string;
  type: PublicationType;
  status: PublicationStatus;
  authors: readonly string[];
  editor: string;
  topics: readonly string[];
  territories: readonly string[];
  story_id: string | null;
  published_at: string;
  updated_at: string | null;
  featured: boolean;
  language: typeof PUBLIC_LANGUAGE;
  image: PublicImageReference | null;
}>;

export type PublicEditionItem = Readonly<{
  id: string;
  position: number;
  featured: boolean;
}>;

export type PublicEdition = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  date: string;
  revision: number;
  status: EditionStatus;
  timezone: typeof PUBLIC_TIMEZONE;
  published_at: string;
  sealed_at: string | null;
  supersedes: string | null;
  publications: readonly PublicEditionItem[];
}>;

export type PublicSource = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  type: SourceType;
  title: string;
  publisher: string;
  url: string;
  published_at: string | null;
  accessed_at: string;
  archived_url: string | null;
  supports: readonly string[];
}>;

export type PublicCorrection = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  publication_id: string;
  type: CorrectionType;
  published_at: string;
  summary: string;
  impact: string;
  previous_revision: number;
  new_revision: number;
}>;

export type PublicRedirect = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  publication_id: string;
  from_path: string;
  to_path: string;
  status_code: 308;
  effective_at: string;
  reason: string;
}>;

export type PublicTombstone = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  publication_id: string;
  canonical_path: string;
  title: string;
  reason: string;
  impact: string;
  published_at: string;
  original_published_at: string;
  body_hidden: true;
}>;

export type MediaDerivative = Readonly<{
  path: string;
  width: number;
  height: number;
  format: 'avif' | 'webp' | 'jpeg' | 'png';
  variant?: string;
  mime_type?: string;
  bytes?: number;
  sha256?: string;
}>;

export type PublicMedia = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  type: MediaType;
  alt: string;
  caption: string | null;
  credit: string;
  license: string;
  derivatives: readonly MediaDerivative[];
}>;

export type PublicStory = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  slug: string;
  title: string;
  status: StoryStatus;
  summary: string;
  started_at: string;
  topics: readonly string[];
  actors: readonly string[];
  next_expected_event: string | null;
}>;

export type PublicAuthor = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  nickname: string;
  slug: string;
  role: AuthorRole;
  title: string;
  bio: string;
  status: CatalogStatus;
  portrait: PublicImageReference | null;
}>;

export type PublicChannel = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  name: string;
  slug: string;
  question: string;
  description: string;
  periodicity: string;
  editor_id: string;
  status: CatalogStatus;
  accent: string;
}>;

export type PublicTopic = Readonly<{
  schema_version: typeof PUBLIC_SCHEMA_VERSION;
  id: string;
  name: string;
  slug: string;
  description: string;
  status: CatalogStatus;
}>;

export type PublicContractEntity =
  | PublicPublication
  | PublicEdition
  | PublicSource
  | PublicCorrection
  | PublicRedirect
  | PublicTombstone
  | PublicMedia
  | PublicStory
  | PublicAuthor
  | PublicChannel
  | PublicTopic;

export type ContractIssue = Readonly<{
  code: string;
  path: string;
  message: string;
  action: string;
}>;

export type ContractResult<T> =
  Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; issues: readonly ContractIssue[] }>;
