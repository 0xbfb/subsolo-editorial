# Matriz de rastreabilidade — 1.0.0-pre

Fonte de verdade: `references/source-materials/subsolo_plano_tecnico_desenvolvimento_v2.0.md`.

## Resultado executivo

- Critérios do projeto: **22** — 10 aprovados, 10 parciais, 2 bloqueados.
- Fases: **16** — 4 aprovadas, 10 parciais, 2 bloqueadas.
- Relatórios anteriores: **19 de 19 diretórios disponíveis**.

`partial` significa que a implementação e a evidência offline existem, mas falta homologação em serviço real. `blocked` impede RC1.

## Critérios de aceite do projeto

| # | Critério | Estado | Evidência principal | Avaliação |
|---:|---|---|---|---|
| 1 | Ambiente Docker reproduzível | **PARTIAL** | `reports/prompt-20/logs/validate-infra.log` | Configuração estática aprovada; Docker não está instalado e a stack real não foi iniciada. |
| 2 | Planilha editorial funcional | **PARTIAL** | `reports/prompt-20/logs/validate-editorial-fixtures.log` | Workbook e adapters validados por fixtures; nenhuma planilha real de homologação foi usada. |
| 3 | Modelo Google Docs funcional | **PARTIAL** | `reports/prompt-20/fixture-flow.json` | Modelo e conversão validados por fixture; nenhum documento Google real foi lido. |
| 4 | Artigo exportável | **PASS** | `reports/prompt-20/fixture-flow.json` | Exportação completa, golden e determinismo aprovados offline. |
| 5 | Conteúdo sanitizado | **PASS** | `reports/prompt-20/logs/scan-public-artifact-preview.log`<br>`reports/prompt-20/fixture-flow.json` | Allowlist, bloqueios privados e varredura do artefato aprovados. |
| 6 | Pacote validado | **PASS** | `reports/prompt-20/fixture-flow.json` | ZIP determinístico, checksums, validação e restore aprovados. |
| 7 | ZIP preservado no Google Drive | **PARTIAL** | `reports/prompt-11/upload-report.md` | Contrato, retomada e idempotência simulados; upload real não executado. |
| 8 | Branch e pull request automáticos | **PARTIAL** | `reports/prompt-20/fixture-flow.json` | Orquestração por portas fixture aprovada; branch e PR reais não criados. |
| 9 | Revisão humana obrigatória | **PARTIAL** | `reports/prompt-12/test-results.md` | Fronteira humana está implementada e merge automático é proibido; nenhum PR real foi homologado. |
| 10 | Build Astro | **BLOCKED** | `reports/prompt-20/release-verification.json` | Bloqueado sem instalação, lockfile e dependências. |
| 11 | Busca Pagefind | **PARTIAL** | `reports/prompt-20/logs/validate-discovery.log` | Fallback e contrato passam; índice Pagefind real em dist não foi produzido. |
| 12 | Arquivo por data e canal | **PASS** | `reports/prompt-20/logs/validate-discovery.log` | Arquivo, facetas, feeds e sitemap aprovados offline. |
| 13 | Deploy no GitHub Pages | **BLOCKED** | `reports/prompt-20/release-verification.json` | Workflow validado estaticamente; deploy e URL reais não existem neste ambiente. |
| 14 | URL sincronizada no Sheets | **PARTIAL** | `reports/prompt-12/test-results.md` | Handoff e atualização simulados; Sheets real não foi alterado. |
| 15 | Correção versionada | **PASS** | `reports/prompt-16/revision-chain.md` | Correção, redirect, tombstone e pacotes r2/r3 aprovados. |
| 16 | Edição diária revisável e selável | **PASS** | `reports/prompt-13/lifecycle-validation.md` | Cadeia r1/r2/r3 e selo aprovados, sem vazamento de slots privados. |
| 17 | Backup local | **PASS** | `reports/prompt-20/fixture-flow.json` | Bundle criptografado sintético criado e validado; backup de containers reais não executado. |
| 18 | Restore testado | **PASS** | `reports/prompt-20/fixture-flow.json` | Descriptografia, checksums, dump e quatro volumes restaurados em diretório limpo. |
| 19 | Nenhuma credencial versionada | **PASS** | `reports/prompt-20/logs/scan-secrets.log` | Varredura integral aprovada; nenhuma credencial real detectada. |
| 20 | Nenhum serviço administrativo público | **PARTIAL** | `reports/prompt-20/logs/check-permissions.log` | Bindings e rede aprovados estaticamente; portas reais não foram inspecionadas. |
| 21 | Leitura básica sem JavaScript | **PASS** | `reports/prompt-20/browser-acceptance.json`<br>`reports/prompt-20/logs/test-degraded.log` | Preview verificado em Chromium desktop/mobile e em modo degradado. |
| 22 | Site público independente da máquina local | **PARTIAL** | `reports/prompt-18/operational-baseline.json` | Arquitetura não depende da stack local; independência em produção aguarda deploy real. |

## Aceite por fase

| Fase | Nome | Estado | Evidência principal | Avaliação |
|---|---|---|---|---|
| F0 | Consolidação e contratos | **PASS** | `docs/adr`<br>`schemas` | Contradições removidas; fonte de verdade, exemplos, schemas e CI estático disponíveis. |
| F1 | Infraestrutura local básica | **PARTIAL** | `infra`<br>`reports/prompt-20/logs/validate-infra.log` | Compose, versões, healthchecks e restore fixture aprovados; stack Docker real não iniciada. |
| F2 | Ambiente editorial Google | **PARTIAL** | `templates/google`<br>`fixtures/editorial` | Modelos e validações aprovados por fixture; fluxo manual real no Google não homologado. |
| F3 | Domínio e schemas | **PASS** | `src/lib/domain`<br>`schemas/1.0.0` | Tipos, schemas, IDs, estados, sanitização e fixtures aprovados. |
| F4 | Portal Astro base | **PARTIAL** | `src/pages`<br>`src/components` | Rotas e apresentação aprovadas por preview determinístico e Chromium; build Astro real e aceite manual pendentes. |
| F5 | Publicação manual controlada | **BLOCKED** | `.github/workflows`<br>`docs/operations/github-pages-publication.md` | Workflows e rollback estão definidos; PR, build, deploy e URL final reais não foram executados. |
| F6 | Exportador Docs/Sheets | **PARTIAL** | `cli/exporter-core.mjs`<br>`src/lib/infrastructure/google` | Exportação determinística e sanitização passam; adapters Google reais não foram chamados. |
| F7 | Pacote de edição e Drive | **PARTIAL** | `cli/packager-core.mjs`<br>`src/lib/infrastructure/google/google-drive.mjs` | Pacote, cadeia e recuperação passam; Drive real não foi usado. |
| F8 | n8n de publicação | **PARTIAL** | `n8n/workflows`<br>`src/lib/application/publication-orchestrator.mjs` | Idempotência, lock e ordem de efeitos passam em fixture; n8n, GitHub e Sheets reais pendentes. |
| F9 | Edição diária incremental | **PASS** | `src/lib/domain/edition-lifecycle.ts`<br>`reports/prompt-13/lifecycle-validation.md` | Revisões, selo, URLs estáveis e fronteira público/privado comprovados. |
| F10 | Arquivo e busca | **PARTIAL** | `src/lib/domain/discovery.mjs`<br>`public/archive-index.json` | Arquivo, filtros e feeds passam; Pagefind real em dist está bloqueado. |
| F11 | Captação editorial | **PARTIAL** | `src/lib/domain/editorial-ingestion.mjs`<br>`src/lib/infrastructure/ingestion` | Entradas viram apenas TRIAGEM e deduplicação passa; serviços reais não foram chamados. |
| F12 | Correções e retiradas | **PASS** | `src/lib/domain/post-publication.mjs`<br>`reports/prompt-16/redirect-tombstone-validation.md` | Histórico, revisão, redirects e tombstones aprovados. |
| F13 | Mídia | **PARTIAL** | `scripts/process-media.py`<br>`src/lib/domain/media-pipeline.mjs` | Pipeline real com Pillow e derivados passa; retratos editoriais reais permanecem pending. |
| F14 | Observabilidade e backup | **PARTIAL** | `infra/scripts`<br>`src/lib/application/operational-observability.mjs` | Backup/restore, reconciliação e alertas passam em fixtures; serviços locais reais não foram iniciados. |
| F15 | Hardening e release 1.0 | **BLOCKED** | `reports/prompt-20/release-verification.json`<br>`reports/prompt-20/go-no-go.md` | Controles offline passam; lockfile, auditoria transitiva, build, E2E real e aceite manual bloqueiam o release. |

## Cobertura dos prompts 1–19

| Prompt | Diretório | Arquivos | Disponível |
|---:|---|---:|---|
| 1 | `reports/prompt-01` | 2 | sim |
| 2 | `reports/prompt-02` | 3 | sim |
| 3 | `reports/prompt-03` | 5 | sim |
| 4 | `reports/prompt-04` | 7 | sim |
| 5 | `reports/prompt-05` | 21 | sim |
| 6 | `reports/prompt-06` | 256 | sim |
| 7 | `reports/prompt-07` | 4 | sim |
| 8 | `reports/prompt-08` | 28 | sim |
| 9 | `reports/prompt-09` | 29 | sim |
| 10 | `reports/prompt-10` | 4 | sim |
| 11 | `reports/prompt-11` | 3 | sim |
| 12 | `reports/prompt-12` | 3 | sim |
| 13 | `reports/prompt-13` | 4 | sim |
| 14 | `reports/prompt-14` | 20 | sim |
| 15 | `reports/prompt-15` | 26 | sim |
| 16 | `reports/prompt-16` | 12 | sim |
| 17 | `reports/prompt-17` | 5 | sim |
| 18 | `reports/prompt-18` | 33 | sim |
| 19 | `reports/prompt-19` | 57 | sim |

## Decisão

A matriz não autoriza o RC1. Os critérios bloqueados dependem de instalação limpa, serviços externos reais e aceite manual. A pré-release é utilizável para homologação, não para declarar estabilidade operacional.
