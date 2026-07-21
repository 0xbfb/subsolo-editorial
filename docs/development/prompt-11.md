# Prompt 11 — Preservação no Google Drive

**Versão:** `0.6.1-dev`  
**Resultado:** implementação concluída em contrato; homologação externa pendente.

## Entregue

- porta de arquivo técnico separada do provider;
- adapter REST para Google Drive API v3;
- escopo `drive.file` por padrão;
- upload resumível e retomada;
- hierarquia anual e mensal;
- idempotência por SHA-256;
- confirmação remota e download;
- recibo atômico;
- comando `publish --skip-git`;
- testes de falhas e duplicidade;
- runbook e retenção.

## Fora de escopo preservado

- branch, commit e pull request;
- movimentação de Docs;
- exclusão de pacotes;
- compartilhamento público.

## Limitação

Nenhuma credencial ou pasta real do usuário foi fornecida no ambiente de geração. O relatório de upload desta etapa deriva de testes contratuais com respostas REST simuladas e não afirma upload real.
