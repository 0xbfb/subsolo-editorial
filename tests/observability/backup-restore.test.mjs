import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const project = new URL('../..', import.meta.url);
const run = (args, env) =>
  spawnSync('sh', args, { cwd: project, encoding: 'utf8', env: { ...process.env, ...env } });

test('backup apply produces only encrypted portable artifacts and restore test succeeds', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'subsolo-backup-e2e-'));
  try {
    const bin = join(temp, 'bin');
    const output = join(temp, 'backups');
    await mkdir(bin);
    await mkdir(output);
    const docker = join(bin, 'docker');
    await writeFile(
      docker,
      `#!/bin/sh
set -eu
if [ "\${1:-}" = compose ] && [ "\${2:-}" = version ]; then echo 'Docker Compose version v2.99.0'; exit 0; fi
all="$*"
case "$all" in
  *"pg_dump"*) printf 'PGDMPfixture-backup'; exit 0 ;;
esac
if [ "\${1:-}" = run ]; then
  target=''; previous=''
  for arg in "$@"; do
    if [ "$previous" = '-v' ]; then case "$arg" in *:/backup) target="\${arg%:/backup}" ;; esac; fi
    previous="$arg"
  done
  name=''
  case "$all" in
    *n8n_data.tar.gz*) name=n8n_data.tar.gz ;;
    *freshrss_data.tar.gz*) name=freshrss_data.tar.gz ;;
    *freshrss_extensions.tar.gz*) name=freshrss_extensions.tar.gz ;;
    *uptime_kuma_data.tar.gz*) name=uptime_kuma_data.tar.gz ;;
  esac
  [ -n "$target" ] && [ -n "$name" ] || exit 3
  work="\${TMPDIR:-/tmp}/fake-volume-$$"; mkdir -p "$work"; printf 'fixture:%s\n' "$name" > "$work/data.txt"; tar -czf "$target/$name" -C "$work" .; rm -rf "$work"; exit 0
fi
exit 0
`,
    );
    await chmod(docker, 0o755);
    const envFile = join(temp, 'infra.env');
    await writeFile(
      envFile,
      `COMPOSE_PROJECT_NAME=subsolo_test
SUBSOLO_TIMEZONE=America/Sao_Paulo
POSTGRES_DB=subsolo_n8n
POSTGRES_USER=subsolo_n8n
POSTGRES_PASSWORD=test-password
N8N_ENCRYPTION_KEY=test-encryption-key-12345678901234567890
SEARXNG_SECRET=test-searxng-secret
SUBSOLO_BACKUP_RETENTION_DAYS=14
`,
    );
    const passphrase = join(temp, 'passphrase');
    await writeFile(passphrase, 'fixture-passphrase-very-long\n');
    await chmod(passphrase, 0o600);
    const env = {
      PATH: `${bin}:${process.env.PATH}`,
      SUBSOLO_DOCKER_BIN: docker,
      SUBSOLO_ENV_FILE: envFile,
      SUBSOLO_BACKUP_TIMESTAMP: '20260720T230000Z',
    };
    const backup = run(
      ['infra/scripts/backup.sh', '--apply', '--output', output, '--passphrase-file', passphrase],
      env,
    );
    assert.equal(backup.status, 0, `${backup.stdout}\n${backup.stderr}`);
    const files = (await readdir(output)).sort();
    assert.deepEqual(files, [
      'subsolo-backup-20260720T230000Z.tar.gz.enc',
      'subsolo-backup-20260720T230000Z.tar.gz.enc.metadata.json',
      'subsolo-backup-20260720T230000Z.tar.gz.enc.sha256',
    ]);
    const encrypted = join(output, files[0]);
    const raw = await readFile(encrypted);
    assert.equal(raw.includes(Buffer.from('POSTGRES_PASSWORD')), false);
    const report = join(temp, 'restore-report.json');
    const restore = run(
      [
        'infra/scripts/restore.sh',
        '--test',
        '--backup-file',
        encrypted,
        '--passphrase-file',
        passphrase,
        '--report',
        report,
      ],
      env,
    );
    assert.equal(restore.status, 0, `${restore.stdout}\n${restore.stderr}`);
    const parsed = JSON.parse(await readFile(report, 'utf8'));
    assert.equal(parsed.status, 'restorable');
    assert.equal(parsed.volume_archives_extracted, 4);
    assert.equal(parsed.postgres_header_valid, true);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('restore rejects corrupted encrypted artifact', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'subsolo-restore-corrupt-'));
  try {
    const backup = join(temp, 'broken.enc');
    const passphrase = join(temp, 'passphrase');
    await writeFile(backup, 'corrupt');
    await writeFile(passphrase, 'secret\n');
    const checksum = spawnSync('sha256sum', [backup], { encoding: 'utf8' }).stdout.replace(
      backup,
      'broken.enc',
    );
    await writeFile(`${backup}.sha256`, checksum);
    const result = run(
      [
        'infra/scripts/restore.sh',
        '--test',
        '--backup-file',
        backup,
        '--passphrase-file',
        passphrase,
      ],
      {},
    );
    assert.notEqual(result.status, 0);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
