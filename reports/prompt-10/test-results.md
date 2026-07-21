# Prompt 10 — Resultados de testes

**Versão:** `0.6.0-dev`  
**Data:** 20 de julho de 2026

## Resultado consolidado

- testes Node executados: **90**;
- aprovados: **90**;
- falhas: **0**;
- ignorados: **0**;
- testes específicos do packager/CLI: **16**;
- JSON Schemas: **11**, draft 2020-12;
- pacotes golden: **2**;
- entradas por pacote: **11**;
- integridade Info-ZIP: aprovada;
- integridade Python `zipfile`: aprovada;
- verificação `sha256sum -c`: aprovada;
- compilação TypeScript isolada dos novos contratos: aprovada.

## Comportamentos exercitados

- dry-run sem escrita;
- apply atômico;
- bytes determinísticos em destinos diferentes;
- nome padrão com timestamp, offset e revisão;
- manifest, run, relatórios e checksums;
- validação CRC32 e SHA-256;
- restauração por staging;
- pacote corrompido;
- revisão 2 sem pacote anterior;
- `supersedes` divergente;
- duplicidade por checksum;
- revisão inválida;
- symlink;
- caminho de publicação fora da raiz;
- path traversal forjado no ZIP;
- ciclo CLI package → validate → restore.

## Regressões executadas

- contratos editoriais;
- schemas públicos;
- exportador;
- providers Google;
- infraestrutura estática;
- workflows GitHub;
- rotas editoriais;
- sistema visual;
- fronteiras arquiteturais;
- manifesto SHA-256 das fontes.

## Checksums dos pacotes golden

```text
84263841a5ba6e1ba1294e234c18ac555f9fef869f0b105d1b98391e177d5d94  fixtures/packager/golden/r1.zip
541915e0b1da8eb7d5aa019d3a842690badb063f516643f47cc4f86765a8466a  fixtures/packager/golden/r2.zip
```

## Limitação do ambiente

O Corepack falhou ao baixar `pnpm@11.15.1` de `registry.npmjs.org` com `EAI_AGAIN`. Por isso não foram executados:

- `pnpm install`;
- Astro build oficial;
- Vitest;
- ESLint;
- Prettier;
- Playwright do projeto.

Nenhum resultado dessas ferramentas foi presumido. Os testes disponíveis sem dependências externas foram executados integralmente.
