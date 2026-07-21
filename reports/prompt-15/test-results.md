# Resultados de testes — Prompt 15

**Versão:** `0.8.2-dev`

## Resultado geral

- **169 testes Node aprovados**;
- **27 novos testes ligados à etapa**: 25 de ingestão e 2 novas verificações dos workflows n8n; a suíte de workflows possui 4 testes no total;
- zero falhas, skips ou cancelamentos;
- TypeScript isolado aprovado com `tsc 5.8.3`;
- sintaxe dos módulos MJS e da CLI aprovada;
- 163 arquivos JSON parseados;
- fronteiras arquiteturais aprovadas;
- 12 fontes canônicas verificadas por SHA-256;
- 12 abas, 44 autores, 9 canais e 74 quadros preservados;
- 11 schemas públicos preservados;
- infraestrutura estática: 6 serviços, 6 healthchecks e 5 portas locais;
- 10 workflows n8n sanitizados;
- assets de descoberta: 25 registros e 11 feeds;
- scanner do artefato público aprovado.

## Casos específicos

1. URL canônica remove tracking e normaliza parâmetros;
2. fingerprint usa URL, título e origem;
3. duplicata exata é bloqueada;
4. release repetido vira duplicata provável;
5. data do fato permanece separada da data da fonte;
6. release continua `COMUNICADO_OU_RELEASE` não verificado;
7. remetente Gmail desconhecido é rejeitado;
8. PDF é registrado em quarentena sem download;
9. anexo executável rejeita a pauta;
10. SearXNG parcial produz aviso;
11. indisponibilidade de fonte é retryable;
12. dry-run não grava estado nem relatório;
13. segunda execução não duplica pautas;
14. todas as pautas ficam em `TRIAGEM`;
15. nenhum canal é atribuído automaticamente;
16. Gmail usa apenas listagem e leitura;
17. Sheets usa append `RAW` e credencial separada;
18. workflow SearXNG usa arquivo JSON fixo e não interpola consulta no shell;
19. nenhum workflow de captação chama publicação, exportação, pacote ou orquestração.

## Lote auditado

- 6 execuções;
- 9 entradas;
- 6 pautas criadas;
- 1 duplicata provável;
- 2 entradas rejeitadas;
- 2 metadados de anexos em quarentena;
- estados encontrados: somente `TRIAGEM`;
- efeito de publicação: `false`.

## Não executado

- `docker compose ps` e execução real dos serviços, pois Docker não está instalado;
- `pnpm install`, Astro, Vitest, ESLint, Prettier e Playwright, pois o Corepack falhou com `EAI_AGAIN registry.npmjs.org`;
- APIs reais e Google Sheets real, por ausência de credenciais de homologação.

Nenhum resultado não executado foi presumido.
