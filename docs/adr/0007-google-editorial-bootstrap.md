# ADR 0007 — Bootstrap editorial declarativo antes das APIs Google

**Status:** aceito  
**Data:** 2026-07-20

## Decisão

Representar Google Sheets, Docs, Drive, Calendar e Gmail inicialmente por schemas, CSVs, JSONs e modelos versionados. APIs reais ficam para etapas posteriores.

## Motivos

- permite testar o domínio sem credenciais;
- mantém o fluxo manual utilizável;
- evita acoplar regras editoriais ao Google;
- cria fixtures para adapters futuros;
- explicita quais campos são privados.

## Consequências

A configuração inicial no Google é manual. O Prompt 09 implementará os adapters reais sem alterar os contratos definidos aqui.
