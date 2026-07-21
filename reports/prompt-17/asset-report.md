# Prompt 17 — Relatório de ativos

**Versão:** `0.8.4-dev`

## Estado editorial

Nenhum retrato editorial aprovado foi introduzido nesta etapa.

Os onze editores estão registrados em `src/data/media/portraits.json` com estado `pending`:

- Cora;
- Vera;
- Recibo;
- Limiar;
- Corte;
- Modo;
- Trilho;
- Lock;
- Yumi;
- Clara;
- Intervalo.

Enquanto um master aprovado não for recebido, revisado e associado a um `media_id`, a interface usa o placeholder tipográfico oficial. Não há fotografia genérica, reaproveitamento entre personagens ou imagem produzida automaticamente.

## Fixture técnica

O pipeline foi comprovado com uma composição geométrica determinística que **não representa Cora nem qualquer integrante da redação**.

| Campo | Valor |
|---|---|
| Master | `fixtures/media/source/cora-fixture-master.jpg` |
| Dimensões | `2048 × 2048 px` |
| SHA-256 | `e7d9b533c88c3fd77214baddf537d602f401a7aef98514a4c20c73a618af2d43` |
| Endereço curto | `0b69ff6088ae1257` |
| Metadata de entrada | EXIF proposital |
| Metadata de saída | removida |
| Derivados | 12 |
| Total público | 164966 bytes |

## Variantes

| Variante | Dimensões | AVIF | WebP | JPEG |
|---|---:|---:|---:|---:|
| profile | 1024 × 1024 | 17.558 B | 11.844 B | 34.220 B |
| card | 480 × 480 | 8.248 B | 5.260 B | 14.646 B |
| circle-safe | 512 × 512 | 8.365 B | 5.584 B | 15.093 B |
| social | 1200 × 630 | 11.610 B | 7.906 B | 24.632 B |

## Contrato público

Cada derivado registra:

- caminho público;
- largura;
- altura;
- formato;
- variante;
- MIME;
- tamanho em bytes;
- SHA-256.

A interface utiliza AVIF como primeira opção, WebP como segunda e JPEG como fallback. Largura e altura são declaradas no HTML para reservar espaço antes do carregamento.

## Segurança e direitos

O manifesto exige:

- MIME declarado e assinatura real compatíveis;
- alt editorial;
- crédito;
- licença;
- aprovação explícita;
- referência ao guia visual nos retratos;
- ponto focal;
- dimensões mínimas;
- limites de bytes e dimensões.

Masters permanecem no Drive, em `.runtime/media` ou em fixtures técnicas. Somente derivados aprovados podem chegar a `public/media` ou `media/derived` dentro do pacote.

## Validação visual

A folha de contato `media-contact-sheet.png` foi revisada para:

- corte quadrado principal;
- miniatura de card;
- área segura circular;
- card social horizontal;
- legibilidade dos textos de controle;
- distinção explícita entre fixture e retrato editorial.
