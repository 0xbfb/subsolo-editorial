# Prompt 12 — resultados de testes

- `node --test` em 22 arquivos: **119 aprovados**, 0 falhas, 0 ignorados.
- Testes específicos n8n: **11 aprovados**.
- TypeScript de `publication-orchestration.ts`: compilação isolada aprovada com `tsc 5.8.3`.
- CLI dry-run, apply fixture e reconcile dry-run: aprovados.
- Workflows exportados: 6 JSONs sanitizados, sem credenciais, Code nodes ou merge automático.
- Docker runtime: não executado; binário Docker indisponível neste ambiente.
- n8n/PostgreSQL reais: não executados por ausência de Docker e credenciais externas.

Arquivos alterados ou adicionados: 24.
