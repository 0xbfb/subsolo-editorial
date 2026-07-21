# Mapa dos workflows n8n

| ID  | Responsabilidade                             | Efeito final                |
| --- | -------------------------------------------- | --------------------------- |
| 03  | detectar candidato pronto e iniciar a cadeia | nenhum merge                |
| 04  | exportar Docs/Sheets por CLI                 | workspace público validado  |
| 05  | empacotar e preservar no Drive               | ZIP confirmado antes do Git |
| 06  | criar branch, commit e PR                    | revisão humana obrigatória  |
| 07  | confirmar deploy autorizado                  | sincronização de estado     |
| 08  | reconciliar e preparar retry manual          | nenhuma correção silenciosa |

Os JSONs em `n8n/workflows` são exports sanitizados, sem credenciais.
