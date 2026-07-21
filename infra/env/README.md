# Variáveis da infraestrutura

1. Copie `.env.example` para `.env`.
2. Substitua todos os valores `CHANGEME`.
3. Nunca versione `.env`.
4. Use `docker compose --env-file infra/env/.env -f infra/compose.yml config` antes de subir a stack.

As portas são vinculadas explicitamente a `127.0.0.1`; nenhuma interface administrativa deve ser exposta no roteador.
