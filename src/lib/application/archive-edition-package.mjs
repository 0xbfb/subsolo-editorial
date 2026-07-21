import { createHash } from 'node:crypto';
import path from 'node:path';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { inspectPackage } from '../../../cli/packager-core.mjs';

export class PackageArchiveFailure extends Error {
  constructor(code, message, action, details = {}, retryable = false) {
    super(message);
    this.name = 'PackageArchiveFailure';
    this.code = code;
    this.action = action;
    this.details = details;
    this.retryable = retryable;
  }
  toJSON() {
    return { code: this.code, message: this.message, action: this.action, retryable: this.retryable, details: this.details };
  }
}

const fail = (code, message, action, details = {}, retryable = false) => {
  throw new PackageArchiveFailure(code, message, action, details, retryable);
};
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const md5 = (data) => createHash('md5').update(data).digest('hex');
const stableValue = (value) => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]))
    : value;
const stableStringify = (value) => `${JSON.stringify(stableValue(value), null, 2)}\n`;

const loadLocal = async (packagePath) => {
  const absolute = path.resolve(packagePath);
  let bytes;
  try { bytes = await readFile(absolute); }
  catch { fail('SUBSOLO_ARCHIVE_PACKAGE_NOT_FOUND', `Pacote não encontrado: ${absolute}.`, 'Gere ou informe um ZIP válido.'); }
  let inspected;
  try { inspected = inspectPackage(bytes); }
  catch (error) {
    fail('SUBSOLO_ARCHIVE_PACKAGE_INVALID', 'O arquivo local não é um pacote Subsolo íntegro.', 'Execute validate-package antes do upload.', { cause: error?.code ?? 'unknown' });
  }
  const manifest = inspected.manifest;
  const date = /^([0-9]{4})-([0-9]{2})-[0-9]{2}$/.exec(manifest.edition_date);
  if (!date) fail('SUBSOLO_ARCHIVE_EDITION_DATE_INVALID', 'A edição não possui data válida.', 'Corrija edition_date antes de empacotar.');
  return {
    absolute,
    bytes,
    manifest,
    year: date[1],
    month: date[2],
    packageSha256: sha256(bytes),
    packageMd5: md5(bytes),
    fileName: path.basename(absolute),
  };
};

const receiptDestination = (packagePath, configured) => path.resolve(configured ?? `${packagePath}.drive-receipt.json`);
const drivePath = (year, month, fileName) => `SUBSOLO/90_ARQUIVO_TECNICO/edicoes/${year}/${month}/${fileName}`;
const metadataFor = (local) => ({
  subsolo_kind: 'edition-package',
  subsolo_package_sha256: local.packageSha256,
  subsolo_edition_id: String(local.manifest.edition_id),
  subsolo_run_id: String(local.manifest.run_id),
  subsolo_revision: String(local.manifest.revision),
  subsolo_schema_version: String(local.manifest.schema_version),
});

const metadataField = (metadata, key) => metadata?.appProperties?.[key] ?? null;
const validateRemoteMetadata = ({ remote, local, folderId }) => {
  const errors = [];
  if (!remote?.id) errors.push('id');
  if (remote?.name !== local.fileName) errors.push('name');
  if (remote?.mimeType !== 'application/zip') errors.push('mimeType');
  if (String(remote?.size ?? '') !== String(local.bytes.length)) errors.push('size');
  if (!Array.isArray(remote?.parents) || !remote.parents.includes(folderId)) errors.push('parents');
  if (metadataField(remote, 'subsolo_kind') !== 'edition-package') errors.push('kind');
  if (metadataField(remote, 'subsolo_package_sha256') !== local.packageSha256) errors.push('package_sha256');
  if (metadataField(remote, 'subsolo_edition_id') !== String(local.manifest.edition_id)) errors.push('edition_id');
  if (metadataField(remote, 'subsolo_run_id') !== String(local.manifest.run_id)) errors.push('run_id');
  if (metadataField(remote, 'subsolo_revision') !== String(local.manifest.revision)) errors.push('revision');
  if (metadataField(remote, 'subsolo_schema_version') !== String(local.manifest.schema_version)) errors.push('schema_version');
  if (!remote?.md5Checksum || remote.md5Checksum !== local.packageMd5) errors.push('md5Checksum');
  if (remote?.trashed === true) errors.push('trashed');
  if (errors.length) {
    fail('SUBSOLO_ARCHIVE_REMOTE_METADATA_INVALID', 'O arquivo remoto não corresponde ao pacote local.', 'Não registre o file ID; revise o upload e tente novamente.', { fields: errors });
  }
};

const verifyDownloadedPackage = ({ downloaded, local }) => {
  const buffer = Buffer.from(downloaded);
  if (sha256(buffer) !== local.packageSha256) {
    fail('SUBSOLO_ARCHIVE_DOWNLOAD_CHECKSUM_INVALID', 'O download de verificação diverge do pacote local.', 'Mantenha o pacote local e repita a preservação.', {}, true);
  }
  let inspected;
  try { inspected = inspectPackage(buffer); }
  catch (error) {
    fail('SUBSOLO_ARCHIVE_DOWNLOAD_PACKAGE_INVALID', 'O arquivo baixado não restaura como pacote Subsolo.', 'Repita o upload e a verificação.', { cause: error?.code ?? 'unknown' }, true);
  }
  if (inspected.manifest.edition_id !== local.manifest.edition_id || inspected.manifest.run_id !== local.manifest.run_id) {
    fail('SUBSOLO_ARCHIVE_DOWNLOAD_MANIFEST_INVALID', 'O manifesto baixado pertence a outra execução.', 'Não registre o file ID e investigue a divergência.');
  }
};

const writeReceiptAtomic = async (receiptPath, receipt) => {
  await mkdir(path.dirname(receiptPath), { recursive: true });
  const temporary = `${receiptPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporary, stableStringify(receipt), { flag: 'wx' });
    await rename(temporary, receiptPath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
};

export const planPackageArchive = async ({ packagePath, rootFolderId, receiptPath = null, adapter }) => {
  if (!rootFolderId) fail('SUBSOLO_ARCHIVE_ROOT_ID_MISSING', 'A pasta raiz do Drive não foi configurada.', 'Informe --drive-root-id ou SUBSOLO_DRIVE_ROOT_FOLDER_ID.');
  const local = await loadLocal(packagePath);
  await adapter.validateRoot(rootFolderId);
  const target = await adapter.planPath(rootFolderId, local.year, local.month);
  const duplicate = target.folderId ? await adapter.findByPackageSha256(target.folderId, local.packageSha256) : null;
  return {
    mode: 'dry-run',
    disposition: duplicate ? 'already-archived' : 'planned',
    manifest: local.manifest,
    package_path: local.absolute,
    package_sha256: local.packageSha256,
    package_bytes: local.bytes.length,
    drive_path: drivePath(local.year, local.month, local.fileName),
    path_segments: target.segments,
    duplicate_file_id: duplicate?.id ?? null,
    receipt_path: receiptDestination(local.absolute, receiptPath),
  };
};

export const applyPackageArchive = async ({ packagePath, rootFolderId, receiptPath = null, adapter, now = () => new Date() }) => {
  if (!rootFolderId) fail('SUBSOLO_ARCHIVE_ROOT_ID_MISSING', 'A pasta raiz do Drive não foi configurada.', 'Informe --drive-root-id ou SUBSOLO_DRIVE_ROOT_FOLDER_ID.');
  const local = await loadLocal(packagePath);
  await adapter.validateRoot(rootFolderId);
  const target = await adapter.ensurePath(rootFolderId, local.year, local.month);
  const duplicate = await adapter.findByPackageSha256(target.folderId, local.packageSha256);
  const disposition = duplicate ? 'already-archived' : 'uploaded';
  const uploadedAt = now().toISOString();
  const candidate = duplicate ?? await adapter.uploadResumable({
    folderId: target.folderId,
    name: local.fileName,
    bytes: local.bytes,
    metadata: metadataFor(local),
  });
  const remote = await adapter.getMetadata(candidate.id);
  validateRemoteMetadata({ remote, local, folderId: target.folderId });
  const downloaded = await adapter.download(candidate.id);
  verifyDownloadedPackage({ downloaded, local });
  const verifiedAt = now().toISOString();
  const receipt = {
    schema_version: '1.0.0',
    provider: 'google-drive',
    disposition,
    file_id: remote.id,
    file_name: remote.name,
    package_sha256: local.packageSha256,
    package_bytes: local.bytes.length,
    drive_path: drivePath(local.year, local.month, local.fileName),
    edition_id: local.manifest.edition_id,
    run_id: local.manifest.run_id,
    revision: local.manifest.revision,
    mime_type: 'application/zip',
    md5_checksum: remote.md5Checksum ?? local.packageMd5,
    uploaded_at: remote.createdTime ?? uploadedAt,
    verified_at: verifiedAt,
  };
  await writeReceiptAtomic(receiptDestination(local.absolute, receiptPath), receipt);
  return receipt;
};
