import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import edition from '../../fixtures/public/valid/edition.json';
import authors from '../../fixtures/public/valid/authors.json';
import channel from '../../fixtures/public/valid/channel.json';
import topics from '../../fixtures/public/valid/topics.json';
import story from '../../fixtures/public/valid/story.json';
import { parsePublicationDocument } from '../../src/lib/application/parse-publication-document';
import { validatePublicReferences } from '../../src/lib/domain/referential-validation';

const parsed = parsePublicationDocument(readFileSync('fixtures/public/valid/publication.md', 'utf8'));
if (!parsed.ok) throw new Error('fixture pública inválida');

describe('integridade referencial pública', () => {
  const catalog = { authors, channels: [channel], topics, stories: [story], publications: [parsed.value.publication], editions: [edition] };
  it('resolve referências válidas', () => expect(validatePublicReferences(catalog)).toEqual([]));
  it('detecta autor ausente', () => expect(validatePublicReferences({ ...catalog, authors: [] }).some((issue) => issue.code === 'SUBSOLO_PUBLICATION_AUTHOR_UNKNOWN')).toBe(true));
  it('detecta slug duplicado', () => expect(validatePublicReferences({ ...catalog, publications: [parsed.value.publication, parsed.value.publication] }).some((issue) => issue.code === 'SUBSOLO_REFERENCE_DUPLICATE')).toBe(true));
});
