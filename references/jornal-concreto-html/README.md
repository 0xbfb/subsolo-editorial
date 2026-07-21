# Subsolo — Base Editorial HTML

Base estática e navegável para iniciar o desenvolvimento do portal **Subsolo**.

## Execução

Abra `index.html` diretamente em um navegador moderno. Para desenvolvimento com recarga automática, sirva a pasta com qualquer servidor HTTP local.

Exemplo com Python:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Estrutura

- `index.html` — página inicial;
- `agora.html` — estado editorial atual;
- `canais.html` — diretório do ecossistema;
- `canal.html` — página de canal;
- `artigo.html` — matéria longa;
- `boletim.html` — edição do Bom Dia, Distopia;
- `tema.html` — página temática;
- `historia.html` — história acompanhada;
- `documento.html` — documento comentado;
- `arquivo.html` — arquivo filtrável;
- `busca.html` — busca local;
- `autor.html` — perfil editorial;
- `redacao.html` — página institucional;
- `assets/styles.css` — sistema visual e responsividade;
- `assets/app.js` — tema, busca, filtros e interações.

## Decisões visuais preservadas

- tema editorial claro inspirado em papel técnico;
- alternativa escura persistida em `localStorage`;
- títulos de cards e diretórios sublinhados;
- manchete principal sem sublinhado;
- tipografia serifada para conteúdo e sans-serif para metadados;
- hierarquia assimétrica;
- responsividade e estilos de impressão;
- nenhum framework, fonte remota ou dependência externa.

## Integração

O conteúdo inicial serve para exercitar os componentes e deve ser substituído pela camada editorial ou pelo CMS durante o desenvolvimento. Os arquivos podem ser usados diretamente ou convertidos em templates, componentes ou layouts de qualquer stack.
