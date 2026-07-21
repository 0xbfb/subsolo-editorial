import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const compose = await readFile(new URL('../../infra/compose.yml', import.meta.url), 'utf8');

test('todas as imagens possuem versão explícita', () => {
  const images = [...compose.matchAll(/^    image:\s*(\S+)$/gm)].map((m) => m[1]);
  assert.equal(images.length, 6);
  for (const image of images) {
    assert.ok(image.includes(':'), image);
    assert.ok(!image.endsWith(':latest'), image);
  }
});

test('portas administrativas são vinculadas a localhost', () => {
  const ports = [...compose.matchAll(/^      - "([^"]+)"$/gm)].map((m) => m[1]).filter((v) => v.includes(':'));
  assert.ok(ports.length >= 5);
  for (const port of ports) assert.match(port, /^127\.0\.0\.1:/);
});

test('cada serviço possui healthcheck', () => {
  assert.equal((compose.match(/^    healthcheck:/gm) ?? []).length, 6);
});

test('postgres não publica porta no host', () => {
  const postgresBlock = compose.split('\n  n8n:')[0];
  assert.ok(!/^    ports:/m.test(postgresBlock));
});
