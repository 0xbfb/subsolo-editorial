# Fonte de verdade por fase do ciclo

**Status:** Aceita
**Data:** 2026-07-20

## Contexto

O Subsolo precisa de uma arquitetura reproduzível, auditável e de custo incremental inicial zero.

## Decisão

Durante a elaboração, Docs e Sheets são autoritativos. Após publicação, Git e o pacote imutável representam a versão pública.

## Consequências

- a decisão deve ser coberta por testes ou validações quando aplicável;
- mudanças incompatíveis exigem novo ADR;
- integrações não podem vazar para o domínio.
