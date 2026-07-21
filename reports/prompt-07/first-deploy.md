# Primeiro deploy

**Status:** não executado neste ambiente.

## Motivos comprovados

1. não há repositório GitHub remoto configurado para este projeto;
2. GitHub Pages não pode ser habilitado sem esse repositório;
3. o registry npm retornou `EAI_AGAIN`, impedindo instalar pnpm e dependências;
4. não existe `pnpm-lock.yaml` porque a primeira instalação nunca foi concluída.

## Evidência produzida

- workflows YAML carregados com sucesso;
- permissões e versões validadas estaticamente;
- preview determinístico de 114 páginas usado como artefato simulado;
- `verify-dist` aprovou 114 HTMLs e 118 arquivos;
- `scan-public-artifact` não encontrou segredos ou marcadores privados;
- smoke test está implementado, mas exige uma URL publicada.

## Procedimento para o primeiro deploy real

1. criar o repositório e enviar o projeto;
2. gerar e commitrar `pnpm-lock.yaml` com acesso ao registry;
3. selecionar GitHub Actions em Settings → Pages;
4. aplicar branch protection e proteção do ambiente;
5. abrir um PR de publicação de teste;
6. revisar o artefato de preview;
7. fazer merge;
8. registrar URL, commit, run e resultado do smoke test neste relatório.
