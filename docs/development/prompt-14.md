# Prompt 14 — Arquivo vivo, busca, feeds e descoberta

**Versão resultante:** `0.8.1-dev`  
**Data:** 20 de julho de 2026

## Objetivo executado

Transformar o acervo estático em produto editorial navegável por data, canal, tema, autor e história, com busca Pagefind, filtros, paginação, feeds e sitemap, sem backend público.

## Entregas

- 25 registros públicos distribuídos em oito dias;
- paginação de oito itens, totalizando quatro páginas;
- arquivo anual, mensal e diário;
- páginas consolidadas de canal, tema, autor e história;
- rota pública genérica por data para matérias completas;
- rota separada para registros históricos sem corpo inventado;
- `archive-index.json` compacto;
- metadados e filtros Pagefind;
- busca com fallback por título e resumo;
- RSS geral, nove feeds de canal e feed de correções;
- sitemap e robots;
- documentação, ADR e testes.

## Decisões

- Pagefind é executado depois do Astro build.
- Somente regiões marcadas com `data-pagefind-body` entram no corpo pesquisável.
- Paginação é a navegação canônica do arquivo; não existe rolagem infinita.
- O fallback não carrega o corpo completo em JSON.
- Registros históricos preservam contexto e metadados, mas não simulam matéria integral.

## Correções de regressão

A compilação TypeScript isolada encontrou dois problemas herdados:

1. uso do helper inexistente `array` no histórico de revisão, substituído por `list`;
2. propriedade opcional `href` materializada com `undefined`, substituída por omissão real da propriedade.

## Limitações

A instalação npm não ocorreu porque o Corepack recebeu `EAI_AGAIN` ao acessar `registry.npmjs.org`. Logo, o build Astro oficial e o índice binário Pagefind não foram gerados neste ambiente. A integração foi validada por testes Node, compilação TypeScript isolada, geração dos assets públicos e análise estrutural.
