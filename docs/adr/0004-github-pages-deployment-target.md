# GitHub Pages como destino público

**Status:** Aceita
**Data:** 2026-07-20

## Contexto

O Subsolo precisa de uma arquitetura reproduzível, auditável e de custo incremental inicial zero.

## Decisão

O site público será independente da máquina local e publicado como artefato estático em etapa posterior.

## Consequências

- a decisão deve ser coberta por testes ou validações quando aplicável;
- mudanças incompatíveis exigem novo ADR;
- integrações não podem vazar para o domínio.
