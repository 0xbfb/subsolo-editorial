# Resultados dos testes — Prompt 07

## Aprovados

- `node scripts/verify-workflows.mjs`;
- `node --test tests/deployment/*.test.mjs`: 8/8;
- regressão estática editorial, infraestrutura, contratos e visual: 31/31;
- validação da fixture editorial;
- validação do conteúdo público;
- validação dos nove JSON Schemas;
- fronteiras arquiteturais;
- manifesto de 12 fontes por SHA-256;
- parsing YAML dos quatro arquivos de Actions;
- `node --check` em scripts e testes MJS;
- parsing de todos os JSONs;
- compilação isolada de `site-path.ts` com TypeScript 5.8.3;
- runtime de base path;
- preview determinístico com 114 rotas;
- inspeção do artefato: 114 páginas, 118 arquivos, 265445 bytes;
- varredura do artefato sem segredos;
- validação de 114 HTMLs e links internos.

## Não executados

- `pnpm install --frozen-lockfile`;
- `pnpm lint` completo;
- `pnpm typecheck` integrado ao Astro;
- Vitest completo;
- `astro build`;
- workflow remoto;
- GitHub Pages;
- smoke test contra URL publicada;
- rollback remoto.

## Motivo

O registry npm permaneceu inacessível por `getaddrinfo EAI_AGAIN registry.npmjs.org`. Não há repositório GitHub remoto configurado no ambiente.

## Conclusão

A configuração e seus controles locais estão validados estaticamente. O critério de deploy real permanece pendente e não foi presumido.
