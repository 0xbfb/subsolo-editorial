import archiveFixture from '../../data/fixtures/archive-history.json';
import { editorialSite } from './site-repository';
import {
  collectDateRoutes,
  createDiscoveryEntries,
  entriesForDate,
  facetCounts,
  paginateEntries,
  parseArchiveRecords,
  type DiscoveryEntry,
} from '../domain/discovery.mjs';

export type { DiscoveryEntry } from '../domain/discovery.mjs';

export const archiveRecords = parseArchiveRecords(archiveFixture);
export const discoveryEntries: readonly DiscoveryEntry[] = createDiscoveryEntries({
  publications: editorialSite.publications,
  archiveRecords,
});
export const discoveryDates = collectDateRoutes(discoveryEntries);
export const discoveryFacets = facetCounts(discoveryEntries);
export const archivePageSize = 8;
export const archivePageCount = Math.max(1, Math.ceil(discoveryEntries.length / archivePageSize));

export const archivePage = (page: number) => paginateEntries(discoveryEntries, page, archivePageSize);
export const archiveEntriesForDate = (year: string, month?: string | null, day?: string | null) =>
  entriesForDate(discoveryEntries, year, month, day);
export const archiveEntriesForChannel = (slug: string) => discoveryEntries.filter((entry) => entry.channel === slug);
export const archiveEntriesForTopic = (slug: string) => discoveryEntries.filter((entry) => entry.topics.includes(slug));
export const archiveEntriesForAuthor = (slug: string) => discoveryEntries.filter((entry) => entry.authors.includes(slug) || entry.editor === slug);
export const archiveEntriesForStory = (slug: string) => discoveryEntries.filter((entry) => entry.story === slug);
export const archiveRecordBySlug = Object.freeze(Object.fromEntries(archiveRecords.map((entry) => [entry.slug, entry])));
