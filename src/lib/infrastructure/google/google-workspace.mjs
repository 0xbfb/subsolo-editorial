import { createHash, createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const DEFAULT_SCOPES = Object.freeze([
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
]);
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const JSON_COLUMNS = new Set([
  'autores_publicos',
  'temas_publicos',
  'territorios_publicos',
  'imagem_publica',
  'fontes',
  'correcoes',
  'midia',
]);
const BOOLEAN_COLUMNS = new Set(['destaque', 'comentarios_resolvidos']);
const NULLABLE_COLUMNS = new Set(['story_id', 'atualizado_em', 'imagem_publica']);
const EDITORIAL_BLOCKS = new Set([
  'fact',
  'declaration',
  'unknown',
  'why-it-matters',
  'next-step',
  'document',
  'action-recommended',
  'correction',
]);

export class GoogleWorkspaceFailure extends Error {
  constructor(code, message, action, details = {}, retryable = false) {
    super(message);
    this.name = 'GoogleWorkspaceFailure';
    this.code = code;
    this.action = action;
    this.details = details;
    this.retryable = retryable;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      action: this.action,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

const sha256 = (value) => createHash('sha256').update(String(value)).digest('hex');
const opaqueId = (value) => `sha256:${sha256(value).slice(0, 12)}`;
const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
};
const stableStringify = (value) => JSON.stringify(stableValue(value));
const base64url = (value) => Buffer.from(value).toString('base64url');

const redactValue = (value, key = '') => {
  if (/token|authorization|private.?key|client.?secret|password|credential/i.test(key)) return '[REDACTED]';
  if (/document.?id|spreadsheet.?id|tab.?id|client.?email|email/i.test(key) && typeof value === 'string') return opaqueId(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactValue(entryValue, entryKey)]));
  }
  if (typeof value === 'string') {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED]')
      .replace(/"private_key"\s*:\s*"[^"]+"/gi, '"private_key":"[REDACTED]"');
  }
  return value;
};

export const createStructuredLogger = ({ sink = () => {}, verbose = false } = {}) => ({
  debug(event, context = {}) {
    if (verbose) sink({ level: 'debug', event, context: redactValue(context) });
  },
  info(event, context = {}) {
    sink({ level: 'info', event, context: redactValue(context) });
  },
  warn(event, context = {}) {
    sink({ level: 'warn', event, context: redactValue(context) });
  },
});

const noOpLogger = createStructuredLogger();
const sleepDefault = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const errorFromStatus = (status, details = {}) => {
  if (status === 401) {
    return new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_AUTH_INVALID',
      'A credencial do Google foi recusada.',
      'Renove o token ou revise a conta de serviço configurada.',
      details,
      false,
    );
  }
  if (status === 403) {
    return new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_ACCESS_DENIED',
      'O Google recusou o acesso ao recurso solicitado.',
      'Compartilhe o documento e a planilha com a conta configurada e confirme os scopes somente leitura.',
      details,
      false,
    );
  }
  if (status === 404) {
    return new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_RESOURCE_NOT_FOUND',
      'O recurso solicitado não foi encontrado.',
      'Confirme o identificador e o compartilhamento do recurso.',
      details,
      false,
    );
  }
  if (status === 429) {
    return new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_QUOTA_EXCEEDED',
      'A API do Google limitou temporariamente as requisições.',
      'Aguarde o retry automático ou reduza a frequência do fluxo.',
      details,
      true,
    );
  }
  if (status >= 500) {
    return new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_UPSTREAM_UNAVAILABLE',
      'A API do Google está temporariamente indisponível.',
      'Tente novamente; se a falha persistir, use o modo offline com fixtures.',
      details,
      true,
    );
  }
  return new GoogleWorkspaceFailure(
    'SUBSOLO_GOOGLE_HTTP_ERROR',
    `A API do Google respondeu com HTTP ${status}.`,
    'Revise a requisição e a configuração da integração.',
    details,
    false,
  );
};

const retryDelay = ({ attempt, retryAfter, baseDelayMs, random }) => {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  const jitter = 0.8 + random() * 0.4;
  return Math.round(baseDelayMs * 2 ** Math.max(0, attempt - 1) * jitter);
};

export const requestGoogleJson = async ({
  url,
  tokenProvider,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10_000,
  maxAttempts = 3,
  baseDelayMs = 250,
  sleep = sleepDefault,
  random = Math.random,
  logger = noOpLogger,
  method = 'GET',
  headers = {},
  body,
}) => {
  if (typeof fetchImpl !== 'function') {
    throw new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_FETCH_UNAVAILABLE',
      'A implementação de fetch não está disponível.',
      'Use Node.js 22 ou forneça um fetch compatível.',
    );
  }

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const accessToken = await tokenProvider.getToken();
      logger.debug('google.request.started', { attempt, method, service: new URL(url).hostname });
      const response = await fetchImpl(url, {
        method,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${accessToken}`,
          ...headers,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const responseText = await response.text();
      let data = {};
      if (responseText.trim() !== '') {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new GoogleWorkspaceFailure(
            'SUBSOLO_GOOGLE_RESPONSE_INVALID',
            'A API do Google retornou JSON inválido.',
            'Repita a operação; se persistir, registre o corpo redigido e use fixtures.',
            { status: response.status },
            false,
          );
        }
      }

      if (!response.ok) {
        const failure = errorFromStatus(response.status, {
          status: response.status,
          reason: data?.error?.status ?? null,
        });
        if (failure.retryable && attempt < maxAttempts) {
          const waitMs = retryDelay({
            attempt,
            retryAfter: response.headers.get('retry-after'),
            baseDelayMs,
            random,
          });
          logger.warn('google.request.retry', { attempt, wait_ms: waitMs, status: response.status });
          await sleep(waitMs);
          lastError = failure;
          continue;
        }
        throw failure;
      }

      logger.debug('google.request.completed', { attempt, status: response.status });
      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof GoogleWorkspaceFailure) throw error;
      const timedOut = error?.name === 'AbortError';
      const failure = new GoogleWorkspaceFailure(
        timedOut ? 'SUBSOLO_GOOGLE_TIMEOUT' : 'SUBSOLO_GOOGLE_NETWORK_ERROR',
        timedOut ? 'A chamada ao Google excedeu o tempo limite.' : 'Falha de rede ao acessar o Google.',
        timedOut ? 'Aumente o timeout apenas se necessário ou use o modo offline.' : 'Verifique a rede e tente novamente.',
        { attempt },
        true,
      );
      if (attempt < maxAttempts) {
        const waitMs = retryDelay({ attempt, retryAfter: null, baseDelayMs, random });
        logger.warn('google.request.retry', { attempt, wait_ms: waitMs, code: failure.code });
        await sleep(waitMs);
        lastError = failure;
        continue;
      }
      throw failure;
    }
  }
  throw lastError;
};

export const createEnvironmentAccessTokenProvider = ({ env = process.env } = {}) => ({
  async getToken() {
    const token = env.GOOGLE_WORKSPACE_ACCESS_TOKEN?.trim();
    if (!token) {
      throw new GoogleWorkspaceFailure(
        'SUBSOLO_GOOGLE_CREDENTIAL_MISSING',
        'Nenhum token de acesso do Google foi configurado.',
        'Defina GOOGLE_WORKSPACE_ACCESS_TOKEN ou configure uma conta de serviço somente leitura.',
      );
    }
    return token;
  },
});

export const createServiceAccountTokenProvider = ({
  credentialPath,
  scopes = DEFAULT_SCOPES,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  logger = noOpLogger,
} = {}) => {
  let cachedToken = null;
  let credentialsPromise = null;

  const loadCredentials = async () => {
    if (!credentialPath) {
      throw new GoogleWorkspaceFailure(
        'SUBSOLO_GOOGLE_CREDENTIAL_MISSING',
        'O caminho da conta de serviço não foi configurado.',
        'Defina SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE ou GOOGLE_APPLICATION_CREDENTIALS.',
      );
    }
    credentialsPromise ??= readFile(credentialPath, 'utf8').then((text) => JSON.parse(text));
    const credentials = await credentialsPromise;
    if (!credentials.client_email || !credentials.private_key) {
      throw new GoogleWorkspaceFailure(
        'SUBSOLO_GOOGLE_CREDENTIAL_INVALID',
        'O arquivo da conta de serviço não possui client_email e private_key.',
        'Baixe uma credencial JSON válida e mantenha-a fora do repositório.',
      );
    }
    return credentials;
  };

  return {
    async getToken() {
      if (cachedToken && cachedToken.expiresAt - 60_000 > now()) return cachedToken.value;
      const credentials = await loadCredentials();
      const issuedAt = Math.floor(now() / 1000);
      const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token';
      const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const claim = base64url(JSON.stringify({
        iss: credentials.client_email,
        scope: scopes.join(' '),
        aud: tokenUri,
        iat: issuedAt,
        exp: issuedAt + 3600,
      }));
      const unsigned = `${header}.${claim}`;
      const signer = createSign('RSA-SHA256');
      signer.update(unsigned);
      signer.end();
      const assertion = `${unsigned}.${signer.sign(credentials.private_key).toString('base64url')}`;
      logger.debug('google.auth.service_account.requested', { client_email: credentials.client_email });
      const response = await fetchImpl(tokenUri, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }).toString(),
      });
      const data = JSON.parse(await response.text());
      if (!response.ok || !data.access_token) {
        throw new GoogleWorkspaceFailure(
          'SUBSOLO_GOOGLE_AUTH_INVALID',
          'Não foi possível obter token com a conta de serviço.',
          'Revise a chave, o relógio da máquina, os scopes e o compartilhamento dos arquivos.',
          { status: response.status, reason: data.error ?? null },
        );
      }
      cachedToken = {
        value: data.access_token,
        expiresAt: now() + Math.max(60, Number(data.expires_in ?? 3600)) * 1000,
      };
      return cachedToken.value;
    },
  };
};

export const createDefaultGoogleTokenProvider = ({
  env = process.env,
  fetchImpl = globalThis.fetch,
  logger = noOpLogger,
} = {}) => {
  if (env.GOOGLE_WORKSPACE_ACCESS_TOKEN?.trim()) return createEnvironmentAccessTokenProvider({ env });
  const credentialPath = env.SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE || env.GOOGLE_APPLICATION_CREDENTIALS;
  return createServiceAccountTokenProvider({ credentialPath, fetchImpl, logger });
};

const createExpiringCache = ({ ttlMs = 0, now = () => Date.now() } = {}) => {
  const entries = new Map();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      if (ttlMs > 0) entries.set(key, { value, expiresAt: now() + ttlMs });
    },
    clear() {
      entries.clear();
    },
  };
};

const textFromElements = (elements = []) => elements.map((element) => {
  if (element.textRun) {
    const raw = element.textRun.content ?? '';
    const text = raw.replace(/\n$/, '');
    const url = element.textRun.textStyle?.link?.url;
    return url && text ? `[${text}](${url})` : text;
  }
  if (element.autoText) return element.autoText.content ?? '';
  return '';
}).join('');

const countSuggestions = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== 'object') return 0;
  if (seen.has(value)) return 0;
  seen.add(value);
  let count = 0;
  for (const [key, item] of Object.entries(value)) {
    if (/^suggested/i.test(key)) {
      if (Array.isArray(item)) count += item.length;
      else if (item && typeof item === 'object') count += Object.keys(item).length;
      else if (item) count += 1;
    }
    count += countSuggestions(item, seen);
  }
  return count;
};

const listIsOrdered = (documentTab, listId, nestingLevel = 0) => {
  const glyphType = documentTab?.lists?.[listId]?.listProperties?.nestingLevels?.[nestingLevel]?.glyphType;
  if (!glyphType) return false;
  return !['BULLET', 'GLYPH_TYPE_UNSPECIFIED'].includes(glyphType);
};

const cellText = (cell) => (cell?.content ?? []).map((element) => {
  if (element.paragraph) return textFromElements(element.paragraph.elements);
  if (element.table) return '';
  return '';
}).join('\n').trim();

const tableNode = (table) => {
  const rows = (table.tableRows ?? []).map((row) => (row.tableCells ?? []).map(cellText));
  const [headers = [], ...bodyRows] = rows;
  return { type: 'table', headers, rows: bodyRows };
};

const paragraphNode = (paragraph, documentTab) => {
  const text = textFromElements(paragraph.elements).trim();
  if (!text) return null;
  if (paragraph.bullet) {
    return {
      kind: 'list-item',
      ordered: listIsOrdered(documentTab, paragraph.bullet.listId, paragraph.bullet.nestingLevel ?? 0),
      text,
    };
  }
  const style = paragraph.paragraphStyle?.namedStyleType;
  if (style === 'HEADING_2' || style === 'HEADING_3' || style === 'HEADING_4') {
    return { type: 'heading', level: Number(style.at(-1)), text };
  }
  if (text.startsWith('> ')) return { type: 'quote', text: text.slice(2).trim() };
  return { type: 'paragraph', text };
};

const appendNode = (nodes, node) => {
  if (node?.kind === 'list-item') {
    const previous = nodes.at(-1);
    if (previous?.type === 'list' && previous.ordered === node.ordered) {
      nodes[nodes.length - 1] = { ...previous, items: [...previous.items, node.text] };
    } else {
      nodes.push({ type: 'list', ordered: node.ordered, items: [node.text] });
    }
    return;
  }
  if (node) nodes.push(node);
};

const parseStructuralContent = (documentTab) => {
  const flat = [];
  for (const element of documentTab?.body?.content ?? []) {
    if (element.paragraph) appendNode(flat, paragraphNode(element.paragraph, documentTab));
    else if (element.table) flat.push(tableNode(element.table));
  }

  const result = [];
  let activeBlock = null;
  for (const node of flat) {
    if (node.type === 'paragraph') {
      const open = /^:::([a-z-]+)$/.exec(node.text);
      if (open) {
        if (activeBlock) {
          throw new GoogleWorkspaceFailure(
            'SUBSOLO_GOOGLE_DOCS_BLOCK_NESTED',
            'Um bloco editorial foi aberto dentro de outro bloco.',
            'Feche o bloco atual com ::: antes de iniciar outro.',
          );
        }
        if (!EDITORIAL_BLOCKS.has(open[1])) {
          throw new GoogleWorkspaceFailure(
            'SUBSOLO_GOOGLE_DOCS_BLOCK_UNKNOWN',
            `Bloco editorial desconhecido: ${open[1]}.`,
            'Use apenas blocos editoriais permitidos.',
          );
        }
        activeBlock = { kind: open[1], children: [] };
        continue;
      }
      if (node.text === ':::') {
        if (!activeBlock) {
          throw new GoogleWorkspaceFailure(
            'SUBSOLO_GOOGLE_DOCS_BLOCK_UNEXPECTED_CLOSE',
            'Foi encontrado um fechamento de bloco sem abertura correspondente.',
            'Remova o marcador ou abra um bloco válido antes dele.',
          );
        }
        result.push({ type: 'editorial-block', kind: activeBlock.kind, children: activeBlock.children });
        activeBlock = null;
        continue;
      }
    }
    if (activeBlock) activeBlock.children.push(node);
    else result.push(node);
  }
  if (activeBlock) {
    throw new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_DOCS_BLOCK_UNCLOSED',
      `O bloco editorial ${activeBlock.kind} não foi fechado.`,
      'Adicione ::: ao final do bloco.',
    );
  }
  return result;
};

const flattenTabs = (tabs = []) => tabs.flatMap((tab) => [tab, ...flattenTabs(tab.childTabs ?? [])]);

export const transformGoogleDocument = (document, { etag = null, tabId = null } = {}) => {
  if (!document?.documentId || !document?.title) {
    throw new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_DOCS_RESPONSE_INVALID',
      'A resposta do Google Docs não contém documentId e title.',
      'Confirme se o recurso é um documento Google válido.',
    );
  }
  const tabs = flattenTabs(document.tabs ?? []);
  let documentTab;
  if (tabs.length > 0) {
    if (tabId) {
      const selected = tabs.find((tab) => tab.tabProperties?.tabId === tabId);
      if (!selected) {
        throw new GoogleWorkspaceFailure(
          'SUBSOLO_GOOGLE_DOCS_TAB_NOT_FOUND',
          'A aba solicitada não existe no documento.',
          'Revise SUBSOLO_GOOGLE_DOCS_TAB_ID ou remova a seleção para documentos com uma única aba.',
          { tab_id: opaqueId(tabId) },
        );
      }
      documentTab = selected.documentTab;
    } else if (tabs.length === 1) {
      documentTab = tabs[0].documentTab;
    } else {
      throw new GoogleWorkspaceFailure(
        'SUBSOLO_GOOGLE_DOCS_TAB_REQUIRED',
        'O documento possui várias abas e nenhuma foi selecionada.',
        'Defina --tab-id ou SUBSOLO_GOOGLE_DOCS_TAB_ID para evitar exportar a aba errada.',
        { tab_count: tabs.length },
      );
    }
  } else {
    documentTab = document;
  }
  const revisionId = etag ? etag.replace(/^W\//, '').replaceAll('"', '') : sha256(stableStringify(document)).slice(0, 24);
  return {
    documentId: document.documentId,
    revisionId,
    title: document.title,
    unresolvedSuggestions: countSuggestions(documentTab),
    comments: [],
    nodes: parseStructuralContent(documentTab),
  };
};

export const createGoogleDocsProvider = ({
  tokenProvider,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10_000,
  maxAttempts = 3,
  cacheTtlMs = 0,
  tabId = null,
  logger = noOpLogger,
  request = requestGoogleJson,
} = {}) => {
  const cache = createExpiringCache({ ttlMs: cacheTtlMs });
  return {
    async read(documentId) {
      if (!documentId || typeof documentId !== 'string') {
        throw new GoogleWorkspaceFailure(
          'SUBSOLO_GOOGLE_DOCS_ID_INVALID',
          'O documentId informado é inválido.',
          'Informe o ID do Google Docs sem a URL completa.',
        );
      }
      const cacheKey = `${documentId}:${tabId ?? ''}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.debug('google.docs.cache_hit', { document_id: documentId });
        return cached;
      }
      const url = new URL(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`);
      url.searchParams.set('includeTabsContent', 'true');
      const response = await request({
        url: url.toString(),
        tokenProvider,
        fetchImpl,
        timeoutMs,
        maxAttempts,
        logger,
      });
      const transformed = transformGoogleDocument(response.data, {
        etag: response.headers.get('etag'),
        tabId,
      });
      cache.set(cacheKey, transformed);
      return transformed;
    },
  };
};

const parseSheetRange = (range) => {
  const match = /^([^!]+)!([A-Z]+):([A-Z]+)$/.exec(range);
  if (!match) {
    throw new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_SHEETS_RANGE_INVALID',
      'O intervalo do Sheets deve usar o formato ABA!A:AZ.',
      'Defina --sheet-range ou SUBSOLO_GOOGLE_SHEETS_RANGE com colunas explícitas.',
      { range },
    );
  }
  return { sheet: match[1], startColumn: match[2], endColumn: match[3] };
};

const parseBoolean = (value, column) => {
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', 'verdadeiro', 'sim', '1'].includes(normalized)) return true;
  if (['false', 'falso', 'nao', 'não', '0'].includes(normalized)) return false;
  throw new GoogleWorkspaceFailure(
    'SUBSOLO_GOOGLE_SHEETS_BOOLEAN_INVALID',
    `A coluna ${column} não contém um booleano reconhecido.`,
    'Use TRUE ou FALSE na planilha.',
    { column },
  );
};

const parseCell = (value, column) => {
  const empty = value === undefined || value === null || String(value).trim() === '';
  if (empty && NULLABLE_COLUMNS.has(column)) return null;
  if (JSON_COLUMNS.has(column)) {
    if (empty) return column === 'imagem_publica' ? null : [];
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      throw new GoogleWorkspaceFailure(
        'SUBSOLO_GOOGLE_SHEETS_JSON_INVALID',
        `A coluna ${column} contém JSON inválido.`,
        'Corrija o JSON estruturado na planilha.',
        { column },
      );
    }
  }
  if (BOOLEAN_COLUMNS.has(column)) return parseBoolean(value, column);
  return value;
};

export const rowsFromSheetValues = (values) => {
  if (!Array.isArray(values) || values.length === 0) return [];
  const headers = values[0].map((header) => String(header).trim());
  if (headers.some((header) => header === '') || new Set(headers).size !== headers.length) {
    throw new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_SHEETS_HEADER_INVALID',
      'A linha de cabeçalho do Sheets possui colunas vazias ou duplicadas.',
      'Corrija os cabeçalhos antes de executar a exportação.',
    );
  }
  return values.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== '')).map((row) => Object.fromEntries(
    headers.map((header, index) => [header, parseCell(row[index], header)]),
  ));
};

const sheetPageRange = ({ sheet, startColumn, endColumn }, startRow, pageSize) =>
  `${sheet}!${startColumn}${startRow}:${endColumn}${startRow + pageSize - 1}`;

export const createGoogleSheetsProvider = ({
  spreadsheetId,
  range = 'ARTIGOS!A:AZ',
  tokenProvider,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10_000,
  maxAttempts = 3,
  pageSize = 200,
  maxPages = 100,
  cacheTtlMs = 0,
  logger = noOpLogger,
  request = requestGoogleJson,
} = {}) => {
  const parsedRange = parseSheetRange(range);
  const cache = createExpiringCache({ ttlMs: cacheTtlMs });

  const readAllRows = async () => {
    const cached = cache.get(`${spreadsheetId}:${range}`);
    if (cached) {
      logger.debug('google.sheets.cache_hit', { spreadsheet_id: spreadsheetId });
      return cached;
    }
    if (!spreadsheetId) {
      throw new GoogleWorkspaceFailure(
        'SUBSOLO_GOOGLE_SHEETS_ID_INVALID',
        'O spreadsheetId não foi configurado.',
        'Informe --spreadsheet-id ou SUBSOLO_GOOGLE_SPREADSHEET_ID.',
      );
    }
    if (!Number.isInteger(pageSize) || pageSize < 2) {
      throw new GoogleWorkspaceFailure(
        'SUBSOLO_GOOGLE_SHEETS_PAGE_SIZE_INVALID',
        'O pageSize do Sheets deve ser inteiro e maior que 1.',
        'Use um valor como 200.',
      );
    }
    let headers = null;
    const rows = [];
    for (let page = 0; page < maxPages; page += 1) {
      const startRow = page * pageSize + 1;
      const pageRange = sheetPageRange(parsedRange, startRow, pageSize);
      const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(pageRange)}`);
      url.searchParams.set('majorDimension', 'ROWS');
      url.searchParams.set('valueRenderOption', 'UNFORMATTED_VALUE');
      url.searchParams.set('dateTimeRenderOption', 'FORMATTED_STRING');
      const response = await request({
        url: url.toString(),
        tokenProvider,
        fetchImpl,
        timeoutMs,
        maxAttempts,
        logger,
      });
      const pageValues = Array.isArray(response.data.values) ? response.data.values : [];
      if (page === 0) {
        if (pageValues.length === 0) break;
        headers = pageValues[0];
        rows.push(...rowsFromSheetValues(pageValues));
      } else {
        if (pageValues.length === 0) break;
        rows.push(...rowsFromSheetValues([headers, ...pageValues]));
      }
      if (pageValues.length < pageSize) break;
      if (page === maxPages - 1) {
        throw new GoogleWorkspaceFailure(
          'SUBSOLO_GOOGLE_SHEETS_PAGE_LIMIT',
          'A leitura do Sheets atingiu o limite máximo de páginas sem alcançar o fim.',
          'Aumente maxPages conscientemente ou reduza a faixa consultada.',
          { max_pages: maxPages, page_size: pageSize },
        );
      }
    }
    if (!headers) {
      throw new GoogleWorkspaceFailure(
        'SUBSOLO_GOOGLE_SHEETS_EMPTY',
        'A faixa configurada no Sheets está vazia.',
        'Confirme a aba, o intervalo e o compartilhamento.',
      );
    }
    cache.set(`${spreadsheetId}:${range}`, rows);
    return rows;
  };

  return {
    async read(articleId) {
      const rows = await readAllRows();
      const matches = rows.filter((row) => row.artigo_id === articleId);
      if (matches.length === 0) {
        throw new GoogleWorkspaceFailure(
          'SUBSOLO_GOOGLE_SHEETS_ARTICLE_NOT_FOUND',
          'O artigo não foi encontrado na planilha.',
          'Confirme o artigo_id e a faixa configurada.',
          { article_id: opaqueId(articleId) },
        );
      }
      if (matches.length > 1) {
        throw new GoogleWorkspaceFailure(
          'SUBSOLO_GOOGLE_SHEETS_ARTICLE_DUPLICATED',
          'O artigo_id aparece mais de uma vez na planilha.',
          'Remova a duplicidade antes da exportação.',
          { article_id: opaqueId(articleId), count: matches.length },
        );
      }
      return matches[0];
    },
  };
};

export const createGoogleWorkspaceProvidersFromEnvironment = ({
  env = process.env,
  fetchImpl = globalThis.fetch,
  logger = noOpLogger,
} = {}) => {
  const tokenProvider = createDefaultGoogleTokenProvider({ env, fetchImpl, logger });
  const common = {
    tokenProvider,
    fetchImpl,
    logger,
    timeoutMs: Number(env.SUBSOLO_GOOGLE_TIMEOUT_MS ?? 10_000),
    maxAttempts: Number(env.SUBSOLO_GOOGLE_MAX_ATTEMPTS ?? 3),
    cacheTtlMs: Number(env.SUBSOLO_GOOGLE_CACHE_TTL_MS ?? 0),
  };
  return {
    documentProvider: createGoogleDocsProvider({
      ...common,
      tabId: env.SUBSOLO_GOOGLE_DOCS_TAB_ID || null,
    }),
    sheetProvider: createGoogleSheetsProvider({
      ...common,
      spreadsheetId: env.SUBSOLO_GOOGLE_SPREADSHEET_ID,
      range: env.SUBSOLO_GOOGLE_SHEETS_RANGE || 'ARTIGOS!A:AZ',
      pageSize: Number(env.SUBSOLO_GOOGLE_SHEETS_PAGE_SIZE ?? 200),
    }),
  };
};

export const loadGoogleEditorialInput = async ({ articleId, documentId = null, sheetProvider, documentProvider }) => {
  const row = await sheetProvider.read(articleId);
  if (row.comentarios_resolvidos !== true) {
    throw new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_COMMENTS_GATE_PENDING',
      'A planilha não confirma que os comentários editoriais foram resolvidos.',
      'Defina comentarios_resolvidos como TRUE somente após revisar o Google Docs.',
      { article_id: opaqueId(articleId) },
    );
  }
  const resolvedDocumentId = documentId || row.document_id;
  if (!resolvedDocumentId || typeof resolvedDocumentId !== 'string') {
    throw new GoogleWorkspaceFailure(
      'SUBSOLO_GOOGLE_DOCS_ID_MISSING',
      'A linha editorial não informa document_id e nenhum ID foi passado pela CLI.',
      'Preencha document_id no Sheets ou use --document-id.',
    );
  }
  const document = await documentProvider.read(resolvedDocumentId);
  return { row, document };
};

export const GOOGLE_READONLY_SCOPES = DEFAULT_SCOPES;
