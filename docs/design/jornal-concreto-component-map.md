# Jornal Concreto — Mapa de componentes

**Versão:** 0.3.0-dev

| Referência HTML              | Implementação Astro          | Responsabilidade                                        |
| ---------------------------- | ---------------------------- | ------------------------------------------------------- |
| `.sheet`                     | `JornalConcretoLayout.astro` | documento visual, metadados, skip link e shell          |
| `.masthead`                  | `Masthead.astro`             | data, marca, slogan e tema                              |
| `.primary-nav`               | `PrimaryNav.astro`           | navegação disponível e destinos futuros não interativos |
| `.breadcrumbs`               | `Breadcrumbs.astro`          | posição estrutural                                      |
| `.hero-grid`                 | `HomeHero.astro`             | manchete dominante e destaques laterais                 |
| `.status`                    | `StatusBadge.astro`          | estado com texto, forma e cor                           |
| `.section-rule`              | `SectionRule.astro`          | abertura de trilhos editoriais                          |
| `.news-card`                 | `StorySummary.astro`         | chamada secundária orientada a dados                    |
| `.bdd-banner`                | `DailyEditionBanner.astro`   | edição diária privilegiada                              |
| `.channel-directory article` | `ChannelCard.astro`          | identidade e função dos canais                          |
| `.footer`                    | `SiteFooter.astro`           | encerramento institucional                              |
| `assets/app.js`              | `ThemeController.astro`      | tema persistente e sincronizado                         |

## Fontes de dados

- `src/data/fixtures/jornal-concreto-home.json`: conteúdo de demonstração da home;
- `src/data/editorial/catalogs/channels.json`: catálogo canônico de canais;
- `src/lib/presentation/home-page.ts`: parser funcional da fixture;
- futuros conteúdos públicos: coleções Astro já definidas em `src/content.config.ts`.

## Regras de composição

- componentes não contêm manchetes, resumos ou listas editoriais fixas;
- identidade permanente do produto pode permanecer no layout;
- links indisponíveis são texto não interativo, não links falsos;
- imagem não é obrigatória;
- estados possuem semântica textual além da cor;
- a matéria principal nunca recebe sublinhado;
- chamadas secundárias e canais recebem sublinhado.
