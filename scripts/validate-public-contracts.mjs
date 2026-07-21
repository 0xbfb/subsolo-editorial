import { readFile, readdir } from 'node:fs/promises';

const schemaRoot = 'schemas/1.0.0';
const fixtureRoot = 'fixtures/public/valid';
const fail = (code, message) => {
  console.error(`${code}: ${message}`);
  process.exitCode = 1;
};
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));

const typeMatches = (value, type) =>
  type === 'null'
    ? value === null
    : type === 'array'
      ? Array.isArray(value)
      : type === 'object'
        ? typeof value === 'object' && value !== null && !Array.isArray(value)
        : type === 'integer'
          ? Number.isInteger(value)
          : typeof value === type;
const validate = (value, schema, path = '$') => {
  const errors = [];
  if (schema.anyOf) {
    if (!schema.anyOf.some((candidate) => validate(value, candidate, path).length === 0))
      errors.push(`${path}: nenhum anyOf aceito`);
    return errors;
  }
  if ('const' in schema && value !== schema.const) errors.push(`${path}: const`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: enum`);
  if (schema.type && !typeMatches(value, schema.type))
    return [...errors, `${path}: type ${schema.type}`];
  if (typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) errors.push(`${path}: minLength`);
    if (schema.maxLength && value.length > schema.maxLength) errors.push(`${path}: maxLength`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: pattern`);
    if (schema.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value))
      errors.push(`${path}: date`);
    if (schema.format === 'date-time' && Number.isNaN(Date.parse(value)))
      errors.push(`${path}: date-time`);
    if (schema.format === 'uri') {
      try {
        new URL(value);
      } catch {
        errors.push(`${path}: uri`);
      }
    }
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum)
    errors.push(`${path}: minimum`);
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) errors.push(`${path}: minItems`);
    if (
      schema.uniqueItems &&
      new Set(value.map((item) => JSON.stringify(item))).size !== value.length
    )
      errors.push(`${path}: uniqueItems`);
    if (schema.items)
      value.forEach((item, index) =>
        errors.push(...validate(item, schema.items, `${path}[${index}]`)),
      );
  }
  if (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? [])
      if (!(key in value)) errors.push(`${path}.${key}: required`);
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key])
        errors.push(...validate(item, schema.properties[key], `${path}.${key}`));
      else if (schema.additionalProperties === false)
        errors.push(`${path}.${key}: additionalProperties`);
    }
  }
  return errors;
};

const mappings = {
  'publication.schema.json': ['publication.json'],
  'edition.schema.json': ['edition.json'],
  'author.schema.json': ['authors.json'],
  'channel.schema.json': ['channel.json'],
  'topic.schema.json': ['topics.json'],
  'story.schema.json': ['story.json'],
  'source.schema.json': ['sources.json'],
  'correction.schema.json': ['corrections.json'],
  'media.schema.json': ['media.json'],
  'package-manifest.schema.json': ['package-manifest.json'],
  'publication-run.schema.json': ['publication-run.json'],
  'redirect.schema.json': ['redirect.json'],
  'tombstone.schema.json': ['tombstone.json'],
};

const schemaFiles = (await readdir(schemaRoot))
  .filter((name) => name.endsWith('.schema.json'))
  .sort();
if (schemaFiles.length !== 13)
  fail('SUBSOLO_SCHEMA_COUNT_INVALID', `Esperado 13; recebido ${schemaFiles.length}.`);
for (const name of schemaFiles) {
  const schema = await json(`${schemaRoot}/${name}`);
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema')
    fail('SUBSOLO_SCHEMA_DRAFT_INVALID', name);
  if (schema.additionalProperties !== false) fail('SUBSOLO_SCHEMA_PROPERTIES_OPEN', name);
  for (const fixture of mappings[name] ?? []) {
    const loaded = await json(`${fixtureRoot}/${fixture}`);
    const values = Array.isArray(loaded) ? loaded : [loaded];
    values.forEach((value, index) => {
      const errors = validate(value, schema);
      if (errors.length)
        fail(
          'SUBSOLO_SCHEMA_FIXTURE_INVALID',
          `${name}/${fixture}[${index}]: ${errors.join(', ')}`,
        );
    });
  }
}
if (!process.exitCode)
  console.log(
    JSON.stringify({ status: 'passed', schemas: schemaFiles.length, draft: '2020-12' }, null, 2),
  );
