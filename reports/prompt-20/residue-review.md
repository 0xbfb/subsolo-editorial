# Revisão de resíduos, testes e código morto

## Resultado

- arquivos de teste analisados: **46**;
- testes declarados: **250**;
- arquivos de teste byte a byte duplicados: **0**;
- nomes de teste duplicados: **0**;
- decisão: todos os testes foram preservados;
- arquivos de produção comprovadamente mortos removidos: **5**;
- TODOs/FIXMEs executáveis pendentes: **0**.

## Código removido

1. `src/lib/presentation/site-view-model.ts` — não possuía consumidores e ainda exibia `0.1.0-dev`;
2. `src/lib/application/package-edition.ts` — porta de tipos duplicada por `domain/package-archive.ts` e sem referências;
3. `src/lib/domain/publication-orchestration.ts` — modelo TypeScript abandonado, substituído pela implementação MJS efetivamente usada;
4. `src/lib/infrastructure/exporter/fixture-providers.ts` — adapter sem consumidor; a CLI usa o provider fixture real;
5. `src/lib/infrastructure/google/google-providers.ts` — wrapper sem consumidor sobre `google-workspace.mjs`.

A remoção foi seguida pela suíte completa, compilação TypeScript offline e verificação de fronteiras.

## Candidatos mantidos

O relatório `dead-code-heuristic.json` lista arquivos não alcançados pelo grafo estático simplificado. Eles foram mantidos quando pertenciam a uma destas categorias:

- declarações `.d.mts` para módulos MJS;
- fontes TypeScript exercitadas pelo conjunto Vitest bloqueado nesta máquina;
- contratos utilizados por scripts via aliases ou convenções do Astro;
- implementações testadas diretamente;
- componentes de infraestrutura mantidos como fronteira tipada.

O heurístico não foi usado para apagar arquivos quando imports dinâmicos ou convenções de framework poderiam produzir falso positivo.

## Marcadores de desenvolvimento

O único literal `TODO` continua dentro da expressão que **bloqueia** marcadores editoriais internos durante a exportação. Ele não representa tarefa pendente. Logs históricos em `reports/prompt-*` foram preservados como evidência deliberada, não como artefatos de runtime.
