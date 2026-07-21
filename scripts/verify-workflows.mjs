import { readFile } from 'node:fs/promises';

const files = [
  '.github/workflows/ci.yml',
  '.github/workflows/preview.yml',
  '.github/workflows/deploy-pages.yml',
  '.github/workflows/scheduled-checks.yml',
  '.github/actions/setup-project/action.yml',
];
const content = Object.fromEntries(await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')])));
const violations = [];
const requireText = (file, pattern, message) => {
  if (!pattern.test(content[file])) violations.push(`${file}: ${message}`);
};
const forbidText = (file, pattern, message) => {
  if (pattern.test(content[file])) violations.push(`${file}: ${message}`);
};
for (const file of files) {
  forbidText(file, /@(?:main|master)\b/, 'Action não pode apontar para branch mutável');
  forbidText(file, /pull_request_target\s*:/, 'pull_request_target não é permitido');
  forbidText(file, /permissions:\s*write-all/, 'write-all não é permitido');
}
requireText('.github/workflows/ci.yml', /permissions:\s*\n\s+contents:\s+read/, 'CI deve usar contents: read');
requireText('.github/workflows/ci.yml', /pnpm verify:dist/, 'CI deve verificar o artefato');
requireText('.github/workflows/ci.yml', /pnpm scan:public-artifact/, 'CI deve varrer o artefato público');
requireText('.github/workflows/preview.yml', /actions\/upload-artifact@v\d+\.\d+\.\d+/, 'preview deve enviar artefato com versão exata');
forbidText('.github/workflows/preview.yml', /pages:\s+write|id-token:\s+write/, 'preview não deve ter permissões de deploy');
requireText('.github/workflows/deploy-pages.yml', /branches:\s*\[main\]/, 'deploy deve ocorrer somente em main');
requireText('.github/workflows/deploy-pages.yml', /cancel-in-progress:\s+false/, 'deploys não devem cancelar publicação em andamento');
requireText('.github/workflows/deploy-pages.yml', /pages:\s+write/, 'deploy exige pages: write');
requireText('.github/workflows/deploy-pages.yml', /id-token:\s+write/, 'deploy exige id-token: write');
requireText('.github/workflows/deploy-pages.yml', /environment:\s*\n\s+name:\s+github-pages/, 'deploy deve usar o ambiente github-pages');
requireText('.github/workflows/deploy-pages.yml', /actions\/upload-pages-artifact@v5\.0\.0/, 'upload Pages deve usar a versão estável aprovada');
requireText('.github/workflows/deploy-pages.yml', /actions\/deploy-pages@v5\.0\.0/, 'deploy Pages deve usar a versão estável aprovada');
requireText('.github/workflows/deploy-pages.yml', /pnpm scan:public-artifact/, 'deploy deve varrer o artefato antes do upload');
requireText('.github/workflows/deploy-pages.yml', /scripts\/smoke-site\.mjs/, 'deploy deve executar smoke test');
requireText('.github/workflows/scheduled-checks.yml', /schedule:/, 'smoke externo deve ser agendado');
requireText('.github/workflows/scheduled-checks.yml', /scripts\/smoke-site\.mjs/, 'workflow agendado deve executar smoke-site');
forbidText('.github/workflows/scheduled-checks.yml', /pages:\s+write|id-token:\s+write/, 'smoke agendado não deve publicar');
requireText('.github/actions/setup-project/action.yml', /pnpm\/action-setup@v6\.0\.9/, 'pnpm action deve estar fixada');
requireText('.github/actions/setup-project/action.yml', /actions\/setup-node@v6\.5\.0/, 'setup-node deve estar fixada');
if (violations.length) {
  console.error('SUBSOLO_WORKFLOW_INVALID');
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(`Workflows aprovados: ${files.length} arquivos, permissões mínimas e versões explícitas.`);
