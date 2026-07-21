# SUBSOLO — Bootstrap do Google Sheets

A planilha principal chama-se **SUBSOLO — Controle Editorial**.

## Como usar

1. crie uma planilha vazia;
2. importe cada CSV de `bootstrap/` em uma aba com o mesmo nome;
3. aplique listas controladas usando `workbook.schema.json` e `controlled-values.json`;
4. proteja colunas privadas e catálogos;
5. não armazene segredos no Sheets;
6. use os JSONs para automações e testes.

## Autoridade

- antes da publicação, o status operacional pertence ao Sheets;
- depois do merge, GitHub é autoridade sobre a versão pública;
- uma pasta do Drive nunca substitui o status estruturado.

## Geração

```bash
pnpm generate:editorial-templates -- --dry-run
pnpm generate:editorial-templates -- --apply
```

## Gate de comentários

A coluna privada `comentarios_resolvidos` deve ser `TRUE` antes da exportação Google. Ela não substitui revisão editorial ou factual; registra apenas a inspeção humana dos comentários do documento.
