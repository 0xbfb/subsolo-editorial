# Checklist de homologação do usuário — 1.0.0-pre

Responsável: ____________________  
Ambiente: ____________________  
Commit/tag: ____________________  
Data: ____________________

## 1. Instalação limpa

- [ ] clonar ou extrair em diretório vazio;
- [ ] confirmar Node 22.12–22.x e pnpm 11.15–11.x;
- [ ] executar `pnpm install --frozen-lockfile`;
- [ ] executar `pnpm ci:local`;
- [ ] executar `pnpm test:all`;
- [ ] executar `pnpm release:verify`.

## 2. Portal

- [ ] home aprovada em desktop;
- [ ] home aprovada em 390 px;
- [ ] matéria legível sem JavaScript;
- [ ] arquivo por data e canal funcional;
- [ ] busca Pagefind e filtros funcionais;
- [ ] feed geral, feed de canal e correções válidos;
- [ ] 404, redirect 308 e tombstone corretos;
- [ ] tema claro/escuro persiste;
- [ ] nenhum deslocamento visível por mídia.

## 3. Acessibilidade

- [ ] fluxo completo apenas por teclado;
- [ ] foco visível em todos os controles;
- [ ] link “Pular para o conteúdo” funciona;
- [ ] zoom 200% e 400% sem perda crítica;
- [ ] reflow em 320 CSS px;
- [ ] leitor de tela anuncia landmarks, títulos, links e formulários;
- [ ] movimento reduzido respeitado;
- [ ] axe sem violações críticas ou sérias sem decisão registrada.

## 4. Fluxo editorial real

- [ ] pauta criada no Sheets;
- [ ] documento produzido a partir do modelo;
- [ ] transição inválida bloqueada;
- [ ] exportação real Docs/Sheets concluída;
- [ ] comentários e sugestões pendentes bloqueiam exportação;
- [ ] ZIP preservado no Drive e baixado com checksum válido;
- [ ] branch e PR criados automaticamente;
- [ ] revisão humana realizada;
- [ ] merge dispara build e deploy;
- [ ] URL pública sincronizada no Sheets;
- [ ] segunda execução não duplica pacote, branch ou PR.

## 5. Edição, correção e recuperação

- [ ] edição aberta, revisada e selada;
- [ ] r1, r2 e r3 preservadas;
- [ ] correção gera nova revisão e feed;
- [ ] mudança de slug preserva redirect;
- [ ] retirada mantém tombstone e remove corpo do índice;
- [ ] backup real criado e criptografado;
- [ ] restore mensal executado em ambiente limpo;
- [ ] divergência entre Sheets, Drive e GitHub detectada;
- [ ] site permanece acessível com stack local desligada.

## Resultado

- [ ] aprovado para RC1;
- [ ] reprovado — achados registrados.

Observações:

---
