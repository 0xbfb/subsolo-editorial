# Prompt 08 — Validação manual

1. Execute o dry-run documentado em `docs/operations/exporter.md`.
2. Confirme que o diretório de destino não foi criado.
3. Inspecione o plano JSON e seus cinco checksums.
4. Execute o apply em um diretório inexistente.
5. Abra `publication.md` e compare a estrutura com o documento fixture.
6. Confirme que comentários, sugestões, notas internas e URLs privadas não aparecem.
7. Compare os cinco arquivos com `fixtures/exporter/golden/`.
8. Execute novamente sem `--overwrite` e confirme a falha segura.
9. Adicione um arquivo obsoleto no destino, execute com `--overwrite` e confirme sua remoção.
10. Execute `node scripts/scan-public-artifact.mjs fixtures/exporter/golden`.
11. Parseie o Markdown exportado com o parser público de `parse-publication-document.ts`.

## Resultado da etapa

- dry-run não escreveu o destino;
- duas execuções apply produziram checksums idênticos;
- overwrite atômico removeu arquivo obsoleto;
- golden não contém padrões privados;
- o parser público aceitou `publication.md`;
- o scanner público aprovou os cinco arquivos.
