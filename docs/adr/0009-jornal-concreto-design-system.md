# ADR 0009 — Jornal Concreto como sistema visual do portal

**Status:** aceito  
**Data:** 20 de julho de 2026

## Contexto

A base HTML limpa do tema Jornal Concreto foi aprovada como referência visual do Subsolo. O portal precisa preservar sua hierarquia editorial, aparência de jornal técnico, contraste, comportamento claro/escuro e responsividade sem acoplar conteúdo aos templates.

## Decisão

O Jornal Concreto será implementado como:

- tokens CSS próprios;
- stylesheet global sem framework visual;
- layout Astro compartilhado;
- componentes sem conteúdo editorial fixo;
- fixtures e coleções como origem dos dados;
- JavaScript progressivo apenas para aprimoramentos;
- rota interna `/__design/jornal-concreto/` para inventário visual;
- testes estáticos e Playwright para regressão visual.

A manchete principal não recebe sublinhado. Chamadas secundárias e títulos de canais preservam o sublinhado editorial aprovado.

## Consequências

- a interface pode evoluir sem migrar conteúdo;
- o tema não depende de fontes remotas nem de framework CSS;
- páginas futuras reutilizam os mesmos componentes e tokens;
- mudanças visuais precisam atualizar screenshots e testes;
- a rota de inventário não integra a navegação pública.
