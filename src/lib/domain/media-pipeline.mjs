import { createHash } from 'node:crypto';
import { basename, extname, posix } from 'node:path';

export const MEDIA_PIPELINE_VERSION = '1.0.0';
export const INPUT_MIME_TYPES = Object.freeze({
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
  'image/tiff': ['.tif', '.tiff'],
});
export const OUTPUT_FORMATS = Object.freeze(['avif', 'webp', 'jpeg']);
export const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
export const MAX_SOURCE_DIMENSION = 12_000;
export const MIN_PORTRAIT_DIMENSION = 2_048;

export class MediaFailure extends Error {
  constructor(code, message, action, details = {}) {
    super(message);
    this.name = 'MediaFailure';
    this.code = code;
    this.action = action;
    this.details = details;
  }
  toJSON() {
    return { code: this.code, message: this.message, action: this.action, details: this.details };
  }
}
const fail = (code, message, action, details = {}) => {
  throw new MediaFailure(code, message, action, details);
};
const nonEmpty = (value, name) => {
  if (typeof value !== 'string' || value.trim() === '')
    fail('SUBSOLO_MEDIA_FIELD_REQUIRED', `Campo obrigatório vazio: ${name}.`, `Preencha ${name}.`);
  return value.trim();
};
const safeSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const isSha = (value) => /^[a-f0-9]{64}$/.test(value);
const publicPath = (value) => /^\/media\/[a-z0-9/_-]+\.(?:avif|webp|jpe?g|png)$/.test(value);

export const detectMimeFromSignature = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png';
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'image/webp';
  if (
    buffer.subarray(4, 12).toString('ascii').includes('ftypavif') ||
    buffer.subarray(4, 12).toString('ascii').includes('ftypavis')
  )
    return 'image/avif';
  if (
    buffer.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
    buffer.subarray(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))
  )
    return 'image/tiff';
  return null;
};

export const validateMediaManifest = (manifest) => {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    fail(
      'SUBSOLO_MEDIA_MANIFEST_INVALID',
      'Manifesto de mídia inválido.',
      'Forneça um objeto JSON válido.',
    );
  if (manifest.schema_version !== '1.0.0')
    fail(
      'SUBSOLO_MEDIA_SCHEMA_UNSUPPORTED',
      'Versão do manifesto não suportada.',
      'Use schema_version 1.0.0.',
    );
  if (!['portrait', 'article', 'documentary'].includes(manifest.kind))
    fail(
      'SUBSOLO_MEDIA_KIND_INVALID',
      'Tipo de ativo desconhecido.',
      'Use portrait, article ou documentary.',
    );
  nonEmpty(manifest.id, 'id');
  if (!/^media_[0-9A-HJKMNP-TV-Z]{26}$/.test(manifest.id))
    fail('SUBSOLO_MEDIA_ID_INVALID', 'ID de mídia inválido.', 'Use media_<ULID>.');
  nonEmpty(manifest.slug, 'slug');
  if (!safeSlug(manifest.slug))
    fail(
      'SUBSOLO_MEDIA_SLUG_INVALID',
      'Slug inválido.',
      'Use letras minúsculas, números e hífens.',
    );
  nonEmpty(manifest.source_path, 'source_path');
  nonEmpty(manifest.declared_mime, 'declared_mime');
  if (!INPUT_MIME_TYPES[manifest.declared_mime])
    fail(
      'SUBSOLO_MEDIA_MIME_UNSUPPORTED',
      'MIME de origem não suportado.',
      'Use JPEG, PNG, WebP, AVIF ou TIFF.',
    );
  nonEmpty(manifest.alt, 'alt');
  if (manifest.alt.length > 320)
    fail(
      'SUBSOLO_MEDIA_ALT_TOO_LONG',
      'Texto alternativo excessivo.',
      'Use até 320 caracteres objetivos.',
    );
  nonEmpty(manifest.credit, 'credit');
  nonEmpty(manifest.license, 'license');
  if (manifest.approved !== true)
    fail(
      'SUBSOLO_MEDIA_NOT_APPROVED',
      'O ativo não foi aprovado para publicação.',
      'Conclua aprovação editorial e de direitos.',
    );
  if (manifest.kind === 'portrait') {
    nonEmpty(manifest.author_slug, 'author_slug');
    nonEmpty(manifest.visual_guide_reference, 'visual_guide_reference');
    if (
      !manifest.focus ||
      typeof manifest.focus.x !== 'number' ||
      typeof manifest.focus.y !== 'number' ||
      manifest.focus.x < 0 ||
      manifest.focus.x > 1 ||
      manifest.focus.y < 0 ||
      manifest.focus.y > 1
    )
      fail(
        'SUBSOLO_MEDIA_FOCUS_INVALID',
        'Foco de retrato inválido.',
        'Informe focus.x e focus.y entre 0 e 1.',
      );
  }
  return Object.freeze({ ...manifest });
};

export const validateMediaInspection = ({ manifest, inspection, signatureMime }) => {
  if (signatureMime !== manifest.declared_mime || inspection.mime !== manifest.declared_mime) {
    fail(
      'SUBSOLO_MEDIA_MIME_MISMATCH',
      'O MIME declarado não corresponde ao conteúdo real.',
      'Corrija o manifesto ou substitua o arquivo.',
      { declared: manifest.declared_mime, signature: signatureMime, inspected: inspection.mime },
    );
  }
  if (inspection.bytes > MAX_SOURCE_BYTES)
    fail(
      'SUBSOLO_MEDIA_SOURCE_TOO_LARGE',
      'O original excede 50 MiB.',
      'Arquive o original no Drive e forneça uma cópia editorial controlada.',
      { bytes: inspection.bytes },
    );
  if (inspection.width > MAX_SOURCE_DIMENSION || inspection.height > MAX_SOURCE_DIMENSION)
    fail(
      'SUBSOLO_MEDIA_DIMENSION_TOO_LARGE',
      'A dimensão do original excede o limite operacional.',
      'Reduza a cópia de trabalho antes do processamento.',
      { width: inspection.width, height: inspection.height },
    );
  if (inspection.width < 1 || inspection.height < 1)
    fail(
      'SUBSOLO_MEDIA_DIMENSION_INVALID',
      'Dimensões inválidas.',
      'Substitua o arquivo corrompido.',
    );
  if (
    manifest.kind === 'portrait' &&
    (inspection.width < MIN_PORTRAIT_DIMENSION || inspection.height < MIN_PORTRAIT_DIMENSION)
  )
    fail(
      'SUBSOLO_MEDIA_PORTRAIT_TOO_SMALL',
      'O master do retrato deve possuir pelo menos 2048 × 2048 px.',
      'Forneça o master aprovado em alta resolução.',
      { width: inspection.width, height: inspection.height },
    );
  return Object.freeze({ ...inspection });
};

const portraitPresets = Object.freeze([
  { variant: 'profile', width: 1024, height: 1024, fit: 'cover' },
  { variant: 'card', width: 480, height: 480, fit: 'cover' },
  { variant: 'circle-safe', width: 512, height: 512, fit: 'cover' },
  { variant: 'social', width: 1200, height: 630, fit: 'cover' },
]);
const articlePresets = Object.freeze([
  { variant: 'hero', width: 1600, height: 900, fit: 'cover' },
  { variant: 'article', width: 960, height: 540, fit: 'cover' },
  { variant: 'thumbnail', width: 480, height: 270, fit: 'cover' },
  { variant: 'social', width: 1200, height: 630, fit: 'cover' },
]);
export const presetsFor = (kind) => (kind === 'portrait' ? portraitPresets : articlePresets);
export const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
export const contentAddress = ({ sourceSha256, manifest }) =>
  sha256(
    Buffer.from(
      JSON.stringify({
        pipeline: MEDIA_PIPELINE_VERSION,
        sourceSha256,
        id: manifest.id,
        slug: manifest.slug,
        kind: manifest.kind,
        focus: manifest.focus ?? null,
        alt: manifest.alt,
        credit: manifest.credit,
        license: manifest.license,
      }),
    ),
  ).slice(0, 16);
export const extensionFor = (format) => (format === 'jpeg' ? 'jpg' : format);
export const mimeForFormat = (format) => (format === 'jpeg' ? 'image/jpeg' : `image/${format}`);
export const createDerivativePlan = ({ manifest, sourceSha256, destinationRoot }) => {
  const address = contentAddress({ sourceSha256, manifest });
  const focus = manifest.focus ?? { x: 0.5, y: 0.5 };
  const root = posix.join(
    '/media',
    manifest.kind === 'portrait' ? 'portraits' : 'editorial',
    manifest.slug,
  );
  return Object.freeze(
    presetsFor(manifest.kind).flatMap((preset) =>
      OUTPUT_FORMATS.map((format) => {
        const filename = `${manifest.slug}-${address}-${preset.variant}.${extensionFor(format)}`;
        return Object.freeze({
          ...preset,
          format,
          mime_type: mimeForFormat(format),
          focus,
          public_path: posix.join(root, filename),
          output_path: posix.join(
            destinationRoot.replaceAll('\\', '/'),
            manifest.kind === 'portrait' ? 'portraits' : 'editorial',
            manifest.slug,
            filename,
          ),
        });
      }),
    ),
  );
};

export const createPublicMediaRecord = ({ manifest, derivatives }) =>
  Object.freeze({
    schema_version: '1.0.0',
    id: manifest.id,
    type: 'imagem',
    alt: manifest.alt,
    caption: manifest.caption ?? null,
    credit: manifest.credit,
    license: manifest.license,
    derivatives: Object.freeze(
      derivatives.map((item) =>
        Object.freeze({
          path: item.public_path,
          width: item.width,
          height: item.height,
          format: item.format,
          variant: item.variant,
          mime_type: item.mime_type,
          bytes: item.bytes,
          sha256: item.sha256,
        }),
      ),
    ),
  });

export const validatePublicMediaRecord = (record) => {
  if (!record || record.derivatives?.length < 1)
    fail(
      'SUBSOLO_MEDIA_DERIVATIVE_MISSING',
      'Nenhum derivado público foi produzido.',
      'Execute o processamento antes de publicar.',
    );
  const variants = new Map();
  for (const item of record.derivatives) {
    if (!publicPath(item.path))
      fail(
        'SUBSOLO_MEDIA_PUBLIC_PATH_INVALID',
        'Caminho público de derivado inválido.',
        'Use /media/... com extensão permitida.',
        { path: item.path },
      );
    if (!OUTPUT_FORMATS.includes(item.format))
      fail(
        'SUBSOLO_MEDIA_OUTPUT_FORMAT_INVALID',
        'Formato derivado não permitido.',
        'Gere AVIF, WebP e JPEG.',
      );
    if (
      !Number.isInteger(item.width) ||
      !Number.isInteger(item.height) ||
      item.width < 1 ||
      item.height < 1
    )
      fail(
        'SUBSOLO_MEDIA_DERIVATIVE_DIMENSION_INVALID',
        'Dimensão declarada do derivado inválida.',
        'Regere o ativo.',
      );
    if (!Number.isInteger(item.bytes) || item.bytes < 1 || !isSha(item.sha256))
      fail(
        'SUBSOLO_MEDIA_DERIVATIVE_INTEGRITY_INVALID',
        'Integridade do derivado não foi registrada.',
        'Regere o ativo e checksums.',
      );
    if (!variants.has(item.variant)) variants.set(item.variant, new Set());
    variants.get(item.variant).add(item.format);
  }
  for (const preset of presetsFor(
    record.derivatives.some((x) => x.variant === 'profile') ? 'portrait' : 'article',
  )) {
    const formats = variants.get(preset.variant) ?? new Set();
    for (const format of OUTPUT_FORMATS)
      if (!formats.has(format))
        fail(
          'SUBSOLO_MEDIA_DERIVATIVE_MISSING',
          `Derivado ausente: ${preset.variant}/${format}.`,
          'Regere o conjunto completo de formatos.',
        );
  }
  return record;
};

export const safeSourceBasename = (sourcePath) =>
  basename(sourcePath).replace(/[^a-zA-Z0-9._-]/g, '_');
export const sourceExtensionAllowed = (sourcePath, declaredMime) =>
  (INPUT_MIME_TYPES[declaredMime] ?? []).includes(extname(sourcePath).toLowerCase());
