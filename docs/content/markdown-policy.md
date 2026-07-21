# Política de Markdown público

## Permitido

- títulos a partir de `##`;
- parágrafos, listas, tabelas e citações;
- links HTTP, HTTPS, `mailto:`, âncoras e caminhos relativos;
- blocos editoriais autorizados.

## Blocos autorizados

`fact`, `declaration`, `unknown`, `why-it-matters`, `next-step`, `document`, `action-recommended` e `correction`.

## Proibido

- H1 no corpo;
- HTML arbitrário;
- scripts, iframes, objetos, embeds e estilos;
- protocolos `javascript:`, `data:`, `vbscript:` e `file:`;
- tabs no front matter;
- chaves duplicadas;
- YAML avançado, anchors, tags ou execução.

O parser aceita deliberadamente um subconjunto pequeno de YAML para tornar o contrato auditável e previsível.
