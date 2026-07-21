#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
mode_from_args "$@"
require_docker
require_env
info "Gerando configuração segura do SearXNG"
"$SCRIPT_DIR/render-searxng.sh"
info "Validando configuração da stack core"
compose --profile core config >/dev/null
if [ "$MODE" = dry-run ]; then
  info "DRY-RUN: executaria docker compose --profile core up -d"
  exit 0
fi
compose --profile core up -d
compose --profile core ps
