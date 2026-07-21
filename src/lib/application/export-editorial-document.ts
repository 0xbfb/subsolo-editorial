import type { EditorialDocument } from '../domain/editorial-document.js';

export type EditorialSheetRow = Readonly<Record<string, unknown>>;
export type ExportPlan = Readonly<{ publicationMarkdown: string; sourcesJson: string; correctionsJson: string; mediaJson: string; provenanceJson: string }>;

export interface EditorialDocumentProvider { read(documentId: string): Promise<EditorialDocument>; }
export interface EditorialSheetProvider { read(articleId: string): Promise<EditorialSheetRow>; }

export interface EditorialExporter {
  plan(articleId: string): Promise<ExportPlan>;
  apply(articleId: string, destination: string): Promise<readonly string[]>;
}
