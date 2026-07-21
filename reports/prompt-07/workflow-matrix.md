# Matriz dos workflows

| Workflow                       | Gatilho                  | Permissões                                          | Saída                    | Deploy |
| ------------------------------ | ------------------------ | --------------------------------------------------- | ------------------------ | ------ |
| CI                             | PR, push em main, manual | `contents: read`                                    | checks                   | não    |
| Preview editorial              | PR pronto para revisão   | `contents: read`                                    | artefato HTML por 7 dias | não    |
| Publicar GitHub Pages — build  | push em main, manual     | `contents: read`                                    | artefato Pages validado  | não    |
| Publicar GitHub Pages — deploy | após build               | `contents: read`, `pages: write`, `id-token: write` | deployment e smoke test  | sim    |

## Proteções

- `pull_request_target` proibido;
- Actions externas usam tags semânticas exatas;
- artefato passa por `verify:dist` e `scan:public-artifact`;
- deploys usam `cancel-in-progress: false`;
- PRs não recebem permissões de Pages;
- ambiente `github-pages` é obrigatório.
