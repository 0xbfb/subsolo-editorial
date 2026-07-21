# Runbook — infraestrutura local

## Subir

1. copie `infra/env/.env.example` para `infra/env/.env`;
2. gere segredos fortes;
3. execute a validação estática;
4. execute `start.sh --dry-run`;
5. execute `start.sh --apply`;
6. confirme os healthchecks.

## Parar

`stop.sh --apply` para os containers sem remover volumes. Não use `down -v` na operação normal.

## Diagnóstico

- `logs.sh n8n` mostra as últimas linhas do n8n;
- `healthcheck.sh` retorna código diferente de zero se algum serviço não estiver saudável;
- `docker compose ... config` mostra a configuração resolvida.

## Porta ocupada

Edite somente a porta `*_HOST_PORT` correspondente em `infra/env/.env`. Não altere a porta interna do container.

## Atualização

1. revise changelogs;
2. atualize a versão explícita no Compose;
3. execute testes estáticos;
4. faça backup;
5. execute `update.sh --dry-run` e depois `--apply`;
6. recrie a stack e valide saúde.

## Recuperação

O restore destrutivo permanece bloqueado até ser testado em ambiente com Docker. O dry-run valida checksums e descreve a operação sem alterar volumes.
