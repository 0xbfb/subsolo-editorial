# Git

## Branches

- `main`: fonte publicável;
- `feature/*`: desenvolvimento;
- `publish/*`: publicação editorial futura;
- `fix/*`: correção técnica;
- `correction/*`: correção editorial futura.

## Commits

Conventional Commits, em português quando útil:

```text
feat(domain): adiciona contrato de edição
fix(build): corrige rota canônica
docs(adr): registra decisão de schema
```

O fluxo editorial futuro entra por pull request. Commit direto em `main` não é fluxo normal.
