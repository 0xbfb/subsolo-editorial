import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const json = async (path) => JSON.parse(await readFile(path, 'utf8'));

test('pré-release possui versão e comandos de verificação formais', async () => {
  const pkg = await json('package.json');
  assert.equal(pkg.version, '1.0.0-pre');
  assert.equal(pkg.scripts['test:all'], 'node scripts/test-all.mjs');
  assert.equal(pkg.scripts['release:verify'], 'node scripts/release-verify.mjs');
  assert.match(pkg.scripts['release:verify:offline'], /--allow-blockers/);
});

test('matriz cobre todos os critérios do projeto e fases do plano', async () => {
  const matrix = await json('config/release/traceability.json');
  assert.equal(matrix.project_acceptance_criteria.length, 22);
  assert.equal(matrix.phase_acceptance.length, 16);
  assert.equal(matrix.prompt_reports.length, 19);
  assert.ok(matrix.project_acceptance_criteria.some((row) => row.status === 'blocked'));
});

test('backup obtém a versão do package.json em vez de valor obsoleto', async () => {
  const script = await readFile('infra/scripts/backup.sh', 'utf8');
  assert.match(script, /PRODUCT_VERSION=.*package\.json/);
  assert.doesNotMatch(script, /product_version": "0\.9\.0-dev"/);
});

test('gate exige evidências reais e não confunde fluxo fixture com homologação', async () => {
  const verifier = await readFile('scripts/release-verify.mjs', 'utf8');
  for (const evidence of [
    'dependency-audit.json',
    'docker-stack.json',
    'google-workspace.json',
    'github-pages.json',
    'manual-acceptance.json',
  ]) {
    assert.match(verifier, new RegExp(evidence.replace('.', '\\.')));
  }
  assert.match(verifier, /NO-GO para RC1/);
  assert.match(verifier, /allowBlockers/);
});

test('resíduos comprovadamente mortos foram removidos e empacotamento é determinístico', async () => {
  const { access } = await import('node:fs/promises');
  for (const path of [
    'src/lib/presentation/site-view-model.ts',
    'src/lib/application/package-edition.ts',
    'src/lib/domain/publication-orchestration.ts',
    'src/lib/infrastructure/exporter/fixture-providers.ts',
    'src/lib/infrastructure/google/google-providers.ts',
  ])
    await assert.rejects(() => access(path));
  const packager = await readFile('scripts/package-pre-release.py', 'utf8');
  assert.match(packager, /FIXED_TIME = \(2026, 7, 21, 0, 0, 0\)/);
  assert.match(packager, /node_modules/);
  assert.match(packager, /__pycache__/);
});
