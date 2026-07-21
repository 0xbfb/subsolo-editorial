# Validação manual e limitações

## Executado

- inspeção das rotas Astro e imports relativos;
- inspeção da hierarquia dos componentes;
- validação do preview HTML com BeautifulSoup e lxml;
- validação de links internos de 114 páginas;
- validação da fixture e referências;
- revisão da regra de sublinhado da manchete e dos títulos secundários;
- revisão dos estados vazios para canais, temas e autores.

## Tentativas de renderização visual

A renderização por Chromium e Playwright foi tentada por HTTP local e `file://`. O ambiente bloqueou a navegação com `ERR_BLOCKED_BY_ADMINISTRATOR`; a chamada direta ao Chromium também não finalizou. Nenhuma screenshot foi declarada como validada.

## Validação futura obrigatória

Quando as dependências e o navegador estiverem disponíveis:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Revisar desktop e mobile para home, artigo, edição, canal, história, documento, arquivo e redação.
