import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const project = new URL('../..', import.meta.url);
const run = (fixture, mode) =>
  spawnSync(process.execPath, ['cli/subsolo.mjs', 'reconcile', '--input', fixture, mode], {
    cwd: project,
    encoding: 'utf8',
  });
test('CLI supports operational reconciliation dry-run', () => {
  const result = run('fixtures/observability/reconciliation-consistent.json', '--dry-run');
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.disposition, 'consistent');
  assert.equal(parsed.writes, false);
});
test('CLI apply blocks divergent reconciliation', () => {
  const result = run('fixtures/observability/reconciliation-diverged.json', '--apply');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SUBSOLO_RECONCILIATION_REQUIRES_HUMAN/);
});
