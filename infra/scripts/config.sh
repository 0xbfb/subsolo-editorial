#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
require_docker
require_env
"$SCRIPT_DIR/render-searxng.sh"
compose --profile core config "$@"
