# Validação manual do Prompt 03

1. Abra `templates/google/sheets/workbook.schema.json` e confirme as 12 abas.
2. Importe os CSVs em uma planilha de teste e confirme UTF-8, colunas e acentos.
3. Compare `AUTORES.csv` com os dossiês da redação.
4. Confirme que canais possuem o editor correto.
5. Verifique os templates em `templates/google/docs`.
6. Confirme que campos `[INTERNO]` e `observacoes_privadas` não pertencem à saída pública futura.
7. Execute:

```bash
pnpm test:editorial
pnpm validate:fixtures
pnpm generate:editorial-templates -- --dry-run
```

8. Em ambiente com dependências, execute também:

```bash
pnpm test:domain -- editorial-state
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```
