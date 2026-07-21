# Backup e recuperação

## Objetivos

- RPO inicial: 24 horas;
- RTO inicial: 4 horas;
- retenção local: 14 dias;
- restore de teste: mensal.

## Conteúdo

O backup contém:

- `postgres.dump` em formato custom do `pg_dump`;
- `n8n_data.tar.gz`;
- `freshrss_data.tar.gz`;
- `freshrss_extensions.tar.gz`;
- `uptime_kuma_data.tar.gz`;
- `runtime.json` sem segredos;
- `backup-manifest.json` com SHA-256 e tamanho dos componentes.

Não contém:

- `.env`;
- senha do PostgreSQL;
- chave de criptografia do n8n;
- passphrase do backup;
- tokens Google, GitHub ou ntfy.

## Criptografia

A passphrase fica em arquivo externo com permissão `600`:

```bash
export SUBSOLO_BACKUP_PASSPHRASE_FILE=/caminho/fora/do/repositorio/subsolo-backup.pass
```

O artefato portátil é `tar.gz.enc`, criptografado por AES-256-CBC com PBKDF2. Nenhum bundle portátil em texto claro é preservado após o processo.

## Dry-run

```bash
bash infra/scripts/backup.sh --dry-run
```

## Backup real

```bash
bash infra/scripts/backup.sh --apply
```

## Teste de restauração

```bash
bash infra/scripts/restore.sh \
  --test \
  --backup-file infra/backups/subsolo-backup-AAAAMMDDTHHMMSSZ.tar.gz.enc \
  --passphrase-file "$SUBSOLO_BACKUP_PASSPHRASE_FILE" \
  --report .runtime/reports/restore-test.json
```

O teste verifica checksum externo, descriptografia, manifesto interno, checksum de cada componente, cabeçalho `PGDMP` e extração dos quatro arquivos de volume em diretório limpo.

## Apply destrutivo

O apply exige simultaneamente:

```text
--confirm-destructive RESTORE_SUBSOLO
--current-snapshot-confirmed
```

Antes do apply:

1. faça um backup atual;
2. copie o backup selecionado para outro dispositivo;
3. confirme a passphrase;
4. registre a janela de indisponibilidade;
5. valide espaço em disco;
6. execute primeiro `--test`.

O restore não recupera credenciais excluídas. O arquivo local de ambiente e a chave do n8n precisam ser preservados por processo seguro separado.
