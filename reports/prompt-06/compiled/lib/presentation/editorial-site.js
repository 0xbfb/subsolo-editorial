const fail = (path, message) => {
    throw new Error(`Fixture editorial pública inválida em ${path}: ${message}`);
};
const record = (value, path) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        fail(path, 'deve ser objeto');
    return value;
};
const list = (value, path) => {
    if (!Array.isArray(value))
        fail(path, 'deve ser lista');
    return value;
};
const text = (value, path) => {
    if (typeof value !== 'string' || value.trim() === '')
        fail(path, 'deve ser texto não vazio');
    return value;
};
const optionalText = (value, path) => {
    if (value === null)
        return null;
    return text(value, path);
};
const bool = (value, path) => {
    if (typeof value !== 'boolean')
        fail(path, 'deve ser booleano');
    return value;
};
const integer = (value, path) => {
    if (typeof value !== 'number' || !Number.isInteger(value))
        fail(path, 'deve ser inteiro');
    return value;
};
const strings = (value, path) => Object.freeze(list(value, path).map((item, index) => text(item, `${path}[${index}]`)));
const stateKind = (value, path) => {
    const parsed = text(value, path);
    const allowed = ['developing', 'confirmed', 'analysis', 'document', 'corrected'];
    if (!allowed.includes(parsed))
        fail(path, 'estado visual desconhecido');
    return parsed;
};
const block = (value, path) => {
    const item = record(value, path);
    const kind = text(item.kind, `${path}.kind`);
    const allowed = [
        'fact',
        'declaration',
        'unknown',
        'why-it-matters',
        'next-step',
        'document',
        'action',
    ];
    if (!allowed.includes(kind))
        fail(`${path}.kind`, 'bloco desconhecido');
    return Object.freeze({
        kind: kind,
        label: text(item.label, `${path}.label`),
        text: text(item.text, `${path}.text`),
    });
};
const section = (value, path) => {
    const item = record(value, path);
    return Object.freeze({
        id: text(item.id, `${path}.id`),
        heading: text(item.heading, `${path}.heading`),
        paragraphs: strings(item.paragraphs, `${path}.paragraphs`),
        blocks: Object.freeze(list(item.blocks, `${path}.blocks`).map((entry, index) => block(entry, `${path}.blocks[${index}]`))),
    });
};
const publication = (value, path) => {
    const item = record(value, path);
    const toc = Object.freeze(list(item.toc, `${path}.toc`).map((entry, index) => {
        const pair = list(entry, `${path}.toc[${index}]`);
        if (pair.length !== 2)
            fail(`${path}.toc[${index}]`, 'deve ter id e rótulo');
        return Object.freeze([
            text(pair[0], `${path}.toc[${index}][0]`),
            text(pair[1], `${path}.toc[${index}][1]`),
        ]);
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
        corrections: Object.freeze(list(item.corrections, `${path}.corrections`).map((entry, index) => {
            const correction = record(entry, `${path}.corrections[${index}]`);
            return Object.freeze({
                date: text(correction.date, `${path}.corrections[${index}].date`),
                text: text(correction.text, `${path}.corrections[${index}].text`),
            });
        })),
        connectionIds: strings(item.connectionIds, `${path}.connectionIds`),
    });
};
export const parseEditorialSiteData = (value) => {
    const root = record(value, 'raiz');
    const site = record(root.site, 'site');
    const edition = record(root.edition, 'edition');
    const dateLabel = list(site.dateLabel, 'site.dateLabel');
    if (dateLabel.length !== 2)
        fail('site.dateLabel', 'deve ter duas linhas');
    const publications = Object.freeze(list(root.publications, 'publications').map((entry, index) => publication(entry, `publications[${index}]`)));
    const publicationIds = new Set(publications.map((item) => item.id));
    if (publicationIds.size !== publications.length)
        fail('publications', 'IDs duplicados');
    const sources = Object.freeze(list(root.sources, 'sources').map((entry, index) => {
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
        if (!sourceIds.has(id))
            fail(`publication.${item.id}.sourceIds`, `fonte inexistente: ${id}`);
    }));
    publications.forEach((item) => item.connectionIds.forEach((id) => {
        if (!publicationIds.has(id))
            fail(`publication.${item.id}.connectionIds`, `publicação inexistente: ${id}`);
    }));
    const stories = Object.freeze(list(root.stories, 'stories').map((entry, index) => {
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
            if (!publicationIds.has(id))
                fail(`stories[${index}].publicationIds`, `publicação inexistente: ${id}`);
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
    const documents = Object.freeze(list(root.documents, 'documents').map((entry, index) => {
        const item = record(entry, `documents[${index}]`);
        const relatedPublicationIds = strings(item.relatedPublicationIds, `documents[${index}].relatedPublicationIds`);
        relatedPublicationIds.forEach((id) => {
            if (!publicationIds.has(id))
                fail(`documents[${index}].relatedPublicationIds`, `publicação inexistente: ${id}`);
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
    const parsed = Object.freeze({
        site: Object.freeze({
            description: text(site.description, 'site.description'),
            dateLabel: Object.freeze([
                text(dateLabel[0], 'site.dateLabel[0]'),
                text(dateLabel[1], 'site.dateLabel[1]'),
            ]),
            closingLabel: text(site.closingLabel, 'site.closingLabel'),
        }),
        edition: Object.freeze({
            id: text(edition.id, 'edition.id'),
            date: text(edition.date, 'edition.date'),
            label: text(edition.label, 'edition.label'),
            revision: integer(edition.revision, 'edition.revision'),
            status: text(edition.status, 'edition.status'),
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
    });
    parsed.edition.publicationIds.forEach((id) => {
        if (!publicationIds.has(id))
            fail('edition.publicationIds', `publicação inexistente: ${id}`);
    });
    return parsed;
};
export const publicationHref = (publication) => {
    const [year, month, day] = publication.date.split('-');
    return `/${year}/${month}/${day}/${publication.slug}/`;
};
export const editionHref = (date) => {
    const [year, month, day] = date.split('-');
    return `/edicoes/${year}/${month}/${day}/`;
};
export const navigationFor = (currentHref) => Object.freeze([
    { label: 'Início', href: '/', current: currentHref === '/', available: true },
    { label: 'Agora', href: '/agora/', current: currentHref.startsWith('/agora'), available: true },
    { label: 'Canais', href: '/canais/', current: currentHref.startsWith('/canais'), available: true },
    { label: 'Tecnologia', href: '/temas/tecnologia/', current: currentHref.startsWith('/temas/tecnologia'), available: true },
    { label: 'Arquivo', href: '/arquivo/', current: currentHref.startsWith('/arquivo') || currentHref.startsWith('/edicoes'), available: true },
    { label: 'Busca', href: '/busca/', current: currentHref.startsWith('/busca'), available: true },
    { label: 'A Redação', href: '/a-redacao/', current: currentHref.startsWith('/a-redacao') || currentHref.startsWith('/redacao'), available: true },
]);
export const findPublication = (data, id) => {
    const publication = data.publications.find((item) => item.id === id);
    if (!publication)
        throw new Error(`Publicação inexistente: ${id}`);
    return publication;
};
export const sourcesFor = (data, publication) => publication.sourceIds.map((id) => {
    const source = data.sources.find((item) => item.id === id);
    if (!source)
        throw new Error(`Fonte inexistente: ${id}`);
    return source;
});
export const connectionsFor = (data, publication) => publication.connectionIds.map((id) => findPublication(data, id));
export const formatTimestamp = (value) => new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
}).format(new Date(value));
