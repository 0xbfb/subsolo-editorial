# Resultados dos testes — Prompt 16

**Versão:** `0.8.3-dev`  
**Data:** 20 de julho de 2026

## Aprovado

- 185 testes Node executados;
- 185 aprovados;
- zero falhas, skips, cancelamentos ou TODOs;
- 15 testes específicos de pós-publicação;
- TypeScript 5.8.3 em modo estrito para os módulos afetados;
- 13 JSON Schemas draft 2020-12;
- 185 arquivos JSON parseados;
- 12 fontes canônicas verificadas por SHA-256;
- fronteiras arquiteturais válidas;
- fixture editorial: 12 abas, 44 autores, 9 canais e 74 quadros;
- assets de descoberta: 25 registros e 11 feeds;
- infraestrutura estática: 6 serviços e 6 healthchecks;
- quatro workflows GitHub com permissões mínimas;
- 11 workflows n8n sanitizados validados pela suíte;
- pacote r2: 11 entradas e checksums válidos;
- pacote r3: 11 entradas e checksums válidos;
- scanner do diretório `public`: 16 arquivos sem segredos ou marcadores privados;
- CLI `post-publication` validada em dry-run e apply local.

## Casos críticos comprovados

- correção sem referência à revisão corrente é rejeitada;
- atualização factual disfarçada é rejeitada;
- esclarecimento não pode alterar fato ou conclusão material;
- redirect circular é rejeitado;
- retirada preserva canonical e substitui o corpo por tombstone;
- falha no arquivo técnico impede branch e PR;
- pacote é preservado antes do Git;
- busca e arquivo mantêm a retirada sem indexar o corpo ocultado;
- feed usa a data da alteração;
- pacotes anteriores permanecem intactos.

## Ferramentas indisponíveis

O Corepack falhou ao buscar `pnpm@11.15.1` por `EAI_AGAIN registry.npmjs.org`. Docker não está instalado. Portanto, não foram executados:

- `pnpm install`;
- `astro sync`;
- `astro build`;
- Pagefind sobre `dist`;
- Vitest;
- ESLint;
- Prettier;
- Playwright;
- containers n8n/PostgreSQL;
- APIs reais Google Drive/Sheets;
- pull request e deploy reais no GitHub.

Nenhum desses resultados foi presumido.
