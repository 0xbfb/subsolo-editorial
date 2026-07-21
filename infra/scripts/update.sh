#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
mode_from_args "$@"
require_docker
require_env
compose --profile core config >/dev/null
if [ "$MODE" = dry-run ]; then
  info "DRY-RUN: listaria imagens e executaria pull sem reiniciar containers"
  compose --profile core config --images
  exit 0
fi
compose --profile core pull
info "Imagens baixadas. Revise changelogs e execute start.sh --apply para recriar quando aprovado."
