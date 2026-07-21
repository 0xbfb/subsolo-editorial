# Runbook de retirada e tombstone

## Quando usar

Use `withdrawal` somente quando houver decisão editorial explícita de ocultar o corpo já publicado. Correção ou atualização não justificam retirada.

## Pré-condições

- publicação e revisão atuais confirmadas;
- editor responsável identificado;
- motivo e impacto redigidos;
- `hide_body=true`;
- canonical existente preservado;
- pacote anterior disponível e verificável.

## Dry-run

```bash
node cli/subsolo.mjs post-publication \
  --state fixtures/post-publication/state.json \
  --payload fixtures/post-publication/withdrawal.json \
  --output .tmp/withdrawal-state.json \
  --dry-run
```

O plano deve mostrar nova revisão, tombstone, pacote, preservação no Drive, branch, PR e atualização do Sheets. Nenhum arquivo final deve ser escrito.

## Apply local

```bash
node cli/subsolo.mjs post-publication \
  --state fixtures/post-publication/state.json \
  --payload fixtures/post-publication/withdrawal.json \
  --output .tmp/withdrawal-state.json \
  --apply
```

Na operação integrada, o apply só é considerado concluído depois de:

1. gerar o novo pacote;
2. validar checksums e `supersedes`;
3. preservar o ZIP no Drive;
4. criar branch, commit e PR;
5. registrar os identificadores no Sheets.

## Validação pública

Confirmar:

- URL original responde com a página-túmulo;
- canonical continua sendo a URL original;
- o corpo antigo não aparece no HTML;
- busca e arquivo mostram somente o resumo do tombstone;
- feed de correções usa a data da retirada;
- pacote anterior permanece disponível;
- novo pacote contém nota pública e não contém o corpo ocultado.

## Falhas e rollback

Antes do merge, descarte o PR e preserve os pacotes já criados como execução não publicada. Depois do merge, qualquer reversão é outra revisão formal; não force-push e não apague o tombstone silenciosamente.
