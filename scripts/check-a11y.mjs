import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  htmlAttributes,
  parseArgs,
  projectRoot,
  relativePosix,
  walkFiles,
} from './hardening-utils.mjs';

const hex = (value) => {
  const raw = value.trim().replace('#', '');
  const expanded = raw.length === 3 ? [...raw].map((char) => char + char).join('') : raw;
  return [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16) / 255);
};
const luminance = (value) => {
  const components = hex(value).map((component) =>
    component <= 0.03928 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * components[0] + 0.7152 * components[1] + 0.0722 * components[2];
};
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
const tokenBlock = (css, selector) => {
  const match = css.match(
    new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`),
  );
  if (!match) return {};
  return Object.fromEntries(
    [...match[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,8})\s*;/gi)].map((item) => [
      item[1],
      item[2],
    ]),
  );
};

const checkSource = async (root) => {
  const issues = [];
  const layout = await readFile(resolve(root, 'src/layouts/JornalConcretoLayout.astro'), 'utf8');
  const css = await readFile(resolve(root, 'src/styles/jornal-concreto.css'), 'utf8');
  const tokens = await readFile(resolve(root, 'src/styles/tokens.css'), 'utf8');
  if (!/<html[^>]+lang="pt-BR"/.test(layout)) issues.push('Layout sem lang pt-BR.');
  if (!/class="skip-link" href="#conteudo"/.test(layout))
    issues.push('Skip link para #conteudo ausente.');
  if (!/:focus-visible/.test(css) || /outline\s*:\s*(?:0|none)/i.test(css))
    issues.push('Indicador de foco visível ausente ou removido.');
  if (!/@media \(prefers-reduced-motion: reduce\)/.test(css))
    issues.push('Tratamento de movimento reduzido ausente.');
  if (!/@media \(forced-colors: active\)/.test(css))
    issues.push('Tratamento de cores forçadas ausente.');
  if (!/min-block-size:\s*2\.75rem/.test(css))
    issues.push('Alvos de controles abaixo do orçamento definido.');

  const pages = (await walkFiles(resolve(root, 'src/pages'))).filter(({ path }) =>
    path.endsWith('.astro'),
  );
  for (const page of pages) {
    const source = await readFile(page.path, 'utf8');
    const name = relativePosix(root, page.path);
    if (!/<main\b[^>]*id="conteudo"/.test(source) && !/Astro\.redirect/.test(source))
      issues.push(`${name}: landmark main#conteudo ausente.`);
    if (/tabindex=["']?[1-9]/i.test(source)) issues.push(`${name}: tabindex positivo.`);
    if (/\bautofocus\b|\bautoplay\b/i.test(source))
      issues.push(`${name}: autofocus/autoplay proibido.`);
    for (const button of source.matchAll(/<button\b([^>]*)>/gi))
      if (!/\btype=/.test(button[1])) issues.push(`${name}: button sem type explícito.`);
  }
  const components = (await walkFiles(resolve(root, 'src/components'))).filter(({ path }) =>
    path.endsWith('.astro'),
  );
  for (const component of components) {
    const source = await readFile(component.path, 'utf8');
    const name = relativePosix(root, component.path);
    if (/on:click=|onclick=/.test(source) && !/<(?:button|a)\b/.test(source))
      issues.push(`${name}: evento de clique sem elemento interativo comprovado.`);
    for (const image of source.matchAll(/<img\b([^>]*)>/gi)) {
      if (!/\balt=/.test(image[1])) issues.push(`${name}: imagem sem alt.`);
      if (!/\bwidth=/.test(image[1]) || !/\bheight=/.test(image[1]))
        issues.push(`${name}: imagem sem dimensões.`);
    }
  }

  const light = tokenBlock(tokens, ':root');
  const dark = tokenBlock(tokens, "html[data-theme='dark']");
  for (const [theme, values] of [
    ['light', light],
    ['dark', dark],
  ]) {
    for (const key of ['ink', 'muted', 'red', 'blue', 'green', 'violet']) {
      if (!values[key] || !values.paper) {
        issues.push(`Token ${theme}.${key}/paper ausente.`);
        continue;
      }
      const ratio = contrast(values[key], values.paper);
      const minimum = key === 'muted' ? 4.5 : 3;
      if (ratio < minimum)
        issues.push(`Contraste ${theme}.${key}/paper ${ratio.toFixed(2)} < ${minimum}.`);
    }
  }
  return { issues, pageSources: pages.length, componentSources: components.length };
};

const checkSite = async (site) => {
  const issues = [];
  const htmlFiles = (await walkFiles(site)).filter(({ path }) => path.endsWith('.html'));
  for (const file of htmlFiles) {
    const html = await readFile(file.path, 'utf8');
    const name = relativePosix(site, file.path);
    const redirect = /http-equiv=["']refresh/i.test(html);
    if (!redirect && !/<html[^>]+lang=["']pt-BR["']/i.test(html))
      issues.push(`${name}: lang pt-BR ausente.`);
    if (!redirect) {
      const mains = htmlAttributes(html, 'main');
      if (mains.length !== 1 || mains[0].attrs.id !== 'conteudo')
        issues.push(`${name}: deve conter exatamente um main#conteudo.`);
      const h1 = htmlAttributes(html, 'h1');
      if (h1.length !== 1)
        issues.push(`${name}: deve conter exatamente um h1, encontrou ${h1.length}.`);
      if (!/<a[^>]+class=["'][^"']*skip-link[^"']*["'][^>]+href=["']#conteudo["']/i.test(html))
        issues.push(`${name}: skip link ausente.`);
    }
    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length)
      issues.push(`${name}: IDs duplicados ${[...new Set(duplicates)].join(', ')}.`);
    const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
    for (let index = 1; index < headings.length; index += 1)
      if (headings[index] > headings[index - 1] + 1)
        issues.push(`${name}: salto de heading h${headings[index - 1]} → h${headings[index]}.`);
    for (const image of htmlAttributes(html, 'img')) {
      if (!Object.hasOwn(image.attrs, 'alt')) issues.push(`${name}: img sem alt.`);
      if (!image.attrs.width || !image.attrs.height) issues.push(`${name}: img sem width/height.`);
    }
    for (const link of htmlAttributes(html, 'a'))
      if (link.attrs.target === '_blank' && !/\bnoopener\b/.test(link.attrs.rel ?? ''))
        issues.push(`${name}: target blank sem noopener.`);
    if (/tabindex=["']?[1-9]/i.test(html)) issues.push(`${name}: tabindex positivo.`);
    if (/<(?:audio|video)\b[^>]*\bautoplay\b/i.test(html)) issues.push(`${name}: mídia autoplay.`);
    const inputs = [
      ...htmlAttributes(html, 'input'),
      ...htmlAttributes(html, 'select'),
      ...htmlAttributes(html, 'textarea'),
    ];
    for (const control of inputs) {
      const id = control.attrs.id;
      const named = control.attrs['aria-label'] || control.attrs['aria-labelledby'];
      const wrapped =
        html.slice(Math.max(0, control.index - 300), control.index).lastIndexOf('<label') >
        html.slice(Math.max(0, control.index - 300), control.index).lastIndexOf('</label>');
      const explicit =
        id &&
        new RegExp(`<label[^>]+for=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(
          html,
        );
      if (!named && !wrapped && !explicit) issues.push(`${name}: controle sem rótulo acessível.`);
    }
  }
  return { issues, htmlFiles: htmlFiles.length };
};

export const checkAccessibility = async ({ root = projectRoot, site = null } = {}) => {
  const source = await checkSource(root);
  let rendered = { issues: [], htmlFiles: 0 };
  if (site) {
    try {
      await access(site);
      rendered = await checkSite(site);
    } catch {
      rendered.issues.push(`Site para auditoria não existe: ${site}`);
    }
  }
  const issues = [...source.issues, ...rendered.issues];
  return {
    status: issues.length ? 'fail' : 'pass',
    issues,
    source,
    rendered,
    standardTarget:
      'WCAG 2.2 AA — automated/static subset; manual assistive-technology review remains a release gate.',
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root ?? projectRoot);
  const site = args.site ? resolve(args.site) : null;
  const report = await checkAccessibility({ root, site });
  if (args.report) await writeFile(resolve(args.report), `${JSON.stringify(report, null, 2)}\n`);
  if (report.issues.length) {
    console.error('SUBSOLO_A11Y_INVALID');
    console.error(report.issues.join('\n'));
    process.exit(1);
  }
  console.log(
    `Acessibilidade estática aprovada: ${report.source.pageSources} páginas-fonte${site ? ` e ${report.rendered.htmlFiles} HTMLs` : ''}.`,
  );
}
