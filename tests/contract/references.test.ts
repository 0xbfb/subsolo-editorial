import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsePublicationDocument } from '../../src/lib/application/parse-publication-document';
import type { ContractResult } from '../../src/lib/domain/public-contract';
import {
  validatePublicAuthor,
  validatePublicChannel,
  validatePublicEdition,
  validatePublicStory,
  validatePublicTopic,
} from '../../src/lib/domain/public-validation';
import {
  validatePublicReferences,
  type PublicReferenceCatalog,
} from '../../src/lib/domain/referential-validation';
import authors from '../../fixtures/public/valid/authors.json';
import channel from '../../fixtures/public/valid/channel.json';
import edition from '../../fixtures/public/valid/edition.json';
import story from '../../fixtures/public/valid/story.json';
import topics from '../../fixtures/public/valid/topics.json';

const expectValid = <T>(result: ContractResult<T>): T => {
  if (result.ok) return result.value;
  throw new Error(result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '));
};

const parsed = parsePublicationDocument(
  readFileSync('fixtures/public/valid/publication.md', 'utf8'),
);
if (!parsed.ok) throw new Error('fixture pública inválida');

const catalog: PublicReferenceCatalog = {
  authors: authors.map((author) => expectValid(validatePublicAuthor(author))),
  channels: [expectValid(validatePublicChannel(channel))],
  topics: topics.map((topic) => expectValid(validatePublicTopic(topic))),
  stories: [expectValid(validatePublicStory(story))],
  publications: [parsed.value.publication],
  editions: [expectValid(validatePublicEdition(edition))],
};

describe('integridade referencial pública', () => {
  it('resolve referências válidas', () => expect(validatePublicReferences(catalog)).toEqual([]));
  it('detecta autor ausente', () =>
    expect(
      validatePublicReferences({ ...catalog, authors: [] }).some(
        (issue) => issue.code === 'SUBSOLO_PUBLICATION_AUTHOR_UNKNOWN',
      ),
    ).toBe(true));
  it('detecta slug duplicado', () =>
    expect(
      validatePublicReferences({
        ...catalog,
        publications: [parsed.value.publication, parsed.value.publication],
      }).some((issue) => issue.code === 'SUBSOLO_REFERENCE_DUPLICATE'),
    ).toBe(true));
});
