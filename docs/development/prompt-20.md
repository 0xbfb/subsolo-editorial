# Prompt 20 — revisão completa pré-release

**Versão:** `1.0.0-pre`

## Escopo executado

- auditoria plano versus implementação;
- matriz de rastreabilidade;
- suíte acumulada e validadores offline;
- fluxo fixture ponta a ponta;
- restore criptografado em diretório limpo;
- aceitação automatizada em Chromium;
- SBOM direto e inventário de arquivos;
- revisão de resíduos, documentação e pacote;
- decisão formal de release.

## Regra de decisão

A pré-release pode ser empacotada para homologação mesmo com bloqueadores explícitos. Ela não pode avançar para RC1 até `release:verify` retornar `go` sem `--allow-blockers`.
