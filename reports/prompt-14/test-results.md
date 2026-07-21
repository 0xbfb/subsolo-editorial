# Resultados de testes — Prompt 14

**Versão:** `0.8.1-dev`

## Aprovado

| Verificação | Resultado |
|---|---|
| Testes Node acumulados | 142 aprovados, 0 falhas |
| Testes específicos de descoberta | 13 aprovados |
| TypeScript isolado dos módulos afetados | aprovado com `tsc 5.8.3` |
| Fronteiras arquiteturais | aprovadas |
| Manifesto das fontes | 12 fontes verificadas por SHA-256 |
| Fixture editorial | 4 publicações, 9 canais, 44 autores, 3 histórias e 1 documento |
| Contrato público | aprovado |
| Infraestrutura estática | 6 serviços, 6 healthchecks, 5 portas locais |
| Workflows | 4 arquivos com permissões mínimas |
| Assets de descoberta | 25 registros e 11 feeds |
| XML | 12 arquivos parseados sem erro |
| Sitemap | 127 URLs públicas geradas |

## Arquivos de evidência

- `node-tests.tap`;
- `tsc.log`;
- `boundaries.log`;
- `source-manifest.log`;
- `editorial-site.log`;
- `public-content.log`;
- `infra.log`;
- `workflows.log`;
- `discovery-generation.log`;
- `discovery-validation.log`.

## Não executado

O Corepack falhou com `EAI_AGAIN registry.npmjs.org`. Não foram executados:

- `pnpm install`;
- `astro sync`;
- `astro build`;
- o binário Pagefind sobre `dist`;
- Vitest;
- ESLint;
- Prettier;
- Playwright.

Nenhum desses resultados foi presumido.
