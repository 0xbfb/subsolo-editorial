# Núcleo funcional em camadas

**Status:** Aceita
**Data:** 2026-07-20

## Contexto

O Subsolo precisa de uma arquitetura reproduzível, auditável e de custo incremental inicial zero.

## Decisão

Regras de domínio serão funções puras e efeitos ficarão em adapters de infraestrutura.

## Consequências

- a decisão deve ser coberta por testes ou validações quando aplicável;
- mudanças incompatíveis exigem novo ADR;
- integrações não podem vazar para o domínio.
