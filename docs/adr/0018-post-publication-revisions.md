# ADR 0018 — Revisões pós-publicação, redirects e tombstones

**Status:** aceito  
**Data:** 20 de julho de 2026  
**Versão:** 0.8.3-dev

## Contexto

Uma publicação pode exigir correção factual, esclarecimento, atualização material, mudança de URL ou retirada. Alterar silenciosamente o conteúdo corrente destruiria a rastreabilidade editorial; remover a URL produziria uma lacuna no arquivo e permitiria que links antigos passassem a responder com um 404 sem explicação.

## Decisão

Toda alteração pós-publicação é uma nova revisão imutável. Ela deve:

1. referenciar exatamente a revisão pública anterior;
2. registrar resumo, motivo, impacto e data;
3. gerar novo pacote técnico;
4. preservar o pacote anterior;
5. confirmar o pacote no Drive antes de qualquer efeito Git;
6. entrar no repositório por branch, commit e pull request;
7. exigir merge humano;
8. atualizar o controle editorial apenas com os identificadores confirmados.

Os tipos públicos são:

- `correcao-factual`: corrige informação objetivamente errada;
- `esclarecimento`: melhora a compreensão sem mudar fato ou conclusão material;
- `atualizacao-material`: acrescenta desenvolvimento relevante sem corrigir erro factual;
- `retirada`: substitui o corpo por uma nota pública permanente.

Mudanças de slug não são correções textuais. Elas criam um redirect permanente `308`, preservam o caminho anterior e passam a usar o novo caminho como canonical.

Retiradas não geram 404. A URL original permanece canônica e renderiza um tombstone com título, motivo, impacto, data original e data de retirada. O arquivo e a busca mantêm o registro, mas indexam somente a nota-túmulo.

## Consequências

- o histórico público fica verificável;
- o Git e os ZIPs preservam as versões anteriores;
- feeds podem comunicar a data real da alteração;
- links antigos continuam resolvíveis;
- retirada não permite acesso ao corpo ocultado pelo índice ou pela página pública;
- cada alteração possui custo operacional maior, aceito em troca de rastreabilidade.

## Alternativas rejeitadas

- editar o arquivo publicado sem nova revisão;
- apagar a página e responder 404;
- redirecionar retirada para a home;
- sobrescrever o ZIP anterior;
- executar merge automático após a automação.
