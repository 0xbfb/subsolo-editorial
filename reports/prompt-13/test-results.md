# Prompt 13 — resultados de testes

- `node --test` em todos os testes MJS: **129 aprovados**, 0 falhas, 0 ignorados.
- Testes específicos do ciclo da edição: **10 aprovados**.
- Compilação isolada dos tipos novos com `tsc 5.8.3`: aprovada.
- Validação de contratos públicos: 11 schemas, draft 2020-12.
- Validação da fixture do portal: 4 publicações, 9 canais, 44 autores.
- Validação da infraestrutura estática: 6 serviços e 6 healthchecks.
- Pacotes r1, r2 e r3: checksums internos válidos e cadeia `supersedes` aprovada.
- Varredura de vazamento: nenhum Mapa do Dia, slot reservado, pauta adiada ou título de trabalho nos pacotes públicos.
- Docker/n8n/PostgreSQL runtime: não executados; Docker indisponível.
- Astro/Vitest/ESLint/Playwright: não executados; Corepack falhou com `EAI_AGAIN` ao acessar o registry npm.

Arquivos alterados ou adicionados desde 0.7.0-dev: 44.
