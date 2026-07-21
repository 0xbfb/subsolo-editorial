import { createHash } from 'node:crypto';
import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const command = args[0];
const value = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const fail = (message) => {
  console.error(`SUBSOLO_BACKUP_MANIFEST_INVALID: ${message}`);
  process.exit(1);
};
const sha256 = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
const expected = [
  'postgres.dump',
  'n8n_data.tar.gz',
  'freshrss_data.tar.gz',
  'freshrss_extensions.tar.gz',
  'uptime_kuma_data.tar.gz',
  'runtime.json',
];

if (command === 'create') {
  const directory = resolve(value('--directory') ?? '');
  const createdAt = value('--created-at') ?? new Date().toISOString();
  const components = [];
  for (const name of expected) {
    const path = resolve(directory, name);
    let info;
    try {
      info = await stat(path);
    } catch {
      fail(`componente ausente: ${name}`);
    }
    if (!info.isFile() || info.size === 0) fail(`componente vazio: ${name}`);
    components.push({ name, bytes: info.size, sha256: await sha256(path) });
  }
  const manifest = {
    schema_version: 1,
    backup_id: `backup_${createdAt.replace(/[^0-9]/g, '').slice(0, 14)}Z`,
    created_at: createdAt,
    product_version: value('--product-version') ?? 'unknown',
    encrypted_transport_required: true,
    rpo_hours: 24,
    rto_hours: 4,
    components,
  };
  await writeFile(
    resolve(directory, 'backup-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(JSON.stringify(manifest));
} else if (command === 'validate') {
  const directory = resolve(value('--directory') ?? '');
  const manifestPath = resolve(directory, 'backup-manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    fail('backup-manifest.json ausente ou inválido');
  }
  if (manifest.schema_version !== 1 || manifest.encrypted_transport_required !== true)
    fail('versão ou política de criptografia inválida');
  const names = new Set(manifest.components?.map((item) => item.name));
  for (const name of expected) if (!names.has(name)) fail(`manifesto não contém ${name}`);
  for (const component of manifest.components) {
    const path = resolve(directory, basename(component.name));
    const info = await stat(path);
    if (info.size !== component.bytes) fail(`tamanho divergente: ${component.name}`);
    if ((await sha256(path)) !== component.sha256) fail(`checksum divergente: ${component.name}`);
  }
  const unexpected = (await readdir(directory)).filter(
    (name) => !expected.includes(name) && name !== 'backup-manifest.json',
  );
  if (unexpected.length) fail(`arquivos inesperados: ${unexpected.join(', ')}`);
  console.log(
    JSON.stringify({
      valid: true,
      backup_id: manifest.backup_id,
      components: manifest.components.length,
      bytes: manifest.components.reduce((sum, item) => sum + item.bytes, 0),
    }),
  );
} else fail('use create ou validate');
