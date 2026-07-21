import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Astro aceita site e base por ambiente', async () => {
  const config = await read('astro.config.mjs');
  assert.match(config, /SUBSOLO_SITE_URL/);
  assert.match(config, /SUBSOLO_BASE_PATH/);
});

test('componentes estruturais aplicam base path', async () => {
  const files = [
    'src/layouts/JornalConcretoLayout.astro',
    'src/components/navigation/PrimaryNav.astro',
    'src/components/layout/Masthead.astro',
    'src/components/article/ArticleCard.astro',
  ];
  for (const file of files) {
    const content = await read(file);
    assert.match(content, /withBasePath/, file);
  }
});
