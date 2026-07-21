const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const freeze = (value) => Object.freeze(value);

export const normalizeBasePath = (value = '/') => {
  if (!value || value === '/') return '/';
  return `/${String(value).replace(/^\/+|\/+$/g, '')}/`;
};

export const joinBasePath = (basePath, pathname) => {
  const base = normalizeBasePath(basePath);
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (base === '/') return path;
  return `${base.slice(0, -1)}${path}`;
};

export const archiveRecordHref = (record) => `/arquivo/registros/${record.slug}/`;

export const publicationHrefFromEntry = (publication) => {
  const [year, month, day] = publication.date.split('-');
  return `/${year}/${month}/${day}/${publication.slug}/`;
};

const assertText = (value, path) => {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`DISCOVERY_INVALID ${path}: texto obrigatório`);
  return value;
};

const assertStrings = (value, path) => {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string' || item.trim() === '')
  ) {
    throw new Error(`DISCOVERY_INVALID ${path}: lista de textos obrigatória`);
  }
  return freeze([...value]);
};

export const parseArchiveRecords = (value) => {
  if (!Array.isArray(value)) throw new Error('DISCOVERY_INVALID archive: lista obrigatória');
  const ids = new Set();
  const routes = new Set();
  return freeze(
    value.map((raw, index) => {
      const path = `archive[${index}]`;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        throw new Error(`DISCOVERY_INVALID ${path}: objeto obrigatório`);
      const id = assertText(raw.id, `${path}.id`);
      const slug = assertText(raw.slug, `${path}.slug`);
      const date = assertText(raw.date, `${path}.date`);
      if (!SAFE_SLUG.test(slug)) throw new Error(`DISCOVERY_INVALID ${path}.slug: slug inválido`);
      if (!ISO_DATE.test(date)) throw new Error(`DISCOVERY_INVALID ${path}.date: data inválida`);
      if (ids.has(id)) throw new Error(`DISCOVERY_DUPLICATE_ID ${id}`);
      ids.add(id);
      const route = archiveRecordHref({ slug });
      if (routes.has(route)) throw new Error(`DISCOVERY_DUPLICATE_ROUTE ${route}`);
      routes.add(route);
      const correctionCount = raw.correctionCount ?? 0;
      if (!Number.isInteger(correctionCount) || correctionCount < 0)
        throw new Error(`DISCOVERY_INVALID ${path}.correctionCount`);
      return freeze({
        id,
        slug,
        date,
        publishedAt: assertText(raw.publishedAt, `${path}.publishedAt`),
        updatedAt: raw.updatedAt === null ? null : assertText(raw.updatedAt, `${path}.updatedAt`),
        channel: assertText(raw.channel, `${path}.channel`),
        type: assertText(raw.type, `${path}.type`),
        state: assertText(raw.state, `${path}.state`),
        title: assertText(raw.title, `${path}.title`),
        summary: assertText(raw.summary, `${path}.summary`),
        authors: assertStrings(raw.authors, `${path}.authors`),
        editor: assertText(raw.editor, `${path}.editor`),
        topics: assertStrings(raw.topics, `${path}.topics`),
        story: raw.story === null ? null : assertText(raw.story, `${path}.story`),
        correctionCount,
        latestCorrection: null,
        bodyVisibility: 'full',
        href: route,
        recordKind: 'archive-record',
      });
    }),
  );
};

export const createDiscoveryEntries = ({ publications, archiveRecords }) => {
  const current = publications.map((publication) => {
    const latest = publication.corrections.at(-1) ?? null;
    const summary =
      publication.bodyVisibility === 'tombstone' && publication.tombstone
        ? publication.tombstone.impact
        : publication.subtitle;
    return freeze({
      id: publication.id,
      slug: publication.slug,
      date: publication.date,
      publishedAt: publication.publishedAt,
      updatedAt: publication.updatedAt,
      channel: publication.channel,
      type: publication.type,
      state: publication.state,
      title: publication.title,
      summary,
      authors: freeze([...publication.authors]),
      editor: publication.editor,
      topics: freeze([...publication.topics]),
      story: publication.story,
      correctionCount: publication.corrections.length,
      latestCorrection: latest
        ? freeze({
            type: latest.type,
            summary: latest.summary,
            impact: latest.impact,
            publishedAt: latest.publishedAt,
            previousRevision: latest.previousRevision,
            newRevision: latest.newRevision,
          })
        : null,
      bodyVisibility: publication.bodyVisibility,
      href: publicationHrefFromEntry(publication),
      recordKind: 'publication',
    });
  });
  const all = [...current, ...archiveRecords];
  const ids = new Set();
  const routes = new Set();
  for (const entry of all) {
    if (ids.has(entry.id)) throw new Error(`DISCOVERY_DUPLICATE_ID ${entry.id}`);
    if (routes.has(entry.href)) throw new Error(`DISCOVERY_DUPLICATE_ROUTE ${entry.href}`);
    ids.add(entry.id);
    routes.add(entry.href);
  }
  return freeze(
    all.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)),
  );
};

export const paginateEntries = (entries, page = 1, pageSize = 8) => {
  if (!Number.isInteger(page) || page < 1) throw new Error('DISCOVERY_INVALID_PAGE');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
    throw new Error('DISCOVERY_INVALID_PAGE_SIZE');
  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize));
  if (page > pageCount) throw new Error(`DISCOVERY_PAGE_OUT_OF_RANGE ${page}/${pageCount}`);
  const start = (page - 1) * pageSize;
  return freeze({
    page,
    pageSize,
    pageCount,
    total: entries.length,
    items: freeze(entries.slice(start, start + pageSize)),
    previousPage: page > 1 ? page - 1 : null,
    nextPage: page < pageCount ? page + 1 : null,
  });
};

export const entriesForDate = (entries, year, month = null, day = null) => {
  const prefix = [year, month, day].filter(Boolean).join('-');
  return freeze(entries.filter((entry) => entry.date.startsWith(prefix)));
};

export const collectDateRoutes = (entries) => {
  const years = new Set();
  const months = new Set();
  const days = new Set();
  for (const entry of entries) {
    const [year, month, day] = entry.date.split('-');
    years.add(year);
    months.add(`${year}-${month}`);
    days.add(`${year}-${month}-${day}`);
  }
  return freeze({
    years: freeze([...years].sort().reverse()),
    months: freeze([...months].sort().reverse()),
    days: freeze([...days].sort().reverse()),
  });
};

export const facetCounts = (entries) => {
  const add = (target, value) => target.set(value, (target.get(value) ?? 0) + 1);
  const maps = {
    channel: new Map(),
    topic: new Map(),
    author: new Map(),
    type: new Map(),
    state: new Map(),
    story: new Map(),
  };
  for (const entry of entries) {
    add(maps.channel, entry.channel);
    add(maps.type, entry.type);
    add(maps.state, entry.state);
    if (entry.story) add(maps.story, entry.story);
    entry.topics.forEach((topic) => add(maps.topic, topic));
    entry.authors.forEach((author) => add(maps.author, author));
  }
  return freeze(
    Object.fromEntries(
      Object.entries(maps).map(([name, map]) => [
        name,
        freeze(Object.fromEntries([...map.entries()].sort())),
      ]),
    ),
  );
};

export const buildArchiveIndex = (entries, generatedAt) =>
  freeze({
    schemaVersion: '1.0.0',
    generatedAt,
    total: entries.length,
    facets: facetCounts(entries),
    entries: freeze(
      entries.map((entry) =>
        freeze({
          id: entry.id,
          href: entry.href,
          title: entry.title,
          summary: entry.summary,
          date: entry.date,
          publishedAt: entry.publishedAt,
          updatedAt: entry.updatedAt,
          channel: entry.channel,
          type: entry.type,
          state: entry.state,
          authors: entry.authors,
          topics: entry.topics,
          story: entry.story,
          correctionCount: entry.correctionCount,
          correctionType: entry.latestCorrection?.type ?? null,
          correctionSummary: entry.latestCorrection?.summary ?? null,
          correctionPublishedAt: entry.latestCorrection?.publishedAt ?? null,
          bodyVisibility: entry.bodyVisibility,
        }),
      ),
    ),
  });

const xmlEscape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const absoluteUrl = (origin, basePath, pathname) =>
  new URL(joinBasePath(basePath, pathname), `${origin.replace(/\/$/, '')}/`).toString();

export const buildRss = ({
  entries,
  title,
  description,
  origin,
  basePath = '/',
  feedPath,
  limit = 30,
}) => {
  const items = entries
    .slice(0, limit)
    .map((entry) => {
      const url = absoluteUrl(origin, basePath, entry.href);
      return `    <item>\n      <title>${xmlEscape(entry.title)}</title>\n      <link>${xmlEscape(url)}</link>\n      <guid isPermaLink="true">${xmlEscape(url)}</guid>\n      <pubDate>${new Date(entry.publishedAt).toUTCString()}</pubDate>\n      <description>${xmlEscape(entry.summary)}</description>\n    </item>`;
    })
    .join('\n');
  const feedUrl = absoluteUrl(origin, basePath, feedPath);
  const siteUrl = absoluteUrl(origin, basePath, '/');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${xmlEscape(title)}</title>\n    <link>${xmlEscape(siteUrl)}</link>\n    <description>${xmlEscape(description)}</description>\n    <language>pt-BR</language>\n    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml" />\n${items}\n  </channel>\n</rss>\n`;
};

export const buildSitemap = ({ entries, staticPaths, origin, basePath = '/' }) => {
  const lastModified = new Map();
  for (const path of staticPaths) lastModified.set(path, null);
  for (const entry of entries) lastModified.set(entry.href, entry.updatedAt ?? entry.publishedAt);
  const rows = [...lastModified.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pathname, lastmod]) => {
      const last = lastmod
        ? `\n    <lastmod>${xmlEscape(new Date(lastmod).toISOString())}</lastmod>`
        : '';
      return `  <url>\n    <loc>${xmlEscape(absoluteUrl(origin, basePath, pathname))}</loc>${last}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
};

export const buildRobots = ({ origin, basePath = '/' }) =>
  `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(origin, basePath, '/sitemap.xml')}\n`;
