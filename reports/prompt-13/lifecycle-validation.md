# Validação do ciclo diário

| Revisão | Comando | Estado público | Supersedes | Pacote     |
| ------: | ------- | -------------- | ---------- | ---------- |
|      r1 | publish | publicada      | null       | preservado |
|      r2 | revise  | publicada      | run r1     | preservado |
|      r3 | seal    | selada         | run r2     | preservado |

Append comum após r3 é rejeitado. Correção posterior usa `correct`, exige motivo e cria nova revisão formal. URLs individuais são representadas pelos mesmos IDs públicos em todas as revisões.
