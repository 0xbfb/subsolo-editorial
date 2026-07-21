# Publicação manual controlada

## Pré-requisitos no GitHub

1. criar ou selecionar o repositório;
2. enviar o projeto com `main` como branch protegida;
3. em **Settings → Pages**, selecionar **GitHub Actions** como fonte;
4. proteger o ambiente `github-pages` para aceitar deploy somente de `main`;
5. aplicar as regras de `branch-protection.md`;
6. gerar e commitrar `pnpm-lock.yaml` antes da primeira publicação considerada reproduzível.

## Fluxo editorial

```text
branch editorial
  → pull request
  → CI
  → artefato de preview
  → revisão humana
  → merge em main
  → build público
  → inspeção do artefato
  → GitHub Pages
  → smoke test
```

## Artefato de preview

O workflow `preview.yml` produz `subsolo-preview-pr-<numero>` com retenção de sete dias. Ele pode ser baixado na execução do workflow e servido localmente:

```bash
python -m http.server 8080 --directory dist
```

Não abrir `index.html` diretamente quando a revisão envolver rotas aninhadas.

## Configuração de URL

No deploy, `actions/configure-pages` informa a origem e o base path efetivos. O workflow converte os outputs em:

```text
SUBSOLO_SITE_URL=<origin>
SUBSOLO_BASE_PATH=<base_path ou />
```

Isso cobre site de projeto, site de usuário/organização e domínio customizado sem inferir a URL pelo nome do repositório.

Para domínio customizado:

1. configurar DNS e Pages;
2. criar `public/CNAME`;
3. definir `SUBSOLO_SITE_URL` com o domínio;
4. usar `SUBSOLO_BASE_PATH=/`;
5. revisar todos os canonicals no preview antes do merge.

## Verificações antes do upload

- validação editorial;
- testes;
- Astro build;
- entrada `index.html` no topo;
- links internos;
- ausência de symlinks e hard links;
- ausência de source maps iniciais;
- varredura de segredos e marcadores privados.

## Limitação do preview

O input `preview` da Action de deploy do GitHub Pages continua indisponível ao público geral. O Subsolo usa artefatos de workflow em vez de conceder permissões de deploy a pull requests.
