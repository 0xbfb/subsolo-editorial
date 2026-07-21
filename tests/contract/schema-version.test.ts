import { describe, expect, it } from 'vitest';
import { migrateSchemaDocument, parseSemanticVersion } from '../../src/lib/domain/schema-version';

describe('versionamento de schema', () => {
  it('reconhece semver e identidade', () => {
    expect(parseSemanticVersion('1.0.0')).toEqual({ major: 1, minor: 0, patch: 0 });
    expect(migrateSchemaDocument({ schema_version: '1.0.0', id: 'x' }).ok).toBe(true);
  });
  it('rejeita major desconhecida', () =>
    expect(migrateSchemaDocument({ schema_version: '2.0.0' }).ok).toBe(false));
  it('executa migração explicitamente registrada', () => {
    const result = migrateSchemaDocument({ schema_version: '0.9.0', summary: 'x' }, '1.0.0', [
      { from: '0.9.0', to: '1.0.0', migrate: (doc) => ({ ...doc, description: doc.summary }) },
    ]);
    expect(result.ok).toBe(true);
  });
});
