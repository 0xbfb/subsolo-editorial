import { describe, expect, it } from 'vitest';
import fixture from '../../src/data/fixtures/minimal-edition.json';
import { loadEditionFixture } from '@application/load-edition-fixture';

 describe('fixture editorial mínima', () => {
  it('carrega o contrato bootstrap', () => {
    expect(loadEditionFixture(fixture).id).toBe('ed_2026-07-20');
  });

  it('rejeita dados incompletos com erro acionável', () => {
    expect(() => loadEditionFixture({ id: 'inválido' })).toThrow('SUBSOLO_FIXTURE_INVALID');
  });
});
