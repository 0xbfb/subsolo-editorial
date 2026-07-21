# Prompt 09 — validação manual

## Confirmado

1. O provider fixture continua funcional.
2. O modo Google exige credencial antes de efetuar a chamada.
3. O dry-run não cria o destino.
4. O apply continua atômico.
5. O mesmo conteúdo gera os mesmos cinco arquivos públicos independentemente do provider.
6. Nenhum ID do Google entra na proveniência pública.
7. O Sheets exige `comentarios_resolvidos = TRUE`.
8. Documentos com várias abas exigem `tab_id`.
9. O site e o build não dependem de Google em runtime.

## Não confirmado neste ambiente

- autenticação contra uma conta Google real;
- acesso a planilha real;
- acesso a documento real;
- comportamento de quotas reais;
- revogação de uma credencial real;
- build Astro após instalação das dependências.

## Procedimento externo necessário

1. criar conta de serviço dedicada;
2. habilitar Docs API e Sheets API;
3. compartilhar uma planilha e um documento de teste;
4. executar o comando em dry-run;
5. comparar output com fixture equivalente;
6. revogar a credencial de teste e repetir o setup para validar o runbook.
