import siteFixture from '../../data/fixtures/editorial-site.json';
import authorCatalog from '../../data/editorial/catalogs/authors.json';
import channelCatalog from '../../data/editorial/catalogs/channels.json';
import frameCatalog from '../../data/editorial/catalogs/frames.json';
import topicCatalog from '../../data/editorial/catalogs/topics.json';
import portraitRegistry from '../../data/media/portraits.json';
import { portraitForAuthor } from './media-view-model.mjs';
import { parseEditorialSiteData } from './editorial-site';

export const editorialSite = parseEditorialSiteData(siteFixture);
export const authors = Object.freeze(
  authorCatalog.map((author) => ({
    ...author,
    portrait: portraitForAuthor(portraitRegistry, author.slug),
  })),
);
export const channels = Object.freeze(channelCatalog);
export const frames = Object.freeze(frameCatalog);
export const topics = Object.freeze(topicCatalog);

export const authorBySlug = Object.freeze(
  Object.fromEntries(authors.map((author) => [author.slug, author])),
);
export const channelBySlug = Object.freeze(
  Object.fromEntries(channels.map((channel) => [channel.slug, channel])),
);
export const topicBySlug = Object.freeze(
  Object.fromEntries(topics.map((topic) => [topic.slug, topic])),
);

export const channelNames = Object.freeze(
  Object.fromEntries(channels.map((channel) => [channel.slug, channel.name])),
);
export const authorNames = Object.freeze(
  Object.fromEntries(authors.map((author) => [author.slug, author.nickname])),
);

export const publicationsByChannel = (slug: string) =>
  editorialSite.publications.filter((publication) => publication.channel === slug);

export const publicationsByTopic = (slug: string) =>
  editorialSite.publications.filter((publication) => publication.topics.includes(slug));

export const publicationsByAuthor = (slug: string) =>
  editorialSite.publications.filter(
    (publication) => publication.authors.includes(slug) || publication.editor === slug,
  );
