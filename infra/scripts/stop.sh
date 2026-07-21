#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
mode_from_args "$@"
require_docker
require_env
if [ "$MODE" = dry-run ]; then
  info "DRY-RUN: executaria docker compose --profile core stop"
  exit 0
fi
compose --profile core stop
