import type { EditorialDocument } from '../../domain/editorial-document.js';
import type {
  EditorialDocumentProvider,
  EditorialSheetProvider,
  EditorialSheetRow,
} from '../../application/export-editorial-document.js';

export class GoogleWorkspaceFailure extends Error {
  readonly code: string;
  readonly action: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly retryable: boolean;
  toJSON(): Readonly<Record<string, unknown>>;
}

export type GoogleTokenProvider = Readonly<{ getToken(): Promise<string> }>;
export type GoogleLogger = Readonly<{
  debug(event: string, context?: Readonly<Record<string, unknown>>): void;
  info(event: string, context?: Readonly<Record<string, unknown>>): void;
  warn(event: string, context?: Readonly<Record<string, unknown>>): void;
}>;

export const GOOGLE_READONLY_SCOPES: readonly string[];
export function createStructuredLogger(
  options?: Readonly<{ sink?: (entry: unknown) => void; verbose?: boolean }>,
): GoogleLogger;
export function createEnvironmentAccessTokenProvider(
  options?: Readonly<{ env?: Readonly<Record<string, string | undefined>> }>,
): GoogleTokenProvider;
export function createServiceAccountTokenProvider(
  options?: Readonly<{
    credentialPath?: string;
    scopes?: readonly string[];
    fetchImpl?: typeof fetch;
    now?: () => number;
    logger?: GoogleLogger;
  }>,
): GoogleTokenProvider;
export function createDefaultGoogleTokenProvider(
  options?: Readonly<{
    env?: Readonly<Record<string, string | undefined>>;
    fetchImpl?: typeof fetch;
    logger?: GoogleLogger;
  }>,
): GoogleTokenProvider;
export function createGoogleDocsProvider(
  options: Readonly<{
    tokenProvider: GoogleTokenProvider;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    maxAttempts?: number;
    cacheTtlMs?: number;
    tabId?: string | null;
    logger?: GoogleLogger;
  }>,
): EditorialDocumentProvider;
export function createGoogleSheetsProvider(
  options: Readonly<{
    spreadsheetId: string;
    range?: string;
    tokenProvider: GoogleTokenProvider;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    maxAttempts?: number;
    pageSize?: number;
    maxPages?: number;
    cacheTtlMs?: number;
    logger?: GoogleLogger;
  }>,
): EditorialSheetProvider;
export function createGoogleWorkspaceProvidersFromEnvironment(
  options?: Readonly<{
    env?: Readonly<Record<string, string | undefined>>;
    fetchImpl?: typeof fetch;
    logger?: GoogleLogger;
  }>,
): Readonly<{ documentProvider: EditorialDocumentProvider; sheetProvider: EditorialSheetProvider }>;
export function loadGoogleEditorialInput(
  options: Readonly<{
    articleId: string;
    documentId?: string | null;
    sheetProvider: EditorialSheetProvider;
    documentProvider: EditorialDocumentProvider;
  }>,
): Promise<Readonly<{ row: EditorialSheetRow; document: EditorialDocument }>>;
export function transformGoogleDocument(
  document: unknown,
  options?: Readonly<{ etag?: string | null; tabId?: string | null }>,
): EditorialDocument;
export function rowsFromSheetValues(
  values: readonly (readonly unknown[])[],
): readonly EditorialSheetRow[];
