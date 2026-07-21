# Prompt 05 — Resultados de validação

**Versão:** `0.3.0-dev`

## Executado e aprovado

- 24 testes Node acumulados;
- 8 testes específicos do sistema visual;
- validação das fronteiras arquiteturais;
- 12 fontes preservadas por SHA-256;
- infraestrutura estática: 6 serviços, 6 healthchecks e 5 portas locais;
- 12 abas editoriais, 44 autores, 9 canais e 74 quadros;
- 9 JSON Schemas públicos;
- validação do conteúdo público vazio;
- compilação isolada de `home-page.ts` com TypeScript 5.8.3;
- parser da fixture executado com 7 itens de navegação e 3 transmissões;
- Chromium desktop 1440×1000;
- Chromium mobile 390×844;
- overflow horizontal: 0 em ambos;
- manchete: `text-decoration-line: none`;
- canal: `text-decoration-line: underline`;
- tema após alternância: `dark`, `aria-pressed=true`;
- contraste AA dos tokens textuais essenciais;
- sintaxe do gerador de preview;
- integridade das referências antes e depois da migração.

## Não executado

- `pnpm install`;
- `astro sync`;
- `astro build`;
- Vitest;
- ESLint;
- Prettier;
- Playwright via `@playwright/test` do repositório.

## Motivo

O registry npm não pôde ser resolvido (`EAI_AGAIN`). Nenhum resultado dessas ferramentas foi presumido.

## Evidências

- `browser-metrics.json`;
- `screenshots/jornal-concreto-desktop.png`;
- `screenshots/jornal-concreto-mobile.png`;
- `screenshots/comparison-desktop.png`;
- `screenshots/comparison-mobile.png`;
- `reference-before.sha256`;
- `reference-after.sha256`.
