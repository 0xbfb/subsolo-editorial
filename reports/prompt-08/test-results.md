# Prompt 08 — Resultados de testes

## Resultado geral

- **58 testes Node aprovados** no lote consolidado;
- **19 testes específicos do exportador aprovados**;
- zero falhas, skips ou testes cancelados;
- dois módulos TypeScript novos compilados isoladamente com `tsc 5.8.3` em modo estrito;
- parser público compilado e executado contra o `publication.md` golden;
- nove contratos públicos preservados;
- 12 fontes canônicas verificadas por SHA-256;
- fronteiras arquiteturais, infraestrutura, fixtures editoriais, conteúdo público e workflows aprovados;
- artefato público com cinco arquivos aprovado pelo scanner de segredos e marcadores privados.

## Casos específicos do exportador

1. dry-run determinístico e sem escrita;
2. apply com os cinco arquivos esperados;
3. igualdade byte a byte com o golden;
4. IDs públicos determinísticos;
5. proveniência baseada em hashes sem IDs do Google;
6. allowlist de fontes, correções, mídia e derivados;
7. overwrite em staging sem arquivo obsoleto;
8. sugestão pendente rejeitada;
9. comentário interno rejeitado;
10. link privado rejeitado;
11. metadado obrigatório ausente rejeitado;
12. revisão factual pendente rejeitada;
13. conflito entre título do Docs e Sheets rejeitado;
14. imagem de capa reconstruída por allowlist;
15. imagem privada rejeitada;
16. data sem fuso explícito rejeitada;
17. mídia sem derivado público rejeitada;
18. booleano textual rejeitado;
19. destino existente sem `--overwrite` rejeitado.

## Validações determinísticas adicionais

- duas execuções `apply` produziram os mesmos cinco checksums;
- o `dry-run` não criou o diretório de destino;
- todos os JSONs do repositório foram parseados;
- o golden não contém links Google, IDs de documento, notas privadas ou marcadores internos;
- `publication.md` foi aceito pelo parser real do contrato público;
- nenhum provider externo foi chamado.

## Comandos executados

```bash
node --test tests/infra/*.test.mjs \
  tests/editorial/*.test.mjs \
  tests/contract/*.test.mjs \
  tests/visual/*.test.mjs \
  tests/deployment/*.test.mjs \
  tests/exporter/*.test.mjs

node scripts/check-boundaries.mjs
node scripts/verify-source-manifest.mjs
node scripts/validate-infra.mjs
node scripts/validate-editorial-fixtures.mjs
node scripts/validate-public-contracts.mjs
node scripts/validate-public-content.mjs
node scripts/verify-workflows.mjs
node scripts/scan-public-artifact.mjs fixtures/exporter/golden
```

## Limitações comprovadas

O comando `npm ping` iniciou a consulta ao registry e excedeu o timeout de 60 segundos. O repositório ainda não possui `pnpm-lock.yaml`. Consequentemente, nesta etapa não foram executados:

- `pnpm install`;
- Astro build oficial;
- Astro sync;
- Vitest;
- ESLint;
- Prettier;
- Playwright pelo projeto.

As APIs reais do Google Docs e Sheets não foram chamadas porque são explicitamente parte do Prompt 09, não do Prompt 08. Nenhum resultado dessas integrações foi presumido.
