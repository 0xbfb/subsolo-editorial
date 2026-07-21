import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const list = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await list(path)));
    else if (entry.name.endsWith('.astro')) files.push(path);
  }
  return files;
};

test('arquivos Astro possuem front matter e imports relativos resolvíveis', async () => {
  const files = await list(resolve(root, 'src'));
  assert.ok(files.length >= 10, `esperados componentes Astro, encontrados ${files.length}`);
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.ok(source.startsWith('---\n'), `${file} sem front matter inicial`);
    assert.ok(source.indexOf('---\n', 4) >= 4, `${file} sem fechamento de front matter`);
    assert.doesNotMatch(source, /<style(?:\s|>)/, `${file} contém CSS inline`);
    const imports = [...source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map((match) => match[1]);
    for (const imported of imports) {
      const target = resolve(dirname(file), imported);
      const candidates = [
        target,
        `${target}.ts`,
        `${target}.astro`,
        `${target}.json`,
        `${target}.css`,
      ];
      let found = false;
      for (const candidate of candidates) {
        try {
          await access(candidate);
          found = true;
          break;
        } catch (_) {}
      }
      assert.equal(found, true, `${file}: import não resolvido ${imported}`);
    }
  }
});
