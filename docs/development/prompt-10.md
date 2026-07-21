# Prompt 10 — Pacote de edição, revisões e checksums

**Versão resultante:** `0.6.0-dev`

## Resultado

Foi implementada a unidade técnica de preservação do Subsolo. O fluxo recebe um workspace público exportado, valida sua estrutura, produz manifestos e relatórios, calcula checksums, gera ZIP determinístico e permite validação e restauração locais.

## Escopo concluído

- `subsolo package` em dry-run e apply;
- `subsolo validate-package`;
- `subsolo restore` em dry-run e apply;
- revisões e `supersedes`;
- SHA-256 e CRC32;
- ZIP determinístico;
- detecção de duplicidade;
- escrita e restauração atômicas;
- proteção contra symlink e path traversal;
- fixtures r1 e r2;
- schemas de manifest e publication run;
- documentação operacional e ADR.

## Fora de escopo preservado

- Google Drive;
- Git e GitHub;
- pull request;
- deploy.
