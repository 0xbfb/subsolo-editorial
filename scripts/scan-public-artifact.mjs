import { lstat, readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const textExtensions = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg', '.webmanifest', '.md']);
const forbiddenFiles = [/(^|\/)\.env(?:\.|$)/i, /credentials?.*\.json$/i, /service[-_]?account.*\.json$/i, /(^|\/)\.git(\/|$)/i];
const forbiddenContent = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/],
  ['github-fine-grained-token', /\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['google-client-secret', /\bGOCSPX-[0-9A-Za-z_-]{20,}\b/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private-editorial-marker', /\b(?:SUBSOLO_PRIVATE|NOTA_INTERNA|FONTE_CONFIDENCIAL|NAO_PUBLICAR|NÃO_PUBLICAR)\b/i],
  ['private-google-link', /https:\/\/(?:docs|drive)\.google\.com\/(?:document|spreadsheets|file)\/d\//i],
];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) throw new Error(`SUBSOLO_ARTIFACT_SYMLINK: ${relative(root, path)}`);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push({ path, stats });
  }
  return files;
};

let files;
try {
  files = await walk(root);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const violations = [];
for (const { path, stats } of files) {
  const name = relative(root, path).replaceAll('\\', '/');
  for (const pattern of forbiddenFiles) if (pattern.test(name)) violations.push(`${name}: arquivo proibido`);
  if (stats.nlink > 1) violations.push(`${name}: hard link não permitido no artefato`);
  if (!textExtensions.has(extname(path).toLowerCase()) || stats.size > 5_000_000) continue;
  const content = await readFile(path, 'utf8');
  for (const [code, pattern] of forbiddenContent) {
    if (pattern.test(content)) violations.push(`${name}: padrão proibido ${code}`);
  }
}

if (violations.length > 0) {
  console.error('SUBSOLO_PUBLIC_ARTIFACT_REJECTED');
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(`Artefato público aprovado: ${files.length} arquivos sem segredos ou marcadores privados detectados.`);
