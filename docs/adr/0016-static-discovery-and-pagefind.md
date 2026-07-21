# ADR 0016 — Descoberta estática com Pagefind e índice compacto

**Status:** aceito  
**Data:** 2026-07-20

## Contexto

O Subsolo precisa oferecer arquivo vivo, busca, filtros, feeds e descoberta sem backend público e sem depender da máquina editorial local. O acervo deve continuar utilizável com JavaScript desativado e não pode expor o corpo completo em um JSON global.

## Decisão

1. O Astro gera as páginas públicas e as rotas de arquivo.
2. Pagefind indexa o HTML após o build e grava seu bundle em `dist/pagefind`.
3. Apenas o conteúdo marcado com `data-pagefind-body` integra o corpo pesquisável.
4. Metadados e filtros públicos usam `data-pagefind-meta`, `data-pagefind-filter` e `data-pagefind-sort`.
5. `archive-index.json` contém somente metadados públicos compactos e serve para filtros e fallback da busca.
6. O arquivo canônico usa paginação e recortes por ano, mês e dia; não depende de rolagem infinita.
7. RSS, sitemap e robots são gerados de forma determinística antes do build.

## Consequências

- o portal permanece estático e compatível com GitHub Pages;
- busca no corpo exige o bundle Pagefind produzido no build;
- sem JavaScript, o leitor ainda percorre o arquivo paginado;
- o fallback pesquisa apenas título e resumo, não o corpo completo;
- novas taxonomias públicas exigem atualização do índice, metadados e testes;
- conteúdo privado nunca pode ser incluído no índice ou nos feeds.

## Alternativas rejeitadas

- backend de busca: adicionaria custo e dependência operacional;
- índice JSON com corpo integral: aumentaria peso e superfície de vazamento;
- busca simulada apenas por título: não atende o contrato editorial de busca no corpo;
- rolagem infinita: prejudica navegação, acessibilidade, URLs e recuperação de posição.
