# Arquivos alterados — Prompt 15

- adicionados: 25
- modificados: 14
- removidos: 0

## Adicionados

- `docs/adr/0017-editorial-ingestion-triage-only.md`
- `docs/development/prompt-15.md`
- `docs/operations/editorial-sources.md`
- `docs/operations/editorial-triage-policy.md`
- `fixtures/ingestion/empty-state.json`
- `fixtures/ingestion/freshrss-release-repeat.json`
- `fixtures/ingestion/freshrss.json`
- `fixtures/ingestion/gmail-suspicious.json`
- `fixtures/ingestion/gmail-trusted.json`
- `fixtures/ingestion/gmail-untrusted.json`
- `fixtures/ingestion/policy.json`
- `fixtures/ingestion/searxng.json`
- `n8n/workflows/01_ingestao_freshrss.json`
- `n8n/workflows/02_triagem_gmail.json`
- `n8n/workflows/10_pesquisa_searxng.json`
- `src/lib/application/editorial-ingestion.mjs`
- `src/lib/domain/editorial-ingestion.mjs`
- `src/lib/domain/editorial-ingestion.ts`
- `src/lib/infrastructure/ingestion/file-ingestion-store.mjs`
- `src/lib/infrastructure/ingestion/google-sheets-pitch-writer.mjs`
- `src/lib/infrastructure/ingestion/source-clients.mjs`
- `templates/freshrss/categories.json`
- `tests/ingestion/cli.test.mjs`
- `tests/ingestion/domain.test.mjs`
- `tests/ingestion/source-clients.test.mjs`

## Modificados

- `.env.example`
- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `cli/subsolo.mjs`
- `infra/compose.yml`
- `infra/env/.env.example`
- `n8n/workflows/04_exportacao_google_docs.json`
- `n8n/workflows/05_empacotamento_drive.json`
- `package.json`
- `src/data/editorial/catalogs/controlled-values.json`
- `templates/google/sheets/bootstrap/PAUTAS.csv`
- `templates/google/sheets/workbook.schema.json`
- `tests/n8n/workflows-static.test.mjs`

## Removidos
