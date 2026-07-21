# Jornal Concreto — Decisões da migração

**Versão:** 0.3.0-dev

## Preservado

- folha central sobre fundo cinza;
- cabeçalho em três colunas;
- logotipo tipográfico dominante;
- regras duplas e simples;
- hierarquia assimétrica da home;
- drop cap vermelho;
- banner diário do Bom Dia, Distopia;
- diretório numerado de canais;
- tema claro e escuro;
- adaptação mobile em coluna única;
- impressão sem controles;
- sublinhado em títulos secundários e canais;
- manchete principal sem sublinhado.

## Refatorado

- variáveis visuais foram movidas para `tokens.css`;
- o CSS da base foi reduzido ao conjunto necessário para o shell e a home desta etapa;
- conteúdo foi extraído para fixture e catálogo;
- links de rotas ainda não implementadas são apresentados como destinos indisponíveis, evitando 404 enganoso;
- o botão de tema fica oculto sem JavaScript;
- o tema é aplicado no `<head>` para reduzir flash;
- cores `muted` e `amber` foram discretamente escurecidas no papel claro para atingir contraste AA.

## Adiado para o Prompt 06

- páginas de matéria, canal, tema, autor, história, documento, arquivo e redação;
- navegação pública completa;
- componentes específicos dessas páginas;
- validação integral de links internos.

## Verificação visual

A ausência de dependências npm impediu o build Astro nesta execução. Para não ocultar essa limitação, foi criado um preview determinístico apenas para validar CSS, dados e composição no Chromium. Ele não substitui o build Astro e fica restrito a `reports/prompt-05/preview`.
