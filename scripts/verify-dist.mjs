import { lstat, readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const baseInput = process.env.SUBSOLO_BASE_PATH ?? '/';
const base = baseInput === '/' ? '/' : `/${baseInput.replace(/^\/+|\/+$/g, '')}`;
const violations = [];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) violations.push(`${relative(root, path)}: symlink não permitido`);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push({ path, stats });
  }
  return files;
};

const stripBase = (pathname) => {
  if (base === '/') return pathname;
  if (pathname === base || pathname === `${base}/`) return '/';
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length);
  return pathname;
};

const localTarget = (source, href) => {
  const clean = href.split('#', 1)[0].split('?', 1)[0];
  if (!clean || clean.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(clean)) return null;
  const pathname = stripBase(clean);
  const resolved = pathname.startsWith('/')
    ? join(root, pathname)
    : resolve(dirname(source), pathname);
  if (extname(resolved)) return resolved;
  return join(resolved, 'index.html');
};

let files;
try {
  files = await walk(root);
} catch (error) {
  console.error(`SUBSOLO_DIST_MISSING: ${root}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const fileSet = new Set(files.map(({ path }) => resolve(path)));
const entry = join(root, 'index.html');
if (!fileSet.has(entry)) violations.push('index.html deve existir no topo do artefato');
let totalSize = 0;
let htmlCount = 0;
for (const { path, stats } of files) {
  totalSize += stats.size;
  const name = relative(root, path).replaceAll('\\', '/');
  if (/\.map$/i.test(name))
    violations.push(`${name}: source map não permitido no artefato inicial`);
  if (/^\.env(?:\.|$)/i.test(name)) violations.push(`${name}: arquivo de ambiente não permitido`);
  if (extname(path).toLowerCase() !== '.html') continue;
  htmlCount += 1;
  const html = await readFile(path, 'utf8');
  if (!/^<!doctype html>/i.test(html.trimStart())) violations.push(`${name}: doctype ausente`);
  if (!/<title>[^<]+<\/title>/i.test(html)) violations.push(`${name}: title ausente`);
  const refreshTag =
    html.match(/<meta\b[^>]*http-equiv=["']refresh["'][^>]*>/i)?.[0] ??
    html.match(
      /<meta\b[^>]*content=(?:"[^"]*"|'[^']*')[^>]*http-equiv=["']refresh["'][^>]*>/i,
    )?.[0];
  const redirect = Boolean(refreshTag);
  if (!redirect && !/<html[^>]+lang=["']pt-BR["']/i.test(html))
    violations.push(`${name}: lang pt-BR ausente`);
  if (!redirect && !/<meta[^>]+name=["']viewport["']/i.test(html))
    violations.push(`${name}: viewport ausente`);
  if (redirect) {
    const refreshContent = refreshTag
      ?.match(/\bcontent=("([^"]*)"|'([^']*)')/i)
      ?.slice(2)
      .find((value) => value !== undefined);
    const refreshTarget = refreshContent
      ?.match(/(?:^|;)\s*url=(.+)$/i)?.[1]
      ?.trim()
      .replace(/^["']|["']$/g, '');
    const target = refreshTarget ? localTarget(path, refreshTarget) : null;
    if (!target || !fileSet.has(resolve(target)))
      violations.push(`${name}: destino local de redirect inválido`);
  }
  const cspTag =
    html.match(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i)?.[0] ??
    html.match(
      /<meta\b[^>]*content=(?:"[^"]*"|'[^']*')[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i,
    )?.[0];
  const csp = cspTag
    ?.match(/\bcontent=("([^"]*)"|'([^']*)')/i)
    ?.slice(2)
    .find((value) => value !== undefined);
  if (!redirect && !csp) violations.push(`${name}: CSP meta ausente`);
  else if (csp) {
    if (/unsafe-inline|(?:^|\s)'unsafe-eval'(?:\s|$)/i.test(csp))
      violations.push(`${name}: CSP contém relaxamento proibido`);
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]) {
      if (!csp.includes(directive)) violations.push(`${name}: CSP sem ${directive}`);
    }
  }
  if (
    !redirect &&
    !/<meta[^>]+name=["']referrer["'][^>]+content=["']strict-origin-when-cross-origin["']/i.test(
      html,
    ) &&
    !/<meta[^>]+content=["']strict-origin-when-cross-origin["'][^>]+name=["']referrer["']/i.test(
      html,
    )
  )
    violations.push(`${name}: referrer policy ausente`);
  if (!redirect) {
    if (!/<main[^>]+id=["']conteudo["']/i.test(html))
      violations.push(`${name}: main#conteudo ausente`);
    if (!/<a[^>]+class=["'][^"']*skip-link[^"']*["'][^>]+href=["']#conteudo["']/i.test(html))
      violations.push(`${name}: skip link ausente`);
  }
  const executableInline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(
    (match) => !/\bsrc=/.test(match[1]) && !/type=["']application\/ld\+json["']/i.test(match[1]),
  );
  if (executableInline.length) violations.push(`${name}: script executável inline`);
  if (
    /<script\b[^>]+type=["']application\/ld\+json["']/i.test(html) &&
    csp &&
    !/sha256-[A-Za-z0-9+/=]+/.test(csp)
  )
    violations.push(`${name}: JSON-LD sem hash CSP`);
  for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt=/.test(image[1])) violations.push(`${name}: img sem alt`);
    if (!/\bwidth=/.test(image[1]) || !/\bheight=/.test(image[1]))
      violations.push(`${name}: img sem dimensões`);
  }
  const attributes = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const href of attributes) {
    const target = localTarget(path, href);
    if (!target) continue;
    if (!fileSet.has(resolve(target)))
      violations.push(`${name}: referência interna ausente ${href}`);
  }
}
if (htmlCount === 0) violations.push('nenhum HTML encontrado');
if (totalSize > 1_000_000_000) violations.push(`artefato excede 1 GB: ${totalSize} bytes`);

if (violations.length > 0) {
  console.error('SUBSOLO_DIST_INVALID');
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(
  `Artefato estático válido: ${htmlCount} páginas, ${files.length} arquivos, ${totalSize} bytes.`,
);
