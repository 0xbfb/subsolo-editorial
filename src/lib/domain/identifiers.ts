const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const PREFIXES = ['pub', 'story', 'src', 'corr', 'media', 'author', 'redirect', 'tomb'] as const;
export type EntityIdPrefix = (typeof PREFIXES)[number];

const encodeBase32 = (value: bigint, length: number): string => {
  let remaining = value;
  let output = '';
  for (let index = 0; index < length; index += 1) {
    output = CROCKFORD[Number(remaining & 31n)] + output;
    remaining >>= 5n;
  }
  if (remaining !== 0n) throw new Error('SUBSOLO_ID_OVERFLOW: valor excede o tamanho esperado.');
  return output;
};

const bytesToBigInt = (bytes: Uint8Array): bigint => {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
};

export const createUlid = (timestampMs: number, entropy: Uint8Array): string => {
  if (!Number.isSafeInteger(timestampMs) || timestampMs < 0 || timestampMs > 281_474_976_710_655) {
    throw new Error('SUBSOLO_ID_TIMESTAMP_INVALID: timestamp precisa caber em 48 bits.');
  }
  if (entropy.length !== 10) {
    throw new Error('SUBSOLO_ID_ENTROPY_INVALID: ULID exige exatamente 10 bytes de entropia.');
  }
  return `${encodeBase32(BigInt(timestampMs), 10)}${encodeBase32(bytesToBigInt(entropy), 16)}`;
};

export const createEntityId = (
  prefix: EntityIdPrefix,
  timestampMs: number,
  entropy: Uint8Array,
): string => `${prefix}_${createUlid(timestampMs, entropy)}`;

export const isUlid = (value: unknown): value is string =>
  typeof value === 'string' && ULID_PATTERN.test(value);

export const isEntityId = (value: unknown, prefix?: EntityIdPrefix): value is string => {
  if (typeof value !== 'string') return false;
  const match = /^(pub|story|src|corr|media|author|redirect|tomb)_([0-9A-HJKMNP-TV-Z]{26})$/.exec(
    value,
  );
  if (!match) return false;
  return (prefix === undefined || match[1] === prefix) && isUlid(match[2]);
};

export const isEditionId = (value: unknown): value is string =>
  typeof value === 'string' && /^ed_\d{4}-\d{2}-\d{2}$/.test(value);

export const createSlug = (value: string, maximumLength = 96): string => {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  const truncated = slug.slice(0, maximumLength).replace(/-+$/g, '');
  if (truncated.length === 0) {
    throw new Error('SUBSOLO_SLUG_EMPTY: o texto não produz um slug público válido.');
  }
  return truncated;
};

export const isSlug = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 96;

export const createCanonicalUrl = (siteUrl: string, publishedAt: string, slug: string): string => {
  if (!isSlug(slug)) throw new Error('SUBSOLO_CANONICAL_SLUG_INVALID: slug público inválido.');
  const base = new URL(siteUrl);
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error('SUBSOLO_CANONICAL_PROTOCOL_INVALID: o site precisa usar HTTP ou HTTPS.');
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(publishedAt);
  if (!match) throw new Error('SUBSOLO_CANONICAL_DATE_INVALID: published_at precisa ser ISO 8601.');
  const path = `${match[1]}/${match[2]}/${match[3]}/${slug}/`;
  return new URL(path, base.href.endsWith('/') ? base.href : `${base.href}/`).toString();
};

export const nextRevision = (current: number): number => {
  if (!Number.isSafeInteger(current) || current < 1) {
    throw new Error('SUBSOLO_REVISION_INVALID: revisão atual precisa ser inteiro positivo.');
  }
  return current + 1;
};

export const isValidRevisionStep = (previous: number, next: number): boolean =>
  Number.isSafeInteger(previous) &&
  Number.isSafeInteger(next) &&
  previous >= 1 &&
  next === previous + 1;
