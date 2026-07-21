# Exportador editorial

O exportador converte duas entradas privadas mockadas — uma linha equivalente ao Google Sheets e uma árvore equivalente ao Google Docs — em cinco arquivos públicos:

- `publication.md`;
- `sources.json`;
- `corrections.json`;
- `media.json`;
- `provenance.public.json`.

A lógica crítica permanece na CLI e em módulos funcionais testáveis. Workflows n8n futuros apenas coordenarão a execução.

## Entradas

```text
sheet-row.json  → metadados editoriais estruturados
document.json   → árvore editorial equivalente ao Google Docs
```

As fixtures são providers de desenvolvimento. O Prompt 09 poderá adicionar providers reais sem alterar o contrato do exportador.

## Dry-run

```bash
node cli/subsolo.mjs export-doc \
  --sheet fixtures/exporter/valid/sheet-row.json \
  --document fixtures/exporter/valid/document.json \
  --destination .tmp/exported-publication \
  --dry-run
```

O dry-run:

- valida as entradas;
- constrói a AST editorial;
- sanitiza o conteúdo;
- calcula nomes, tamanhos e SHA-256;
- mostra o plano de escrita;
- não cria o diretório de destino.

## Apply

```bash
node cli/subsolo.mjs export-doc \
  --sheet fixtures/exporter/valid/sheet-row.json \
  --document fixtures/exporter/valid/document.json \
  --destination .tmp/exported-publication \
  --apply
```

O apply escreve primeiro em diretório temporário e só então faz a troca atômica para o destino final. Um destino existente é rejeitado. `--overwrite` precisa ser explícito e substitui integralmente o diretório anterior, evitando arquivos obsoletos.

## Arquivos públicos

### `publication.md`

Contém front matter YAML estrito e corpo Markdown. O corpo aceita apenas os nós e blocos editoriais autorizados.

### JSONs auxiliares

Fontes, correções e mídia são reconstruídas por allowlist. Campos desconhecidos ou privados das entradas nunca são copiados por espalhamento de objeto.

### `provenance.public.json`

A proveniência pública contém:

- ID editorial público;
- versão do exportador;
- horário de exportação fornecido pela entrada;
- contagens públicas;
- resultados de sanitização;
- hashes SHA-256 dos snapshots normalizados de entrada.

Ela **não contém** IDs do Google Docs/Sheets, revisões internas, URLs privadas, comentários, corpo privado ou notas editoriais.

## Fronteira de segurança

A exportação falha quando encontra:

- sugestões ou comentários não resolvidos;
- links privados do Google Docs, Drive ou Sheets;
- endereços locais ou IPs privados;
- parâmetros de URL semelhantes a tokens e assinaturas;
- marcadores internos como `PENDENTE`, `CONFIRMAR` e `NÃO PUBLICAR`;
- HTML executável ou protocolos perigosos;
- conflito entre metadados do documento e da planilha;
- revisão editorial, factual ou técnica não aprovada;
- enum, nó, bloco ou metadado desconhecido;
- destino existente sem autorização de sobrescrita.

## Determinismo

Para a mesma entrada normalizada:

- IDs derivados são estáveis;
- a ordenação dos JSONs é estável;
- os bytes dos cinco arquivos são idênticos;
- os checksums são idênticos.

O golden oficial está em `fixtures/exporter/golden/`.

## Comandos de validação

```bash
node --test tests/exporter/*.test.mjs
node scripts/scan-public-artifact.mjs fixtures/exporter/golden
```
