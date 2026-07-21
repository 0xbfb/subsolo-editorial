import type { EditionStatus } from './public-contract';

export const EDITION_PACKAGE_FORMAT = 'subsolo-edition-package' as const;
export type PackageRunId = `run_${string}_r${number}`;
export type PackagePublication = Readonly<{
  id: string;
  path: string;
  channel: string;
  position: number;
  featured: boolean;
}>;
export type EditionPackageManifest = Readonly<{
  schema_version: '1.0.0';
  package_format: typeof EDITION_PACKAGE_FORMAT;
  edition_id: string;
  edition_date: string;
  run_id: PackageRunId;
  revision: number;
  status: EditionStatus;
  timezone: 'America/Sao_Paulo';
  generated_at: string;
  published_at: string;
  sealed_at: string | null;
  supersedes: PackageRunId | null;
  publications: readonly PackagePublication[];
}>;
export type PublicationRun = Readonly<{
  schema_version: '1.0.0';
  run_id: PackageRunId;
  edition_id: string;
  revision: number;
  state: 'packaged';
  generated_at: string;
  source_workspace_sha256: string;
  validation: Readonly<{ status: 'passed'; issues: 0 }>;
}>;
