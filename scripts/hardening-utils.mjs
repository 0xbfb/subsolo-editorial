import { lstat, readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

export const projectRoot = resolve(new URL('..', import.meta.url).pathname);

export const parseArgs = (argv) => {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      result._.push(token);
      continue;
    }
    const [name, inline] = token.slice(2).split('=', 2);
    if (inline !== undefined) result[name] = inline;
    else if (argv[index + 1] && !argv[index + 1].startsWith('--')) result[name] = argv[++index];
    else result[name] = true;
  }
  return result;
};

export const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

export const walkFiles = async (root, options = {}) => {
  const excluded = new Set(
    options.excludeDirectories ?? ['.git', 'node_modules', 'dist', '.astro', '.cache', '.tmp'],
  );
  const files = [];
  const visit = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && excluded.has(entry.name)) continue;
      const path = join(directory, entry.name);
      const stats = await lstat(path);
      if (stats.isSymbolicLink()) {
        files.push({ path, stats, symlink: true });
      } else if (entry.isDirectory()) await visit(path);
      else files.push({ path, stats, symlink: false });
    }
  };
  await visit(root);
  return files;
};

export const isProbablyBinary = (buffer) => {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  if (sample.includes(0)) return true;
  let control = 0;
  for (const byte of sample) if (byte < 9 || (byte > 13 && byte < 32)) control += 1;
  return sample.length > 0 && control / sample.length > 0.12;
};

export const htmlAttributes = (html, tagName) => {
  const tags = [...html.matchAll(new RegExp(`<${tagName}\\b([^>]*)>`, 'gi'))];
  return tags.map((match) => {
    const attrs = {};
    for (const attr of match[1].matchAll(
      /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
    )) {
      attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? '';
    }
    return { raw: match[0], attrs, index: match.index ?? 0 };
  });
};

export const localAssetPath = (siteRoot, htmlPath, reference) => {
  const clean = reference.split('#', 1)[0].split('?', 1)[0];
  if (!clean || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(clean)) return null;
  return clean.startsWith('/') ? join(siteRoot, clean) : resolve(dirname(htmlPath), clean);
};

export const gzipBytes = (value) => gzipSync(value, { level: 9 }).byteLength;
export const toPosix = (value) => value.replaceAll('\\', '/');
export const relativePosix = (root, path) => toPosix(relative(root, path));
export const textExtensions = new Set([
  '.astro',
  '.css',
  '.csv',
  '.env',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.mts',
  '.py',
  '.sh',
  '.sql',
  '.svg',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);
export const isTextCandidate = (path) =>
  textExtensions.has(extname(path).toLowerCase()) ||
  ['Dockerfile', 'AGENTS.md', 'README.md', 'SECURITY.md', 'CHANGELOG.md'].includes(
    path.split('/').at(-1),
  );
