# Threat model — Subsolo Editorial

**Versão:** 1.0  
**Revisão:** 21 de julho de 2026  
**Escopo técnico:** `1.0.0-pre`

## 1. Objetivos de segurança

O sistema deve preservar quatro propriedades:

1. **integridade editorial:** um conteúdo público corresponde à revisão aprovada e ao pacote imutável relacionado;
2. **confidencialidade operacional:** credenciais, pautas preliminares, comentários, originais e logs privados não alcançam o portal ou o Git;
3. **disponibilidade pública:** o site permanece legível sem a máquina local, sem JavaScript e sem os serviços editoriais privados;
4. **rastreabilidade:** exportação, pacote, Drive, Git e publicação mantêm IDs e checksums verificáveis.

## 2. Ativos

| Ativo | Sensibilidade | Controle principal |
|---|---|---|
| conteúdo publicado | público, integridade alta | PR humano, schemas, checksums e pacotes imutáveis |
| pautas e Mapa do Dia | privado | Sheets/Drive privados e allowlist de exportação |
| credenciais Google/GitHub/n8n | secreto | variáveis de ambiente, scopes mínimos e secret scan |
| masters de mídia | privado/licenciado | nunca entram em `public/`; apenas derivados aprovados |
| backups | confidencial | criptografia, checksum e restore de teste |
| logs operacionais | interno | redação de segredos e exclusão de corpo editorial |
| histórico de revisão | público e imutável | cadeia `supersedes`, redirects e tombstones |

## 3. Fronteiras de confiança

```text
Leitor
  │ HTML/CSS/JS estático
  ▼
GitHub Pages ── artefato público sem credenciais
  ▲
  │ merge humano
GitHub Actions / pull request
  ▲
  │ pacote já verificado no Drive
CLI + n8n local
  ▲
  │ APIs somente leitura/escrita mínima
Google Workspace / Drive
```

A máquina local não é origem de tráfego do leitor. FreshRSS, SearXNG, n8n, PostgreSQL, Uptime Kuma e ntfy não devem ser expostos publicamente.

## 4. Ameaças e controles

### 4.1 Injeção de conteúdo ativo

**Cenários:** HTML arbitrário em Markdown, URL `javascript:`, script em metadado, snippet de busca injetado.

**Controles:** AST intermediária; protocolos permitidos; HTML executável rejeitado; scripts externos próprios; busca usa `textContent` e criação de DOM; CSP sem `unsafe-inline`; JSON-LD recebe hash SHA-256 específico.

### 4.2 Exfiltração de dados privados

**Cenários:** campo desconhecido propagado, link privado do Drive, token em log, backup não criptografado.

**Controles:** contratos `strict`; allowlist por artefato; scanners de repositório e artefato; logs redigidos; pacote rejeita `.env`, originais e symlinks; backup portátil criptografado.

### 4.3 Comprometimento da cadeia de build

**Cenários:** Action flutuante, dependência não fixada, credencial persistida no checkout, pacote transitivo vulnerável.

**Controles:** versões diretas exatas; Actions em semver exato; `persist-credentials: false`; permissões globais `contents: read`; deploy isolado com `pages: write` e `id-token: write`.

**Risco residual bloqueador:** não há `pnpm-lock.yaml`; a árvore transitiva e advisories não puderam ser validados online. A versão 1.0.0 não pode ser liberada nesse estado.

### 4.4 Publicação ou alteração não autorizada

**Cenários:** merge automático, Git antes do arquivo técnico, correção silenciosa, overwrite de pacote.

**Controles:** Drive confirmado antes do Git; um PR por revisão; merge humano; pacote imutável; revisão anterior preservada; correções e retiradas públicas.

### 4.5 Exposição dos serviços locais

**Cenários:** porta vinculada em `0.0.0.0`, Docker socket, rede host, editor n8n público.

**Controles:** bindings `127.0.0.1`; rede backend interna; `no-new-privileges`; workspace montado como read-only; ausência de `privileged`, `host network` e Docker socket.

### 4.6 Negação de serviço e crescimento

**Cenários:** acervo excessivo, índice grande, imagem pesada, quota de API, loops de retry.

**Controles:** budgets por rota e artefato; teste com 10.000 publicações; retries limitados; circuitos humanos para quota; gatilhos de capacidade; paginação; RSS limitado.

### 4.7 Abuso de privacidade do leitor

**Cenários:** analytics, fingerprint, pixel externo, busca remota, cookie de perfil.

**Controles:** nenhuma ferramenta de analytics; nenhuma publicidade; busca local no navegador; preferência de tema em `localStorage`; assets essenciais no mesmo domínio.

## 5. CSP e headers

A CSP entregue por meta tag permite apenas o próprio domínio. `wasm-unsafe-eval` é restrito ao carregamento do índice Pagefind. Scripts executáveis inline são proibidos; o único bloco inline é JSON-LD com hash individual.

GitHub Pages não oferece configuração arbitrária de headers pelo repositório. Portanto, o projeto **não afirma** aplicação de `frame-ancestors`, `Permissions-Policy` ou `X-Content-Type-Options`. Esses controles devem ser revisitados caso o domínio definitivo use uma camada que permita headers de resposta.

## 6. Matriz de risco residual

| Risco | Severidade | Estado | Decisão |
|---|---:|---|---|
| lockfile ausente | alta | aberto | bloqueia 1.0.0 |
| auditoria transitiva offline | alta | aberto | bloquear release até auditoria online |
| revisão real com leitor de tela não executada | média | aberto | gate manual de release |
| headers não suportados pelo Pages | média | aceito temporariamente | avaliar host/CDN definitivo |
| contato de segurança ainda provisório | média | aberto | bloquear publicação de `security.txt` |
| serviços Docker não executados neste ambiente | média | aberto | homologar em host local real |

## 7. Processo de revisão

Qualquer novo script público, origem externa, scope de API, permissão de workflow, serviço local ou campo público exige atualização deste documento, teste de regressão e decisão explícita.
