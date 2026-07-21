import { describe, expect, it } from 'vitest';
import edition from '../../fixtures/public/valid/edition.json';
import authors from '../../fixtures/public/valid/authors.json';
import channel from '../../fixtures/public/valid/channel.json';
import topics from '../../fixtures/public/valid/topics.json';
import story from '../../fixtures/public/valid/story.json';
import redirect from '../../fixtures/public/valid/redirect.json';
import tombstone from '../../fixtures/public/valid/tombstone.json';
import { validatePublicAuthor, validatePublicChannel, validatePublicEdition, validatePublicRedirect, validatePublicStory, validatePublicTombstone, validatePublicTopic } from '../../src/lib/domain/public-validation';

describe('contratos públicos', () => {
  it('aceita fixtures válidas', () => {
    expect(validatePublicEdition(edition).ok).toBe(true);
    expect(authors.every((value) => validatePublicAuthor(value).ok)).toBe(true);
    expect(validatePublicChannel(channel).ok).toBe(true);
    expect(topics.every((value) => validatePublicTopic(value).ok)).toBe(true);
    expect(validatePublicStory(story).ok).toBe(true);
    expect(validatePublicRedirect(redirect).ok).toBe(true);
    expect(validatePublicTombstone(tombstone).ok).toBe(true);
  });
  it('rejeita estado operacional privado', () => {
    expect(validatePublicEdition({ ...edition, status: 'ABERTA' }).ok).toBe(false);
  });
});
