# Runbook de hardening

## Execução local

```bash
pnpm audit:security
pnpm check:headers
pnpm check:permissions
pnpm check:a11y
pnpm build
node scripts/check-a11y.mjs --site dist
pnpm check:performance
pnpm test:degraded
pnpm test:scale
pnpm scan:public-artifact
```

Sem dependências instaladas, os equivalentes Node independentes continuam executáveis diretamente.

## Resultado esperado

- auditoria de segurança sem achados não decididos;
- CSP sem `unsafe-inline` ou `unsafe-eval` amplo;
- apenas permissões de deploy estritamente necessárias;
- uma região `main`, um `h1`, skip link e controles rotulados;
- conteúdo principal disponível sem JavaScript;
- budgets dentro de `config/hardening/performance-budgets.json`;
- 10.000 registros sintéticos dentro dos limites;
- nenhum segredo no repositório ou artefato.

## Falhas

### Budget excedido

Não aumente o limite primeiro. Identifique o recurso, remova duplicação, comprima ou pagine. Qualquer aumento exige ADR e evidência de experiência real.

### Contraste ou navegação por teclado

A correção visual prevalece sobre efeitos decorativos. Não remova outline, não dependa apenas de cor e não preserve animação contra preferência de movimento reduzido.

### Dependência vulnerável

Registre advisory, pacote, alcance, severidade, responsável, decisão e prazo em `security/advisory-decisions.json`. Vulnerabilidade crítica ou alta sem mitigação bloqueia release.

### Header incompatível

Não relaxe a CSP globalmente. Isole o recurso, documente a necessidade e prefira um asset local. `unsafe-inline` é proibido.
