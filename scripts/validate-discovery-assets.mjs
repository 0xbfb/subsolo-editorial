import { readdir, readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const required = [
  'public/archive-index.json',
  'public/rss.xml',
  'public/rss/correcoes.xml',
  'public/sitemap.xml',
  'public/robots.txt',
  'public/redirects.json',
];

for (const path of required) {
  const content = await readFile(path, 'utf8');
  if (!content.trim()) throw new Error(`DISCOVERY_ASSET_EMPTY ${path}`);
}

const index = JSON.parse(await readFile('public/archive-index.json', 'utf8'));
if (index.total !== index.entries.length || index.total < 20) {
  throw new Error('DISCOVERY_INDEX_INVALID');
}

const forbiddenKeys = new Set([
  'body',
  'sections',
  'content',
  'sources',
  'internalNotes',
  'private',
]);
const ids = new Set();
const hrefs = new Set();
for (const [position, entry] of index.entries.entries()) {
  if (!entry.id || !entry.title || !entry.href || !entry.date) {
    throw new Error(`DISCOVERY_INDEX_ENTRY_INCOMPLETE ${position}`);
  }
  if (ids.has(entry.id)) throw new Error(`DISCOVERY_INDEX_DUPLICATE_ID ${entry.id}`);
  if (hrefs.has(entry.href)) throw new Error(`DISCOVERY_INDEX_DUPLICATE_HREF ${entry.href}`);
  ids.add(entry.id);
  hrefs.add(entry.href);
  for (const key of Object.keys(entry)) {
    if (forbiddenKeys.has(key)) throw new Error(`DISCOVERY_INDEX_PRIVATE_FIELD ${key}`);
  }
}

const withdrawn = index.entries.find((entry) => entry.bodyVisibility === 'tombstone');
if (!withdrawn || withdrawn.state !== 'Retirado' || !withdrawn.correctionSummary) {
  throw new Error('DISCOVERY_WITHDRAWAL_NOT_PRESERVED');
}
if (
  /aplicativo mudou os termos/i.test(withdrawn.summary) &&
  withdrawn.summary === 'O aplicativo mudou os termos'
) {
  throw new Error('DISCOVERY_WITHDRAWAL_BODY_LEAK');
}

const rss = await readFile('public/rss.xml', 'utf8');
if (!rss.includes('<rss version="2.0"') || !rss.includes('<item>')) {
  throw new Error('DISCOVERY_RSS_INVALID');
}

const channelFeedDirectory = 'public/rss/canais';
const channelFeeds = (await readdir(channelFeedDirectory))
  .filter((name) => name.endsWith('.xml'))
  .sort();
if (channelFeeds.length !== 9) {
  throw new Error(`DISCOVERY_CHANNEL_FEEDS_INVALID expected=9 actual=${channelFeeds.length}`);
}
for (const name of channelFeeds) {
  const content = await readFile(`${channelFeedDirectory}/${name}`, 'utf8');
  if (!content.includes('<rss version="2.0"') || !content.includes('<channel>')) {
    throw new Error(`DISCOVERY_CHANNEL_FEED_INVALID ${basename(name)}`);
  }
}

const corrections = await readFile('public/rss/correcoes.xml', 'utf8');
if (
  !corrections.includes('<rss version="2.0"') ||
  !corrections.includes('<channel>') ||
  !corrections.includes('Correção:') ||
  !corrections.includes('Retirada:')
) {
  throw new Error('DISCOVERY_CORRECTIONS_FEED_INVALID');
}

const sitemap = await readFile('public/sitemap.xml', 'utf8');
if (!sitemap.includes('<urlset') || !sitemap.includes('<loc>')) {
  throw new Error('DISCOVERY_SITEMAP_INVALID');
}
if (/\/(rss(?:\/|\.xml)|archive-index\.json)<\/loc>/.test(sitemap)) {
  throw new Error('DISCOVERY_SITEMAP_NON_PAGE_ASSET');
}

const robots = await readFile('public/robots.txt', 'utf8');
if (!/^Sitemap: https?:\/\//m.test(robots)) {
  throw new Error('DISCOVERY_ROBOTS_WITHOUT_SITEMAP');
}

const redirectRegistry = JSON.parse(await readFile('public/redirects.json', 'utf8'));
if (
  redirectRegistry.schemaVersion !== '1.0.0' ||
  !Array.isArray(redirectRegistry.redirects) ||
  redirectRegistry.redirects.length < 1
) {
  throw new Error('DISCOVERY_REDIRECT_REGISTRY_INVALID');
}
const redirectMap = new Map();
for (const redirect of redirectRegistry.redirects) {
  if (
    redirect.statusCode !== 308 ||
    redirect.fromPath === redirect.toPath ||
    redirectMap.has(redirect.fromPath)
  ) {
    throw new Error('DISCOVERY_REDIRECT_INVALID');
  }
  redirectMap.set(redirect.fromPath, redirect.toPath);
}
for (const source of redirectMap.keys()) {
  const visited = new Set([source]);
  let current = redirectMap.get(source);
  while (current && redirectMap.has(current)) {
    if (visited.has(current)) throw new Error('DISCOVERY_REDIRECT_LOOP');
    visited.add(current);
    current = redirectMap.get(current);
  }
}

console.log(
  `Assets de descoberta válidos: ${index.total} registros, ${channelFeeds.length + 2} feeds.`,
);
