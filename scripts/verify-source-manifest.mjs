import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = resolve('references/source-materials');
const manifest = JSON.parse(await readFile(resolve(base, 'manifest.json'), 'utf8'));
const failures = [];
for (const entry of manifest.files) {
  const bytes = await readFile(resolve(base, entry.file));
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== entry.sha256) failures.push(`${entry.file}: checksum divergente`);
  if (bytes.length !== entry.size_bytes) failures.push(`${entry.file}: tamanho divergente`);
}
if (failures.length) {
  console.error('SUBSOLO_SOURCE_MANIFEST_INVALID');
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${manifest.files.length} fontes verificadas por SHA-256.`);
