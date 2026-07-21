import { PUBLIC_SCHEMA_VERSION, type ContractIssue, type ContractResult } from './public-contract.js';

export type SemanticVersion = Readonly<{ major: number; minor: number; patch: number }>;

export const parseSemanticVersion = (value: string): SemanticVersion | null => {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
  if (!match) return null;
  return Object.freeze({ major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) });
};

export type VersionedDocument = Readonly<Record<string, unknown> & { schema_version: string }>;
export type SchemaMigration = Readonly<{
  from: string;
  to: string;
  migrate: (document: VersionedDocument) => VersionedDocument;
}>;

const issue = (code: string, message: string, action: string): ContractIssue => ({
  code,
  path: '$.schema_version',
  message,
  action,
});

export const migrateSchemaDocument = (
  input: unknown,
  targetVersion = PUBLIC_SCHEMA_VERSION,
  migrations: readonly SchemaMigration[] = [],
): ContractResult<VersionedDocument> => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, issues: [issue('SUBSOLO_SCHEMA_DOCUMENT_INVALID', 'Documento versionado precisa ser objeto.', 'Forneça um objeto JSON com schema_version.')] };
  }
  const document = input as Record<string, unknown>;
  if (typeof document.schema_version !== 'string') {
    return { ok: false, issues: [issue('SUBSOLO_SCHEMA_VERSION_MISSING', 'schema_version é obrigatório.', `Use ${targetVersion}.`)] };
  }
  const current = parseSemanticVersion(document.schema_version);
  const target = parseSemanticVersion(targetVersion);
  if (!current || !target) {
    return { ok: false, issues: [issue('SUBSOLO_SCHEMA_VERSION_INVALID', 'Versão de schema inválida.', 'Use versionamento semântico X.Y.Z.')] };
  }
  if (current.major > target.major) {
    return { ok: false, issues: [issue('SUBSOLO_SCHEMA_MAJOR_UNSUPPORTED', `Schema ${document.schema_version} é mais novo que ${targetVersion}.`, 'Atualize o importador antes de publicar.')] };
  }
  if (document.schema_version === targetVersion) {
    return { ok: true, value: Object.freeze({ ...document }) as VersionedDocument };
  }

  let migrated = Object.freeze({ ...document }) as VersionedDocument;
  const visited = new Set<string>();
  while (migrated.schema_version !== targetVersion) {
    if (visited.has(migrated.schema_version)) {
      return { ok: false, issues: [issue('SUBSOLO_SCHEMA_MIGRATION_CYCLE', 'Ciclo detectado no migrador.', 'Revise o registro de migrações.')] };
    }
    visited.add(migrated.schema_version);
    const migration = migrations.find((candidate) => candidate.from === migrated.schema_version);
    if (!migration) {
      return { ok: false, issues: [issue('SUBSOLO_SCHEMA_MIGRATION_MISSING', `Não existe migração de ${migrated.schema_version} para ${targetVersion}.`, 'Adicione uma migração explícita; não altere o documento silenciosamente.')] };
    }
    migrated = Object.freeze({ ...migration.migrate(migrated), schema_version: migration.to }) as VersionedDocument;
  }
  return { ok: true, value: migrated };
};
