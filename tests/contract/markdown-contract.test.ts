import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parsePublicationDocument } from '../../src/lib/application/parse-publication-document';

describe('documento público', () => {
  const read = (name: string) => readFileSync(`fixtures/public/${name}`, 'utf8');
  it('aceita Markdown e blocos permitidos', () =>
    expect(parsePublicationDocument(read('valid/publication.md')).ok).toBe(true));
  it('rejeita HTML perigoso', () =>
    expect(parsePublicationDocument(read('invalid/publication-unsafe-html.md')).ok).toBe(false));
  it('rejeita protocolo perigoso', () =>
    expect(parsePublicationDocument(read('invalid/publication-dangerous-url.md')).ok).toBe(false));
  it('rejeita H1 no corpo', () =>
    expect(parsePublicationDocument(read('invalid/publication-h1.md')).ok).toBe(false));
  it('rejeita campo privado desconhecido', () =>
    expect(parsePublicationDocument(read('invalid/publication-private-field.md')).ok).toBe(false));
  it('rejeita versão maior desconhecida', () =>
    expect(parsePublicationDocument(read('invalid/publication-unknown-schema.md')).ok).toBe(false));
});
