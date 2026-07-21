#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
MODE=dry-run; SEVERITY=warning; CODE=""; ACTION=""; MESSAGE=""; RUN_ID=""; COMPONENT=subsolo
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) MODE=dry-run ;; --apply) MODE=apply ;;
    --severity) shift; SEVERITY=${1:-} ;; --code) shift; CODE=${1:-} ;; --action) shift; ACTION=${1:-} ;;
    --message) shift; MESSAGE=${1:-} ;; --run-id) shift; RUN_ID=${1:-} ;; --component) shift; COMPONENT=${1:-} ;;
    *) fail "Argumento desconhecido: $1" ;;
  esac; shift
done
[ -n "$CODE" ] || fail "Informe --code."; [ -n "$ACTION" ] || fail "Informe --action."
BODY="$CODE${MESSAGE:+\n$MESSAGE}\nAção: $ACTION${RUN_ID:+\nRun: $RUN_ID}"
info "Alerta $SEVERITY/$CODE para $COMPONENT; ação definida."
if [ "$MODE" = dry-run ]; then info "DRY-RUN: nenhum alerta enviado."; exit 0; fi
require_env; require_command curl
[ -n "${SUBSOLO_NTFY_URL:-}" ] || fail "SUBSOLO_NTFY_URL ausente."
[ -n "${SUBSOLO_NTFY_TOPIC:-}" ] || fail "SUBSOLO_NTFY_TOPIC ausente."
headers=""
if [ -n "${SUBSOLO_NTFY_TOKEN:-}" ]; then headers="Authorization: Bearer ${SUBSOLO_NTFY_TOKEN}"; fi
if [ -n "$headers" ]; then
  curl --fail --silent --show-error --max-time 8 -H "$headers" -H "Title: SUBSOLO · $COMPONENT" -H "Priority: $([ "$SEVERITY" = critical ] && echo 5 || echo 4)" --data-binary "$BODY" "${SUBSOLO_NTFY_URL%/}/$SUBSOLO_NTFY_TOPIC" >/dev/null
else
  curl --fail --silent --show-error --max-time 8 -H "Title: SUBSOLO · $COMPONENT" -H "Priority: $([ "$SEVERITY" = critical ] && echo 5 || echo 4)" --data-binary "$BODY" "${SUBSOLO_NTFY_URL%/}/$SUBSOLO_NTFY_TOPIC" >/dev/null
fi
info "Alerta entregue ao ntfy."
