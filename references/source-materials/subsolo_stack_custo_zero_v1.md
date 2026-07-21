# SUBSOLO — Arquitetura Editorial e Stack Local de Custo Zero

**Versão:** 1.0  
**Data:** 20 de julho de 2026  
**Status:** Documento-base para implementação  
**Objetivo financeiro:** custo incremental de infraestrutura e software igual a **R$ 0** durante a fase inicial  
**Modelo operacional:** serviços locais executados na máquina do projeto, publicação pública via GitHub Pages e uso de planos gratuitos do ecossistema Google, GitHub e Figma

---

# 1. Visão geral

O SUBSOLO será um portal editorial independente cuja operação inicial deve ser tecnicamente sólida, auditável, automatizável e financeiramente sustentável sem contratação de servidores, assinaturas de equipe ou plataformas editoriais pagas.

A arquitetura proposta separa claramente quatro contextos:

1. **Ambiente editorial**, onde pautas, textos, fontes, calendário e arquivos são organizados.
2. **Ambiente de automação local**, onde os fluxos de coleta, validação, transformação e publicação são executados.
3. **Ambiente de versionamento e publicação**, onde o conteúdo publicável entra em controle de versão e é implantado.
4. **Ambiente público**, onde leitores acessam o portal já compilado e independente da máquina local.

O princípio central é:

> A máquina local executa a inteligência operacional, mas o site público não depende dela para permanecer disponível.

Isso significa que a indisponibilidade temporária do computador interrompe automações, coleta de feeds e tarefas locais, mas não derruba o portal publicado no GitHub Pages.

---

# 2. Objetivos da arquitetura

A stack deve atender aos seguintes objetivos:

- manter o custo incremental em R$ 0;
- evitar dependência de um único software proprietário;
- usar serviços pagos apenas quando houver necessidade comprovada;
- permitir produção editorial organizada desde o início;
- possibilitar revisão humana antes da publicação;
- manter histórico de alterações;
- registrar autoria, revisão e decisões editoriais;
- automatizar tarefas repetitivas sem automatizar decisões sensíveis;
- permitir que o portal continue público mesmo com a máquina local desligada;
- facilitar futura migração para VPS sem reconstrução completa;
- priorizar ferramentas abertas e autohospedadas;
- evitar duplicação de dados e múltiplas fontes de verdade;
- permitir crescimento gradual da redação e do acervo;
- preservar rastreabilidade das matérias;
- evitar exposição pública de serviços administrativos locais.

---

# 3. Princípios arquiteturais

## 3.1. Uma fonte de verdade por tipo de dado

Cada tipo de informação deve ter um sistema principal responsável.

| Tipo de dado | Fonte principal |
|---|---|
| Texto em elaboração | Google Docs |
| Controle editorial inicial | Google Sheets |
| Arquivos e imagens de trabalho | Google Drive |
| Agenda e prazos | Google Calendar |
| Contatos profissionais | Google Contacts |
| Código do portal | GitHub |
| Conteúdo publicável | Repositório GitHub |
| Site público | GitHub Pages |
| Automações | n8n local |
| Fontes RSS | FreshRSS local |
| Metabusca | SearXNG local |
| Monitoramento local | Uptime Kuma |
| Alertas | ntfy, quando ativado |
| Design | Figma Free |
| Banco editorial avançado | NocoDB, somente quando necessário |
| Analytics | Matomo, somente após existir tráfego relevante |
| Acervo documental | Paperless-ngx, somente após existir volume justificável |

Não se deve registrar o mesmo status editorial simultaneamente em Google Sheets, Notion, Trello, Slack e GitHub. Isso produz divergência, retrabalho e decisões conflitantes.

---

## 3.2. Automação não substitui decisão editorial

A automação pode:

- coletar;
- comparar;
- classificar preliminarmente;
- validar estrutura;
- gerar rascunhos;
- converter formatos;
- criar branches;
- abrir pull requests;
- emitir alertas;
- preparar relatórios.

A automação não deve, sem regra explícita e aprovação prévia:

- publicar acusações;
- determinar culpa;
- remover contexto;
- alterar posicionamento editorial;
- substituir apuração;
- inventar fontes;
- publicar conteúdo sensível;
- corrigir silenciosamente matéria já publicada;
- excluir documentos;
- responder fontes em nome da redação;
- publicar diretamente no branch principal.

---

## 3.3. Publicação deve ser reproduzível

Todo conteúdo público deve poder ser reconstruído a partir do repositório.

O site não deve depender de dados privados acessados em tempo real pelo navegador do leitor. O navegador não deve consultar diretamente:

- Google Drive privado;
- n8n local;
- NocoDB local;
- Google Sheets privado;
- serviços Docker da máquina;
- credenciais pessoais;
- APIs administrativas.

O processo correto é:

```text
Fonte editorial privada
        ↓
Validação e transformação
        ↓
Arquivo publicável sanitizado
        ↓
GitHub
        ↓
Build
        ↓
GitHub Pages
```

---

## 3.4. Serviços locais não devem ser expostos diretamente

Durante a fase local, serviços administrativos devem operar apenas em:

- `localhost`;
- rede Docker interna;
- rede local controlada, quando necessário;
- portas não encaminhadas no roteador.

Não se deve abrir diretamente para a internet:

- painel do n8n;
- banco PostgreSQL;
- NocoDB;
- SearXNG administrativo;
- Uptime Kuma administrativo;
- Matomo administrativo;
- Paperless-ngx;
- interfaces de banco;
- Portainer, se utilizado.

---

# 4. Stack consolidada

## 4.1. Serviços externos gratuitos

| Serviço | Responsabilidade | Custo inicial |
|---|---|---:|
| Gmail | Recebimento de pautas, fontes, convites e correções | R$ 0 |
| Google Drive | Arquivos editoriais e organização de pastas | R$ 0 |
| Google Docs | Escrita e revisão dos artigos | R$ 0 |
| Google Sheets | Controle editorial inicial | R$ 0 |
| Google Calendar | Agenda editorial e prazos | R$ 0 |
| Google Contacts | Cadastro de contatos profissionais | R$ 0 |
| GitHub | Versionamento, issues, pull requests e automações | R$ 0 |
| GitHub Actions | Build, validação e implantação | R$ 0 dentro dos limites gratuitos |
| GitHub Pages | Hospedagem pública do portal estático | R$ 0 |
| Figma Starter | UX, UI e sistema visual | R$ 0 |
| ChatGPT Plus | Assistência e plugins já disponíveis | custo já existente, sem incremento do projeto |

---

## 4.2. Serviços locais gratuitos

| Serviço | Responsabilidade | Momento de adoção |
|---|---|---|
| n8n Community | Orquestração de automações | Imediato |
| FreshRSS | Centralização de feeds | Imediato |
| SearXNG | Metabusca editorial | Imediato |
| Uptime Kuma | Monitoramento dos serviços | Imediato |
| ntfy | Alertas operacionais | Inicial ou segunda etapa |
| NocoDB Community | Banco editorial estruturado | Quando o Sheets limitar |
| Matomo Community | Analytics do portal | Após existir tráfego |
| Paperless-ngx | Acervo documental e OCR | Após existir acervo relevante |

---

# 5. Componentes em detalhe

# 5.1. Gmail

## Função

O Gmail funcionará como porta de entrada de comunicações externas.

Pode receber:

- sugestões de pauta;
- releases;
- respostas de fontes;
- pedidos de correção;
- denúncias;
- convites;
- credenciais de eventos;
- contatos de leitores;
- comunicações técnicas;
- notificações do GitHub;
- notificações de serviços externos.

## Organização sugerida

Criar marcadores como:

```text
SUBSOLO
SUBSOLO/Pautas
SUBSOLO/Fontes
SUBSOLO/Correções
SUBSOLO/Convites
SUBSOLO/Parcerias
SUBSOLO/Aguardando resposta
SUBSOLO/Arquivado
```

## Uso em automações

O n8n ou uma tarefa do ChatGPT pode:

- localizar mensagens recentes;
- classificar por tipo;
- identificar mensagens sem resposta;
- extrair datas;
- localizar anexos;
- gerar resumo diário;
- criar uma linha preliminar na planilha de pautas;
- emitir alerta para mensagens urgentes.

## Restrições

- não enviar respostas automáticas sensíveis;
- não publicar anexos sem inspeção;
- não considerar um release como fonte independente;
- não armazenar credenciais no texto dos fluxos;
- não excluir e-mails automaticamente;
- não marcar mensagens como resolvidas sem confirmação.

---

# 5.2. Google Drive

## Função

O Drive será o repositório editorial de trabalho.

Ele armazenará:

- documentos em elaboração;
- imagens;
- entrevistas;
- transcrições;
- PDFs;
- fontes;
- notas;
- documentos administrativos;
- versões de identidade;
- materiais recebidos;
- pautas ainda não publicáveis.

## Estrutura recomendada

```text
SUBSOLO/
├── 00_ADMINISTRACAO/
│   ├── Corpo editorial/
│   ├── Manual editorial/
│   ├── Identidade/
│   ├── Políticas/
│   └── Modelos/
├── 01_PAUTAS/
│   ├── Novas/
│   ├── Em triagem/
│   ├── Aprovadas/
│   ├── Recusadas/
│   └── Arquivadas/
├── 02_PESQUISA/
│   ├── Política/
│   ├── São Paulo/
│   ├── Tecnologia/
│   ├── Cultura hacker/
│   ├── Jogos/
│   ├── Xadrez/
│   └── Cultura/
├── 03_EM_PRODUCAO/
├── 04_REVISAO/
├── 05_PRONTOS_PARA_PUBLICAR/
├── 06_PUBLICADOS/
├── 07_CORRECOES/
├── 08_IMAGENS/
├── 09_FONTES_E_DOCUMENTOS/
└── 10_ARQUIVO/
```

## Regra importante

Mover um arquivo de pasta não deve ser a única forma de representar o estado editorial.

A fonte principal do status deve ser a planilha editorial. A pasta serve para organização humana, não para substituir dados estruturados.

---

# 5.3. Google Docs

## Função

O Google Docs será o ambiente principal de escrita, comentário e revisão textual antes da conversão para Markdown.

## Modelo recomendado de documento

Todo artigo deve conter metadados padronizados no início:

```text
Título:
Slug:
Editoria:
Quadro:
Autor:
Editor responsável:
Status:
Data planejada:
Resumo:
Descrição SEO:
Palavras-chave:
Fontes principais:
Observações de publicação:
```

Depois dos metadados:

```text
# Título

## Linha fina

Corpo da matéria.

## Fontes e referências internas

## Pendências de apuração

## Observações editoriais
```

## Regras

- comentários servem para revisão;
- sugestões devem ser resolvidas antes da publicação;
- pendências não podem ser exportadas como texto público;
- links privados devem ser removidos da versão final;
- notas internas devem usar uma marca explícita;
- o documento precisa ter identificador correspondente na planilha;
- o slug não deve ser definido apenas no momento da publicação.

---

# 5.4. Google Sheets

## Função

O Sheets será o primeiro banco editorial do SUBSOLO.

É adequado nesta fase porque:

- não exige servidor;
- é simples de editar;
- permite filtros;
- aceita validação de dados;
- integra facilmente com n8n;
- pode ser consultado pelo ChatGPT;
- é suficiente antes de haver grande volume.

## Planilha principal

Nome sugerido:

```text
SUBSOLO — Controle Editorial
```

## Abas sugeridas

```text
PAUTAS
ARTIGOS
AUTORES
EDITORIAS
QUADROS
FONTES
PUBLICACOES
CORRECOES
AUTOMACOES
CONFIGURACOES
```

## Campos da aba PAUTAS

| Campo | Finalidade |
|---|---|
| pauta_id | Identificador estável |
| titulo_provisorio | Nome inicial |
| origem | RSS, e-mail, pesquisa, equipe, leitor |
| url_origem | Link principal |
| editoria | Área responsável |
| prioridade | Baixa, normal, alta, urgente |
| relevancia | Nota ou critério |
| responsavel | Autor encarregado |
| editor | Editor responsável |
| status | Estado da pauta |
| prazo | Data esperada |
| criado_em | Data de criação |
| atualizado_em | Última alteração |
| observacoes | Contexto |
| documento | Link para Docs |
| fontes | Links ou IDs relacionados |

## Campos da aba ARTIGOS

| Campo | Finalidade |
|---|---|
| artigo_id | Identificador interno |
| pauta_id | Relação com a pauta |
| slug | Caminho público |
| titulo | Título final |
| linha_fina | Resumo editorial |
| descricao_seo | Descrição para busca e compartilhamento |
| autor | Assinatura |
| editor | Responsável pela publicação |
| editoria | Classificação |
| quadro | Série recorrente |
| status | Estado editorial |
| prioridade | Ordem de atenção |
| documento | Google Doc |
| imagem_capa | Arquivo ou URL |
| texto_alt | Texto alternativo |
| data_planejada | Data desejada |
| data_publicada | Data efetiva |
| branch | Branch de publicação |
| pull_request | URL do PR |
| url_publicada | URL final |
| revisao_editorial | Estado da revisão |
| revisao_factual | Estado da checagem |
| revisao_tecnica | Estado da validação |
| ultima_atualizacao | Controle operacional |

## Status recomendados

```text
IDEIA
TRIAGEM
APROVADA
PESQUISA
EM_PRODUCAO
AGUARDANDO_FONTE
REVISAO_EDITORIAL
REVISAO_FACTUAL
AJUSTES
PRONTO_PARA_PUBLICAR
PR_CRIADO
AGUARDANDO_MERGE
PUBLICADO
CORRECAO_PENDENTE
ARQUIVADO
RECUSADO
```

## Validações

A planilha deve usar listas controladas para:

- status;
- editoria;
- prioridade;
- autor;
- editor;
- quadro;
- tipo de conteúdo;
- estado de revisão.

Isso evita valores como:

```text
Pronto
pronto
PRONTO
Pode publicar
Ok
Finalizado
```

Todos significando a mesma coisa e quebrando automações.

---

# 5.5. Google Calendar

## Função

O Calendar organizará:

- reuniões de pauta;
- prazos;
- entrevistas;
- coletivas;
- eventos;
- lançamentos;
- embargos;
- datas de publicação;
- revisões;
- marcos editoriais;
- quadros recorrentes.

## Calendários sugeridos

```text
SUBSOLO — Editorial
SUBSOLO — Entrevistas
SUBSOLO — Eventos
SUBSOLO — Publicações
SUBSOLO — Embargos
```

## Regra

Uma data no Calendar deve apontar para a pauta ou artigo correspondente.

O evento deve incluir:

- título;
- artigo_id ou pauta_id;
- link do documento;
- responsável;
- editoria;
- estado;
- observações;
- links relevantes.

---

# 5.6. Google Contacts

## Função

O Contacts pode funcionar como cadastro profissional básico.

Categorias possíveis:

- pesquisadores;
- especialistas;
- desenvolvedores;
- jornalistas;
- sindicatos;
- coletivos;
- assessorias;
- artistas;
- estúdios;
- organizações civis;
- fontes públicas;
- fontes institucionais.

## Cuidados

Não usar o Google Contacts para armazenar:

- denúncias anônimas;
- informações pessoais sensíveis;
- detalhes confidenciais;
- notas que possam colocar uma fonte em risco;
- material de investigação sigilosa.

Fontes confidenciais exigem processo separado e mais seguro.

---

# 5.7. GitHub

## Função

O GitHub será responsável por:

- código do portal;
- conteúdo publicável;
- histórico de alterações;
- issues;
- pull requests;
- revisão técnica;
- revisão de conteúdo em formato final;
- automações;
- implantação;
- registro de correções.

## Estrutura sugerida do repositório

```text
subsolo/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── validate.yml
│       ├── build.yml
│       ├── deploy-pages.yml
│       └── scheduled-checks.yml
├── content/
│   ├── politica/
│   ├── sao-paulo/
│   ├── tecnologia/
│   ├── cultura-hacker/
│   ├── jogos/
│   ├── xadrez/
│   ├── cultura/
│   └── colunas/
├── data/
│   ├── authors.json
│   ├── sections.json
│   ├── series.json
│   └── redirects.json
├── public/
│   ├── images/
│   ├── icons/
│   └── static/
├── scripts/
│   ├── validate-content/
│   ├── import-google-doc/
│   ├── build-search-index/
│   └── generate-feeds/
├── src/
├── tests/
├── docs/
└── README.md
```

## Conteúdo como código

Cada artigo deve ser um arquivo versionado.

Exemplo:

```text
content/sao-paulo/2026-07-20-transporte-publico-e-a-cidade.md
```

## Front matter sugerido

```yaml
---
id: subsolo-2026-0001
title: "Título do artigo"
slug: "titulo-do-artigo"
description: "Descrição curta"
section: "sao-paulo"
series: null
author: "nickname"
editor: "nickname"
published_at: "2026-07-20T08:00:00-03:00"
updated_at: null
status: "published"
featured: false
tags:
  - transporte
  - sao-paulo
sources:
  - "https://exemplo.gov.br/documento"
image:
  src: "/images/artigos/subsolo-2026-0001/capa.webp"
  alt: "Descrição objetiva da imagem"
corrections: []
---
```

---

# 5.8. GitHub Actions

## Função

O GitHub Actions executará validações e implantação.

## Workflow de validação

Deve verificar:

- front matter obrigatório;
- slug válido;
- IDs duplicados;
- links internos;
- imagens ausentes;
- texto alternativo;
- datas inválidas;
- autor existente;
- editoria existente;
- Markdown malformado;
- HTML inseguro;
- tamanho excessivo de imagens;
- referências quebradas;
- caracteres inesperados;
- conteúdo ainda marcado como rascunho.

## Workflow de build

Deve:

1. instalar dependências;
2. validar conteúdo;
3. gerar páginas;
4. gerar índice de busca;
5. gerar sitemap;
6. gerar RSS;
7. gerar páginas de autor;
8. gerar páginas de editoria;
9. otimizar ativos;
10. produzir artefato estático.

## Workflow de deploy

Deve publicar somente após:

- validação bem-sucedida;
- merge no branch autorizado;
- build reproduzível;
- ausência de segredos no artefato.

---

# 5.9. GitHub Pages

## Função

O GitHub Pages hospedará o portal estático.

## Vantagens

- custo zero;
- alta disponibilidade;
- integração natural com GitHub Actions;
- HTTPS;
- histórico de implantação;
- independência da máquina local;
- rollback por commit;
- ausência de servidor de aplicação público.

## Limitações

- não é backend dinâmico;
- não deve processar dados privados;
- não hospeda banco;
- formulários exigem serviço externo ou mecanismo alternativo;
- autenticação editorial não deve ocorrer no portal público;
- publicação depende do repositório e dos workflows.

---

# 5.10. Figma Starter

## Função

O Figma organizará:

- design system;
- wireframes;
- layouts;
- componentes;
- protótipos;
- fluxos;
- telas responsivas;
- cards editoriais;
- capas;
- elementos de redes sociais.

## Estrutura sugerida

```text
SUBSOLO — Design System
SUBSOLO — Portal Desktop
SUBSOLO — Portal Mobile
SUBSOLO — Cards e Capas
SUBSOLO — Explorações
SUBSOLO — Arquivo
```

## Regra

O Figma não é fonte de verdade do código.

Ele documenta intenção visual. O comportamento real deve estar:

- implementado;
- testado;
- versionado;
- validado no repositório.

---

# 5.11. n8n Community

## Função

O n8n será o orquestrador dos fluxos.

## Responsabilidades iniciais

- ler planilha editorial;
- detectar mudanças de status;
- consultar Google Docs;
- coletar feeds;
- gerar pautas preliminares;
- preparar Markdown;
- validar campos;
- criar branches;
- criar arquivos;
- abrir pull requests;
- atualizar URLs e status;
- enviar alertas;
- registrar falhas.

## Fluxos recomendados

```text
01_ingestao_rss
02_triagem_gmail
03_sincronizacao_editorial
04_exportacao_google_docs
05_criacao_pull_request
06_confirmacao_publicacao
07_monitoramento_operacional
08_backup_configuracoes
```

## Regras de projeto dos workflows

Cada workflow deve ter:

- objetivo único;
- entrada conhecida;
- validação;
- idempotência;
- logs;
- tratamento de erro;
- saída previsível;
- modo de teste;
- limite de execução;
- documentação;
- credenciais separadas;
- possibilidade de execução manual.

## Idempotência

Executar o mesmo fluxo duas vezes não deve:

- duplicar artigo;
- abrir dois PRs;
- criar duas pautas idênticas;
- sobrescrever publicação;
- apagar comentários;
- reenviar alertas indefinidamente.

Cada entidade deve possuir um identificador estável.

---

# 5.12. FreshRSS

## Função

O FreshRSS será a central de acompanhamento de fontes recorrentes.

## Categorias sugeridas

```text
Política brasileira
São Paulo — cidade
São Paulo — estado
Relações internacionais
Segurança digital
Privacidade
Software livre
Cultura hacker
Tecnologia
Inteligência artificial
Jogos
Xadrez
Cultura
Fontes governamentais
Diários oficiais
Blogs independentes
Correções e atualizações
```

## Uso editorial

- centralizar leitura;
- marcar itens relevantes;
- identificar fontes recorrentes;
- reduzir dependência de redes sociais;
- manter histórico de acompanhamento;
- fornecer entradas para o n8n;
- evitar visitas manuais repetitivas.

## Regras

- RSS não é prova;
- títulos não bastam;
- itens devem ser lidos;
- publicações duplicadas devem ser agrupadas;
- fontes oficiais não substituem contraponto;
- fonte sem histórico confiável exige validação adicional.

---

# 5.13. SearXNG

## Função

O SearXNG será a interface local de metabusca.

## Aplicações

- pesquisa inicial de pauta;
- comparação de cobertura;
- busca por documentos;
- busca por versões anteriores;
- descoberta de fontes;
- investigação de termos;
- consulta simultânea a múltiplos mecanismos.

## Cuidados

- instâncias e mecanismos podem impor limites;
- alguns resultados podem falhar;
- metabusca não garante anonimato absoluto;
- resultados precisam de validação;
- snippets não substituem leitura da fonte;
- evitar automações agressivas.

---

# 5.14. Uptime Kuma

## Função

O Uptime Kuma monitorará:

- portal público;
- página inicial;
- RSS;
- sitemap;
- endpoints locais;
- n8n;
- FreshRSS;
- SearXNG;
- banco;
- serviços Docker;
- certificados, quando houver domínio;
- workflows críticos expostos por endpoint interno.

## Monitores sugeridos

```text
SUBSOLO — Homepage
SUBSOLO — RSS
SUBSOLO — Sitemap
SUBSOLO — GitHub Pages
LOCAL — n8n
LOCAL — FreshRSS
LOCAL — SearXNG
LOCAL — NocoDB
LOCAL — Matomo
LOCAL — PostgreSQL
```

## Limitação local

Se a máquina estiver desligada, o monitor local também estará desligado. Isso significa que ele não pode avisar sobre a própria queda da máquina.

Na fase futura, o monitoramento externo deve ser migrado para outro ambiente.

---

# 5.15. ntfy

## Função

O ntfy pode emitir notificações para:

- publicação concluída;
- PR criado;
- build falhou;
- artigo sem campos obrigatórios;
- prazo vencido;
- serviço local indisponível;
- feed parou de atualizar;
- erro em automação;
- correção urgente;
- pauta classificada como crítica.

## Regra

Alertas devem ser acionáveis.

Evitar mensagens como:

```text
Algo deu errado.
```

Preferir:

```text
Falha ao exportar o artigo subsolo-2026-0001.
Etapa: conversão do Google Docs.
Motivo: campo "author" ausente.
Ação: preencher o autor na planilha e executar novamente.
```

---

# 5.16. NocoDB Community

## Momento de adoção

O NocoDB não deve entrar imediatamente.

Ele será adotado quando houver sintomas como:

- planilha lenta;
- relações complexas;
- muitas abas;
- dificuldade de permissões;
- necessidade de formulários melhores;
- necessidade de visualização kanban;
- automações mais robustas;
- histórico operacional insuficiente;
- risco de edição acidental.

## Papel futuro

Poderá substituir o Sheets como banco editorial operacional, mantendo o Drive como armazenamento documental.

---

# 5.17. Matomo Community

## Momento de adoção

Instalar somente quando o site já tiver tráfego suficiente para justificar análise.

## Métricas úteis

- páginas mais lidas;
- origem de acesso;
- tempo de permanência;
- dispositivos;
- editorias;
- autores;
- buscas internas;
- retorno de leitores;
- desempenho de campanhas;
- cliques em links;
- erros 404.

## Cuidados

- não coletar mais dados que o necessário;
- documentar política de privacidade;
- anonimizar quando possível;
- não transformar analytics em mecanismo editorial absoluto;
- leitura não equivale a relevância pública.

---

# 5.18. Paperless-ngx

## Momento de adoção

Somente quando existir acervo significativo.

## Aplicações

- relatórios;
- documentos públicos;
- notas técnicas;
- PDFs;
- estudos;
- processos;
- documentos históricos;
- material de investigação;
- OCR e indexação.

## Custos indiretos

Apesar de gratuito, pode consumir:

- CPU;
- RAM;
- armazenamento;
- tempo de indexação;
- manutenção;
- backups maiores.

---

# 6. Arquitetura geral

```text
┌──────────────────────────────────────────────────────────────┐
│ FONTES EXTERNAS                                               │
│ Gmail · RSS · Sites · Documentos · Calendários · Contatos    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ MÁQUINA LOCAL                                                 │
│ Docker                                                        │
│                                                              │
│ FreshRSS → coleta recorrente                                 │
│ SearXNG   → pesquisa                                         │
│ n8n       → automações                                       │
│ Kuma      → monitoramento                                    │
│ ntfy      → alertas                                          │
│ NocoDB    → futuro banco editorial                           │
│ Matomo    → futuro analytics                                 │
│ Paperless → futuro acervo                                    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ AMBIENTE EDITORIAL                                            │
│ Google Sheets · Docs · Drive · Calendar · Contacts           │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ PUBLICAÇÃO                                                    │
│ GitHub Branch → Pull Request → Revisão → Merge               │
│ GitHub Actions → Build → GitHub Pages                        │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ PORTAL PÚBLICO                                                │
│ HTML · CSS · JavaScript · RSS · Sitemap · Busca estática     │
└──────────────────────────────────────────────────────────────┘
```

---

# 7. Fluxo editorial completo

# 7.1. Descoberta de pauta

Entradas possíveis:

- FreshRSS;
- Gmail;
- pesquisa no SearXNG;
- conversa editorial;
- leitor;
- fonte;
- agenda pública;
- documento oficial;
- atualização de matéria anterior.

A pauta recebe:

- identificador;
- título provisório;
- origem;
- editoria;
- relevância;
- prioridade;
- responsável;
- prazo;
- links iniciais.

---

# 7.2. Triagem

A triagem decide:

- é relevante?
- é verificável?
- já foi coberta?
- existe desenvolvimento novo?
- qual editoria assume?
- precisa de contraponto?
- exige resposta rápida?
- exige pesquisa longa?
- há risco jurídico?
- há interesse público?
- há conflito de interesse?
- deve ser arquivada?

Saídas:

```text
APROVADA
RECUSADA
ARQUIVADA
AGUARDANDO_INFORMACAO
```

---

# 7.3. Pesquisa

A pesquisa reúne:

- fonte primária;
- documentos oficiais;
- contexto histórico;
- dados;
- posições divergentes;
- declarações;
- cronologia;
- lacunas;
- fatos ainda não confirmados.

Cada informação relevante deve ser associada à origem.

---

# 7.4. Produção

O autor escreve no Google Docs.

O texto deve distinguir:

- fato;
- declaração;
- análise;
- hipótese;
- contexto;
- opinião;
- ironia editorial;
- conclusão.

O sarcasmo e o humor ácido do SUBSOLO não podem deformar fatos, atribuir declarações inexistentes ou ocultar incerteza.

---

# 7.5. Revisão editorial

Verifica:

- clareza;
- estrutura;
- coerência;
- tom;
- título;
- linha fina;
- abertura;
- encerramento;
- adequação à editoria;
- excesso de repetição;
- opinião;
- comentário social;
- força argumentativa;
- presença de contexto.

---

# 7.6. Revisão factual

Verifica:

- nomes;
- datas;
- números;
- cargos;
- locais;
- citações;
- links;
- cronologia;
- documentos;
- afirmações;
- diferenças entre fato e inferência;
- informações ainda não confirmadas.

---

# 7.7. Preparação para publicação

Antes de marcar `PRONTO_PARA_PUBLICAR`, devem existir:

- título final;
- slug;
- descrição;
- editoria;
- autor;
- editor;
- data;
- imagem;
- texto alternativo;
- referências;
- revisão editorial concluída;
- revisão factual concluída;
- pendências removidas;
- comentários internos resolvidos.

---

# 7.8. Exportação

O n8n:

1. identifica artigo pronto;
2. busca linha da planilha;
3. abre o Google Docs;
4. extrai conteúdo;
5. limpa notas internas;
6. converte para Markdown;
7. cria front matter;
8. valida campos;
9. prepara imagens;
10. executa testes locais ou validações;
11. cria branch;
12. adiciona arquivo;
13. cria commit;
14. abre pull request;
15. atualiza planilha;
16. emite alerta.

---

# 7.9. Pull request

O PR deve conter:

- título;
- artigo_id;
- resumo;
- editoria;
- autor;
- editor;
- checklist;
- origem do documento;
- link de prévia;
- validações executadas;
- pendências conhecidas.

Checklist sugerido:

```text
[ ] Metadados completos
[ ] Texto revisado
[ ] Fatos verificados
[ ] Fontes registradas
[ ] Imagem autorizada
[ ] Texto alternativo presente
[ ] Links verificados
[ ] Sem notas internas
[ ] Build local aprovado
[ ] Prévia visual revisada
```

---

# 7.10. Merge e publicação

Após aprovação:

1. PR é aprovado;
2. merge ocorre;
3. GitHub Actions valida;
4. site é compilado;
5. artefato é publicado;
6. URL é verificada;
7. planilha recebe status `PUBLICADO`;
8. URL final é registrada;
9. ntfy pode emitir confirmação;
10. Uptime Kuma verifica disponibilidade.

---

# 7.11. Correções

Correções não devem apagar o histórico.

Fluxo:

1. registrar solicitação;
2. criar item em `CORRECOES`;
3. avaliar materialidade;
4. alterar conteúdo em branch;
5. abrir PR;
6. revisar;
7. publicar;
8. atualizar `updated_at`;
9. incluir nota de correção quando necessário;
10. manter registro da versão anterior no Git.

---

# 8. Fluxos de automação prioritários

## 8.1. Coleta de RSS

```text
Agendamento
    ↓
FreshRSS fornece itens não processados
    ↓
n8n normaliza título, URL, data e fonte
    ↓
Deduplicação
    ↓
Filtro por relevância mínima
    ↓
Criação de pauta preliminar
    ↓
Alerta ou relatório
```

## 8.2. Triagem de Gmail

```text
Agendamento
    ↓
Busca mensagens SUBSOLO recentes
    ↓
Classificação preliminar
    ↓
Extração de remetente, assunto e data
    ↓
Criação opcional de pauta
    ↓
Aplicação de marcador
    ↓
Resumo para revisão humana
```

## 8.3. Sincronização editorial

```text
Consulta ARTIGOS
    ↓
Localiza mudanças de status
    ↓
Valida transições permitidas
    ↓
Atualiza timestamps
    ↓
Agenda prazos
    ↓
Emite alertas
```

## 8.4. Exportação de artigo

```text
Status = PRONTO_PARA_PUBLICAR
    ↓
Lê metadados
    ↓
Lê Google Docs
    ↓
Converte
    ↓
Valida
    ↓
Cria branch e commit
    ↓
Abre PR
    ↓
Atualiza planilha
```

## 8.5. Confirmação de publicação

```text
PR merged
    ↓
Build aprovado
    ↓
URL pública disponível
    ↓
Planilha atualizada
    ↓
Artigo movido para PUBLICADOS
    ↓
Notificação enviada
```

---

# 9. Estados e transições permitidas

Exemplo de máquina de estados:

```text
IDEIA
  ↓
TRIAGEM
  ├──→ RECUSADO
  ├──→ ARQUIVADO
  └──→ APROVADO
          ↓
       PESQUISA
          ↓
      EM_PRODUCAO
          ├──→ AGUARDANDO_FONTE
          └──→ REVISAO_EDITORIAL
                    ↓
             REVISAO_FACTUAL
                    ↓
                 AJUSTES
                    ↓
          PRONTO_PARA_PUBLICAR
                    ↓
                 PR_CRIADO
                    ↓
             AGUARDANDO_MERGE
                    ↓
                PUBLICADO
                    ↓
           CORRECAO_PENDENTE
                    ↓
                PUBLICADO
```

Transições inválidas devem ser bloqueadas.

Exemplo:

```text
IDEIA → PUBLICADO
```

não deve ser permitido.

---

# 10. Segurança

## 10.1. Credenciais

Credenciais devem ficar em:

- cofre interno do n8n;
- variáveis de ambiente;
- GitHub Secrets;
- arquivos locais não versionados;
- gerenciador de senhas.

Nunca em:

- Markdown;
- planilha;
- Google Docs;
- commit;
- issue;
- log;
- mensagem de alerta;
- código-fonte.

## 10.2. Permissões mínimas

Cada integração deve receber apenas o necessário.

Exemplos:

- leitura de e-mail quando envio não for necessário;
- acesso somente à pasta SUBSOLO no Drive, quando possível;
- token GitHub limitado ao repositório;
- GitHub Actions com permissões declaradas;
- banco sem exposição externa;
- usuários distintos para serviços.

## 10.3. Conteúdo privado

A exportação deve remover:

- comentários internos;
- instruções de pauta;
- telefones;
- e-mails pessoais;
- links privados;
- IDs internos desnecessários;
- nomes de fontes protegidas;
- observações jurídicas;
- tokens;
- credenciais;
- histórico de revisão.

---

# 11. Backups

## 11.1. O que precisa de backup

- configurações do n8n;
- banco do n8n;
- FreshRSS;
- NocoDB, quando existir;
- Matomo, quando existir;
- Paperless, quando existir;
- arquivos Docker Compose;
- variáveis de ambiente criptografadas;
- documentação;
- scripts;
- banco local;
- imagens ainda não enviadas ao Drive.

## 11.2. O que já possui redundância externa

- código no GitHub;
- conteúdo publicado no GitHub;
- documentos no Google Drive;
- planilhas no Google Drive;
- Figma na nuvem.

## 11.3. Estratégia mínima

```text
Diário:
- exportar bancos locais
- gerar arquivo compactado
- manter cópia local rotativa

Semanal:
- enviar backup criptografado ao Google Drive

Mensal:
- testar restauração
- verificar integridade
- remover backups antigos conforme retenção
```

Backup não testado não é backup confiável.

---

# 12. Operação na máquina local

## 12.1. Requisitos gerais

A máquina deve ter:

- Docker Desktop ou Docker Engine;
- armazenamento suficiente;
- memória compatível;
- conexão estável;
- rotina de backup;
- inicialização controlada;
- atualizações planejadas.

## 12.2. Serviços iniciais

Primeira composição:

```text
n8n
PostgreSQL
FreshRSS
SearXNG
Uptime Kuma
```

ntfy pode entrar logo depois.

## 12.3. Serviços adiados

```text
NocoDB
Matomo
Paperless-ngx
```

## 12.4. Efeito de desligamento

Ao desligar a máquina:

- n8n para;
- feeds deixam de ser processados;
- buscas locais ficam indisponíveis;
- monitoramento local para;
- alertas locais param;
- banco local fica inacessível.

Continuam funcionando:

- GitHub;
- GitHub Pages;
- Google Drive;
- Gmail;
- Calendar;
- Docs;
- Sheets;
- Figma;
- site publicado.

---

# 13. Observabilidade

Cada automação deve registrar:

- workflow;
- execução;
- horário;
- entrada;
- identificador;
- resultado;
- duração;
- erro;
- tentativa;
- ação recomendada.

## Níveis

```text
INFO
WARN
ERROR
CRITICAL
```

## Exemplo de log

```json
{
  "workflow": "exportacao_google_docs",
  "article_id": "subsolo-2026-0001",
  "status": "error",
  "step": "validate_front_matter",
  "error": "missing_author",
  "retryable": false,
  "occurred_at": "2026-07-20T10:00:00-03:00"
}
```

---

# 14. Testes

## 14.1. Testes de conteúdo

- slug válido;
- autor cadastrado;
- editoria válida;
- imagem existente;
- texto alternativo;
- links;
- datas;
- campos obrigatórios;
- caracteres;
- duplicidade;
- conteúdo vazio.

## 14.2. Testes de automação

- mesma entrada duas vezes;
- falha de rede;
- documento ausente;
- campo ausente;
- API indisponível;
- token inválido;
- branch existente;
- PR já aberto;
- build falhou;
- artigo já publicado.

## 14.3. Dry-run

Antes de executar alterações externas, fluxos críticos devem oferecer modo:

```text
dry_run = true
```

Nesse modo, devem mostrar:

- o que seria criado;
- o que seria alterado;
- branch;
- arquivo;
- status;
- PR;
- alertas;
- erros.

Sem efetivar a alteração.

---

# 15. Critérios de aceite da primeira versão

A primeira versão estará operacional quando:

- o repositório existir;
- o GitHub Pages publicar o portal;
- houver estrutura editorial no Drive;
- a planilha central estiver definida;
- um artigo puder ser escrito no Docs;
- o artigo puder ser convertido para Markdown;
- um branch puder ser criado;
- um PR puder ser aberto;
- o build validar conteúdo;
- o merge publicar o artigo;
- a URL final voltar para a planilha;
- o FreshRSS estiver coletando feeds;
- o SearXNG estiver disponível localmente;
- o n8n estiver executando workflows;
- o Uptime Kuma monitorar serviços;
- backups básicos estiverem configurados;
- nenhuma credencial estiver versionada;
- nenhum serviço administrativo estiver público.

---

# 16. Fases de implantação

## Fase 1 — Fundação

- criar repositório;
- escolher gerador do portal;
- configurar GitHub Pages;
- criar estrutura de conteúdo;
- criar planilha;
- criar pastas no Drive;
- criar modelo de Google Docs;
- criar convenções de ID, slug e status.

## Fase 2 — Infraestrutura local

- instalar Docker;
- criar Compose;
- subir PostgreSQL;
- subir n8n;
- subir FreshRSS;
- subir SearXNG;
- subir Uptime Kuma;
- documentar portas e volumes.

## Fase 3 — Publicação manual controlada

- exportar primeiro artigo;
- criar branch;
- abrir PR;
- validar build;
- publicar;
- registrar URL;
- documentar falhas.

## Fase 4 — Automação

- automatizar exportação;
- automatizar PR;
- automatizar atualização da planilha;
- automatizar alertas;
- implementar dry-run;
- implementar idempotência.

## Fase 5 — Captação editorial

- configurar feeds;
- categorizar fontes;
- integrar FreshRSS;
- integrar Gmail;
- gerar relatórios;
- criar pautas preliminares.

## Fase 6 — Expansão

- avaliar NocoDB;
- avaliar ntfy;
- adicionar Matomo;
- adicionar Paperless;
- migrar para VPS quando houver justificativa.

---

# 17. Migração futura para VPS

A migração não deve alterar o modelo editorial.

O que muda:

```text
Máquina local → VPS
```

O que permanece:

- GitHub;
- GitHub Pages;
- Drive;
- Docs;
- Sheets ou NocoDB;
- fluxos;
- estrutura editorial;
- IDs;
- formatos;
- testes;
- pipelines.

## Preparação desde o início

- usar Docker Compose;
- volumes nomeados;
- variáveis de ambiente;
- backups portáveis;
- não usar caminhos absolutos do Windows;
- evitar dependência de IP local;
- documentar versões;
- registrar segredos separadamente;
- testar restauração em ambiente limpo.

---

# 18. Decisões deliberadamente adiadas

Ainda não é necessário decidir:

- VPS;
- domínio pago;
- Workspace;
- Slack Pro;
- GitHub Team;
- Notion;
- CMS dinâmico;
- banco editorial avançado;
- analytics completo;
- CDN externa;
- object storage;
- formulário público próprio;
- autenticação de leitores;
- área de assinantes;
- newsletter paga;
- aplicativo móvel.

Essas decisões devem surgir de necessidade real, não de entusiasmo arquitetural.

---

# 19. Stack final da fase inicial

```text
SERVIÇOS EXTERNOS
- Gmail
- Google Drive
- Google Docs
- Google Sheets
- Google Calendar
- Google Contacts
- GitHub
- GitHub Actions
- GitHub Pages
- Figma Free

SERVIÇOS LOCAIS
- Docker
- PostgreSQL
- n8n Community
- FreshRSS
- SearXNG
- Uptime Kuma
- ntfy opcional

ADIADOS
- NocoDB
- Matomo
- Paperless-ngx
```

---

# 20. Resumo executivo

A stack inicial do SUBSOLO deve operar com custo incremental igual a R$ 0.

O Google Drive será o ambiente editorial. O Google Sheets controlará pautas e artigos. O Google Docs armazenará textos em elaboração. O Gmail receberá comunicações e sugestões. O Calendar organizará prazos e eventos. O GitHub manterá código e conteúdo publicável. Pull requests fornecerão revisão e rastreabilidade. GitHub Actions validará e compilará o portal. GitHub Pages manterá o site público.

Na máquina local, o n8n orquestrará fluxos; FreshRSS centralizará fontes; SearXNG apoiará pesquisas; Uptime Kuma monitorará serviços; ntfy poderá emitir alertas. NocoDB, Matomo e Paperless-ngx só devem ser incorporados após necessidade comprovada.

O modelo preserva baixo custo, independência, controle editorial, histórico, segurança e capacidade de crescimento. A futura migração para VPS será operacional, não arquitetural, desde que todos os serviços locais sejam conteinerizados, documentados e mantidos com backups portáveis.
