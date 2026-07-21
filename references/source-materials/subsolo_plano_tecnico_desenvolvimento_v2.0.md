# SUBSOLO — Plano Técnico de Desenvolvimento Reavaliado

**Versão:** 2.0  
**Data:** 20 de julho de 2026  
**Status:** plano técnico consolidado para implementação  
**Produto:** Subsolo Editorial  
**Slogan:** O ruído passa. O que importa fica.  
**Objetivo financeiro inicial:** custo incremental de infraestrutura e software igual a **R$ 0**  
**Fuso editorial:** `America/Sao_Paulo`

---

# 1. Objetivo

Este documento substitui o **Plano Técnico de Desenvolvimento v1.0** e incorpora a arquitetura editorial e a stack local de custo zero definida posteriormente.

A versão anterior estava correta ao propor:

- portal estático;
- conteúdo estruturado;
- Astro;
- Markdown e JSON;
- pacote ZIP imutável;
- Google Drive;
- GitHub;
- GitHub Actions;
- GitHub Pages;
- Pagefind;
- arquivo cronológico e temático;
- correções versionadas;
- testes;
- dry-run;
- idempotência;
- recuperação.

Entretanto, ela tratava o pacote Markdown/JSON como ponto inicial do processo e não descrevia suficientemente o ambiente editorial privado, a produção em Google Docs, o controle operacional no Google Sheets, a orquestração pelo n8n nem os serviços locais de apoio.

A arquitetura reavaliada passa a cobrir o ciclo completo:

```text
descoberta
    ↓
triagem
    ↓
produção editorial privada
    ↓
revisão humana
    ↓
exportação sanitizada
    ↓
pacote público normalizado
    ↓
backup imutável
    ↓
pull request
    ↓
build estático
    ↓
publicação
    ↓
arquivo e recuperação
```

O princípio central permanece:

> O processo editorial produz dados estruturados; o portal é uma representação compilada desses dados.

A nova regra complementar é:

> Antes da publicação, a fonte de verdade é editorial e privada. Depois da publicação, a fonte de verdade é pública, versionada e reproduzível.

---

# 2. Resultado da reavaliação

## 2.1. Decisões mantidas

| Decisão anterior | Resultado |
|---|---|
| Astro como gerador estático | Mantida |
| Markdown para prosa | Mantida |
| JSON para estrutura complexa | Mantida |
| Pagefind para busca | Mantida |
| GitHub Pages para hospedagem | Mantida |
| GitHub Actions para validação e build | Mantida |
| ZIP com timestamp e checksum | Mantida |
| Google Drive como arquivo de preservação | Mantida |
| Git como histórico público | Mantida |
| URLs permanentes | Mantida |
| correções como novas revisões | Mantida |
| arquivo por data, canal, tema, autor e história | Mantida |
| site sem banco no runtime | Mantida |
| leitura básica sem JavaScript | Mantida |
| TDD, dry-run e apply | Mantida |

## 2.2. Decisões alteradas

| Tema | Plano anterior | Plano reavaliado |
|---|---|---|
| produção do texto | Markdown/JSON diretamente | Google Docs durante elaboração e revisão |
| controle editorial | não definido operacionalmente | Google Sheets na fase inicial |
| orquestração | CLI própria como centro | n8n coordena; CLI executa regras determinísticas |
| publicação no Git | commit direto permitido inicialmente | pull request obrigatório no fluxo normal |
| formato da publicação | diretório com vários JSONs | Markdown com front matter + JSONs auxiliares |
| Google Drive | arquivo de ZIPs | ambiente de trabalho + arquivo imutável, em áreas separadas |
| descoberta de pauta | fora do escopo | FreshRSS, Gmail, SearXNG e Calendar |
| monitoramento | logs e smoke tests | Uptime Kuma + GitHub Actions + ntfy opcional |
| infraestrutura local | scripts locais | Docker Compose + PostgreSQL + serviços locais |
| banco editorial futuro | indefinido | Sheets primeiro; NocoDB apenas por gatilho |
| analytics | genérico | Matomo somente após tráfego justificar |
| acervo documental | genérico | Paperless-ngx somente após volume justificar |

## 2.3. Decisões descartadas

- publicar diretamente no branch principal como fluxo padrão;
- usar o Drive como fonte de dados consultada pelo site;
- usar o Sheets como fonte pública em runtime;
- armazenar o corpo da matéria em strings JSON;
- duplicar todos os metadados em Sheets, front matter e JSON sem regra de precedência;
- tornar a máquina local necessária para servir o portal;
- instalar NocoDB, Matomo e Paperless-ngx desde o primeiro dia;
- expor n8n, PostgreSQL ou painéis administrativos à internet.

---

# 3. Princípios arquiteturais

## 3.1. Uma fonte de verdade por fase e tipo de dado

A expressão “fonte de verdade” precisa considerar o ciclo de vida.

| Informação | Durante elaboração | Após publicação |
|---|---|---|
| texto | Google Docs | GitHub |
| status editorial | Google Sheets | GitHub + Sheets sincronizado |
| arquivos de trabalho | Google Drive | Drive |
| pacote publicado | inexistente | ZIP imutável no Drive |
| código | GitHub | GitHub |
| página pública | preview do PR | GitHub Pages |
| agenda | Google Calendar | Calendar |
| fontes recorrentes | FreshRSS | não publicável diretamente |
| histórico técnico | n8n/PostgreSQL | GitHub + relatório da execução |
| correção pública | Sheets/Docs durante preparação | GitHub + página de correções |

O handoff ocorre no estado `PRONTO_PARA_PUBLICAR`.

Depois que o conteúdo é exportado e aprovado no pull request:

- o Google Docs deixa de ser autoridade sobre a versão pública;
- alterações posteriores devem entrar como correção ou atualização;
- o GitHub passa a representar a versão pública vigente;
- o ZIP registra a revisão imutável correspondente.

## 3.2. Automação não decide o mérito editorial

A automação pode:

- coletar;
- normalizar;
- deduplicar;
- validar;
- converter;
- empacotar;
- criar branch;
- abrir pull request;
- gerar preview;
- publicar após aprovação;
- sincronizar status;
- alertar.

A automação não pode, sem decisão humana explícita:

- aprovar pauta;
- considerar uma alegação verdadeira;
- substituir revisão factual;
- publicar acusação;
- retirar contexto;
- alterar opinião editorial;
- corrigir silenciosamente;
- publicar conteúdo sensível;
- responder fonte;
- fundir pull request;
- excluir documento;
- publicar diretamente em `main`.

## 3.3. Máquina local opera; site público permanece

A máquina local executará:

- n8n;
- PostgreSQL;
- FreshRSS;
- SearXNG;
- Uptime Kuma;
- ntfy opcional;
- exportação;
- empacotamento;
- testes locais;
- integração com Google;
- criação de pull requests.

A máquina local não servirá o portal público.

Com a máquina desligada:

### Param

- coleta local;
- automações;
- sincronizações;
- pesquisa SearXNG;
- monitoramento local;
- alertas locais.

### Continuam

- site no GitHub Pages;
- código e conteúdo no GitHub;
- Docs;
- Sheets;
- Drive;
- Gmail;
- Calendar;
- Figma;
- builds já publicados.

## 3.4. Falhar fechado

Os seguintes erros bloqueiam publicação:

- esquema inválido;
- autoria inexistente;
- canal inexistente;
- slug duplicado;
- ID duplicado;
- fonte obrigatória ausente;
- checksum divergente;
- comentário interno detectado;
- link privado detectado;
- mídia sem texto alternativo;
- Markdown inseguro;
- build quebrado;
- teste crítico falho;
- backup obrigatório não confirmado;
- revisão editorial ou factual incompleta.

## 3.5. Desenvolvimento incremental

Cada unidade deve seguir:

```text
teste
    ↓
fixture
    ↓
dry-run
    ↓
implementação
    ↓
apply
    ↓
regressão
```

---

# 4. Arquitetura consolidada

```text
┌──────────────────────────────────────────────────────────────────┐
│ FONTES E ENTRADAS                                                 │
│ Gmail · FreshRSS · SearXNG · Calendar · documentos · equipe      │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ CONTROLE EDITORIAL PRIVADO                                       │
│ Google Sheets                                                    │
│ pautas · artigos · status · responsáveis · revisão · prazos      │
│                                                                  │
│ Google Docs                                                      │
│ texto · comentários · sugestões · revisão humana                 │
│                                                                  │
│ Google Drive                                                     │
│ pesquisa · imagens · documentos · originais · arquivos de apoio  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                    status PRONTO_PARA_PUBLICAR
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ AUTOMAÇÃO LOCAL                                                  │
│ n8n + PostgreSQL                                                 │
│                                                                  │
│ lê Sheets e Docs                                                 │
│ sanitiza                                                         │
│ chama CLI determinística                                         │
│ cria pacote                                                      │
│ envia ZIP ao Drive                                               │
│ cria branch e pull request                                       │
│ registra execução                                                │
│ emite alerta                                                     │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ PACOTE PÚBLICO NORMALIZADO                                       │
│ manifest.json · publication.md · sources.json · mídia derivada   │
│ checksums.sha256 · relatório de proveniência sanitizado          │
└─────────────────────┬─────────────────────────┬──────────────────┘
                      │                         │
                      ▼                         ▼
          ┌────────────────────┐     ┌────────────────────────────┐
          │ GOOGLE DRIVE       │     │ GITHUB                     │
          │ ZIP imutável       │     │ branch → PR → revisão      │
          │ originais privados │     │ conteúdo público           │
          └────────────────────┘     └─────────────┬──────────────┘
                                                  │
                                                  ▼
                                    ┌────────────────────────────┐
                                    │ GITHUB ACTIONS             │
                                    │ validate · test · build    │
                                    │ Pagefind · feeds · sitemap │
                                    │ artefato · deploy          │
                                    └─────────────┬──────────────┘
                                                  │
                                                  ▼
                                    ┌────────────────────────────┐
                                    │ GITHUB PAGES               │
                                    │ portal estático público    │
                                    └────────────────────────────┘
```

---

# 5. Stack da fase inicial

## 5.1. Serviços externos

| Serviço | Responsabilidade |
|---|---|
| Gmail | comunicações, releases, fontes, pedidos de correção |
| Google Drive | arquivos de trabalho, originais e ZIPs imutáveis |
| Google Docs | escrita e revisão |
| Google Sheets | controle editorial |
| Google Calendar | agenda, prazos, entrevistas, embargos |
| Google Contacts | contatos profissionais não sensíveis |
| GitHub | código, conteúdo público, PRs e histórico |
| GitHub Actions | validação, build e deploy |
| GitHub Pages | hospedagem pública |
| Figma Free | design system e protótipos |

## 5.2. Serviços locais imediatos

| Serviço | Responsabilidade |
|---|---|
| Docker Compose | execução portátil dos serviços |
| PostgreSQL | persistência do n8n e registros operacionais |
| n8n Community | orquestração |
| FreshRSS | central de feeds |
| SearXNG | metabusca |
| Uptime Kuma | monitoramento |
| CLI Subsolo | validação e efeitos determinísticos |

## 5.3. Serviço opcional inicial

| Serviço | Responsabilidade |
|---|---|
| ntfy | alertas acionáveis |

## 5.4. Serviços adiados

| Serviço | Gatilho de adoção |
|---|---|
| NocoDB | Sheets lento, relações complexas ou permissões insuficientes |
| Matomo | tráfego real que justifique analytics |
| Paperless-ngx | acervo documental grande que exija OCR e classificação |

## 5.5. Ferramentas do portal

- Astro;
- TypeScript;
- Markdown;
- YAML front matter;
- JSON;
- Zod;
- JSON Schema;
- Pagefind;
- CSS nativo;
- JavaScript progressivo;
- Vitest;
- Playwright;
- axe-core;
- ESLint;
- Stylelint;
- html-validate;
- link checker.

---

# 6. Divisão de responsabilidades

## 6.1. Google Sheets

Responsável por:

- pauta;
- prioridade;
- responsável;
- editor;
- canal provável;
- status;
- prazo;
- links para Docs e Drive;
- revisões;
- branch;
- pull request;
- URL publicada;
- revisão publicada;
- erros operacionais resumidos.

Não responsável por:

- corpo final do conteúdo;
- código;
- HTML;
- arquivos públicos;
- histórico técnico detalhado;
- mídia binária.

## 6.2. Google Docs

Responsável por:

- elaboração;
- comentários;
- sugestões;
- revisão textual;
- notas internas;
- pendências.

Não responsável por:

- versão pública depois do merge;
- schema público;
- rota;
- build;
- arquivo público.

## 6.3. Google Drive

Responsável por duas áreas separadas.

### Área de trabalho

- pesquisa;
- imagens originais;
- entrevistas;
- documentos;
- PDFs;
- transcrições;
- identidade;
- modelos;
- material não publicável.

### Área de preservação

- ZIPs de edição;
- relatórios;
- checksums;
- backups locais criptografados;
- originais de mídia publicados.

A área de preservação não deve ser usada como pasta de edição cotidiana.

## 6.4. n8n

Responsável por:

- gatilhos;
- coordenação;
- chamadas a APIs;
- leitura de Sheets;
- leitura de Docs;
- movimentação controlada;
- criação de branch e PR;
- sincronização de status;
- retries;
- alertas;
- relatório da execução.

Não responsável por:

- regras complexas de domínio implementadas em nós dispersos;
- validação final exclusiva;
- renderização do site;
- armazenamento canônico do conteúdo;
- decisão editorial.

## 6.5. CLI Subsolo

Responsável por operações determinísticas e testáveis:

```text
subsolo validate
subsolo export-doc
subsolo package
subsolo ingest
subsolo verify
subsolo restore
subsolo migrate
subsolo report
```

O n8n deve chamar a CLI para regras críticas, em vez de reproduzir lógica em JavaScript espalhado por workflows.

## 6.6. GitHub

Responsável por:

- código;
- conteúdo publicável;
- revisão final;
- histórico;
- correções;
- redirects;
- build reproduzível;
- deploy.

## 6.7. Astro

Responsável por:

- ler conteúdo público;
- validar novamente;
- gerar páginas;
- gerar arquivo;
- gerar páginas de história;
- gerar metadados;
- gerar feeds;
- produzir HTML.

## 6.8. Pagefind

Responsável somente pelo índice público de busca.

---

# 7. Fluxo editorial

## 7.1. Descoberta

Entradas:

- FreshRSS;
- Gmail;
- SearXNG;
- agenda;
- documentos;
- equipe;
- fonte;
- acompanhamento anterior.

Saída:

- pauta preliminar no Sheets;
- nenhuma publicação automática.

## 7.2. Triagem

A pauta recebe:

- `pauta_id`;
- título provisório;
- origem;
- URL;
- prioridade;
- relevância;
- canal provável;
- responsável;
- editor;
- prazo;
- status.

Estados possíveis:

```text
IDEIA
TRIAGEM
APROVADA
RECUSADA
ARQUIVADA
AGUARDANDO_INFORMACAO
```

## 7.3. Pesquisa

O material fica no Drive.

A planilha referencia:

- pasta;
- documento principal;
- fontes;
- datas;
- responsáveis.

## 7.4. Produção

O Google Docs usa um modelo padronizado.

Cabeçalho editorial privado:

```text
Artigo ID:
Pauta ID:
Título:
Slug:
Canal:
Quadro:
Tipo:
Autor:
Editor:
Status:
Data planejada:
Resumo:
Descrição:
Fontes principais:
Pendências:
Observações:
```

O cabeçalho não é publicado diretamente.

## 7.5. Revisões

Estados:

```text
EM_PRODUCAO
AGUARDANDO_FONTE
REVISAO_EDITORIAL
REVISAO_FACTUAL
AJUSTES
PRONTO_PARA_PUBLICAR
```

A transição para `PRONTO_PARA_PUBLICAR` exige:

- texto final;
- título;
- slug;
- canal;
- tipo;
- autoria;
- editor;
- revisão editorial concluída;
- revisão factual concluída;
- fontes;
- mídia autorizada;
- alt;
- ausência de pendências;
- data planejada.

## 7.6. Exportação

O n8n:

1. detecta artigo pronto;
2. adquire lock por `artigo_id`;
3. lê a linha no Sheets;
4. lê o Docs;
5. verifica revisões;
6. remove conteúdo privado;
7. converte para Markdown;
8. transforma metadados;
9. chama `subsolo validate`;
10. gera arquivos públicos;
11. chama `subsolo package`;
12. envia ZIP ao Drive;
13. cria branch;
14. adiciona conteúdo;
15. cria commit;
16. abre PR;
17. atualiza Sheets;
18. envia alerta.

## 7.7. Revisão no pull request

O PR representa a última fronteira humana antes da publicação.

Deve conter:

- artigo ou edição;
- resumo;
- autores;
- canais;
- fontes;
- validações;
- preview;
- checksum;
- link para o Docs privado apenas para revisores autorizados;
- checklist.

## 7.8. Merge e deploy

Após aprovação:

1. merge em `main`;
2. CI repete validações;
3. Astro gera o site;
4. Pagefind gera o índice;
5. feeds e sitemap são gerados;
6. artefato é verificado;
7. GitHub Pages recebe deploy;
8. smoke tests são executados;
9. Sheets recebe URL;
10. status muda para `PUBLICADO`;
11. relatório é finalizado;
12. ntfy pode notificar.

---

# 8. Edição diária

## 8.1. Conceito

A edição diária é uma entidade agregadora, não um arquivo HTML único.

Ela possui:

- data;
- identidade;
- ordem editorial;
- conteúdos previstos internamente;
- conteúdos publicados;
- revisão;
- fechamento;
- destaque;
- canais presentes;
- correções.

## 8.2. Edição operacional e edição pública

### Edição operacional privada

Pode incluir:

- pauta prevista;
- slot reservado;
- responsável;
- gatilho;
- horário;
- plano B;
- conteúdo ainda não confirmado.

Fica no Sheets e no Mapa do Dia.

### Edição pública

Inclui apenas:

- conteúdos publicados;
- conteúdos oficialmente agendados que possam ser anunciados;
- datas;
- autores;
- canais;
- links;
- correções.

Nunca deve expor pauta não confirmada ou nota interna.

## 8.3. Revisões ao longo do dia

Fluxo recomendado:

```text
r1 — abertura com BDD e conteúdos já publicados
r2 — inclusão da publicação da tarde
r3 — inclusão da publicação noturna
rf — fechamento editorial do dia
```

Cada revisão:

- gera novo manifest;
- gera novo ZIP;
- declara `supersedes`;
- preserva ZIP anterior;
- atualiza a página da edição;
- não altera URLs já publicadas.

## 8.4. Fechamento

Ao encerrar o dia:

- a edição recebe `status: sealed`;
- o manifesto final é gerado;
- o ZIP final é enviado ao Drive;
- conteúdos posteriores entram como correção ou atualização.

---

# 9. Formato público dos conteúdos

## 9.1. Decisão revisada

Usar:

- `manifest.json` para edição;
- `publication.md` com YAML front matter e corpo Markdown;
- `sources.json` para fontes estruturadas;
- `corrections.json` para histórico;
- `media.json` para mídia;
- `checksums.sha256`.

Isso evita duplicar metadados simples entre `metadata.json` e front matter.

## 9.2. Estrutura da publicação

```text
publications/
└── pub_01K0ABC/
    ├── publication.md
    ├── sources.json
    ├── corrections.json
    └── media.json
```

## 9.3. Exemplo de `publication.md`

```yaml
---
schema_version: "2.0.0"
id: "pub_01K0ABC"
edition_id: "ed_2026-07-20"
title: "A cidade terceirizou o relógio"
slug: "a-cidade-terceirizou-o-relogio"
description: "Contratos fragmentados tornam responsabilidades difíceis de localizar."
channel: "sao-paulo-sob-o-capo"
section: "cidade"
type: "reportagem"
status: "em-desenvolvimento"
authors:
  - "ferro"
editor: "trilho"
topics:
  - "mobilidade"
  - "concessoes"
territories:
  - "sao-paulo"
story_id: "story_operacao-transporte"
published_at: "2026-07-20T08:15:22-03:00"
updated_at: null
featured: true
language: "pt-BR"
image:
  src: "/media/2026/07/pub_01K0ABC/capa.webp"
  alt: "Descrição objetiva da imagem."
---

Corpo da publicação em Markdown.
```

## 9.4. Campos complexos

Fontes, correções e mídia ficam fora do front matter quando tiverem:

- múltiplas propriedades;
- relações;
- histórico;
- evidências;
- versões;
- derivados.

## 9.5. Validação

A cadeia de validação será:

```text
YAML front matter
    ↓ parser
objeto normalizado
    ↓ JSON Schema
contrato externo
    ↓ Zod
coleção Astro
```

---

# 10. Pacote diário

## 10.1. Estrutura

```text
subsolo-edicao-20260720T081522-0300-r1/
├── manifest.json
├── edition.md
├── publications/
│   ├── pub_01K0ABC/
│   │   ├── publication.md
│   │   ├── sources.json
│   │   ├── corrections.json
│   │   └── media.json
│   └── pub_01K0DEF/
├── media/
│   └── derived/
├── reports/
│   ├── validation.json
│   └── provenance.public.json
├── publication-run.json
└── checksums.sha256
```

## 10.2. Conteúdo proibido

O pacote não pode conter:

- comentários do Docs;
- histórico de sugestões;
- e-mails privados;
- telefones;
- fontes protegidas;
- instruções de pauta;
- observações jurídicas;
- IDs internos desnecessários;
- tokens;
- credenciais;
- links privados;
- originais sem autorização;
- logs com segredos.

## 10.3. Nome

```text
subsolo-edicao-YYYYMMDDTHHMMSS±HHMM-rN.zip
```

## 10.4. Imutabilidade

Um ZIP publicado:

- não é sobrescrito;
- não é refeito com o mesmo `run_id`;
- recebe checksum;
- recebe revisão;
- aponta para revisão anterior quando houver.

---

# 11. Estrutura do Google Drive

```text
SUBSOLO/
├── 00_ADMINISTRACAO/
├── 01_PAUTAS/
├── 02_PESQUISA/
├── 03_EM_PRODUCAO/
├── 04_REVISAO/
├── 05_PRONTOS_PARA_PUBLICAR/
├── 06_PUBLICADOS/
├── 07_CORRECOES/
├── 08_IMAGENS/
├── 09_FONTES_E_DOCUMENTOS/
├── 10_ARQUIVO_EDITORIAL/
└── 90_ARQUIVO_TECNICO/
    ├── edicoes/
    │   └── 2026/
    │       └── 07/
    ├── relatorios/
    ├── schemas/
    ├── originais-publicados/
    ├── backups-criptografados/
    └── recuperacao/
```

## 11.1. Separação obrigatória

- `10_ARQUIVO_EDITORIAL`: organização humana do acervo;
- `90_ARQUIVO_TECNICO`: artefatos imutáveis e recuperação.

## 11.2. Upload

O n8n coordena o upload.

A CLI:

- gera checksum;
- gera nome;
- prepara metadados;
- verifica arquivo.

O upload só é confirmado após:

- file ID;
- tamanho;
- nome;
- pasta;
- revisão;
- checksum local registrado.

---

# 12. Google Sheets

## 12.1. Abas mínimas

```text
PAUTAS
ARTIGOS
EDICOES
AUTORES
CANAIS
QUADROS
TEMAS
FONTES
PUBLICACOES
CORRECOES
AUTOMACOES
CONFIGURACOES
```

## 12.2. Aba EDICOES

Campos:

| Campo | Função |
|---|---|
| edition_id | identidade |
| edition_date | data |
| status | planejada, aberta, fechada, selada |
| revision | revisão pública |
| mapa_do_dia | link privado |
| manifest_path | caminho técnico |
| package_checksum | checksum |
| drive_file_id | ZIP |
| branch | branch |
| pull_request | PR |
| commit_sha | commit |
| deployment_url | URL |
| opened_at | abertura |
| sealed_at | fechamento |
| last_error | último erro |

## 12.3. Aba ARTIGOS

Campos mínimos:

- artigo_id;
- pauta_id;
- edition_id;
- título;
- slug;
- canal;
- quadro;
- tipo;
- autor;
- editor;
- prioridade;
- status;
- documento;
- pasta;
- imagem;
- alt;
- revisão editorial;
- revisão factual;
- data planejada;
- data publicada;
- branch;
- PR;
- URL;
- revisão;
- última atualização.

## 12.4. Validação

Todas as colunas classificatórias devem usar valores controlados.

## 12.5. Regra de sincronização

Depois do merge:

- GitHub determina versão pública;
- n8n atualiza o Sheets;
- divergência gera alerta;
- Sheets não sobrescreve automaticamente conteúdo já publicado.

---

# 13. n8n

## 13.1. Workflows

```text
00_healthcheck
01_ingestao_freshrss
02_triagem_gmail
03_sincronizacao_editorial
04_exportacao_google_docs
05_empacotamento_edicao
06_backup_google_drive
07_criacao_pull_request
08_confirmacao_publicacao
09_correcao_publicada
10_backup_servicos_locais
11_alertas_operacionais
```

## 13.2. Padrão de workflow

Cada workflow deve ter:

- objetivo único;
- input explícito;
- output explícito;
- versão;
- correlação por `run_id`;
- idempotency key;
- timeout;
- retry controlado;
- dead-letter lógico;
- dry-run;
- logs;
- credencial separada;
- documentação;
- execução manual;
- teste com fixture.

## 13.3. Estado operacional

O PostgreSQL pode guardar:

- execuções;
- locks;
- idempotency keys;
- retries;
- checkpoints;
- hashes;
- resultados;
- erros;
- referências externas.

Não deve guardar a única cópia do conteúdo.

## 13.4. Regra de lógica

Regras como:

- slug;
- schema;
- checksum;
- empacotamento;
- transições;
- referências;
- sanitização;
- comparação de revisão;

devem estar em biblioteca e CLI testada, não apenas em nós do n8n.

---

# 14. FreshRSS, Gmail e SearXNG

## 14.1. FreshRSS

Função:

- leitura centralizada;
- organização de fontes;
- histórico;
- marcação;
- entrada para triagem.

Não é fonte factual final.

Um item RSS nunca deve chegar diretamente a `PRONTO_PARA_PUBLICAR`.

## 14.2. Gmail

O fluxo pode:

- localizar mensagens;
- classificar preliminarmente;
- extrair anexos;
- criar pauta;
- aplicar marcador;
- alertar.

Não pode:

- responder fonte automaticamente em assunto sensível;
- apagar mensagem;
- tratar release como confirmação independente;
- publicar anexo sem inspeção.

## 14.3. SearXNG

Função:

- descoberta;
- comparação;
- busca inicial;
- localização de documentos.

Não é:

- arquivo de evidências;
- fonte citável por si;
- garantia de anonimato;
- substituto da leitura da fonte.

---

# 15. Infraestrutura local

## 15.1. Docker Compose

Serviços iniciais:

```text
postgres
n8n
freshrss
searxng
uptime-kuma
ntfy opcional
```

## 15.2. Estrutura

```text
infra/
├── compose.yml
├── compose.override.example.yml
├── env/
│   └── .env.example
├── postgres/
├── n8n/
├── freshrss/
├── searxng/
├── uptime-kuma/
├── ntfy/
├── scripts/
│   ├── backup.sh
│   ├── restore.sh
│   ├── healthcheck.sh
│   └── update.sh
└── docs/
```

## 15.3. Regras de portabilidade

- volumes nomeados;
- nenhuma dependência de caminho absoluto do Windows;
- variáveis de ambiente;
- imagens com versão fixada;
- configuração versionada sem segredos;
- backups portáveis;
- documentação de portas;
- rede interna;
- sem encaminhamento no roteador;
- restauração testada.

## 15.4. Perfis

```text
core
alerts
future-nocodb
future-matomo
future-paperless
```

Serviços futuros não devem consumir recursos por padrão.

---

# 16. Repositório

```text
subsolo/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── ci.yml
│       ├── preview.yml
│       ├── deploy-pages.yml
│       └── scheduled-checks.yml
├── content/
│   ├── editions/
│   ├── publications/
│   ├── stories/
│   ├── authors/
│   ├── channels/
│   └── topics/
├── data/
│   ├── redirects.json
│   └── site.json
├── schemas/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   └── lib/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
├── public/
│   ├── media/
│   ├── icons/
│   └── static/
├── cli/
├── scripts/
├── infra/
├── tests/
│   ├── unit/
│   ├── contract/
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/
│   └── golden/
├── docs/
│   ├── architecture/
│   ├── operations/
│   ├── workflows/
│   └── adr/
└── README.md
```

---

# 17. Git e pull requests

## 17.1. Branches

```text
main
develop opcional
publish/ed_2026-07-20-r1
correction/pub_01K0ABC-r2
feature/...
fix/...
```

## 17.2. Regra normal

Nenhuma publicação editorial entra diretamente em `main`.

Fluxo:

```text
branch
  ↓
commit
  ↓
pull request
  ↓
preview
  ↓
revisão
  ↓
aprovação
  ↓
merge
  ↓
deploy
```

## 17.3. Exceção emergencial

Uma correção urgente pode usar fluxo acelerado, mas ainda deve:

- criar branch;
- executar CI;
- registrar motivo;
- receber aprovação;
- gerar revisão;
- preservar histórico.

## 17.4. Commit

```text
publish: edição 2026-07-20 r1
```

Corpo:

```text
Edition: ed_2026-07-20
Run: run_20260720T081522-0300
Revision: 1
Package SHA256: ...
Drive File ID: ...
Publications: 12
```

---

# 18. GitHub Actions

## 18.1. CI

Executa:

1. instalação travada;
2. lint;
3. schemas;
4. validação de conteúdo;
5. detecção de conteúdo privado;
6. testes unitários;
7. testes de contrato;
8. testes de integração;
9. Astro build;
10. Pagefind;
11. sitemap;
12. feeds;
13. HTML validation;
14. links;
15. acessibilidade;
16. smoke test local.

## 18.2. Preview

Para pull requests:

- gera build;
- produz artefato;
- executa screenshots de rotas críticas;
- gera relatório;
- fornece forma de revisão visual.

A estratégia de preview não deve expor dados do Docs ou Drive.

## 18.3. Deploy

Após merge em `main`:

- repete validações;
- gera artefato Pages;
- publica;
- verifica URLs;
- registra deployment;
- disponibiliza resultado para n8n sincronizar.

## 18.4. Concorrência

Deploys devem ser serializados.

Uma edição não pode ser substituída por build mais antigo.

---

# 19. Portal e arquivo

## 19.1. Rotas

```text
/
/agora/
/edicoes/
/edicoes/2026/07/20/
/2026/07/20/slug/
/canais/
/canais/bom-dia-distopia/
/temas/
/temas/mobilidade/
/redacao/
/redacao/cora/
/historias/
/historias/operacao-transporte/
/arquivo/
/arquivo/2026/
/arquivo/2026/07/
/arquivo/2026/07/20/
/busca/
/correcoes/
/a-redacao/
```

## 19.2. Arquivo estático

O build agrupa publicações por:

- data;
- canal;
- tema;
- autor;
- tipo;
- estado;
- território;
- história.

## 19.3. Arquivo vivo

A página de história reúne:

- resumo atual;
- cronologia;
- publicações;
- documentos públicos;
- atores;
- promessas;
- prazos;
- contradições;
- questões abertas;
- próximo evento.

## 19.4. Busca

Pagefind indexa:

- título;
- subtítulo;
- corpo;
- intertítulos;
- autor;
- canal;
- tema;
- história.

Não indexa:

- navegação;
- rodapé;
- controles;
- texto repetido;
- metadados internos.

## 19.5. Filtros

Gerar:

- páginas pré-compiladas para navegação;
- `archive-index.json` compacto para combinações no navegador.

---

# 20. Correções, atualizações e retiradas

## 20.1. Correção

Fluxo:

1. solicitação registrada;
2. avaliação;
3. alteração em Docs ou branch;
4. nova revisão;
5. novo ZIP;
6. novo PR;
7. nota pública;
8. merge;
9. atualização de Sheets.

## 20.2. Atualização material

Diferente de correção factual.

Deve indicar:

- fato novo;
- horário;
- impacto;
- trecho alterado.

## 20.3. Retirada

A URL permanece.

A página-túmulo informa:

- retirada;
- data;
- motivo;
- política;
- correções relacionadas;
- contato.

## 20.4. Não sobrescrever

- ZIP anterior permanece;
- commit anterior permanece;
- revisão anterior permanece referenciada;
- a página pública mostra o histórico necessário.

---

# 21. Mídia

## 21.1. Originais

Ficam no Drive.

## 21.2. Derivados públicos

- AVIF;
- WebP;
- fallback quando necessário;
- thumbnail;
- social card.

## 21.3. Validações

- autorização;
- licença;
- crédito;
- alt;
- tamanho;
- dimensões;
- MIME;
- remoção de EXIF desnecessário.

## 21.4. Repositório

Somente derivados otimizados.

Quando o tamanho do site justificar, mover mídia pública para object storage; essa decisão permanece adiada.

---

# 22. Segurança

## 22.1. Serviços locais

- somente localhost ou rede interna;
- sem portas expostas no roteador;
- senhas distintas;
- PostgreSQL não público;
- painel n8n não público;
- backups criptografados;
- atualizações planejadas.

## 22.2. Credenciais

Armazenar em:

- cofre do n8n;
- variáveis de ambiente;
- GitHub Secrets;
- gerenciador de senhas.

Nunca em:

- Sheets;
- Docs;
- Markdown;
- commit;
- issue;
- log;
- alerta.

## 22.3. Sanitização

O exportador deve bloquear:

- comentários;
- notas internas;
- e-mails pessoais;
- telefones;
- fontes confidenciais;
- tokens;
- links privados;
- texto marcado como pendente;
- HTML arbitrário;
- iframes;
- scripts.

## 22.4. Permissões mínimas

- Gmail apenas conforme necessidade;
- Drive limitado à estrutura Subsolo quando viável;
- token GitHub limitado ao repositório;
- Actions com permissões explícitas;
- contas de serviço separadas;
- nenhum segredo no artefato.

---

# 23. Backups

## 23.1. Backup editorial

Já existe redundância parcial em:

- GitHub;
- Drive;
- Docs;
- Sheets;
- Figma.

## 23.2. Backup local

Diário:

- PostgreSQL;
- n8n;
- FreshRSS;
- configurações;
- Compose;
- volumes críticos.

Semanal:

- pacote criptografado no Drive.

Mensal:

- restauração em ambiente limpo;
- verificação de integridade;
- relatório.

## 23.3. Tipos separados

Não misturar:

- ZIP público de edição;
- backup operacional de serviços;
- originais editoriais;
- artefato de build.

---

# 24. Observabilidade

## 24.1. Uptime Kuma

Monitora:

- home pública;
- RSS;
- sitemap;
- rotas críticas;
- n8n;
- FreshRSS;
- SearXNG;
- PostgreSQL por healthcheck;
- serviços Docker.

## 24.2. Limitação

O Kuma local não detecta a própria queda da máquina.

Mitigação inicial:

- GitHub Actions verifica site após deploy;
- falhas de publicação ficam no GitHub;
- operador verifica ausência de rotinas;
- monitor externo é decisão futura.

## 24.3. ntfy

Alertas devem informar:

- entidade;
- etapa;
- erro;
- se é retryable;
- ação recomendada;
- link quando aplicável.

## 24.4. Relatório de execução

Campos:

- run_id;
- edition_id;
- revision;
- status;
- timestamps;
- duração;
- package checksum;
- Drive file ID;
- branch;
- PR;
- commit;
- deployment;
- checks;
- erro;
- retries.

---

# 25. Idempotência e consistência

## 25.1. Chaves

- `pauta_id`;
- `artigo_id`;
- `edition_id`;
- `run_id`;
- `revision`;
- package checksum;
- Docs file ID;
- Drive file ID;
- branch;
- PR.

## 25.2. Locks

O n8n/PostgreSQL deve impedir duas exportações simultâneas da mesma entidade.

## 25.3. Reconciliação

Workflow periódico compara:

- Sheets;
- GitHub;
- Drive;
- estado das execuções.

Exemplos de divergência:

- Sheets diz publicado, mas URL falha;
- PR merged, mas Sheets permanece aguardando;
- ZIP no Drive, mas commit ausente;
- commit existe, mas revisão não foi registrada;
- dois PRs para o mesmo artigo.

A divergência gera alerta; não deve ser corrigida silenciosamente quando houver risco editorial.

---

# 26. Testes

## 26.1. Conteúdo

- front matter;
- ID;
- slug;
- autor;
- editor;
- canal;
- tema;
- datas;
- fontes;
- imagem;
- alt;
- links;
- caracteres;
- Markdown;
- HTML inseguro;
- conteúdo privado.

## 26.2. Domínio

- máquina de estados;
- revisão;
- empacotamento;
- checksums;
- relações;
- URLs;
- paginação;
- agrupamentos;
- edição selada;
- correção;
- tombstone.

## 26.3. Automação

- mesma entrada duas vezes;
- lock;
- falha do Docs;
- falha do Sheets;
- falha do Drive;
- token inválido;
- branch existente;
- PR existente;
- build falho;
- deploy falho;
- timeout;
- retry;
- reconciliação.

## 26.4. Integração

- Docs mockado → Markdown;
- Sheets mockado → metadata;
- pacote → ZIP;
- ZIP → Drive mockado;
- pacote → Git;
- conteúdo → Astro;
- build → Pagefind;
- merge → deploy;
- deploy → Sheets.

## 26.5. E2E

- home;
- edição;
- matéria;
- canal;
- tema;
- autor;
- história;
- arquivo;
- busca;
- filtros;
- correção;
- tombstone;
- tema visual;
- mobile;
- teclado;
- JS desativado.

## 26.6. Recuperação

- restaurar ZIP;
- restaurar banco;
- reconstruir site;
- comparar rotas;
- validar checksums.

---

# 27. CLI

```text
subsolo validate <workspace|package>
subsolo export-doc <fixture|document>
subsolo package <workspace>
subsolo publish <package> --dry-run
subsolo publish <package> --apply
subsolo ingest <package>
subsolo verify-site <url>
subsolo restore <package>
subsolo migrate <package> --to-schema X
subsolo reconcile
subsolo report <run-id>
```

## 27.1. Dry-run

Mostra:

- arquivos;
- mudanças;
- ZIP;
- pasta Drive;
- branch;
- commit;
- PR;
- status;
- alertas;
- erros.

Não executa efeitos.

## 27.2. Apply

Exige:

- dry-run válido;
- revisão;
- checksum;
- credenciais;
- lock;
- branch autorizado;
- ausência de duplicidade.

---

# 28. Fases de desenvolvimento

# Fase 0 — Consolidação e contratos

## Objetivo

Fixar decisões e contratos.

## Entregas

- ADRs;
- convenções;
- IDs;
- estados;
- schema;
- estrutura do repositório;
- fixtures;
- DoD;
- política de segredos.

## Aceite

- decisões contraditórias removidas;
- fonte de verdade documentada;
- exemplos válidos e inválidos;
- CI mínimo verde.

---

# Fase 1 — Infraestrutura local básica

## Objetivo

Subir a base Docker portátil.

## Entregas

- Compose;
- PostgreSQL;
- n8n;
- FreshRSS;
- SearXNG;
- Uptime Kuma;
- healthchecks;
- volumes;
- backup inicial;
- documentação.

## Aceite

- um comando sobe a stack;
- nenhum painel está público;
- volumes persistem;
- restore básico funciona;
- versões estão fixadas.

---

# Fase 2 — Ambiente editorial Google

## Objetivo

Criar o fluxo humano.

## Entregas

- estrutura Drive;
- planilha;
- validações;
- modelo Docs;
- calendários;
- marcadores Gmail;
- convenções.

## Aceite

- pauta pode atravessar o fluxo;
- transição inválida é bloqueada;
- artigo pronto possui todos os campos;
- nenhuma automação é necessária para o fluxo manual.

---

# Fase 3 — Domínio e schemas

## Objetivo

Implementar contratos determinísticos.

## Entregas

- tipos;
- JSON Schemas;
- parser de front matter;
- Zod;
- estados;
- IDs;
- slugs;
- sanitização;
- fixtures.

## Aceite

- erros legíveis;
- conteúdo privado detectado;
- referências inválidas rejeitadas;
- schema versionado.

---

# Fase 4 — Portal Astro base

## Objetivo

Transformar o Jornal Concreto em aplicação estática.

## Entregas

- tokens;
- layouts;
- home;
- matéria;
- edição;
- canal;
- tema;
- autor;
- história;
- arquivo;
- A Redação;
- responsividade;
- tema claro/escuro.

## Aceite

- dados alimentam páginas;
- nenhuma matéria é codificada manualmente no template;
- leitura funciona sem JS;
- mobile aprovado.

---

# Fase 5 — Publicação manual controlada

## Objetivo

Provar Git → Actions → Pages antes do n8n.

## Entregas

- conteúdo fixture;
- branch;
- PR;
- preview;
- CI;
- deploy;
- smoke test;
- rollback.

## Aceite

- um artigo é publicado sem editar HTML;
- PR é obrigatório;
- build reproduzível;
- URL final funciona.

---

# Fase 6 — Exportador Docs/Sheets

## Objetivo

Converter ambiente editorial para formato público.

## Entregas

- adapters Google;
- mocks;
- exportador;
- sanitizador;
- Markdown;
- front matter;
- sources;
- media metadata;
- relatório.

## Aceite

- comentários internos não vazam;
- output é determinístico;
- falhas não alteram o Git;
- fixture cobre casos críticos.

---

# Fase 7 — Pacote de edição e Drive

## Objetivo

Gerar preservação imutável.

## Entregas

- manifest;
- ZIP;
- checksum;
- revisões;
- upload;
- confirmação;
- restore do pacote.

## Aceite

- ZIP válido;
- revisão anterior preservada;
- duplicidade detectada;
- recuperação demonstrada.

---

# Fase 8 — n8n de publicação

## Objetivo

Orquestrar o fluxo sem duplicar domínio.

## Entregas

- sync Sheets;
- exportação;
- package;
- Drive;
- branch;
- PR;
- status;
- alertas;
- idempotência;
- dry-run.

## Aceite

- mesma entrada não duplica;
- erro é acionável;
- lock funciona;
- PR inclui relatório;
- `main` não recebe commit direto.

---

# Fase 9 — Edição diária incremental

## Objetivo

Publicar r1, revisões e fechamento.

## Entregas

- aba EDICOES;
- edição aberta;
- inclusão de publicações;
- manifest revisions;
- edição selada;
- página diária.

## Aceite

- cada revisão gera ZIP;
- itens não publicados não vazam;
- fechamento é reproduzível;
- URLs permanecem.

---

# Fase 10 — Arquivo e busca

## Objetivo

Transformar acervo em produto.

## Entregas

- arquivo por data;
- canal;
- tema;
- autor;
- história;
- paginação;
- Pagefind;
- filtros;
- feeds;
- sitemap.

## Aceite

- todo conteúdo aparece;
- busca não indexa ruído;
- filtros funcionam;
- páginas funcionam sem backend.

---

# Fase 11 — Captação editorial

## Objetivo

Integrar fontes sem automatizar publicação.

## Entregas

- FreshRSS;
- Gmail;
- SearXNG;
- deduplicação;
- pauta preliminar;
- relatórios.

## Aceite

- entradas criam apenas pautas;
- duplicidade controlada;
- release não vira fato confirmado;
- fonte original preservada.

---

# Fase 12 — Correções e retiradas

## Objetivo

Formalizar pós-publicação.

## Entregas

- correção;
- atualização;
- nova revisão;
- tombstone;
- redirects;
- página de correções.

## Aceite

- histórico visível;
- ZIP anterior preservado;
- retirada não gera 404 silencioso;
- Sheets e Git reconciliados.

---

# Fase 13 — Mídia

## Objetivo

Publicar derivados seguros.

## Entregas

- pipeline;
- formatos;
- thumbnails;
- social cards;
- alt;
- licenças;
- créditos;
- originais no Drive.

## Aceite

- original pesado não vai ao Pages;
- mídia ausente bloqueia build;
- metadados completos.

---

# Fase 14 — Observabilidade e backup

## Objetivo

Operar diariamente.

## Entregas

- Kuma;
- ntfy;
- logs;
- relatórios;
- backup PostgreSQL;
- backup n8n;
- backup FreshRSS;
- restore mensal;
- reconciliação.

## Aceite

- falhas críticas alertam;
- backup restaura;
- site permanece quando máquina desliga;
- divergências são detectadas.

---

# Fase 15 — Hardening e release 1.0

## Objetivo

Estabilizar operação.

## Entregas

- segurança;
- acessibilidade;
- performance;
- documentação;
- runbooks;
- treinamento;
- auditoria;
- release.

## Aceite

- fluxo completo testado;
- recuperação testada;
- segredos ausentes;
- operação documentada;
- portal aprovado em desktop e mobile.

---

# 29. Ordem recomendada

```text
contratos
  ↓
infra local
  ↓
ambiente Google
  ↓
domínio
  ↓
portal
  ↓
publicação manual
  ↓
exportador
  ↓
ZIP e Drive
  ↓
n8n
  ↓
edição diária
  ↓
arquivo e busca
  ↓
captação
  ↓
correções
  ↓
mídia
  ↓
operação
```

A publicação manual controlada deve funcionar antes da automação completa.

---

# 30. Releases

```text
0.1.x — infraestrutura e contratos
0.2.x — ambiente editorial e domínio
0.3.x — portal Astro
0.4.x — publicação manual
0.5.x — exportação Docs/Sheets
0.6.x — pacote e Drive
0.7.x — n8n
0.8.x — edição, arquivo e busca
0.9.x — hardening e operação
1.0.0 — publicação diária estável
```

---

# 31. Critérios de adoção de serviços adiados

## 31.1. NocoDB

Adotar quando dois ou mais ocorrerem:

- Sheets lento;
- relações difíceis;
- edição acidental frequente;
- permissões insuficientes;
- múltiplas equipes simultâneas;
- histórico operacional inadequado;
- automações frágeis por células;
- necessidade de kanban e formulários melhores.

## 31.2. Matomo

Adotar quando:

- tráfego justificar análise;
- objetivo de medição estiver definido;
- política de privacidade estiver pronta;
- manutenção local estiver disponível.

## 31.3. Paperless-ngx

Adotar quando:

- acervo documental crescer;
- busca manual falhar;
- OCR tiver valor real;
- armazenamento e backup suportarem.

## 31.4. VPS

Adotar quando:

- automações precisarem operar com a máquina desligada;
- equipe depender de acesso remoto;
- monitoramento externo for necessário;
- disponibilidade local se tornar gargalo.

---

# 32. Riscos reavaliados

## 32.1. Dependência do ecossistema Google

Mitigação:

- exportadores;
- IDs próprios;
- ZIPs;
- Git;
- formatos abertos;
- nenhuma consulta Google no site público.

## 32.2. Sheets como banco operacional

Mitigação:

- validação;
- listas controladas;
- IDs;
- locks no n8n;
- NocoDB somente quando necessário.

## 32.3. n8n como monólito lógico

Mitigação:

- CLI;
- bibliotecas;
- workflows pequenos;
- testes;
- documentação;
- PostgreSQL apenas operacional.

## 32.4. Máquina desligada

Mitigação:

- site independente;
- publicação manual emergencial;
- workflows retomáveis;
- VPS futura por necessidade.

## 32.5. Quotas gratuitas

Mitigação:

- medir uso;
- builds apenas quando necessário;
- cache;
- mídia otimizada;
- não assumir gratuidade eterna como garantia arquitetural.

## 32.6. Vazamento de notas privadas

Mitigação:

- sanitização;
- allowlist;
- CI;
- revisão de PR;
- detecção de padrões;
- pacote público separado.

## 32.7. Duplicação de estado

Mitigação:

- matriz de autoridade;
- handoff explícito;
- reconciliação;
- Git prevalece após publicação.

---

# 33. Definition of Done

Uma tarefa só está concluída quando:

1. teste foi criado;
2. fixture foi criada;
3. teste falhou pelo motivo esperado;
4. implementação passou;
5. dry-run foi verificado;
6. apply foi verificado quando aplicável;
7. idempotência foi avaliada;
8. segurança foi avaliada;
9. documentação foi atualizada;
10. observabilidade foi incluída;
11. critérios de aceite foram demonstrados;
12. não houve regressão.

---

# 34. Critérios de aceite do projeto

A primeira versão operacional exige:

1. ambiente Docker reproduzível;
2. planilha editorial funcional;
3. modelo Docs funcional;
4. artigo exportável;
5. conteúdo sanitizado;
6. pacote validado;
7. ZIP no Drive;
8. branch e PR automáticos;
9. revisão humana;
10. build Astro;
11. busca Pagefind;
12. arquivo por data e canal;
13. deploy no Pages;
14. URL sincronizada no Sheets;
15. correção versionada;
16. edição diária revisável e selável;
17. backup local;
18. restore testado;
19. nenhuma credencial versionada;
20. nenhum serviço administrativo público;
21. leitura básica sem JavaScript;
22. site público independente da máquina local.

---

# 35. Recomendação final

A arquitetura final é formada por dois sistemas conectados, mas independentes.

## Sistema editorial privado

```text
FreshRSS + Gmail + SearXNG
            ↓
Google Sheets + Docs + Drive + Calendar
            ↓
revisão humana
            ↓
n8n + CLI
```

## Sistema público reproduzível

```text
Markdown + JSON + mídia derivada
            ↓
ZIP imutável no Drive
            ↓
GitHub branch + pull request
            ↓
GitHub Actions
            ↓
Astro + Pagefind
            ↓
GitHub Pages
```

O ponto mais importante da reavaliação é que **Google Docs e Sheets não substituem o formato público padronizado**. Eles formam o ambiente de trabalho.

Da mesma forma, **n8n não substitui o domínio nem o Git**. Ele coordena etapas.

O pacote continua sendo a unidade técnica de preservação; o Git continua sendo a fonte pública; o site continua completamente estático; e a máquina local continua dispensável para a disponibilidade do portal.

Essa composição atende simultaneamente:

- custo incremental inicial igual a zero;
- revisão humana;
- automação;
- rastreabilidade;
- arquivo;
- portabilidade;
- crescimento gradual;
- independência do frontend;
- futura migração para VPS sem reconstrução do produto.
