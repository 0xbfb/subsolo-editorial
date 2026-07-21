# Matriz de captação editorial — Prompt 15

| Fonte | Entrada | Natureza preservada | Saída permitida | Efeito proibido |
|---|---|---|---|---|
| FreshRSS | item da reading list | agregador, release ou comunicado | pauta `TRIAGEM` | confirmar fato ou publicar |
| Gmail | mensagem de remetente permitido | alegação do remetente | pauta `TRIAGEM` e metadados de quarentena | responder, apagar, arquivar ou abrir anexo |
| SearXNG | resultado de metabusca | snippet não verificado | pauta `TRIAGEM` e aviso de busca parcial | usar snippet como evidência ou corpo |
| Google Sheets | aba `PAUTAS` | controle operacional privado | append `RAW` com credencial separada | escrever artigo ou alterar status para aprovado |

## Fronteiras

- toda classificação automática é `PRELIMINAR_NAO_EDITORIAL`;
- todo item nasce com `verificacao=NAO_VERIFICADO`;
- canal e quadro permanecem vazios;
- a Mesa de Abertura decide relevância, prioridade, equipe, canal e destino;
- anexos ficam restritos a manifesto local com `body_downloaded=false` e `opened=false`;
- a captação não chama exportador, empacotador, Drive, Git ou GitHub.
