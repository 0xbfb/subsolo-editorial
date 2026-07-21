import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const testsRoot = join(root, 'tests');

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else if (entry.isFile() && entry.name.endsWith('.test.mjs')) files.push(path);
  }
  return files;
}

const files = await collect(testsRoot);
if (files.length === 0) {
  console.error('SUBSOLO_TEST_SUITE_EMPTY');
  process.exit(1);
}

console.log(`Executando ${files.length} arquivos de teste Node.`);
const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if (result.error) {
  console.error(`SUBSOLO_TEST_RUNNER_ERROR: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Suite Node aprovada: ${files.length} arquivos.`);
