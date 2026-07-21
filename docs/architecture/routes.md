# Mapa de rotas públicas

Versão: `0.8.4-dev`

## Rotas fixas

| Rota                   | Função                                         |
| ---------------------- | ---------------------------------------------- |
| `/`                    | Capa editorial atual                           |
| `/agora/`              | Prioridades e estado editorial do momento      |
| `/edicoes/`            | Índice de edições diárias                      |
| `/edicoes/2026/07/20/` | Capa da edição diária fixture                  |
| `/canais/`             | Diretório dos canais                           |
| `/redacao/`            | Diretório do corpo editorial                   |
| `/arquivo/`            | Primeira página do arquivo vivo                |
| `/busca/`              | Busca Pagefind com filtros e fallback estático |
| `/a-redacao/`          | Manifesto, princípios e editores               |
| `/404/`                | Página de erro editorial                       |

## Rotas dinâmicas

| Padrão                        | Origem de dados                                                           |
| ----------------------------- | ------------------------------------------------------------------------- |
| `/[ano]/[mês]/[dia]/[slug]/`  | publicação completa, redirect 308 ou tombstone, conforme o estado público |
| `/arquivo/registros/[slug]/`  | registros históricos compactos                                            |
| `/arquivo/pagina/[n]/`        | paginação do arquivo, oito itens por página                               |
| `/arquivo/[ano]/`             | recorte anual                                                             |
| `/arquivo/[ano]/[mês]/`       | recorte mensal                                                            |
| `/arquivo/[ano]/[mês]/[dia]/` | recorte diário                                                            |
| `/canais/[slug]/`             | catálogo de canais e acervo associado                                     |
| `/temas/[slug]/`              | catálogo de temas e acervo associado                                      |
| `/redacao/[slug]/`            | catálogo de autores e acervo associado                                    |
| `/historias/[slug]/`          | histórias acompanhadas e cronologia                                       |
| `/documentos/[slug]/`         | documentos comentados                                                     |

## Assets de descoberta

| Caminho                   | Função                                              |
| ------------------------- | --------------------------------------------------- |
| `/archive-index.json`     | índice compacto para filtros e fallback da busca    |
| `/pagefind/`              | bundle gerado após o `astro build`                  |
| `/rss.xml`                | feed geral                                          |
| `/rss/canais/[canal].xml` | feed por canal                                      |
| `/rss/correcoes.xml`      | feed de correções                                   |
| `/sitemap.xml`            | inventário de páginas públicas                      |
| `/robots.txt`             | política de rastreamento e localização do sitemap   |
| `/redirects.json`         | registro público compacto dos redirects permanentes |

A geração estática deve falhar diante de referência inexistente, rota duplicada ou taxonomia inválida. Nenhuma rota pública depende de Google, n8n, PostgreSQL ou serviços locais em tempo de leitura.

## Pós-publicação

Mudança de slug mantém a rota anterior em `getStaticPaths` e responde com `308` para o canonical novo. Retirada mantém a rota canônica e renderiza uma nota-túmulo; não existe 404 silencioso. O arquivo e a busca usam o impacto público da retirada e nunca o corpo ocultado.
