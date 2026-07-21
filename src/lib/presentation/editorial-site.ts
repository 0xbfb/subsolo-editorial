import type { NavigationItem, VisualStatusKind } from './home-page.js';

export interface EditorialBlock {
  readonly kind: 'fact' | 'declaration' | 'unknown' | 'why-it-matters' | 'next-step' | 'document' | 'action';
  readonly label: string;
  readonly text: string;
}

export interface EditorialSection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly blocks: readonly EditorialBlock[];
}

export interface EditorialCorrection {
  readonly date: string;
  readonly publishedAt: string;
  readonly type: 'correcao-factual' | 'esclarecimento' | 'atualizacao-material' | 'retirada';
  readonly summary: string;
  readonly impact: string;
  readonly previousRevision: number;
  readonly newRevision: number;
}

export interface EditorialTombstone {
  readonly publishedAt: string;
  readonly reason: string;
  readonly impact: string;
  readonly originalPublishedAt: string;
}

export interface EditorialRedirect {
  readonly publicationId: string;
  readonly fromPath: string;
  readonly toPath: string;
  readonly statusCode: 308;
  readonly effectiveAt: string;
  readonly reason: string;
}

export interface EditorialPublication {
  readonly id: string;
  readonly slug: string;
  readonly date: string;
  readonly channel: string;
  readonly section: string;
  readonly type: string;
  readonly state: string;
  readonly stateKind: VisualStatusKind;
  readonly title: string;
  readonly subtitle: string;
  readonly authors: readonly string[];
  readonly editor: string;
  readonly publishedAt: string;
  readonly updatedAt: string | null;
  readonly readingTime: string;
  readonly territories: readonly string[];
  readonly topics: readonly string[];
  readonly story: string | null;
  readonly featured: boolean;
  readonly toc: readonly (readonly [string, string])[];
  readonly sections: readonly EditorialSection[];
  readonly sourceIds: readonly string[];
  readonly bodyVisibility: 'full' | 'tombstone';
  readonly tombstone: EditorialTombstone | null;
  readonly corrections: readonly EditorialCorrection[];
  readonly connectionIds: readonly string[];
}

export interface EditorialStory {
  readonly slug: string;
  readonly title: string;
  readonly status: string;
  readonly summary: string;
  readonly guardian: string;
  readonly topics: readonly string[];
  readonly publicationIds: readonly string[];
  readonly nextExpectedEvent: string;
  readonly timeline: readonly {
    readonly date: string;
    readonly title: string;
    readonly text: string;
  }[];
  readonly actors: readonly string[];
  readonly openQuestions: readonly string[];
}

export interface EditorialDocument {
  readonly slug: string;
  readonly title: string;
  readonly publisher: string;
  readonly date: string;
  readonly type: string;
  readonly sourceUrl: string;
  readonly summary: string;
  readonly excerpts: readonly {
    readonly page: string;
    readonly text: string;
    readonly comment: string;
  }[];
  readonly relatedPublicationIds: readonly string[];
}

export interface EditorialSource {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly accessedAt: string;
  readonly note: string;
}

export interface EditorialSiteData {
  readonly site: {
    readonly description: string;
    readonly dateLabel: readonly [string, string];
    readonly closingLabel: string;
  };
  readonly edition: {
    readonly id: string;
    readonly date: string;
    readonly label: string;
    readonly revision: number;
    readonly status: string;
    readonly sealedAt: string | null;
    readonly revisionHistory: readonly { readonly revision: number; readonly publishedAt: string; readonly status: string; readonly summary: string }[];
    readonly publishedAt: string;
    readonly closing: string;
    readonly title: string;
    readonly summary: string;
    readonly publicationIds: readonly string[];
  };
  readonly publications: readonly EditorialPublication[];
  readonly stories: readonly EditorialStory[];
  readonly documents: readonly EditorialDocument[];
  readonly sources: readonly EditorialSource[];
  readonly redirects: readonly EditorialRedirect[];
}

const fail = (path: string, message: string): never => {
  throw new Error(`Fixture editorial pública inválida em ${path}: ${message}`);
};

const record = (value: unknown, path: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(path, 'deve ser objeto');
  return value as Record<string, unknown>;
};

const list = (value: unknown, path: string): readonly unknown[] => {
  if (!Array.isArray(value)) fail(path, 'deve ser lista');
  return value as readonly unknown[];
};

const text = (value: unknown, path: string): string => {
  if (typeof value !== 'string' || value.trim() === '') fail(path, 'deve ser texto não vazio');
  return value as string;
};

const optionalText = (value: unknown, path: string): string | null => {
  if (value === null) return null;
  return text(value, path);
};

const bool = (value: unknown, path: string): boolean => {
  if (typeof value !== 'boolean') fail(path, 'deve ser booleano');
  return value as boolean;
};

const integer = (value: unknown, path: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) fail(path, 'deve ser inteiro');
  return value as number;
};

const strings = (value: unknown, path: string): readonly string[] =>
  Object.freeze(list(value, path).map((item, index) => text(item, `${path}[${index}]`)));

const stateKind = (value: unknown, path: string): VisualStatusKind => {
  const parsed = text(value, path);
  const allowed: readonly VisualStatusKind[] = ['developing', 'confirmed', 'analysis', 'document', 'corrected'];
  if (!allowed.includes(parsed as VisualStatusKind)) fail(path, 'estado visual desconhecido');
  return parsed as VisualStatusKind;
};

const block = (value: unknown, path: string): EditorialBlock => {
  const item = record(value, path);
  const kind = text(item.kind, `${path}.kind`);
  const allowed: readonly EditorialBlock['kind'][] = [
    'fact',
    'declaration',
    'unknown',
    'why-it-matters',
    'next-step',
    'document',
    'action',
  ];
  if (!allowed.includes(kind as EditorialBlock['kind'])) fail(`${path}.kind`, 'bloco desconhecido');
  return Object.freeze({
    kind: kind as EditorialBlock['kind'],
    label: text(item.label, `${path}.label`),
    text: text(item.text, `${path}.text`),
  });
};

const section = (value: unknown, path: string): EditorialSection => {
  const item = record(value, path);
  return Object.freeze({
    id: text(item.id, `${path}.id`),
    heading: text(item.heading, `${path}.heading`),
    paragraphs: strings(item.paragraphs, `${path}.paragraphs`),
    blocks: Object.freeze(list(item.blocks, `${path}.blocks`).map((entry, index) => block(entry, `${path}.blocks[${index}]`))),
  });
};

const publication = (value: unknown, path: string): EditorialPublication => {
  const item = record(value, path);
  const toc = Object.freeze(list(item.toc, `${path}.toc`).map((entry, index) => {
    const pair = list(entry, `${path}.toc[${index}]`);
    if (pair.length !== 2) fail(`${path}.toc[${index}]`, 'deve ter id e rótulo');
    return Object.freeze([
      text(pair[0], `${path}.toc[${index}][0]`),
      text(pair[1], `${path}.toc[${index}][1]`),
    ]) as readonly [string, string];
  }));
  return Object.freeze({
    id: text(item.id, `${path}.id`),
    slug: text(item.slug, `${path}.slug`),
    date: text(item.date, `${path}.date`),
    channel: text(item.channel, `${path}.channel`),
    section: text(item.section, `${path}.section`),
    type: text(item.type, `${path}.type`),
    state: text(item.state, `${path}.state`),
    stateKind: stateKind(item.stateKind, `${path}.stateKind`),
    title: text(item.title, `${path}.title`),
    subtitle: text(item.subtitle, `${path}.subtitle`),
    authors: strings(item.authors, `${path}.authors`),
    editor: text(item.editor, `${path}.editor`),
    publishedAt: text(item.publishedAt, `${path}.publishedAt`),
    updatedAt: optionalText(item.updatedAt, `${path}.updatedAt`),
    readingTime: text(item.readingTime, `${path}.readingTime`),
    territories: strings(item.territories, `${path}.territories`),
    topics: strings(item.topics, `${path}.topics`),
    story: optionalText(item.story, `${path}.story`),
    featured: bool(item.featured, `${path}.featured`),
    toc,
    sections: Object.freeze(list(item.sections, `${path}.sections`).map((entry, index) => section(entry, `${path}.sections[${index}]`))),
    sourceIds: strings(item.sourceIds, `${path}.sourceIds`),
    bodyVisibility: (() => {
      const visibility = text(item.bodyVisibility ?? 'full', `${path}.bodyVisibility`);
      if (!['full', 'tombstone'].includes(visibility)) fail(`${path}.bodyVisibility`, 'deve ser full ou tombstone');
      return visibility as 'full' | 'tombstone';
    })(),
    tombstone: item.tombstone === null || item.tombstone === undefined ? null : (() => {
      const tombstone = record(item.tombstone, `${path}.tombstone`);
      return Object.freeze({
        publishedAt: text(tombstone.publishedAt, `${path}.tombstone.publishedAt`),
        reason: text(tombstone.reason, `${path}.tombstone.reason`),
        impact: text(tombstone.impact, `${path}.tombstone.impact`),
        originalPublishedAt: text(tombstone.originalPublishedAt, `${path}.tombstone.originalPublishedAt`),
      });
    })(),
    corrections: Object.freeze(list(item.corrections, `${path}.corrections`).map((entry, index) => {
      const correction = record(entry, `${path}.corrections[${index}]`);
      const type = text(correction.type, `${path}.corrections[${index}].type`);
      if (!['correcao-factual', 'esclarecimento', 'atualizacao-material', 'retirada'].includes(type)) fail(`${path}.corrections[${index}].type`, 'tipo desconhecido');
      return Object.freeze({
        date: text(correction.date, `${path}.corrections[${index}].date`),
        publishedAt: text(correction.publishedAt, `${path}.corrections[${index}].publishedAt`),
        type: type as EditorialCorrection['type'],
        summary: text(correction.summary, `${path}.corrections[${index}].summary`),
        impact: text(correction.impact, `${path}.corrections[${index}].impact`),
        previousRevision: integer(correction.previousRevision, `${path}.corrections[${index}].previousRevision`),
        newRevision: integer(correction.newRevision, `${path}.corrections[${index}].newRevision`),
      });
    })),
    connectionIds: strings(item.connectionIds, `${path}.connectionIds`),
  });
};

export const parseEditorialSiteData = (value: unknown): EditorialSiteData => {
  const root = record(value, 'raiz');
  const site = record(root.site, 'site');
  const edition = record(root.edition, 'edition');
  const dateLabel = list(site.dateLabel, 'site.dateLabel');
  if (dateLabel.length !== 2) fail('site.dateLabel', 'deve ter duas linhas');

  const publications = Object.freeze(list(root.publications, 'publications').map((entry, index) => publication(entry, `publications[${index}]`)));
  const publicationIds = new Set(publications.map((item) => item.id));
  if (publicationIds.size !== publications.length) fail('publications', 'IDs duplicados');
  publications.forEach((item) => {
    if (item.bodyVisibility === 'tombstone' && item.tombstone === null) fail(`publication.${item.id}.tombstone`, 'retirada exige página-túmulo');
    if (item.bodyVisibility === 'full' && item.tombstone !== null) fail(`publication.${item.id}.tombstone`, 'tombstone inesperado em corpo público');
  });

  const redirects = Object.freeze(list(root.redirects ?? [], 'redirects').map((entry, index): EditorialRedirect => {
    const item = record(entry, `redirects[${index}]`);
    const statusCode = integer(item.statusCode, `redirects[${index}].statusCode`);
    if (statusCode !== 308) fail(`redirects[${index}].statusCode`, 'deve ser 308');
    const parsed = Object.freeze({
      publicationId: text(item.publicationId, `redirects[${index}].publicationId`),
      fromPath: text(item.fromPath, `redirects[${index}].fromPath`),
      toPath: text(item.toPath, `redirects[${index}].toPath`),
      statusCode: 308 as const,
      effectiveAt: text(item.effectiveAt, `redirects[${index}].effectiveAt`),
      reason: text(item.reason, `redirects[${index}].reason`),
    });
    if (!/^\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(parsed.fromPath) || !/^\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(parsed.toPath)) fail(`redirects[${index}]`, 'caminho inválido');
    if (parsed.fromPath === parsed.toPath) fail(`redirects[${index}]`, 'redirect aponta para si próprio');
    if (!publicationIds.has(parsed.publicationId)) fail(`redirects[${index}].publicationId`, 'publicação inexistente');
    return parsed;
  }));
  const redirectMap = new Map(redirects.map((item) => [item.fromPath, item.toPath]));
  if (redirectMap.size !== redirects.length) fail('redirects', 'origens duplicadas');
  for (const source of redirectMap.keys()) {
    const visited = new Set([source]);
    let current = redirectMap.get(source);
    while (current && redirectMap.has(current)) {
      if (visited.has(current)) fail('redirects', `loop detectado a partir de ${source}`);
      visited.add(current);
      current = redirectMap.get(current);
    }
  }

  const sources = Object.freeze(list(root.sources, 'sources').map((entry, index): EditorialSource => {
    const item = record(entry, `sources[${index}]`);
    return Object.freeze({
      id: text(item.id, `sources[${index}].id`),
      type: text(item.type, `sources[${index}].type`),
      title: text(item.title, `sources[${index}].title`),
      publisher: text(item.publisher, `sources[${index}].publisher`),
      url: text(item.url, `sources[${index}].url`),
      accessedAt: text(item.accessedAt, `sources[${index}].accessedAt`),
      note: text(item.note, `sources[${index}].note`),
    });
  }));
  const sourceIds = new Set(sources.map((item) => item.id));
  publications.forEach((item) => item.sourceIds.forEach((id) => {
    if (!sourceIds.has(id)) fail(`publication.${item.id}.sourceIds`, `fonte inexistente: ${id}`);
  }));
  publications.forEach((item) => item.connectionIds.forEach((id) => {
    if (!publicationIds.has(id)) fail(`publication.${item.id}.connectionIds`, `publicação inexistente: ${id}`);
  }));

  const stories = Object.freeze(list(root.stories, 'stories').map((entry, index): EditorialStory => {
    const item = record(entry, `stories[${index}]`);
    const timeline = Object.freeze(list(item.timeline, `stories[${index}].timeline`).map((point, pointIndex) => {
      const row = record(point, `stories[${index}].timeline[${pointIndex}]`);
      return Object.freeze({
        date: text(row.date, `stories[${index}].timeline[${pointIndex}].date`),
        title: text(row.title, `stories[${index}].timeline[${pointIndex}].title`),
        text: text(row.text, `stories[${index}].timeline[${pointIndex}].text`),
      });
    }));
    const storyPublicationIds = strings(item.publicationIds, `stories[${index}].publicationIds`);
    storyPublicationIds.forEach((id) => {
      if (!publicationIds.has(id)) fail(`stories[${index}].publicationIds`, `publicação inexistente: ${id}`);
    });
    return Object.freeze({
      slug: text(item.slug, `stories[${index}].slug`),
      title: text(item.title, `stories[${index}].title`),
      status: text(item.status, `stories[${index}].status`),
      summary: text(item.summary, `stories[${index}].summary`),
      guardian: text(item.guardian, `stories[${index}].guardian`),
      topics: strings(item.topics, `stories[${index}].topics`),
      publicationIds: storyPublicationIds,
      nextExpectedEvent: text(item.nextExpectedEvent, `stories[${index}].nextExpectedEvent`),
      timeline,
      actors: strings(item.actors, `stories[${index}].actors`),
      openQuestions: strings(item.openQuestions, `stories[${index}].openQuestions`),
    });
  }));

  const documents = Object.freeze(list(root.documents, 'documents').map((entry, index): EditorialDocument => {
    const item = record(entry, `documents[${index}]`);
    const relatedPublicationIds = strings(item.relatedPublicationIds, `documents[${index}].relatedPublicationIds`);
    relatedPublicationIds.forEach((id) => {
      if (!publicationIds.has(id)) fail(`documents[${index}].relatedPublicationIds`, `publicação inexistente: ${id}`);
    });
    return Object.freeze({
      slug: text(item.slug, `documents[${index}].slug`),
      title: text(item.title, `documents[${index}].title`),
      publisher: text(item.publisher, `documents[${index}].publisher`),
      date: text(item.date, `documents[${index}].date`),
      type: text(item.type, `documents[${index}].type`),
      sourceUrl: text(item.sourceUrl, `documents[${index}].sourceUrl`),
      summary: text(item.summary, `documents[${index}].summary`),
      excerpts: Object.freeze(list(item.excerpts, `documents[${index}].excerpts`).map((excerpt, excerptIndex) => {
        const row = record(excerpt, `documents[${index}].excerpts[${excerptIndex}]`);
        return Object.freeze({
          page: text(row.page, `documents[${index}].excerpts[${excerptIndex}].page`),
          text: text(row.text, `documents[${index}].excerpts[${excerptIndex}].text`),
          comment: text(row.comment, `documents[${index}].excerpts[${excerptIndex}].comment`),
        });
      })),
      relatedPublicationIds,
    });
  }));

  const parsed: EditorialSiteData = Object.freeze({
    site: Object.freeze({
      description: text(site.description, 'site.description'),
      dateLabel: Object.freeze([
        text(dateLabel[0], 'site.dateLabel[0]'),
        text(dateLabel[1], 'site.dateLabel[1]'),
      ]) as readonly [string, string],
      closingLabel: text(site.closingLabel, 'site.closingLabel'),
    }),
    edition: Object.freeze({
      id: text(edition.id, 'edition.id'),
      date: text(edition.date, 'edition.date'),
      label: text(edition.label, 'edition.label'),
      revision: integer(edition.revision, 'edition.revision'),
      status: text(edition.status, 'edition.status'),
      sealedAt: edition.sealedAt === null || edition.sealedAt === undefined ? null : text(edition.sealedAt, 'edition.sealedAt'),
      revisionHistory: Object.freeze(
        list(edition.revisionHistory ?? [], 'edition.revisionHistory').map((item, index) => {
          const row = record(item, `edition.revisionHistory[${index}]`);
          return Object.freeze({
            revision: integer(row.revision, `edition.revisionHistory[${index}].revision`),
            publishedAt: text(row.publishedAt, `edition.revisionHistory[${index}].publishedAt`),
            status: text(row.status, `edition.revisionHistory[${index}].status`),
            summary: text(row.summary, `edition.revisionHistory[${index}].summary`),
          });
        }),
      ),
      publishedAt: text(edition.publishedAt, 'edition.publishedAt'),
      closing: text(edition.closing, 'edition.closing'),
      title: text(edition.title, 'edition.title'),
      summary: text(edition.summary, 'edition.summary'),
      publicationIds: strings(edition.publicationIds, 'edition.publicationIds'),
    }),
    publications,
    stories,
    documents,
    sources,
    redirects,
  });

  parsed.edition.publicationIds.forEach((id) => {
    if (!publicationIds.has(id)) fail('edition.publicationIds', `publicação inexistente: ${id}`);
  });
  return parsed;
};

export const publicationHref = (publication: EditorialPublication): string => {
  const [year, month, day] = publication.date.split('-');
  return `/${year}/${month}/${day}/${publication.slug}/`;
};

export const editionHref = (date: string): string => {
  const [year, month, day] = date.split('-');
  return `/edicoes/${year}/${month}/${day}/`;
};

export const navigationFor = (currentHref: string): readonly NavigationItem[] => Object.freeze([
  { label: 'Início', href: '/', current: currentHref === '/', available: true },
  { label: 'Agora', href: '/agora/', current: currentHref.startsWith('/agora'), available: true },
  { label: 'Canais', href: '/canais/', current: currentHref.startsWith('/canais'), available: true },
  { label: 'Tecnologia', href: '/temas/tecnologia/', current: currentHref.startsWith('/temas/tecnologia'), available: true },
  { label: 'Arquivo', href: '/arquivo/', current: currentHref.startsWith('/arquivo') || currentHref.startsWith('/edicoes'), available: true },
  { label: 'Busca', href: '/busca/', current: currentHref.startsWith('/busca'), available: true },
  { label: 'A Redação', href: '/a-redacao/', current: currentHref.startsWith('/a-redacao') || currentHref.startsWith('/redacao'), available: true },
]);

export const findPublication = (data: EditorialSiteData, id: string): EditorialPublication => {
  const publication = data.publications.find((item) => item.id === id);
  if (!publication) throw new Error(`Publicação inexistente: ${id}`);
  return publication;
};

export const sourcesFor = (data: EditorialSiteData, publication: EditorialPublication): readonly EditorialSource[] =>
  publication.sourceIds.map((id) => {
    const source = data.sources.find((item) => item.id === id);
    if (!source) throw new Error(`Fonte inexistente: ${id}`);
    return source;
  });

export const connectionsFor = (data: EditorialSiteData, publication: EditorialPublication): readonly EditorialPublication[] =>
  publication.connectionIds.map((id) => findPublication(data, id));

export const formatTimestamp = (value: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
