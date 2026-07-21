# Prompt 16 — Correções, atualizações, redirects e tombstones

**Versão resultante:** `0.8.3-dev`  
**Data:** 20 de julho de 2026

## Resultado

A etapa implementou o ciclo pós-publicação sem apagar histórico. Correções, esclarecimentos, atualizações materiais, mudanças de slug e retiradas produzem nova revisão. A retirada preserva a URL original por tombstone; mudança de slug gera redirect permanente.

## Componentes principais

- `src/lib/domain/post-publication.mjs`;
- `src/lib/application/post-publication-orchestrator.mjs`;
- `cli/subsolo.mjs`;
- `schemas/1.0.0/redirect.schema.json`;
- `schemas/1.0.0/tombstone.schema.json`;
- `src/components/article/CorrectionNotice.astro`;
- `src/components/article/WithdrawalTombstone.astro`;
- `n8n/workflows/11_pos_publicacao.json`;
- `fixtures/post-publication/`;
- `tests/post-publication/`.

## Decisões preservadas

- cada revisão gera pacote e PR;
- Drive é confirmado antes de Git;
- merge continua humano;
- URLs e pacotes anteriores não são apagados;
- retirada não vira 404;
- o corpo retirado não entra no índice de busca.

## Validação

A suíte Node acumulada, schemas, assets de descoberta, pacotes r2/r3, TypeScript estrito, workflows, infraestrutura e fronteiras arquiteturais foram verificados. As limitações do toolchain npm e de serviços externos estão registradas em `reports/prompt-16/test-results.md`.
