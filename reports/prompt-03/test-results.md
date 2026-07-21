# Prompt 03 — Resultados de validação

**Versão:** `0.2.0-dev`  
**Data:** 20 de julho de 2026

## Aprovado

### Fixtures e catálogos

```bash
node scripts/validate-editorial-fixtures.mjs
```

Resultado:

- 12 abas;
- 44 autores;
- 9 canais;
- 74 quadros;
- 2 pautas;
- 3 artigos;
- edição `ed_2026-07-20`.

### Testes estáticos editoriais

```bash
node --test tests/editorial/*.test.mjs
```

Resultado: **7/7 testes aprovados**.

Cobertura:

- doze abas obrigatórias;
- CSV e JSON para cada aba;
- contagem e unicidade dos catálogos;
- editor de canal existente;
- quadro associado a canal existente;
- fixture com todas as entidades obrigatórias;
- integridade referencial;
- separação entre campos privados e candidatos a públicos.

### Módulos TypeScript novos

Os módulos de estados, catálogos e prontidão foram compilados com o `tsc 5.8.3` disponível no ambiente, em configuração estrita isolada.

Em seguida, os JavaScript compilados foram executados com assertions para verificar:

- `IDEIA → TRIAGEM` permitida;
- `IDEIA → PUBLICADO` rejeitada;
- artigo válido aceito;
- autor desconhecido rejeitado;
- revisão incompleta rejeitada.

Resultado: **5 verificações aprovadas**.

### Dry-run e apply

```bash
node scripts/generate-editorial-bootstrap.mjs --dry-run
node scripts/generate-editorial-bootstrap.mjs --apply
```

A segunda execução em `--apply` produziu os mesmos checksums dos 24 arquivos gerados. Resultado: **idempotente**.

### Regressões das etapas anteriores

```bash
node scripts/check-boundaries.mjs
node scripts/verify-source-manifest.mjs
node scripts/validate-infra.mjs
```

Resultados:

- fronteiras arquiteturais válidas;
- 12 fontes verificadas por SHA-256;
- infraestrutura estática válida: 6 serviços, 6 healthchecks e 5 portas locais.

## Não executado

```bash
pnpm install
pnpm test:domain -- editorial-state
pnpm validate:fixtures
pnpm lint
pnpm typecheck
pnpm build
pnpm format:check
```

Motivo: o registry npm permaneceu indisponível por falha DNS `EAI_AGAIN`. A instalação offline também falhou porque o cache não contém metadados de todas as dependências.

`pnpm validate:fixtures` corresponde ao script Node executado diretamente. A suíte Vitest, Astro, ESLint e Prettier deverá ser executada em ambiente com acesso ao registry ou dependências instaladas.

## Docker

Os testes runtime de Docker continuam pendentes desde o Prompt 02, pois Docker não está instalado no ambiente de geração.
