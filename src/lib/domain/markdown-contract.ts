import type { ContractIssue, ContractResult } from './public-contract.js';

export const EDITORIAL_BLOCKS = [
  'fact',
  'declaration',
  'unknown',
  'why-it-matters',
  'next-step',
  'document',
  'action-recommended',
  'correction',
] as const;
export type EditorialBlock = (typeof EDITORIAL_BLOCKS)[number];

export type FrontMatterScalar = string | number | boolean | null;
export interface FrontMatterArray extends ReadonlyArray<FrontMatterValue> {}
export interface FrontMatterObject {
  readonly [key: string]: FrontMatterValue;
}
export type FrontMatterValue = FrontMatterScalar | FrontMatterArray | FrontMatterObject;
export type FrontMatter = FrontMatterObject;
export type ParsedPublicationDocument = Readonly<{ frontMatter: FrontMatter; body: string }>;

const scalar = (raw: string): FrontMatterValue => {
  const value = raw.trim();
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return Number(value);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    const quote = value[0];
    const content = value.slice(1, -1);
    return quote === '"' ? (JSON.parse(value) as string) : content.replace(/''/g, "'");
  }
  if (value === '') return '';
  if (/^[A-Za-z0-9_./:@+-]+$/.test(value)) return value;
  throw new Error(`SUBSOLO_FRONT_MATTER_SCALAR_UNSAFE: valor deve ser citado: ${value}`);
};

const indentation = (line: string): number => line.length - line.trimStart().length;

const parseBlock = (
  lines: readonly string[],
  start: number,
  indent: number,
): readonly [FrontMatterValue, number] => {
  const first = lines[start];
  if (first === undefined) return [{}, start];
  const isArray = first.trimStart().startsWith('- ');
  if (isArray) {
    const result: FrontMatterValue[] = [];
    let index = start;
    while (index < lines.length) {
      const line = lines[index];
      if (line === undefined || line.trim() === '') {
        index += 1;
        continue;
      }
      const currentIndent = indentation(line);
      if (currentIndent < indent) break;
      if (currentIndent !== indent || !line.trimStart().startsWith('- ')) break;
      const raw = line.trimStart().slice(2);
      if (raw.trim() === '') {
        const [nested, next] = parseBlock(lines, index + 1, indent + 2);
        result.push(nested);
        index = next;
      } else {
        result.push(scalar(raw));
        index += 1;
      }
    }
    return [Object.freeze(result), index];
  }

  const result: Record<string, FrontMatterValue> = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line === undefined || line.trim() === '') {
      index += 1;
      continue;
    }
    const currentIndent = indentation(line);
    if (currentIndent < indent) break;
    if (currentIndent !== indent || line.trimStart().startsWith('- ')) break;
    const match = /^([a-z][a-z0-9_]*):(?:\s*(.*))?$/.exec(line.trim());
    if (!match) throw new Error(`SUBSOLO_FRONT_MATTER_LINE_INVALID: ${line}`);
    const key = match[1];
    if (key === undefined) throw new Error(`SUBSOLO_FRONT_MATTER_KEY_INVALID: ${line}`);
    const raw = match[2] ?? '';
    if (Object.hasOwn(result, key)) throw new Error(`SUBSOLO_FRONT_MATTER_DUPLICATE_KEY: ${key}`);
    if (raw.trim() !== '') {
      result[key] = scalar(raw);
      index += 1;
      continue;
    }
    const nextLine = lines[index + 1];
    if (nextLine === undefined || indentation(nextLine) <= indent) {
      result[key] = null;
      index += 1;
      continue;
    }
    const [nested, next] = parseBlock(lines, index + 1, indent + 2);
    result[key] = nested;
    index = next;
  }
  return [Object.freeze(result), index];
};

export const parseStrictFrontMatter = (source: string): ParsedPublicationDocument => {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error('SUBSOLO_FRONT_MATTER_MISSING: o documento precisa começar com ---.');
  }
  const end = normalized.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('SUBSOLO_FRONT_MATTER_UNCLOSED: delimitador final ausente.');
  const header = normalized.slice(4, end);
  if (/\t/.test(header))
    throw new Error('SUBSOLO_FRONT_MATTER_TAB_INVALID: use espaços, não tabs.');
  const lines = header.split('\n');
  const [parsed, consumed] = parseBlock(lines, 0, 0);
  if (consumed < lines.length && lines.slice(consumed).some((line) => line.trim() !== '')) {
    throw new Error(
      'SUBSOLO_FRONT_MATTER_TRAILING_INVALID: conteúdo não interpretado no front matter.',
    );
  }
  if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
    throw new Error('SUBSOLO_FRONT_MATTER_ROOT_INVALID: a raiz precisa ser um objeto.');
  }
  return Object.freeze({ frontMatter: parsed as FrontMatter, body: normalized.slice(end + 5) });
};

const safeDestination = (destination: string): boolean => {
  const value = destination.trim().replace(/^<|>$/g, '');
  if (
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('#')
  )
    return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const issue = (code: string, path: string, message: string, action: string): ContractIssue => ({
  code,
  path,
  message,
  action,
});

export const validateMarkdownBody = (body: string): ContractResult<string> => {
  const issues: ContractIssue[] = [];
  const normalized = body.replace(/\r\n?/g, '\n');
  if (/<\/?(?:script|iframe|object|embed|style|link|meta)\b/i.test(normalized)) {
    issues.push(
      issue(
        'SUBSOLO_MARKDOWN_DANGEROUS_HTML',
        '$.body',
        'Elemento HTML perigoso detectado.',
        'Remova scripts, iframes, embeds e estilos.',
      ),
    );
  } else if (/<[A-Za-z!/][^>]*>/.test(normalized)) {
    issues.push(
      issue(
        'SUBSOLO_MARKDOWN_RAW_HTML',
        '$.body',
        'HTML arbitrário não é permitido.',
        'Use apenas Markdown e blocos editoriais autorizados.',
      ),
    );
  }
  if (/^#\s+/m.test(normalized)) {
    issues.push(
      issue(
        'SUBSOLO_MARKDOWN_H1_FORBIDDEN',
        '$.body',
        'O título H1 pertence ao front matter.',
        'Comece intertítulos em ##.',
      ),
    );
  }

  const stack: string[] = [];
  normalized.split('\n').forEach((line, index) => {
    const marker = /^:::(.*)$/.exec(line.trim());
    if (!marker) return;
    const name = (marker[1] ?? '').trim();
    if (name === '') {
      if (stack.length === 0)
        issues.push(
          issue(
            'SUBSOLO_MARKDOWN_BLOCK_UNEXPECTED_CLOSE',
            `$.body:${index + 1}`,
            'Fechamento de bloco sem abertura.',
            'Remova o marcador ou abra um bloco válido.',
          ),
        );
      else stack.pop();
      return;
    }
    if (!EDITORIAL_BLOCKS.some((allowed) => allowed === name)) {
      issues.push(
        issue(
          'SUBSOLO_MARKDOWN_BLOCK_UNKNOWN',
          `$.body:${index + 1}`,
          `Bloco editorial desconhecido: ${name}.`,
          `Use: ${EDITORIAL_BLOCKS.join(', ')}.`,
        ),
      );
    } else {
      stack.push(name);
    }
  });
  if (stack.length > 0)
    issues.push(
      issue(
        'SUBSOLO_MARKDOWN_BLOCK_UNCLOSED',
        '$.body',
        `Bloco não fechado: ${stack.at(-1)}.`,
        'Adicione ::: em uma linha isolada.',
      ),
    );

  const links = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of normalized.matchAll(links)) {
    const destination = match[1] ?? '';
    if (!safeDestination(destination)) {
      issues.push(
        issue(
          'SUBSOLO_MARKDOWN_URL_UNSAFE',
          '$.body',
          `Destino de link não permitido: ${destination}.`,
          'Use HTTP, HTTPS, mailto, âncora ou caminho relativo.',
        ),
      );
    }
  }
  if (/\b(?:javascript|vbscript|data|file):/i.test(normalized)) {
    issues.push(
      issue(
        'SUBSOLO_MARKDOWN_PROTOCOL_UNSAFE',
        '$.body',
        'Protocolo perigoso detectado.',
        'Remova URLs javascript:, data:, vbscript: ou file:.',
      ),
    );
  }
  return issues.length === 0 ? { ok: true, value: normalized } : { ok: false, issues };
};
