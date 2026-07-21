# Política de triagem automatizada

## Deduplicação

A chave exata combina URL canônica, título normalizado e origem. Parâmetros de rastreamento e fragmentos são removidos. Uma segunda camada identifica duplicidade provável por URL equivalente ou similaridade de título dentro da mesma origem.

- duplicata exata: não cria nova pauta;
- duplicata provável: não cria nova pauta e exige revisão humana;
- o relatório preserva o `pauta_id` relacionado;
- a automação nunca mescla duas pautas silenciosamente.

## Alegações e evidências

- release: `COMUNICADO_OU_RELEASE`;
- e-mail: `MENSAGEM_DE_FONTE` ou release;
- feed: `ITEM_DE_AGREGADOR`;
- busca: `RESULTADO_DE_METABUSCA`.

O snippet permanece em campo privado e explicitamente não verificado. Ele não entra como corpo da pauta nem como citação factual.

## Datas

`source_published_at` registra a publicação da fonte. `fact_occurred_at` só é preenchido quando a entrada traz uma data do acontecimento separada e parseável. Ausência de data do fato não é substituída pela data da matéria.

## Quarentena

Metadados de anexos são gravados fora do repositório público. `body_downloaded=false` e `opened=false` são obrigatórios. Extensões executáveis e MIME ativos bloqueiam a criação automática.

## Operação

Primeiro execute `--dry-run`. O modo `--apply` pode anexar a linha ao Sheets usando um token separado com escopo `spreadsheets`. Credenciais, tokens e allowlists reais permanecem fora do repositório.
