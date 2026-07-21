import { createHash } from 'node:crypto';
const sha = (v) => createHash('sha256').update(v).digest('hex');
export const createFixtureOrchestrationPorts = ({
  candidate,
  failureAt = null,
  completedRun = null,
} = {}) => {
  const state = {
    runs: new Map(),
    locks: new Set(),
    deadLetters: [],
    alerts: [],
    sheet: { ...candidate },
    drive: new Map(),
    prs: new Map(),
    events: [],
  };
  if (completedRun) state.runs.set(completedRun.idempotency_key, completedRun);
  const fail = (point) => {
    if (failureAt === point) {
      const e = new Error(`fixture failure: ${point}`);
      e.code = `FIXTURE_${point.toUpperCase()}`;
      throw e;
    }
  };
  const ports = {
    runs: {
      findByIdempotencyKey: async (k) => state.runs.get(k) ?? null,
      save: async (r) => {
        state.runs.set(r.idempotency_key, { ...r });
        state.events.push(`run:${r.state}`);
      },
    },
    locks: {
      acquire: async (k) => {
        fail('lock');
        if (state.locks.has(k)) return { acquired: false };
        state.locks.add(k);
        state.events.push('lock:acquired');
        return { acquired: true };
      },
      release: async (k) => {
        state.locks.delete(k);
        state.events.push('lock:released');
      },
    },
    cli: {
      exportDocument: async () => {
        fail('export');
        state.events.push('cli:export');
        return { export_path: `.tmp/export/${candidate.article_id}` };
      },
      validateExport: async () => {
        fail('validate');
        state.events.push('cli:validate');
      },
      packageEdition: async () => {
        fail('package');
        state.events.push('cli:package');
        const hash = sha(`${candidate.article_id}:r${candidate.revision}`);
        return { package_path: `.tmp/packages/${hash}.zip`, package_sha256: hash };
      },
    },
    drive: {
      archivePackage: async ({ package_sha256 }) => {
        fail('drive');
        state.events.push('drive:archive');
        const value = { drive_file_id: `drive_${package_sha256.slice(0, 12)}` };
        state.drive.set(package_sha256, { id: value.drive_file_id });
        return value;
      },
      findBySha256: async (hash) => state.drive.get(hash) ?? null,
    },
    git: {
      findOpenPullRequest: async (branch) => state.prs.get(branch) ?? null,
      createBranch: async (branch) => {
        fail('branch');
        state.events.push('git:branch');
        return { branch };
      },
      commitPublicContent: async () => {
        fail('commit');
        state.events.push('git:commit');
        return { commit_sha: sha('commit').slice(0, 40) };
      },
      createPullRequest: async ({ branch }) => {
        fail('pr');
        state.events.push('git:pr');
        const pr = { url: `https://github.invalid/subsolo/pull/${state.prs.size + 1}` };
        state.prs.set(branch, pr);
        return pr;
      },
    },
    sheets: {
      readCandidate: async () => ({ ...state.sheet }),
      updateStatus: async (_id, patch) => {
        fail('sheets');
        state.events.push('sheets:update');
        state.sheet = { ...state.sheet, editorial_status: patch.status, ...patch };
      },
    },
    deadLetters: {
      enqueue: async (item) => {
        state.deadLetters.push(item);
        state.events.push('dead-letter');
      },
    },
    alerts: {
      send: async (item) => {
        state.alerts.push(item);
        state.events.push('alert');
      },
    },
  };
  return { ports, state };
};
