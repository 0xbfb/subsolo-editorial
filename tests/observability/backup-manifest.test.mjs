import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = new URL('../..', import.meta.url);
const files = [
  'postgres.dump',
  'n8n_data.tar.gz',
  'freshrss_data.tar.gz',
  'freshrss_extensions.tar.gz',
  'uptime_kuma_data.tar.gz',
  'runtime.json',
];
test('manifest creates and validates a complete backup set', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'subsolo-backup-manifest-'));
  try {
    for (const file of files)
      await writeFile(
        join(dir, file),
        file === 'postgres.dump' ? Buffer.from('PGDMPfixture') : Buffer.from(`fixture:${file}`),
      );
    let result = spawnSync(
      process.execPath,
      [
        'scripts/backup-manifest.mjs',
        'create',
        '--directory',
        dir,
        '--created-at',
        '2026-07-20T20:00:00Z',
        '--product-version',
        '0.9.0-dev',
      ],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    result = spawnSync(
      process.execPath,
      ['scripts/backup-manifest.mjs', 'validate', '--directory', dir],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).components, 6);
    const manifest = JSON.parse(await readFile(join(dir, 'backup-manifest.json'), 'utf8'));
    assert.equal(manifest.encrypted_transport_required, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('manifest rejects missing component', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'subsolo-backup-missing-'));
  try {
    await writeFile(join(dir, 'postgres.dump'), 'PGDMP');
    const result = spawnSync(
      process.execPath,
      ['scripts/backup-manifest.mjs', 'create', '--directory', dir],
      { cwd: root, encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
