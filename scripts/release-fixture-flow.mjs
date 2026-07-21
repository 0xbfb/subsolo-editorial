import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(process.cwd());
const reportPath = resolve(process.argv[2] ?? 'reports/prompt-20/fixture-flow.json');
const work = await mkdtemp(join(tmpdir(), 'subsolo-pre-flow-'));
const steps = [];

function run(name, command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, ...options.env },
  });
  const entry = {
    name,
    command: [command, ...args].join(' '),
    status: result.status,
    duration_ms: Date.now() - started,
    stdout_tail: (result.stdout ?? '').trim().split('\n').slice(-5),
    stderr_tail: (result.stderr ?? '').trim().split('\n').filter(Boolean).slice(-5),
  };
  steps.push(entry);
  if (result.error || result.status !== 0) {
    throw new Error(`${name} falhou: ${result.error?.message ?? result.stderr ?? result.stdout}`);
  }
  return result;
}

const sha256 = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');

async function compareDirectories(left, right) {
  const collect = async (base, current = base) => {
    const out = [];
    for (const entry of (await readdir(current, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) out.push(...(await collect(base, path)));
      else out.push({ path: path.slice(base.length + 1), sha256: await sha256(path) });
    }
    return out;
  };
  const a = await collect(left);
  const b = await collect(right);
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error('Diretórios divergentes no fluxo fixture.');
  return a.length;
}

try {
  const exportA = join(work, 'export-a');
  const exportB = join(work, 'export-b');
  run('export-dry-run', process.execPath, [
    'cli/subsolo.mjs',
    'export-doc',
    '--provider',
    'fixture',
    '--sheet',
    'fixtures/exporter/valid/sheet-row.json',
    '--document',
    'fixtures/exporter/valid/document.json',
    '--destination',
    exportA,
    '--dry-run',
  ]);
  run('export-apply-a', process.execPath, [
    'cli/subsolo.mjs',
    'export-doc',
    '--provider',
    'fixture',
    '--sheet',
    'fixtures/exporter/valid/sheet-row.json',
    '--document',
    'fixtures/exporter/valid/document.json',
    '--destination',
    exportA,
    '--apply',
  ]);
  run('export-apply-b', process.execPath, [
    'cli/subsolo.mjs',
    'export-doc',
    '--provider',
    'fixture',
    '--sheet',
    'fixtures/exporter/valid/sheet-row.json',
    '--document',
    'fixtures/exporter/valid/document.json',
    '--destination',
    exportB,
    '--apply',
  ]);
  const exportedFiles = await compareDirectories(exportA, exportB);
  const goldenFiles = await compareDirectories(exportA, resolve(root, 'fixtures/exporter/golden'));

  const packageA = join(work, 'packages-a');
  const packageB = join(work, 'packages-b');
  run('package-dry-run', process.execPath, [
    'cli/subsolo.mjs',
    'package',
    '--workspace',
    'fixtures/packager/edition-r1',
    '--destination',
    packageA,
    '--dry-run',
  ]);
  run('package-apply-a', process.execPath, [
    'cli/subsolo.mjs',
    'package',
    '--workspace',
    'fixtures/packager/edition-r1',
    '--destination',
    packageA,
    '--apply',
  ]);
  run('package-apply-b', process.execPath, [
    'cli/subsolo.mjs',
    'package',
    '--workspace',
    'fixtures/packager/edition-r1',
    '--destination',
    packageB,
    '--apply',
  ]);
  const packageName = (await readdir(packageA)).find((name) => name.endsWith('.zip'));
  if (!packageName) throw new Error('Pacote não foi criado.');
  const zipA = join(packageA, packageName);
  const zipB = join(packageB, packageName);
  const zipSha = await sha256(zipA);
  if (zipSha !== (await sha256(zipB))) throw new Error('Pacote não é determinístico.');
  run('validate-package', process.execPath, [
    'cli/subsolo.mjs',
    'validate-package',
    '--package',
    zipA,
  ]);
  const restored = join(work, 'restored');
  run('restore-dry-run', process.execPath, [
    'cli/subsolo.mjs',
    'restore',
    '--package',
    zipA,
    '--destination',
    restored,
    '--dry-run',
  ]);
  run('restore-apply', process.execPath, [
    'cli/subsolo.mjs',
    'restore',
    '--package',
    zipA,
    '--destination',
    restored,
    '--apply',
  ]);

  for (const editionPackage of [
    'fixtures/edition-lifecycle/golden/packages/subsolo-edicao-20260720T070500-0300-r1.zip',
    'fixtures/edition-lifecycle/golden/packages/subsolo-edicao-20260720T150000-0300-r2.zip',
    'fixtures/edition-lifecycle/golden/packages/subsolo-edicao-20260720T210000-0300-r3.zip',
    'fixtures/post-publication/golden/r2-correction.zip',
    'fixtures/post-publication/golden/r3-withdrawal.zip',
  ])
    run(`validate-${basename(editionPackage)}`, process.execPath, [
      'cli/subsolo.mjs',
      'validate-package',
      '--package',
      editionPackage,
    ]);

  run('orchestrate-dry-run', process.execPath, [
    'cli/subsolo.mjs',
    'orchestrate',
    '--input',
    'fixtures/n8n/publication-candidate.json',
    '--dry-run',
  ]);
  run('reconcile-consistent', process.execPath, [
    'cli/subsolo.mjs',
    'reconcile',
    '--input',
    'fixtures/observability/reconciliation-consistent.json',
    '--dry-run',
  ]);

  const mediaOutput = join(work, 'media');
  run('media-dry-run', process.execPath, [
    'cli/subsolo.mjs',
    'media',
    '--manifest',
    'fixtures/media/portrait/manifest.json',
    '--destination',
    mediaOutput,
    '--dry-run',
  ]);
  run('media-apply', process.execPath, [
    'cli/subsolo.mjs',
    'media',
    '--manifest',
    'fixtures/media/portrait/manifest.json',
    '--destination',
    mediaOutput,
    '--apply',
  ]);
  run('media-validate', process.execPath, ['scripts/validate-media-assets.mjs', mediaOutput]);

  const backupStaging = join(work, 'backup-staging');
  const backupRoot = join(work, 'backup');
  await mkdir(backupStaging, { recursive: true });
  await mkdir(backupRoot, { recursive: true });
  await writeFile(join(backupStaging, 'postgres.dump'), Buffer.from('PGDMPpre-release-fixture'));
  for (const name of ['n8n_data', 'freshrss_data', 'freshrss_extensions', 'uptime_kuma_data']) {
    const volumeDir = join(work, name);
    await mkdir(volumeDir, { recursive: true });
    await writeFile(join(volumeDir, 'fixture.txt'), `fixture:${name}\n`);
    run(`backup-volume-${name}`, 'tar', [
      '-czf',
      join(backupStaging, `${name}.tar.gz`),
      '-C',
      volumeDir,
      '.',
    ]);
  }
  await writeFile(
    join(backupStaging, 'runtime.json'),
    `${JSON.stringify({ schema_version: 1, product_version: '1.0.0-pre', secrets_included: false }, null, 2)}\n`,
  );
  run('backup-manifest-create', process.execPath, [
    'scripts/backup-manifest.mjs',
    'create',
    '--directory',
    backupStaging,
    '--created-at',
    '2026-07-21T12:00:00Z',
    '--product-version',
    '1.0.0-pre',
  ]);
  run('backup-manifest-validate', process.execPath, [
    'scripts/backup-manifest.mjs',
    'validate',
    '--directory',
    backupStaging,
  ]);
  const plainBackup = join(work, 'subsolo-backup-pre.tar.gz');
  const encryptedBackup = join(backupRoot, 'subsolo-backup-pre.tar.gz.enc');
  const passphrase = join(work, 'backup.pass');
  await writeFile(passphrase, 'fixture-passphrase-not-persisted\n', { mode: 0o600 });
  run('backup-tar', 'tar', ['-czf', plainBackup, '-C', backupStaging, '.']);
  run('backup-encrypt', 'openssl', [
    'enc',
    '-aes-256-cbc',
    '-pbkdf2',
    '-salt',
    '-in',
    plainBackup,
    '-out',
    encryptedBackup,
    '-pass',
    `file:${passphrase}`,
  ]);
  const encryptedSha = await sha256(encryptedBackup);
  await writeFile(`${encryptedBackup}.sha256`, `${encryptedSha}  ${basename(encryptedBackup)}\n`);
  const restoreReport = join(work, 'restore-report.json');
  run('backup-restore-test', 'sh', [
    'infra/scripts/restore.sh',
    '--test',
    '--backup-file',
    encryptedBackup,
    '--passphrase-file',
    passphrase,
    '--report',
    restoreReport,
  ]);
  const restore = JSON.parse(await readFile(restoreReport, 'utf8'));

  const report = {
    schema_version: 1,
    version: '1.0.0-pre',
    status: 'pass-offline-fixture',
    external_services_used: false,
    exported_files: exportedFiles,
    golden_files_compared: goldenFiles,
    package: { name: packageName, sha256: zipSha },
    restore: {
      status: restore.status,
      components_validated: restore.components_validated,
      volume_archives_extracted: restore.volume_archives_extracted,
      postgres_header_valid: restore.postgres_header_valid,
    },
    steps,
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Fluxo fixture aprovado: ${steps.length} etapas, pacote ${packageName}, restore ${restore.status}.`,
  );
} finally {
  await rm(work, { recursive: true, force: true });
}
