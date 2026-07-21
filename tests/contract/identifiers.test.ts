import { describe, expect, it } from 'vitest';
import {
  createCanonicalUrl,
  createEntityId,
  createSlug,
  createUlid,
  isEntityId,
  isValidRevisionStep,
  nextRevision,
} from '../../src/lib/domain/identifiers';

describe('identificadores públicos', () => {
  const entropy = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  it('gera ULID e ID determinísticos', () => {
    expect(createUlid(1_721_293_200_000, entropy)).toHaveLength(26);
    const id = createEntityId('pub', 1_721_293_200_000, entropy);
    expect(isEntityId(id, 'pub')).toBe(true);
    expect(createEntityId('pub', 1_721_293_200_000, entropy)).toBe(id);
  });
  it('gera slug ASCII e URL canônica', () => {
    const slug = createSlug('Aceite a nova regra ou desapareça da fila');
    expect(slug).toBe('aceite-a-nova-regra-ou-desapareca-da-fila');
    expect(createCanonicalUrl('https://subsolo.example/', '2026-07-20T08:00:00-03:00', slug)).toBe(
      `https://subsolo.example/2026/07/20/${slug}/`,
    );
  });
  it('controla revisão sequencial', () => {
    expect(nextRevision(1)).toBe(2);
    expect(isValidRevisionStep(1, 2)).toBe(true);
    expect(isValidRevisionStep(1, 3)).toBe(false);
  });
});
