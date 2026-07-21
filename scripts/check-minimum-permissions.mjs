import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs, projectRoot, relativePosix, walkFiles } from './hardening-utils.mjs';

const allowedWrite = new Set(['pages', 'id-token']);

export const checkMinimumPermissions = async ({ root = projectRoot } = {}) => {
  const issues = [];
  const workflowsRoot = resolve(root, '.github/workflows');
  const workflows = (await walkFiles(workflowsRoot)).filter(({ path }) => /\.ya?ml$/.test(path));
  for (const file of workflows) {
    const source = await readFile(file.path, 'utf8');
    const name = relativePosix(root, file.path);
    if (/\bpull_request_target\s*:|\bworkflow_run\s*:/.test(source))
      issues.push(`${name}: gatilho privilegiado proibido.`);
    if (/permissions:\s*(?:write-all|read-all)/.test(source))
      issues.push(`${name}: permissão agregada proibida.`);
    if (!/^permissions:\n\s+contents:\s+read\s*$/m.test(source))
      issues.push(`${name}: permissions globais devem declarar contents: read.`);
    for (const match of source.matchAll(/^\s{6}([a-z-]+):\s+write\s*$/gm)) {
      if (!allowedWrite.has(match[1]) || !name.endsWith('deploy-pages.yml'))
        issues.push(`${name}: escrita não autorizada em ${match[1]}.`);
    }
    for (const match of source.matchAll(/uses:\s+([^\s]+)@([^\s]+)/g)) {
      const [, action, reference] = match;
      if (action.startsWith('./')) continue;
      if (!/^v\d+\.\d+\.\d+$/.test(reference) && !/^[a-f0-9]{40}$/.test(reference))
        issues.push(
          `${name}: action não está fixada em semver exato ou SHA: ${action}@${reference}`,
        );
    }
    const checkoutBlocks = source
      .split(/(?=\n\s*- name:)/)
      .filter((block) => /uses:\s+actions\/checkout@/.test(block));
    for (const block of checkoutBlocks)
      if (!/persist-credentials:\s*false/.test(block))
        issues.push(`${name}: checkout deve desativar persist-credentials.`);
    if (/\bsecrets\./.test(source) && /pull_request:/.test(source))
      issues.push(`${name}: workflow de PR não deve consumir secrets.`);
  }

  const compose = await readFile(resolve(root, 'infra/compose.yml'), 'utf8');
  if (/privileged:\s*true|network_mode:\s*host|\/var\/run\/docker\.sock/.test(compose))
    issues.push('Compose usa privilégio, host network ou docker socket.');
  for (const port of compose.matchAll(/^\s+-\s+"([^"]+):\d+"\s*$/gm))
    if (!port[1].startsWith('127.0.0.1:'))
      issues.push(`Porta local não vinculada ao loopback: ${port[0].trim()}`);
  const servicesBlock = compose.match(/^services:\n([\s\S]*?)^networks:/m)?.[1] ?? '';
  const serviceCount = [...servicesBlock.matchAll(/^ {2}[a-z0-9-]+:\s*$/gm)].length;
  const noNewPrivilegesCount = [...compose.matchAll(/no-new-privileges:true/g)].length;
  if (noNewPrivilegesCount < serviceCount)
    issues.push(
      `Compose: ${noNewPrivilegesCount}/${serviceCount} serviços declaram no-new-privileges.`,
    );
  if (!/\.\.\/:\/workspace:ro/.test(compose))
    issues.push('Workspace do n8n deve ser somente leitura.');
  if (!/internal:\s*true/.test(compose)) issues.push('Rede backend interna ausente.');

  return {
    status: issues.length ? 'fail' : 'pass',
    workflows: workflows.length,
    serviceCount,
    issues,
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const report = await checkMinimumPermissions({ root: resolve(args.root ?? projectRoot) });
  if (args.report) await writeFile(resolve(args.report), `${JSON.stringify(report, null, 2)}\n`);
  if (report.issues.length) {
    console.error('SUBSOLO_PERMISSIONS_INVALID');
    console.error(report.issues.join('\n'));
    process.exit(1);
  }
  console.log(
    `Permissões mínimas aprovadas: ${report.workflows} workflows e ${report.serviceCount} serviços.`,
  );
}
