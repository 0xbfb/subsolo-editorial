import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const roots = ['content/publications'];
const problems = [];
const allowedBlocks = new Set([
  'fact',
  'declaration',
  'unknown',
  'why-it-matters',
  'next-step',
  'document',
  'action-recommended',
  'correction',
]);
const walk = async (dir) => {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
  const result = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else if (entry.name === 'publication.md') result.push(path);
  }
  return result;
};
for (const root of roots) {
  for (const path of await walk(root)) {
    const source = await readFile(path, 'utf8');
    if (!source.startsWith('---\n')) problems.push(`${path}: front matter ausente`);
    const body = source.replace(/^---[\s\S]*?---\n/, '');
    if (/<\/?(?:script|iframe|object|embed|style|link|meta)\b/i.test(body))
      problems.push(`${path}: HTML perigoso`);
    else if (/<[A-Za-z!/][^>]*>/.test(body)) problems.push(`${path}: HTML arbitrário`);
    if (/\b(?:javascript|vbscript|data|file):/i.test(body))
      problems.push(`${path}: protocolo perigoso`);
    if (/^#\s+/m.test(body)) problems.push(`${path}: H1 no corpo`);
    const stack = [];
    body.split('\n').forEach((line, index) => {
      const match = /^:::(.*)$/.exec(line.trim());
      if (!match) return;
      const name = (match[1] ?? '').trim();
      if (name === '') {
        if (stack.length === 0)
          problems.push(`${path}:${index + 1}: fechamento de bloco sem abertura`);
        else stack.pop();
      } else if (!allowedBlocks.has(name))
        problems.push(`${path}:${index + 1}: bloco desconhecido ${name}`);
      else stack.push(name);
    });
    if (stack.length > 0) problems.push(`${path}: bloco não fechado ${stack.at(-1)}`);
  }
}
if (problems.length) {
  problems.forEach((problem) => console.error(`SUBSOLO_PUBLIC_CONTENT_INVALID: ${problem}`));
  process.exitCode = 1;
} else console.log(JSON.stringify({ status: 'passed', roots }, null, 2));
