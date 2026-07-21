import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const project = new URL('../..', import.meta.url);

test('smoke fixture validates HTML, feeds and archive index without network', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'subsolo-smoke-fixture-'));
  try {
    await mkdir(join(dir, 'agora'));
    await mkdir(join(dir, 'arquivo'));
    const html =
      '<!doctype html><html><head><title>Subsolo</title></head><body><main id="conteudo">ok</main></body></html>';
    await writeFile(join(dir, 'index.html'), html);
    await writeFile(join(dir, 'agora/index.html'), html);
    await writeFile(join(dir, 'arquivo/index.html'), html);
    await writeFile(join(dir, 'rss.xml'), '<rss version="2.0"></rss>');
    await writeFile(join(dir, 'sitemap.xml'), '<urlset></urlset>');
    await writeFile(join(dir, 'archive-index.json'), '[]');
    const report = join(dir, 'report.json');
    const result = spawnSync(
      process.execPath,
      ['scripts/smoke-site.mjs', '--fixture-dir', dir, '--report', report],
      {
        cwd: project,
        encoding: 'utf8',
        env: { ...process.env, SUBSOLO_SMOKE_ATTEMPTS: '1', SUBSOLO_SMOKE_DELAY_MS: '0' },
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const parsed = JSON.parse(await readFile(report, 'utf8'));
    assert.equal(parsed.ok, true);
    assert.equal(parsed.metrics.checks, 6);
    assert.equal(parsed.metrics.failed, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
