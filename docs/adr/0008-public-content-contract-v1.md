# ADR 0008 — Contrato público de conteúdo v1

## Status

Aceito em 20 de julho de 2026.

## Decisão

O contrato público usa:

- Markdown com front matter YAML estrito para publicações;
- JSON para edição, fontes, correções, mídia, histórias, autores, canais e temas;
- JSON Schema draft 2020-12 como contrato externo;
- Zod via `astro/zod` como validação da camada de apresentação;
- validadores puros no domínio para CLI, testes e integração futura;
- versão inicial `1.0.0`.

Estados operacionais do Google Sheets não fazem parte do contrato público. HTML arbitrário, scripts, iframes e protocolos perigosos são rejeitados antes do build.

## Consequências

O conteúdo continua independente do Astro e pode ser migrado para outro gerador. Qualquer alteração incompatível exige nova major version e migrador explícito.
