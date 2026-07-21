# Runbook de falhas n8n

1. Localize `run_id` e `idempotency_key`; não use o corpo editorial nos logs.
2. Execute `reconcile --dry-run`.
3. Confirme Drive antes de qualquer retomada Git.
4. Para falha transitória, reconheça o dead-letter e reexecute manualmente.
5. Para divergência de Sheets, Drive ou PR, resolva a origem; o sistema não corrige silenciosamente.
6. Nunca mescle PR por workflow.
