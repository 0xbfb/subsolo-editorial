# Configuração do ambiente editorial Google

## Planilha

Crie `SUBSOLO — Controle Editorial` e importe os doze CSVs de `templates/google/sheets/bootstrap`.

Aplique validação de dados às colunas com `enum_source`. Proteja catálogos e colunas privadas. Não coloque tokens ou credenciais na aba CONFIGURACOES; use apenas nomes de variáveis ou `SET_IN_ENV`.

## Docs

Copie os modelos de `templates/google/docs` para `00_ADMINISTRACAO/Modelos`. Comentários, sugestões, pendências e blocos `[INTERNO]` precisam estar resolvidos ou removidos antes de `PRONTO_PARA_PUBLICAR`.

## Drive

Reproduza o manifesto `templates/google/drive/structure.json`. Pastas organizam o trabalho; o status permanece no Sheets.

## Calendar

Crie os calendários declarados em `templates/google/calendar/calendars.json`. Todo evento deve apontar para uma pauta, artigo ou edição.

## Gmail

Crie os marcadores de `templates/google/gmail/labels.json`. Nenhuma mensagem sensível deve receber resposta automática nesta fase.
