# Prompt 19 — relatório de desempenho e escala

## Preview estático

- Rotas analisadas: **114**.
- Arquivos analisados: **119**.
- Tamanho total do preview: **330,625 bytes**.
- `archive-index.json`: **24,422 bytes**, medido em `public/archive-index.json`.
- Pagefind no preview: **não disponível**, pois o build Astro não foi executado.
- Maior estimativa de transferência inicial: **9,929 bytes** em `redacao/index.html`.
- JavaScript bloqueante nessa rota: **1,222 bytes**.
- Violações de orçamento: **0**.

## Modo degradado

- HTMLs com conteúdo crítico sem JavaScript: **114/114**.
- Pior estimativa em conexão de 400 kbps e RTT de 150 ms: **0.58 s**.
- Limite configurado para conteúdo crítico: **8 s**.

## Escala sintética

- Publicações: **10,000**.
- Duração: **107.72 ms**.
- Crescimento de heap: **16,579,936 bytes**.
- Índice de arquivo: **5,218,932 bytes**.
- Páginas: **400**.
- Itens RSS: **100**.

## Limites

Esses resultados usam o preview determinístico e geradores Node, não um `dist` produzido pelo Astro/Pagefind. Métricas de browser, Core Web Vitals, compressão do CDN e custo real do índice Pagefind permanecem gates da pré-release.
