# Prompt 17 — Resultados de testes

**Versão:** `0.8.4-dev`  
**Data:** 20 de julho de 2026  
**Escopo:** pipeline de mídia, derivados, retratos, integração pública e empacotamento

## Resultado consolidado

| Verificação                 |                Resultado |
| --------------------------- | -----------------------: |
| Testes Node                 |            204 aprovados |
| Falhas                      |                        0 |
| Ignorados                   |                        0 |
| Testes específicos de mídia |             19 aprovados |
| JSON Schemas públicos       |               13 válidos |
| Arquivos JSON analisados    |              192 válidos |
| Derivados da fixture        |               12 válidos |
| Fontes canônicas            | 12 checksums confirmados |
| Workflows GitHub            |                4 válidos |
| Workflows n8n               |           11 sanitizados |

A suíte acumulada terminou com:

```text
1..204
# tests 204
# pass 204
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 18865.106092
```

## Testes específicos

Foram exercitados:

- manifesto privado válido e inválido;
- assinatura real do arquivo divergente do MIME declarado;
- limite de tamanho e dimensões;
- retrato abaixo de `2048 × 2048 px`;
- alt, crédito e licença ausentes;
- ativo não aprovado;
- geração determinística dos nomes content-addressed;
- dry-run sem escrita;
- apply por staging e rollback;
- AVIF, WebP e JPEG;
- recortes `profile`, `card`, `circle-safe` e `social`;
- dimensões declaradas e bytes reais;
- SHA-256 de todos os derivados;
- remoção de EXIF, XMP e IPTC;
- orientação aplicada antes da remoção dos metadados;
- placeholder quando não há retrato aprovado;
- `<picture>` e `srcset` quando o registro possui ativo aprovado;
- empacotamento exclusivo de `media/derived`;
- rejeição de diretório de originais no pacote.

## Comandos executados

```bash
node --test tests/media/*.test.mjs
mapfile -t files < <(find tests -type f -name '*.test.mjs' | sort)
node --test "${files[@]}"
node scripts/validate-media-assets.mjs fixtures/media/golden
node scripts/validate-public-media-if-present.mjs
node scripts/validate-public-contracts.mjs
node scripts/check-boundaries.mjs
node scripts/verify-source-manifest.mjs
node scripts/verify-workflows.mjs
node scripts/validate-infra.mjs
node scripts/validate-editorial-fixtures.mjs
node scripts/validate-editorial-site.mjs
node scripts/validate-public-content.mjs
node scripts/validate-discovery-assets.mjs
python -m py_compile scripts/process-media.py
tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --exactOptionalPropertyTypes \
  src/lib/domain/public-contract.ts \
  src/lib/domain/media-pipeline.d.mts \
  src/lib/presentation/media-view-model.d.mts
```

## Validações de saída

A fixture mestra possui EXIF proposital. Após o processamento:

- os 12 derivados não contêm EXIF;
- os quatro recortes possuem dimensões esperadas;
- os três formatos são reconhecidos pela assinatura real;
- os nomes incluem o endereço de conteúdo `0b69ff6088ae1257`;
- o total público é `164966` bytes;
- o master original não entra no diretório público nem no pacote.

## Limitações comprovadas

O Corepack não conseguiu acessar `registry.npmjs.org`, retornando `EAI_AGAIN`. Docker também não está instalado no ambiente.

Não foram executados:

- `pnpm install`;
- `astro sync`;
- `astro build`;
- Vitest;
- ESLint;
- Prettier;
- Playwright;
- containers reais;
- processamento de retratos editoriais aprovados.

Os testes Node independentes de dependências, o processador Pillow real e a compilação TypeScript isolada foram executados.
