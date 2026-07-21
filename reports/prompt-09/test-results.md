# Prompt 09 — resultados dos testes

**Versão:** `0.5.1-dev`  
**Data:** 20 de julho de 2026

## Resumo

- testes Node executados: **74**;
- aprovados: **74**;
- falhas: **0**;
- testes ignorados: **0**;
- compilação TypeScript isolada: **aprovada** com `tsc 5.8.3`;
- fronteiras arquiteturais: **aprovadas**;
- fixtures editoriais: **aprovadas**;
- schemas públicos: **9 aprovados**;
- manifesto de fontes: **12 fontes verificadas**;
- workflows: **aprovados**;
- infraestrutura estática: **aprovada**;
- JSON do projeto: **válido**;
- determinismo apply A/B: **aprovado**;
- scanner de segredos de produção: **aprovado**.

## Cobertura específica da integração

- transformação de Google Docs;
- abas e seleção explícita;
- headings, listas, tabelas, citações, links e blocos editoriais;
- sugestões pendentes;
- gate humano de comentários;
- leitura e paginação do Sheets;
- JSON e booleanos estruturados;
- cache efêmero;
- timeout;
- retry de 429 e 5xx;
- normalização de 401, 403 e 404;
- logs redigidos;
- token efêmero;
- JWT de conta de serviço;
- scopes somente leitura;
- equivalência byte a byte entre providers Google e fixture;
- limite máximo de páginas.

## CLI

- fixture `--dry-run`: aprovada;
- fixture `--apply`: aprovada em duas execuções equivalentes;
- Google sem credencial: falha fechada esperada, código de processo `2` e erro `SUBSOLO_GOOGLE_CREDENTIAL_MISSING`;
- nenhuma chamada autenticada real foi executada.

## Limitações do ambiente

O comando `npm view astro@7.1.2 version` respondeu, mas o Corepack falhou repetidamente ao baixar `pnpm@11.15.1` por `EAI_AGAIN`. Portanto, permanecem não executados:

- `pnpm install`;
- geração de `pnpm-lock.yaml`;
- `astro sync`;
- build Astro oficial;
- Vitest;
- ESLint;
- Prettier;
- Playwright pelo projeto.

Essas limitações não foram tratadas como sucesso.

## Arquivos de evidência

- `node-tests.tap`;
- `typescript-isolated.txt`;
- `fixture-dry-run.json`;
- `apply-a.sha256`;
- `apply-b-normalized.sha256`;
- `google-no-credentials.stderr`;
- `corepack-pnpm.txt`;
- `secret-scan.txt`;
- `integration-matrix.md`.
