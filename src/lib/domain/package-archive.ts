import type { EditionPackageManifest } from './edition-package';

export const GOOGLE_DRIVE_ARCHIVE_PROVIDER = 'google-drive' as const;
export type ArchiveMode = 'dry-run' | 'apply';
export type ArchiveDisposition = 'planned' | 'uploaded' | 'already-archived';

export type ArchivePathSegment = Readonly<{
  name: string;
  status: 'existing' | 'create';
  folderId: string | null;
}>;

export type PackageArchiveReceipt = Readonly<{
  schema_version: '1.0.0';
  provider: typeof GOOGLE_DRIVE_ARCHIVE_PROVIDER;
  disposition: Exclude<ArchiveDisposition, 'planned'>;
  file_id: string;
  file_name: string;
  package_sha256: string;
  package_bytes: number;
  drive_path: string;
  edition_id: string;
  run_id: string;
  revision: number;
  mime_type: 'application/zip';
  md5_checksum: string;
  uploaded_at: string;
  verified_at: string;
}>;

export type PackageArchivePlan = Readonly<{
  mode: ArchiveMode;
  disposition: ArchiveDisposition;
  manifest: EditionPackageManifest;
  package_path: string;
  package_sha256: string;
  package_bytes: number;
  drive_path: string;
  path_segments: readonly ArchivePathSegment[];
  duplicate_file_id: string | null;
  receipt_path: string;
}>;

export type PackageArchivePort = Readonly<{
  validateRoot(
    rootFolderId: string,
  ): Promise<Readonly<{ id: string; name: string; driveId: string | null }>>;
  planPath(
    rootFolderId: string,
    year: string,
    month: string,
  ): Promise<
    Readonly<{ folderId: string | null; path: string; segments: readonly ArchivePathSegment[] }>
  >;
  ensurePath(
    rootFolderId: string,
    year: string,
    month: string,
  ): Promise<Readonly<{ folderId: string; path: string; segments: readonly ArchivePathSegment[] }>>;
  findByPackageSha256(
    folderId: string,
    packageSha256: string,
  ): Promise<Readonly<Record<string, unknown>> | null>;
  uploadResumable(
    input: Readonly<{
      folderId: string;
      name: string;
      bytes: Uint8Array;
      metadata: Readonly<Record<string, string>>;
    }>,
  ): Promise<Readonly<Record<string, unknown>>>;
  getMetadata(fileId: string): Promise<Readonly<Record<string, unknown>>>;
  download(fileId: string): Promise<Uint8Array>;
}>;
