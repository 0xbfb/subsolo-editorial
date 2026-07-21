# ADR 0010 — Pipeline manual controlado para GitHub Pages

**Status:** aceito  
**Data:** 20 de julho de 2026

## Contexto

O portal precisa ser publicado sem servidor de aplicação, com revisão humana obrigatória, build reproduzível e possibilidade de rollback por commit.

## Decisão

Usar três workflows:

1. `ci.yml` para validação, testes, build e inspeção do artefato;
2. `preview.yml` para gerar um artefato estático revisável em pull requests;
3. `deploy-pages.yml` para construir e publicar somente após merge em `main`.

O deploy usa o ambiente protegido `github-pages`, `pages: write` e `id-token: write` apenas no job de implantação. Pull requests não recebem permissões de Pages.

O portal suporta tanto um repositório de projeto (`/<repositorio>/`) quanto um domínio raiz. URLs internas são prefixadas no build por `SUBSOLO_BASE_PATH`.

## Preview

O GitHub Pages não oferece preview público geral de pull request. O projeto gera um artefato HTML para download e revisão. Não será usado serviço externo apenas para simular preview nesta fase de custo zero.

## Lockfile

O lockfile deverá ser commitado assim que o registry estiver acessível. Até lá, o workflow emite aviso explícito e usa versões diretas fixadas no `package.json`. A ausência do lockfile permanece uma limitação conhecida e impede considerar a cadeia plenamente reproduzível.

## Consequências

- revisão humana permanece obrigatória;
- o artefato é inspecionado antes do upload;
- segredos e notas privadas bloqueiam publicação;
- deploys são serializados e não cancelam implantação em andamento;
- rollback normal ocorre por PR de revert;
- a máquina local não participa da disponibilidade pública.

## Referências oficiais

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.astro.build/en/guides/deploy/github/
