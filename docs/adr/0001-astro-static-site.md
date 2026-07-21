# Astro como gerador estático

**Status:** Aceita
**Data:** 2026-07-20

## Contexto

O Subsolo precisa de uma arquitetura reproduzível, auditável e de custo incremental inicial zero.

## Decisão

O portal público será gerado estaticamente com Astro. A camada editorial e o contrato de dados permanecem independentes do framework.

## Consequências

- a decisão deve ser coberta por testes ou validações quando aplicável;
- mudanças incompatíveis exigem novo ADR;
- integrações não podem vazar para o domínio.
