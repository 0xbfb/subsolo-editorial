# ADR 0017 — Captação editorial limitada à triagem

**Status:** aceito  
**Data:** 2026-07-20

## Decisão

FreshRSS, Gmail e SearXNG são adapters de descoberta. Eles podem normalizar entradas, deduplicar, registrar origem, criar pauta preliminar e produzir relatório. Não podem aprovar pauta, escolher canal, escrever matéria ou iniciar publicação.

Toda pauta automática nasce em `TRIAGEM`, prioridade `D`, nível `0`, sem canal, com classificação `PRELIMINAR_NAO_EDITORIAL` e verificação `NAO_VERIFICADO`.

## Segurança

- Gmail usa leitura somente;
- Sheets usa credencial de escrita separada;
- anexos não são baixados nem abertos;
- arquivos potencialmente ativos bloqueiam a criação automática;
- consultas SearXNG do n8n entram por arquivo JSON fixo, não por interpolação de shell;
- snippets e releases não são tratados como evidência independente.

## Consequências

A Mesa de Abertura permanece responsável por mérito, prioridade, canal, equipe e destino. A automação reduz trabalho mecânico sem assumir julgamento editorial.
