# Validação dos workflows

A sequência confirmada é: lock → exportação → validação → pacote → Drive → branch → commit → pull request → Sheets → conclusão. O teste garante que uma falha no Drive ocorre antes de qualquer efeito Git. A mesma chave `article_id + revision` não cria um segundo PR.
