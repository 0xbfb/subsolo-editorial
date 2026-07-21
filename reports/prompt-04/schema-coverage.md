# Cobertura dos schemas públicos

**Versão:** `1.0.0`  
**Draft:** JSON Schema 2020-12

| Schema                    | Obrigatórios | Propriedades | Enums diretos | Fixture válida                      |
| ------------------------- | -----------: | -----------: | ------------: | ----------------------------------- |
| `author.schema.json`      |            9 |            9 |             2 | `authors.json`                      |
| `channel.schema.json`     |           10 |           10 |             1 | `channel.json`                      |
| `correction.schema.json`  |            9 |            9 |             1 | `corrections.json`                  |
| `edition.schema.json`     |           10 |           10 |             1 | `edition.json`                      |
| `media.schema.json`       |            8 |            8 |             1 | `media.json`                        |
| `publication.schema.json` |           20 |           20 |             2 | `publication.json + publication.md` |
| `source.schema.json`      |           10 |           10 |             1 | `sources.json`                      |
| `story.schema.json`       |           10 |           10 |             1 | `story.json`                        |
| `topic.schema.json`       |            6 |            6 |             1 | `topics.json`                       |

## Validações transversais

- enums de publicação e edição comparados com as constantes usadas pelos schemas Zod;
- referências entre edição, publicação, autores, canais, temas e histórias;
- cadeia de revisão de correções;
- IDs prefixados e ULIDs;
- slugs e URLs canônicas;
- versão de schema e registro de migrações;
- HTML, blocos editoriais e protocolos de URL.

## Ataques de regressão

- HTML `<script>`;
- URL `javascript:`;
- H1 dentro do corpo;
- major version desconhecida;
- campo privado desconhecido;
- autor ausente;
- slug duplicado.
