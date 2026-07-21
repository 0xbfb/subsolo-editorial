# Prompt 19 — revisão de segurança

## Status

**Aprovação condicional.** Os controles de código e configuração passaram, mas a versão 1.0 continua bloqueada até existir um `pnpm-lock.yaml` produzido por instalação limpa e uma auditoria transitiva arquivada.

## Controles verificados

- CSP restritiva com 12 diretivas aplicáveis por `<meta http-equiv>`;
- ausência de `unsafe-inline`, `unsafe-eval`, curingas, `data:` e `http:` na política pública;
- JSON-LD autorizado por hash SHA-256;
- scripts executáveis externos e servidos pelo próprio site;
- política `strict-origin-when-cross-origin`;
- checkout com `persist-credentials: false`;
- Actions fixadas em versões exatas;
- permissões mínimas em **4 workflows**;
- **6 serviços** locais sem privilégio elevado e vinculados ao loopback quando expostos;
- scanner aprovado em **872 arquivos**, sem achados;
- nenhuma telemetria, analytics ou cookie de rastreamento permitido.

## Dependências

- Dependências diretas declaradas: **10**.
- Licenças diretas revisadas: **10**.
- Licenças permitidas: MIT e Apache-2.0.
- Auditoria transitiva: **bloqueada pela ausência do lockfile**.

## Limites residuais da plataforma

GitHub Pages não permite configurar arbitrariamente todos os headers de resposta no repositório. Portanto, `frame-ancestors`, `Permissions-Policy` e `X-Content-Type-Options` não são declarados como ativos. A CSP por meta protege as diretivas suportadas, mas não substitui esses headers.

## Gate para a pré-release

1. instalar em ambiente limpo;
2. gerar e versionar `pnpm-lock.yaml`;
3. executar auditoria de vulnerabilidades e inventário transitivo de licenças;
4. registrar decisões para qualquer advisory aplicável;
5. repetir os scanners sobre o `dist` real.
