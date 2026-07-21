# ADR 0020 — Observabilidade, backups criptografados e reconciliação sem correção silenciosa

**Status:** aceito  
**Data:** 20 de julho de 2026

## Contexto

O portal público permanece no GitHub Pages, enquanto n8n, PostgreSQL, FreshRSS, SearXNG, Kuma e ntfy operam localmente. A máquina pode ficar desligada sem derrubar o site, mas sua indisponibilidade interrompe automações e torna o monitor local incapaz de detectar a própria queda.

## Decisão

1. logs operacionais serão JSON Lines, com redação de segredos e de corpo editorial;
2. Uptime Kuma monitorará serviços locais e endpoints públicos enquanto a máquina estiver ativa;
3. GitHub Actions executará smoke externo a cada seis horas;
4. backups portáteis serão criptografados com AES-256-CBC/PBKDF2 e nunca incluirão `.env` em texto claro;
5. PostgreSQL será preservado por dump lógico; n8n, FreshRSS e Kuma por arquivos de volume;
6. todo backup precisa passar por validação de manifesto, checksum, descriptografia e restore de teste;
7. reconciliação compara Sheets, Drive, GitHub e deployments, mas nunca aplica correção ambígua automaticamente;
8. alertas devem conter código, componente e ação recomendada.

## Metas iniciais

- RPO: 24 horas;
- RTO: 4 horas;
- retenção local: 14 dias;
- restore de teste: mensal;
- smoke público externo: a cada 6 horas.

## Consequências

- a chave de backup deve existir fora do repositório e ser protegida separadamente;
- o Kuma local não substitui monitoramento externo;
- um alerta indisponível não transforma falha em sucesso;
- divergências podem exigir intervenção manual e atrasar publicação, por decisão deliberada de segurança.
