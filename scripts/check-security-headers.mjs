import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs, projectRoot, readJson, relativePosix, walkFiles } from './hardening-utils.mjs';

export const checkSecurityHeaders = async ({ root = projectRoot } = {}) => {
  const issues = [];
  const policy = await readJson(resolve(root, 'config/hardening/security-policy.json'));
  const layout = await readFile(resolve(root, 'src/layouts/JornalConcretoLayout.astro'), 'utf8');
  const builder = await readFile(resolve(root, 'src/lib/presentation/security-headers.ts'), 'utf8');
  if (!/http-equiv="Content-Security-Policy"/.test(layout)) issues.push('Layout sem meta CSP.');
  if (!/name="referrer" content="strict-origin-when-cross-origin"/.test(layout)) issues.push('Referrer policy ausente ou divergente.');
  if (!/buildContentSecurityPolicy\(jsonLdText\)/.test(layout)) issues.push('CSP não deriva do builder central.');
  if (!/sha256CspHash/.test(builder) || !/application\/ld\+json/.test(layout)) issues.push('JSON-LD inline não está protegido por hash CSP.');
  const policyString = JSON.stringify(policy.content_security_policy);
  for (const token of policy.forbidden_csp_tokens) if (policyString.includes(token)) issues.push(`Token CSP proibido: ${token}`);
  if (!builder.includes("'wasm-unsafe-eval'")) issues.push('Pagefind/WASM não possui autorização CSP restrita.');
  if (!builder.includes("'none'")) issues.push('object-src none ausente.');

  const astroFiles = (await walkFiles(resolve(root, 'src'))).filter(({ path }) => /\.(?:astro|ts|mjs)$/.test(path));
  for (const file of astroFiles) {
    const source = await readFile(file.path, 'utf8');
    const name = relativePosix(root, file.path);
    if (/<script\b(?![^>]*\bsrc=)(?![^>]*type=["']application\/ld\+json["'])/i.test(source)) issues.push(`${name}: script executável inline.`);
    if (/\bis:inline\b|\bdefine:vars\b/.test(source)) issues.push(`${name}: diretiva de script inline.`);
    if (/\b(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b|\beval\s*\(|\bnew\s+Function\s*\(/.test(source)) issues.push(`${name}: sink dinâmico de HTML/código.`);
    if (/<(?:iframe|object|embed)\b/i.test(source)) issues.push(`${name}: conteúdo incorporado não permitido.`);
    if (/(?:src|href)=["']https?:\/\//i.test(source) && /\.(?:js|css)(?:[?"'])/i.test(source)) issues.push(`${name}: asset executável externo.`);
  }
  for (const path of ['public/assets/theme.js','public/assets/search.js']) {
    const source = await readFile(resolve(root, path), 'utf8');
    if (/\b(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b|\beval\s*\(|\bnew\s+Function\s*\(/.test(source)) issues.push(`${path}: sink inseguro.`);
  }
  return {
    status: issues.length ? 'fail' : 'pass',
    issues,
    metaEnforcedDirectives: Object.keys(policy.content_security_policy),
    residualPlatformLimits: policy.residual_platform_limits,
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const report = await checkSecurityHeaders({ root: resolve(args.root ?? projectRoot) });
  if (args.report) await writeFile(resolve(args.report), `${JSON.stringify(report, null, 2)}\n`);
  if (report.issues.length) { console.error('SUBSOLO_HEADERS_INVALID'); console.error(report.issues.join('\n')); process.exit(1); }
  console.log(`CSP e política de referrer aprovadas; ${report.metaEnforcedDirectives.length} diretivas verificadas.`);
}
