# Observabilidade do Subsolo

## Camadas

### Portal público

O workflow `.github/workflows/scheduled-checks.yml` executa a cada seis horas e verifica:

- homepage;
- Agora;
- Arquivo;
- RSS;
- sitemap;
- índice compacto do arquivo.

A URL pode ser definida pela variável de repositório `SUBSOLO_PUBLIC_URL`. Sem ela, o workflow usa a URL convencional do GitHub Pages do projeto.

### Serviços locais

O catálogo `infra/uptime-kuma/monitors.json` define nove monitores:

- quatro públicos;
- n8n;
- FreshRSS;
- SearXNG;
- PostgreSQL;
- ntfy.

O catálogo é declarativo. A configuração inicial do Kuma continua sendo uma ação administrativa local; o arquivo serve como fonte verificável dos parâmetros e evita nomes, intervalos e URLs improvisados.

## Limitação estrutural

Quando a máquina local desliga, o Kuma também desliga. A Action agendada é a verificação externa do portal. Ela não monitora os serviços privados.

## Logs

Use JSON Lines. Campos de senha, token, chave, sessão e autorização são redigidos. Campos de corpo, conteúdo ou texto editorial são substituídos por `REDACTED_EDITORIAL_BODY`.

Cada erro operacional precisa indicar:

- código;
- componente;
- run, quando existir;
- retryable ou definitivo;
- ação recomendada.

## Alertas

Dry-run:

```bash
bash infra/scripts/alert.sh \
  --severity warning \
  --code BUILD_FAILED \
  --action "Abrir o log do workflow." \
  --dry-run
```

Apply usa `SUBSOLO_NTFY_URL`, `SUBSOLO_NTFY_TOPIC` e, quando exigido, `SUBSOLO_NTFY_TOKEN` no arquivo local de ambiente.
