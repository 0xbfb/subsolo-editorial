# Google Workspace — solução de problemas

## `SUBSOLO_GOOGLE_CREDENTIAL_MISSING`

Configure uma conta de serviço ou token efêmero. Não salve a chave dentro do repositório.

## `SUBSOLO_GOOGLE_AUTH_INVALID`

- confirme a chave privada;
- confirme o relógio da máquina;
- confirme as APIs habilitadas;
- gere outra credencial se necessário.

## `SUBSOLO_GOOGLE_ACCESS_DENIED`

Compartilhe a planilha e o documento com o e-mail da conta de serviço. Confirme os scopes `documents.readonly` e `spreadsheets.readonly`.

## `SUBSOLO_GOOGLE_RESOURCE_NOT_FOUND`

Confirme o ID, não a URL completa. Um 404 também pode representar recurso não compartilhado.

## `SUBSOLO_GOOGLE_QUOTA_EXCEEDED`

A integração aplica backoff e respeita `Retry-After`. Reduza polling e mantenha cache efêmero apenas quando houver repetição dentro da mesma execução.

## `SUBSOLO_GOOGLE_DOCS_TAB_REQUIRED`

O documento possui várias abas. Informe `--tab-id` ou `SUBSOLO_GOOGLE_DOCS_TAB_ID`.

## `SUBSOLO_GOOGLE_COMMENTS_GATE_PENDING`

Marque `comentarios_resolvidos` como `TRUE` no Sheets somente depois de revisar e resolver os comentários manualmente.

## `SUBSOLO_GOOGLE_SHEETS_JSON_INVALID`

Corrija o JSON da coluna indicada. Arrays e objetos precisam usar JSON válido, com aspas duplas.

## `SUBSOLO_GOOGLE_TIMEOUT`

Verifique a rede. Aumente o timeout apenas quando houver evidência de latência legítima. O modo offline permanece disponível.
