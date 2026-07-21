# Decisão GO/NO-GO — 1.0.0-pre

Data: 21 de julho de 2026  
Decisão: **NO-GO para RC1**  
Validação offline: **PASS**

## Fundamentação

A pré-release foi gerada para homologação, mas não atende aos critérios de avanço para RC1. O verificador formal executou **28 etapas offline** sem falhas e, em seguida, registrou **9 bloqueadores externos**.

## Evidências aprovadas

- 250 testes Node em 46 arquivos;
- fluxo fixture com 28 etapas;
- exportação comparada aos golden outputs;
- ZIP determinístico, validação e restore;
- backup criptografado sintético com restore `restorable`;
- 10 execuções Chromium em cinco rotas e dois viewports;
- 13 schemas, workflows, infraestrutura, descoberta, mídia, segurança, acessibilidade estática, desempenho e escala;
- varredura de segredos e do artefato público;
- cinco arquivos comprovadamente mortos removidos;
- SBOM direto e inventário da árvore.

## Bloqueadores

1. **Lockfile produzido por instalação limpa** — `pnpm-lock.yaml`.
2. **Dependências instaladas em ambiente limpo** — `node_modules/.bin/astro`.
3. **Build Astro real** — `dist/index.html`.
4. **Índice Pagefind real** — `dist/pagefind/pagefind.js`.
5. **Auditoria transitiva de vulnerabilidades e licenças** — `reports/prompt-20/evidence/dependency-audit.json`.
6. **Stack Docker real e healthchecks** — `reports/prompt-20/evidence/docker-stack.json`.
7. **Fluxo real com Docs, Sheets e Drive de teste** — `reports/prompt-20/evidence/google-workspace.json`.
8. **PR, build, deploy e smoke reais no GitHub Pages** — `reports/prompt-20/evidence/github-pages.json`.
9. **Aceite manual desktop, mobile, teclado e leitor de tela** — `reports/prompt-20/evidence/manual-acceptance.json`.

## Matriz do plano

- critérios aprovados: **10**;
- critérios parciais: **10**;
- critérios bloqueados: **2**.

## Condição para reavaliação

O Prompt 21 só deve começar após a homologação produzir evidência real para cada bloqueador e `pnpm release:verify` retornar `go` sem `--allow-blockers`. Problemas encontrados nessa homologação devem ser classificados como defeito, documentação ou pedido de nova funcionalidade.
