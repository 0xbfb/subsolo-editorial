# Prompt 19 — revisão de dependências

Foram revisadas as dez dependências diretas fixadas no `package.json`:

| Pacote            | Versão | Escopo          | Licença    |
| ----------------- | -----: | --------------- | ---------- |
| Astro             |  7.1.2 | runtime         | MIT        |
| @eslint/js        | 10.0.1 | desenvolvimento | MIT        |
| @playwright/test  | 1.57.0 | desenvolvimento | Apache-2.0 |
| @types/node       | 26.1.1 | desenvolvimento | MIT        |
| ESLint            | 10.7.0 | desenvolvimento | MIT        |
| Pagefind          |  1.5.2 | desenvolvimento | MIT        |
| Prettier          |  3.9.5 | desenvolvimento | MIT        |
| TypeScript        |  6.0.3 | desenvolvimento | Apache-2.0 |
| typescript-eslint | 8.64.0 | desenvolvimento | MIT        |
| Vitest            | 4.1.10 | desenvolvimento | MIT        |

A revisão transitiva não foi executada: não existe `pnpm-lock.yaml` e o registry npm estava inacessível. A aprovação desta etapa é condicional; fechar 1.0 sem o inventário transitivo é proibido.
