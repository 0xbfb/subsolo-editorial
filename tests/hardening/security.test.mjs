import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { auditSecurity } from '../../scripts/audit-security.mjs';
import { checkMinimumPermissions } from '../../scripts/check-minimum-permissions.mjs';
import { checkSecurityHeaders } from '../../scripts/check-security-headers.mjs';
import { scanRepositorySecrets } from '../../scripts/scan-repository-secrets.mjs';

const root = new URL('../../', import.meta.url);
const text = async (path) => readFile(new URL(path, root), 'utf8');

test('auditoria estática passa e registra lockfile ausente como bloqueador de release', async () => {
  const report = await auditSecurity({ root: new URL('../..', import.meta.url).pathname });
  assert.equal(report.status, 'conditional-pass');
  assert.deepEqual(report.issues, []);
  assert.equal(report.lockfile, false);
  assert.match(report.blockers.join(' '), /pnpm-lock\.yaml/);
});

test('varredura do repositório não encontra segredo real', async () => {
  const report = await scanRepositorySecrets({ root: new URL('../..', import.meta.url).pathname });
  assert.equal(report.status, 'pass');
  assert.ok(report.scannedFiles > 500);
});

test('CSP é self-only, sem unsafe-inline e protege JSON-LD por hash', async () => {
  const report = await checkSecurityHeaders({ root: new URL('../..', import.meta.url).pathname });
  assert.equal(report.status, 'pass');
  const builder = await text('src/lib/presentation/security-headers.ts');
  assert.doesNotMatch(builder, /'unsafe-inline'/);
  assert.match(builder, /sha256CspHash/);
  assert.match(builder, /'wasm-unsafe-eval'/);
});

test('scripts públicos não usam sinks de HTML dinâmico', async () => {
  const source = `${await text('public/assets/theme.js')}\n${await text('public/assets/search.js')}`;
  assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(/);
  assert.match(source, /textContent/);
  assert.match(source, /replaceChildren/);
});

test('workflows e compose respeitam permissões mínimas', async () => {
  const report = await checkMinimumPermissions({ root: new URL('../..', import.meta.url).pathname });
  assert.equal(report.status, 'pass');
  assert.equal(report.workflows, 4);
  assert.equal(report.serviceCount, 6);
});

test('checkouts desativam persistência de credenciais e CI executa hardening', async () => {
  for (const file of ['ci.yml','deploy-pages.yml','preview.yml','scheduled-checks.yml']) {
    const workflow = await text(`.github/workflows/${file}`);
    const checkouts = workflow.match(/uses: actions\/checkout@v7\.0\.1/g) ?? [];
    assert.ok(checkouts.length >= 1);
    assert.ok((workflow.match(/persist-credentials: false/g) ?? []).length >= checkouts.length);
  }
  const ci = await text('.github/workflows/ci.yml');
  assert.match(ci, /pnpm audit:security/);
  assert.match(ci, /pnpm check:a11y/);
  assert.match(ci, /pnpm check:performance/);
  assert.match(ci, /pnpm test:scale/);
});

test('serviços locais não expõem portas além do loopback', async () => {
  const compose = await text('infra/compose.yml');
  const ports = [...compose.matchAll(/^\s+-\s+"([^"]+):\d+"/gm)].map((match) => match[1]);
  assert.ok(ports.length >= 4);
  assert.ok(ports.every((value) => value.startsWith('127.0.0.1:')));
  assert.doesNotMatch(compose, /privileged:\s*true|network_mode:\s*host|docker\.sock/);
});

test('inventário de dependências cobre versões diretas exatas e licenças aceitas', async () => {
  const pkg = JSON.parse(await text('package.json'));
  const inventory = JSON.parse(await text('licenses/direct-dependencies.json'));
  const direct = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal(inventory.packages.length, Object.keys(direct).length);
  for (const item of inventory.packages) {
    assert.equal(direct[item.name], item.version);
    assert.ok(inventory.allowed_licenses.includes(item.license));
    assert.equal(item.decision, 'accepted');
  }
});

test('portal declara política de privacidade sem analytics ou tracking', async () => {
  const page = await text('src/pages/privacidade.astro');
  const source = `${page}\n${await text('src/layouts/JornalConcretoLayout.astro')}`;
  assert.match(page, /não incorpora analytics/i);
  assert.match(page, /subsolo-theme/);
  assert.doesNotMatch(source, /google-analytics|googletagmanager|segment\.com|plausible\.io|matomo/i);
});
