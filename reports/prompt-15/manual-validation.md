# Validação manual e limitações — Prompt 15

## Exercitado localmente

- lotes fixture de FreshRSS, Gmail e SearXNG;
- release repetido;
- remetente permitido e remetente desconhecido;
- PDF em quarentena e executável rejeitado;
- SearXNG com engine indisponível;
- dry-run sem escrita;
- apply local idempotente;
- leitura e append simulados do Google Sheets;
- respostas simuladas das APIs FreshRSS, Gmail e SearXNG.

## Não executado

- containers FreshRSS, SearXNG, PostgreSQL e n8n reais;
- leitura de uma conta Gmail real;
- append em uma planilha Google real;
- workflow n8n importado e executado pelo painel;
- instalação `pnpm`, Astro, Vitest, ESLint, Prettier e Playwright.

## Motivos

Docker não está instalado neste ambiente. O Corepack não conseguiu resolver `registry.npmjs.org` e retornou `EAI_AGAIN`. Nenhuma credencial real foi fornecida.
