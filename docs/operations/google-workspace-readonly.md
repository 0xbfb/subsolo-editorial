# Google Workspace — integração somente leitura

**Versão:** 0.5.1-dev

## Objetivo

Ler uma linha da aba `ARTIGOS` no Google Sheets e o Google Docs associado, convertendo ambos para o mesmo input estruturado usado pelo provider de fixtures.

O site público nunca consulta Google Docs ou Sheets em runtime.

## Scopes

A integração solicita somente:

```text
https://www.googleapis.com/auth/documents.readonly
https://www.googleapis.com/auth/spreadsheets.readonly
```

O provider não escreve, cria, move, compartilha ou exclui arquivos.

## Autenticação recomendada

Use uma conta de serviço dedicada:

1. crie a conta de serviço no projeto Google Cloud;
2. habilite Google Docs API e Google Sheets API;
3. gere a credencial JSON;
4. guarde o arquivo fora do repositório;
5. compartilhe apenas a planilha e os documentos necessários com o e-mail da conta de serviço;
6. configure:

```bash
export SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE=/caminho/seguro/subsolo-google.json
```

Também é aceito `GOOGLE_APPLICATION_CREDENTIALS`.

Para um teste manual curto, é possível usar `GOOGLE_WORKSPACE_ACCESS_TOKEN`. O token não deve ser persistido em `.env`, logs, documentação ou fixtures.

## Configuração

```bash
export SUBSOLO_GOOGLE_SPREADSHEET_ID='...'
export SUBSOLO_GOOGLE_SHEETS_RANGE='ARTIGOS!A:AZ'
export SUBSOLO_GOOGLE_SHEETS_PAGE_SIZE='200'
export SUBSOLO_GOOGLE_TIMEOUT_MS='10000'
export SUBSOLO_GOOGLE_MAX_ATTEMPTS='3'
export SUBSOLO_GOOGLE_CACHE_TTL_MS='0'
```

Documentos com múltiplas abas exigem seleção explícita:

```bash
export SUBSOLO_GOOGLE_DOCS_TAB_ID='...'
```

Isso evita exportar silenciosamente a aba errada.

## Dry-run

```bash
node cli/subsolo.mjs export-doc \
  --provider google \
  --article-id artigo-2026-07-20-transporte \
  --spreadsheet-id "$SUBSOLO_GOOGLE_SPREADSHEET_ID" \
  --sheet-range 'ARTIGOS!A:AZ' \
  --destination .tmp/exported-google \
  --dry-run
```

O dry-run:

- lê Sheets e Docs;
- normaliza os dados;
- executa todas as validações;
- informa os arquivos e checksums previstos;
- não cria o diretório de destino.

## Apply

```bash
node cli/subsolo.mjs export-doc \
  --provider google \
  --article-id artigo-2026-07-20-transporte \
  --spreadsheet-id "$SUBSOLO_GOOGLE_SPREADSHEET_ID" \
  --destination .tmp/exported-google \
  --apply
```

Use `--overwrite` apenas depois de revisar o dry-run. A escrita continua atômica e usa staging com rollback.

## Contrato da aba ARTIGOS

A primeira linha precisa conter os nomes exatos das colunas. Colunas estruturadas são JSON textual:

- `autores_publicos`;
- `temas_publicos`;
- `territorios_publicos`;
- `imagem_publica`;
- `fontes`;
- `correcoes`;
- `midia`.

Booleanos:

- `destaque`;
- `comentarios_resolvidos`.

`comentarios_resolvidos` deve ser `TRUE` somente após revisão humana dos comentários. A Google Docs API não fornece comentários editoriais pelo endpoint de documento com os dois scopes mínimos adotados. Por isso, o gate explícito no Sheets é obrigatório. Sugestões pendentes continuam sendo detectadas na estrutura retornada pelo Docs.

## Paginação

O provider divide `ARTIGOS!A:AZ` em faixas numeradas:

```text
ARTIGOS!A1:AZ200
ARTIGOS!A201:AZ400
...
```

A leitura termina quando uma página volta incompleta. O limite máximo impede leitura silenciosamente truncada.

## Cache

`SUBSOLO_GOOGLE_CACHE_TTL_MS` habilita cache somente em memória durante o processo. O valor padrão é zero. Nenhuma resposta privada é gravada automaticamente no disco.

## Retries e timeout

São repetidos automaticamente:

- HTTP 429;
- HTTP 500, 502, 503 e 504;
- falhas de rede;
- timeout, dentro do limite de tentativas.

Não são repetidos automaticamente:

- 401;
- 403;
- 404;
- dados inválidos;
- conflitos editoriais.

## Modo offline

O provider de fixtures continua sendo a referência de desenvolvimento:

```bash
node cli/subsolo.mjs export-doc \
  --provider fixture \
  --sheet fixtures/exporter/valid/sheet-row.json \
  --document fixtures/exporter/valid/document.json \
  --destination .tmp/exported-fixture \
  --dry-run
```

Os testes de contrato confirmam que providers Google e fixture geram os mesmos arquivos públicos para a mesma informação editorial.

## Limitações deliberadas

- nenhuma escrita no Google;
- nenhum acesso ao Drive nesta etapa;
- nenhum download de imagens;
- nenhum comentário é buscado pela Drive Comments API;
- nenhuma credencial é criada ou armazenada pelo projeto;
- nenhum ID privado entra no relatório público de proveniência.

## Referências oficiais

- Google Docs `documents.get`: https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/get
- Google Docs e abas: https://developers.google.com/workspace/docs/api/how-tos/tabs
- Google Sheets `spreadsheets.values.get`: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get
- OAuth 2.0 scopes: https://developers.google.com/identity/protocols/oauth2/scopes
- contas de serviço: https://developers.google.com/identity/protocols/oauth2/service-account
