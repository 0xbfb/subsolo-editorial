# Política pública de correções e atualizações

**Versão:** 1.0  
**Aplicação:** Subsolo 0.8.3-dev

## Princípio

O Subsolo corrige de forma visível. Uma publicação não deve parecer ter sido sempre igual à versão mais recente quando uma alteração factual ou material ocorreu depois da publicação.

## Tipos de alteração

### Correção factual

Usada quando um nome, número, data, horário, atribuição, localização ou outra afirmação verificável estava errada.

A nota deve informar:

- o que estava errado;
- a informação correta;
- quando a correção foi publicada;
- o impacto da correção sobre a conclusão do texto;
- a revisão anterior e a nova revisão.

### Esclarecimento

Usado quando o texto estava factual, mas poderia induzir leitura ambígua ou incompleta. Um esclarecimento não pode ser usado para esconder uma correção factual.

### Atualização material

Usada para desenvolvimento posterior que altera o estado da história, sem significar que a publicação anterior continha erro.

### Retirada

Usada quando o corpo não deve continuar público. A URL original permanece e exibe uma nota-túmulo. A retirada deve declarar motivo e impacto, sem publicar informações privadas ou juridicamente sensíveis além do necessário.

## Fluxo obrigatório

1. editor identifica e classifica a alteração;
2. a revisão anterior é conferida;
3. motivo e impacto são registrados;
4. o texto ou tombstone é produzido;
5. um novo pacote é gerado;
6. o pacote anterior permanece intacto;
7. o novo pacote é preservado no Drive;
8. branch e pull request são criados;
9. revisão humana decide o merge;
10. a nota aparece na matéria, no arquivo e no feed de correções.

## Slugs e URLs

Mudanças de slug são excepcionais. O caminho anterior recebe redirect `308` para o novo canonical. Redirects circulares, duplicados ou autorreferentes são proibidos.

## O que não fazer

- apagar silenciosamente o histórico;
- chamar correção factual de atualização;
- editar diretamente `main`;
- sobrescrever o pacote anterior;
- retirar uma página com 404;
- indexar o corpo ocultado de uma retirada;
- publicar motivo interno que exponha fonte ou dado confidencial.
