# Prompt 18 — Observabilidade, backups, reconciliação e recuperação

**Versão:** `0.9.0-dev`

## Entregue

- logs estruturados e redigidos;
- classificação de retry;
- catálogo Uptime Kuma;
- ntfy opcional e alertas acionáveis;
- backup criptografado de PostgreSQL, n8n, FreshRSS e Kuma;
- restore de teste e apply destrutivo protegido;
- reconciliação Sheets/Drive/GitHub/deployment sem correção silenciosa;
- workflow n8n de reconciliação;
- smoke externo agendado por GitHub Actions;
- métricas operacionais básicas;
- runbooks de incidente, backup e reconciliação.

## Limites

A stack Docker real, o ntfy real, o Kuma real e a Action agendada não foram executados neste ambiente. A evidência de restore usa fronteira Docker simulada e utilitários reais de tar, OpenSSL, SHA-256 e filesystem.
