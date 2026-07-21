# Validação manual recomendada

Após instalar as dependências:

```bash
pnpm build
pnpm preview
```

Validar:

1. `/arquivo/` e páginas 2–4;
2. arquivo por 2026, julho e cada dia entre 13 e 20;
3. busca por título e por termo presente apenas no corpo;
4. filtros isolados e combinados;
5. remoção de filtros;
6. funcionamento do arquivo com JavaScript desativado;
7. nove feeds de canal e feed de correções;
8. sitemap em domínio raiz e em base path de GitHub Pages;
9. teclado, foco e leitura por tecnologia assistiva;
10. ausência de navegação e formulários nos resultados Pagefind.

## Limitação desta execução

Não houve renderização Astro nem bundle Pagefind real. A interface, os atributos de indexação, os assets e a integração de build foram validados estruturalmente.
