# Operação do arquivo, busca e feeds

Versão: `0.8.1-dev`

## Gerar os assets

```bash
node scripts/generate-discovery-assets.mjs
node scripts/validate-discovery-assets.mjs
```

O primeiro comando lê os catálogos, as publicações atuais e o histórico público. O segundo valida integridade, duplicidade, campos privados, feeds, sitemap e robots.

## Build completo

```bash
pnpm build
```

A sequência é:

1. validar conteúdo editorial;
2. validar contrato público;
3. gerar assets de descoberta;
4. executar `astro build`;
5. executar Pagefind sobre `dist`;
6. escrever o bundle em `dist/pagefind`.

## Variáveis

| Variável | Função | Padrão |
|---|---|---|
| `SUBSOLO_SITE_URL` | origem absoluta de feeds e sitemap | `https://subsolo.example` |
| `SUBSOLO_BASE_PATH` | base de GitHub Pages ou domínio | `/` |

## Arquivo

- oito itens por página;
- ordenação por data de publicação, depois ID;
- recortes anuais, mensais e diários;
- páginas completas e registros históricos usam rotas diferentes;
- o índice compacto não contém corpo, seções, fontes privadas ou notas.

## Busca

A página `/busca/` tenta importar `/pagefind/pagefind.js`. Quando disponível, pesquisa o corpo indexado e aplica filtros. Quando indisponível, usa `archive-index.json` para pesquisar título e resumo.

O fallback não deve ser apresentado como equivalente à busca integral.

## Feeds

São produzidos:

- `rss.xml` geral;
- nove feeds de canal;
- `rss/correcoes.xml`.

Todos usam URLs absolutas, GUID estável e XML escapado.

## Diagnóstico

```bash
pnpm test:discovery
pnpm validate:feeds
```

Falhas comuns:

- referência a canal, tema ou autor inexistente;
- ID ou rota duplicada;
- registro sem data;
- campo privado no índice;
- URL não absoluta em feed ou sitemap;
- bundle Pagefind ausente porque o build não foi executado.
