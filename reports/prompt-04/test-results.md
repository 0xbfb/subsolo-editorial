# Resultados de testes — Prompt 04

**Versão:** `0.2.1-dev`

## Executados e aprovados

- 5 testes estáticos `node:test` do contrato;
- 9 JSON Schemas carregados e validados contra fixtures;
- compilação isolada dos 7 módulos TypeScript novos com `tsc 5.8.3`;
- execução dos módulos compilados sobre 11 entidades;
- 128 IDs gerados e revalidados;
- HTML perigoso rejeitado;
- URL perigosa rejeitada;
- campo privado desconhecido rejeitado;
- major version desconhecida rejeitada;
- referência quebrada rejeitada;
- 11 enums JSON Schema/Zod comparados;
- 11 testes anteriores de ambiente editorial e infraestrutura, totalizando 16 testes `node:test`;
- 62 arquivos JSON analisados;
- fronteiras arquiteturais verificadas;
- 12 fontes preservadas por SHA-256;
- infraestrutura estática anterior sem regressão;
- sintaxe de todos os arquivos `.mjs` verificada.

O log bruto está em `raw-validation.log`.

## Não executados

- `pnpm test:contract`;
- suíte Vitest completa;
- `astro sync`;
- typecheck integrado ao Astro;
- Astro build;
- ESLint e Prettier.

## Motivo

O registry npm permaneceu inacessível por `EAI_AGAIN`. A tentativa online expirou durante os retries; a instalação offline falhou porque os metadados das dependências não estavam no cache. Nenhum resultado dependente dessas ferramentas foi presumido.

## Docker

Os testes runtime do Prompt 02 continuam pendentes porque Docker não está disponível no ambiente de geração.
