import {
  parseStrictFrontMatter,
  validateMarkdownBody,
  type ParsedPublicationDocument,
} from '../domain/markdown-contract.js';
import { validatePublicPublication } from '../domain/public-validation.js';
import type {
  ContractIssue,
  ContractResult,
  PublicPublication,
} from '../domain/public-contract.js';

export type ValidatedPublicationDocument = Readonly<
  ParsedPublicationDocument & { publication: PublicPublication }
>;

const parserIssue = (error: unknown): ContractIssue => ({
  code: 'SUBSOLO_PUBLICATION_PARSE_FAILED',
  path: '$',
  message: error instanceof Error ? error.message : String(error),
  action: 'Corrija o front matter estrito e execute a validação novamente.',
});

export const parsePublicationDocument = (
  source: string,
): ContractResult<ValidatedPublicationDocument> => {
  let parsed: ParsedPublicationDocument;
  try {
    parsed = parseStrictFrontMatter(source);
  } catch (error) {
    return { ok: false, issues: [parserIssue(error)] };
  }
  const metadata = validatePublicPublication(parsed.frontMatter);
  const body = validateMarkdownBody(parsed.body);
  const issues = [...(metadata.ok ? [] : metadata.issues), ...(body.ok ? [] : body.issues)];
  if (issues.length > 0 || !metadata.ok || !body.ok) return { ok: false, issues };
  return {
    ok: true,
    value: Object.freeze({ ...parsed, body: body.value, publication: metadata.value }),
  };
};
