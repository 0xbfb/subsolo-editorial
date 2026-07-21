#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
require_docker
require_env
services=$(compose --profile core config --services)
failed=0
for service in $services; do
  cid=$(compose --profile core ps -q "$service")
  if [ -z "$cid" ]; then
    printf '%-16s %s\n' "$service" "não iniciado"
    failed=1
    continue
  fi
  state=$(docker inspect -f '{{.State.Status}}' "$cid")
  health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}sem-healthcheck{{end}}' "$cid")
  printf '%-16s state=%s health=%s\n' "$service" "$state" "$health"
  [ "$state" = running ] || failed=1
  [ "$health" = healthy ] || failed=1
done
exit "$failed"
