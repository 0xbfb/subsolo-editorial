# Runbook da edição diária

1. A Mesa cria a edição `planejada` e mantém Mapa do Dia e slots em área privada.
2. `open` abre a edição.
3. `append` aceita apenas publicação confirmada e pública.
4. `publish` gera r1 e pacote imutável.
5. Novos conteúdos ou reordenação geram `revise` e um novo ZIP com `supersedes`.
6. `seal` encerra o dia e gera a revisão final.
7. Após o selo, somente `correct` cria uma revisão formal; append comum é bloqueado.
