import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url);
const text = async (path) => readFile(new URL(path, root), 'utf8');

const walk = async (dir) => {
  const absolute = new URL(dir, root);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(`${relative}/`)));
    else files.push(relative);
  }
  return files;
};

test('Jornal Concreto usa tokens e componentes em vez de CSS inline', async () => {
  const layout = await text('src/layouts/JornalConcretoLayout.astro');
  const css = await text('src/styles/jornal-concreto.css');
  const tokens = await text('src/styles/tokens.css');
  assert.match(layout, /import '\.\.\/styles\/jornal-concreto\.css'/);
  assert.doesNotMatch(layout, /<style>/);
  assert.match(css, /@import '\.\/tokens\.css'/);
  assert.match(tokens, /--paper:/);
  assert.match(tokens, /html\[data-theme='dark'\]/);
  assert.doesNotMatch(css + tokens, /https?:\/\//);
});

test('manchete principal não recebe sublinhado e títulos secundários recebem', async () => {
  const css = await text('src/styles/jornal-concreto.css');
  const hero = await text('src/components/home/HomeHero.astro');
  const card = await text('src/components/editorial/StorySummary.astro');
  assert.match(css, /\.hero-headline \{ text-decoration: none; \}/);
  assert.match(css, /\.story-title,[\s\S]*\.channel-card__title \{ text-decoration: underline;/);
  assert.match(hero, /class="hero-headline"/);
  assert.doesNotMatch(hero, /hero-headline--static/);
  assert.match(card, /story-title/);
});

test('conteúdo editorial da home está fora dos componentes', async () => {
  const fixture = JSON.parse(await text('src/data/fixtures/jornal-concreto-home.json'));
  const home = await text('src/pages/index.astro');
  assert.equal(
    fixture.hero.title,
    'A cidade terceirizou o relógio — e agora ninguém sabe quem responde pelo atraso',
  );
  assert.match(home, /parseHomePageData\(homeFixture\)/);
  assert.doesNotMatch(home, /A cidade terceirizou/);
  assert.doesNotMatch(home, /Doze acontecimentos/);
});

test('não reintroduz mensagens de protótipo no código público', async () => {
  const files = (await walk('src/')).filter((file) => /\.(astro|ts|json|css)$/.test(file));
  const forbidden = [
    'Protótipo navegável',
    'conteúdo fictício',
    'tema 02 — Jornal Concreto',
    'modelos navegáveis',
    'páginas internas deste pacote',
  ];
  for (const file of files) {
    const content = await text(file);
    for (const phrase of forbidden)
      assert.equal(content.includes(phrase), false, `${phrase} em ${file}`);
  }
});

test('tema é persistido, sincronizado, progressivo e compatível com CSP', async () => {
  const layout = await text('src/layouts/JornalConcretoLayout.astro');
  const controller = await text('src/components/layout/ThemeController.astro');
  const script = await text('public/assets/theme.js');
  const css = await text('src/styles/jornal-concreto.css');
  assert.match(layout, /<ThemeController \/>/);
  assert.match(layout, /Content-Security-Policy/);
  assert.match(controller, /assets\/theme\.js/);
  assert.match(script, /localStorage\.getItem\('subsolo-theme'\)/);
  assert.match(script, /classList\.add\('js'\)/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /localStorage\.setItem\('subsolo-theme'/);
  assert.doesNotMatch(layout + controller, /is:inline/);
  assert.match(css, /\.theme-toggle \{[\s\S]*display: none;/);
  assert.match(css, /\.js \.theme-toggle \{ display: inline-block; \}/);
});

test('rota interna de inventário existe fora da navegação pública', async () => {
  const page = await text('src/pages/__design/jornal-concreto.astro');
  const fixture = JSON.parse(await text('src/data/fixtures/jornal-concreto-home.json'));
  assert.match(page, /Inventário interno/);
  assert.equal(
    fixture.navigation.some((item) => item.href.includes('__design')),
    false,
  );
});
