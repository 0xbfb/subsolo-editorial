# SUBSOLO

> O ruído passa. O que importa fica.

Portal editorial estático do Subsolo.

## Estado

- versão: `1.0.0-pre`;
- etapa: pré-release para homologação real;
- decisão atual: **NO-GO para RC1** enquanto os bloqueadores externos documentados permanecerem abertos;
- conteúdo: 25 registros públicos em oito dias, quatro publicações completas, três histórias, correção factual, redirect permanente e retirada por tombstone;
- visual: Jornal Concreto aplicado às páginas públicas;
- referência HTML: preservada em `references/jornal-concreto-html`.

## Requisitos

- Node.js `>=22.12.0 <23`;
- pnpm `>=11.15.0 <12`.

## Instalação

```bash
pnpm install --frozen-lockfile
```

A instalação congelada continua bloqueada enquanto `pnpm-lock.yaml` não existir. A pré-release inclui verificadores offline, mas isso não substitui instalação limpa, auditoria transitiva, build real e E2E.

## Desenvolvimento

```bash
pnpm dev
```

Rotas principais desta etapa:

- `/`: home;
- `/agora/`: prioridades atuais;
- `/edicoes/2026/07/20/`: edição diária;
- `/[ano]/[mês]/[dia]/[slug]/`: publicação;
- `/canais/` e `/canais/[slug]/`;
- `/temas/[slug]/`;
- `/redacao/` e `/redacao/[slug]/`;
- `/historias/[slug]/`;
- `/documentos/[slug]/`;
- `/arquivo/`, `/arquivo/pagina/[n]/` e arquivo por ano/mês/dia;
- `/arquivo/registros/[slug]/`;
- `/busca/` com Pagefind e fallback pelo índice compacto;
- `/a-redacao/`;
- `/privacidade/`;
- `/__design/jornal-concreto/`: inventário visual interno.

A busca usa Pagefind após o build estático e mantém fallback no navegador por `archive-index.json` quando o bundle ainda não estiver disponível. Filtros públicos: canal, tema, autor, natureza e estado.

## Verificação

```bash
pnpm validate:editorial-site
pnpm generate:discovery
pnpm validate:feeds
pnpm test:discovery
pnpm test:routes:static
pnpm render:editorial-preview
pnpm validate:preview-links
pnpm audit:security
pnpm check:headers
pnpm check:permissions
pnpm check:a11y
pnpm check:performance
pnpm test:degraded
pnpm test:scale
pnpm test:e2e
pnpm check
```

## Arquitetura

```text
src/lib/domain
src/lib/application
src/lib/infrastructure
src/lib/presentation
```

## Sistema visual

- `src/styles/tokens.css`;
- `src/styles/jornal-concreto.css`;
- `src/layouts/JornalConcretoLayout.astro`;
- `src/components/`;
- `docs/design/jornal-concreto-component-map.md`.

A manchete principal não recebe sublinhado. Chamadas secundárias e títulos de canais preservam o sublinhado editorial aprovado.

## Ambiente editorial

- `templates/google/sheets`: workbook e bootstraps CSV/JSON;
- `templates/google/docs`: modelos de produção e revisão;
- `templates/google/drive`: estrutura declarativa;
- `templates/google/calendar`: calendários e eventos;
- `templates/google/gmail`: marcadores e regras;
- `src/data/editorial/catalogs`: autores, canais, quadros, temas e valores controlados;
- `fixtures/editorial`: edição completa de teste.

## Contrato público

A especificação executável está em `schemas/1.0.0/`; exemplos válidos e ataques de regressão estão em `fixtures/public/`.

## Infraestrutura local

Consulte `infra/README.md`. A stack é opcional para o build do portal e não hospeda o site público.

## Publicação manual

```bash
pnpm ci:local
pnpm verify:workflows
pnpm verify:dist
pnpm scan:public-artifact
```

Workflows:

- `.github/workflows/ci.yml`;
- `.github/workflows/preview.yml`;
- `.github/workflows/deploy-pages.yml`;
- `.github/workflows/scheduled-checks.yml`.

O preview de pull request é entregue como artefato de workflow. O deploy público ocorre somente depois do merge em `main`.

A configuração completa está em:

- `docs/operations/github-pages-publication.md`;
- `docs/operations/branch-protection.md`;
- `docs/operations/rollback.md`.

O projeto suporta GitHub Pages em subdiretório por `SUBSOLO_BASE_PATH` e domínio raiz por `/`.

## Pré-release 1.0.0-pre

Comandos de auditoria:

```bash
pnpm ci:local
pnpm test:all
pnpm release:verify
```

Sem dependências instaladas, a cobertura offline pode ser executada com:

```bash
npm run test:all
npm run release:verify:offline
```

`release:verify` falha corretamente enquanto qualquer evidência obrigatória estiver ausente. Consulte `reports/prompt-20/go-no-go.md`, `reports/prompt-20/traceability-matrix.md` e `docs/testing/user-acceptance-checklist.md`.

## Hardening 0.9.1-dev

- CSP self-only sem `unsafe-inline`;
- scripts públicos externos e busca sem sinks de HTML;
- varredura local de segredos;
- permissões mínimas em Actions e serviços locais;
- alvo WCAG 2.2 AA com checks estáticos e gate manual;
- budgets de HTML, CSS, JS, imagens, índice e artefato;
- teste determinístico com 10.000 publicações;
- política pública em `/privacidade/`;
- threat model e gates de segurança em `docs/security/threat-model.md`.

## Bloqueadores da pré-release

`pnpm-lock.yaml` ainda não pôde ser gerado porque o registry npm está inacessível neste ambiente. Isso agora é um **bloqueador explícito para 1.0.0**: a árvore transitiva, advisories e licenças precisam de auditoria online arquivada. A revisão manual com leitor de tela e o build Astro/Pagefind real também permanecem gates de release.

## Exportação editorial mockada

A versão `0.5.0-dev` inclui `node cli/subsolo.mjs export-doc`. Consulte `docs/operations/exporter.md` para dry-run, apply atômico, formato de entrada, arquivos públicos e bloqueios de segurança.

## Google Workspace somente leitura

A versão `0.5.1-dev` aceita `--provider google` e mantém `--provider fixture` para operação offline. A configuração, scopes, conta de serviço, paginação, retries e limitações estão em:

- `docs/operations/google-workspace-readonly.md`;
- `docs/operations/google-workspace-troubleshooting.md`;
- `docs/adr/0011-google-workspace-readonly-rest.md`.

Exemplo sem efeitos:

```bash
node cli/subsolo.mjs export-doc \
  --provider google \
  --article-id artigo-2026-07-20-transporte \
  --spreadsheet-id "$SUBSOLO_GOOGLE_SPREADSHEET_ID" \
  --destination .tmp/google-export \
  --dry-run
```

## Pacotes de edição

A versão `0.6.0-dev` adiciona empacotamento e restauração determinísticos:

```bash
node cli/subsolo.mjs package --workspace fixtures/packager/edition-r1 --destination .tmp/packages --dry-run
node cli/subsolo.mjs package --workspace fixtures/packager/edition-r1 --destination .tmp/packages --apply
node cli/subsolo.mjs validate-package --package .tmp/packages/subsolo-edicao-20260720T150000-0300-r1.zip
node cli/subsolo.mjs restore --package .tmp/packages/subsolo-edicao-20260720T150000-0300-r1.zip --destination .tmp/restored --dry-run
```

Consulte `docs/operations/edition-packages.md`.

## Arquivo técnico no Google Drive

A versão `0.6.1-dev` preserva o ZIP imutável em:

```text
SUBSOLO/90_ARQUIVO_TECNICO/edicoes/YYYY/MM
```

Dry-run:

```bash
node cli/subsolo.mjs publish \
  --package fixtures/packager/golden/r1.zip \
  --drive-root-id "$SUBSOLO_DRIVE_ROOT_FOLDER_ID" \
  --skip-git \
  --dry-run
```

Apply:

```bash
node cli/subsolo.mjs publish \
  --package .tmp/packages/subsolo-edicao-20260720T150000-0300-r1.zip \
  --drive-root-id "$SUBSOLO_DRIVE_ROOT_FOLDER_ID" \
  --receipt .tmp/archive-receipt.json \
  --skip-git \
  --apply
```

O `file_id` só é persistido depois da confirmação de nome, tamanho, pasta, metadados, MD5 remoto, download, SHA-256 e restauração do pacote. Consulte `docs/operations/google-drive-technical-archive.md`.

## Pós-publicação

A versão `0.8.3-dev` registra correções, esclarecimentos, atualizações materiais, mudanças de slug e retiradas como novas revisões. O fluxo preserva o pacote anterior, arquiva o novo ZIP antes do Git e mantém o pull request como fronteira humana.

Dry-run de correção:

```bash
node cli/subsolo.mjs post-publication \
  --state fixtures/post-publication/state.json \
  --payload fixtures/post-publication/correction.json \
  --output .tmp/post-publication-state.json \
  --dry-run
```

Validação dos pacotes de regressão:

```bash
node cli/subsolo.mjs validate-package --package fixtures/post-publication/golden/r2-correction.zip
node cli/subsolo.mjs validate-package --package fixtures/post-publication/golden/r3-withdrawal.zip
```

Consulte:

- `docs/operations/public-corrections-policy.md`;
- `docs/operations/withdrawal-runbook.md`;
- `docs/adr/0018-post-publication-revisions.md`.

## Arquivo vivo, busca e feeds

A versão `0.8.1-dev` gera, antes do build:

- arquivo anual, mensal e diário;
- paginação determinística de oito itens;
- `public/archive-index.json` sem corpo integral;
- índice Pagefind em `dist/pagefind`;
- RSS geral, nove feeds de canal e feed de correções;
- sitemap e `robots.txt`.

Comandos:

```bash
pnpm generate:discovery
pnpm validate:feeds
pnpm test:discovery
pnpm build
```

Consulte `docs/operations/archive-search-feeds.md`.

## Captação editorial

A versão `0.8.2-dev` integra FreshRSS, Gmail e SearXNG exclusivamente à fila privada de triagem. Toda entrada aceita recebe status `TRIAGEM`, nível de cobertura `0`, classificação `PRELIMINAR_NAO_EDITORIAL` e verificação `NAO_VERIFICADO`.

```bash
node cli/subsolo.mjs ingest --source freshrss --provider fixture --input fixtures/ingestion/freshrss.json --state .runtime/editorial/pitches.json --output .runtime/reports/freshrss --dry-run
```

Consulte `docs/operations/editorial-sources.md` e `docs/operations/editorial-triage-policy.md`.


## Orquestração local

Os workflows em `n8n/workflows` coordenam a CLI sem duplicar regras de domínio. Execute `node cli/subsolo.mjs orchestrate --input fixtures/n8n/publication-candidate.json --dry-run` para inspecionar a cadeia sem efeitos.

## Edição diária

O ciclo operacional é executado por `subsolo edition`. A primeira publicação cria r1; cada revisão e o selo final geram um novo pacote imutável. Dados do Mapa do Dia nunca entram no manifesto público.


## Mídia

O pipeline local publica apenas derivados AVIF/WebP/JPEG. Veja `docs/operations/media-pipeline.md` e execute `pnpm process:media:dry-run`. Originais permanecem fora do Git.


## Operação, observabilidade e recuperação

A versão `0.9.0-dev` adiciona logs estruturados, monitores declarativos, alertas ntfy, backup criptografado e reconciliação entre sistemas.

```bash
pnpm validate:observability
pnpm test:observability
pnpm reconcile:operations:dry-run
pnpm infra:backup:dry-run
```

O backup portátil nunca inclui `.env` em texto claro e exige uma passphrase externa. O restore de teste valida descriptografia, checksums, dump PostgreSQL e extração dos volumes antes de permitir qualquer operação destrutiva.

Documentação:

- `docs/operations/observability.md`;
- `docs/operations/backup-recovery.md`;
- `docs/operations/reconciliation.md`;
- `docs/operations/incident-runbook.md`.

## Hardening pré-release

A versão `0.9.1-dev` adiciona políticas verificáveis de segurança, privacidade, acessibilidade e desempenho. A auditoria de dependências permanece **condicional** enquanto o lockfile e a instalação limpa não puderem ser produzidos.

```bash
pnpm audit:security
pnpm check:headers
pnpm check:permissions
pnpm check:a11y
pnpm check:performance
pnpm test:scale
```

Consulte `docs/security/threat-model.md`, `docs/policies/privacy.md`, `docs/operations/accessibility-review.md` e `docs/operations/capacity-growth.md`.

## Próxima etapa

Prompt 20: revisão completa pré-release, sem adição de escopo.
