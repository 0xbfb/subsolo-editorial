# Changelog

## [1.0.0-pre] — 2026-07-21

### Added

- verificador formal de release com decisão GO/NO-GO;
- suíte Node portátil por descoberta recursiva;
- fluxo ponta a ponta offline de exportação, pacote, restore, mídia, orquestração e backup;
- matriz de rastreabilidade do plano v2.0;
- SBOM CycloneDX de dependências diretas e inventário SHA-256 da árvore;
- checklist de homologação do usuário;
- aceite automatizado em Chromium para desktop e mobile sobre o preview determinístico;
- release notes, known issues e documentação de pré-release.

### Fixed

- backup passa a obter a versão do produto diretamente de `package.json`, evitando manifesto com versão obsoleta;
- helper de parâmetros da rota editorial dinâmica passa a viver dentro de `getStaticPaths()`, eliminando a falha de escopo no build Astro;
- verificador de fontes aceita artefatos binários deliberadamente omitidos do pacote Git somente quando caminho, tamanho e SHA-256 coincidem com o manifesto externo.

### Validation

- 253 testes Node aprovados em 47 arquivos, incluindo regressões do manifesto de fontes;
- varredura de segredos, fronteiras arquiteturais, workflows, fixtures editoriais, conteúdo público, segurança, permissões, headers e acessibilidade estática aprovados;
- build Astro/Pagefind e toolchain pnpm permanecem destinados ao CI conectado, pois o registry npm não estava acessível no sandbox local;
- pré-release permanece **NO-GO para RC1** enquanto os demais gates externos não forem atendidos.

### Blocking issues

- `pnpm-lock.yaml` e instalação limpa ausentes;
- auditoria transitiva, Astro/Pagefind, E2E do projeto e axe não executados;
- Docker, Google Workspace, Drive, GitHub PR/Pages e aceite manual real não homologados.

## [0.9.1-dev] — 2026-07-21

### Added

- CSP self-only com hash específico para JSON-LD e scripts públicos externos;
- scanner de segredos do repositório e auditoria de permissões;
- inventário de licenças diretas e política de advisories;
- página e política inicial de privacidade;
- checks de acessibilidade estática e modos sem JavaScript;
- budgets de desempenho e teste sintético com 10.000 publicações;
- threat model, runbook de hardening e política de capacidade;
- fallback visual para retratos com mídia indisponível.

### Changed

- checkouts do GitHub Actions usam `persist-credentials: false`;
- CI, preview e deploy executam gates de hardening;
- busca deixou de usar script inline e mutação por `innerHTML`;
- hierarquia de headings foi corrigida nos destaques e diretórios;
- `verify-dist` passou a exigir CSP, referrer policy, landmarks e imagens dimensionadas.

### Security

- nenhum `unsafe-inline` ou `unsafe-eval` amplo na CSP;
- serviços locais continuam vinculados ao loopback;
- lockfile ausente virou bloqueador formal da versão 1.0.0.

### Validation

- 245 testes Node acumulados após inclusão de 20 testes de hardening;
- 114 rotas do preview verificadas sem JavaScript;
- teste de escala com 10.000 registros dentro dos budgets.

### Known limitations

- auditoria transitiva online, Astro/Pagefind, axe/Playwright e revisão real com leitor de tela não foram executados neste ambiente;
- GitHub Pages não permite configurar arbitrariamente todos os headers HTTP pelo repositório.

## [0.9.0-dev] — 2026-07-20

### Added

- logs JSON Lines com redação de segredos e corpo editorial;
- classificação explícita de falhas retryable;
- nove monitores declarativos para Uptime Kuma;
- alertas ntfy acionáveis e profile opcional;
- backup criptografado de PostgreSQL, n8n, FreshRSS e Kuma;
- manifesto interno, checksums e restore de teste;
- reconciliação Sheets/Drive/GitHub/deployments sem auto-fix;
- workflow n8n de reconciliação operacional;
- smoke externo agendado por GitHub Actions;
- baseline de métricas e runbooks de incidente e recuperação.

### Security

- backup portátil não inclui `.env` nem credenciais em texto claro;
- restore destrutivo exige confirmação e snapshot atual;
- alertas e logs redigem tokens e conteúdo editorial.

### Validation

- 225 testes Node aprovados;
- backup criptografado e restore de teste executados com fronteira Docker simulada;
- TypeScript estrito, workflows, infraestrutura, schemas e fontes aprovados.

### Known limitations

- serviços Docker reais, ntfy real, Kuma real e workflow agendado não foram executados neste ambiente;
- o registry npm permaneceu indisponível, impedindo o build Astro e ferramentas dependentes do pnpm.

## 0.8.4-dev — 2026-07-20

- pipeline seguro de mídia com Pillow;
- AVIF, WebP e JPEG responsivos;
- remoção de metadata e integridade SHA-256;
- componentes de retrato e fallback tipográfico;
- registro dos onze editores sem inventar ativos.

## [0.8.3-dev] — 2026-07-20

### Added

- domínio pós-publicação para correção factual, esclarecimento, atualização material, mudança de slug e retirada;
- CLI com dry-run e apply atômico;
- nova revisão, pacote, preservação no Drive, branch e pull request por alteração;
- schemas públicos de redirect e tombstone;
- redirect permanente 308 para mudança controlada de slug;
- página-túmulo que preserva canonical, título, motivo e impacto;
- feed de correções baseado na data real da alteração;
- busca e arquivo que mantêm retiradas sem indexar o corpo ocultado;
- workflow n8n pós-publicação com merge humano;
- pacotes golden r2 corrigida e r3 retirada;
- política pública, runbook e ADR.

### Fixed

- validador central passou a reconhecer IDs `redirect_` e `tomb_`;
- fundo de tombstone e busca usa fallback seguro para o token de papel elevado;
- contrato TypeScript passa em modo estrito com `exactOptionalPropertyTypes`.

### Validation

- 185 testes Node aprovados;
- 13 JSON Schemas validados;
- pacotes r2 e r3 com checksums e cadeia `supersedes` confirmados;
- assets de descoberta, workflows, infraestrutura e fronteiras sem regressão.

### Known limitations

- serviços reais Google, GitHub, n8n e PostgreSQL não foram acionados;
- o registry npm permaneceu indisponível, impedindo o build Astro e as ferramentas dependentes do pnpm.

## 0.8.2-dev — Captação editorial

- FreshRSS, Gmail e SearXNG como fontes de descoberta.
- Deduplicação exata e provável.
- Pautas exclusivamente em TRIAGEM.
- Quarentena de anexos e relatórios de triagem.
- Writer separado para Google Sheets.

## [0.8.1-dev] — 2026-07-20

### Added

- arquivo vivo paginado com recortes anual, mensal e diário;
- 21 registros históricos, totalizando 25 entradas públicas em oito dias;
- páginas completas de canal, tema, autor e história sobre o acervo consolidado;
- integração Pagefind com corpo indexável, metadados, filtros e ordenação por data;
- fallback de busca pelo `archive-index.json` compacto;
- RSS geral, nove feeds de canal e feed de correções;
- sitemap com páginas públicas e `robots.txt`;
- ADR e runbook de descoberta estática;
- 13 testes específicos de descoberta e regressão de rotas.

### Fixed

- rota de publicação generalizada para qualquer data;
- parser de histórico de revisões usando o helper de lista correto;
- propriedade opcional de chamada removida quando ausente, compatível com `exactOptionalPropertyTypes`.

### Security and privacy

- índice compacto rejeita corpo, seções, fontes privadas e notas internas;
- navegação, formulários e metadados auxiliares ficam fora do corpo Pagefind;
- sitemap rejeita feeds e arquivos JSON;
- referências a canal, tema e autor desconhecidos bloqueiam a geração.

### Known limitations

- o registry npm permaneceu inacessível por `EAI_AGAIN`;
- `astro build`, o binário Pagefind, Vitest, ESLint, Prettier e Playwright não foram executados pelo toolchain do projeto;
- os 127 URLs do sitemap são inventário gerado, não comprovação de build Astro neste ambiente.

## [0.1.0-dev] — 2026-07-20

### Adicionado

- bootstrap Astro e TypeScript;
- arquitetura em camadas;
- fixture editorial mínima;
- testes de domínio, configuração, fronteiras e fontes;
- manifesto SHA-256 das fontes;
- referência Jornal Concreto preservada;
- CI mínimo;
- ADRs e convenções.

## [0.1.1-dev] - 2026-07-20

### Added

- stack Docker Compose local;
- profiles `core` e `alerts`;
- healthchecks, volumes, scripts e runbook;
- validação estática e testes de infraestrutura.

### Known limitations

- runtime Docker não validado no ambiente de geração.

## [0.2.0-dev] - 2026-07-20

### Added

- bootstrap declarativo do Google Sheets com 12 abas em CSV e JSON;
- modelos para Docs, Drive, Calendar e Gmail;
- catálogos de 44 colaboradores, 9 canais, 74 quadros e 42 temas;
- máquina de estados editorial e validação de prontidão;
- fixture completa da edição de 20 de julho de 2026;
- testes e scripts de validação editorial.

### Boundaries preserved

- nenhuma API Google chamada;
- nenhum conteúdo privado preparado para publicação;
- status não é inferido por pasta do Drive.

## [0.2.1-dev] - 2026-07-20

### Added

- nove JSON Schemas públicos;
- schemas Zod estritos e coleções Astro;
- parser seguro de front matter e Markdown;
- IDs, slugs, URLs canônicas, revisões e migração de schema;
- validação referencial e sanitização.

## [0.3.0-dev] - 2026-07-20

### Added

- design tokens do Jornal Concreto;
- layout Astro compartilhado;
- componentes de masthead, navegação, breadcrumbs, estados, cards, banner diário e canais;
- fixture validada da home;
- inventário visual interno;
- testes estáticos, contraste e testes Playwright preparados;
- screenshots desktop, mobile e comparativos.

### Changed

- home bootstrap substituída pelo Jornal Concreto orientado a dados;
- cores muted e amber ajustadas para contraste AA no papel claro.

### Preserved

- referência HTML intacta;
- manchete principal sem sublinhado;
- sublinhado em chamadas secundárias e canais;
- tema claro/escuro e responsividade.

### Known limitations

- build Astro e Playwright do repositório pendentes por indisponibilidade do registry npm.

## [0.3.1-dev] - 2026-07-20

### Added

- rotas públicas para Agora, edições, publicações, canais, temas, autores, histórias, documentos, arquivo, busca, redação e 404;
- componentes de cabeçalho editorial, sumário, corpo, blocos, ficha, fontes, correções, conexões, cronologia, documentos e diretório;
- fixture pública com quatro publicações de canais diferentes;
- canonical e JSON-LD inicial;
- preview determinístico com 114 rotas;
- validação de links e HTML do preview;
- contratos de página e mapa de rotas.

### Changed

- navegação pública ativada;
- manchete, chamadas, edição diária, cards e rodapé agora possuem links reais;
- home permanece orientada a dados e sem conteúdo fixo nos componentes.

### Preserved

- manchete principal sem sublinhado;
- sublinhado em títulos secundários e canais;
- referência HTML original intacta;
- busca real adiada ao Pagefind;
- leitura básica sem dependência conceitual de backend.

### Known limitations

- Astro build, Vitest, ESLint e Playwright do repositório não executados por indisponibilidade do registry npm;
- renderização visual bloqueada pelo administrador do ambiente.

## [0.4.0-dev] - 2026-07-20

### Added

- workflows separados para CI, preview editorial e deploy no GitHub Pages;
- Action local para setup consistente de Node e pnpm;
- inspeção estrutural do artefato estático;
- varredura de segredos, links privados e marcadores editoriais;
- smoke test pós-deploy;
- suporte a base path para sites de projeto no GitHub Pages;
- template de pull request editorial ampliado;
- runbooks de publicação, proteção de branch e rollback;
- testes estáticos do pipeline.

### Security

- pull requests possuem somente `contents: read`;
- `pages: write` e `id-token: write` ficam restritos ao job de deploy;
- artefatos são verificados antes do upload;
- deploys são serializados e não cancelam publicação em andamento.

### Known limitations

- GitHub Actions e GitHub Pages não foram executados sem repositório remoto configurado;
- `pnpm-lock.yaml` permanece pendente por indisponibilidade DNS do registry npm;
- Astro build local permanece bloqueado pela mesma indisponibilidade.

## [0.5.0-dev] — 2026-07-20

### Added

- CLI `subsolo export-doc` com dry-run e apply;
- AST editorial e providers de fixture para Docs/Sheets;
- geração de Markdown, fontes, correções, mídia e proveniência pública;
- IDs derivados e serialização determinísticos;
- apply atômico e overwrite explícito;
- golden outputs e testes do exportador.

### Security

- comentários e sugestões pendentes bloqueiam exportação;
- URLs privadas, IPs locais, protocolos perigosos e parâmetros semelhantes a segredos são rejeitados;
- fontes, correções e mídia são reconstruídas por allowlist;
- proveniência pública usa hashes dos snapshots e não expõe IDs do Google.

### Boundaries preserved

- nenhuma API Google chamada;
- nenhuma alteração Git;
- nenhum pacote ZIP de edição;
- nenhuma lógica crítica adicionada ao n8n.

## [0.5.1-dev] — 2026-07-20

### Added

- providers reais e somente leitura para Google Docs e Google Sheets;
- autenticação por conta de serviço ou token efêmero;
- suporte a abas do Google Docs com seleção explícita;
- paginação controlada da aba ARTIGOS;
- retries, timeout, cache efêmero e erros normalizados;
- CLI `--provider google`;
- fixtures de respostas REST e testes de equivalência;
- gate humano `comentarios_resolvidos`.

### Security

- scopes restritos a `documents.readonly` e `spreadsheets.readonly`;
- logs estruturados redigem tokens, chaves, e-mails e IDs privados;
- credenciais permanecem fora do repositório;
- nenhum ID privado influencia os bytes públicos.

### Known limitations

- comentários do Google Docs não são lidos sem Drive Comments API e scope adicional;
- nenhuma chamada real foi executada sem credenciais fornecidas;
- instalação npm e build Astro continuam pendentes enquanto o registry estiver inacessível.

## [0.6.0-dev] - 2026-07-20

### Added

- pacote ZIP determinístico e imutável por revisão;
- `manifest.json`, `publication-run.json`, relatórios e `checksums.sha256`;
- CLI `package`, `validate-package` e `restore`;
- revisão encadeada por `supersedes`;
- validação CRC32 e SHA-256;
- escrita e restauração atômicas;
- detecção de duplicidade;
- proteção contra symlink, path traversal, originais e arquivos privados;
- schemas e fixtures r1/r2.

### Boundaries preserved

- nenhum upload ao Drive;
- nenhuma escrita no Git;
- nenhum pacote anterior sobrescrito.

## [0.6.1-dev] — 2026-07-20

### Added

- adapter de arquivo técnico para Google Drive;
- escopo mínimo `drive.file` por padrão;
- resolução e criação controlada de `90_ARQUIVO_TECNICO/edicoes/YYYY/MM`;
- upload resumível em chunks;
- idempotência por SHA-256 e `appProperties`;
- confirmação de metadata, tamanho, parent, MIME e MD5;
- download e restauração de verificação;
- recibo local atômico sem URL privada;
- comando `publish --skip-git` em dry-run e apply;
- testes de retry, retomada, duplicidade e falhas parciais.

### Security

- a raiz do Drive precisa ser explicitamente autorizada;
- sessões resumíveis, tokens, IDs de raiz e URLs privadas não aparecem em relatórios públicos;
- nenhum pacote é apagado, sobrescrito ou tornado público;
- `file_id` só é persistido após verificação integral.

### Known limitations

- nenhuma credencial ou pasta real de teste foi fornecida neste ambiente;
- o upload real precisa ser homologado com OAuth do usuário ou Shared Drive autorizado;
- instalação pnpm e Astro build continuam bloqueados pela indisponibilidade do registry npm.

## 0.7.0-dev — Prompt 12

- core funcional de orquestração com idempotência e locks;
- seis workflows n8n sanitizados;
- arquivo no Drive obrigatório antes de branch/PR;
- dead-letter, alertas, reconciliação e retry manual;
- merge humano obrigatório.

## 0.8.0-dev — Prompt 13

- ciclo de vida planejada → aberta → publicada → selada;
- revisões r1/r2 e fechamento encadeados por `supersedes`;
- correção formal após selo;
- Mapa do Dia, slots reservados e pautas privadas excluídos do contrato público;
- selo e histórico na página da edição.
