# Prompt 15 — Captação editorial com FreshRSS, Gmail e SearXNG

**Versão resultante:** `0.8.2-dev`  
**Estado:** concluído com validação contratual e fixtures

## Entregue

- domínio de captação e pauta preliminar;
- deduplicação exata e provável;
- adapters FreshRSS, Gmail e SearXNG;
- writer separado do Google Sheets;
- CLI `subsolo ingest` em dry-run e apply;
- quarentena local de metadados de anexos;
- workflows n8n 01, 02 e 10;
- templates de categorias, políticas e fixtures;
- documentação operacional, ADR e relatórios.

## Garantia editorial

Nenhum fluxo cria artigo, aprova pauta, define canal ou publica. A única transição possível é a criação de uma pauta privada em `TRIAGEM`, explicitamente não verificada e não editorial.

## Evidências

Consulte `reports/prompt-15/test-results.md`, `triage-report.md`, `triage-audit.json`, `source-matrix.md` e `manual-validation.md`.
