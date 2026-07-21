# Evidências externas da pré-release

Este diretório recebe apenas relatórios sanitizados de homologação. Credenciais, IDs privados, URLs de sessão e corpo editorial são proibidos.

Arquivos esperados pelo gate:

- `clean-install.json`;
- `dependency-audit.json`;
- `docker-stack.json`;
- `google-workspace.json`;
- `github-pages.json`;
- `manual-acceptance.json`.

Cada arquivo deve possuir `status: "pass"`, data, ambiente, responsável e referências sanitizadas. A ausência ou qualquer outro status mantém `release:verify` em NO-GO.
