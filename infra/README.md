# Infraestrutura local do Subsolo

A stack local executa automações e ferramentas editoriais. Ela **não hospeda o portal público**.

## Serviços core

| Serviço | Imagem fixada | Acesso local |
|---|---|---|
| PostgreSQL | `postgres:17.10-alpine3.24` | somente rede Docker |
| n8n | `docker.n8n.io/n8nio/n8n:2.29.10` | `http://127.0.0.1:5678` |
| FreshRSS | `freshrss/freshrss:1.29.1` | `http://127.0.0.1:8080` |
| SearXNG | `ghcr.io/searxng/searxng:2026.5.10-df1f24fb7` | `http://127.0.0.1:8081` |
| Uptime Kuma | `louislam/uptime-kuma:2.3.2` | `http://127.0.0.1:3001` |

O profile `alerts` adiciona `binwiederhier/ntfy:v2.23.0` em `127.0.0.1:8082`.

## Primeiro uso

```bash
cp infra/env/.env.example infra/env/.env
# Troque todos os CHANGEME
pnpm infra:validate
pnpm infra:config
bash infra/scripts/start.sh --dry-run
bash infra/scripts/start.sh --apply
bash infra/scripts/healthcheck.sh
```

## Segurança

- portas são vinculadas a `127.0.0.1`;
- PostgreSQL não publica porta no host;
- não encaminhe portas no roteador;
- não versione `infra/env/.env`;
- preserve `N8N_ENCRYPTION_KEY`, pois credenciais do n8n dependem dela;
- o volume do workspace é montado como somente leitura no n8n.

## Backup

```bash
bash infra/scripts/backup.sh --dry-run
bash infra/scripts/backup.sh --apply
```

O backup com `--apply` contém uma cópia do `.env`; ele deve permanecer local e ser criptografado antes de envio externo. O restore destrutivo permanece deliberadamente bloqueado nesta etapa até um teste controlado em ambiente com Docker.

A configuração `infra/searxng/settings.runtime.yml` é gerada localmente a partir do template e fica ignorada pelo Git.

## Observabilidade e recuperação — 0.9.0-dev

- monitores: `infra/uptime-kuma/monitors.json`;
- tópicos e regras de alerta: `infra/ntfy/topics.json`;
- backup: `infra/scripts/backup.sh`;
- restauração: `infra/scripts/restore.sh`;
- alerta: `infra/scripts/alert.sh`.

O backup portátil é criptografado. O arquivo de passphrase deve ficar fora do repositório e com permissão `600`. O Kuma local não detecta o desligamento da própria máquina; a disponibilidade pública também é verificada pelo workflow agendado do GitHub Actions.
