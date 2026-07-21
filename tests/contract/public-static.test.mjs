import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

const schemaCatalog = JSON.parse(await readFile('schemas/catalog.json', 'utf8'));
const contentConfig = await readFile('src/content.config.ts', 'utf8');
const domainContract = await readFile('src/lib/domain/public-contract.ts', 'utf8');
const zodSchemas = await readFile('src/lib/presentation/public-zod-schemas.ts', 'utf8');
const publication = await readFile('fixtures/public/valid/publication.md', 'utf8');
const unsafe = await readFile('fixtures/public/invalid/publication-unsafe-html.md', 'utf8');
const privateField = await readFile('fixtures/public/invalid/publication-private-field.md', 'utf8');

test('catálogo declara treze schemas públicos na versão 1.0.0', () => {
  assert.equal(schemaCatalog.schema_version, '1.0.0');
  assert.equal(schemaCatalog.schemas.length, 13);
});

test('Astro usa loaders atuais e Zod sem contaminar o domínio', () => {
  assert.match(contentConfig, /from 'astro\/loaders'/);
  assert.match(zodSchemas, /from 'astro\/zod'/);
  assert.match(zodSchemas, /PUBLICATION_TYPES/);
  assert.match(zodSchemas, /PUBLIC_SCHEMA_VERSION/);
  assert.ok((zodSchemas.match(/\.strict\(\)/g) ?? []).length >= 13);
  for (const schema of [
    'publicPublicationSchema',
    'publicEditionSchema',
    'publicSourceSchema',
    'publicCorrectionSchema',
    'publicMediaSchema',
    'publicStorySchema',
    'publicAuthorSchema',
    'publicChannelSchema',
    'publicTopicSchema',
    'publicRedirectSchema',
    'publicTombstoneSchema',
  ])
    assert.match(zodSchemas, new RegExp(`export const ${schema}`));
  assert.doesNotMatch(domainContract, /astro:/);
});

test('fixture pública contém front matter e blocos permitidos', () => {
  assert.ok(publication.startsWith('---\n'));
  assert.match(publication, /:::fact/);
  assert.match(publication, /:::why-it-matters/);
});

test('fixture insegura exercita detecção de script', () => assert.match(unsafe, /<script>/));

test('fixture privada exercita rejeição de campos desconhecidos', () =>
  assert.match(privateField, /internal_note/));
