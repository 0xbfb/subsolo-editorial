# Resultados de testes — Prompt 02

## Executados

- `node scripts/validate-infra.mjs`;
- `node --test tests/infra/*.test.mjs`;
- validação YAML com PyYAML;
- inspeção de scripts com `sh -n`;
- busca por `latest`, binds públicos e caminhos absolutos.

## Não executados

- `docker compose config`;
- subida dos containers;
- healthchecks reais;
- persistência após restart;
- backup e restore contra volumes reais.

Motivo: Docker não está instalado no ambiente de geração.
