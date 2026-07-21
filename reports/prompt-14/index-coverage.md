# Cobertura do índice e do arquivo

## Acervo público

| Métrica                | Valor |
| ---------------------- | ----: |
| Registros              |    25 |
| Dias                   |     8 |
| Canais representados   |     9 |
| Temas usados           |    25 |
| Autores representados  |    18 |
| Naturezas editoriais   |     8 |
| Estados públicos       |     5 |
| Histórias acompanhadas |     3 |
| Páginas do arquivo     |     4 |
| Itens por página       |     8 |

## Assets

| Asset                | Cobertura                 |
| -------------------- | ------------------------- |
| `archive-index.json` | 25 entradas, 20.930 bytes |
| RSS geral            | 25 itens                  |
| Feeds de canal       | 9 arquivos                |
| Feed de correções    | 1 item                    |
| Sitemap              | 127 URLs                  |
| XML validado         | 12 arquivos               |

## Campos do índice compacto

Cada entrada contém somente:

- ID;
- URL;
- título;
- resumo;
- data e horários públicos;
- canal;
- natureza;
- estado;
- autores;
- temas;
- história, quando existente;
- quantidade de correções.

O validador bloqueia corpo, seções, conteúdo integral, fontes privadas e notas internas.

## Limite da evidência

Os 127 URLs representam o inventário produzido pelo gerador de descoberta. O build Astro não foi executado neste ambiente devido à indisponibilidade do registry npm.
