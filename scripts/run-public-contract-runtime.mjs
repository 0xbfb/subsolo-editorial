import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const compiledRoot = process.argv[2];
if (!compiledRoot) throw new Error('SUBSOLO_COMPILED_ROOT_MISSING');
const contract = await import(pathToFileURL(`${compiledRoot}/domain/public-contract.js`));
const ids = await import(pathToFileURL(`${compiledRoot}/domain/identifiers.js`));
const parser = await import(
  pathToFileURL(`${compiledRoot}/application/parse-publication-document.js`)
);
const validation = await import(pathToFileURL(`${compiledRoot}/domain/public-validation.js`));
const refs = await import(pathToFileURL(`${compiledRoot}/domain/referential-validation.js`));
const version = await import(pathToFileURL(`${compiledRoot}/domain/schema-version.js`));

const publicationSource = await readFile('fixtures/public/valid/publication.md', 'utf8');
const parsed = parser.parsePublicationDocument(publicationSource);
if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
const load = async (name) => JSON.parse(await readFile(`fixtures/public/valid/${name}`, 'utf8'));
const edition = await load('edition.json');
const authors = await load('authors.json');
const channel = await load('channel.json');
const topics = await load('topics.json');
const story = await load('story.json');
const sources = await load('sources.json');
const corrections = await load('corrections.json');
const media = await load('media.json');
const redirect = await load('redirect.json');
const tombstone = await load('tombstone.json');
const schemas = Object.fromEntries(
  await Promise.all(
    [
      'publication',
      'edition',
      'source',
      'correction',
      'redirect',
      'tombstone',
      'media',
      'story',
      'author',
      'channel',
      'topic',
    ].map(async (name) => [
      name,
      JSON.parse(await readFile(`schemas/1.0.0/${name}.schema.json`, 'utf8')),
    ]),
  ),
);
const enumChecks = [
  [schemas.publication.properties.type.enum, contract.PUBLICATION_TYPES, 'publication.type'],
  [schemas.publication.properties.status.enum, contract.PUBLICATION_STATUSES, 'publication.status'],
  [schemas.edition.properties.status.enum, contract.EDITION_STATUSES, 'edition.status'],
  [schemas.source.properties.type.enum, contract.SOURCE_TYPES, 'source.type'],
  [schemas.correction.properties.type.enum, contract.CORRECTION_TYPES, 'correction.type'],
  [schemas.media.properties.type.enum, contract.MEDIA_TYPES, 'media.type'],
  [schemas.story.properties.status.enum, contract.STORY_STATUSES, 'story.status'],
  [schemas.author.properties.role.enum, contract.AUTHOR_ROLES, 'author.role'],
  [schemas.author.properties.status.enum, contract.CATALOG_STATUSES, 'author.status'],
  [schemas.channel.properties.status.enum, contract.CATALOG_STATUSES, 'channel.status'],
  [schemas.topic.properties.status.enum, contract.CATALOG_STATUSES, 'topic.status'],
];
for (const [jsonEnum, domainEnum, field] of enumChecks) {
  if (JSON.stringify(jsonEnum) !== JSON.stringify(domainEnum))
    throw new Error(`SUBSOLO_ZOD_JSON_ENUM_DRIFT: ${field}`);
}
const checks = [
  validation.validatePublicEdition(edition),
  ...authors.map(validation.validatePublicAuthor),
  validation.validatePublicChannel(channel),
  ...topics.map(validation.validatePublicTopic),
  validation.validatePublicStory(story),
  ...sources.map(validation.validatePublicSource),
  ...corrections.map(validation.validatePublicCorrection),
  validation.validatePublicRedirect(redirect),
  validation.validatePublicTombstone(tombstone),
  ...media.map(validation.validatePublicMedia),
];
if (checks.some((check) => !check.ok))
  throw new Error(JSON.stringify(checks.filter((check) => !check.ok)));
const referenceIssues = refs.validatePublicReferences({
  authors,
  channels: [channel],
  topics,
  stories: [story],
  publications: [parsed.value.publication],
  editions: [edition],
});
if (referenceIssues.length) throw new Error(JSON.stringify(referenceIssues));
const brokenReferenceIssues = refs.validatePublicReferences({
  authors: [],
  channels: [channel],
  topics,
  stories: [story],
  publications: [parsed.value.publication],
  editions: [edition],
});
if (!brokenReferenceIssues.some((issue) => issue.code === 'SUBSOLO_PUBLICATION_AUTHOR_UNKNOWN'))
  throw new Error('SUBSOLO_BROKEN_REFERENCE_NOT_DETECTED');
for (let index = 0; index < 128; index += 1) {
  const generated = ids.createEntityId(
    'pub',
    1_721_293_200_000 + index,
    new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, index % 256]),
  );
  if (!ids.isEntityId(generated, 'pub')) throw new Error('SUBSOLO_GENERATED_ID_INVALID');
}
const privateField = parser.parsePublicationDocument(
  await readFile('fixtures/public/invalid/publication-private-field.md', 'utf8'),
);
if (privateField.ok) throw new Error('SUBSOLO_PRIVATE_FIELD_ACCEPTED');
const dangerous = parser.parsePublicationDocument(
  await readFile('fixtures/public/invalid/publication-dangerous-url.md', 'utf8'),
);
if (dangerous.ok) throw new Error('SUBSOLO_UNSAFE_URL_ACCEPTED');
const unsafe = parser.parsePublicationDocument(
  await readFile('fixtures/public/invalid/publication-unsafe-html.md', 'utf8'),
);
if (unsafe.ok) throw new Error('SUBSOLO_UNSAFE_HTML_ACCEPTED');
const newer = version.migrateSchemaDocument({ schema_version: '2.0.0' });
if (newer.ok) throw new Error('SUBSOLO_NEWER_SCHEMA_ACCEPTED');
const slug = ids.createSlug('Aceite a nova regra ou desapareça da fila');
if (slug !== 'aceite-a-nova-regra-ou-desapareca-da-fila')
  throw new Error('SUBSOLO_SLUG_UNEXPECTED');
console.log(
  JSON.stringify(
    {
      status: 'passed',
      entities: checks.length + 1,
      references: 'passed',
      unsafe_html: 'rejected',
      unsafe_url: 'rejected',
      private_field: 'rejected',
      schema_major: 'rejected',
      broken_reference: 'rejected',
      generated_ids: 128,
      zod_json_enums: enumChecks.length,
      slug,
    },
    null,
    2,
  ),
);
