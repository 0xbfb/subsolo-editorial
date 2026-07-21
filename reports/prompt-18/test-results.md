# Resultados de testes — Prompt 18

**Versão:** `0.9.0-dev`

## Aprovado

- 225 testes Node;
- 20 testes adicionados na etapa;
- zero falhas, skips ou cancelamentos;
- TypeScript isolado com `strict` e `exactOptionalPropertyTypes`;
- 9 monitores Uptime Kuma declarados;
- 3 classes de tópicos ntfy;
- 5 workflows GitHub verificados;
- 12 workflows n8n sanitizados;
- backup criptografado e restore de teste executados;
- reconciliação consistente sem issues;
- reconciliação divergente sem auto-fix;
- scanner de fronteiras e manifesto de fontes aprovado;
- 13 schemas públicos preservados;
- assets de descoberta e mídia sem regressão.

## Não executado

- Docker Compose real e volumes reais;
- PostgreSQL, n8n, FreshRSS, Kuma e ntfy reais;
- restore destrutivo real;
- smoke HTTP externo, pois o ambiente bloqueia abertura de socket local e não há URL de produção;
- GitHub Actions agendado;
- `pnpm install`, Astro, Vitest, ESLint, Prettier e Playwright, devido à indisponibilidade do registry npm.

Nenhum resultado não executado foi tratado como sucesso.
