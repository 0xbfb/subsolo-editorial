import { createHash } from 'node:crypto';

const directives: Readonly<Record<string, readonly string[]>> = {
  'default-src': ["'self'"],
  'base-uri': ["'self'"],
  'connect-src': ["'self'"],
  'font-src': ["'self'"],
  'form-action': ["'self'"],
  'img-src': ["'self'"],
  'manifest-src': ["'self'"],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'script-src': ["'self'", "'wasm-unsafe-eval'"],
  'style-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
};

export const sha256CspHash = (source: string): string =>
  `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;

export const buildContentSecurityPolicy = (inlineJsonLd?: string): string => {
  const entries = Object.entries(directives).map(([name, values]) => {
    const resolved =
      name === 'script-src' && inlineJsonLd ? [...values, sha256CspHash(inlineJsonLd)] : values;
    return `${name} ${resolved.join(' ')}`;
  });
  return `${entries.join('; ')}; upgrade-insecure-requests`;
};
