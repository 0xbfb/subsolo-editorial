# Resultados dos testes — Prompt 06

## Aprovados

- fixture editorial pública: 4 publicações, 9 canais, 44 autores, 1 história e 1 documento;
- 31 testes estáticos com `node:test`;
- validação dos 9 contratos públicos anteriores;
- validação das 12 abas editoriais anteriores;
- infraestrutura estática sem regressão;
- fronteiras arquiteturais preservadas;
- fontes canônicas preservadas por SHA-256;
- TypeScript dos parsers compilado com `tsc 5.8.3`;
- parser compilado executado contra a fixture;
- 114 rotas de preview geradas;
- 114 páginas com links internos válidos;
- 114 documentos HTML analisados com BeautifulSoup/lxml.

## Não executados

- Astro build e sync;
- Vitest;
- ESLint e Prettier;
- Playwright do repositório;
- screenshots reais desta etapa;
- testes Docker runtime.

## Motivos

- registry npm indisponível por `EAI_AGAIN`;
- navegação do browser bloqueada pelo administrador do ambiente;
- Docker não instalado/disponível.

O log integral está em `raw-validation.log`.
