# Rollback do portal

## Rollback normal

1. identificar o commit que introduziu o problema;
2. criar branch `rollback/<sha-curto>` a partir de `main`;
3. executar `git revert <commit>`;
4. abrir pull request com o motivo e as URLs afetadas;
5. executar CI e preview;
6. aprovar e fazer merge;
7. aguardar o deploy e o smoke test.

Essa estratégia preserva o histórico. Não reescrever `main` e não usar force push.

## Rollback emergencial

Quando o site público estiver materialmente quebrado:

1. preparar o revert imediatamente;
2. usar o fluxo acelerado de aprovação, sem dispensar CI;
3. fazer merge;
4. acompanhar `Publicar GitHub Pages`;
5. verificar home, Agora e Arquivo;
6. registrar o incidente.

## Falha de deploy sem falha de conteúdo

- não criar novo conteúdo para “destravar” o deploy;
- inspecionar o job de build e o job de implantação separadamente;
- reexecutar o workflow somente quando a falha for transitória;
- quando o artefato estiver incorreto, corrigir por PR.

## Verificação local de um commit anterior

```bash
git worktree add ../subsolo-rollback <commit>
cd ../subsolo-rollback
pnpm install --frozen-lockfile
pnpm build
pnpm verify:dist
pnpm scan:public-artifact
```
