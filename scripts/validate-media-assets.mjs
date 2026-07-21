import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createPillowMediaProcessor } from '../src/lib/infrastructure/media/pillow-media-processor.mjs';
import {
  validatePublicMediaRecord,
  sha256,
  MediaFailure,
} from '../src/lib/domain/media-pipeline.mjs';
const root = resolve(process.argv[2] ?? 'public/media');
const processor = createPillowMediaProcessor();
const walk = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
};
try {
  const record = validatePublicMediaRecord(
    JSON.parse(await readFile(join(root, 'media.json'), 'utf8')),
  );
  const files = await walk(root);
  const paths = [];
  for (const derivative of record.derivatives) {
    const match = files.find((file) => file.endsWith(derivative.path.replace(/^\/media\//, '')));
    if (!match)
      throw new MediaFailure(
        'SUBSOLO_MEDIA_DERIVATIVE_MISSING',
        `Arquivo ausente: ${derivative.path}`,
        'Regere os ativos.',
      );
    const buffer = await readFile(match);
    if (sha256(buffer) !== derivative.sha256)
      throw new MediaFailure(
        'SUBSOLO_MEDIA_DERIVATIVE_CHECKSUM_MISMATCH',
        `Checksum divergente: ${derivative.path}`,
        'Regere os ativos.',
      );
    paths.push(match);
  }
  const inspections = await processor.inspectBatch(paths);
  for (let index = 0; index < inspections.length; index += 1) {
    const inspection = inspections[index];
    const derivative = record.derivatives[index];
    if (inspection.has_exif || inspection.metadata_keys.length)
      throw new MediaFailure(
        'SUBSOLO_MEDIA_METADATA_LEAK',
        `Metadata encontrada: ${derivative.path}`,
        'Regere os ativos.',
      );
    if (inspection.width !== derivative.width || inspection.height !== derivative.height)
      throw new MediaFailure(
        'SUBSOLO_MEDIA_DERIVATIVE_DIMENSION_MISMATCH',
        `Dimensão divergente: ${derivative.path}`,
        'Regere os ativos.',
      );
  }
  console.log(`Ativos de mídia aprovados: ${record.derivatives.length} derivados.`);
} catch (error) {
  console.error(
    JSON.stringify(
      typeof error?.toJSON === 'function'
        ? error.toJSON()
        : { code: 'SUBSOLO_MEDIA_VALIDATION_FAILED', message: String(error) },
      null,
      2,
    ),
  );
  process.exitCode = 2;
}
