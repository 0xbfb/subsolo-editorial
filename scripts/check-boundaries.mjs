import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve('src/lib');
const layers = ['domain', 'application', 'infrastructure', 'presentation'];
const forbidden = {
  domain: ['@application/', '@infrastructure/', '@presentation/', 'astro', '@astrojs/'],
  application: ['@infrastructure/', '@presentation/', 'astro', '@astrojs/'],
  infrastructure: ['@presentation/', 'astro', '@astrojs/'],
  presentation: ['@infrastructure/'],
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (['.ts', '.tsx'].includes(extname(entry.name))) files.push(path);
  }
  return files;
};

const violations = [];
for (const layer of layers) {
  const files = await walk(join(root, layer));
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const token of forbidden[layer]) {
      if (content.includes(`from '${token}`) || content.includes(`from \"${token}`)) {
        violations.push(`${relative(process.cwd(), file)}: ${layer} não pode importar ${token}`);
      }
    }
  }
}

if (violations.length) {
  console.error('SUBSOLO_BOUNDARY_VIOLATION');
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log('Fronteiras arquiteturais válidas.');
