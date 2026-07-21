import { readFile, mkdir, rm, rename, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve, relative, sep } from 'node:path';
import {
  detectMimeFromSignature,
  validateMediaManifest,
  validateMediaInspection,
  createDerivativePlan,
  createPublicMediaRecord,
  validatePublicMediaRecord,
  sha256,
  sourceExtensionAllowed,
  MediaFailure,
} from '../domain/media-pipeline.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const ensureOutsidePublic = (source, projectRoot) => {
  const rel = relative(resolve(projectRoot), resolve(source));
  if (
    !rel.startsWith('..' + sep) &&
    !rel.startsWith('fixtures' + sep) &&
    !rel.startsWith('.runtime' + sep)
  )
    throw new MediaFailure(
      'SUBSOLO_MEDIA_SOURCE_LOCATION_INVALID',
      'Originais não podem permanecer na árvore publicável.',
      'Mantenha originais no Drive ou em .runtime/media; apenas fixtures técnicas podem ser versionadas.',
      { relative: rel },
    );
};
export const planMediaProcessing = async ({
  manifestPath,
  destination,
  processor,
  projectRoot = process.cwd(),
}) => {
  const manifest = validateMediaManifest(await readJson(manifestPath));
  const source = resolve(dirname(resolve(manifestPath)), manifest.source_path);
  ensureOutsidePublic(source, projectRoot);
  if (!sourceExtensionAllowed(source, manifest.declared_mime))
    throw new MediaFailure(
      'SUBSOLO_MEDIA_EXTENSION_MISMATCH',
      'A extensão não corresponde ao MIME declarado.',
      'Corrija a extensão ou o manifesto.',
    );
  const bytes = await readFile(source);
  const signatureMime = detectMimeFromSignature(bytes.subarray(0, 32));
  const inspection = await processor.inspect(source);
  validateMediaInspection({ manifest, inspection, signatureMime });
  const sourceSha256 = sha256(bytes);
  const plan = createDerivativePlan({
    manifest,
    sourceSha256,
    destinationRoot: resolve(destination),
  });
  return Object.freeze({
    mode: 'dry-run',
    manifest,
    source,
    source_sha256: sourceSha256,
    inspection,
    metadata_to_strip: inspection.metadata_keys ?? [],
    destination: resolve(destination),
    derivatives: plan,
  });
};
export const applyMediaProcessing = async (options) => {
  const plan = await planMediaProcessing(options);
  const destination = resolve(options.destination);
  const staging = `${destination}.staging-${process.pid}`;
  const backup = `${destination}.backup-${process.pid}`;
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  let backupCreated = false;
  try {
    const stagedItems = [];
    for (const item of plan.derivatives) {
      const staged = item.output_path.replace(destination, staging);
      await mkdir(dirname(staged), { recursive: true });
      stagedItems.push({ ...item, staged });
    }
    const verifications = options.processor.processBatch
      ? await options.processor.processBatch({
          source: plan.source,
          items: stagedItems.map((item) => ({
            output: item.staged,
            width: item.width,
            height: item.height,
            fit: item.fit,
            format: item.format,
            focus_x: item.focus.x,
            focus_y: item.focus.y,
          })),
        })
      : await Promise.all(
          stagedItems.map(async (item) => {
            await options.processor.process({
              source: plan.source,
              output: item.staged,
              width: item.width,
              height: item.height,
              fit: item.fit,
              format: item.format,
              focus: item.focus,
            });
            return options.processor.verify(item.staged);
          }),
        );
    const actual = [];
    for (let index = 0; index < stagedItems.length; index += 1) {
      const item = stagedItems[index];
      const verification = verifications[index];
      const buffer = await readFile(item.staged);
      const st = await stat(item.staged);
      if (
        verification.has_exif ||
        verification.metadata_keys?.some((k) => /gps|exif|xmp|iptc|comment/i.test(k))
      )
        throw new MediaFailure(
          'SUBSOLO_MEDIA_METADATA_LEAK',
          'Metadados sensíveis permaneceram no derivado.',
          'Interrompa a publicação e revise o processador.',
          { path: item.public_path, metadata: verification.metadata_keys },
        );
      if (verification.width !== item.width || verification.height !== item.height)
        throw new MediaFailure(
          'SUBSOLO_MEDIA_DERIVATIVE_DIMENSION_MISMATCH',
          'O derivado possui dimensão diferente do plano.',
          'Regere o ativo.',
          {
            expected: [item.width, item.height],
            actual: [verification.width, verification.height],
          },
        );
      actual.push({
        ...item,
        staged: undefined,
        output_path: item.output_path,
        bytes: st.size,
        sha256: sha256(buffer),
      });
    }
    const record = validatePublicMediaRecord(
      createPublicMediaRecord({ manifest: plan.manifest, derivatives: actual }),
    );
    await writeFile(resolve(staging, 'media.json'), JSON.stringify(record, null, 2) + '\n');
    const publicReport = {
      schema_version: '1.0.0',
      pipeline_version: '1.0.0',
      media_id: record.id,
      source_sha256: plan.source_sha256,
      source_dimensions: { width: plan.inspection.width, height: plan.inspection.height },
      metadata_removed: Boolean(plan.inspection.has_exif || plan.inspection.metadata_keys?.length),
      derivative_count: record.derivatives.length,
      total_public_bytes: record.derivatives.reduce((n, x) => n + x.bytes, 0),
    };
    await writeFile(
      resolve(staging, 'asset-report.public.json'),
      JSON.stringify(publicReport, null, 2) + '\n',
    );
    try {
      await stat(destination);
      if (!options.overwrite)
        throw new MediaFailure(
          'SUBSOLO_MEDIA_DESTINATION_EXISTS',
          'O destino já existe.',
          'Use --overwrite após revisar o dry-run.',
        );
      await rm(backup, { recursive: true, force: true });
      await rename(destination, backup);
      backupCreated = true;
    } catch (error) {
      if (error?.code !== 'ENOENT' && !(error instanceof MediaFailure)) throw error;
      if (error instanceof MediaFailure) throw error;
    }
    await rename(staging, destination);
    if (backupCreated) await rm(backup, { recursive: true, force: true });
    return Object.freeze({ ...plan, mode: 'apply', record, report: publicReport });
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    if (backupCreated) {
      await rm(destination, { recursive: true, force: true });
      await rename(backup, destination);
    }
    throw error;
  }
};
