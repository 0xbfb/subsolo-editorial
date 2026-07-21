import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  buildArchiveIndex,
  buildRss,
  buildRobots,
  buildSitemap,
  collectDateRoutes,
  createDiscoveryEntries,
  joinBasePath,
  parseArchiveRecords,
} from '../src/lib/domain/discovery.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const site = await readJson('src/data/fixtures/editorial-site.json');
const archive = parseArchiveRecords(await readJson('src/data/fixtures/archive-history.json'));
const channels = await readJson('src/data/editorial/catalogs/channels.json');
const authors = await readJson('src/data/editorial/catalogs/authors.json');
const topics = await readJson('src/data/editorial/catalogs/topics.json');
const entries = createDiscoveryEntries({
  publications: site.publications,
  archiveRecords: archive,
});
const channelSlugs = new Set(channels.map((item) => item.slug));
const authorSlugs = new Set(authors.map((item) => item.slug));
const topicSlugs = new Set(topics.map((item) => item.slug));
for (const entry of entries) {
  if (!channelSlugs.has(entry.channel))
    throw new Error(`DISCOVERY_UNKNOWN_CHANNEL ${entry.id}:${entry.channel}`);
  for (const author of [...entry.authors, entry.editor])
    if (!authorSlugs.has(author)) throw new Error(`DISCOVERY_UNKNOWN_AUTHOR ${entry.id}:${author}`);
  for (const topic of entry.topics)
    if (!topicSlugs.has(topic)) throw new Error(`DISCOVERY_UNKNOWN_TOPIC ${entry.id}:${topic}`);
}
const dates = collectDateRoutes(entries);
const origin = process.env.SUBSOLO_SITE_URL ?? 'https://subsolo.example';
const basePath = process.env.SUBSOLO_BASE_PATH ?? '/';
const latest = entries.reduce(
  (max, entry) =>
    [entry.updatedAt, entry.publishedAt]
      .filter(Boolean)
      .reduce((m, value) => (value > m ? value : m), max),
  '1970-01-01T00:00:00.000Z',
);
const generatedAt = new Date(latest).toISOString();
const write = async (path, content) => {
  const target = resolve(root, 'public', path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
};

const index = JSON.parse(JSON.stringify(buildArchiveIndex(entries, generatedAt)));
index.entries = index.entries.map((entry) => ({
  ...entry,
  href: joinBasePath(basePath, entry.href),
}));
await write('archive-index.json', `${JSON.stringify(index, null, 2)}\n`);
await write(
  'rss.xml',
  buildRss({
    entries,
    title: 'Subsolo — Publicações',
    description: site.site.description,
    origin,
    basePath,
    feedPath: '/rss.xml',
  }),
);
for (const channel of channels) {
  const filtered = entries.filter((entry) => entry.channel === channel.slug);
  await write(
    `rss/canais/${channel.slug}.xml`,
    buildRss({
      entries: filtered,
      title: `${channel.name} — Subsolo`,
      description: channel.function,
      origin,
      basePath,
      feedPath: `/rss/canais/${channel.slug}.xml`,
    }),
  );
}
const correctionLabels = {
  'correcao-factual': 'Correção',
  esclarecimento: 'Esclarecimento',
  'atualizacao-material': 'Atualização',
  retirada: 'Retirada',
};
const corrections = entries
  .filter((entry) => entry.latestCorrection)
  .map((entry) => ({
    ...entry,
    title: `${correctionLabels[entry.latestCorrection.type] ?? 'Alteração'}: ${entry.title}`,
    summary: `${entry.latestCorrection.summary} Impacto: ${entry.latestCorrection.impact}`,
    publishedAt: entry.latestCorrection.publishedAt,
    updatedAt: entry.latestCorrection.publishedAt,
  }))
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
await write(
  'rss/correcoes.xml',
  buildRss({
    entries: corrections,
    title: 'Correções — Subsolo',
    description:
      'Correções, esclarecimentos, atualizações materiais e retiradas registradas pelo Subsolo.',
    origin,
    basePath,
    feedPath: '/rss/correcoes.xml',
  }),
);
await write(
  'redirects.json',
  `${JSON.stringify({ schemaVersion: '1.0.0', redirects: site.redirects ?? [] }, null, 2)}
`,
);

const discoveredTopicSlugs = [...new Set(entries.flatMap((entry) => entry.topics))].sort();
const staticPaths = [
  '/',
  '/agora/',
  '/canais/',
  '/arquivo/',
  '/busca/',
  '/a-redacao/',
  '/privacidade/',
  '/redacao/',
  '/edicoes/',
  ...channels.map((item) => `/canais/${item.slug}/`),
  ...authors.map((item) => `/redacao/${item.slug}/`),
  ...discoveredTopicSlugs.map((slug) => `/temas/${slug}/`),
  ...site.stories.map((item) => `/historias/${item.slug}/`),
  ...dates.years.map((year) => `/arquivo/${year}/`),
  ...dates.months.map((value) => {
    const [year, month] = value.split('-');
    return `/arquivo/${year}/${month}/`;
  }),
  ...dates.days.map((value) => {
    const [year, month, day] = value.split('-');
    return `/arquivo/${year}/${month}/${day}/`;
  }),
  ...Array.from(
    { length: Math.max(0, Math.ceil(entries.length / 8) - 1) },
    (_, index) => `/arquivo/pagina/${index + 2}/`,
  ),
];
await write('sitemap.xml', buildSitemap({ entries, staticPaths, origin, basePath }));
await write('robots.txt', buildRobots({ origin, basePath }));
console.log(
  `Descoberta gerada: ${entries.length} registros, ${dates.days.length} dias, ${channels.length + 2} feeds.`,
);
