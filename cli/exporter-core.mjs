import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BLOCKS = new Set(['fact','declaration','unknown','why-it-matters','next-step','document','action-recommended','correction']);
const TYPES = new Set(['noticia','reportagem','analise','investigacao','editorial','guia','documento-comentado','boletim','acompanhamento','perfil','ensaio','analise-de-partida']);
const STATUSES = new Set(['publicado','em-desenvolvimento','atualizado','corrigido','concluido','inconclusivo','aguardando-confirmacao','arquivado','retirado']);
const SOURCE_TYPES = new Set(['documento-primario','base-oficial','comunicado-oficial','entrevista','apuracao-propria','pesquisa-academica','documentacao-tecnica','dados-de-mercado','alerta-meteorologico','reportagem-secundaria']);
const CORRECTION_TYPES = new Set(['correcao-factual','esclarecimento','atualizacao-material','retirada']);
const MEDIA_TYPES = new Set(['imagem','audio','video','documento','grafico','mapa','posicao-de-xadrez']);
const MEDIA_FORMATS = new Set(['avif','webp','jpeg','png']);
const ENTITY_ID_PATTERNS = { pub:/^pub_[0-9A-HJKMNP-TV-Z]{26}$/, corr:/^corr_[0-9A-HJKMNP-TV-Z]{26}$/, media:/^media_[0-9A-HJKMNP-TV-Z]{26}$/, story:/^story_[0-9A-HJKMNP-TV-Z]{26}$/ };
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const PRIVATE_HOSTS = new Set(['docs.google.com','drive.google.com','sheets.google.com','localhost','127.0.0.1','0.0.0.0']);
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export class ExportFailure extends Error {
  constructor(code, message, action, details = {}) { super(message); this.name = 'ExportFailure'; this.code = code; this.action = action; this.details = details; }
  toJSON() { return { code: this.code, message: this.message, action: this.action, details: this.details }; }
}

const sortValue = (value) => Array.isArray(value) ? value.map(sortValue) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])])) : value;
const stableStringify = (value) => `${JSON.stringify(sortValue(value), null, 2)}\n`;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const quote = (value) => JSON.stringify(value);
const scalar = (value) => value === null ? 'null' : typeof value === 'string' ? quote(value) : String(value);

const yamlLines = (value, indent = 0) => {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) return value.flatMap((item) => typeof item === 'object' && item !== null ? [`${pad}-`, ...yamlLines(item, indent + 2)] : [`${pad}- ${scalar(item)}`]);
  return Object.entries(value).flatMap(([key, item]) => {
    if (Array.isArray(item)) return item.length === 0 ? [`${pad}${key}: []`] : [`${pad}${key}:`, ...yamlLines(item, indent + 2)];
    if (item && typeof item === 'object') return [`${pad}${key}:`, ...yamlLines(item, indent + 2)];
    return [`${pad}${key}: ${scalar(item)}`];
  });
};

const encodeBase32 = (bytes, length = 26) => {
  let value = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
  let output = '';
  for (let index = 0; index < length; index += 1) { output = CROCKFORD[Number(value & 31n)] + output; value >>= 5n; }
  return output;
};
export const deterministicEntityId = (prefix, seed) => `${prefix}_${encodeBase32(createHash('sha256').update(seed).digest().subarray(0, 17), 26)}`;

const isPrivateIpv4 = (hostname) => {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [a,b] = parts;
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
};

const isPublicUrl = (value, { allowRelative = false } = {}) => {
  if (typeof value !== 'string' || value.trim() === '') return false;
  if (allowRelative && /^(?:\/|\.\/|\.\.\/|#)/.test(value)) return true;
  try {
    const url = new URL(value);
    if (!['http:','https:','mailto:'].includes(url.protocol)) return false;
    if (url.protocol === 'mailto:') return true;
    const host = url.hostname.toLowerCase();
    if (PRIVATE_HOSTS.has(host) || isPrivateIpv4(host)) return false;
    return ['token','access_token','key','signature','sig','auth'].every((key) => !url.searchParams.has(key));
  } catch { return false; }
};

const containsInternalMarker = (text) => /(?:\bNOTA INTERNA\b|\bNÃO PUBLICAR\b|\bNAO PUBLICAR\b|\bFONTE CONFIDENCIAL\b|(?:^|\s)\[(?:PENDENTE|CONFIRMAR|TODO)\](?:\s|$)|(?:^|\n)\s*(?:PENDENTE|CONFIRMAR|TODO)\s*:)/i.test(text);
const safeText = (text, location) => {
  if (typeof text !== 'string') throw new ExportFailure('SUBSOLO_EXPORT_TEXT_INVALID', `Texto inválido em ${location}.`, 'Corrija a estrutura do documento.', { location });
  if (containsInternalMarker(text)) throw new ExportFailure('SUBSOLO_EXPORT_INTERNAL_MARKER', `Marcador interno detectado em ${location}.`, 'Resolva ou remova a pendência antes da exportação.', { location });
  if (/<\/?(?:script|iframe|object|embed|style|link|meta)\b/i.test(text) || /\b(?:javascript|data|file|vbscript):/i.test(text)) throw new ExportFailure('SUBSOLO_EXPORT_UNSAFE_CONTENT', `Conteúdo inseguro detectado em ${location}.`, 'Use somente Markdown seguro e URLs públicas.', { location });
  for (const match of text.matchAll(/(?:https?:\/\/|mailto:)[^\s)]+/g)) if (!isPublicUrl(match[0])) throw new ExportFailure('SUBSOLO_EXPORT_PRIVATE_URL', `Link privado ou inseguro detectado em ${location}.`, 'Substitua por uma URL pública ou remova o link.', { location, url: match[0] });
  return text.replace(/\r\n?/g, '\n').trimEnd();
};

const renderNode = (node, location) => {
  if (!node || typeof node !== 'object') throw new ExportFailure('SUBSOLO_EXPORT_NODE_INVALID', `Nó inválido em ${location}.`, 'Forneça um nó estrutural conhecido.');
  switch (node.type) {
    case 'paragraph': return safeText(node.text, location);
    case 'heading': {
      const level = Number(node.level);
      if (![2,3,4].includes(level)) throw new ExportFailure('SUBSOLO_EXPORT_HEADING_LEVEL', `Nível de título inválido em ${location}.`, 'Use níveis 2, 3 ou 4.');
      return `${'#'.repeat(level)} ${safeText(node.text, location)}`;
    }
    case 'quote': return safeText(node.text, location).split('\n').map((line) => `> ${line}`).join('\n');
    case 'list': {
      if (!Array.isArray(node.items) || node.items.length === 0) throw new ExportFailure('SUBSOLO_EXPORT_LIST_EMPTY', `Lista vazia em ${location}.`, 'Adicione itens ou remova a lista.');
      return node.items.map((item, index) => `${node.ordered ? `${index + 1}.` : '-'} ${safeText(item, `${location}.items[${index}]`)}`).join('\n');
    }
    case 'table': {
      if (!Array.isArray(node.headers) || node.headers.length === 0 || !Array.isArray(node.rows)) throw new ExportFailure('SUBSOLO_EXPORT_TABLE_INVALID', `Tabela inválida em ${location}.`, 'Informe cabeçalhos e linhas.');
      const headers = node.headers.map((item, index) => safeText(item, `${location}.headers[${index}]`).replaceAll('|','\\|'));
      const rows = node.rows.map((row, rowIndex) => {
        if (!Array.isArray(row) || row.length !== headers.length) throw new ExportFailure('SUBSOLO_EXPORT_TABLE_WIDTH', `Linha de tabela incompatível em ${location}.`, 'Use a mesma quantidade de células do cabeçalho.', { rowIndex });
        return `| ${row.map((item, cellIndex) => safeText(item, `${location}.rows[${rowIndex}][${cellIndex}]`).replaceAll('|','\\|')).join(' | ')} |`;
      });
      return [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...rows].join('\n');
    }
    case 'editorial-block': {
      if (!BLOCKS.has(node.kind)) throw new ExportFailure('SUBSOLO_EXPORT_BLOCK_UNKNOWN', `Bloco desconhecido em ${location}: ${node.kind}.`, `Use: ${[...BLOCKS].join(', ')}.`);
      if (!Array.isArray(node.children) || node.children.length === 0) throw new ExportFailure('SUBSOLO_EXPORT_BLOCK_EMPTY', `Bloco vazio em ${location}.`, 'Adicione conteúdo ao bloco.');
      return `:::${node.kind}\n${node.children.map((child, index) => renderNode(child, `${location}.children[${index}]`)).join('\n\n')}\n:::`;
    }
    default: throw new ExportFailure('SUBSOLO_EXPORT_NODE_UNKNOWN', `Tipo de nó desconhecido em ${location}: ${node.type}.`, 'Converta o elemento para um tipo permitido.');
  }
};

export const renderDocumentBody = (document) => {
  if (document.unresolvedSuggestions > 0) throw new ExportFailure('SUBSOLO_EXPORT_SUGGESTIONS_PENDING', 'Existem sugestões não resolvidas.', 'Resolva todas as sugestões antes da exportação.', { count: document.unresolvedSuggestions });
  if (Array.isArray(document.comments) && document.comments.length > 0) throw new ExportFailure('SUBSOLO_EXPORT_COMMENTS_PENDING', 'Existem comentários internos no documento.', 'Resolva ou remova todos os comentários antes da exportação.', { count: document.comments.length });
  if (!Array.isArray(document.nodes) || document.nodes.length === 0) throw new ExportFailure('SUBSOLO_EXPORT_DOCUMENT_EMPTY', 'Documento sem conteúdo público.', 'Adicione conteúdo antes da exportação.');
  const body = `${document.nodes.map((node, index) => renderNode(node, `nodes[${index}]`)).join('\n\n').trim()}\n`;
  safeText(body, 'body');
  return body;
};

const required = (row, key) => { const value = row[key]; if (value === undefined || value === null || value === '') throw new ExportFailure('SUBSOLO_EXPORT_METADATA_MISSING', `Metadado obrigatório ausente: ${key}.`, `Preencha ${key} no Sheets.`, { key }); return value; };
const assertApproved = (row, key) => { if (row[key] !== 'APROVADA') throw new ExportFailure('SUBSOLO_EXPORT_REVIEW_PENDING', `Revisão não aprovada: ${key}.`, 'Conclua as revisões editorial, factual e técnica.', { key, value: row[key] }); };
const safePublicString = (value, location) => safeText(required({ value }, 'value'), location).trim();
const safeDateTime = (value, location, { nullable = false } = {}) => {
  if (nullable && (value === null || value === undefined)) return null;
  const text = safePublicString(value, location);
  if (!ISO_DATETIME_PATTERN.test(text) || Number.isNaN(Date.parse(text))) throw new ExportFailure('SUBSOLO_EXPORT_DATETIME_INVALID', `Data e hora inválidas em ${location}.`, 'Use ISO 8601 com fuso explícito.', { location, value });
  return text;
};
const safeSlug = (value, location) => {
  const text = safePublicString(value, location);
  if (!SLUG_PATTERN.test(text) || text.length > 96) throw new ExportFailure('SUBSOLO_EXPORT_SLUG_INVALID', `Slug inválido em ${location}.`, 'Use ASCII minúsculo, números e hífens.', { location, value });
  return text;
};
const safeStringArray = (value, location, { slug = false, allowEmpty = false } = {}) => {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) throw new ExportFailure('SUBSOLO_EXPORT_ARRAY_INVALID', `Lista inválida em ${location}.`, allowEmpty ? 'Informe uma lista pública.' : 'Informe ao menos um valor público.');
  const normalized = value.map((item, index) => slug ? safeSlug(item, `${location}[${index}]`) : safePublicString(item, `${location}[${index}]`));
  if (new Set(normalized).size !== normalized.length) throw new ExportFailure('SUBSOLO_EXPORT_ARRAY_DUPLICATE', `Valores duplicados em ${location}.`, 'Remova duplicidades antes da exportação.', { location });
  return normalized;
};
const safeEntityId = (value, prefix, location) => {
  const text = safePublicString(value, location);
  if (!ENTITY_ID_PATTERNS[prefix]?.test(text)) throw new ExportFailure('SUBSOLO_EXPORT_ENTITY_ID_INVALID', `ID inválido em ${location}.`, `Use ${prefix}_<ULID>.`, { location, value });
  return text;
};
const safePositiveInteger = (value, location) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new ExportFailure('SUBSOLO_EXPORT_INTEGER_INVALID', `Inteiro positivo inválido em ${location}.`, 'Use um número inteiro maior ou igual a 1.', { location, value });
  return number;
};
const safeBoolean = (value, location) => {
  if (typeof value !== 'boolean') throw new ExportFailure('SUBSOLO_EXPORT_BOOLEAN_INVALID', `Booleano inválido em ${location}.`, 'Use true ou false.', { location, value });
  return value;
};
const safeAssetLocation = (value, location) => {
  const text = safePublicString(value, location);
  if (text.startsWith('/')) {
    if (text.startsWith('//') || text.includes('..')) throw new ExportFailure('SUBSOLO_EXPORT_ASSET_PATH_INVALID', `Caminho público inválido em ${location}.`, 'Use um caminho absoluto dentro do site, sem travessia.', { location, value });
    return text;
  }
  if (!isPublicUrl(text)) throw new ExportFailure('SUBSOLO_EXPORT_ASSET_PATH_INVALID', `URL pública inválida em ${location}.`, 'Use HTTPS público ou caminho absoluto do site.', { location, value });
  return text;
};
const publicImage = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new ExportFailure('SUBSOLO_EXPORT_IMAGE_INVALID', 'imagem_publica precisa ser objeto ou null.', 'Informe src e alt públicos.');
  return { src:safeAssetLocation(value.src,'imagem_publica.src'), alt:safePublicString(value.alt,'imagem_publica.alt') };
};
const safeArrayInput = (value, location) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ExportFailure('SUBSOLO_EXPORT_ARRAY_INVALID', `Lista inválida em ${location}.`, 'Forneça uma lista estruturada.', { location });
  return value;
};

const publicSource = (source, articleId, index) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new ExportFailure('SUBSOLO_EXPORT_SOURCE_INVALID', `Fonte inválida em fontes[${index}].`, 'Forneça um objeto de fonte estruturado.');
  if (!SOURCE_TYPES.has(source.type)) throw new ExportFailure('SUBSOLO_EXPORT_SOURCE_TYPE_INVALID', `Tipo de fonte inválido em fontes[${index}].`, 'Use um tipo público permitido.');
  if (!isPublicUrl(source.url)) throw new ExportFailure('SUBSOLO_EXPORT_PRIVATE_SOURCE', 'Fonte aponta para link privado ou inseguro.', 'Publique ou substitua a URL da fonte.', { index, url: source.url });
  if (source.archived_url !== null && source.archived_url !== undefined && !isPublicUrl(source.archived_url)) throw new ExportFailure('SUBSOLO_EXPORT_PRIVATE_SOURCE_ARCHIVE', 'URL arquivada privada ou insegura.', 'Use URL pública ou null.', { index });
  return {
    schema_version:'1.0.0',
    id: deterministicEntityId('src', `${articleId}:source:${index}:${source.url}`),
    type: source.type,
    title: safePublicString(source.title, `fontes[${index}].title`),
    publisher: safePublicString(source.publisher, `fontes[${index}].publisher`),
    url: source.url,
    published_at: safeDateTime(source.published_at, `fontes[${index}].published_at`, { nullable:true }),
    accessed_at: safeDateTime(source.accessed_at, `fontes[${index}].accessed_at`),
    archived_url: source.archived_url ?? null,
    supports: safeStringArray(source.supports ?? [], `fontes[${index}].supports`, { allowEmpty:true }),
  };
};

const publicCorrection = (item, articleId, index) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new ExportFailure('SUBSOLO_EXPORT_CORRECTION_INVALID', `Correção inválida em correcoes[${index}].`, 'Forneça um objeto de correção estruturado.');
  if (!CORRECTION_TYPES.has(item.type)) throw new ExportFailure('SUBSOLO_EXPORT_CORRECTION_TYPE_INVALID', `Tipo de correção inválido em correcoes[${index}].`, 'Use um tipo público permitido.');
  const publicationId = deterministicEntityId('pub', articleId);
  const previousRevision = safePositiveInteger(required(item,'previous_revision'), `correcoes[${index}].previous_revision`);
  const newRevision = safePositiveInteger(required(item,'new_revision'), `correcoes[${index}].new_revision`);
  if (newRevision !== previousRevision + 1) throw new ExportFailure('SUBSOLO_EXPORT_CORRECTION_REVISION_INVALID', `Sequência de revisão inválida em correcoes[${index}].`, 'Use new_revision exatamente uma unidade acima de previous_revision.', { previousRevision, newRevision });
  if (item.publication_id !== undefined && safeEntityId(item.publication_id,'pub',`correcoes[${index}].publication_id`) !== publicationId) throw new ExportFailure('SUBSOLO_EXPORT_CORRECTION_PUBLICATION_CONFLICT', `Correção aponta para outra publicação em correcoes[${index}].`, 'Sincronize publication_id com o artigo exportado.');
  return {
    schema_version:'1.0.0', id:item.id === undefined ? deterministicEntityId('corr', `${articleId}:correction:${index}`) : safeEntityId(item.id,'corr',`correcoes[${index}].id`), publication_id:publicationId, type:item.type,
    published_at:safeDateTime(item.published_at,`correcoes[${index}].published_at`), summary:safePublicString(item.summary,`correcoes[${index}].summary`), impact:safePublicString(item.impact,`correcoes[${index}].impact`), previous_revision:previousRevision, new_revision:newRevision,
  };
};

const publicMedia = (item, articleId, index) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new ExportFailure('SUBSOLO_EXPORT_MEDIA_INVALID', `Mídia inválida em midia[${index}].`, 'Forneça um objeto de mídia estruturado.');
  if (!MEDIA_TYPES.has(item.type)) throw new ExportFailure('SUBSOLO_EXPORT_MEDIA_TYPE_INVALID', `Tipo de mídia inválido em midia[${index}].`, 'Use um tipo público permitido.');
  const inputDerivatives = safeArrayInput(item.derivatives, `midia[${index}].derivatives`);
  if (inputDerivatives.length === 0) throw new ExportFailure('SUBSOLO_EXPORT_MEDIA_DERIVATIVES_EMPTY', `Mídia sem derivados públicos em midia[${index}].`, 'Gere ao menos um derivado antes da exportação.');
  const derivatives = inputDerivatives.map((entry, derivativeIndex) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new ExportFailure('SUBSOLO_EXPORT_MEDIA_DERIVATIVE_INVALID', `Derivado inválido em midia[${index}].derivatives[${derivativeIndex}].`, 'Forneça path, width, height e format.');
    const format = safePublicString(entry.format,`midia[${index}].derivatives[${derivativeIndex}].format`);
    if (!MEDIA_FORMATS.has(format)) throw new ExportFailure('SUBSOLO_EXPORT_MEDIA_FORMAT_INVALID', `Formato inválido em midia[${index}].derivatives[${derivativeIndex}].`, 'Use avif, webp, jpeg ou png.', { format });
    return { path:safeAssetLocation(entry.path,`midia[${index}].derivatives[${derivativeIndex}].path`), width:safePositiveInteger(entry.width,`midia[${index}].derivatives[${derivativeIndex}].width`), height:safePositiveInteger(entry.height,`midia[${index}].derivatives[${derivativeIndex}].height`), format };
  });
  return {
    schema_version:'1.0.0', id:item.id === undefined ? deterministicEntityId('media', `${articleId}:media:${index}`) : safeEntityId(item.id,'media',`midia[${index}].id`), type:item.type, alt:safePublicString(item.alt,`midia[${index}].alt`), caption:item.caption ? safePublicString(item.caption,`midia[${index}].caption`) : null, credit:safePublicString(item.credit,`midia[${index}].credit`), license:safePublicString(item.license,`midia[${index}].license`), derivatives,
  };
};

export const buildExport = ({ row, document }) => {
  assertApproved(row, 'revisao_editorial'); assertApproved(row, 'revisao_factual'); assertApproved(row, 'revisao_tecnica');
  const articleId = safePublicString(required(row, 'artigo_id'), 'artigo_id');
  if (required(row, 'document_id') !== document.documentId) throw new ExportFailure('SUBSOLO_EXPORT_DOCUMENT_CONFLICT', 'O documento não corresponde à linha editorial.', 'Corrija o document_id no Sheets.', { expected: row.document_id, actual: document.documentId });
  if (required(row, 'titulo') !== document.title) throw new ExportFailure('SUBSOLO_EXPORT_TITLE_CONFLICT', 'Título divergente entre Docs e Sheets.', 'Escolha a versão final e sincronize os dois sistemas.', { sheet: row.titulo, document: document.title });
  if (!TYPES.has(row.tipo)) throw new ExportFailure('SUBSOLO_EXPORT_TYPE_INVALID', `Tipo público inválido: ${row.tipo}.`, 'Use um tipo público permitido.');
  if (!STATUSES.has(row.estado_publico)) throw new ExportFailure('SUBSOLO_EXPORT_STATUS_INVALID', `Estado público inválido: ${row.estado_publico}.`, 'Use um estado público permitido.');
  const editionId = safePublicString(required(row,'edition_id'),'edition_id');
  if (!/^ed_\d{4}-\d{2}-\d{2}$/.test(editionId)) throw new ExportFailure('SUBSOLO_EXPORT_EDITION_INVALID', 'edition_id público inválido.', 'Use ed_YYYY-MM-DD.');
  const storyId = row.story_id ?? null;
  if (storyId !== null) safeEntityId(storyId,'story','story_id');
  const metadata = {
    schema_version:'1.0.0', id:deterministicEntityId('pub',String(articleId)), edition_id:editionId, title:safePublicString(row.titulo,'titulo'), slug:safeSlug(row.slug,'slug'), description:safePublicString(required(row,'linha_fina'),'linha_fina'), channel:safeSlug(row.canal,'canal'), section:safeSlug(row.secao,'secao'), type:row.tipo, status:row.estado_publico,
    authors:safeStringArray(required(row,'autores_publicos'),'autores_publicos',{slug:true}), editor:safeSlug(required(row,'editor_publico'),'editor_publico'), topics:safeStringArray(required(row,'temas_publicos'),'temas_publicos',{slug:true}), territories:safeStringArray(row.territorios_publicos ?? [],'territorios_publicos',{slug:true,allowEmpty:true}), story_id:storyId, published_at:safeDateTime(row.publicado_em,'publicado_em'), updated_at:safeDateTime(row.atualizado_em,'atualizado_em',{nullable:true}), featured:safeBoolean(row.destaque,'destaque'), language:'pt-BR', image:publicImage(row.imagem_publica),
  };
  const body = renderDocumentBody(document);
  const publicationMarkdown = `---\n${yamlLines(metadata).join('\n')}\n---\n\n${body}`;
  const sources = safeArrayInput(row.fontes, 'fontes').map((source, index) => publicSource(source, String(articleId), index));
  const corrections = safeArrayInput(row.correcoes, 'correcoes').map((item, index) => publicCorrection(item, String(articleId), index));
  const media = safeArrayInput(row.midia, 'midia').map((item, index) => publicMedia(item, String(articleId), index));
  const sheetSnapshot = stableStringify(row);
  const documentSnapshot = stableStringify({ title:document.title, nodes:document.nodes, unresolvedSuggestions:document.unresolvedSuggestions, comments:document.comments });
  const provenance = {
    schema_version:'1.0.0', exporter_version:'0.5.1-dev', article_id:articleId, publication_id:metadata.id,
    exported_at:safeDateTime(row.exported_at ?? metadata.published_at,'exported_at'),
    source_snapshots:{ sheet_sha256:sha256(sheetSnapshot), document_sha256:sha256(documentSnapshot) },
    public_files:['publication.md','sources.json','corrections.json','media.json'],
    source_counts:{ sources:sources.length, corrections:corrections.length, media:media.length },
    sanitization:{ comments_exported:0, suggestions_pending:0, private_links:0, internal_markers:0, private_fields_exported:0 },
  };
  const files = new Map([
    ['publication.md', publicationMarkdown],
    ['sources.json', stableStringify(sources)],
    ['corrections.json', stableStringify(corrections)],
    ['media.json', stableStringify(media)],
    ['provenance.public.json', stableStringify(provenance)],
  ]);
  return { articleId, publicationId:metadata.id, metadata, body, files, provenance };
};

export const loadFixtureInput = async (sheetPath, documentPath) => ({ row:JSON.parse(await readFile(sheetPath,'utf8')), document:JSON.parse(await readFile(documentPath,'utf8')) });
export const planExportFromInput = async ({ row, document, destination }) => {
  const result = buildExport({ row, document });
  return { mode:'dry-run', article_id:result.articleId, publication_id:result.publicationId, destination:path.resolve(destination), files:[...result.files].map(([name, content]) => ({ name, bytes:Buffer.byteLength(content), sha256:sha256(content) })), provenance:result.provenance };
};
export const planExport = async ({ sheetPath, documentPath, destination }) => {
  const input = await loadFixtureInput(sheetPath, documentPath);
  return planExportFromInput({ ...input, destination });
};

const pathExists = async (target) => { try { await access(target); return true; } catch (error) { if (error && typeof error === 'object' && error.code === 'ENOENT') return false; throw error; } };

export const applyExportFromInput = async ({ row, document, destination, overwrite = false }) => {
  const result = buildExport({ row, document }); const target = path.resolve(destination); const parent = path.dirname(target); const suffix = `${process.pid}-${Date.now()}`; const temporary = path.join(parent, `.${path.basename(target)}.tmp-${suffix}`); const backup = path.join(parent, `.${path.basename(target)}.bak-${suffix}`);
  const targetExists = await pathExists(target);
  if (targetExists && !overwrite) throw new ExportFailure('SUBSOLO_EXPORT_DESTINATION_EXISTS', `Destino já existe: ${target}.`, 'Use outro diretório ou --overwrite explicitamente.');
  await mkdir(parent,{recursive:true}); await rm(temporary,{recursive:true,force:true}); await rm(backup,{recursive:true,force:true}); await mkdir(temporary,{recursive:true});
  let backupCreated = false;
  try {
    const written=[];
    for (const [name, content] of result.files) { const filePath=path.join(temporary,name); await writeFile(filePath,content,'utf8'); written.push(path.join(target,name)); }
    if (targetExists) { await rename(target,backup); backupCreated = true; }
    try { await rename(temporary,target); }
    catch (error) { if (backupCreated && !await pathExists(target)) await rename(backup,target); throw error; }
    if (backupCreated) await rm(backup,{recursive:true,force:true});
    return { mode:'apply', article_id:result.articleId, publication_id:result.publicationId, destination:target, written };
  } catch (error) {
    await rm(temporary,{recursive:true,force:true});
    if (backupCreated && !await pathExists(target) && await pathExists(backup)) await rename(backup,target);
    throw error;
  }
};

export const applyExport = async ({ sheetPath, documentPath, destination, overwrite = false }) => {
  const input = await loadFixtureInput(sheetPath, documentPath);
  return applyExportFromInput({ ...input, destination, overwrite });
};
