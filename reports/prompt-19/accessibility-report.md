# Prompt 19 — relatório de acessibilidade

## Resultado automatizado

- Estado: **pass**.
- Fontes de página analisadas: **23**.
- Componentes analisados: **34**.
- HTMLs do preview analisados: **114**.
- Problemas encontrados pelo subconjunto estático: **0**.

## Controles presentes

- link de salto para `main#conteudo`;
- hierarquia de títulos auditada;
- foco visível;
- alvos interativos mínimos;
- formulários com rótulos;
- imagens com `alt`, largura e altura;
- suporte a `prefers-reduced-motion`;
- contraste textual calculado para os tokens essenciais;
- conteúdo crítico disponível sem JavaScript;
- fallback tipográfico quando não existe mídia aprovada;
- sem atualização automática de conteúdo ou animações indispensáveis.

## Declaração de alcance

O alvo é **WCAG 2.2 nível AA**, mas este relatório cobre somente verificações estáticas e automatizadas disponíveis no ambiente. Ele **não constitui declaração de conformidade WCAG**.

## Revisões ainda obrigatórias

- navegação completa por teclado em navegador real;
- leitor de tela em Windows e plataforma móvel;
- zoom de 200% e 400%;
- reflow em 320 CSS px;
- contraste e foco em modo claro, escuro e alto contraste;
- mensagens de erro e estados dinâmicos;
- axe/Playwright sobre o build Astro real;
- validação humana das alternativas textuais.
