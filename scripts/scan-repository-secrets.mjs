import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  isProbablyBinary,
  isTextCandidate,
  parseArgs,
  projectRoot,
  readJson,
  relativePosix,
  walkFiles,
} from './hardening-utils.mjs';

const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['slack-webhook', /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+/g],
  ['jwt', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  [
    'credential-assignment',
    /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|private[_-]?key|secret)\b\s*[=:]\s*["']?([^\s"'`,}\]]{12,})/gi,
  ],
];
const safeFragments = [
  '${',
  '$(',
  'example',
  'fixture',
  'fake',
  'placeholder',
  'redacted',
  'not-a-secret',
  'changeme',
  'defina_',
  'process.env',
  'import.meta.env',
  'subsolo_',
  '<secret>',
  '<token>',
];
const safeMatch = (value) =>
  safeFragments.some((fragment) => value.toLowerCase().includes(fragment.toLowerCase()));

export const scanRepositorySecrets = async ({ root = projectRoot } = {}) => {
  const policy = await readJson(resolve(root, 'config/hardening/security-policy.json'));
  const files = await walkFiles(root, {
    excludeDirectories: ['.git', 'node_modules', 'dist', '.astro', '.cache', '.tmp'],
  });
  const findings = [];
  let scannedFiles = 0;
  for (const file of files) {
    const name = relativePosix(root, file.path);
    if (file.symlink) {
      findings.push({
        code: 'SYMLINK',
        file: name,
        detail: 'Symlink não permitido na árvore auditada.',
      });
      continue;
    }
    if (
      (/^infra\/env\//.test(name) &&
        !/^infra\/env\/(?:\.env\.example|README\.md|\.gitkeep)$/.test(name)) ||
      /(^|\/)\.env$/.test(name) ||
      /\.(?:p12|pfx|key|pem)$/i.test(name)
    ) {
      findings.push({
        code: 'SENSITIVE_FILENAME',
        file: name,
        detail: 'Arquivo sensível não deve estar versionado.',
      });
      continue;
    }
    if (file.stats.size > policy.repository_secret_scan_max_bytes || !isTextCandidate(file.path))
      continue;
    const buffer = await readFile(file.path);
    if (isProbablyBinary(buffer)) continue;
    scannedFiles += 1;
    const text = buffer.toString('utf8');
    const lines = text.split('\n');
    const allowedLines = new Set();
    lines.forEach((line, index) => {
      if (/secret-scan:\s*allow-next-line/i.test(line)) allowedLines.add(index + 2);
      if (/secret-scan:\s*allow-line/i.test(line)) allowedLines.add(index + 1);
    });
    for (const [code, pattern] of patterns) {
      pattern.lastIndex = 0;
      for (const match of text.matchAll(pattern)) {
        const value = match[1] ?? match[0];
        if (safeMatch(value) || (name.startsWith('tests/') && /dummy|invalid|test/i.test(value)))
          continue;
        const line = text.slice(0, match.index).split('\n').length;
        if (allowedLines.has(line)) continue;
        findings.push({
          code,
          file: name,
          line,
          detail: 'Possível segredo detectado; valor omitido.',
        });
      }
    }
  }
  return { status: findings.length === 0 ? 'pass' : 'fail', scannedFiles, findings };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const report = await scanRepositorySecrets({ root: resolve(args.root ?? projectRoot) });
  if (args.report) await writeFile(resolve(args.report), `${JSON.stringify(report, null, 2)}\n`);
  if (report.findings.length) {
    console.error('SUBSOLO_SECRET_SCAN_FAILED');
    for (const finding of report.findings)
      console.error(
        `${finding.code} ${finding.file}${finding.line ? `:${finding.line}` : ''} — ${finding.detail}`,
      );
    process.exit(1);
  }
  console.log(`Varredura de segredos aprovada: ${report.scannedFiles} arquivos textuais.`);
}
