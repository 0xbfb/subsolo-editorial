# Prompt 07 — Publicação manual controlada

**Versão:** `0.4.0-dev`

## Resultado

Foram criados workflows separados para CI, preview e GitHub Pages, uma Action local de setup, verificação do artefato, varredura de segredos, suporte a base path, smoke test e runbooks de publicação e rollback.

## Decisões

- PR permanece obrigatório;
- preview é artefato, não deployment público;
- Pages publica somente `main`;
- o job de deploy é o único com `pages: write` e `id-token: write`;
- deploys são serializados;
- build aceita projeto Pages com subdiretório;
- lockfile continua pendente por indisponibilidade do registry.

## Limites desta execução

Não foi possível criar repositório remoto, configurar branch protection, executar GitHub Actions ou publicar no Pages sem um repositório GitHub definido. A instalação npm também permaneceu bloqueada por DNS.
