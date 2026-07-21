import type { PackageArchivePort } from '../../domain/package-archive';

export const GOOGLE_DRIVE_FILE_SCOPE: 'https://www.googleapis.com/auth/drive.file';
export const GOOGLE_DRIVE_FULL_SCOPE: 'https://www.googleapis.com/auth/drive';

export class GoogleDriveArchiveFailure extends Error {
  readonly code: string;
  readonly action: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly retryable: boolean;
  constructor(code: string, message: string, action: string, details?: Readonly<Record<string, unknown>>, retryable?: boolean);
  toJSON(): Readonly<Record<string, unknown>>;
}

export function createGoogleDriveTokenProvider(input?: Readonly<Record<string, unknown>>): Readonly<{ getToken(): Promise<string> }>;
export function createGoogleDriveArchiveAdapter(input?: Readonly<Record<string, unknown>>): PackageArchivePort;
