# Contratos das páginas editoriais

Versão: `0.8.1-dev`

## Home

Exibe uma manchete dominante, chamadas secundárias, transmissões recentes, edição do BDD e diretório de canais. A manchete principal não é sublinhada; chamadas secundárias e títulos de canal permanecem sublinhados.

## Agora

Exibe prioridade principal, publicações recentes e pelo menos uma história aberta. Não funciona como painel de métricas nem cria urgência artificial.

## Edição

É a capa de um dia. Agrupa publicações em ordem editorial, preserva URLs próprias e informa revisão, estado, selo e histórico público.

## Publicação

Mostra canal, natureza, estado, título, subtítulo, autoria, edição, datas, tempo de leitura, território, sumário, corpo, blocos editoriais, ficha, fontes, correções, história e conexões. Somente o corpo editorial recebe `data-pagefind-body`.

## Canal

Apresenta pergunta editorial, função, periodicidade, editor, quadros e todo o acervo associado. Um canal sem conteúdo mostra estado vazio, nunca material de preenchimento.

## Tema

Agrega publicações e registros históricos de canais distintos. O estado vazio é permitido.

## Autor

Apresenta função, departamento, blog quando houver e todo o acervo relacionado. Os dados vêm do catálogo canônico.

## História

Apresenta estado, guardião, atores, questões abertas, cronologia e publicações relacionadas, inclusive registros históricos.

## Documento comentado

Diferencia fonte primária e comentário editorial. O trecho indica página ou localização.

## Arquivo

Oferece paginação e entradas por ano, mês, dia, canal, tema, autor e história. A navegação básica funciona sem JavaScript. Não usa rolagem infinita como acesso único.

## Registro histórico

Preserva metadados públicos essenciais de uma publicação histórica sem inventar corpo integral. Quando existir pacote técnico correspondente, ele é a fonte de preservação integral.

## Busca

Carrega o bundle Pagefind gerado após o build e pesquisa título e corpo indexável. Permite filtros removíveis por canal, tema, autor, natureza e estado. Na ausência do bundle, usa o índice compacto para filtrar títulos e resumos no navegador; não consulta backend.

## A Redação

Apresenta manifesto, princípios, editores, canais e acesso ao diretório completo.
