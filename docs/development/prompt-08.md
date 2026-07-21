# Prompt 08 — Exportador determinístico com Docs e Sheets mockados

**Versão:** `0.5.0-dev`

## Resultado

Foi criada uma CLI funcional e independente das APIs Google. A lógica usa uma AST editorial explícita, valida metadados e revisões, sanitiza o documento por allowlist e produz Markdown com front matter acompanhado de JSONs auxiliares.

## Entregas

- comando `subsolo export-doc`;
- providers de fixture para Sheets e Docs;
- AST de parágrafo, heading, citação, lista, tabela e bloco editorial;
- transformação determinística para cinco arquivos públicos;
- sanitização de texto, links, campos e estruturas;
- proveniência pública baseada em hashes, sem IDs privados do Google;
- dry-run sem escrita;
- apply atômico;
- sobrescrita explícita sem resíduos;
- golden outputs;
- testes de contrato, segurança e determinismo.

## Decisões

- o adapter de fixture simula a fronteira futura dos providers Google;
- o corpo não passa por limpeza de HTML bruto;
- comentários e sugestões bloqueiam a exportação, em vez de serem removidos silenciosamente;
- links privados bloqueiam a exportação;
- fontes, correções e mídia são reconstruídas por allowlist;
- IDs públicos são determinísticos a partir do identificador editorial;
- dry-run não escreve arquivos;
- apply usa diretório temporário e rename;
- apply não sobrescreve destino sem opção explícita;
- a proveniência pública identifica snapshots por SHA-256, não por IDs de Google Docs/Sheets.

## Fora de escopo preservado

- nenhuma autenticação Google;
- nenhuma alteração Git;
- nenhum ZIP de edição;
- nenhuma chamada externa;
- nenhum workflow n8n.

## Evidências

- 19 testes específicos do exportador;
- golden parseado pelo contrato público real;
- duas execuções apply com checksums idênticos;
- dry-run confirmado sem criação do destino;
- varredura do artefato público aprovada.
