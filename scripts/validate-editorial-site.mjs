import { readFile } from 'node:fs/promises';

const data = JSON.parse(
  await readFile(new URL('../src/data/fixtures/editorial-site.json', import.meta.url), 'utf8'),
);
const authors = JSON.parse(
  await readFile(new URL('../src/data/editorial/catalogs/authors.json', import.meta.url), 'utf8'),
);
const channels = JSON.parse(
  await readFile(new URL('../src/data/editorial/catalogs/channels.json', import.meta.url), 'utf8'),
);
const topics = JSON.parse(
  await readFile(new URL('../src/data/editorial/catalogs/topics.json', import.meta.url), 'utf8'),
);
const errors = [];
const unique = (values, label) => {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) errors.push(`${label} duplicado: ${value}`);
    seen.add(value);
  }
  return seen;
};
const publicationIds = unique(
  data.publications.map((item) => item.id),
  'publication.id',
);
unique(
  data.publications.map((item) => `${item.date}/${item.slug}`),
  'publication.route',
);
const sourceIds = unique(
  data.sources.map((item) => item.id),
  'source.id',
);
const authorSlugs = new Set(authors.map((item) => item.slug));
const channelSlugs = new Set(channels.map((item) => item.slug));
const knownTopics = new Set([
  ...topics.map((item) => item.slug),
  'tecnologia',
  'mobilidade',
  'infraestrutura',
  'plataformas',
  'concessoes',
  'concorrencia',
  'desenvolvimento',
]);
for (const publication of data.publications) {
  if (!channelSlugs.has(publication.channel))
    errors.push(`${publication.id}: canal inexistente ${publication.channel}`);
  for (const author of publication.authors)
    if (!authorSlugs.has(author)) errors.push(`${publication.id}: autor inexistente ${author}`);
  if (!authorSlugs.has(publication.editor))
    errors.push(`${publication.id}: editor inexistente ${publication.editor}`);
  for (const source of publication.sourceIds)
    if (!sourceIds.has(source)) errors.push(`${publication.id}: fonte inexistente ${source}`);
  for (const connection of publication.connectionIds)
    if (!publicationIds.has(connection))
      errors.push(`${publication.id}: conexão inexistente ${connection}`);
  for (const topic of publication.topics)
    if (!knownTopics.has(topic)) errors.push(`${publication.id}: tema não catalogado ${topic}`);
  if (!Array.isArray(publication.sections) || publication.sections.length === 0)
    errors.push(`${publication.id}: sem seções`);
  if (!Array.isArray(publication.toc) || publication.toc.length === 0)
    errors.push(`${publication.id}: sem sumário`);
  const sectionIds = new Set(publication.sections.map((section) => section.id));
  for (const [id] of publication.toc)
    if (!sectionIds.has(id))
      errors.push(`${publication.id}: sumário aponta para seção inexistente ${id}`);
}
for (const id of data.edition.publicationIds)
  if (!publicationIds.has(id)) errors.push(`edition: publicação inexistente ${id}`);
for (const story of data.stories)
  for (const id of story.publicationIds)
    if (!publicationIds.has(id)) errors.push(`story ${story.slug}: publicação inexistente ${id}`);
for (const document of data.documents)
  for (const id of document.relatedPublicationIds)
    if (!publicationIds.has(id))
      errors.push(`document ${document.slug}: publicação inexistente ${id}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Fixture editorial válida: ${data.publications.length} publicações, ${channels.length} canais, ${authors.length} autores, ${data.stories.length} história e ${data.documents.length} documento.`,
);
