# Validação de redirects, tombstones, arquivo e feed

## Redirect

- origem: `/2026/07/20/aceite-a-nova-regra-ou-desapareca-da-fila/`;
- destino: `/2026/07/20/nova-regra-ou-desapareca-da-fila/`;
- status: `308`;
- motivo público registrado;
- rota antiga permanece em `getStaticPaths`;
- redirects autorreferentes, duplicados e circulares são rejeitados.

## Tombstone

- canonical preservado: `/2026/07/20/seu-aplicativo-mudou-os-termos/`;
- estado público: `Retirado`;
- corpo público substituído por nota-túmulo;
- busca e arquivo exibem somente: `O corpo foi ocultado; a URL, o título e o motivo da retirada permanecem públicos.`;
- o corpo ocultado não é enviado ao `archive-index.json`.

## Feed de correções

O feed contém dois eventos com a data da alteração, não a data original:

1. correção factual da reportagem de infraestrutura;
2. retirada do guia de sobrevivência digital.

O feed informa resumo e impacto, preservando o GUID canônico da publicação.

## Assets validados

- `public/redirects.json`;
- `public/archive-index.json`;
- `public/rss/correcoes.xml`;
- `public/sitemap.xml`;
- `public/robots.txt`.
