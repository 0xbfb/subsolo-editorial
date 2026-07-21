# Matriz de integração Google

| Capacidade                  |    Fixture |    Google REST | Validação                      |
| --------------------------- | ---------: | -------------: | ------------------------------ |
| ler linha editorial         |        sim |            sim | contrato e paginação simulada  |
| ler documento               |        sim |            sim | resposta oficial simulada      |
| múltiplas abas              |        n/a |            sim | seleção obrigatória            |
| sugestões pendentes         |        sim |            sim | bloqueio                       |
| comentários                 |        sim | gate no Sheets | confirmação humana obrigatória |
| JSON estruturado            |        sim |            sim | parse estrito                  |
| retry 429/5xx               |        n/a |            sim | testes                         |
| timeout                     |        n/a |            sim | testes                         |
| cache efêmero               |        n/a |            sim | testes                         |
| conta de serviço            |        n/a |            sim | JWT e cache testados           |
| token efêmero               |        n/a |            sim | ausência testada               |
| escrita no Google           |        não |            não | fora do escopo                 |
| bytes públicos equivalentes | referência |            sim | comparação golden              |

## Validação real

Nenhuma chamada autenticada foi executada porque não foram fornecidas credenciais nem recursos de teste. A implementação foi exercitada por contract tests com respostas no formato REST das APIs oficiais.
