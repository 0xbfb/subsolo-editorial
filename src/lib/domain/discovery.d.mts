export interface DiscoveryEntry {
  readonly id: string;
  readonly slug: string;
  readonly date: string;
  readonly publishedAt: string;
  readonly updatedAt: string | null;
  readonly channel: string;
  readonly type: string;
  readonly state: string;
  readonly title: string;
  readonly summary: string;
  readonly authors: readonly string[];
  readonly editor: string;
  readonly topics: readonly string[];
  readonly story: string | null;
  readonly correctionCount: number;
  readonly href: string;
  readonly recordKind: 'publication' | 'archive-record';
}
export function normalizeBasePath(value?: string): string;
export function joinBasePath(basePath: string, pathname: string): string;
export function archiveRecordHref(record: { readonly slug: string }): string;
export function publicationHrefFromEntry(publication: {
  readonly date: string;
  readonly slug: string;
}): string;
export function parseArchiveRecords(value: unknown): readonly DiscoveryEntry[];
export function createDiscoveryEntries(input: {
  readonly publications: readonly unknown[];
  readonly archiveRecords: readonly DiscoveryEntry[];
}): readonly DiscoveryEntry[];
export function paginateEntries(
  entries: readonly DiscoveryEntry[],
  page?: number,
  pageSize?: number,
): Readonly<{
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  items: readonly DiscoveryEntry[];
  previousPage: number | null;
  nextPage: number | null;
}>;
export function entriesForDate(
  entries: readonly DiscoveryEntry[],
  year: string,
  month?: string | null,
  day?: string | null,
): readonly DiscoveryEntry[];
export function collectDateRoutes(
  entries: readonly DiscoveryEntry[],
): Readonly<{ years: readonly string[]; months: readonly string[]; days: readonly string[] }>;
export function facetCounts(
  entries: readonly DiscoveryEntry[],
): Readonly<Record<string, Readonly<Record<string, number>>>>;
export function buildArchiveIndex(entries: readonly DiscoveryEntry[], generatedAt: string): unknown;
export function buildRss(input: {
  entries: readonly DiscoveryEntry[];
  title: string;
  description: string;
  origin: string;
  basePath?: string;
  feedPath: string;
  limit?: number;
}): string;
export function buildSitemap(input: {
  entries: readonly DiscoveryEntry[];
  staticPaths: readonly string[];
  origin: string;
  basePath?: string;
}): string;
export function buildRobots(input: { origin: string; basePath?: string }): string;
