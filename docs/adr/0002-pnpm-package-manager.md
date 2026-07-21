# pnpm como gerenciador de pacotes

**Status:** Aceita
**Data:** 2026-07-20

## Contexto

O Subsolo precisa de uma arquitetura reproduzível, auditável e de custo incremental inicial zero.

## Decisão

O projeto usa pnpm com versão fixada no campo packageManager e lockfile obrigatório.

## Consequências

- a decisão deve ser coberta por testes ou validações quando aplicável;
- mudanças incompatíveis exigem novo ADR;
- integrações não podem vazar para o domínio.
