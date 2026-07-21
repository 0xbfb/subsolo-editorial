#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
INFRA_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$INFRA_DIR/.." && pwd)
ENV_FILE=${SUBSOLO_ENV_FILE:-$INFRA_DIR/env/.env}
COMPOSE_FILE=$INFRA_DIR/compose.yml
DOCKER_BIN=${SUBSOLO_DOCKER_BIN:-docker}

json_escape() { printf '%s' "$1" | tr '\n\r\t' '   ' | sed 's/\\/\\\\/g; s/"/\\"/g'; }
log_event() {
  level=$1; event=$2; shift 2
  message=$(json_escape "$*")
  printf '{"timestamp":"%s","level":"%s","service":"subsolo-infra","event":"%s","message":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$level" "$event" "$message"
}
fail() { log_event error failure "$*" >&2; exit 1; }
info() { log_event info operation "$*"; }
warn() { log_event warning warning "$*" >&2; }

require_command() { command -v "$1" >/dev/null 2>&1 || fail "Comando obrigatório ausente: $1"; }
require_docker() {
  command -v "$DOCKER_BIN" >/dev/null 2>&1 || fail "Docker não encontrado. Instale Docker Desktop ou Docker Engine."
  "$DOCKER_BIN" compose version >/dev/null 2>&1 || fail "Docker Compose v2 não encontrado."
}
require_env() {
  [ -f "$ENV_FILE" ] || fail "Arquivo $ENV_FILE ausente. Copie infra/env/.env.example e troque os valores CHANGEME."
  if grep -q 'CHANGEME' "$ENV_FILE"; then fail "O arquivo $ENV_FILE ainda contém valores CHANGEME."; fi
  # Carrega apenas o ambiente local explicitamente selecionado.
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
}
compose() { "$DOCKER_BIN" compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }
mode_from_args() {
  MODE=dry-run
  for arg in "$@"; do case "$arg" in --dry-run) MODE=dry-run ;; --apply) MODE=apply ;; *) fail "Argumento desconhecido: $arg" ;; esac; done
}
