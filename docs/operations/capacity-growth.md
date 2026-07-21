# Capacidade, quotas e crescimento

## Baseline

O teste sintético gera 10.000 publicações, índice compacto, facetas, paginação e RSS em memória. O objetivo não é simular o Astro completo, mas verificar que o modelo de descoberta não degrada antes do build.

## Gatilhos

Os limites operacionais vivem em `config/hardening/capacity-policy.json`. Ao atingir qualquer gatilho, abrir um registro de decisão antes de crescer.

Áreas observadas:

- número de publicações;
- tamanho do `archive-index.json`;
- índice Pagefind;
- artefato GitHub Pages;
- pacotes anuais no Drive;
- execuções n8n;
- volume PostgreSQL.

## Estratégias permitidas

- reduzir campos do índice compacto;
- segmentar índices por período;
- manter paginação canônica;
- limitar RSS;
- arquivar relatórios operacionais antigos após política explícita;
- mover mídia histórica para armazenamento preservado mantendo derivados públicos necessários.

## Estratégias proibidas

- apagar pacotes técnicos automaticamente;
- remover correções ou tombstones para economizar espaço;
- carregar todo o acervo no JavaScript inicial;
- criar rolagem infinita como único acesso ao arquivo;
- aumentar budgets sem evidência e ADR.
