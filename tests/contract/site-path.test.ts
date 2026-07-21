import { describe, expect, it } from 'vitest';
import { normalizeBasePath, withBasePath } from '../../src/lib/presentation/site-path';

describe('site path', () => {
  it('normaliza o base path', () => {
    expect(normalizeBasePath(undefined)).toBe('/');
    expect(normalizeBasePath('/subsolo/')).toBe('/subsolo');
  });

  it('prefixa somente rotas internas absolutas', () => {
    expect(withBasePath('/arquivo/', '/subsolo')).toBe('/subsolo/arquivo/');
    expect(withBasePath('/', '/subsolo')).toBe('/subsolo/');
    expect(withBasePath('#conteudo', '/subsolo')).toBe('#conteudo');
    expect(withBasePath('https://example.org', '/subsolo')).toBe('https://example.org');
  });

  it('não duplica prefixo', () => {
    expect(withBasePath('/subsolo/arquivo/', '/subsolo')).toBe('/subsolo/arquivo/');
  });
});
