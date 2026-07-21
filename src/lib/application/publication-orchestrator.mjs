import { createHash } from 'node:crypto';

export class OrchestrationFailure extends Error {
  constructor(code, message, action, details = {}, retryable = false) {
    super(message);
    this.name = 'OrchestrationFailure';
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
const fail = (code, message, action, details = {}, retryable = false) => {
  throw new OrchestrationFailure(code, message, action, details, retryable);
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const safe = (value) =>
  String(value ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .slice(0, 240);
export const createIdempotencyKey = ({ article_id, revision }) => {
  if (!/^art_[a-z0-9_-]+$/i.test(article_id ?? '') || !Number.isInteger(revision) || revision < 1) {
    fail(
      'SUBSOLO_ORCHESTRATION_CANDIDATE_INVALID',
      'Artigo ou revisão inválidos.',
      'Corrija article_id e revision.',
    );
  }
  return `publication:${article_id}:r${revision}:${sha256(`${article_id}\0${revision}`).slice(0, 16)}`;
};
export const branchNameFor = ({ article_id, revision }) =>
  `editorial/${article_id.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}-r${revision}`;
export const planPublicationRun = ({ candidate }) => {
  if (candidate?.editorial_status !== 'PRONTO_PARA_PUBLICAR')
    fail(
      'SUBSOLO_ORCHESTRATION_NOT_READY',
      'O artigo não está pronto para publicar.',
      'Conclua as revisões e marque PRONTO_PARA_PUBLICAR.',
    );
  const idempotency_key = createIdempotencyKey(candidate);
  return Object.freeze({
    mode: 'dry-run',
    idempotency_key,
    article_id: candidate.article_id,
    revision: candidate.revision,
    edition_id: candidate.edition_id,
    ordered_steps: [
      'lock',
      'export',
      'validate',
      'package',
      'archive-drive',
      'branch',
      'commit',
      'pull-request',
      'sheet-status',
      'complete',
    ],
    branch: branchNameFor(candidate),
    merge: 'human-required',
    writes: false,
  });
};

const step = async ({ ports, run, state, operation, patch = {} }) => {
  const value = await operation();
  const updated = { ...run, state, ...patch, ...(value && typeof value === 'object' ? value : {}) };
  await ports.runs.save(updated);
  return updated;
};

export const executePublicationRun = async ({
  candidate,
  ports,
  mode = 'apply',
  now = () => new Date(),
}) => {
  const plan = planPublicationRun({ candidate });
  if (mode === 'dry-run') return plan;
  const existing = await ports.runs.findByIdempotencyKey(plan.idempotency_key);
  if (existing?.state === 'completed') return { disposition: 'already-completed', run: existing };
  const existingPr = await ports.git.findOpenPullRequest(plan.branch);
  if (existingPr && !existing) {
    return {
      disposition: 'existing-pr',
      pull_request_url: existingPr.url,
      branch: plan.branch,
      idempotency_key: plan.idempotency_key,
    };
  }
  const lock = await ports.locks.acquire(plan.idempotency_key);
  if (!lock?.acquired)
    fail(
      'SUBSOLO_ORCHESTRATION_LOCKED',
      'Outro processo já controla este artigo e revisão.',
      'Aguarde ou execute a reconciliação.',
      { idempotency_key: plan.idempotency_key },
      true,
    );
  let run = existing ?? {
    run_id: `orun_${sha256(`${plan.idempotency_key}\0${now().toISOString()}`).slice(0, 20)}`,
    idempotency_key: plan.idempotency_key,
    article_id: candidate.article_id,
    revision: candidate.revision,
    edition_id: candidate.edition_id,
    state: 'planned',
    package_sha256: null,
    drive_file_id: null,
    branch: null,
    pull_request_url: null,
    created_at: now().toISOString(),
    updated_at: now().toISOString(),
  };
  await ports.runs.save(run);
  try {
    const current = await ports.sheets.readCandidate(candidate.article_id);
    if (
      current.revision !== candidate.revision ||
      current.editorial_status !== 'PRONTO_PARA_PUBLICAR'
    ) {
      fail(
        'SUBSOLO_ORCHESTRATION_SHEETS_DIVERGED',
        'O Sheets divergiu da entrada do workflow.',
        'Recarregue a linha e reavalie a prontidão.',
        { expected_revision: candidate.revision, actual_revision: current.revision },
      );
    }
    run = await step({
      ports,
      run,
      state: 'locked',
      operation: async () => ({ updated_at: now().toISOString() }),
    });
    run = await step({
      ports,
      run,
      state: 'exported',
      operation: () => ports.cli.exportDocument({ candidate, mode: 'apply' }),
    });
    await ports.cli.validateExport({ candidate, export_path: run.export_path });
    run = await step({
      ports,
      run,
      state: 'packaged',
      operation: () => ports.cli.packageEdition({ candidate, export_path: run.export_path }),
    });
    run = await step({
      ports,
      run,
      state: 'archived',
      operation: () =>
        ports.drive.archivePackage({
          package_path: run.package_path,
          package_sha256: run.package_sha256,
        }),
    });
    // Arquivo confirmado antes de qualquer efeito Git.
    run = await step({
      ports,
      run,
      state: 'branch-created',
      operation: () => ports.git.createBranch(plan.branch),
      patch: { branch: plan.branch },
    });
    run = await step({
      ports,
      run,
      state: 'committed',
      operation: () =>
        ports.git.commitPublicContent({
          branch: plan.branch,
          export_path: run.export_path,
          package_sha256: run.package_sha256,
        }),
    });
    const pr =
      existingPr ??
      (await ports.git.createPullRequest({
        branch: plan.branch,
        title: `Publicar ${candidate.article_id} r${candidate.revision}`,
      }));
    run = await step({
      ports,
      run,
      state: 'pr-created',
      operation: async () => ({ pull_request_url: pr.url }),
      patch: { pull_request_url: pr.url },
    });
    await ports.sheets.updateStatus(candidate.article_id, {
      status: 'PR_CRIADO',
      branch: plan.branch,
      pull_request_url: pr.url,
      run_id: run.run_id,
    });
    run = await step({ ports, run, state: 'sheet-updated', operation: async () => ({}) });
    run = await step({
      ports,
      run,
      state: 'completed',
      operation: async () => ({ completed_at: now().toISOString() }),
    });
    return { disposition: existing ? 'resumed' : 'created', run, merge: 'human-required' };
  } catch (error) {
    const payload =
      typeof error?.toJSON === 'function'
        ? error.toJSON()
        : {
            code: 'SUBSOLO_ORCHESTRATION_UNEXPECTED',
            message: safe(error?.message),
            action: 'Inspecione o run e execute retry manual.',
            retryable: false,
            details: {},
          };
    const failed = {
      ...run,
      state: 'failed',
      error_code: payload.code,
      error_message: safe(payload.message),
      retryable: Boolean(payload.retryable),
      updated_at: now().toISOString(),
    };
    await ports.runs.save(failed);
    await ports.deadLetters.enqueue({
      run_id: failed.run_id,
      idempotency_key: failed.idempotency_key,
      error_code: payload.code,
      retryable: Boolean(payload.retryable),
    });
    await ports.alerts.send({
      severity: payload.retryable ? 'warning' : 'error',
      code: payload.code,
      run_id: failed.run_id,
      article_id: failed.article_id,
      action: payload.action,
    });
    throw error;
  } finally {
    await ports.locks.release(plan.idempotency_key);
  }
};

export const reconcilePublication = async ({ candidate, ports, mode = 'dry-run' }) => {
  const key = createIdempotencyKey(candidate);
  const run = await ports.runs.findByIdempotencyKey(key);
  const sheet = await ports.sheets.readCandidate(candidate.article_id);
  const drive = run?.package_sha256 ? await ports.drive.findBySha256(run.package_sha256) : null;
  const pr = await ports.git.findOpenPullRequest(branchNameFor(candidate));
  const issues = [];
  if (run?.drive_file_id && !drive)
    issues.push({
      code: 'DRIVE_FILE_MISSING',
      action: 'Rearquive o pacote antes de retomar o Git.',
    });
  if (run?.pull_request_url && !pr)
    issues.push({
      code: 'PULL_REQUEST_MISSING',
      action: 'Confirme se o PR foi fechado ou crie um novo PR autorizado.',
    });
  if (sheet.editorial_status === 'PR_CRIADO' && !pr)
    issues.push({
      code: 'SHEETS_PR_DIVERGED',
      action: 'Corrija o status no Sheets ou recrie o PR.',
    });
  const result = {
    mode,
    article_id: candidate.article_id,
    idempotency_key: key,
    run_state: run?.state ?? null,
    sheet_status: sheet.editorial_status,
    drive_file_id: drive?.id ?? null,
    pull_request_url: pr?.url ?? null,
    issues,
  };
  if (mode === 'apply' && issues.length)
    fail(
      'SUBSOLO_RECONCILIATION_REQUIRES_HUMAN',
      'A reconciliação encontrou divergências.',
      'Resolva os itens explicitamente; nenhuma correção silenciosa foi aplicada.',
      { issues },
    );
  return result;
};
