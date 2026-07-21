# Prompt 06 — Páginas editoriais e componentes de conteúdo

**Versão resultante:** `0.3.1-dev`  
**Data:** 20 de julho de 2026

## Resultado

A base Jornal Concreto passou de uma home isolada para um portal editorial navegável e orientado a dados.

Foram implementadas rotas para home, Agora, edições, publicações, canais, temas, autores, história, documento, arquivo, busca, redação e 404. O preview determinístico materializa 114 rotas a partir das fixtures e catálogos atuais.

## Decisões

- conteúdo editorial permanece fora dos componentes;
- a fixture pública é validada antes de renderização;
- páginas dinâmicas usam IDs e slugs estáveis;
- a busca não finge funcionamento antes do Pagefind;
- imagens continuam opcionais;
- cronologia e documento possuem representação textual;
- canonical e JSON-LD inicial foram adicionados ao layout;
- a referência HTML original permanece intacta.

## Limitações do ambiente

- o registry npm respondeu `EAI_AGAIN`, impedindo instalação das dependências;
- `astro build`, `astro sync`, Vitest, ESLint e Prettier não foram executados;
- o browser local bloqueou navegação por `ERR_BLOCKED_BY_ADMINISTRATOR`; o preview foi validado estruturalmente, mas screenshots desta etapa não foram produzidas;
- Docker runtime continua indisponível.

## Próxima etapa

Prompt 07: publicação manual controlada com GitHub Actions e GitHub Pages.
