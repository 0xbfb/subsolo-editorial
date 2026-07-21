# ADR 0014 — n8n como orquestrador fino

**Status:** aceito

O n8n coordena efeitos e chama a CLI. Regras de prontidão, idempotência, ordem de efeitos e reconciliação vivem no domínio/aplicação testável. Pull requests nunca são mesclados automaticamente.
