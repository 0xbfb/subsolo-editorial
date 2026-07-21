import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const run = (script, path, env = {}) => spawnSync(process.execPath, [script, path], {
  cwd: new URL('../..', import.meta.url),
  encoding: 'utf8',
  env: { ...process.env, ...env },
});

const validHtml = '<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; object-src \'none\'; base-uri \'self\'; form-action \'self\'"><title>Teste · Subsolo</title></head><body><a class="skip-link" href="#conteudo">Pular</a><main id="conteudo"><h1>Teste</h1><a href="/arquivo/">Arquivo</a></main></body></html>';

test('verificador aceita artefato mínimo íntegro', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'subsolo-dist-'));
  try {
    await mkdir(join(dir, 'arquivo'), { recursive: true });
    await writeFile(join(dir, 'index.html'), validHtml);
    await writeFile(join(dir, 'arquivo/index.html'), validHtml.replace('/arquivo/', '/'));
    const result = run('scripts/verify-dist.mjs', dir);
    assert.equal(result.status, 0, result.stderr);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('varredura rejeita chave privada', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'subsolo-secret-'));
  try {
    // secret-scan: allow-next-line — literal malicioso intencional para testar o scanner do artefato.
    await writeFile(join(dir, 'index.html'), `${validHtml}\n-----BEGIN PRIVATE KEY-----`);
    const result = run('scripts/scan-public-artifact.mjs', dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /private-key/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
