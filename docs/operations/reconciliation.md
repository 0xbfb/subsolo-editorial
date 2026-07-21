# Reconciliação operacional

A reconciliação compara quatro perspectivas:

- estado editorial no Sheets;
- pacote técnico no Drive;
- pull request no GitHub;
- deployment público confirmado.

## Dry-run

```bash
node cli/subsolo.mjs reconcile \
  --input fixtures/observability/reconciliation-diverged.json \
  --dry-run
```

## Regras

São detectados, entre outros:

- linha duplicada no Sheets;
- pacote ausente ou duplicado no Drive;
- `file_id` divergente;
- PR ausente, duplicado ou órfão;
- merge não refletido no Sheets;
- publicação sem deployment confirmado;
- pacote órfão.

Todos os itens usam `auto_fix: false`.

`--apply` só retorna sucesso quando não há divergência. Quando há qualquer decisão ambígua, a CLI encerra com `SUBSOLO_RECONCILIATION_REQUIRES_HUMAN`.

O workflow `12_reconciliacao_operacional` prepara o relatório e o alerta, mas não altera Sheets, Drive ou GitHub.
