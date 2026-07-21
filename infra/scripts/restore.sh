#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
MODE=test
BACKUP_FILE=""
PASSPHRASE_FILE=${SUBSOLO_BACKUP_PASSPHRASE_FILE:-}
REPORT=""
CONFIRM=""
CURRENT_SNAPSHOT="false"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --test) MODE=test ;;
    --dry-run) MODE=dry-run ;;
    --apply) MODE=apply ;;
    --backup-file) shift; BACKUP_FILE=${1:-} ;;
    --passphrase-file) shift; PASSPHRASE_FILE=${1:-} ;;
    --report) shift; REPORT=${1:-} ;;
    --confirm-destructive) shift; CONFIRM=${1:-} ;;
    --current-snapshot-confirmed) CURRENT_SNAPSHOT=true ;;
    *) fail "Argumento desconhecido: $1" ;;
  esac
  shift
done
[ -n "$BACKUP_FILE" ] || BACKUP_FILE=${SUBSOLO_RESTORE_FILE:-}
[ -n "$BACKUP_FILE" ] || fail "Informe --backup-file CAMINHO."
[ -f "$BACKUP_FILE" ] || fail "Backup inexistente: $BACKUP_FILE"
[ -f "$BACKUP_FILE.sha256" ] || fail "Checksum externo ausente: $BACKUP_FILE.sha256"
[ -n "$PASSPHRASE_FILE" ] || fail "Informe --passphrase-file ou SUBSOLO_BACKUP_PASSPHRASE_FILE."
[ -s "$PASSPHRASE_FILE" ] || fail "Arquivo de passphrase inexistente ou vazio."
require_command openssl; require_command tar; require_command sha256sum; require_command node
( cd "$(dirname "$BACKUP_FILE")" && sha256sum -c "$(basename "$BACKUP_FILE").sha256" ) >/dev/null
WORK=$(mktemp -d "${TMPDIR:-/tmp}/subsolo-restore-XXXXXX")
PLAIN="$WORK/backup.tar.gz"
EXTRACTED="$WORK/extracted"
TEST_RESTORE="$WORK/test-restore"
cleanup(){ rm -rf "$WORK"; }
trap cleanup EXIT INT TERM
openssl enc -d -aes-256-cbc -pbkdf2 -in "$BACKUP_FILE" -out "$PLAIN" -pass "file:$PASSPHRASE_FILE"
mkdir -p "$EXTRACTED"
tar -xzf "$PLAIN" -C "$EXTRACTED"
node "$PROJECT_ROOT/scripts/backup-manifest.mjs" validate --directory "$EXTRACTED" >/dev/null
head=$(dd if="$EXTRACTED/postgres.dump" bs=5 count=1 2>/dev/null || true)
[ "$head" = "PGDMP" ] || fail "postgres.dump não possui cabeçalho de formato custom do pg_dump."
mkdir -p "$TEST_RESTORE"
for name in n8n_data freshrss_data freshrss_extensions uptime_kuma_data; do
  mkdir -p "$TEST_RESTORE/$name"
  tar -xzf "$EXTRACTED/$name.tar.gz" -C "$TEST_RESTORE/$name"
done
COMPONENT_COUNT=$(find "$TEST_RESTORE" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
[ "$COMPONENT_COUNT" = "4" ] || fail "Restore de teste não reconstruiu os quatro volumes."
STATUS=restorable
if [ "$MODE" = dry-run ]; then STATUS=validated; fi
if [ "$MODE" = apply ]; then
  require_docker; require_env
  [ "$CONFIRM" = "RESTORE_SUBSOLO" ] || fail "Use --confirm-destructive RESTORE_SUBSOLO."
  [ "$CURRENT_SNAPSHOT" = true ] || fail "Faça um backup atual e use --current-snapshot-confirmed."
  info "Restore destrutivo autorizado. Parando a stack."
  compose --profile core down
  for name in n8n_data freshrss_data freshrss_extensions uptime_kuma_data; do
    volume="${COMPOSE_PROJECT_NAME:-subsolo}_$name"
    "$DOCKER_BIN" volume create "$volume" >/dev/null
    "$DOCKER_BIN" run --rm -v "$volume:/target" -v "$EXTRACTED:/backup:ro" alpine:3.22 sh -c "rm -rf /target/* /target/.[!.]* /target/..?* 2>/dev/null || true; tar -xzf /backup/$name.tar.gz -C /target"
  done
  compose --profile core up -d postgres
  attempts=0
  until compose --profile core exec -T postgres pg_isready -U "${POSTGRES_USER:-subsolo_n8n}" -d "${POSTGRES_DB:-subsolo_n8n}" >/dev/null 2>&1; do attempts=$((attempts+1)); [ "$attempts" -lt 30 ] || fail "PostgreSQL não ficou pronto após o restore."; sleep 2; done
  compose --profile core exec -T postgres pg_restore -U "${POSTGRES_USER:-subsolo_n8n}" -d "${POSTGRES_DB:-subsolo_n8n}" --clean --if-exists --no-owner --no-privileges < "$EXTRACTED/postgres.dump"
  compose --profile core up -d
  "$SCRIPT_DIR/healthcheck.sh"
  STATUS=restored
fi
if [ -n "$REPORT" ]; then
  mkdir -p "$(dirname "$REPORT")"
  cat > "$REPORT" <<JSON
{
  "schema_version": 1,
  "status": "$STATUS",
  "backup_file": "$(basename "$BACKUP_FILE")",
  "components_validated": 5,
  "volume_archives_extracted": 4,
  "postgres_header_valid": true,
  "credentials_restored": false,
  "tested_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON
fi
info "Restore $MODE concluído com estado $STATUS."
