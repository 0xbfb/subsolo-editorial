#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
require_env
secret=$(grep '^SEARXNG_SECRET=' "$ENV_FILE" | head -n1 | cut -d= -f2-)
[ -n "$secret" ] || fail "SEARXNG_SECRET vazio."
case "$secret" in *[\&|]*) fail "SEARXNG_SECRET contém caractere não suportado pelo renderizador: use segredo alfanumérico longo." ;; esac
sed "s|__SEARXNG_SECRET__|$secret|g" "$INFRA_DIR/searxng/settings.yml.template" > "$INFRA_DIR/searxng/settings.runtime.yml"
chmod 600 "$INFRA_DIR/searxng/settings.runtime.yml"
info "Configuração runtime do SearXNG gerada sem versionar o segredo."
