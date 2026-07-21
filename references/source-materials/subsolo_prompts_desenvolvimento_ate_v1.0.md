# SUBSOLO — Prompts de Desenvolvimento até a Versão 1.0

**Versão do documento:** 1.0  
**Data:** 20 de julho de 2026  
**Quantidade de prompts:** 22  
**Produto:** Subsolo Editorial  
**Slogan:** O ruído passa. O que importa fica.  
**Stack pública:** Astro, TypeScript, Markdown, JSON, Pagefind, GitHub Actions e GitHub Pages  
**Stack editorial:** Google Docs, Google Sheets, Google Drive, Gmail, Google Calendar e Google Contacts  
**Stack local:** Docker Compose, PostgreSQL, n8n Community, FreshRSS, SearXNG, Uptime Kuma e ntfy opcional  
**Método obrigatório:** TDD, fixtures, dry-run, apply, revisão de diff e desenvolvimento incremental

---

# 1. Finalidade

Este documento contém todos os prompts necessários para desenvolver o Subsolo desde a fundação do repositório até a versão estável `1.0.0`.

Os prompts foram derivados dos seguintes artefatos:

1. `subsolo_plano_tecnico_desenvolvimento_v2.0.md`;
2. `subsolo_stack_custo_zero_v1.md`;
3. `subsolo_diretrizes_ux_ui_v1.0(1).md`;
4. `subsolo_base_editorial_html_v1.0(1).zip`;
5. `ecossistema_editorial_bdd_canais_e_quadros_v1.1(1).md`;
6. `bom_dia_distopia_prompt_mestre_v2.md`;
7. `subsolo_manual_mesa_de_abertura_v1.0(1).md`;
8. `redacao_011_dossies_editoriais_v1.0(1).zip`;
9. `subsolo_guia_visual_retratos_editores_v1.0(1).md`;
10. requisitos explicitamente definidos pelo usuário nesta conversa;
11. código, testes, documentação e comportamento comprovado acumulados durante a execução.

O desenvolvimento deve ocorrer sobre uma única estrutura real de projeto. Cada prompt continua exatamente do estado deixado pelo anterior.

---

# 2. Ordem de prioridade das fontes de verdade

Ao executar qualquer prompt, use esta ordem:

1. requisitos explícitos mais recentes do usuário;
2. plano técnico reavaliado v2.0;
3. stack local de custo zero;
4. diretrizes de UX/UI;
5. base HTML limpa do tema Jornal Concreto;
6. documentos editoriais, corpo editorial, Mesa de Abertura e guia visual;
7. comportamento comprovado pelo código e testes existentes;
8. decisões documentadas em ADRs;
9. hipóteses conservadoras, apenas quando não houver evidência suficiente.

Em caso de conflito:

- não escolha silenciosamente;
- registre o conflito;
- preserve o comportamento comprovado;
- apresente a decisão técnica mais conservadora;
- não invente requisito para fechar lacuna.

---

# 3. Regras globais de execução

Estas regras fazem parte de todos os prompts.

## 3.1. Incrementalidade

- trabalhar sempre sobre a mesma pasta real do projeto;
- não recriar o projeto do zero;
- não substituir o projeto por um template novo;
- não descartar alterações anteriores;
- não copiar apenas arquivos selecionados para uma estrutura paralela;
- revisar o diff antes de concluir;
- preservar compatibilidade com entregas anteriores, salvo mudança explicitamente prevista;
- atualizar a versão do projeto de acordo com o prompt.

## 3.2. Fluxo obrigatório de desenvolvimento

Para cada requisito:

1. escrever ou atualizar o teste;
2. confirmar que o teste falha pelo motivo esperado;
3. criar fixture ou input mockado;
4. implementar o comportamento em modo sem efeitos;
5. validar o dry-run;
6. implementar o apply quando houver efeito externo;
7. executar testes diretamente relacionados;
8. executar verificações globais compatíveis;
9. revisar o diff;
10. atualizar documentação e rastreabilidade.

## 3.3. Separação arquitetural

Preservar:

```text
domain
application
infrastructure
presentation
```

Regras de domínio não podem depender diretamente de:

- Astro;
- Google;
- GitHub;
- n8n;
- HTML;
- Pagefind;
- Docker;
- ambiente operacional.

Integrações devem ser implementadas por interfaces, adapters ou providers substituíveis.

## 3.4. Programação funcional

Preferir:

- funções puras;
- dados imutáveis;
- composição;
- resultados explícitos;
- discriminated unions;
- ausência de estado global mutável;
- efeitos isolados nas bordas;
- parsers e validadores determinísticos.

Evitar abstrações desnecessárias, classes sem estado e padrões cerimoniais sem benefício demonstrado.

## 3.5. Dry-run e apply

Toda operação que altere:

- Google Drive;
- Google Sheets;
- Google Docs;
- Git;
- GitHub;
- filesystem final;
- PostgreSQL;
- estado do n8n;
- publicação;

deve possuir dry-run ou equivalente verificável antes do apply.

O dry-run deve explicar:

- entrada;
- validações;
- arquivos;
- caminhos;
- mudanças;
- IDs;
- branch;
- commit;
- pull request;
- upload;
- alertas;
- erros.

## 3.6. Segurança

Nunca:

- versionar segredos;
- imprimir tokens;
- incluir credenciais em fixtures;
- enviar notas privadas ao pacote público;
- expor serviços administrativos;
- aceitar HTML arbitrário sem sanitização;
- confiar em MIME apenas pela extensão;
- permitir path traversal;
- executar conteúdo editorial como código.

## 3.7. Testes e validação

Executar, conforme aplicável:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:contract
pnpm test:integration
pnpm test:e2e
pnpm build
pnpm pagefind
pnpm check:html
pnpm check:links
pnpm check:a11y
docker compose config
docker compose up -d
docker compose ps
```

Não declarar sucesso para comandos não executados.

## 3.8. Artefatos por etapa

Ao final de cada prompt executado, produzir:

1. projeto incremental atualizado;
2. ZIP cumulativo de desenvolvimento:
   `subsolo-<versao>.zip`;
3. relatório da etapa:
   `docs/development/prompt-XX.md`;
4. resultado dos testes:
   `reports/prompt-XX/test-results.md`;
5. lista de arquivos alterados;
6. riscos, pendências e decisões;
7. instruções de validação manual;
8. atualização de `README.md`, `AGENTS.md`, changelog e ADRs quando necessário.

O ZIP não deve conter:

- `.git`;
- `node_modules`;
- caches;
- credenciais;
- `.env` real;
- artefatos temporários;
- logs sensíveis.

## 3.9. Relato de conclusão

Durante a execução futura, responder no formato:

```text
X/22 — Nome da etapa
Versão: ...
Resultado: ...
Testes: ...
Artefato: ...
Pendências: ...
```

Se o usuário responder apenas com um número, interpretar como o prompt de desenvolvimento correspondente.

---

# 4. Estratégia de versões

| Prompt | Versão resultante | Marco |
|---:|---|---|
| 1 | `0.1.0-dev` | fundação |
| 2 | `0.1.1-dev` | infraestrutura local |
| 3 | `0.2.0-dev` | ambiente editorial |
| 4 | `0.2.1-dev` | domínio e schemas |
| 5 | `0.3.0-dev` | migração visual Astro |
| 6 | `0.3.1-dev` | páginas e componentes |
| 7 | `0.4.0-dev` | publicação manual |
| 8 | `0.5.0-dev` | exportador mockado |
| 9 | `0.5.1-dev` | integrações Google |
| 10 | `0.6.0-dev` | pacote e checksums |
| 11 | `0.6.1-dev` | Google Drive |
| 12 | `0.7.0-dev` | n8n de publicação |
| 13 | `0.8.0-dev` | edição diária |
| 14 | `0.8.1-dev` | arquivo vivo e busca |
| 15 | `0.8.2-dev` | captação editorial |
| 16 | `0.8.3-dev` | correções e retiradas |
| 17 | `0.8.4-dev` | mídia |
| 18 | `0.9.0-dev` | observabilidade e backup |
| 19 | `0.9.1-dev` | segurança, acessibilidade e desempenho |
| 20 | `1.0.0-pre` | revisão pré-release |
| 21 | `1.0.0-rc1` | release candidate |
| 22 | `1.0.0` | release estável |

---

# 5. Visão resumida da sequência

1. fundação, auditoria de fontes e repositório;
2. Docker Compose e serviços locais;
3. estrutura editorial no Google e mocks equivalentes;
4. domínio, schemas, estados e validação;
5. migração do Jornal Concreto para Astro;
6. páginas editoriais, arquivo inicial e componentes;
7. GitHub Actions, PR, preview e Pages;
8. exportador determinístico com fixtures;
9. integrações reais com Docs e Sheets;
10. pacote diário, revisão e checksums;
11. upload e preservação no Drive;
12. orquestração de publicação no n8n;
13. ciclo de vida da edição diária;
14. arquivo vivo, Pagefind, feeds e sitemap;
15. FreshRSS, Gmail e SearXNG;
16. correções, atualizações, redirects e tombstones;
17. pipeline de mídia;
18. observabilidade, backups e reconciliação;
19. hardening técnico e editorial;
20. revisão pré-release;
21. release candidate;
22. lançamento 1.0.0.

---

# PROMPT 01 — Fundação, auditoria das fontes e bootstrap do repositório

    **Versão resultante:** `0.1.0-dev`

    ## Objetivo

    Criar a estrutura real e reproduzível do projeto, registrar as decisões fundamentais e converter os documentos existentes em contratos verificáveis de desenvolvimento, sem ainda implementar integrações externas.

    ## Contexto necessário

    - Existe uma base HTML limpa do tema Jornal Concreto que deve ser preservada como referência visual.
- O plano técnico v2.0 define Astro, TypeScript, Markdown, JSON, Pagefind, GitHub Pages e uma camada editorial privada baseada em Google.
- O projeto ainda precisa de estrutura única, scripts, convenções, rastreabilidade e CI mínimo.

    ## Dependências anteriores

    - Nenhum prompt anterior.
- Todos os arquivos-fonte listados na seção de fontes de verdade devem estar disponíveis para consulta.

    ## Pré-condições

    - Inspecionar integralmente o ZIP da base HTML.
- Inspecionar o plano técnico v2.0 e a stack de custo zero.
- Registrar arquivos ausentes ou inconsistentes antes de criar código.

    ## Escopo obrigatório

    - Criar repositório Astro + TypeScript com `pnpm` e Node LTS.
- Criar estrutura de diretórios definida no plano técnico.
- Criar `README.md`, `AGENTS.md`, changelog, ADR index e convenções.
- Criar comandos mínimos: lint, typecheck, test, build e format check.
- Criar CI local mínimo e workflow GitHub de validação sem deploy.
- Adicionar fixtures editoriais mínimas, sem conteúdo real.
- Documentar matriz de fontes de verdade e handoff editorial.
- Definir política de versões, branches, commits, IDs, slugs e timezone.
- Copiar a base HTML apenas para uma área de referência não executável, preservando-a sem alterações.

    ## Fora de escopo

    - Não migrar o tema para Astro ainda.
- Não subir Docker.
- Não integrar Google, GitHub API, Drive ou n8n.
- Não publicar no Pages.
- Não implementar o modelo editorial completo.

    ## Arquivos, componentes e documentos a inspecionar

    - `subsolo_plano_tecnico_desenvolvimento_v2.0.md`
- `subsolo_stack_custo_zero_v1.md`
- `subsolo_diretrizes_ux_ui_v1.0(1).md`
- `subsolo_base_editorial_html_v1.0(1).zip`
- documentos editoriais e da redação

    ## Implementação detalhada

    - Inicializar o projeto sem usar um starter visual que substitua o Jornal Concreto.
- Fixar versões de runtime e package manager.
- Criar separação `domain/application/infrastructure/presentation`.
- Criar regras de importação para impedir dependência invertida.
- Criar teste de sanidade que confirme build mínimo e carregamento de fixture.
- Criar `.env.example` sem valores reais.
- Criar templates de relatório para prompts futuros.
- Criar ADRs iniciais para Astro, pnpm, conteúdo estático, GitHub Pages, Markdown + JSON e fonte de verdade por fase.

    ## Comportamentos que devem ser preservados

    - Não alterar os HTMLs da referência.
- Não introduzir biblioteca visual que desfigure o tema.
- Manter custo incremental inicial igual a zero.

    ## Tratamento de erros obrigatório

    - Falhar com mensagem clara quando Node ou pnpm estiverem fora da versão suportada.
- Falhar quando importações violarem camadas.
- Falhar se uma fixture mínima não puder ser carregada.

    ## Testes obrigatórios

    - Teste de build vazio.
- Teste de resolução de aliases.
- Teste de fronteira entre camadas.
- Teste de carregamento de configuração.
- Teste de versão e scripts disponíveis.

    ## Comandos mínimos de validação

    - `pnpm install --frozen-lockfile` após gerar lockfile
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

    ## Critérios de aceite

    - Projeto instala e compila por comandos documentados.
- CI mínimo fica verde.
- Arquitetura e fontes de verdade estão documentadas.
- Base HTML está preservada em referência separada.
- Nenhum segredo ou dependência externa obrigatória foi introduzido.

    ## Documentação a atualizar

    - README de instalação e desenvolvimento.
- AGENTS com regras para agentes e execução incremental.
- ADRs iniciais.
- Relatório de auditoria dos artefatos recebidos.

    ## Artefatos esperados

    - `subsolo-0.1.0-dev.zip`
- `docs/development/prompt-01.md`
- `reports/prompt-01/source-audit.md`

    ## Proibições específicas

    - Não começar a implementação visual.
- Não apagar decisões do plano por conveniência.
- Não adicionar dependência sem justificar em ADR ou relatório.

    ## Revisão obrigatória antes de concluir

    - Revisar todo o tree do projeto.
- Comparar estrutura criada com o plano v2.0.
- Confirmar que nenhum arquivo temporário entrou no ZIP.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `1/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 02 — Infraestrutura local portátil com Docker Compose

    **Versão resultante:** `0.1.1-dev`

    ## Objetivo

    Implementar a infraestrutura local inicial com PostgreSQL, n8n, FreshRSS, SearXNG e Uptime Kuma, de forma portátil, segura, persistente e desligável sem afetar o portal público.

    ## Contexto necessário

    - A máquina local executará automações e serviços editoriais, mas não hospedará o site público.
- Serviços administrativos não podem ser expostos diretamente à internet.
- ntfy é opcional e deve ser ativado por profile.

    ## Dependências anteriores

    - Prompt 1 concluído.
- Docker Desktop ou Docker Engine disponível para validação.

    ## Pré-condições

    - Confirmar portas locais livres ou configuráveis.
- Definir política de volumes e backup.
- Não usar caminhos absolutos dependentes da máquina do usuário.

    ## Escopo obrigatório

    - Criar `infra/compose.yml` e arquivos de configuração.
- Subir PostgreSQL, n8n, FreshRSS, SearXNG e Uptime Kuma.
- Adicionar healthchecks e dependências de inicialização.
- Criar profiles para ntfy e serviços futuros.
- Criar `.env.example` completo e seguro.
- Criar scripts de start, stop, logs, healthcheck, backup e restore em dry-run.
- Fixar versões de imagens.
- Documentar portas, volumes, redes e requisitos.

    ## Fora de escopo

    - Não configurar credenciais Google ou GitHub.
- Não criar workflows editoriais n8n.
- Não instalar NocoDB, Matomo ou Paperless por padrão.
- Não expor serviços via túnel ou reverse proxy público.

    ## Arquivos, componentes e documentos a inspecionar

    - `infra/` existente
- documentação da stack de custo zero
- política de segurança e backups do plano v2.0

    ## Implementação detalhada

    - Usar rede interna dedicada.
- Publicar apenas portas necessárias em localhost.
- Configurar PostgreSQL com usuário e banco próprios para n8n.
- Persistir dados em volumes nomeados.
- Criar healthchecks que não dependam de credenciais exibidas.
- Criar script de backup que produza artefato local sem enviar ao Drive.
- Criar teste estático para validar compose e ausência de tags `latest`.

    ## Comportamentos que devem ser preservados

    - O portal deve continuar independente dos containers.
- O comando de build do site não pode exigir a stack local.

    ## Tratamento de erros obrigatório

    - Detectar variável obrigatória ausente.
- Detectar volume não gravável.
- Detectar container sem healthcheck.
- Produzir instrução acionável quando uma porta estiver ocupada.

    ## Testes obrigatórios

    - `docker compose config`.
- Inicialização limpa.
- Reinício com persistência.
- Parada e nova subida.
- Healthchecks.
- Backup e restauração em ambiente de teste.

    ## Comandos mínimos de validação

    - `docker compose --profile core config`
- `docker compose --profile core up -d`
- `docker compose ps`
- `pnpm test:infra`

    ## Critérios de aceite

    - Todos os serviços core ficam saudáveis.
- Dados persistem após restart.
- Nenhum serviço administrativo está exposto além de localhost.
- Backup e restore básicos são demonstrados.
- Site continua compilando com containers parados.

    ## Documentação a atualizar

    - Runbook local.
- Mapa de portas e volumes.
- Procedimento de atualização de imagens.

    ## Artefatos esperados

    - `subsolo-0.1.1-dev.zip`
- `reports/prompt-02/compose-validation.md`

    ## Proibições específicas

    - Não usar `latest`.
- Não incluir senhas reais.
- Não abrir portas no roteador.

    ## Revisão obrigatória antes de concluir

    - Inspecionar `docker compose config` resolvido.
- Revisar permissões, redes e volumes.
- Confirmar que profiles futuros ficam desativados.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `2/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 03 — Ambiente editorial, planilhas, modelos e estados operacionais

    **Versão resultante:** `0.2.0-dev`

    ## Objetivo

    Definir e materializar o ambiente editorial inicial do Subsolo por meio de templates reproduzíveis para Google Sheets, Google Docs, Drive, Calendar, Gmail e dados da redação.

    ## Contexto necessário

    - A pauta pertence primeiro à redação e só depois recebe canal, quadro, equipe e horário.
- O Sheets será o banco operacional inicial; Docs será o ambiente de escrita e revisão.
- A Mesa de Abertura produz o Mapa do Dia e os slots do dia.

    ## Dependências anteriores

    - Prompts 1 e 2 concluídos.

    ## Pré-condições

    - Inspecionar o manual da Mesa de Abertura.
- Inspecionar canais, quadros, autores e dossiês.
- Definir valores controlados antes de criar templates.

    ## Escopo obrigatório

    - Criar schemas tabulares e arquivos CSV/JSON de bootstrap para todas as abas.
- Criar templates de Google Docs em Markdown de referência.
- Criar estrutura de pastas do Drive como manifesto declarativo.
- Criar definições de calendários e marcadores Gmail.
- Criar máquina de estados editorial e transições válidas.
- Criar fixtures completas de pauta, artigo, edição, autor, canal, quadro, tema, fonte e correção.
- Criar catálogo inicial de canais e autores a partir dos documentos fornecidos.

    ## Fora de escopo

    - Não chamar APIs Google.
- Não criar planilha real automaticamente.
- Não implementar exportação.
- Não permitir que status seja inferido por pasta.

    ## Arquivos, componentes e documentos a inspecionar

    - `subsolo_manual_mesa_de_abertura_v1.0(1).md`
- `ecossistema_editorial_bdd_canais_e_quadros_v1.1(1).md`
- `redacao_011_dossies_editoriais_v1.0(1).zip`
- `bom_dia_distopia_prompt_mestre_v2.md`

    ## Implementação detalhada

    - Definir abas PAUTAS, ARTIGOS, EDICOES, AUTORES, CANAIS, QUADROS, TEMAS, FONTES, PUBLICACOES, CORRECOES, AUTOMACOES e CONFIGURACOES.
- Definir listas controladas e identificadores estáveis.
- Representar prioridade A–E, nível de cobertura 0–5, slots e guardião editorial.
- Separar campos privados de campos potencialmente públicos.
- Criar testes das transições de status.
- Criar fixtures da edição fictícia do primeiro marco.

    ## Comportamentos que devem ser preservados

    - Não transformar canais em tags genéricas.
- Não expor pautas reservadas no modelo público.
- Preservar a diferença entre status editorial e estado público.

    ## Tratamento de erros obrigatório

    - Rejeitar transição inválida.
- Rejeitar autor, canal ou quadro desconhecido.
- Rejeitar artigo pronto sem revisões concluídas.

    ## Testes obrigatórios

    - Transições permitidas e proibidas.
- Validação das listas controladas.
- Integridade referencial dos catálogos.
- Serialização dos templates.

    ## Comandos mínimos de validação

    - `pnpm test:domain -- editorial-state`
- `pnpm validate:fixtures`

    ## Critérios de aceite

    - Templates podem ser usados manualmente sem integração.
- Catálogos possuem IDs estáveis.
- A edição fictícia é representável sem campos improvisados.
- Estados públicos e privados estão separados.

    ## Documentação a atualizar

    - Manual de configuração do ambiente Google.
- Dicionário de dados das abas.
- Guia de status e transições.

    ## Artefatos esperados

    - `subsolo-0.2.0-dev.zip`
- `templates/google/`
- `fixtures/editorial/`

    ## Proibições específicas

    - Não duplicar o corpo da matéria na planilha.
- Não armazenar fontes confidenciais em fixtures públicas.

    ## Revisão obrigatória antes de concluir

    - Validar os templates contra o manual editorial.
- Revisar se todos os canais e perfis necessários foram cadastrados.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `3/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 04 — Modelo de domínio, schemas e validação pública

    **Versão resultante:** `0.2.1-dev`

    ## Objetivo

    Implementar o contrato público do conteúdo: edição, publicação, fonte, correção, mídia, história, autor, canal e tema, com parsers seguros, versionamento de schema e validação em camadas.

    ## Contexto necessário

    - O formato público usa `publication.md` com front matter e JSONs auxiliares.
- Google Docs e Sheets são ambiente privado; GitHub é fonte da versão pública.
- O build deve falhar fechado diante de conteúdo inválido.

    ## Dependências anteriores

    - Prompt 3 concluído com fixtures editoriais.

    ## Pré-condições

    - Congelar a primeira versão dos enums públicos.
- Separar campos internos e públicos.
- Definir política de compatibilidade de schema.

    ## Escopo obrigatório

    - Criar tipos TypeScript do domínio.
- Criar JSON Schemas versionados.
- Criar parsers de YAML front matter e Markdown permitido.
- Criar Zod schemas para Astro.
- Criar validação referencial.
- Criar sanitização estrutural e allowlist de blocos editoriais.
- Criar geradores de ID, slug, canonical URL e revisão.
- Criar migrador base de schema.

    ## Fora de escopo

    - Não integrar Astro às páginas ainda.
- Não exportar Docs.
- Não empacotar ZIP.

    ## Arquivos, componentes e documentos a inspecionar

    - fixtures do Prompt 3
- modelo público do plano v2.0
- blocos editoriais definidos na UX/UI e BDD

    ## Implementação detalhada

    - Modelar unions para type, status, correction type e media type.
- Rejeitar HTML, scripts, iframes e protocolos perigosos.
- Permitir blocos como fact, declaration, unknown, why-it-matters, next-step, document e correction.
- Validar IDs, referências, datas, timezone, idioma e slugs.
- Gerar mensagens de erro com caminho, código e ação recomendada.
- Manter compatibilidade entre JSON Schema e Zod por testes de contrato.

    ## Comportamentos que devem ser preservados

    - O corpo permanece Markdown legível.
- O formato não depende de Astro.
- URLs publicadas não dependem do título futuro.

    ## Tratamento de erros obrigatório

    - Versão maior desconhecida deve ser rejeitada.
- Referência inexistente deve bloquear build.
- Slug duplicado deve gerar erro determinístico.

    ## Testes obrigatórios

    - Exemplos válidos e inválidos para todos os schemas.
- Property tests para slug e IDs.
- Sanitização.
- Compatibilidade JSON Schema/Zod.
- Datas e timezone.

    ## Comandos mínimos de validação

    - `pnpm test:contract`
- `pnpm validate:fixtures`
- `pnpm typecheck`

    ## Critérios de aceite

    - Todas as entidades têm schema e exemplos.
- Erros são legíveis.
- Conteúdo privado e inseguro é rejeitado.
- Migrador reconhece a versão inicial.

    ## Documentação a atualizar

    - Referência de schema.
- Política de versionamento.
- Catálogo de erros.

    ## Artefatos esperados

    - `subsolo-0.2.1-dev.zip`
- `schemas/`
- `reports/prompt-04/schema-coverage.md`

    ## Proibições específicas

    - Não usar `any` para contornar schema.
- Não aceitar HTML arbitrário.
- Não criar números mágicos sem constante documentada.

    ## Revisão obrigatória antes de concluir

    - Comparar os exemplos com todas as páginas previstas.
- Verificar se nenhum campo privado entrou no contrato público.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `4/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 05 — Migração visual do Jornal Concreto para Astro

    **Versão resultante:** `0.3.0-dev`

    ## Objetivo

    Transformar a base HTML limpa do Jornal Concreto em layout, tokens e componentes Astro reutilizáveis, preservando identidade, responsividade e comportamento sem codificar conteúdo editorial no template.

    ## Contexto necessário

    - O tema escolhido é o 02 — Jornal Concreto.
- O underscore foi removido apenas da manchete principal; sublinhados de cards e diretórios permanecem.
- Referências a protótipo e conteúdo fictício não devem voltar.

    ## Dependências anteriores

    - Prompts 1 a 4 concluídos.

    ## Pré-condições

    - Extrair a base HTML para comparação.
- Registrar screenshots de referência desktop e mobile.
- Inventariar seletores, componentes e scripts existentes.

    ## Escopo obrigatório

    - Criar design tokens.
- Criar layout global, cabeçalho, navegação e rodapé.
- Migrar tema claro/escuro.
- Migrar tipografia, grid, divisores, cards e estados.
- Criar componentes Astro sem dados hardcoded.
- Criar testes visuais básicos e de responsividade.
- Preservar CSS essencial e eliminar duplicação com justificativa.

    ## Fora de escopo

    - Não implementar todas as rotas.
- Não criar busca real.
- Não integrar Pagefind.
- Não alterar a direção artística.

    ## Arquivos, componentes e documentos a inspecionar

    - `subsolo_base_editorial_html_v1.0(1).zip`
- `subsolo_diretrizes_ux_ui_v1.0(1).md`
- screenshots de referência

    ## Implementação detalhada

    - Mapear HTML para componentes sem quebrar semântica.
- Usar fontes locais ou system stack sem dependência remota obrigatória.
- Implementar preferência de tema sem flash perceptível.
- Respeitar `prefers-reduced-motion`.
- Criar Storybook apenas se houver justificativa; não é obrigatório.
- Criar página de demonstração interna fora da navegação pública.

    ## Comportamentos que devem ser preservados

    - Manchete principal sem underscore.
- Sublinhado onde foi aprovado.
- Paleta, ritmo editorial e composição do Jornal Concreto.

    ## Tratamento de erros obrigatório

    - Fallback quando JavaScript estiver desativado.
- Fallback de fonte.
- Sem layout shift por tema.

    ## Testes obrigatórios

    - Snapshot estrutural dos componentes principais.
- Playwright desktop e mobile.
- Teclado e foco.
- Contraste automatizado inicial.

    ## Comandos mínimos de validação

    - `pnpm test`
- `pnpm test:e2e -- theme`
- `pnpm build`
- `pnpm check:a11y`

    ## Critérios de aceite

    - O resultado é visualmente reconhecível como a base aprovada.
- Não há conteúdo fictício codificado no layout.
- Tema funciona em desktop e mobile.
- Página é legível sem JavaScript.

    ## Documentação a atualizar

    - Mapa de componentes.
- Tokens e decisões de migração.

    ## Artefatos esperados

    - `subsolo-0.3.0-dev.zip`
- screenshots de regressão

    ## Proibições específicas

    - Não importar framework CSS completo.
- Não reintroduzir textos de protótipo.
- Não mudar visual por preferência pessoal.

    ## Revisão obrigatória antes de concluir

    - Comparação lado a lado com a base.
- Revisão de overflow horizontal.
- Revisão do underscore em todos os contextos.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `5/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 06 — Páginas editoriais e componentes de conteúdo

    **Versão resultante:** `0.3.1-dev`

    ## Objetivo

    Implementar as rotas públicas essenciais e alimentar todas as páginas com fixtures validadas, formando o primeiro portal navegável orientado a dados.

    ## Contexto necessário

    - A UX prevê home, Agora, edição, matéria, canal, tema, história, arquivo, busca, autor, documento e A Redação.
- A edição fictícia deve conter pelo menos três publicações de canais diferentes.

    ## Dependências anteriores

    - Prompt 5 concluído.
- Schemas do Prompt 4 estáveis.

    ## Pré-condições

    - Definir URLs canônicas.
- Selecionar fixtures representativas.
- Definir estados e blocos que serão demonstrados.

    ## Escopo obrigatório

    - Implementar homepage.
- Implementar Agora.
- Implementar edição diária.
- Implementar matéria longa.
- Implementar boletim BDD.
- Implementar canal e diretório de canais.
- Implementar tema.
- Implementar autor.
- Implementar história acompanhada.
- Implementar documento comentado.
- Implementar arquivo inicial.
- Implementar A Redação.
- Criar componentes de fontes, correções, cronologia, ficha editorial, conexões e sumário.

    ## Fora de escopo

    - Busca real fica para Prompt 14.
- Filtros avançados ficam para Prompt 14.
- Dados Google não entram.

    ## Arquivos, componentes e documentos a inspecionar

    - páginas HTML da base
- diretrizes de UX/UI
- documentos editoriais
- fixtures e schemas

    ## Implementação detalhada

    - Gerar rotas estaticamente.
- Aplicar canonical URLs.
- Usar JSON-LD inicial.
- Mostrar natureza, estado, datas, autoria, fontes e correções.
- Construir fallback textual de cronologias e diagramas.
- Não obrigar imagem em cards.
- Representar canais como produtos editoriais, não tags.

    ## Comportamentos que devem ser preservados

    - Hierarquia assimétrica da home.
- Página de matéria mais limpa que a home.
- BDD como edição privilegiada.

    ## Tratamento de erros obrigatório

    - Página 404 editorial.
- Falha de referência deve ocorrer no build, não no navegador.
- Conteúdo sem imagem deve renderizar corretamente.

    ## Testes obrigatórios

    - Rotas geradas.
- Sem links internos quebrados.
- HTML semântico.
- Dados ausentes opcionais.
- Mobile.
- JS desativado.

    ## Comandos mínimos de validação

    - `pnpm test`
- `pnpm build`
- `pnpm check:html`
- `pnpm check:links`
- `pnpm test:e2e`

    ## Critérios de aceite

    - Todas as páginas essenciais são navegáveis.
- Conteúdo vem somente de fixtures validadas.
- Não há HTML manual por matéria.
- Metadados editoriais estão visíveis.

    ## Documentação a atualizar

    - Mapa de rotas.
- Contrato de cada página.

    ## Artefatos esperados

    - `subsolo-0.3.1-dev.zip`
- `reports/prompt-06/route-inventory.md`

    ## Proibições específicas

    - Não simular busca como se estivesse pronta.
- Não esconder erros com conteúdo padrão falso.

    ## Revisão obrigatória antes de concluir

    - Percorrer todas as rotas em desktop e mobile.
- Comparar o conteúdo exibido com os dados de origem.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `6/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 07 — Publicação manual controlada com GitHub Actions e Pages

    **Versão resultante:** `0.4.0-dev`

    ## Objetivo

    Provar o fluxo público completo por branch, pull request, validação, preview, merge, build e GitHub Pages, ainda sem automação Google ou n8n.

    ## Contexto necessário

    - O fluxo normal não permite commit editorial direto em `main`.
- O site deve ser reproduzível no GitHub Actions.
- Preview não pode expor dados privados.

    ## Dependências anteriores

    - Portal estático completo do Prompt 6.

    ## Pré-condições

    - Repositório GitHub definido.
- GitHub Pages habilitável por Actions.
- Branch protection documentada.

    ## Escopo obrigatório

    - Criar workflows CI, preview e deploy.
- Criar template de PR editorial.
- Criar checks de conteúdo, HTML, links, acessibilidade e build.
- Criar artefato de preview.
- Configurar Pages.
- Criar smoke tests pós-deploy.
- Criar estratégia de rollback por commit.
- Criar concurrency de deploy.

    ## Fora de escopo

    - Não automatizar criação de branch.
- Não sincronizar Sheets.
- Não fazer upload ao Drive.

    ## Arquivos, componentes e documentos a inspecionar

    - workflows existentes
- permissões do GitHub
- scripts de validação

    ## Implementação detalhada

    - Usar permissões mínimas.
- Fixar Actions em versões estáveis.
- Separar CI de deploy.
- Executar Pagefind apenas se já instalado; caso contrário manter placeholder explícito.
- Adicionar verificação de ausência de segredos no artefato.
- Criar publicação de uma fixture por PR real ou ambiente de teste equivalente.

    ## Comportamentos que devem ser preservados

    - Build local e CI devem produzir saída funcionalmente equivalente.
- Deploy só acontece após merge autorizado.

    ## Tratamento de erros obrigatório

    - Falha de check bloqueia merge.
- Falha de deploy não altera status editorial externo inexistente.
- Smoke test deve distinguir build e disponibilidade.

    ## Testes obrigatórios

    - Workflow syntax.
- Build em ambiente limpo.
- PR com conteúdo inválido.
- PR válido.
- Rollback.

    ## Comandos mínimos de validação

    - `pnpm ci:local`
- `pnpm build`
- `pnpm verify:dist`

    ## Critérios de aceite

    - Uma edição fixture é publicada sem edição manual de HTML.
- PR é obrigatório.
- Site responde no Pages.
- Rollback documentado funciona.

    ## Documentação a atualizar

    - Runbook de publicação manual.
- Configuração de branch protection.

    ## Artefatos esperados

    - `subsolo-0.4.0-dev.zip`
- relatório do primeiro deploy

    ## Proibições específicas

    - Não usar token com escopo amplo.
- Não disparar deploy de branches não autorizadas.

    ## Revisão obrigatória antes de concluir

    - Revisar logs do workflow.
- Comparar artefato local e remoto.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `7/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 08 — Exportador determinístico com Docs e Sheets mockados

    **Versão resultante:** `0.5.0-dev`

    ## Objetivo

    Construir a CLI e o pipeline determinístico que convertem inputs equivalentes a Google Docs e Sheets em conteúdo público sanitizado, sem acessar APIs reais.

    ## Contexto necessário

    - O n8n coordenará, mas a lógica crítica deve viver na CLI e em bibliotecas testáveis.
- O exportador precisa impedir vazamento de comentários, notas, links privados e pendências.

    ## Dependências anteriores

    - Prompts 3, 4, 6 e 7 concluídos.

    ## Pré-condições

    - Fixtures de Docs e Sheets definidas.
- Formato público congelado para esta etapa.

    ## Escopo obrigatório

    - Implementar `subsolo export-doc`.
- Implementar adapters de fixture para documento e planilha.
- Converter estrutura de documento para Markdown.
- Mapear metadados para front matter.
- Gerar sources, corrections e media metadata.
- Implementar sanitização por allowlist.
- Gerar relatório de proveniência pública.
- Implementar dry-run completo.

    ## Fora de escopo

    - Não autenticar no Google.
- Não escrever no Git.
- Não gerar ZIP final.

    ## Arquivos, componentes e documentos a inspecionar

    - templates do Prompt 3
- schemas do Prompt 4
- modelo do BDD e blocos editoriais

    ## Implementação detalhada

    - Modelar AST intermediária do documento.
- Separar parsing, transformação, validação e escrita.
- Preservar headings, links, listas, tabelas e citações permitidas.
- Detectar comentários, sugestões não resolvidas e marcadores internos.
- Mapear fontes para IDs estáveis.
- Gerar output determinístico para a mesma entrada.

    ## Comportamentos que devem ser preservados

    - Texto humano e estrutura editorial.
- Datas e fuso.
- Links públicos válidos.

    ## Tratamento de erros obrigatório

    - Documento ausente.
- Metadado obrigatório ausente.
- Sugestão pendente.
- Link privado.
- Campo conflitante entre Docs e Sheets.

    ## Testes obrigatórios

    - Golden tests de exportação.
- Sanitização.
- Idempotência.
- Unicode e português.
- Tabelas e blocos editoriais.

    ## Comandos mínimos de validação

    - `pnpm test -- exporter`
- `pnpm cli export-doc fixtures/... --dry-run`
- `pnpm validate:content`

    ## Critérios de aceite

    - Fixture completa gera publicação válida.
- Mesma entrada gera mesmos bytes.
- Nenhum conteúdo privado aparece.
- Dry-run não altera filesystem final.

    ## Documentação a atualizar

    - Contrato do exportador.
- Mapa de transformação Docs → Markdown.

    ## Artefatos esperados

    - `subsolo-0.5.0-dev.zip`
- golden outputs

    ## Proibições específicas

    - Não converter HTML bruto sem AST.
- Não silenciar conflito de metadados.

    ## Revisão obrigatória antes de concluir

    - Comparar documento fixture e output linha a linha.
- Pesquisar padrões de conteúdo privado no output.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `8/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 09 — Integrações reais com Google Docs e Sheets

    **Versão resultante:** `0.5.1-dev`

    ## Objetivo

    Implementar adapters reais, de escopo mínimo, para ler planilha e documento autorizados, preservando a mesma interface e os mesmos resultados do pipeline mockado.

    ## Contexto necessário

    - O ambiente Google é privado.
- O site nunca consulta Google em runtime.
- Credenciais devem permanecer fora do repositório.

    ## Dependências anteriores

    - Exportador mockado do Prompt 8.

    ## Pré-condições

    - Credenciais de desenvolvimento controladas.
- Planilha e documento de teste separados de conteúdo sensível.
- Scopes mínimos definidos.

    ## Escopo obrigatório

    - Implementar provider Sheets read-only.
- Implementar provider Docs read-only.
- Implementar resolução por IDs.
- Implementar paginação e retries.
- Implementar rate-limit e timeout.
- Implementar cache efêmero opcional.
- Implementar dry-run com dados reais sem persistir saída final.
- Comparar provider real com fixtures.

    ## Fora de escopo

    - Não atualizar status no Sheets ainda.
- Não criar Docs.
- Não enviar arquivos ao Drive.
- Não acessar Gmail ou Calendar.

    ## Arquivos, componentes e documentos a inspecionar

    - interfaces do Prompt 8
- configuração de ambiente
- política de permissões

    ## Implementação detalhada

    - Manter adapters sem lógica editorial.
- Normalizar erros externos para catálogo interno.
- Redigir logs para não expor conteúdo.
- Permitir gravação de fixture sanitizada para regressão apenas por comando explícito.
- Adicionar modo offline usando fixtures.

    ## Comportamentos que devem ser preservados

    - Output do exportador não muda conforme provider.
- Build do site continua independente do Google.

    ## Tratamento de erros obrigatório

    - Credencial ausente.
- Documento sem acesso.
- Quota.
- Timeout.
- ID inexistente.
- Formato inesperado.

    ## Testes obrigatórios

    - Contract tests provider mock/real.
- Falhas simuladas.
- Retry.
- Redação de logs.
- Modo offline.

    ## Comandos mínimos de validação

    - `pnpm test:integration -- google`
- `pnpm cli export-doc --provider google --dry-run`

    ## Critérios de aceite

    - Documento real de teste gera output válido.
- Nenhuma credencial aparece em logs ou ZIP.
- Modo offline permanece funcional.
- Scopes estão documentados.

    ## Documentação a atualizar

    - Setup de credenciais.
- Política de scopes.
- Troubleshooting Google.

    ## Artefatos esperados

    - `subsolo-0.5.1-dev.zip`
- relatório de integração sem dados sensíveis

    ## Proibições específicas

    - Não usar credencial pessoal ampla.
- Não salvar conteúdo real em fixture sem sanitização.

    ## Revisão obrigatória antes de concluir

    - Inspecionar logs.
- Revogar e recriar credencial de teste para validar documentação.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `9/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 10 — Pacote de edição, revisões e checksums

    **Versão resultante:** `0.6.0-dev`

    ## Objetivo

    Implementar o empacotamento imutável da edição diária, incluindo manifest, revisões, checksums, relatórios e restauração local.

    ## Contexto necessário

    - A edição é agregadora e pode ter r1, r2, r3 e fechamento selado.
- ZIP é preservação, não estrutura de consulta do site.

    ## Dependências anteriores

    - Prompts 4, 8 e 9 concluídos.

    ## Pré-condições

    - Formato público e ciclo de revisão definidos.
- Fixtures com múltiplas publicações.

    ## Escopo obrigatório

    - Implementar `subsolo package`.
- Gerar estrutura de diretórios do pacote.
- Gerar `manifest.json`, `edition.md`, `publication-run.json` e checksums.
- Gerar ZIP determinístico quando timestamps de entrada forem fixados.
- Implementar `supersedes`.
- Implementar validação e restore local.
- Implementar detecção de duplicidade por checksum.
- Implementar dry-run.

    ## Fora de escopo

    - Não fazer upload ao Drive.
- Não criar PR automaticamente.

    ## Arquivos, componentes e documentos a inspecionar

    - modelo do pacote no plano v2.0
- schemas
- outputs do exportador

    ## Implementação detalhada

    - Ordenar arquivos e registros deterministicamente.
- Normalizar timestamps.
- Bloquear path traversal e symlinks perigosos.
- Separar mídia derivada de originais.
- Gerar checksums SHA-256.
- Criar relatório de validação.

    ## Comportamentos que devem ser preservados

    - Publicações mantêm IDs e URLs.
- Revisão anterior não é alterada.

    ## Tratamento de erros obrigatório

    - Checksum divergente.
- Revisão inválida.
- `supersedes` inexistente.
- Arquivo não permitido.
- Pacote duplicado.

    ## Testes obrigatórios

    - Golden ZIP.
- Restore.
- Corrupt package.
- Revisões.
- Path traversal.
- Determinismo.

    ## Comandos mínimos de validação

    - `pnpm cli package fixtures/edition --dry-run`
- `pnpm cli package fixtures/edition --apply`
- `pnpm cli restore ... --dry-run`

    ## Critérios de aceite

    - ZIP válido é criado.
- Checksums conferem.
- Restore reconstrói o workspace.
- Pacotes antigos permanecem intactos.

    ## Documentação a atualizar

    - Especificação do pacote.
- Procedimento de restore.

    ## Artefatos esperados

    - `subsolo-0.6.0-dev.zip`
- pacotes fixture r1 e r2

    ## Proibições específicas

    - Não incluir originais ou notas privadas.
- Não sobrescrever ZIP existente.

    ## Revisão obrigatória antes de concluir

    - Listar conteúdo do ZIP.
- Comparar checksums antes e depois do restore.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `10/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 11 — Preservação no Google Drive

    **Versão resultante:** `0.6.1-dev`

    ## Objetivo

    Integrar o pacote imutável ao arquivo técnico do Google Drive com upload verificável, metadados, idempotência e recuperação.

    ## Contexto necessário

    - O Drive possui área editorial e área técnica separadas.
- O upload é considerado concluído somente após confirmação de ID, nome, tamanho e metadados.

    ## Dependências anteriores

    - Pacote do Prompt 10.
- Provider Google do Prompt 9.

    ## Pré-condições

    - Pasta de teste no Drive.
- Credencial com escopo mínimo.
- Política de nomes e hierarquia.

    ## Escopo obrigatório

    - Implementar adapter Drive.
- Implementar upload resumível.
- Criar/validar caminho anual e mensal.
- Registrar metadados técnicos.
- Detectar pacote já enviado.
- Implementar download e verificação.
- Implementar retry seguro.
- Integrar `subsolo publish --skip-git` em dry-run/apply.

    ## Fora de escopo

    - Não criar branch ou PR.
- Não mover documentos editoriais.
- Não apagar pacotes.

    ## Arquivos, componentes e documentos a inspecionar

    - estrutura Drive definida no plano
- pacotes do Prompt 10
- configuração de credenciais

    ## Implementação detalhada

    - Separar interface de armazenamento do provider Google.
- Calcular idempotency key.
- Persistir file ID apenas após confirmação.
- Não confiar em busca por nome como único mecanismo.
- Produzir relatório sem URL privada desnecessária.

    ## Comportamentos que devem ser preservados

    - Arquivo local permanece após upload.
- Pacotes anteriores permanecem.

    ## Tratamento de erros obrigatório

    - Quota.
- Timeout.
- Upload parcial.
- Checksum local incompatível.
- Pasta não autorizada.

    ## Testes obrigatórios

    - Mock de upload resumível.
- Retry.
- Duplicidade.
- Download e verify.
- Falha entre upload e registro.

    ## Comandos mínimos de validação

    - `pnpm test:integration -- drive`
- `pnpm cli publish package.zip --skip-git --dry-run`

    ## Critérios de aceite

    - Pacote chega à pasta correta.
- File ID e tamanho são confirmados.
- Reexecução não duplica.
- Download restaurável é demonstrado.

    ## Documentação a atualizar

    - Runbook do arquivo técnico.
- Política de retenção.

    ## Artefatos esperados

    - `subsolo-0.6.1-dev.zip`
- relatório de upload sanitizado

    ## Proibições específicas

    - Não tornar ZIP público por padrão.
- Não apagar revisões.

    ## Revisão obrigatória antes de concluir

    - Verificar manualmente a hierarquia Drive.
- Baixar e validar o pacote.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `11/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 12 — Orquestração de publicação com n8n

    **Versão resultante:** `0.7.0-dev`

    ## Objetivo

    Criar os workflows n8n que detectam conteúdo pronto, chamam a CLI, geram pacote, preservam no Drive, criam branch e pull request e atualizam o controle editorial.

    ## Contexto necessário

    - O n8n coordena; não replica o domínio.
- Pull request continua sendo fronteira humana obrigatória.
- PostgreSQL guarda estado operacional, locks e idempotência.

    ## Dependências anteriores

    - Prompts 2, 9, 10 e 11 concluídos.
- Publicação manual do Prompt 7 funcional.

    ## Pré-condições

    - n8n e PostgreSQL saudáveis.
- Credenciais de teste.
- CLI disponível no ambiente do workflow.

    ## Escopo obrigatório

    - Criar workflows 03 a 08 definidos no plano.
- Implementar polling ou gatilho controlado do Sheets.
- Implementar lock por artigo/edição.
- Executar exportação, validação, package e Drive.
- Criar branch, commit e PR.
- Atualizar status no Sheets.
- Registrar run.
- Implementar dry-run e execução manual.
- Implementar tratamento de erro e alerta.

    ## Fora de escopo

    - Não coletar RSS ou Gmail ainda.
- Não realizar merge automático.
- Não publicar acusações sem revisão.

    ## Arquivos, componentes e documentos a inspecionar

    - workflows definidos no plano
- CLI
- GitHub workflow
- máquina de estados editorial

    ## Implementação detalhada

    - Versionar workflows exportados em JSON sanitizado.
- Usar subworkflows pequenos.
- Centralizar credenciais no cofre.
- Usar idempotency key por artigo + revisão.
- Não armazenar corpo completo em logs.
- Criar dead-letter lógico e operação de retry manual.

    ## Comportamentos que devem ser preservados

    - Execução manual via CLI continua possível.
- Falha do n8n não corrompe Git ou Drive.

    ## Tratamento de erros obrigatório

    - Lock ocupado.
- Drive falha.
- GitHub falha.
- PR existente.
- Sheets diverge.
- CLI retorna código de erro.

    ## Testes obrigatórios

    - Workflow em modo dry-run.
- Mesma entrada duas vezes.
- Falha em cada etapa.
- Retomada.
- PR já existente.
- Redação de logs.

    ## Comandos mínimos de validação

    - `pnpm test:n8n`
- `docker compose exec n8n ...` conforme documentação
- `pnpm cli reconcile --dry-run`

    ## Critérios de aceite

    - Artigo pronto gera um único PR.
- ZIP é criado e preservado antes do PR.
- Falhas são acionáveis.
- Sem merge automático.
- Status é atualizado corretamente.

    ## Documentação a atualizar

    - Mapa dos workflows.
- Runbook de falhas.
- Procedimento de reexecução.

    ## Artefatos esperados

    - `subsolo-0.7.0-dev.zip`
- exports n8n sanitizados

    ## Proibições específicas

    - Não inserir lógica editorial em Code nodes sem teste equivalente.
- Não usar credenciais em JSON exportado.

    ## Revisão obrigatória antes de concluir

    - Inspecionar execução completa no n8n.
- Comparar logs, Drive, PR e Sheets.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `12/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 13 — Ciclo de vida da edição diária

    **Versão resultante:** `0.8.0-dev`

    ## Objetivo

    Implementar a edição diária incremental, sua relação com o Mapa do Dia, revisões públicas e fechamento selado.

    ## Contexto necessário

    - A edição operacional privada pode conter slots e pautas reservadas.
- A edição pública só contém material publicável.
- O dia pode gerar várias revisões, sem alterar URLs individuais.

    ## Dependências anteriores

    - Prompts 3, 10 e 12 concluídos.

    ## Pré-condições

    - Aba EDICOES definida.
- Modelo de revisão e `supersedes` funcional.

    ## Escopo obrigatório

    - Implementar estados planejada, aberta, publicada e selada.
- Implementar r1, revisões intermediárias e fechamento.
- Gerar página de edição.
- Relacionar publicações à edição.
- Gerar manifest atualizado.
- Integrar workflow de atualização da edição.
- Impedir vazamento de slots privados.
- Implementar selo de fechamento.

    ## Fora de escopo

    - Não implementar arquivo global completo.
- Não automatizar Mesa de Abertura.

    ## Arquivos, componentes e documentos a inspecionar

    - manual da Mesa
- aba EDICOES
- pacotes e schemas

    ## Implementação detalhada

    - Modelar comandos open, append, revise e seal.
- Validar transições.
- Manter ordem editorial explícita.
- Registrar conteúdos retirados ou adiados apenas no domínio privado.
- Permitir correção após selamento como nova revisão formal.

    ## Comportamentos que devem ser preservados

    - URLs individuais.
- ZIPs anteriores.
- Histórico de revisões.

    ## Tratamento de erros obrigatório

    - Edição selada recebendo append comum.
- Publicação de outra data sem regra explícita.
- Item privado no manifest público.

    ## Testes obrigatórios

    - Transições da edição.
- r1 → r2 → sealed.
- Reexecução.
- Vazamento de campo privado.
- Ordenação.

    ## Comandos mínimos de validação

    - `pnpm test -- edition-lifecycle`
- `pnpm cli package ...`

    ## Critérios de aceite

    - Edição diária pode ser aberta, atualizada e selada.
- Cada revisão gera pacote.
- Página pública mostra somente o necessário.
- Histórico é preservado.

    ## Documentação a atualizar

    - Runbook diário.
- Política de fechamento.

    ## Artefatos esperados

    - `subsolo-0.8.0-dev.zip`
- fixtures de edição completa

    ## Proibições específicas

    - Não publicar Mapa do Dia integral.
- Não sobrescrever edição selada.

    ## Revisão obrigatória antes de concluir

    - Comparar Sheets privado e manifest público.
- Verificar que slots não confirmados não aparecem.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `13/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 14 — Arquivo vivo, busca, feeds e descoberta

    **Versão resultante:** `0.8.1-dev`

    ## Objetivo

    Transformar o acervo estático em produto editorial navegável por data, canal, tema, autor e história, com Pagefind, filtros, RSS e sitemap.

    ## Contexto necessário

    - O arquivo não deve ser lista cronológica infinita.
- Histórias são entidades acompanhadas.
- Busca ocorre no navegador, sem backend.

    ## Dependências anteriores

    - Portal e edição diária funcionais.

    ## Pré-condições

    - Fixtures suficientes para paginação e relações.
- Taxonomias públicas estáveis.

    ## Escopo obrigatório

    - Gerar arquivo anual, mensal e diário.
- Gerar páginas de canal, tema, autor e história completas.
- Implementar paginação.
- Gerar `archive-index.json` compacto.
- Integrar Pagefind.
- Implementar UI de busca e filtros.
- Gerar RSS geral, por canal e correções.
- Gerar sitemap e robots.

    ## Fora de escopo

    - Não implementar personalização de leitor.
- Não criar API backend.

    ## Arquivos, componentes e documentos a inspecionar

    - diretrizes de arquivo vivo
- schemas de história
- rotas existentes

    ## Implementação detalhada

    - Ordenação determinística.
- Facetas Pagefind.
- Exclusão de navegação e conteúdo duplicado do índice.
- Fallback sem JavaScript para navegação.
- Alternativa textual para cronologias.
- Canonical e metadados de atualização.

    ## Comportamentos que devem ser preservados

    - URLs estáveis.
- Leitura básica sem JS.
- Hierarquia visual do Jornal Concreto.

    ## Tratamento de erros obrigatório

    - Taxonomia vazia.
- Página além do limite.
- História com referência quebrada.
- Índice ausente em dev deve mostrar estado claro.

    ## Testes obrigatórios

    - Indexação.
- Busca por título e corpo.
- Filtros.
- Paginação.
- Feeds válidos.
- Sitemap.

    ## Comandos mínimos de validação

    - `pnpm build`
- `pnpm pagefind`
- `pnpm test:e2e -- search archive`
- `pnpm validate:feeds`

    ## Critérios de aceite

    - Todo conteúdo aparece no arquivo correto.
- Busca não indexa ruído.
- Histórias agregam cronologia.
- Feeds e sitemap são válidos.

    ## Documentação a atualizar

    - Guia do arquivo.
- Configuração Pagefind.

    ## Artefatos esperados

    - `subsolo-0.8.1-dev.zip`
- relatório de cobertura do índice

    ## Proibições específicas

    - Não carregar corpo completo em `archive-index.json`.
- Não usar rolagem infinita como único acesso.

    ## Revisão obrigatória antes de concluir

    - Buscar termos conhecidos e ausentes.
- Testar arquivo com JS desativado.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `14/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 15 — Captação editorial com FreshRSS, Gmail e SearXNG

    **Versão resultante:** `0.8.2-dev`

    ## Objetivo

    Integrar fontes de descoberta ao controle editorial sem permitir publicação automática nem tratar agregadores, releases ou snippets como confirmação factual.

    ## Contexto necessário

    - FreshRSS centraliza fontes.
- Gmail recebe comunicações.
- SearXNG apoia pesquisa.
- Todas as entradas criam apenas pautas preliminares.

    ## Dependências anteriores

    - Infra do Prompt 2.
- Ambiente editorial do Prompt 3.
- n8n do Prompt 12.

    ## Pré-condições

    - Categorias de feeds e marcadores Gmail definidos.
- Planilha de teste.
- Política de deduplicação.

    ## Escopo obrigatório

    - Criar workflow de ingestão FreshRSS.
- Criar workflow de triagem Gmail.
- Criar integração de consulta SearXNG para pesquisa manual ou assistida.
- Normalizar entrada.
- Deduplicar.
- Criar pauta preliminar.
- Preservar origem.
- Gerar relatório de triagem.

    ## Fora de escopo

    - Não escrever matéria.
- Não aprovar pauta.
- Não responder e-mail sensível.
- Não publicar.

    ## Arquivos, componentes e documentos a inspecionar

    - categorias editoriais
- regras do BDD
- política de fontes

    ## Implementação detalhada

    - Usar fingerprint de URL canônica, título normalizado e origem.
- Registrar data do fato separada da data da publicação quando disponível.
- Classificação preliminar deve ser explicitamente não editorial.
- Anexos ficam em área de quarentena.
- Snippets não entram como corpo da pauta sem marcação.

    ## Comportamentos que devem ser preservados

    - Decisão humana da Mesa.
- Fonte original.
- Separação fato/declaração.

    ## Tratamento de erros obrigatório

    - Feed indisponível.
- E-mail sem remetente confiável.
- Anexo suspeito.
- Duplicidade provável.
- Busca parcial.

    ## Testes obrigatórios

    - Deduplicação.
- Release repetido.
- Feed alterado.
- E-mail com anexo.
- SearXNG indisponível.

    ## Comandos mínimos de validação

    - `pnpm test:n8n -- ingestion`
- `docker compose ps`

    ## Critérios de aceite

    - Entradas criam apenas pautas preliminares.
- Duplicidade é controlada.
- Origem permanece rastreável.
- Nenhum conteúdo é publicado automaticamente.

    ## Documentação a atualizar

    - Manual de fontes.
- Política de triagem.

    ## Artefatos esperados

    - `subsolo-0.8.2-dev.zip`
- workflows de ingestão

    ## Proibições específicas

    - Não considerar release fonte independente.
- Não abrir anexos executáveis automaticamente.

    ## Revisão obrigatória antes de concluir

    - Auditar pautas geradas por lote de teste.
- Confirmar ausência de transição para aprovado.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `15/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 16 — Correções, atualizações, redirects e tombstones

    **Versão resultante:** `0.8.3-dev`

    ## Objetivo

    Implementar o ciclo pós-publicação com correções factuais, atualizações materiais, mudanças controladas de slug, retiradas e páginas-túmulo.

    ## Contexto necessário

    - Correção não apaga histórico.
- Retirada não deve virar 404 silencioso.
- Cada revisão gera novo pacote e PR.

    ## Dependências anteriores

    - Edição e publicação automatizadas.
- Arquivo e feeds funcionais.

    ## Pré-condições

    - Taxonomia de correções definida.
- Política editorial de correção documentada.

    ## Escopo obrigatório

    - Implementar registro de correção.
- Implementar atualização material.
- Gerar nota pública.
- Gerar feed de correções.
- Implementar redirects.
- Implementar tombstone.
- Integrar Sheets, package, PR e site.
- Preservar revision chain.

    ## Fora de escopo

    - Não implementar aconselhamento jurídico.
- Não apagar histórico do Git.

    ## Arquivos, componentes e documentos a inspecionar

    - política de correções
- schemas
- rotas e pacote

    ## Implementação detalhada

    - Separar correction, clarification, update e withdrawal.
- Exigir motivo e impacto.
- Manter canonical.
- Validar redirect sem loop.
- Permitir ocultar corpo em retirada quando necessário, mantendo registro.

    ## Comportamentos que devem ser preservados

    - URL original.
- ZIPs.
- Commits.
- Explicação editorial.

    ## Tratamento de erros obrigatório

    - Correção sem revisão anterior.
- Redirect circular.
- Retirada sem motivo.
- Atualização marcada como correção indevidamente.

    ## Testes obrigatórios

    - Revision chain.
- Feed.
- Redirect.
- Tombstone.
- Busca após retirada.
- Arquivo após correção.

    ## Comandos mínimos de validação

    - `pnpm test -- corrections redirects tombstones`
- `pnpm build`
- `pnpm check:links`

    ## Critérios de aceite

    - Correção aparece na matéria e no arquivo.
- Pacote anterior permanece.
- Redirect funciona.
- Retirada preserva URL e motivo.

    ## Documentação a atualizar

    - Política pública de correções.
- Runbook de retirada.

    ## Artefatos esperados

    - `subsolo-0.8.3-dev.zip`
- fixtures de correção e retirada

    ## Proibições específicas

    - Não reescrever histórico.
- Não usar 404 para retirada editorial conhecida.

    ## Revisão obrigatória antes de concluir

    - Comparar revisões.
- Testar todos os redirects.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `16/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 17 — Pipeline de mídia, derivados e retratos editoriais

    **Versão resultante:** `0.8.4-dev`

    ## Objetivo

    Implementar ingestão segura de mídia, geração de derivados e uso dos retratos editoriais, mantendo originais no Drive e publicando apenas ativos otimizados.

    ## Contexto necessário

    - Imagens não são obrigatórias para toda matéria.
- Retratos seguem Realismo Editorial Tech-Noir.
- Originais não devem inflar o GitHub Pages.

    ## Dependências anteriores

    - Provider Drive.
- Portal e schemas de mídia.

    ## Pré-condições

    - Política de licenças, créditos e alt.
- Retratos aprovados disponíveis quando existirem.

    ## Escopo obrigatório

    - Implementar manifesto de mídia.
- Validar MIME, dimensão, tamanho, licença, crédito e alt.
- Gerar AVIF, WebP, fallback, thumbnails e social cards.
- Remover EXIF desnecessário.
- Integrar ao pacote e Astro.
- Implementar placeholder editorial sem imagem.
- Integrar retratos e páginas de autor.

    ## Fora de escopo

    - Não criar CDN.
- Não armazenar originais no Git.
- Não gerar imagens novas automaticamente.

    ## Arquivos, componentes e documentos a inspecionar

    - guia visual de retratos
- base visual
- schema media

    ## Implementação detalhada

    - Isolar processador de imagem.
- Usar dimensões declaradas para evitar layout shift.
- Gerar nomes content-addressed ou estáveis.
- Criar fallback quando formato moderno não suportado.
- Registrar origem e licença.

    ## Comportamentos que devem ser preservados

    - Direção artística.
- Legibilidade.
- Ausência de obrigação de foto genérica.

    ## Tratamento de erros obrigatório

    - MIME inconsistente.
- Alt vazio.
- Licença ausente quando obrigatória.
- Original enorme.
- Derivado faltando.

    ## Testes obrigatórios

    - Formatos.
- EXIF.
- Alt.
- Build com e sem imagem.
- Retrato em recorte quadrado e circular.

    ## Comandos mínimos de validação

    - `pnpm test -- media`
- `pnpm process:media --dry-run`
- `pnpm build`

    ## Critérios de aceite

    - Originais ficam fora do artefato público.
- Derivados são responsivos.
- Alt e crédito aparecem.
- Página sem imagem continua correta.

    ## Documentação a atualizar

    - Guia de mídia.
- Procedimento de retratos.

    ## Artefatos esperados

    - `subsolo-0.8.4-dev.zip`
- relatório de ativos

    ## Proibições específicas

    - Não remover autoria ou licença.
- Não publicar metadados sensíveis.

    ## Revisão obrigatória antes de concluir

    - Inspecionar tamanho do build.
- Revisar visual em mobile.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `17/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 18 — Observabilidade, backups, reconciliação e recuperação

    **Versão resultante:** `0.9.0-dev`

    ## Objetivo

    Preparar a operação diária com logs estruturados, Uptime Kuma, ntfy, backup dos serviços, reconciliação entre sistemas e testes de restauração.

    ## Contexto necessário

    - O monitor local não detecta a própria queda da máquina.
- GitHub Pages deve permanecer disponível.
- Backup não testado não é confiável.

    ## Dependências anteriores

    - Fluxo completo até mídia funcional.

    ## Pré-condições

    - Definir retenção.
- Definir destinos de alerta.
- Definir RPO e RTO iniciais.

    ## Escopo obrigatório

    - Implementar logs estruturados.
- Configurar monitores Kuma.
- Configurar ntfy por profile.
- Implementar backup PostgreSQL, n8n e FreshRSS.
- Implementar restore.
- Implementar workflow de reconciliação Sheets/Drive/GitHub.
- Implementar smoke tests externos via Actions.
- Gerar relatórios de execução.

    ## Fora de escopo

    - Não contratar monitoramento externo.
- Não migrar para VPS.

    ## Arquivos, componentes e documentos a inspecionar

    - estado operacional
- volumes Docker
- IDs e relatórios

    ## Implementação detalhada

    - Redigir dados sensíveis em logs.
- Classificar retryable.
- Criar alertas acionáveis.
- Detectar divergências sem corrigi-las silenciosamente.
- Executar restore em ambiente limpo.
- Registrar métricas de build e tamanho.

    ## Comportamentos que devem ser preservados

    - Site independente da máquina.
- Pacotes imutáveis.

    ## Tratamento de erros obrigatório

    - Backup incompleto.
- Reconciliação ambígua.
- Alerta indisponível.
- Restore incompatível.

    ## Testes obrigatórios

    - Backup/restore.
- Reconciliação de cenários.
- Redação de logs.
- Alerta.
- Smoke test.

    ## Comandos mínimos de validação

    - `pnpm cli reconcile --dry-run`
- `infra/scripts/backup --dry-run`
- `infra/scripts/restore --test`

    ## Critérios de aceite

    - Backup restaura serviços essenciais.
- Divergências são detectadas.
- Falhas críticas geram alerta.
- Site segue disponível com stack desligada.

    ## Documentação a atualizar

    - Runbook de incidentes.
- Plano de backup e recuperação.

    ## Artefatos esperados

    - `subsolo-0.9.0-dev.zip`
- relatório de restore

    ## Proibições específicas

    - Não enviar backup sem criptografia quando contiver dados privados.
- Não logar corpo editorial.

    ## Revisão obrigatória antes de concluir

    - Simular falhas.
- Desligar stack e verificar site.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `18/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 19 — Hardening de segurança, privacidade, acessibilidade e desempenho

    **Versão resultante:** `0.9.1-dev`

    ## Objetivo

    Eliminar fragilidades antes do pré-release, auditar superfície de ataque, privacidade, acessibilidade, desempenho, dependências e comportamento em condições degradadas.

    ## Contexto necessário

    - O portal deve carregar como publicação, não aplicação pesada.
- Conteúdo público precisa funcionar sem JS para leitura básica.
- Serviços locais devem permanecer privados.

    ## Dependências anteriores

    - Prompt 18 concluído.

    ## Pré-condições

    - Fluxos críticos completos.
- Ambiente de teste representativo.

    ## Escopo obrigatório

    - Auditoria de dependências.
- Headers e CSP compatíveis.
- Sanitização e secrets scan.
- Permissões mínimas.
- WCAG automatizada e revisão manual.
- Performance budgets.
- Teste sem JS, conexão lenta e mídia ausente.
- Teste de grande acervo.
- Revisão de privacidade.
- Revisão de quotas e crescimento.

    ## Fora de escopo

    - Não adicionar analytics.
- Não instalar serviços adiados.
- Não redesenhar o portal.

    ## Arquivos, componentes e documentos a inspecionar

    - todo o repositório
- workflows
- compose
- artefato Pages
- logs e backups

    ## Implementação detalhada

    - Fixar orçamento de JS, CSS, imagens e índice.
- Adicionar secret scanning local.
- Revisar CSP sem quebrar tema e Pagefind.
- Testar teclado, screen reader landmarks e movimento reduzido.
- Testar milhares de publicações sintéticas.
- Revisar licenses de dependências.

    ## Comportamentos que devem ser preservados

    - Identidade visual.
- Funcionalidade editorial.
- Compatibilidade do pacote.

    ## Tratamento de erros obrigatório

    - Falha de budget.
- Dependência vulnerável sem decisão.
- Contraste inadequado.
- Header incompatível.

    ## Testes obrigatórios

    - Security checks.
- A11y.
- Performance.
- Load/build scale.
- Offline básico.
- Sem JS.

    ## Comandos mínimos de validação

    - `pnpm audit:security`
- `pnpm check:a11y`
- `pnpm check:performance`
- `pnpm test:scale`
- `pnpm build`

    ## Critérios de aceite

    - Nenhum segredo detectado.
- Rotas críticas atendem requisitos de acessibilidade.
- Budgets aprovados.
- Build em escala cabe nos limites definidos.

    ## Documentação a atualizar

    - Threat model.
- Política de privacidade inicial.
- Relatório de acessibilidade.

    ## Artefatos esperados

    - `subsolo-0.9.1-dev.zip`
- relatórios de hardening

    ## Proibições específicas

    - Não ignorar vulnerabilidade sem registro.
- Não reduzir acessibilidade para preservar efeito visual.

    ## Revisão obrigatória antes de concluir

    - Revisão manual em desktop e mobile.
- Revisão de permissões linha por linha.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `19/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 20 — Revisão completa pré-release

    **Versão resultante:** `1.0.0-pre`

    ## Objetivo

    Executar auditoria integral do projeto, remover resíduos de desenvolvimento, validar toda a cadeia editorial e produzir uma pré-release cumulativa pronta para teste real.

    ## Contexto necessário

    - Todas as funcionalidades previstas para 1.0 devem estar implementadas.
- Esta etapa não deve adicionar escopo novo.

    ## Dependências anteriores

    - Prompts 1 a 19 concluídos.

    ## Pré-condições

    - Todos os relatórios anteriores disponíveis.
- Ambiente limpo para instalação.
- Credenciais de teste separadas.

    ## Escopo obrigatório

    - Auditar plano versus implementação.
- Auditar requisitos e critérios de aceite.
- Revisar todos os testes e remover apenas redundância comprovada.
- Executar fluxo completo com edição de teste.
- Executar restore completo.
- Revisar documentação.
- Limpar fixtures obsoletas, TODOs, debug e código morto.
- Gerar SBOM e inventário.
- Gerar pré-release limpa.

    ## Fora de escopo

    - Não implementar feature nova.
- Não refatorar por estética.
- Não alterar schemas de forma incompatível.

    ## Arquivos, componentes e documentos a inspecionar

    - todo o projeto
- todos os documentos-fonte
- todos os relatórios
- todos os workflows

    ## Implementação detalhada

    - Executar matriz de rastreabilidade requisito → teste → código.
- Executar instalação do zero.
- Executar stack, exportação, package, Drive de teste, PR, build, deploy e reconciliação.
- Revisar tamanho e conteúdo do ZIP.
- Atualizar changelog para pré-release.

    ## Comportamentos que devem ser preservados

    - Compatibilidade pública.
- Dados existentes.
- Comportamento aprovado.

    ## Tratamento de erros obrigatório

    - Qualquer desvio sem registro bloqueia a pré-release.
- Teste flaky deve ser corrigido ou explicitamente isolado com justificativa.

    ## Testes obrigatórios

    - Suite completa.
- E2E completo.
- Restore.
- Scale.
- Security.
- A11y.
- Manual acceptance.

    ## Comandos mínimos de validação

    - `pnpm ci:local`
- `pnpm test:all`
- `pnpm release:verify`

    ## Critérios de aceite

    - Todos os critérios do plano v2.0 possuem evidência.
- Instalação limpa funciona.
- Fluxo completo funciona.
- ZIP não contém resíduos ou segredos.

    ## Documentação a atualizar

    - Release notes pre.
- Known issues.
- Matriz de rastreabilidade.
- Checklist de teste do usuário.

    ## Artefatos esperados

    - `subsolo-1.0.0-pre.zip`
- `subsolo-documentacao-1.0.0-pre.zip`

    ## Proibições específicas

    - Não esconder falhas para fechar versão.
- Não declarar teste manual não executado.

    ## Revisão obrigatória antes de concluir

    - Inspeção final do ZIP.
- Repetir os testes em diretório novo.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `20/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 21 — Release Candidate 1

    **Versão resultante:** `1.0.0-rc1`

    ## Objetivo

    Corrigir exclusivamente problemas encontrados na pré-release, congelar contratos e produzir o candidato final para homologação.

    ## Contexto necessário

    - A `1.0.0-pre` foi testada.
- Somente defeitos, documentação e higiene de release podem mudar.

    ## Dependências anteriores

    - Prompt 20 concluído.
- Lista de resultados da homologação pre disponível.

    ## Pré-condições

    - Classificar cada achado por severidade.
- Separar bug de pedido de nova funcionalidade.

    ## Escopo obrigatório

    - Corrigir bugs aprovados.
- Adicionar regressões.
- Reexecutar suite completa.
- Congelar schema 1.0.
- Congelar CLI pública.
- Congelar rotas.
- Atualizar documentação e changelog.
- Gerar RC limpa.

    ## Fora de escopo

    - Novas funcionalidades.
- Redesign.
- Mudança arquitetural ampla.
- Serviços adiados.

    ## Arquivos, componentes e documentos a inspecionar

    - relatório da pre
- diff desde 1.0.0-pre
- contratos públicos

    ## Implementação detalhada

    - Para cada bug: reproduzir, testar, corrigir, validar regressão.
- Revisar compatibilidade de pacote e restore.
- Marcar riscos remanescentes.
- Gerar tag e artefato RC conforme processo documentado.

    ## Comportamentos que devem ser preservados

    - Contratos públicos.
- Dados e URLs.
- Visual aprovado.

    ## Tratamento de erros obrigatório

    - Bug crítico aberto bloqueia RC.
- Alteração incompatível exige retorno à fase pre.

    ## Testes obrigatórios

    - Suite completa.
- Regressões dos achados.
- Instalação limpa.
- Upgrade a partir de pre.

    ## Comandos mínimos de validação

    - `pnpm release:verify --channel rc1`
- `pnpm test:all`

    ## Critérios de aceite

    - Nenhum bug bloqueador conhecido.
- Contratos congelados.
- RC instala, publica e restaura.
- Documentação corresponde ao comportamento.

    ## Documentação a atualizar

    - Release notes RC1.
- Guia de homologação.

    ## Artefatos esperados

    - `subsolo-1.0.0-rc1.zip`
- `subsolo-documentacao-1.0.0-rc1.zip`

    ## Proibições específicas

    - Não incluir feature disfarçada de correção.
- Não alterar versão de schema sem revisão formal.

    ## Revisão obrigatória antes de concluir

    - Comparar RC com pre.
- Reexecutar homologação em ambiente limpo.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `21/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# PROMPT 22 — Release estável 1.0.0

    **Versão resultante:** `1.0.0`

    ## Objetivo

    Promover a release candidate aprovada para a versão estável, realizar validações finais de produção e entregar os artefatos limpos e documentados.

    ## Contexto necessário

    - A RC1 precisa ter sido homologada.
- Esta etapa é promoção e validação final, não desenvolvimento funcional.

    ## Dependências anteriores

    - Prompt 21 concluído.
- Homologação explícita da RC1.

    ## Pré-condições

    - Não existir bug bloqueador.
- Domínio e repositório de produção definidos.
- Credenciais de produção revisadas.

    ## Escopo obrigatório

    - Atualizar versão para 1.0.0.
- Remover marcadores pre/rc.
- Executar build e testes finais.
- Publicar tag e release.
- Publicar GitHub Pages de produção.
- Verificar rotas, feeds, sitemap e busca.
- Executar backup inicial da versão estável.
- Registrar baseline de métricas.
- Gerar artefatos finais limpos.

    ## Fora de escopo

    - Qualquer nova funcionalidade.
- Mudança de schema.
- Refatoração ampla.

    ## Arquivos, componentes e documentos a inspecionar

    - RC1 homologada
- release checklist
- configurações de produção

    ## Implementação detalhada

    - Promover o mesmo commit ou diff mínimo estritamente necessário para metadados.
- Assinar checksums quando o mecanismo estiver disponível.
- Criar release notes definitivas.
- Executar smoke tests pós-publicação.
- Testar recuperação do artefato final.

    ## Comportamentos que devem ser preservados

    - Exatamente o comportamento homologado.
- Compatibilidade dos pacotes.
- URLs.

    ## Tratamento de erros obrigatório

    - Diferença funcional inesperada entre RC e release bloqueia promoção.
- Falha pós-deploy exige rollback para RC.

    ## Testes obrigatórios

    - Suite completa final.
- Smoke produção.
- Busca, feed e sitemap.
- Download e restore.
- Checksums.

    ## Comandos mínimos de validação

    - `pnpm release:verify --channel stable`
- `pnpm test:all`
- `pnpm build`

    ## Critérios de aceite

    - Versão 1.0.0 publicada.
- Site estável e verificável.
- Artefatos restauráveis.
- Documentação final completa.
- Nenhum segredo ou arquivo de desenvolvimento no release.

    ## Documentação a atualizar

    - Release notes 1.0.0.
- Manual de operação.
- Manual de recuperação.
- Roadmap pós-1.0 separado.

    ## Artefatos esperados

    - `subsolo-1.0.0.zip`
- `subsolo-documentacao-1.0.0.zip`
- `checksums.sha256`

    ## Proibições específicas

    - Não alterar comportamento homologado.
- Não chamar RC de release sem homologação.

    ## Revisão obrigatória antes de concluir

    - Comparar hash do código com RC.
- Inspecionar ZIP final.
- Executar restore em diretório vazio.

    ## Instrução final de execução

    Execute somente este prompt sobre o estado real acumulado do projeto. Não antecipe o prompt seguinte. Ao concluir, apresente o status `22/22`, a versão resultante, os testes realmente executados, o resumo do diff, os artefatos gerados e qualquer pendência comprovada.

---

# 6. Critério de conclusão global

O desenvolvimento só alcança `1.0.0` quando:

- uma edição nasce no ambiente editorial;
- passa por revisão;
- é exportada sem conteúdo privado;
- gera pacote imutável;
- é preservada no Drive;
- entra no GitHub por pull request;
- passa pelo CI;
- gera o portal Astro;
- cria arquivo, busca, feeds e sitemap;
- é publicada no GitHub Pages;
- tem estado sincronizado;
- aceita correções e retiradas;
- pode ser recuperada;
- permanece disponível com a máquina local desligada;
- possui documentação e testes suficientes para operação diária.

# 7. Início da execução

A sequência começa pelo **Prompt 01 — Fundação, auditoria das fontes e bootstrap do repositório**.

Nenhum serviço externo deve ser integrado antes que a fundação, os contratos e a publicação estática manual estejam comprovados.
