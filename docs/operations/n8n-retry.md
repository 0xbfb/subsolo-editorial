# Reexecução e idempotência

A chave é `article_id + revision`. Uma execução concluída retorna `already-completed`; PR existente retorna `existing-pr`; lock ativo bloqueia nova execução. Uma nova tentativa reutiliza o run salvo e nunca duplica o PR.
