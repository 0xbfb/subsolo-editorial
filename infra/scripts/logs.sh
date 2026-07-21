#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
require_docker
require_env
compose --profile core logs --tail="${SUBSOLO_LOG_TAIL:-200}" "$@"
