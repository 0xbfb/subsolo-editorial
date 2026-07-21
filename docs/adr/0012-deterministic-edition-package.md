# ADR 0012 — Pacote determinístico e imutável da edição

**Status:** aceito  
**Data:** 2026-07-20

## Contexto

O Subsolo precisa preservar cada revisão publicada, reproduzir seu conteúdo e restaurá-la sem depender do Google Drive, do GitHub ou do gerador do site.

## Decisão

Cada revisão gera um ZIP próprio com manifesto, conteúdo público, proveniência sanitizada, relatório de validação e checksums SHA-256. O ZIP é determinístico, não é sobrescrito e declara a revisão anterior por `supersedes`.

O formato usa entradas ordenadas e ZIP STORE. O checksum do ZIP identifica o artefato; `checksums.sha256` verifica suas entradas. A restauração valida o pacote antes de qualquer efeito e escreve por staging.

## Consequências

- revisões anteriores permanecem recuperáveis;
- reexecução idêntica é detectada;
- o ZIP não funciona como banco público;
- originais, credenciais e notas privadas ficam fora do artefato;
- o pacote pode ser enviado ao Drive por um provider posterior;
- compressão mais eficiente poderá ser introduzida apenas se preservar determinismo e compatibilidade.
