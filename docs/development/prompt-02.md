# Prompt 02 — Infraestrutura local portátil

**Versão:** `0.1.1-dev`

## Entregue

- Compose com PostgreSQL, n8n, FreshRSS, SearXNG e Uptime Kuma;
- ntfy opcional via profile `alerts`;
- imagens com versões explícitas;
- binds de host exclusivamente em `127.0.0.1`;
- PostgreSQL restrito à rede interna;
- volumes nomeados e healthchecks;
- scripts dry-run/apply;
- backup local e restore dry-run;
- validação estática e testes Node nativos;
- runbook operacional.

## Limitação da execução

O ambiente de geração não possui binário Docker. A configuração foi validada estaticamente, mas `docker compose config`, subida real, persistência e restore não puderam ser executados aqui. Esses itens estão documentados para validação no host do projeto.
