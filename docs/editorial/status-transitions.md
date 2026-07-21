# Estados e transições editoriais

```text
IDEIA → TRIAGEM → APROVADA → PESQUISA → EM_PRODUCAO
                         ↘ AGUARDANDO_FONTE ↗
EM_PRODUCAO → REVISAO_EDITORIAL → REVISAO_FACTUAL → PRONTO_PARA_PUBLICAR
                    ↘ AJUSTES ↗
PRONTO_PARA_PUBLICAR → PR_CRIADO → AGUARDANDO_MERGE → PUBLICADO
PUBLICADO → CORRECAO_PENDENTE → PRONTO_PARA_PUBLICAR
```

`ARQUIVADO` e `RECUSADO` possuem retornos controlados para triagem. Saltos diretos, como `IDEIA → PUBLICADO`, são inválidos.

## Pronto para publicar

A transição exige:

- autor e editor cadastrados;
- canal existente;
- quadro existente e pertencente ao canal;
- documento, título e slug;
- revisões editorial, factual e técnica aprovadas ou não aplicáveis;
- texto alternativo quando houver imagem.

## Estado privado e público

Status operacional não é estado público. Antes do merge, `PRONTO_PARA_PUBLICAR` continua privado. `PUBLICADO` e `CORRECAO_PENDENTE` indicam que já existe uma versão pública, mas o conteúdo vigente continua sendo determinado pelo GitHub.
