# Proteção de branch e ambiente

## Branch `main`

Configurar um ruleset com:

- pull request obrigatório;
- pelo menos uma aprovação;
- descartar aprovações após novos commits;
- resolver todas as conversas;
- exigir branch atualizada antes do merge;
- exigir os checks de CI e preview;
- bloquear force push;
- bloquear exclusão;
- restringir bypass aos administradores responsáveis;
- preferir squash merge para publicação editorial individual;
- não permitir commit automatizado direto de conteúdo editorial.

## Ambiente `github-pages`

- aceitar deploy somente de `main`;
- manter proteção de ambiente;
- não armazenar credenciais editoriais no ambiente;
- usar apenas o `GITHUB_TOKEN` com permissões explícitas;
- registrar o URL do deployment pelo output da Action.

## Checks esperados

- `Validar, testar e construir`;
- `Gerar artefato de preview`.

Os nomes devem ser revisados após a primeira execução real, pois o GitHub apresenta o nome do job como check.
