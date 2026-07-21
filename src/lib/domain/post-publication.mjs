import { createHash } from 'node:crypto';

const SCHEMA_VERSION = '1.0.0';
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const PUB = /^pub_[0-9A-HJKMNP-TV-Z]{26}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ARTICLE = /^art_[a-z0-9_-]+$/i;
const PUBLICATION_PATH = /^\/(\d{4})\/(\d{2})\/(\d{2})\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/;
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const POST_PUBLICATION_KINDS = Object.freeze([
  'correction',
  'clarification',
  'update',
  'slug-change',
  'withdrawal',
]);

export class PostPublicationFailure extends Error {
  constructor(code, message, action, details = {}) {
    super(message);
    this.name = 'PostPublicationFailure';
    this.code = code;
    this.action = action;
    this.details = details;
  }
  toJSON() {
    return { code: this.code, message: this.message, action: this.action, details: this.details };
  }
}

const fail = (code, message, action, details = {}) => {
  throw new PostPublicationFailure(code, message, action, details);
};
const clone = (value) => structuredClone(value);
const text = (value, label, min = 1) => {
  if (typeof value !== 'string' || value.trim().length < min) {
    fail(
      'SUBSOLO_POST_PUBLICATION_TEXT_INVALID',
      `${label} ausente ou insuficiente.`,
      `Informe ${label} com pelo menos ${min} caracteres.`,
    );
  }
  return value.trim();
};
const timestamp = (value, label = 'at') => {
  if (!ISO.test(value ?? '') || Number.isNaN(Date.parse(value))) {
    fail(
      'SUBSOLO_POST_PUBLICATION_TIMESTAMP_INVALID',
      `${label} inválido.`,
      'Use ISO 8601 com fuso explícito.',
    );
  }
  return value;
};
const revision = (value, label = 'revision') => {
  if (!Number.isInteger(value) || value < 1)
    fail(
      'SUBSOLO_POST_PUBLICATION_REVISION_INVALID',
      `${label} inválida.`,
      'Use inteiro positivo.',
    );
  return value;
};
const path = (value, label) => {
  if (typeof value !== 'string' || !PUBLICATION_PATH.test(value)) {
    fail(
      'SUBSOLO_POST_PUBLICATION_PATH_INVALID',
      `${label} inválido: ${String(value)}.`,
      'Use /YYYY/MM/DD/slug/.',
    );
  }
  return value;
};
const deterministicId = (prefix, seed) => {
  const digest = createHash('sha256').update(seed).digest();
  let body = '';
  for (let index = 0; index < 26; index += 1) body += CROCKFORD[digest[index % digest.length] & 31];
  return `${prefix}_${body}`;
};
const branchToken = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
const correctionTypeFor = (kind) =>
  ({
    correction: 'correcao-factual',
    clarification: 'esclarecimento',
    update: 'atualizacao-material',
    withdrawal: 'retirada',
  })[kind] ?? null;
const publicStatusFor = (kind, current) =>
  ({
    correction: 'corrigido',
    clarification: 'atualizado',
    update: 'atualizado',
    withdrawal: 'retirado',
    'slug-change': current,
  })[kind];

export const validateRedirects = (redirects) => {
  if (!Array.isArray(redirects))
    fail(
      'SUBSOLO_REDIRECT_LIST_INVALID',
      'Redirects precisam ser uma lista.',
      'Forneça uma lista de redirects públicos.',
    );
  const bySource = new Map();
  for (const redirect of redirects) {
    path(redirect?.from_path, 'redirect.from_path');
    path(redirect?.to_path, 'redirect.to_path');
    if (redirect.from_path === redirect.to_path)
      fail(
        'SUBSOLO_REDIRECT_SELF',
        `Redirect aponta para si próprio: ${redirect.from_path}.`,
        'Altere o destino.',
      );
    if (bySource.has(redirect.from_path))
      fail(
        'SUBSOLO_REDIRECT_DUPLICATE_SOURCE',
        `Origem duplicada: ${redirect.from_path}.`,
        'Mantenha um destino por origem.',
      );
    bySource.set(redirect.from_path, redirect.to_path);
  }
  for (const source of bySource.keys()) {
    const visited = new Set([source]);
    let current = bySource.get(source);
    while (current && bySource.has(current)) {
      if (visited.has(current))
        fail(
          'SUBSOLO_REDIRECT_LOOP',
          `Loop de redirect detectado a partir de ${source}.`,
          'Remova o ciclo antes da publicação.',
        );
      visited.add(current);
      current = bySource.get(current);
    }
  }
  return Object.freeze([...redirects].map((entry) => Object.freeze(clone(entry))));
};

export const validatePostPublicationState = (input) => {
  const state = clone(input);
  if (!state || typeof state !== 'object' || Array.isArray(state))
    fail(
      'SUBSOLO_POST_PUBLICATION_STATE_INVALID',
      'Estado pós-publicação inválido.',
      'Forneça um objeto de estado.',
    );
  if (state.schema_version !== SCHEMA_VERSION)
    fail(
      'SUBSOLO_POST_PUBLICATION_SCHEMA_INVALID',
      `Schema não suportado: ${state.schema_version}.`,
      `Use ${SCHEMA_VERSION}.`,
    );
  if (!PUB.test(state.publication_id ?? ''))
    fail('SUBSOLO_POST_PUBLICATION_ID_INVALID', 'ID público inválido.', 'Use pub_<ULID>.');
  if (!ARTICLE.test(state.article_id ?? ''))
    fail(
      'SUBSOLO_POST_PUBLICATION_ARTICLE_INVALID',
      'article_id inválido.',
      'Use art_<identificador>.',
    );
  text(state.title, 'title');
  path(state.original_path, 'original_path');
  path(state.canonical_path, 'canonical_path');
  revision(state.revision);
  timestamp(state.published_at, 'published_at');
  if (state.updated_at !== null) timestamp(state.updated_at, 'updated_at');
  if (!['publicado', 'atualizado', 'corrigido', 'retirado'].includes(state.status))
    fail(
      'SUBSOLO_POST_PUBLICATION_STATUS_INVALID',
      `Status inválido: ${state.status}.`,
      'Use estado público conhecido.',
    );
  if (!['full', 'tombstone'].includes(state.body_visibility))
    fail(
      'SUBSOLO_POST_PUBLICATION_BODY_VISIBILITY_INVALID',
      'Visibilidade do corpo inválida.',
      'Use full ou tombstone.',
    );
  if (!Array.isArray(state.history) || state.history.length < 1)
    fail(
      'SUBSOLO_POST_PUBLICATION_HISTORY_EMPTY',
      'Histórico inicial ausente.',
      'Registre a revisão publicada original.',
    );
  if (!Array.isArray(state.corrections))
    fail(
      'SUBSOLO_POST_PUBLICATION_CORRECTIONS_INVALID',
      'Correções precisam ser lista.',
      'Use uma lista, mesmo vazia.',
    );
  validateRedirects(state.redirects ?? []);
  if (state.status === 'retirado' && !state.tombstone)
    fail(
      'SUBSOLO_TOMBSTONE_MISSING',
      'Publicação retirada exige tombstone.',
      'Registre motivo, impacto e data da retirada.',
    );
  if (state.status !== 'retirado' && state.tombstone)
    fail(
      'SUBSOLO_TOMBSTONE_UNEXPECTED',
      'Tombstone só pode existir em publicação retirada.',
      'Remova o tombstone ou marque a retirada formal.',
    );
  return Object.freeze(state);
};

const validatePayload = (state, raw) => {
  const payload = clone(raw);
  if (!POST_PUBLICATION_KINDS.includes(payload?.kind))
    fail(
      'SUBSOLO_POST_PUBLICATION_KIND_INVALID',
      `Tipo de mudança inválido: ${payload?.kind}.`,
      `Use ${POST_PUBLICATION_KINDS.join(', ')}.`,
    );
  timestamp(payload.at);
  text(payload.summary, 'summary', 8);
  text(payload.reason, 'reason', 8);
  text(payload.impact, 'impact', 8);
  revision(payload.previous_revision, 'previous_revision');
  if (payload.previous_revision !== state.revision) {
    fail(
      'SUBSOLO_POST_PUBLICATION_PREVIOUS_REVISION_MISMATCH',
      'A mudança não referencia a revisão pública atual.',
      'Recarregue o estado e informe previous_revision igual à revisão vigente.',
      { expected: state.revision, received: payload.previous_revision },
    );
  }
  const factual = payload.factual_change === true;
  const material = payload.material_change === true;
  if (payload.kind === 'correction' && !factual)
    fail(
      'SUBSOLO_CORRECTION_NOT_FACTUAL',
      'Correção factual sem alteração factual.',
      'Use clarification/update ou marque factual_change=true.',
    );
  if (payload.kind === 'clarification' && (factual || material))
    fail(
      'SUBSOLO_CLARIFICATION_CLASSIFICATION_INVALID',
      'Esclarecimento não pode alterar fato nem conclusão material.',
      'Use correction ou update conforme a natureza da mudança.',
    );
  if (payload.kind === 'update' && (!material || factual))
    fail(
      'SUBSOLO_UPDATE_CLASSIFICATION_INVALID',
      'Atualização material foi classificada incorretamente.',
      'Use material_change=true e factual_change=false; fatos incorretos exigem correction.',
    );
  if (payload.kind === 'slug-change') {
    if (!SLUG.test(payload.new_slug ?? ''))
      fail('SUBSOLO_SLUG_CHANGE_INVALID', 'Novo slug inválido.', 'Use ASCII minúsculo e hífens.');
    const current = PUBLICATION_PATH.exec(state.canonical_path);
    if (current?.[4] === payload.new_slug)
      fail(
        'SUBSOLO_SLUG_CHANGE_NOOP',
        'O novo slug é igual ao atual.',
        'Escolha outro slug ou cancele a operação.',
      );
    if (factual || material)
      fail(
        'SUBSOLO_SLUG_CHANGE_MIXED',
        'Mudança de slug não pode esconder alteração editorial.',
        'Separe mudança de URL e alteração de conteúdo em revisões distintas.',
      );
  }
  if (payload.kind === 'withdrawal') {
    if (payload.hide_body !== true)
      fail(
        'SUBSOLO_WITHDRAWAL_VISIBILITY_INVALID',
        'Retirada precisa declarar hide_body=true.',
        'Confirme a substituição do corpo por página-túmulo.',
      );
  } else if (payload.hide_body === true) {
    fail(
      'SUBSOLO_POST_PUBLICATION_BODY_HIDE_INVALID',
      'Somente retirada pode ocultar o corpo.',
      'Remova hide_body ou use withdrawal.',
    );
  }
  return Object.freeze(payload);
};

export const planPostPublicationChange = ({ state: inputState, payload: inputPayload }) => {
  const state = validatePostPublicationState(inputState);
  const payload = validatePayload(state, inputPayload);
  const nextRevision = state.revision + 1;
  const idempotencyKey = `post-publication:${state.publication_id}:r${nextRevision}:${payload.kind}`;
  const branch = `editorial/${branchToken(state.article_id)}-r${nextRevision}-${payload.kind}`;
  return Object.freeze({
    mode: 'dry-run',
    publication_id: state.publication_id,
    article_id: state.article_id,
    kind: payload.kind,
    previous_revision: state.revision,
    new_revision: nextRevision,
    idempotency_key: idempotencyKey,
    branch,
    merge: 'human-required',
    ordered_steps: Object.freeze([
      'validate-current-revision',
      'apply-public-change',
      'package-revision',
      'archive-package',
      'branch',
      'commit',
      'pull-request',
      'sheet-status',
    ]),
    writes: false,
  });
};

export const applyPostPublicationChange = ({ state: inputState, payload: inputPayload }) => {
  const state = validatePostPublicationState(inputState);
  const payload = validatePayload(state, inputPayload);
  const plan = planPostPublicationChange({ state, payload });
  const next = clone(state);
  next.revision = plan.new_revision;
  next.updated_at = payload.at;
  next.status = publicStatusFor(payload.kind, state.status);
  const changeId = deterministicId(
    'change',
    `${state.publication_id}\0${plan.new_revision}\0${payload.kind}\0${payload.at}`,
  );
  const change = {
    id: changeId,
    revision: plan.new_revision,
    kind: payload.kind,
    published_at: payload.at,
    summary: payload.summary,
    reason: payload.reason,
    impact: payload.impact,
    previous_revision: state.revision,
    package_sha256: null,
    package_path: null,
    pull_request_url: null,
  };
  if (payload.kind === 'slug-change') {
    const match = PUBLICATION_PATH.exec(state.canonical_path);
    const newPath = `/${match[1]}/${match[2]}/${match[3]}/${payload.new_slug}/`;
    const redirect = Object.freeze({
      schema_version: SCHEMA_VERSION,
      id: deterministicId(
        'redirect',
        `${state.publication_id}\0${state.canonical_path}\0${newPath}`,
      ),
      publication_id: state.publication_id,
      from_path: state.canonical_path,
      to_path: newPath,
      status_code: 308,
      effective_at: payload.at,
      reason: payload.reason,
    });
    next.redirects = [...state.redirects, redirect];
    validateRedirects(next.redirects);
    next.canonical_path = newPath;
  }
  const correctionType = correctionTypeFor(payload.kind);
  if (correctionType) {
    next.corrections = [
      ...state.corrections,
      Object.freeze({
        schema_version: SCHEMA_VERSION,
        id: deterministicId(
          'corr',
          `${state.publication_id}\0${state.revision}\0${plan.new_revision}\0${payload.kind}`,
        ),
        publication_id: state.publication_id,
        type: correctionType,
        published_at: payload.at,
        summary: payload.summary,
        impact: payload.impact,
        previous_revision: state.revision,
        new_revision: plan.new_revision,
      }),
    ];
  }
  if (payload.kind === 'withdrawal') {
    next.body_visibility = 'tombstone';
    next.tombstone = Object.freeze({
      schema_version: SCHEMA_VERSION,
      id: deterministicId('tomb', `${state.publication_id}\0${payload.at}`),
      publication_id: state.publication_id,
      canonical_path: state.canonical_path,
      title: state.title,
      reason: payload.reason,
      impact: payload.impact,
      published_at: payload.at,
      original_published_at: state.published_at,
      body_hidden: true,
    });
  }
  next.history = [...state.history, change];
  return Object.freeze(next);
};

export const finalizePostPublicationArtifacts = ({
  state: inputState,
  revision,
  packageResult,
  pullRequestUrl,
}) => {
  const state = validatePostPublicationState(inputState);
  if (state.revision !== revision)
    fail(
      'SUBSOLO_POST_PUBLICATION_FINALIZE_REVISION_INVALID',
      'A revisão finalizada diverge do estado.',
      'Finalize a revisão atual.',
    );
  const packageSha = text(packageResult?.package_sha256, 'package_sha256', 64);
  const packagePath = text(packageResult?.package_path, 'package_path');
  const prUrl = text(pullRequestUrl, 'pull_request_url');
  const next = clone(state);
  next.current_package = {
    run_id: text(packageResult?.run_id, 'run_id'),
    sha256: packageSha,
    path: packagePath,
  };
  next.current_pull_request_url = prUrl;
  const last = next.history.at(-1);
  if (!last || last.revision !== revision)
    fail(
      'SUBSOLO_POST_PUBLICATION_HISTORY_MISMATCH',
      'Histórico não contém a revisão finalizada.',
      'Reaplique a mudança antes de finalizar artefatos.',
    );
  last.package_sha256 = packageSha;
  last.package_path = packagePath;
  last.pull_request_url = prUrl;
  return Object.freeze(next);
};
