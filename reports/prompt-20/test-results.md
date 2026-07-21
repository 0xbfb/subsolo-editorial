# Prompt 20 — resultados da revisão pré-release

Data: 21 de julho de 2026  
Versão: `1.0.0-pre`

## Executado com sucesso

- testes Node: **250/250** em **46 arquivos**;
- falhas, skips, cancelamentos e TODOs: **0**;
- release verifier offline: **28 comandos**, estado `no-go` apenas por evidências externas;
- fluxo fixture: **28 etapas**;
- browser acceptance: **10 execuções**, zero problemas;
- TypeScript offline com `strict` e `exactOptionalPropertyTypes`;
- compilação Python do processador de mídia, runner Chromium e empacotador da pré-release;
- contratos públicos: 13 schemas;
- preview determinístico: 114 rotas e 119 arquivos;
- descoberta: 25 registros e 11 feeds;
- escala: 10.000 publicações sintéticas;
- restore de pacote e backup criptografado em diretório limpo;
- scanner de segredos, CSP, permissões, fronteiras e infraestrutura.

## Comandos mínimos solicitados

As três chamadas via pnpm foram tentadas e falharam antes de executar scripts, com `EAI_AGAIN registry.npmjs.org`:

- `pnpm ci:local`;
- `pnpm test:all`;
- `pnpm release:verify`.

Status registrados: `1 ci:local; 1 test:all; 1 release:verify`.

Equivalentes offline executados:

```bash
npm run test:all
python3 scripts/browser-acceptance.py reports/prompt-20/browser-acceptance.json
npm run release:verify:offline
```

O gate padrão também foi executado diretamente e encerrou com código **1**, como esperado para uma decisão NO-GO.

## Não executado

- instalação limpa;
- auditoria transitiva;
- Astro/Pagefind reais;
- Vitest, ESLint, Prettier, Playwright e axe pelo toolchain do projeto;
- Docker e serviços locais reais;
- Google Workspace/Drive reais;
- GitHub PR, Actions, Pages e smoke públicos reais;
- aceite manual.

## Repetição em extração limpa

O primeiro disparo paralelo da suíte na cópia recém-extraída registrou um `SIGSEGV` isolado no processo filho de `tests/drive/integration.test.mjs`. O arquivo passou imediatamente quando executado isoladamente, indicando instabilidade do runner concorrente, não falha funcional do teste.

Para tornar o gate reproduzível em ambientes com recursos limitados, `scripts/test-all.mjs` foi endurecido com `--test-concurrency=1`. Após a alteração:

- a suíte completa passou com **250/250** testes na árvore de trabalho;
- TypeScript estrito e validadores centrais passaram novamente;
- o pacote final será novamente extraído e testado antes da entrega.

O incidente não foi ocultado e não altera o estado **NO-GO**, determinado pelos bloqueadores externos já registrados.
