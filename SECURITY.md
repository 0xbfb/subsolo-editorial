# Política de segurança do Subsolo

## Escopo

Esta política cobre o portal estático, workflows GitHub, CLI editorial, pacotes de edição e a infraestrutura local declarada em `infra/`.

## Comunicação responsável

O domínio e o canal institucional definitivos ainda não foram configurados. Até isso ocorrer, vulnerabilidades não devem ser enviadas por issue pública contendo detalhes exploráveis. A versão 1.0.0 fica bloqueada até existir um contato de segurança real e um arquivo `.well-known/security.txt` verificável.

## Princípios

- portal público sem analytics, cookies de rastreamento ou backend editorial;
- serviços locais vinculados ao loopback;
- permissões mínimas em GitHub Actions e APIs;
- conteúdo e metadados públicos reconstruídos por allowlist;
- nenhuma credencial, original ou backup em texto claro no repositório;
- toda exceção de vulnerabilidade precisa de responsável, prazo e decisão registrada.

## Gates para 1.0.0

1. `pnpm-lock.yaml` versionado;
2. auditoria online de advisories e licenças transitivas arquivada;
3. build Astro/Pagefind reproduzível;
4. revisão manual com teclado e leitor de tela;
5. contato de segurança real publicado;
6. headers HTTP adicionais avaliados para o host definitivo.
