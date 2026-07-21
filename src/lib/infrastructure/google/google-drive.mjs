import { createHash } from 'node:crypto';
import { createEnvironmentAccessTokenProvider, createServiceAccountTokenProvider, createStructuredLogger } from './google-workspace.mjs';

export const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const GOOGLE_DRIVE_FULL_SCOPE = 'https://www.googleapis.com/auth/drive';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FILE_FIELDS = 'id,name,mimeType,parents,appProperties,size,md5Checksum,createdTime,modifiedTime,trashed,driveId';
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const noOpLogger = createStructuredLogger();
const sleepDefault = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class GoogleDriveArchiveFailure extends Error {
  constructor(code, message, action, details = {}, retryable = false) {
    super(message);
    this.name = 'GoogleDriveArchiveFailure';
    this.code = code;
    this.action = action;
    this.details = details;
    this.retryable = retryable;
  }
  toJSON() { return { code: this.code, message: this.message, action: this.action, retryable: this.retryable, details: this.details }; }
}
const fail = (code, message, action, details = {}, retryable = false) => { throw new GoogleDriveArchiveFailure(code, message, action, details, retryable); };
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const queryEscape = (value) => String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
const isRetryable = (status) => RETRYABLE.has(status);
const retryDelay = (attempt) => Math.min(8000, 250 * 2 ** Math.max(0, attempt - 1));

const failureFromResponse = async (response, context = {}) => {
  let body = {};
  try { body = JSON.parse(await response.text()); } catch { body = {}; }
  const reason = body?.error?.errors?.[0]?.reason ?? body?.error?.status ?? null;
  if (response.status === 401) return new GoogleDriveArchiveFailure('SUBSOLO_DRIVE_AUTH_INVALID', 'A credencial do Drive foi recusada.', 'Renove a credencial e confirme o scope do Drive.', { ...context, status: response.status, reason });
  if (response.status === 403 && ['rateLimitExceeded', 'userRateLimitExceeded'].includes(reason)) return new GoogleDriveArchiveFailure('SUBSOLO_DRIVE_QUOTA_EXCEEDED', 'O Drive limitou temporariamente as requisições.', 'Aguarde o retry automático ou reduza a frequência.', { ...context, status: response.status, reason }, true);
  if (response.status === 403) return new GoogleDriveArchiveFailure('SUBSOLO_DRIVE_ACCESS_DENIED', 'A pasta ou arquivo não está autorizado para esta credencial.', 'Compartilhe a raiz técnica ou use uma credencial com acesso explícito.', { ...context, status: response.status, reason });
  if (response.status === 404) return new GoogleDriveArchiveFailure('SUBSOLO_DRIVE_RESOURCE_NOT_FOUND', 'O recurso do Drive não foi encontrado.', 'Confirme o ID, compartilhamento e se a sessão resumível ainda é válida.', { ...context, status: response.status, reason });
  if (response.status === 429) return new GoogleDriveArchiveFailure('SUBSOLO_DRIVE_QUOTA_EXCEEDED', 'O Drive limitou temporariamente as requisições.', 'Aguarde o retry automático ou reduza a frequência.', { ...context, status: response.status, reason }, true);
  if (response.status >= 500) return new GoogleDriveArchiveFailure('SUBSOLO_DRIVE_UPSTREAM_UNAVAILABLE', 'O Google Drive está temporariamente indisponível.', 'Tente novamente sem apagar o pacote local.', { ...context, status: response.status, reason }, true);
  return new GoogleDriveArchiveFailure('SUBSOLO_DRIVE_HTTP_ERROR', `O Drive respondeu com HTTP ${response.status}.`, 'Revise a requisição e a configuração.', { ...context, status: response.status, reason });
};

const authorizedFetch = async ({
  url, tokenProvider, fetchImpl, timeoutMs, maxAttempts, logger, sleep, method = 'GET', headers = {}, body,
  accepted = new Set([200]), responseType = 'json', context = {},
}) => {
  let last;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const token = await tokenProvider.getToken();
      const response = await fetchImpl(url, { method, headers: { authorization: `Bearer ${token}`, ...headers }, body, signal: controller.signal });
      clearTimeout(timer);
      if (!accepted.has(response.status)) {
        const failure = await failureFromResponse(response, context);
        if (failure.retryable && attempt < maxAttempts) {
          last = failure; logger.warn('google.drive.retry', { attempt, status: response.status, operation: context.operation }); await sleep(retryDelay(attempt)); continue;
        }
        throw failure;
      }
      if (responseType === 'raw') return response;
      if (responseType === 'buffer') return { response, data: Buffer.from(await response.arrayBuffer()) };
      const text = await response.text();
      return { response, data: text.trim() ? JSON.parse(text) : {} };
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof GoogleDriveArchiveFailure) throw error;
      if (typeof error?.toJSON === 'function' && typeof error?.code === 'string') throw error;
      const timeout = error?.name === 'AbortError';
      const failure = new GoogleDriveArchiveFailure(timeout ? 'SUBSOLO_DRIVE_TIMEOUT' : 'SUBSOLO_DRIVE_NETWORK_ERROR', timeout ? 'A chamada ao Drive excedeu o tempo limite.' : 'Falha de rede ao acessar o Drive.', timeout ? 'Aumente o timeout somente se necessário.' : 'Verifique a rede e tente novamente.', { ...context, attempt }, true);
      if (attempt < maxAttempts) { last = failure; logger.warn('google.drive.retry', { attempt, code: failure.code, operation: context.operation }); await sleep(retryDelay(attempt)); continue; }
      throw failure;
    }
  }
  throw last;
};

export const createGoogleDriveTokenProvider = ({ env = process.env, fetchImpl = globalThis.fetch, logger = noOpLogger } = {}) => {
  if (env.GOOGLE_DRIVE_ACCESS_TOKEN?.trim()) return createEnvironmentAccessTokenProvider({ env: { GOOGLE_WORKSPACE_ACCESS_TOKEN: env.GOOGLE_DRIVE_ACCESS_TOKEN } });
  if (env.GOOGLE_WORKSPACE_ACCESS_TOKEN?.trim()) return createEnvironmentAccessTokenProvider({ env });
  const credentialPath = env.SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE || env.GOOGLE_APPLICATION_CREDENTIALS;
  const configured = env.SUBSOLO_GOOGLE_DRIVE_SCOPE?.trim();
  const scope = configured === GOOGLE_DRIVE_FULL_SCOPE ? GOOGLE_DRIVE_FULL_SCOPE : GOOGLE_DRIVE_FILE_SCOPE;
  return createServiceAccountTokenProvider({ credentialPath, scopes: [scope], fetchImpl, logger });
};

const parseRangeNextOffset = (header, total) => {
  if (!header) return 0;
  const match = /bytes=0-([0-9]+)/i.exec(header);
  if (!match) fail('SUBSOLO_DRIVE_UPLOAD_RANGE_INVALID', 'A sessão resumível retornou um Range inválido.', 'Reinicie o upload mantendo o pacote local.', { header: sha256(header).slice(0, 12) }, true);
  return Math.min(total, Number(match[1]) + 1);
};

export const createGoogleDriveArchiveAdapter = ({
  tokenProvider = createGoogleDriveTokenProvider(), fetchImpl = globalThis.fetch,
  timeoutMs = 20_000, maxAttempts = 4, chunkSize = 8 * 256 * 1024,
  logger = noOpLogger, sleep = sleepDefault,
  apiBaseUrl = 'https://www.googleapis.com/drive/v3', uploadBaseUrl = 'https://www.googleapis.com/upload/drive/v3',
} = {}) => {
  if (!Number.isInteger(chunkSize) || chunkSize < 256 * 1024 || chunkSize % (256 * 1024) !== 0) {
    fail('SUBSOLO_DRIVE_CHUNK_SIZE_INVALID', 'O chunk do upload deve ser múltiplo de 256 KiB.', 'Use 262144 bytes ou um múltiplo inteiro.');
  }
  const request = (input) => authorizedFetch({ tokenProvider, fetchImpl, timeoutMs, maxAttempts, logger, sleep, ...input });
  let rootDriveId = null;

  const getMetadata = async (fileId) => {
    const url = new URL(`${apiBaseUrl}/files/${encodeURIComponent(fileId)}`);
    url.searchParams.set('fields', FILE_FIELDS); url.searchParams.set('supportsAllDrives', 'true');
    return (await request({ url: url.toString(), context: { operation: 'files.get' } })).data;
  };

  const validateRoot = async (rootFolderId) => {
    const root = await getMetadata(rootFolderId);
    if (root.mimeType !== FOLDER_MIME || root.trashed === true) fail('SUBSOLO_DRIVE_ROOT_INVALID', 'A raiz configurada não é uma pasta ativa.', 'Informe o ID da pasta SUBSOLO autorizada.');
    rootDriveId = root.driveId ?? null;
    return { id: root.id, name: root.name, driveId: rootDriveId };
  };

  const listFiles = async (query) => {
    const results = []; let pageToken = null;
    do {
      const url = new URL(`${apiBaseUrl}/files`);
      url.searchParams.set('q', query); url.searchParams.set('fields', `nextPageToken,files(${FILE_FIELDS})`);
      url.searchParams.set('pageSize', '100'); url.searchParams.set('spaces', 'drive'); url.searchParams.set('supportsAllDrives', 'true'); url.searchParams.set('includeItemsFromAllDrives', 'true');
      if (rootDriveId) { url.searchParams.set('corpora', 'drive'); url.searchParams.set('driveId', rootDriveId); }
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const page = (await request({ url: url.toString(), context: { operation: 'files.list' } })).data;
      results.push(...(page.files ?? [])); pageToken = page.nextPageToken ?? null;
    } while (pageToken);
    return results;
  };

  const findChildFolder = async (parentId, name) => {
    const q = `'${queryEscape(parentId)}' in parents and name = '${queryEscape(name)}' and mimeType = '${FOLDER_MIME}' and trashed = false`;
    const files = await listFiles(q);
    if (files.length > 1) fail('SUBSOLO_DRIVE_FOLDER_AMBIGUOUS', `Há mais de uma pasta chamada ${name} sob o mesmo pai.`, 'Remova a ambiguidade antes da publicação.', { count: files.length });
    return files[0] ?? null;
  };

  const createFolder = async (parentId, name, logicalPath) => {
    const url = new URL(`${apiBaseUrl}/files`); url.searchParams.set('supportsAllDrives', 'true'); url.searchParams.set('fields', FILE_FIELDS);
    const body = JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId], appProperties: { subsolo_kind: 'archive-folder', subsolo_path_sha256: sha256(logicalPath).slice(0, 40) } });
    return (await request({ url: url.toString(), method: 'POST', headers: { 'content-type': 'application/json; charset=UTF-8' }, body, accepted: new Set([200, 201]), context: { operation: 'folders.create' } })).data;
  };

  const traverse = async (rootFolderId, year, month, apply) => {
    const names = ['90_ARQUIVO_TECNICO', 'edicoes', year, month];
    const segments = []; let parentId = rootFolderId; let missing = false;
    for (const name of names) {
      if (missing && !apply) { segments.push({ name, status: 'create', folderId: null }); continue; }
      let folder = await findChildFolder(parentId, name);
      let status = 'existing';
      if (!folder) {
        if (!apply) { missing = true; segments.push({ name, status: 'create', folderId: null }); continue; }
        folder = await createFolder(parentId, name, [...names.slice(0, segments.length + 1)].join('/'));
        status = 'create';
      }
      if (!Array.isArray(folder.parents) || !folder.parents.includes(parentId)) fail('SUBSOLO_DRIVE_FOLDER_PARENT_INVALID', `A pasta ${name} não pertence ao caminho esperado.`, 'Revise a hierarquia antes do upload.');
      segments.push({ name, status, folderId: folder.id }); parentId = folder.id;
    }
    return { folderId: missing ? null : parentId, path: `90_ARQUIVO_TECNICO/edicoes/${year}/${month}`, segments };
  };

  const findByPackageSha256 = async (folderId, packageSha256) => {
    const q = `'${queryEscape(folderId)}' in parents and mimeType = 'application/zip' and appProperties has { key='subsolo_package_sha256' and value='${queryEscape(packageSha256)}' } and trashed = false`;
    const files = await listFiles(q);
    if (files.length > 1) fail('SUBSOLO_DRIVE_DUPLICATE_AMBIGUOUS', 'Mais de um arquivo remoto possui o mesmo checksum.', 'Interrompa e audite o arquivo técnico.', { count: files.length });
    return files[0] ?? null;
  };

  const sessionStatus = async (sessionUrl, total) => {
    const response = await request({ url: sessionUrl, method: 'PUT', headers: { 'content-length': '0', 'content-range': `bytes */${total}` }, body: new Uint8Array(), accepted: new Set([200, 201, 308]), responseType: 'raw', context: { operation: 'upload.status' } });
    if (response.status === 200 || response.status === 201) return { completed: true, metadata: JSON.parse(await response.text()) };
    return { completed: false, nextOffset: parseRangeNextOffset(response.headers.get('range'), total) };
  };

  const uploadResumable = async ({ folderId, name, bytes, metadata }) => {
    const data = Buffer.from(bytes); const total = data.length;
    const initUrl = new URL(`${uploadBaseUrl}/files`); initUrl.searchParams.set('uploadType', 'resumable'); initUrl.searchParams.set('supportsAllDrives', 'true'); initUrl.searchParams.set('fields', FILE_FIELDS);
    const init = await request({
      url: initUrl.toString(), method: 'POST', headers: {
        'content-type': 'application/json; charset=UTF-8', 'x-upload-content-type': 'application/zip', 'x-upload-content-length': String(total),
      }, body: JSON.stringify({ name, mimeType: 'application/zip', parents: [folderId], appProperties: metadata }), accepted: new Set([200, 201]), responseType: 'raw', context: { operation: 'upload.initiate' },
    });
    const sessionUrl = init.headers.get('location');
    if (!sessionUrl) fail('SUBSOLO_DRIVE_UPLOAD_SESSION_MISSING', 'O Drive não retornou a URI da sessão resumível.', 'Repita o upload sem remover o pacote local.', {}, true);
    let offset = 0; let interruptions = 0;
    while (offset < total) {
      const end = Math.min(total, offset + chunkSize) - 1; const chunk = data.subarray(offset, end + 1);
      try {
        const response = await request({ url: sessionUrl, method: 'PUT', headers: { 'content-type': 'application/zip', 'content-length': String(chunk.length), 'content-range': `bytes ${offset}-${end}/${total}` }, body: chunk, accepted: new Set([200, 201, 308]), responseType: 'raw', maxAttempts: 1, context: { operation: 'upload.chunk' } });
        if (response.status === 200 || response.status === 201) return JSON.parse(await response.text());
        const next = parseRangeNextOffset(response.headers.get('range'), total);
        if (next <= offset) fail('SUBSOLO_DRIVE_UPLOAD_STALLED', 'A sessão resumível não avançou.', 'Reinicie o upload mantendo o pacote local.', { offset }, true);
        offset = next;
      } catch (error) {
        if (!(error instanceof GoogleDriveArchiveFailure) || !error.retryable || interruptions >= maxAttempts - 1) throw error;
        interruptions += 1; await sleep(retryDelay(interruptions));
        const state = await sessionStatus(sessionUrl, total);
        if (state.completed) return state.metadata;
        offset = state.nextOffset;
      }
    }
    const state = await sessionStatus(sessionUrl, total);
    if (state.completed) return state.metadata;
    fail('SUBSOLO_DRIVE_UPLOAD_INCOMPLETE', 'O upload resumível terminou sem confirmação final.', 'Consulte a sessão e repita a verificação.', { next_offset: state.nextOffset }, true);
  };

  const download = async (fileId) => {
    const url = new URL(`${apiBaseUrl}/files/${encodeURIComponent(fileId)}`); url.searchParams.set('alt', 'media'); url.searchParams.set('supportsAllDrives', 'true');
    return (await request({ url: url.toString(), responseType: 'buffer', context: { operation: 'files.download' } })).data;
  };

  return {
    validateRoot,
    planPath: (rootFolderId, year, month) => traverse(rootFolderId, year, month, false),
    ensurePath: (rootFolderId, year, month) => traverse(rootFolderId, year, month, true),
    findByPackageSha256,
    uploadResumable,
    getMetadata,
    download,
  };
};
