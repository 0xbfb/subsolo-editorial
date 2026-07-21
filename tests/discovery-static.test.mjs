import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
test('busca integra Pagefind com fallback no archive-index', async () => { const component = await read('src/components/discovery/SearchInterface.astro'); const script = await read('public/assets/search.js'); assert.match(script, /pagefind\.search/); assert.match(component, /archive-index\.json/); assert.match(component, /data-search-status/); assert.match(component, /searchScriptHref/); assert.doesNotMatch(component, /is:inline/); });
test('páginas indexáveis delimitam o corpo e filtros', async () => { const article = await read('src/pages/[year]/[month]/[day]/[slug].astro'); const record = await read('src/pages/arquivo/registros/[slug].astro'); for (const source of [article, record]) { assert.match(source, /data-pagefind-body/); assert.match(source, /PagefindMetadata/); } });
test('arquivo oferece paginação e navegação temporal', async () => { const source = await read('src/pages/arquivo/index.astro'); assert.match(source, /Pagination/); assert.match(source, /archive-date-grid/); });
test('build executa Pagefind depois do Astro', async () => { const pkg = JSON.parse(await read('package.json')); assert.match(pkg.scripts.build, /astro build.*pagefind/); assert.equal(pkg.devDependencies.pagefind, '1.5.2'); });
