# Prompt 08 — Mapa de transformação

| Entrada privada | Transformação | Saída pública |
|---|---|---|
| linha Sheets | seleção e normalização por allowlist | front matter de `publication.md` |
| árvore Docs | AST editorial intermediária | corpo Markdown |
| heading 2–4 | validação de nível | `##` a `####` |
| paragraph | sanitização de texto e links | parágrafo Markdown |
| quote | sanitização linha a linha | blockquote |
| list | validação de itens | lista ordenada ou não ordenada |
| table | validação de largura e escape de `|` | tabela Markdown |
| editorial-block | validação contra allowlist | `:::tipo ... :::` |
| fontes estruturadas | seleção de campos e IDs determinísticos | `sources.json` |
| correções | seleção de campos e IDs determinísticos | `corrections.json` |
| mídia | seleção de campos e IDs determinísticos | `media.json` |
| snapshots normalizados | SHA-256, contagens e resultado de sanitização | `provenance.public.json` |

## Campos deliberadamente excluídos

- IDs e revisões do Google Docs;
- URLs de Docs, Sheets e Drive;
- comentários e sugestões;
- notas privadas;
- pendências;
- campos desconhecidos;
- tokens, assinaturas e parâmetros de autenticação;
- corpo original privado.
