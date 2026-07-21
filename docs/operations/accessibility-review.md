# Revisão de acessibilidade

**Alvo:** WCAG 2.2 nível AA  
**Cobertura automatizada:** estrutura HTML, landmarks, headings, labels, alt, dimensões, foco, contraste de tokens, movimento reduzido, cores forçadas e progressão sem JS.

## Cenários validados automaticamente

- teclado: controles nativos, skip link e ausência de `tabindex` positivo;
- landmarks: `header`, navegação principal, `main#conteudo` e footer;
- headings: um `h1` por rota e sem saltos no preview representativo;
- formulários: inputs e selects dentro de labels;
- imagens: texto alternativo e dimensões declaradas;
- tema: contraste de tokens em papel claro e escuro;
- preferências: `prefers-reduced-motion`, `prefers-contrast` e `forced-colors`;
- sem JS: 114 rotas mantêm conteúdo crítico.

## Checklist manual obrigatório antes de 1.0.0

1. percorrer home, matéria, arquivo, busca, perfil e tombstone apenas por teclado;
2. testar NVDA + Firefox no Windows;
3. testar VoiceOver + Safari em dispositivo Apple disponível;
4. ampliar a 200% e 400%;
5. verificar orientação mobile e reflow a 320 CSS px;
6. confirmar nomes, estados e mensagens da busca;
7. revisar leitura do feed de correções e das tabelas editoriais;
8. testar imagens ausentes e alto contraste do sistema.

Esta revisão assistiva real não foi executada no ambiente de geração e permanece gate de release.
