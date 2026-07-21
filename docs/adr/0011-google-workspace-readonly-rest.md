# ADR 0011 — Google Workspace somente leitura via REST

**Status:** aceito  
**Data:** 20 de julho de 2026

## Decisão

A primeira integração real com Google Docs e Sheets usará os endpoints REST oficiais, `fetch` nativo do Node.js e autenticação por conta de serviço ou token efêmero.

Scopes:

- `documents.readonly`;
- `spreadsheets.readonly`.

## Motivos

- nenhuma dependência de runtime adicional;
- comportamento testável com fetch injetável;
- operação offline preservada;
- controle explícito de timeout, retry e logs;
- menor superfície de permissão;
- providers independentes da lógica editorial.

## Consequências

- a conta de serviço precisa receber acesso explícito aos recursos;
- comentários não são lidos pela Docs API com esses scopes;
- o Sheets recebe um gate humano `comentarios_resolvidos`;
- documentos com múltiplas abas exigem seleção explícita;
- adicionar Drive Comments no futuro exigirá ADR e scope adicional.
