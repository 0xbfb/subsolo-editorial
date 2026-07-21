import { verifySourceManifest } from './source-manifest-core.mjs';

const result = await verifySourceManifest();
if (!result.ok) {
  console.error('SUBSOLO_SOURCE_MANIFEST_INVALID');
  console.error(result.failures.join('\n'));
  process.exit(1);
}

const externalMessage = result.externallyPreserved
  ? `; ${result.externallyPreserved} preservadas externamente pelo manifesto do pacote Git`
  : '';
console.log(`${result.verified} fontes verificadas por SHA-256${externalMessage}.`);
