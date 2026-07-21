# Prompt 19 — permissões e superfície operacional

- Workflows GitHub auditados: **4**.
- Serviços locais auditados: **6**.
- Problemas: **0**.

Controles:

- `contents: read` como padrão global;
- escrita restrita ao deploy de Pages (`pages: write` e `id-token: write`);
- PRs sem consumo de secrets;
- `persist-credentials: false` no checkout;
- ausência de `pull_request_target` e `workflow_run` privilegiados;
- containers sem `privileged`, host network ou Docker socket;
- workspace montado como somente leitura;
- backend marcado como rede interna;
- portas publicadas somente em `127.0.0.1`.
