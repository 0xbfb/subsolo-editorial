# Prompt 19 — resultados de validação

Data: 2026-07-21  
Versão: `0.9.1-dev`

## Resultado acumulado

- Testes Node: **245 aprovados de 245**.
- Falhas, skips, cancelamentos e TODOs: **0**.
- Duração observada da suíte: **21,94 s**.
- Testes novos de hardening: **20**.
- TypeScript isolado: aprovado com `strict` e `exactOptionalPropertyTypes` usando TypeScript 5.8.3 disponível no ambiente.
- Sintaxe dos módulos `.mjs`: aprovada por `node --check`.
- JSON analisados: **218**.
- YAML analisados: **7**.

## Validadores aprovados

- contratos e conteúdo público;
- site editorial e links do preview;
- descoberta, feeds, sitemap e robots;
- mídia pública opcional e fixture com 12 derivados;
- observabilidade e infraestrutura;
- workflows GitHub;
- manifesto de fontes e fronteiras arquiteturais;
- CSP, política de referência e scripts inline;
- permissões mínimas;
- acessibilidade estática;
- orçamento de desempenho;
- modo degradado sem JavaScript;
- escala sintética com 10 mil publicações;
- varredura de segredos;
- integridade do artefato público.

## Ocorrência não bloqueadora registrada

A chamada direta a `validate-media-assets.mjs` sem argumento procurou `public/media/media.json` e retornou `ENOENT`. O portal não possui retratos aprovados, portanto esse arquivo não deve existir. O gate correto `validate-public-media-if-present.mjs` aprovou o estado de placeholders, e a fixture técnica foi validada separadamente com **12 derivados** e sem metadados privados.

## Comandos indisponíveis

`corepack pnpm --version` falhou com `EAI_AGAIN registry.npmjs.org`. Sem pnpm, lockfile e dependências instaladas, não foi possível executar:

- `pnpm install`;
- `pnpm build`;
- Astro/Pagefind sobre `dist`;
- Vitest pelo toolchain do projeto;
- ESLint;
- Prettier;
- Playwright e axe em navegador real.

Nenhum desses resultados foi presumido.
