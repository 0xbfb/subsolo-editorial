import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const text = await readFile(resolve('infra/compose.yml'), 'utf8');
const required = ['postgres', 'n8n', 'freshrss', 'searxng', 'uptime-kuma', 'ntfy'];
const errors = [];
for (const service of required) {
  if (!new RegExp(`^  ${service}:`, 'm').test(text)) errors.push(`serviço ausente: ${service}`);
}
if (/image:\s*[^\n]*:latest\b/.test(text)) errors.push('tag latest proibida');
const publishedPorts = [...text.matchAll(/^      - "([^"]+:\d+)"$/gm)].map((m) => m[1]);
for (const port of publishedPorts) {
  if (!port.startsWith('127.0.0.1:')) errors.push(`porta publicada fora de localhost: ${port}`);
}
const healthchecks = (text.match(/^    healthcheck:/gm) ?? []).length;
if (healthchecks < required.length)
  errors.push(`healthchecks insuficientes: ${healthchecks}/${required.length}`);
if (/[A-Za-z]:\\/.test(text)) errors.push('caminho absoluto do Windows detectado');
if (!/internal:\s*true/.test(text)) errors.push('rede backend interna ausente');
if (!/127\.0\.0\.1:\$\{N8N_HOST_PORT/.test(text)) errors.push('n8n não está limitado ao localhost');
if (!/settings\.runtime\.yml/.test(text))
  errors.push('SearXNG não usa configuração runtime sanitizada');
if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}
console.log(
  `Infraestrutura estática válida: ${required.length} serviços, ${healthchecks} healthchecks, ${publishedPorts.length} portas locais.`,
);
