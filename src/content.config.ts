import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  publicAuthorSchema,
  publicChannelSchema,
  publicEditionSchema,
  publicPublicationSchema,
  publicStorySchema,
  publicTopicSchema,
} from './lib/presentation/public-zod-schemas';

const publications = defineCollection({
  loader: glob({ pattern: '**/publication.md', base: './content/publications' }),
  schema: publicPublicationSchema,
});

const editions = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './content/editions' }),
  schema: publicEditionSchema,
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './content/authors' }),
  schema: publicAuthorSchema,
});

const channels = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './content/channels' }),
  schema: publicChannelSchema,
});

const topics = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './content/topics' }),
  schema: publicTopicSchema,
});

const stories = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './content/stories' }),
  schema: publicStorySchema,
});

export const collections = { publications, editions, authors, channels, topics, stories };
