import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const root = resolve(process.cwd());
const allowBlockers = process.argv.includes('--allow-blockers');
const reportIndex = process.argv.indexOf('--report');
const reportPath = resolve(
  reportIndex >= 0 ? process.argv[reportIndex + 1] : 'reports/prompt-20/release-verification.json',
);
const commands = [
  ['node-tests', process.execPath, ['scripts/test-all.mjs']],
  ['verify-workflows', process.execPath, ['scripts/verify-workflows.mjs']],
  ['verify-source-manifest', process.execPath, ['scripts/verify-source-manifest.mjs']],
  ['check-boundaries', process.execPath, ['scripts/check-boundaries.mjs']],
  ['validate-infra', process.execPath, ['scripts/validate-infra.mjs']],
  ['validate-editorial-fixtures', process.execPath, ['scripts/validate-editorial-fixtures.mjs']],
  ['validate-public-contracts', process.execPath, ['scripts/validate-public-contracts.mjs']],
  ['validate-public-content', process.execPath, ['scripts/validate-public-content.mjs']],
  ['validate-editorial-site', process.execPath, ['scripts/validate-editorial-site.mjs']],
  ['validate-public-media', process.execPath, ['scripts/validate-public-media-if-present.mjs']],
  ['validate-observability', process.execPath, ['scripts/validate-observability.mjs']],
  ['generate-discovery', process.execPath, ['scripts/generate-discovery-assets.mjs']],
  ['validate-discovery', process.execPath, ['scripts/validate-discovery-assets.mjs']],
  ['render-preview', process.execPath, ['scripts/render-editorial-preview.mjs']],
  ['validate-preview-links', process.execPath, ['scripts/validate-preview-links.mjs']],
  [
    'scan-preview-artifact',
    process.execPath,
    ['scripts/scan-public-artifact.mjs', 'reports/prompt-06/preview'],
  ],
  ['audit-security', process.execPath, ['scripts/audit-security.mjs']],
  ['scan-secrets', process.execPath, ['scripts/scan-repository-secrets.mjs']],
  ['check-security-headers', process.execPath, ['scripts/check-security-headers.mjs']],
  ['check-minimum-permissions', process.execPath, ['scripts/check-minimum-permissions.mjs']],
  ['check-a11y-static', process.execPath, ['scripts/check-a11y.mjs']],
  ['check-performance', process.execPath, ['scripts/check-performance.mjs']],
  ['test-scale', process.execPath, ['scripts/test-scale.mjs']],
  ['test-degraded', process.execPath, ['scripts/check-degraded-modes.mjs']],
  ['typescript-offline', 'tsc', ['-p', 'config/release/tsconfig.offline.json']],
  [
    'python-media-compile',
    'python3',
    ['-m', 'py_compile', 'scripts/process-media.py', 'scripts/browser-acceptance.py'],
  ],
  [
    'fixture-flow',
    process.execPath,
    ['scripts/release-fixture-flow.mjs', 'reports/prompt-20/fixture-flow.json'],
  ],
  ['generate-sbom', process.execPath, ['scripts/generate-sbom.mjs']],
];

const results = [];
let commandFailure = false;
for (const [name, command, args] of commands) {
  const started = Date.now();
  console.log(`\n> ${command} ${args.join(' ')}`);
  const inheritedIo = false;
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: inheritedIo ? undefined : 'utf8',
    maxBuffer: 96 * 1024 * 1024,
    stdio: inheritedIo ? 'inherit' : 'pipe',
  });
  if (!inheritedIo) {
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
  }
  const status = result.error ? 1 : (result.status ?? 1);
  results.push({
    name,
    command: [command, ...args].join(' '),
    status,
    duration_ms: Date.now() - started,
    stdout_tail: inheritedIo
      ? []
      : (result.stdout ?? '').trim().split('\n').filter(Boolean).slice(-4),
    stderr_tail: inheritedIo
      ? []
      : (result.stderr ?? '').trim().split('\n').filter(Boolean).slice(-4),
  });
  if (status !== 0) {
    commandFailure = true;
    break;
  }
}

async function exists(path) {
  try {
    await access(resolve(root, path), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const internalEvidenceRequirements = [
  ['reports/prompt-20/fixture-flow.json', 'Fluxo ponta a ponta por fixture'],
  ['reports/prompt-20/browser-acceptance.json', 'Aceitação automatizada em Chromium'],
];
const blockers = [];
for (const [path, description] of internalEvidenceRequirements) {
  if (!(await exists(path)))
    blockers.push({ code: 'missing-internal-evidence', path, description });
  else {
    try {
      const evidence = JSON.parse(await readFile(resolve(root, path), 'utf8'));
      if (!String(evidence.status ?? '').startsWith('pass'))
        blockers.push({
          code: 'internal-evidence-not-pass',
          path,
          description,
          status: evidence.status ?? 'unknown',
        });
    } catch {
      blockers.push({ code: 'invalid-internal-evidence', path, description });
    }
  }
}

const evidenceRequirements = [
  ['pnpm-lock.yaml', 'Lockfile produzido por instalação limpa'],
  ['node_modules/.bin/astro', 'Dependências instaladas em ambiente limpo'],
  ['dist/index.html', 'Build Astro real'],
  ['dist/pagefind/pagefind.js', 'Índice Pagefind real'],
  [
    'reports/prompt-20/evidence/dependency-audit.json',
    'Auditoria transitiva de vulnerabilidades e licenças',
  ],
  ['reports/prompt-20/evidence/docker-stack.json', 'Stack Docker real e healthchecks'],
  [
    'reports/prompt-20/evidence/google-workspace.json',
    'Fluxo real com Docs, Sheets e Drive de teste',
  ],
  [
    'reports/prompt-20/evidence/github-pages.json',
    'PR, build, deploy e smoke reais no GitHub Pages',
  ],
  [
    'reports/prompt-20/evidence/manual-acceptance.json',
    'Aceite manual desktop, mobile, teclado e leitor de tela',
  ],
];
for (const [path, description] of evidenceRequirements) {
  if (!(await exists(path))) blockers.push({ code: 'missing-evidence', path, description });
  else {
    try {
      const evidence = JSON.parse(await readFile(resolve(root, path), 'utf8'));
      if (evidence.status !== 'pass')
        blockers.push({
          code: 'evidence-not-pass',
          path,
          description,
          status: evidence.status ?? 'unknown',
        });
    } catch {
      if (path.endsWith('.json')) blockers.push({ code: 'invalid-evidence', path, description });
    }
  }
}

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (pkg.version !== '1.0.0-pre')
  blockers.push({ code: 'wrong-version', actual: pkg.version, expected: '1.0.0-pre' });
if (commandFailure) blockers.push({ code: 'offline-validation-failed' });

const status = commandFailure ? 'fail' : blockers.length > 0 ? 'no-go' : 'go';
const report = {
  schema_version: 1,
  version: pkg.version,
  generated_at: new Date().toISOString(),
  status,
  offline_validation: commandFailure ? 'fail' : 'pass',
  command_count: results.length,
  commands: results,
  blockers,
  decision: blockers.length > 0 ? 'NO-GO para RC1' : 'GO para RC1',
};
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `\nRelease verification: ${status}; ${blockers.length} bloqueadores; relatório ${reportPath}.`,
);
if (commandFailure || (blockers.length > 0 && !allowBlockers)) process.exit(1);
