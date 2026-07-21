# Auditoria das fontes recebidas

**Data:** 20 de julho de 2026  
**Versão do projeto:** 0.1.0-dev

## Resultado

Foram preservadas **12 fontes** no manifesto SHA-256.

## Duplicatas identificadas no diretório de origem

- `subsolo_stack_custo_zero_v1.md` e a variante `(1)` possuem o mesmo SHA-256;
- `subsolo_diretrizes_ux_ui_v1.0.md` e a variante `(1)` possuem o mesmo SHA-256;
- `subsolo_base_editorial_html_v1.0.zip` e a variante `(1)` possuem o mesmo SHA-256.

Somente a cópia canônica sem sufixo foi incorporada ao projeto.

## Base Jornal Concreto

- arquivo ZIP preservado sem alteração;
- **17 arquivos** extraídos como referência não executável;
- HTML, CSS e JavaScript não são importados pelo build bootstrap;
- a migração para componentes Astro pertence ao Prompt 05.

## Riscos e lacunas

- os documentos possuem versões editoriais potencialmente diferentes dentro do ZIP da redação; o Prompt 03 deverá definir qual catálogo é canônico;
- a base visual contém conteúdo demonstrativo e não deve ser usada como fonte editorial;
- integrações e segredos ainda não foram configurados;
- o CI remoto só poderá ser confirmado após publicação em repositório GitHub.

## Decisões

- preservação por checksum;
- referências fora de `src`;
- ausência de importação de referência no build;
- nenhuma tentativa de reconciliar conteúdo editorial nesta etapa.
