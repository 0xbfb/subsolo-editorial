# Arquivo técnico no Google Drive

## Objetivo

Preservar um ZIP de edição já validado sem alterar Git, Google Docs, Google Sheets ou o próprio pacote local.

## Estrutura

```text
SUBSOLO/
└── 90_ARQUIVO_TECNICO/
    └── edicoes/
        └── YYYY/
            └── MM/
                └── subsolo-edicao-...-rN.zip
```

A pasta informada em `SUBSOLO_DRIVE_ROOT_FOLDER_ID` deve ser a raiz `SUBSOLO`. A CLI não procura raízes pelo nome.

## Credencial

### Opção A — OAuth do usuário

Defina temporariamente:

```bash
GOOGLE_DRIVE_ACCESS_TOKEN=...
```

Não armazene o token em arquivo versionado.

### Opção B — Conta de serviço

```bash
SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE=/caminho/fora/do/repositorio.json
```

Compartilhe explicitamente a raiz ou adicione a conta de serviço ao Shared Drive. O scope padrão é `drive.file`.

## Dry-run

```bash
node cli/subsolo.mjs publish \
  --package .tmp/packages/subsolo-edicao-20260720T150000-0300-r1.zip \
  --drive-root-id "$SUBSOLO_DRIVE_ROOT_FOLDER_ID" \
  --skip-git \
  --dry-run
```

O dry-run:

1. valida o ZIP local;
2. confirma que a raiz é uma pasta autorizada;
3. verifica quais subpastas existem;
4. procura o SHA-256 no destino, quando o mês já existe;
5. informa as criações e o recibo previsto;
6. não cria pasta, não envia bytes e não grava recibo.

## Apply

```bash
node cli/subsolo.mjs publish \
  --package .tmp/packages/subsolo-edicao-20260720T150000-0300-r1.zip \
  --drive-root-id "$SUBSOLO_DRIVE_ROOT_FOLDER_ID" \
  --receipt .tmp/archive-receipt.json \
  --skip-git \
  --apply
```

## Confirmação obrigatória

O upload só termina depois de confirmar:

- `file_id`;
- nome;
- `application/zip`;
- pasta mensal;
- tamanho em bytes;
- propriedades da edição;
- MD5 informado pelo Drive;
- SHA-256 após download;
- CRC e checksums internos;
- `edition_id`, `run_id` e revisão do manifesto baixado.

## Idempotência

A busca usa:

```text
parent folder
+ MIME application/zip
+ appProperties.subsolo_package_sha256
+ trashed = false
```

O nome não participa como prova de identidade. Mais de um resultado para o mesmo SHA-256 é uma ambiguidade bloqueadora.

## Upload resumível

- os chunks são múltiplos de 256 KiB;
- o padrão do projeto é 2 MiB;
- após falha de rede, a CLI consulta a sessão com `Content-Range: bytes */TOTAL`;
- a URI da sessão nunca é impressa;
- sessão expirada exige novo upload; o pacote local permanece intacto.

## Falhas

| Código | Significado | Ação |
|---|---|---|
| `SUBSOLO_DRIVE_ACCESS_DENIED` | raiz ou arquivo sem autorização | revisar compartilhamento |
| `SUBSOLO_DRIVE_QUOTA_EXCEEDED` | limite temporário | aguardar retry ou reduzir frequência |
| `SUBSOLO_DRIVE_TIMEOUT` | chamada excedeu timeout | verificar rede antes de aumentar limite |
| `SUBSOLO_DRIVE_UPLOAD_INCOMPLETE` | sessão sem conclusão | repetir sem apagar o ZIP local |
| `SUBSOLO_ARCHIVE_REMOTE_METADATA_INVALID` | metadata remota divergente | não registrar file ID |
| `SUBSOLO_ARCHIVE_DOWNLOAD_CHECKSUM_INVALID` | download divergente | repetir preservação e auditar |

## Privacidade

O recibo não inclui:

- URL do Drive;
- ID da pasta raiz;
- URI da sessão;
- token;
- e-mail da credencial;
- corpo editorial.

## Verificação manual de homologação

1. execute dry-run;
2. confirme o caminho planejado;
3. execute apply com um pacote fixture;
4. abra o Drive e confirme ano, mês e nome;
5. baixe o arquivo manualmente;
6. execute `validate-package` no download;
7. repita o apply e confirme `already-archived`;
8. confira que existe somente um ZIP.
