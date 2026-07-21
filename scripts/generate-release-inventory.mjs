import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const output = resolve(process.argv[2] ?? 'reports/prompt-20/source-inventory.json');
const excluded = new Set([
  relative(root, output).replaceAll('\\', '/'),
  'reports/prompt-20/diff-summary.json',
  'reports/prompt-20/changed-files.txt',
  'reports/prompt-20/package-inventory.json',
]);
const excludedSegments = new Set(['.git', 'node_modules', 'dist', '.astro', 'coverage', '.runtime']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (excludedSegments.has(entry.name)) continue;
    const path = join(directory, entry.name);
    const rel = relative(root, path).replaceAll('\\', '/');
    if (excluded.has(rel)) continue;
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error(`SUBSOLO_RELEASE_SYMLINK: ${rel}`);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) {
      const bytes = await readFile(path);
      files.push({
        path: rel,
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        category: rel.split('/')[0] || 'root',
      });
    }
  }
  return files;
}

const files = await walk(root);
const categories = {};
let totalBytes = 0;
for (const file of files) {
  totalBytes += file.bytes;
  const current = categories[file.category] ?? { files: 0, bytes: 0 };
  current.files += 1;
  current.bytes += file.bytes;
  categories[file.category] = current;
}
const result = {
  schema_version: 1,
  product_version: JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version,
  generated_at: '2026-07-21T00:00:00Z',
  file_count: files.length,
  total_bytes: totalBytes,
  categories,
  files,
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Inventário gerado: ${files.length} arquivos, ${totalBytes} bytes.`);
