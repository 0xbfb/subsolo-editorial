import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('workflows de CI, preview e deploy existem', async () => {
  const [ci, preview, deploy] = await Promise.all([
    read('.github/workflows/ci.yml'),
    read('.github/workflows/preview.yml'),
    read('.github/workflows/deploy-pages.yml'),
  ]);
  assert.match(ci, /name: CI/);
  assert.match(preview, /name: Preview editorial/);
  assert.match(deploy, /name: Publicar GitHub Pages/);
});

test('preview não recebe permissão de Pages', async () => {
  const preview = await read('.github/workflows/preview.yml');
  assert.doesNotMatch(preview, /pages:\s+write/);
  assert.doesNotMatch(preview, /id-token:\s+write/);
  assert.match(preview, /actions\/upload-artifact@v7\.0\.1/);
});

test('deploy usa ambiente e permissões mínimas', async () => {
  const deploy = await read('.github/workflows/deploy-pages.yml');
  assert.match(deploy, /name:\s+github-pages/);
  assert.match(deploy, /pages:\s+write/);
  assert.match(deploy, /id-token:\s+write/);
  assert.match(deploy, /cancel-in-progress:\s+false/);
  assert.match(deploy, /actions\/deploy-pages@v5\.0\.0/);
});

test('artefato é validado antes do upload', async () => {
  const deploy = await read('.github/workflows/deploy-pages.yml');
  const verify = deploy.indexOf('pnpm verify:dist');
  const scan = deploy.indexOf('pnpm scan:public-artifact');
  const upload = deploy.indexOf('actions/upload-pages-artifact');
  assert.ok(verify >= 0 && verify < upload);
  assert.ok(scan >= 0 && scan < upload);
});

test('smoke externo é agendado sem permissão de publicação', async () => {
  const scheduled = await read('.github/workflows/scheduled-checks.yml');
  assert.match(scheduled, /schedule:/);
  assert.match(scheduled, /scripts\/smoke-site\.mjs/);
  assert.doesNotMatch(scheduled, /pages:\s+write/);
  assert.doesNotMatch(scheduled, /id-token:\s+write/);
});
