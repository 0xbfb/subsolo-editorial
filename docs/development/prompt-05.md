# Prompt 05 — Migração visual do Jornal Concreto para Astro

**Versão resultante:** `0.3.0-dev`  
**Data:** 20 de julho de 2026

## Resultado

A home bootstrap foi substituída por uma composição Astro orientada a dados que preserva o tema Jornal Concreto. Foram criados tokens, layout, componentes, fixture validada, inventário visual interno, testes estáticos, testes Playwright e screenshots de comparação.

## Decisões centrais

- nenhum framework CSS foi adicionado;
- a referência HTML permanece imutável;
- conteúdo editorial foi removido dos componentes;
- rotas futuras não fingem estar disponíveis;
- JavaScript é progressivo;
- cores funcionais foram ajustadas apenas para contraste AA;
- a manchete principal não é sublinhada;
- títulos secundários e canais são sublinhados.

## Limitação comprovada

O registry npm permaneceu inacessível por `EAI_AGAIN`. Assim, não foi possível instalar Astro, Vitest, ESLint, Prettier e `@playwright/test`, nem executar o build Astro e a suíte Playwright do próprio repositório. A lógica TypeScript nova foi compilada isoladamente com `tsc 5.8.3`; os testes estáticos e a renderização visual determinística foram executados com ferramentas disponíveis no ambiente.

## Próxima etapa

Prompt 06: páginas editoriais, rotas reais e componentes de conteúdo.
