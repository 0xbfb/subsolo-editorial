# ADR 0019 — Pipeline seguro de mídia com originais fora do portal

**Status:** aceito  
**Versão:** 0.8.4-dev

## Decisão

O domínio valida manifesto, direitos, MIME, dimensões e conjunto de derivados. O efeito de imagem fica isolado em um provider local baseado em Python/Pillow. Originais permanecem no Drive ou em `.runtime/media`; somente AVIF, WebP e JPEG otimizados entram em `public/media` e nos pacotes.

Cada nome público incorpora hash do conteúdo e da transformação. O resultado declara largura e altura, crédito, licença, bytes e SHA-256. Retratos são associados a autores somente após aprovação explícita; ausência de retrato mantém o placeholder tipográfico.
