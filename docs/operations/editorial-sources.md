# Manual de fontes e captação editorial

## Regra central

FreshRSS, Gmail e SearXNG são instrumentos de descoberta. Nenhuma entrada é fato confirmado, pauta aprovada, matéria ou publicação.

## FreshRSS

- use categorias editoriais estáveis;
- preserve feed, item, URL canônica, origem e data de publicação;
- resumos do agregador são marcados como `RESUMO_DE_AGREGADOR_NAO_VERIFICADO`;
- releases são classificados como alegações do emissor, nunca como fonte independente;
- falha do feed é retryable e não remove entradas anteriores.

## Gmail

- leitura apenas com `gmail.readonly`;
- mensagens são selecionadas pelos marcadores `SUBSOLO/Pautas` e `SUBSOLO/Fontes`;
- remetente precisa estar na allowlist operacional;
- a automação não responde, exclui, arquiva ou marca a mensagem como resolvida;
- anexos são registrados em quarentena por metadados, sem download ou abertura automática;
- anexos executáveis ou ativos bloqueiam a criação automática da pauta.

## SearXNG

- consulta local em `/search?format=json`;
- o workflow n8n lê a consulta de `.runtime/input/searxng-query.json`, sem interpolar texto arbitrário em shell;
- snippets são `SNIPPET_DE_BUSCA_NAO_VERIFICADO`;
- indisponibilidade parcial de engines fica registrada no relatório;
- resultado de busca não substitui leitura da fonte.

## Destino das entradas

Toda entrada aceita cria uma linha em `PAUTAS` com:

- status `TRIAGEM`;
- prioridade `D`;
- nível de cobertura `0`;
- destino `ACOMPANHAMENTO_INTERNO`;
- canal e quadro vazios;
- classificação `PRELIMINAR_NAO_EDITORIAL`;
- verificação `NAO_VERIFICADO`;
- próximo gatilho exigindo confirmação primária ou independente.

A Mesa de Abertura continua responsável por relevância, prioridade, canal, equipe e publicação.
