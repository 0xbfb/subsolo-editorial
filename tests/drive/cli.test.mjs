import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const run = (args, env = {}) =>
  spawnSync(process.execPath, ['cli/subsolo.mjs', ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GOOGLE_WORKSPACE_ACCESS_TOKEN: '',
      GOOGLE_DRIVE_ACCESS_TOKEN: '',
      SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE: '',
      GOOGLE_APPLICATION_CREDENTIALS: '',
      ...env,
    },
  });

test('publish exige --skip-git no Prompt 11', () => {
  const result = run([
    'publish',
    '--package',
    'fixtures/packager/golden/r1.zip',
    '--drive-root-id',
    'root',
    '--dry-run',
  ]);
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stderr).code, 'SUBSOLO_PUBLISH_GIT_SCOPE_INVALID');
});

test('publish sem credencial falha fechado antes de qualquer upload', () => {
  const result = run([
    'publish',
    '--package',
    'fixtures/packager/golden/r1.zip',
    '--drive-root-id',
    'root',
    '--skip-git',
    '--dry-run',
  ]);
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stderr).code, 'SUBSOLO_GOOGLE_CREDENTIAL_MISSING');
});
