# Pipeline de mídia

## Dependência local

```bash
python -m venv .venv-media
. .venv-media/bin/activate
pip install -r requirements-media.txt
```

## Entrada privada

O manifesto aponta para um original armazenado no Drive, em `.runtime/media` ou em fixture técnica. Não mova masters para `public/`, `src/` ou para o pacote editorial.

Campos obrigatórios: ID, tipo, slug, MIME declarado, alt, crédito, licença e aprovação. Retratos exigem autor, referência ao guia visual e ponto focal.

## Fluxo

```bash
node cli/subsolo.mjs media --manifest caminho/manifest.json --destination .tmp/media --dry-run
node cli/subsolo.mjs media --manifest caminho/manifest.json --destination public/media --apply
node scripts/validate-media-assets.mjs public/media
```

O apply usa staging e rollback. Cada variante gera AVIF, WebP e JPEG. Metadados EXIF/XMP/IPTC e orientação são removidos após a orientação ser aplicada.

## Limites

- original: até 50 MiB;
- maior dimensão: até 12.000 px;
- master de retrato: mínimo 2.048 × 2.048 px;
- alt, crédito e licença nunca são opcionais;
- MIME é comparado com assinatura e inspeção real.

## Derivados

Retrato: profile 1024², card 480², circle-safe 512² e social 1200×630.  
Imagem editorial: hero 1600×900, article 960×540, thumbnail 480×270 e social 1200×630.
