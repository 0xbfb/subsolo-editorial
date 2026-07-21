import type {
  ContractIssue,
  PublicAuthor,
  PublicChannel,
  PublicEdition,
  PublicPublication,
  PublicStory,
  PublicTopic,
} from './public-contract.js';

export type PublicReferenceCatalog = Readonly<{
  authors: readonly PublicAuthor[];
  channels: readonly PublicChannel[];
  topics: readonly PublicTopic[];
  stories: readonly PublicStory[];
  publications: readonly PublicPublication[];
  editions: readonly PublicEdition[];
}>;

const duplicateIssues = (values: readonly string[], entity: string): ContractIssue[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) seen.has(value) ? duplicates.add(value) : seen.add(value);
  return [...duplicates].sort().map((value) => ({
    code: 'SUBSOLO_REFERENCE_DUPLICATE',
    path: `$.${entity}`,
    message: `Identificador duplicado em ${entity}: ${value}.`,
    action: 'Mantenha uma única entidade por identificador público.',
  }));
};

export const validatePublicReferences = (
  catalog: PublicReferenceCatalog,
): readonly ContractIssue[] => {
  const issues: ContractIssue[] = [];
  issues.push(
    ...duplicateIssues(
      catalog.authors.map((item) => item.slug),
      'authors',
    ),
  );
  issues.push(
    ...duplicateIssues(
      catalog.channels.map((item) => item.id),
      'channels',
    ),
  );
  issues.push(
    ...duplicateIssues(
      catalog.topics.map((item) => item.id),
      'topics',
    ),
  );
  issues.push(
    ...duplicateIssues(
      catalog.stories.map((item) => item.id),
      'stories',
    ),
  );
  issues.push(
    ...duplicateIssues(
      catalog.publications.map((item) => item.id),
      'publications',
    ),
  );
  issues.push(
    ...duplicateIssues(
      catalog.publications.map((item) => item.slug),
      'publication_slugs',
    ),
  );
  issues.push(
    ...duplicateIssues(
      catalog.editions.map((item) => item.id),
      'editions',
    ),
  );

  const authors = new Set(catalog.authors.map((item) => item.slug));
  const channels = new Set(catalog.channels.map((item) => item.id));
  const topics = new Set(catalog.topics.map((item) => item.id));
  const stories = new Set(catalog.stories.map((item) => item.id));
  const publications = new Set(catalog.publications.map((item) => item.id));
  const editions = new Set(catalog.editions.map((item) => item.id));

  for (const channel of catalog.channels) {
    if (!authors.has(channel.editor_id))
      issues.push({
        code: 'SUBSOLO_CHANNEL_EDITOR_UNKNOWN',
        path: `channels.${channel.id}.editor_id`,
        message: `Editor não encontrado: ${channel.editor_id}.`,
        action: 'Cadastre o autor antes do canal.',
      });
  }
  for (const story of catalog.stories) {
    for (const topic of story.topics)
      if (!topics.has(topic))
        issues.push({
          code: 'SUBSOLO_STORY_TOPIC_UNKNOWN',
          path: `stories.${story.id}.topics`,
          message: `Tema não encontrado: ${topic}.`,
          action: 'Cadastre o tema ou remova a referência.',
        });
  }
  for (const publication of catalog.publications) {
    if (!editions.has(publication.edition_id))
      issues.push({
        code: 'SUBSOLO_PUBLICATION_EDITION_UNKNOWN',
        path: `publications.${publication.id}.edition_id`,
        message: `Edição não encontrada: ${publication.edition_id}.`,
        action: 'Cadastre a edição.',
      });
    if (!channels.has(publication.channel))
      issues.push({
        code: 'SUBSOLO_PUBLICATION_CHANNEL_UNKNOWN',
        path: `publications.${publication.id}.channel`,
        message: `Canal não encontrado: ${publication.channel}.`,
        action: 'Cadastre o canal.',
      });
    for (const author of publication.authors)
      if (!authors.has(author))
        issues.push({
          code: 'SUBSOLO_PUBLICATION_AUTHOR_UNKNOWN',
          path: `publications.${publication.id}.authors`,
          message: `Autor não encontrado: ${author}.`,
          action: 'Cadastre o autor.',
        });
    if (!authors.has(publication.editor))
      issues.push({
        code: 'SUBSOLO_PUBLICATION_EDITOR_UNKNOWN',
        path: `publications.${publication.id}.editor`,
        message: `Editor não encontrado: ${publication.editor}.`,
        action: 'Cadastre o editor.',
      });
    for (const topic of publication.topics)
      if (!topics.has(topic))
        issues.push({
          code: 'SUBSOLO_PUBLICATION_TOPIC_UNKNOWN',
          path: `publications.${publication.id}.topics`,
          message: `Tema não encontrado: ${topic}.`,
          action: 'Cadastre o tema.',
        });
    if (publication.story_id !== null && !stories.has(publication.story_id))
      issues.push({
        code: 'SUBSOLO_PUBLICATION_STORY_UNKNOWN',
        path: `publications.${publication.id}.story_id`,
        message: `História não encontrada: ${publication.story_id}.`,
        action: 'Cadastre a história ou use null.',
      });
  }
  for (const edition of catalog.editions) {
    for (const entry of edition.publications)
      if (!publications.has(entry.id))
        issues.push({
          code: 'SUBSOLO_EDITION_PUBLICATION_UNKNOWN',
          path: `editions.${edition.id}.publications`,
          message: `Publicação não encontrada: ${entry.id}.`,
          action: 'Cadastre a publicação ou remova do manifest.',
        });
  }
  return issues;
};
