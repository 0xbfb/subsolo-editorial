# AGENTS — SUBSOLO

## Regras obrigatórias

1. trabalhar incrementalmente sobre esta estrutura;
2. ler `docs/adr` antes de alterar arquitetura;
3. criar teste antes de comportamento novo;
4. usar fixture antes de integração real;
5. implementar dry-run antes de apply;
6. manter efeitos em infraestrutura;
7. não importar Astro, Google, GitHub ou n8n no domínio;
8. não modificar `references/jornal-concreto-html`;
9. não versionar segredos;
10. atualizar relatório da etapa e changelog.

## Comandos

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## Conclusão

Não declarar sucesso para comando não executado. Relatar limitações com evidência.

## Contratos editoriais da versão 0.2.0-dev

- não alterar listas controladas sem atualizar schemas, fixtures, CSVs e testes;
- não adicionar campo público sem definir `visibility` no workbook;
- não inferir status por pasta do Drive;
- não transformar canais em tags;
- quadros compartilhados precisam manter ID qualificado pelo canal;
- `PRONTO_PARA_PUBLICAR` exige as três revisões concluídas.

## Conteúdo público

Não introduza status operacionais do Sheets no contrato público. Toda alteração de schema exige exemplo, teste, documentação e avaliação de migração. HTML arbitrário e protocolos perigosos permanecem proibidos.

## Sistema visual 0.3.0-dev

- `references/jornal-concreto-html` é imutável;
- tokens vivem em `src/styles/tokens.css`;
- não adicionar framework CSS sem nova decisão arquitetural;
- componentes não recebem conteúdo editorial fixo;
- a manchete principal não deve ser sublinhada;
- títulos secundários e canais mantêm sublinhado;
- JavaScript deve ser progressivo;
- toda alteração visual exige teste desktop e mobile;
- a rota `__design` não deve integrar a navegação pública.

## Páginas editoriais 0.3.1-dev

- conteúdo público de desenvolvimento vive em `src/data/fixtures/editorial-site.json`;
- componentes não devem conter texto de matérias;
- páginas dinâmicas devem usar IDs e slugs estáveis;
- canais vazios devem mostrar estado vazio, não material de preenchimento;
- a busca deve usar Pagefind após o build e manter apenas o fallback documentado por `archive-index.json`;
- toda publicação deve exibir estado, autoria, datas, fontes e conexões;
- cronologias e documentos precisam de alternativa textual;
- alterações de rota exigem atualização de `docs/architecture/routes.md` e testes de links.

## Publicação manual 0.4.0-dev

- conteúdo editorial entra em `main` somente por pull request;
- preview de PR não recebe permissões de Pages;
- somente o job de deploy usa `pages: write` e `id-token: write`;
- executar `verify:dist` e `scan:public-artifact` antes de qualquer upload;
- não usar `pull_request_target`;
- não apontar Actions para branches `main` ou `master`;
- preservar suporte a `SUBSOLO_BASE_PATH`;
- rollback deve ocorrer por revert em PR, nunca por force push;
- não declarar o deploy validado sem execução real no GitHub.

## Descoberta pública 0.8.1-dev

- `archive-index.json` deve permanecer compacto e nunca conter corpo, fontes privadas ou notas internas;
- Pagefind indexa apenas regiões com `data-pagefind-body`; navegação, formulários e metadados auxiliares devem ficar fora do corpo indexável;
- filtros públicos usam slugs estáveis de canal, tema, autor, natureza, estado e história;
- feeds e sitemap são gerados deterministicamente antes do build;
- novas rotas de conteúdo exigem atualização do sitemap, arquivo e testes;
- o arquivo precisa continuar navegável sem JavaScript;
- paginação substitui rolagem infinita como acesso canônico.

## Captação editorial 0.8.2-dev

- FreshRSS, Gmail e SearXNG criam somente pautas `TRIAGEM`;
- releases, mensagens e snippets permanecem não verificados;
- a deduplicação nunca mescla pautas silenciosamente;
- anexos são registrados por metadados e nunca baixados ou abertos automaticamente;
- consultas SearXNG do n8n usam arquivo JSON fixo, sem interpolação de texto em shell;
- a escrita no Sheets usa token separado e escopo `spreadsheets`;
- nenhuma integração de captação pode criar artigo, pacote, branch, PR ou publicação.

## Exportador

A lógica crítica de conversão deve permanecer fora do n8n. Novos providers precisam obedecer às mesmas entradas estruturadas e produzir exatamente o mesmo resultado das fixtures. Comentários, sugestões e links privados bloqueiam publicação; não devem ser removidos silenciosamente.

- fontes, correções e mídia devem ser reconstruídas por allowlist;
- proveniência pública usa hashes dos snapshots e não IDs privados do Google;
- apply deve permanecer atômico e overwrite deve remover resíduos;
- o mesmo input precisa produzir os mesmos bytes.

## Google Workspace 0.5.1-dev

- manter scopes `documents.readonly` e `spreadsheets.readonly`;
- qualquer scope adicional exige ADR;
- providers Google e fixture precisam produzir os mesmos bytes públicos;
- não registrar IDs, tokens, chave privada ou corpo editorial em logs;
- documentos com múltiplas abas exigem `tab_id` explícito;
- `comentarios_resolvidos` é gate humano obrigatório porque comentários não são lidos pela Docs API nesta etapa;
- manter cache somente em memória e desativado por padrão;
- erros 401, 403 e 404 não devem entrar em retry automático;
- nenhum provider Google pode ser importado pelo domínio.

## Pacotes de edição 0.6.0-dev

- pacotes publicados são imutáveis e nunca recebem overwrite;
- revisão maior que 1 exige o ZIP imediatamente anterior e `supersedes` compatível;
- `checksums.sha256` cobre todas as outras entradas do pacote;
- a mesma entrada precisa produzir o mesmo ZIP, independentemente do destino;
- ZIPs aceitos usam caminhos relativos seguros, entradas regulares e método STORE;
- symlinks, originais, `.env`, `.git` e `node_modules` bloqueiam empacotamento;
- restore valida CRC32, SHA-256 e manifesto antes de escrever;
- dry-run não grava ZIP nem diretório restaurado;
- upload ao Drive e escrita no Git continuam fora desta versão.

## Arquivo técnico no Drive 0.6.1-dev

- usar `drive.file` por padrão; scope completo exige decisão explícita;
- operar somente sob `SUBSOLO_DRIVE_ROOT_FOLDER_ID`;
- criar apenas `90_ARQUIVO_TECNICO/edicoes/YYYY/MM` nesta etapa;
- idempotência usa SHA-256 em `appProperties`, pasta-pai e MIME; nome não basta;
- upload deve ser resumível e usar chunks múltiplos de 256 KiB;
- não registrar URI da sessão, token ou URL privada;
- confirmar ID, nome, tamanho, pasta, metadados e checksum antes de salvar recibo;
- baixar e validar o pacote antes de considerar o upload concluído;
- reexecução não duplica ZIP;
- nunca apagar, substituir ou tornar público um pacote;
- `publish` deve usar `--skip-git` até o Prompt 12.

## Orquestração n8n

- n8n não implementa regras editoriais em Code nodes;
- o pacote deve estar confirmado no Drive antes de qualquer efeito Git;
- PR é fronteira humana e nunca recebe merge automático;
- logs não incluem o corpo editorial.

## Ciclo da edição

- nunca publique o Mapa do Dia integral;
- apenas slots confirmados entram na edição pública;
- uma edição selada rejeita append comum;
- correções pós-selo geram nova revisão formal e preservam os ZIPs anteriores.

## Mídia

Nunca copie originais para `public/`. Sempre valide manifesto, direitos e MIME; execute dry-run; publique apenas derivados content-addressed. Retratos exigem aprovação explícita e não podem ser substituídos por imagens genéricas.

## Operação 0.9.0-dev

- logs operacionais devem ser JSON Lines e nunca conter corpo editorial;
- tokens, senhas, chaves, cookies e sessões precisam ser redigidos;
- falhas devem indicar `retryable` e ação recomendada;
- backup portátil deve permanecer criptografado e nunca incluir `.env`;
- todo backup precisa de restore de teste;
- restore apply exige confirmação destrutiva e snapshot atual;
- reconciliação nunca corrige divergência ambígua silenciosamente;
- o Kuma local não substitui o smoke externo do GitHub Actions;
- falha do ntfy não pode ser tratada como ausência de incidente.

## Hardening 0.9.1-dev

- scripts executáveis públicos devem ser arquivos próprios; script inline só é aceito para JSON-LD com hash CSP;
- `unsafe-inline`, `unsafe-eval` amplo, `innerHTML`, `eval` e assets executáveis externos são proibidos;
- todo checkout de Action usa `persist-credentials: false`;
- permissões de escrita ficam restritas ao job de deploy do Pages;
- nenhuma porta de serviço local pode ser vinculada fora de `127.0.0.1` sem ADR;
- toda dependência direta exige versão exata e revisão de licença;
- advisories exigem decisão, responsável e prazo; alta/crítica bloqueia release sem mitigação;
- `pnpm-lock.yaml` e auditoria transitiva online são gates obrigatórios para 1.0.0;
- não remova foco, labels, alt, landmarks ou movimento reduzido para preservar estética;
- conteúdo crítico deve permanecer legível sem JavaScript;
- aumento de budget ou gatilho de capacidade exige registro de decisão;
- a revisão manual com teclado e leitor de tela não pode ser substituída apenas por checks estáticos.

## Pré-release 1.0.0-pre

- `release:verify` é um gate: não converta bloqueadores em warnings para fechar versão;
- a ausência de `pnpm-lock.yaml`, `dist`, Pagefind, evidência externa ou aceite manual mantém a decisão NO-GO;
- o SBOM direto não substitui inventário transitivo;
- o fluxo fixture comprova determinismo local, não integração real com Google, GitHub ou Docker;
- toda evidência real deve ser gravada em `reports/prompt-20/evidence/*.json` com `status: pass`;
- nenhuma etapa futura pode alterar contratos públicos sem migração explícita;
- correções do RC devem se limitar a defeitos encontrados na homologação da pré-release.
