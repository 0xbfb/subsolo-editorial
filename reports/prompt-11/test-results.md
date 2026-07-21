# Prompt 11 — Resultados de validação

**Versão:** `0.6.1-dev`  
**Data de execução:** 20 de julho de 2026  
**Resultado geral:** implementação aprovada em testes locais e contratuais; homologação com Google Drive real pendente.

## Testes automatizados

| Verificação                        |                            Resultado |
| ---------------------------------- | -----------------------------------: |
| Suite Node acumulada               | 108 aprovados, 0 falhas, 0 ignorados |
| Testes específicos do Google Drive |               18 aprovados, 0 falhas |
| Compilação TypeScript isolada      |                             aprovada |
| Arquivos JSON analisados           |                          115 válidos |

Os testes específicos cobrem:

- planejamento em dry-run sem recibo;
- persistência do recibo somente após confirmação completa;
- idempotência sem novo envio;
- metadata divergente;
- download corrompido;
- exigência de `--skip-git`;
- ausência de credencial com falha fechada;
- criação restrita à hierarquia técnica;
- busca por pasta, MIME e `appProperties`;
- upload resumível em chunks;
- retomada após interrupção;
- acesso negado;
- scope `drive.file` por padrão;
- retry para quota 429;
- timeout;
- upload parcial;
- ciclo integrado simulado de criação, upload, confirmação, download e recibo.

## Regressão e contratos

- fronteiras arquiteturais: aprovadas;
- manifesto das fontes: 12 fontes verificadas por SHA-256;
- infraestrutura estática: 6 serviços, 6 healthchecks e 5 portas locais;
- fixtures editoriais: 12 abas, 44 autores, 9 canais e 74 quadros;
- contratos públicos: 11 JSON Schemas no draft 2020-12;
- fixture do portal: 4 publicações, 9 canais, 44 autores, 1 história e 1 documento;
- conteúdo público: aprovado;
- workflows: 4 arquivos com permissões mínimas e versões explícitas.

## Segurança e empacotamento

- nenhuma pasta `.git`, `node_modules`, cache ou arquivo `.env` real encontrado;
- nenhum token, chave privada ou credencial inesperada encontrado;
- o único marcador de chave privada é um literal deliberado em teste de regressão do scanner;
- recibos e relatórios não contêm URL privada, URI da sessão resumível ou credencial.

## Comandos executados

```bash
node --test $(find tests -name '*.test.mjs' | sort)
node --test $(find tests/drive -name '*.test.mjs' | sort)
node scripts/check-boundaries.mjs
node scripts/verify-source-manifest.mjs
node scripts/validate-infra.mjs
node scripts/validate-editorial-fixtures.mjs
node scripts/validate-public-contracts.mjs
node scripts/validate-editorial-site.mjs
node scripts/validate-public-content.mjs
node scripts/verify-workflows.mjs
tsc --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --noEmit \
  src/lib/domain/package-archive.ts \
  src/lib/application/archive-edition-package.d.mts \
  src/lib/infrastructure/google/google-drive.d.mts
```

## Validações externas não executadas

Não foram fornecidos:

- credencial Google válida;
- ID de uma pasta de teste autorizada no Drive;
- ambiente Google Workspace de homologação.

Consequentemente, não houve upload real, download real ou inspeção manual da hierarquia do Drive. O relatório de preservação deriva de testes contratuais com respostas REST simuladas.

## Dependências indisponíveis

O Corepack não conseguiu baixar `pnpm@11.15.1` porque `registry.npmjs.org` retornou `EAI_AGAIN`. Permanecem sem execução:

- `pnpm install`;
- lockfile;
- Astro build oficial;
- Vitest;
- ESLint;
- Prettier;
- Playwright pelo projeto.

Nenhum resultado dessas ferramentas foi presumido.
