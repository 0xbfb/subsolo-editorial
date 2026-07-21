import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(process.cwd());
const output = resolve(process.argv[2] ?? 'sbom/subsolo-1.0.0-pre.cdx.json');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const licenses = JSON.parse(await readFile(resolve(root, 'licenses/direct-dependencies.json'), 'utf8'));
const licenseByName = new Map(licenses.packages.map((entry) => [entry.name, entry.license]));
const dependencies = [
  ...Object.entries(pkg.dependencies ?? {}).map(([name, version]) => ({ name, version, scope: 'required' })),
  ...Object.entries(pkg.devDependencies ?? {}).map(([name, version]) => ({ name, version, scope: 'optional' })),
].sort((a, b) => a.name.localeCompare(b.name));

const components = dependencies.map(({ name, version, scope }) => ({
  type: 'library',
  'bom-ref': `pkg:npm/${encodeURIComponent(name)}@${version}`,
  name,
  version,
  scope,
  purl: `pkg:npm/${encodeURIComponent(name)}@${version}`,
  licenses: [{ license: { id: licenseByName.get(name) ?? 'NOASSERTION' } }],
  properties: [
    { name: 'subsolo:dependency-level', value: 'direct' },
    { name: 'subsolo:installed', value: 'false' },
  ],
}));

const serialSeed = JSON.stringify({ name: pkg.name, version: pkg.version, components: components.map((c) => c['bom-ref']) });
const serial = createHash('sha256').update(serialSeed).digest('hex').slice(0, 32);
const bom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: `urn:uuid:${serial.slice(0, 8)}-${serial.slice(8, 12)}-${serial.slice(12, 16)}-${serial.slice(16, 20)}-${serial.slice(20)}`,
  version: 1,
  metadata: {
    timestamp: '2026-07-21T00:00:00Z',
    component: {
      type: 'application',
      'bom-ref': `pkg:npm/${pkg.name}@${pkg.version}`,
      name: pkg.name,
      version: pkg.version,
      purl: `pkg:npm/${pkg.name}@${pkg.version}`,
    },
    properties: [
      { name: 'subsolo:completeness', value: 'direct-dependencies-only' },
      { name: 'subsolo:lockfile-present', value: 'false' },
      { name: 'subsolo:transitive-audit-status', value: 'blocked' },
    ],
  },
  components,
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(bom, null, 2)}\n`);
console.log(`SBOM direto gerado: ${basename(output)} com ${components.length} componentes; inventário transitivo bloqueado sem lockfile.`);
