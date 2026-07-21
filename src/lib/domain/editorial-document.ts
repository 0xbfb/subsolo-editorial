export type EditorialTextNode = Readonly<{ type: 'paragraph' | 'heading' | 'quote'; text: string; level?: 2 | 3 | 4 }>;
export type EditorialListNode = Readonly<{ type: 'list'; ordered: boolean; items: readonly string[] }>;
export type EditorialTableNode = Readonly<{ type: 'table'; headers: readonly string[]; rows: readonly (readonly string[])[] }>;
export type EditorialBlockNode = Readonly<{ type: 'editorial-block'; kind: 'fact' | 'declaration' | 'unknown' | 'why-it-matters' | 'next-step' | 'document' | 'action-recommended' | 'correction'; children: readonly EditorialDocumentNode[] }>;
export type EditorialDocumentNode = EditorialTextNode | EditorialListNode | EditorialTableNode | EditorialBlockNode;
export type EditorialDocument = Readonly<{ documentId: string; revisionId: string; title: string; nodes: readonly EditorialDocumentNode[]; unresolvedSuggestions: number; comments: readonly string[] }>;
