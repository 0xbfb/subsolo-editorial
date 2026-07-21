import type {
  PackageArchivePlan,
  PackageArchivePort,
  PackageArchiveReceipt,
} from '../domain/package-archive';

export class PackageArchiveFailure extends Error {
  readonly code: string;
  readonly action: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly retryable: boolean;
  constructor(
    code: string,
    message: string,
    action: string,
    details?: Readonly<Record<string, unknown>>,
    retryable?: boolean,
  );
  toJSON(): Readonly<Record<string, unknown>>;
}

export function planPackageArchive(
  input: Readonly<{
    packagePath: string;
    rootFolderId: string;
    receiptPath?: string | null;
    adapter: PackageArchivePort;
  }>,
): Promise<PackageArchivePlan>;

export function applyPackageArchive(
  input: Readonly<{
    packagePath: string;
    rootFolderId: string;
    receiptPath?: string | null;
    adapter: PackageArchivePort;
    now?: () => Date;
  }>,
): Promise<PackageArchiveReceipt>;
