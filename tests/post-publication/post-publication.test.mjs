import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { inspectPackage } from '../../cli/packager-core.mjs';
import {
  applyPostPublicationChange,
  planPostPublicationChange,
  validateRedirects,
} from '../../src/lib/domain/post-publication.mjs';
import { executePostPublicationRun } from '../../src/lib/application/post-publication-orchestrator.mjs';

const load = async (name) => JSON.parse(await readFile(new URL(`../../fixtures/post-publication/${name}.json`, import.meta.url), 'utf8'));
const state = await load('state');

test('dry-run descreve revisão, pacote e PR sem efeitos', async () => {
  const payload = await load('correction');
  const plan = planPostPublicationChange({ state, payload });
  assert.equal(plan.writes, false);
  assert.equal(plan.previous_revision, 1);
  assert.equal(plan.new_revision, 2);
  assert.deepEqual(plan.ordered_steps.slice(0, 4), ['validate-current-revision', 'apply-public-change', 'package-revision', 'archive-package']);
  assert.equal(plan.merge, 'human-required');
});

test('correção factual cria registro público e incrementa revisão', async () => {
  const payload = await load('correction');
  const next = applyPostPublicationChange({ state, payload });
  assert.equal(next.revision, 2);
  assert.equal(next.status, 'corrigido');
  assert.equal(next.corrections.length, 1);
  assert.equal(next.corrections[0].type, 'correcao-factual');
  assert.equal(next.corrections[0].previous_revision, 1);
  assert.equal(next.corrections[0].new_revision, 2);
  assert.equal(state.revision, 1, 'estado anterior precisa permanecer imutável');
});

test('correção sem referência à revisão atual é rejeitada', async () => {
  const payload = { ...(await load('correction')) };
  delete payload.previous_revision;
  assert.throws(() => applyPostPublicationChange({ state, payload }), /previous_revision/);
});

test('atualização factual disfarçada de update é rejeitada', async () => {
  const payload = { ...(await load('update')), factual_change: true };
  assert.throws(() => applyPostPublicationChange({ state, payload }), /classificada incorretamente/);
});

test('esclarecimento não pode modificar fato ou conclusão material', async () => {
  const payload = { ...(await load('clarification')), material_change: true };
  assert.throws(() => applyPostPublicationChange({ state, payload }), /Esclarecimento/);
});

test('mudança de slug preserva URL anterior por redirect 308', async () => {
  const payload = await load('slug-change');
  const next = applyPostPublicationChange({ state, payload });
  assert.equal(next.canonical_path, '/2026/07/20/cidade-terceirizou-o-relogio/');
  assert.equal(next.original_path, state.original_path);
  assert.equal(next.redirects.length, 1);
  assert.equal(next.redirects[0].from_path, state.canonical_path);
  assert.equal(next.redirects[0].to_path, next.canonical_path);
  assert.equal(next.redirects[0].status_code, 308);
});

test('redirect circular é rejeitado', () => {
  assert.throws(() => validateRedirects([
    { from_path: '/2026/07/20/a/', to_path: '/2026/07/20/b/' },
    { from_path: '/2026/07/20/b/', to_path: '/2026/07/20/a/' },
  ]), /Loop de redirect/);
});

test('retirada substitui o corpo por tombstone e preserva canonical', async () => {
  const payload = await load('withdrawal');
  const next = applyPostPublicationChange({ state, payload });
  assert.equal(next.status, 'retirado');
  assert.equal(next.body_visibility, 'tombstone');
  assert.equal(next.canonical_path, state.canonical_path);
  assert.equal(next.tombstone.reason, payload.reason);
  assert.equal(next.tombstone.body_hidden, true);
  assert.equal(next.corrections.at(-1).type, 'retirada');
});

test('orquestração arquiva pacote antes de qualquer efeito Git e atualiza Sheets', async () => {
  const payload = await load('correction');
  const events = [];
  const ports = {
    sheets: {
      readPostPublicationState: async () => ({ revision: 1, canonical_path: state.canonical_path }),
      updatePostPublicationState: async (_id, patch) => events.push(['sheet', patch]),
    },
    packages: {
      createRevision: async ({ previous_package, revision }) => {
        events.push(['package', previous_package.sha256, revision]);
        return {
          run_id: 'run_20260720T161000-0300_r2',
          package_sha256: 'a'.repeat(64),
          package_path: '/tmp/r2.zip',
        };
      },
    },
    drive: { archivePackage: async () => { events.push(['drive']); return { file_id: 'drive-file-r2' }; } },
    git: {
      createBranch: async (branch) => events.push(['branch', branch]),
      commitPostPublication: async () => events.push(['commit']),
      findOpenPullRequest: async () => null,
      createPullRequest: async () => { events.push(['pr']); return { url: 'https://github.example/subsolo/pull/2' }; },
    },
  };
  const result = await executePostPublicationRun({ state, payload, ports, mode: 'apply' });
  assert.equal(result.state.revision, 2);
  assert.equal(result.state.current_package.sha256, 'a'.repeat(64));
  assert.equal(events.findIndex(([name]) => name === 'drive') < events.findIndex(([name]) => name === 'branch'), true);
  assert.equal(events.at(-1)[0], 'sheet');
});

test('falha de arquivo técnico impede branch e PR', async () => {
  const payload = await load('correction');
  const events = [];
  const ports = {
    sheets: { readPostPublicationState: async () => ({ revision: 1, canonical_path: state.canonical_path }), updatePostPublicationState: async () => events.push(['sheet']) },
    packages: { createRevision: async () => ({ run_id: 'run_20260720T161000-0300_r2', package_sha256: 'a'.repeat(64), package_path: '/tmp/r2.zip' }) },
    drive: { archivePackage: async () => ({ file_id: null }) },
    git: { createBranch: async () => events.push(['branch']), commitPostPublication: async () => events.push(['commit']), findOpenPullRequest: async () => null, createPullRequest: async () => events.push(['pr']) },
  };
  await assert.rejects(() => executePostPublicationRun({ state, payload, ports, mode: 'apply' }), /não foi confirmado/);
  assert.deepEqual(events, []);
});


test('pacotes r2 e r3 preservam cadeia, revisão anterior e tombstone', async () => {
  const r1 = inspectPackage(await readFile('fixtures/packager/golden/r1.zip'));
  const r2 = inspectPackage(await readFile('fixtures/post-publication/golden/r2-correction.zip'));
  const r3 = inspectPackage(await readFile('fixtures/post-publication/golden/r3-withdrawal.zip'));
  assert.equal(r1.manifest.revision, 1);
  assert.equal(r2.manifest.revision, 2);
  assert.equal(r2.manifest.supersedes, r1.manifest.run_id);
  assert.equal(r3.manifest.revision, 3);
  assert.equal(r3.manifest.supersedes, r2.manifest.run_id);
  assert.notEqual(r1.package_sha256, r2.package_sha256);
  assert.notEqual(r2.package_sha256, r3.package_sha256);
  const r2Corrections = JSON.parse(r2.entries.get('publications/pub_MB76FYPQZ5RTPENBAR5611AJJ0/corrections.json').toString('utf8'));
  const r3Corrections = JSON.parse(r3.entries.get('publications/pub_MB76FYPQZ5RTPENBAR5611AJJ0/corrections.json').toString('utf8'));
  assert.equal(r2Corrections.at(-1).type, 'correcao-factual');
  assert.equal(r3Corrections.at(-1).type, 'retirada');
  const withdrawnBody = r3.entries.get('publications/pub_MB76FYPQZ5RTPENBAR5611AJJ0/publication.md').toString('utf8');
  assert.match(withdrawnBody, /Esta publicação foi retirada/);
  assert.doesNotMatch(withdrawnBody, /O incidente começou às 7h42/);
});
