import { z } from 'astro/zod';
import {
  AUTHOR_ROLES,
  CATALOG_STATUSES,
  CORRECTION_TYPES,
  EDITION_STATUSES,
  MEDIA_TYPES,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  PUBLIC_LANGUAGE,
  PUBLIC_SCHEMA_VERSION,
  PUBLIC_TIMEZONE,
  SOURCE_TYPES,
  STORY_STATUSES,
} from '../domain/public-contract';

const schemaVersion = z.literal(PUBLIC_SCHEMA_VERSION);
export const publicSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(96);
export const publicEntityIdSchema = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[0-9A-HJKMNP-TV-Z]{26}$`));
export const publicImageReferenceSchema = z
  .object({ src: z.string().min(1), alt: z.string().min(1) })
  .strict()
  .nullable();

export const publicPublicationSchema = z.object({
  schema_version: schemaVersion,
  id: publicEntityIdSchema('pub'),
  edition_id: z.string().regex(/^ed_\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  slug: publicSlugSchema,
  description: z.string().min(1),
  channel: publicSlugSchema,
  section: publicSlugSchema,
  type: z.enum(PUBLICATION_TYPES),
  status: z.enum(PUBLICATION_STATUSES),
  authors: z.array(publicSlugSchema).min(1),
  editor: publicSlugSchema,
  topics: z.array(publicSlugSchema).min(1),
  territories: z.array(publicSlugSchema),
  story_id: publicEntityIdSchema('story').nullable(),
  published_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }).nullable(),
  featured: z.boolean(),
  language: z.literal(PUBLIC_LANGUAGE),
  image: publicImageReferenceSchema,
}).strict();

export const publicEditionSchema = z.object({
  schema_version: schemaVersion,
  id: z.string().regex(/^ed_\d{4}-\d{2}-\d{2}$/),
  date: z.string().date(),
  revision: z.number().int().positive(),
  status: z.enum(EDITION_STATUSES),
  timezone: z.literal(PUBLIC_TIMEZONE),
  published_at: z.string().datetime({ offset: true }),
  sealed_at: z.string().datetime({ offset: true }).nullable(),
  supersedes: z.string().nullable(),
  publications: z
    .array(
      z.object({
        id: publicEntityIdSchema('pub'),
        position: z.number().int().nonnegative(),
        featured: z.boolean(),
      }).strict(),
    )
    .min(1),
}).strict();

export const publicSourceSchema = z.object({
  schema_version: schemaVersion,
  id: publicEntityIdSchema('src'),
  type: z.enum(SOURCE_TYPES),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  published_at: z.string().datetime({ offset: true }).nullable(),
  accessed_at: z.string().datetime({ offset: true }),
  archived_url: z.string().url().nullable(),
  supports: z.array(z.string().min(1)),
}).strict();

export const publicCorrectionSchema = z.object({
  schema_version: schemaVersion,
  id: publicEntityIdSchema('corr'),
  publication_id: publicEntityIdSchema('pub'),
  type: z.enum(CORRECTION_TYPES),
  published_at: z.string().datetime({ offset: true }),
  summary: z.string().min(1),
  impact: z.string().min(1),
  previous_revision: z.number().int().positive(),
  new_revision: z.number().int().min(2),
}).strict();

export const publicPublicationPathSchema = z.string().regex(/^\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/);

export const publicRedirectSchema = z.object({
  schema_version: schemaVersion,
  id: publicEntityIdSchema('redirect'),
  publication_id: publicEntityIdSchema('pub'),
  from_path: publicPublicationPathSchema,
  to_path: publicPublicationPathSchema,
  status_code: z.literal(308),
  effective_at: z.string().datetime({ offset: true }),
  reason: z.string().min(8),
}).strict().refine((value) => value.from_path !== value.to_path, { message: 'Redirect não pode apontar para si próprio.' });

export const publicTombstoneSchema = z.object({
  schema_version: schemaVersion,
  id: publicEntityIdSchema('tomb'),
  publication_id: publicEntityIdSchema('pub'),
  canonical_path: publicPublicationPathSchema,
  title: z.string().min(1),
  reason: z.string().min(8),
  impact: z.string().min(8),
  published_at: z.string().datetime({ offset: true }),
  original_published_at: z.string().datetime({ offset: true }),
  body_hidden: z.literal(true),
}).strict();

export const publicMediaSchema = z.object({
  schema_version: schemaVersion,
  id: publicEntityIdSchema('media'),
  type: z.enum(MEDIA_TYPES),
  alt: z.string().min(1),
  caption: z.string().min(1).nullable(),
  credit: z.string().min(1),
  license: z.string().min(1),
  derivatives: z
    .array(
      z.object({
        path: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        format: z.enum(['avif', 'webp', 'jpeg', 'png']),
        variant: z.string().min(1).optional(),
        mime_type: z.string().regex(/^image\/(?:avif|webp|jpeg|png)$/).optional(),
        bytes: z.number().int().positive().optional(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
      }).strict(),
    )
    .min(1),
}).strict();

export const publicStorySchema = z.object({
  schema_version: schemaVersion,
  id: publicEntityIdSchema('story'),
  slug: publicSlugSchema,
  title: z.string().min(1),
  status: z.enum(STORY_STATUSES),
  summary: z.string().min(1),
  started_at: z.string().date(),
  topics: z.array(publicSlugSchema).min(1),
  actors: z.array(z.string().min(1)),
  next_expected_event: z.string().date().nullable(),
}).strict();

export const publicAuthorSchema = z.object({
  schema_version: schemaVersion,
  id: publicEntityIdSchema('author'),
  nickname: z.string().min(1),
  slug: publicSlugSchema,
  role: z.enum(AUTHOR_ROLES),
  title: z.string().min(1),
  bio: z.string().min(1),
  status: z.enum(CATALOG_STATUSES),
  portrait: publicImageReferenceSchema,
}).strict();

export const publicChannelSchema = z.object({
  schema_version: schemaVersion,
  id: publicSlugSchema,
  name: z.string().min(1),
  slug: publicSlugSchema,
  question: z.string().min(1),
  description: z.string().min(1),
  periodicity: z.string().min(1),
  editor_id: publicSlugSchema,
  status: z.enum(CATALOG_STATUSES),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
}).strict();

export const publicTopicSchema = z.object({
  schema_version: schemaVersion,
  id: publicSlugSchema,
  name: z.string().min(1),
  slug: publicSlugSchema,
  description: z.string().min(1),
  status: z.enum(CATALOG_STATUSES),
}).strict();
