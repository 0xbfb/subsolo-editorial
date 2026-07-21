# Simulações de falha — Prompt 18

| Cenário                              | Resultado                           |
| ------------------------------------ | ----------------------------------- |
| componente ausente no backup         | manifesto rejeitado                 |
| artefato criptografado corrompido    | restore rejeitado antes da escrita  |
| checksum interno divergente          | restore rejeitado                   |
| ntfy retorna 429                     | falha classificada como retryable   |
| tópico ntfy inválido                 | configuração rejeitada              |
| pacote Drive ausente                 | divergência explícita, sem auto-fix |
| `file_id` divergente                 | revisão humana exigida              |
| PR ausente                           | revisão humana exigida              |
| publicação sem deployment confirmado | aviso explícito                     |
| `apply` de reconciliação divergente  | bloqueado                           |
| corpo editorial em contexto de log   | conteúdo redigido                   |
| token em mensagem                    | token redigido                      |

O ambiente não permite abrir sockets locais, portanto o smoke HTTP real não foi executado aqui. O script foi validado em modo fixture e o workflow externo está configurado para execução no GitHub Actions.
