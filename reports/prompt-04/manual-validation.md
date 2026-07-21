# Validação manual — Prompt 04

1. Instale dependências quando o registry estiver disponível.
2. Execute `pnpm test:contract`.
3. Execute `pnpm typecheck`.
4. Execute `pnpm build`.
5. Abra `fixtures/public/valid/publication.md` e confirme que o front matter é aceito.
6. Substitua o status público por `PRONTO_PARA_PUBLICAR` e confirme rejeição.
7. Insira um link `javascript:` e confirme rejeição.
8. Remova um autor do catálogo e confirme erro referencial.
9. Compare `schemas/1.0.0/publication.schema.json` com `src/content.config.ts`.
10. Confirme que nenhum campo privado do Sheets aparece em `fixtures/public/` ou `schemas/`.

A configuração das coleções usa as APIs atuais documentadas pelo Astro: `defineCollection` em `astro:content`, `glob` em `astro/loaders` e Zod em `astro/zod`.
