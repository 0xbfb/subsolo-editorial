import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

export async function verifySourceManifest({ root = process.cwd() } = {}) {
  const sourceRoot = resolve(root, 'references/source-materials');
  const manifest = await readJson(resolve(sourceRoot, 'manifest.json'));
  const externalManifestPath = resolve(root, '.subsolo-external-artifacts.json');

  let externalManifest = null;
  try {
    externalManifest = await readJson(externalManifestPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const failures = [];
  const omitted = new Map();

  if (externalManifest) {
    if (!Array.isArray(externalManifest.omitted)) {
      failures.push('.subsolo-external-artifacts.json: omitted deve ser uma lista');
    } else {
      if (externalManifest.omitted_count !== externalManifest.omitted.length) {
        failures.push('.subsolo-external-artifacts.json: omitted_count divergente');
      }
      for (const entry of externalManifest.omitted) {
        if (!entry?.path || omitted.has(entry.path)) {
          failures.push('.subsolo-external-artifacts.json: caminho omitido ausente ou duplicado');
          continue;
        }
        omitted.set(entry.path, entry);
      }
    }
  }

  let verified = 0;
  let externallyPreserved = 0;

  for (const entry of manifest.files) {
    const relativePath = `references/source-materials/${entry.file}`;
    try {
      const bytes = await readFile(resolve(sourceRoot, entry.file));
      const hash = sha256(bytes);
      if (hash !== entry.sha256) failures.push(`${entry.file}: checksum divergente`);
      if (bytes.length !== entry.size_bytes) failures.push(`${entry.file}: tamanho divergente`);
      verified += 1;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      const external = omitted.get(relativePath);
      if (!external) {
        failures.push(`${entry.file}: arquivo ausente`);
        continue;
      }
      if (external.sha256 !== entry.sha256)
        failures.push(`${entry.file}: checksum externo divergente`);
      if (external.size_bytes !== entry.size_bytes)
        failures.push(`${entry.file}: tamanho externo divergente`);
      externallyPreserved += 1;
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    verified,
    externallyPreserved,
    total: manifest.files.length,
  };
}
