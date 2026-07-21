# Contrato público de conteúdo

A versão inicial é `1.0.0` e utiliza JSON Schema draft 2020-12.

## Entidades

- `publication.md`: metadados e corpo editorial;
- `edition.json`: capa e revisão do dia;
- `sources.json`: fontes públicas;
- `corrections.json`: histórico editorial;
- `media.json`: derivados publicáveis;
- `story.json`: história acompanhada;
- `author.json`: perfil público;
- `channel.json`: produto editorial;
- `topic.json`: linha temática;
- `redirect.json`: preservação de caminho anterior por redirect permanente 308;
- `tombstone.json`: nota pública de retirada com canonical preservado.

## Regras essenciais

- IDs de entidades usam prefixo + ULID;
- edições usam `ed_YYYY-MM-DD`;
- slugs são ASCII, minúsculos e separados por hífen;
- datas públicas usam ISO 8601 e fuso explícito;
- o idioma inicial é `pt-BR`;
- o fuso editorial é `America/Sao_Paulo`;
- status internos em caixa alta não são aceitos;
- campos não declarados são rejeitados;
- referências são verificadas antes do build.

Consulte `schemas/1.0.0/` e `fixtures/public/valid/` para os contratos executáveis.

## Package manifest e publication run

A versão `0.6.0-dev` adiciona dois contratos técnicos públicos:

- `package-manifest.schema.json`: identidade, revisão, `run_id`, `supersedes`, datas e publicações do ZIP;
- `publication-run.schema.json`: resultado determinístico da execução de empacotamento.

Esses schemas descrevem preservação e operação. Eles não são coleções renderizadas diretamente pelo Astro.


## Ciclo pós-publicação

A versão `0.8.3-dev` adiciona contratos públicos para redirects e tombstones. Correções continuam em `corrections.json`; o tipo determina se a alteração é correção factual, esclarecimento, atualização material ou retirada. A cadeia exige `new_revision = previous_revision + 1`. IDs `redirect_` e `tomb_` seguem o mesmo ULID estável das demais entidades.
