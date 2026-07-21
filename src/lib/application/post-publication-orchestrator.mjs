import {
  applyPostPublicationChange,
  finalizePostPublicationArtifacts,
  planPostPublicationChange,
  validatePostPublicationState,
} from '../domain/post-publication.mjs';

export const executePostPublicationRun = async ({
  state: inputState,
  payload,
  ports,
  mode = 'dry-run',
}) => {
  const state = validatePostPublicationState(inputState);
  const plan = planPostPublicationChange({ state, payload });
  if (mode === 'dry-run') return plan;
  const current = await ports.sheets.readPostPublicationState(state.publication_id);
  if (
    !current ||
    current.revision !== state.revision ||
    current.canonical_path !== state.canonical_path
  ) {
    throw Object.assign(new Error('O estado do Sheets divergiu da revisão local.'), {
      code: 'SUBSOLO_POST_PUBLICATION_SHEETS_DIVERGED',
      action: 'Recarregue a publicação antes de criar nova revisão.',
    });
  }
  const changed = applyPostPublicationChange({ state, payload });
  const packageResult = await ports.packages.createRevision({
    previous_package: state.current_package,
    publication_state: changed,
    previous_revision: state.revision,
    revision: changed.revision,
  });
  const archived = await ports.drive.archivePackage({
    package_path: packageResult.package_path,
    package_sha256: packageResult.package_sha256,
  });
  if (!archived?.file_id)
    throw Object.assign(new Error('O pacote não foi confirmado no arquivo técnico.'), {
      code: 'SUBSOLO_POST_PUBLICATION_DRIVE_NOT_CONFIRMED',
      action: 'Confirme o arquivo no Drive antes de criar efeitos Git.',
    });
  await ports.git.createBranch(plan.branch);
  await ports.git.commitPostPublication({
    branch: plan.branch,
    state: changed,
    package_sha256: packageResult.package_sha256,
  });
  const existing = await ports.git.findOpenPullRequest(plan.branch);
  const pr =
    existing ??
    (await ports.git.createPullRequest({
      branch: plan.branch,
      title: `${payload.kind}: ${state.title} r${changed.revision}`,
    }));
  const finalized = finalizePostPublicationArtifacts({
    state: changed,
    revision: changed.revision,
    packageResult,
    pullRequestUrl: pr.url,
  });
  await ports.sheets.updatePostPublicationState(state.publication_id, {
    revision: finalized.revision,
    status: finalized.status,
    canonical_path: finalized.canonical_path,
    correction_type: finalized.corrections.at(-1)?.type ?? null,
    package_sha256: finalized.current_package.sha256,
    package_path: finalized.current_package.path,
    branch: plan.branch,
    pull_request_url: pr.url,
    body_visibility: finalized.body_visibility,
  });
  return Object.freeze({
    disposition: existing ? 'existing-pr' : 'created',
    state: finalized,
    drive_file_id: archived.file_id,
    branch: plan.branch,
    pull_request_url: pr.url,
    merge: 'human-required',
  });
};
