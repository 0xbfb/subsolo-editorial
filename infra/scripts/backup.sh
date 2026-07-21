#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"
MODE=dry-run
OUTPUT_DIR=""
PASSPHRASE_FILE=${SUBSOLO_BACKUP_PASSPHRASE_FILE:-}
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) MODE=dry-run ;;
    --apply) MODE=apply ;;
    --output) shift; OUTPUT_DIR=${1:-} ;;
    --passphrase-file) shift; PASSPHRASE_FILE=${1:-} ;;
    *) fail "Argumento desconhecido: $1" ;;
  esac
  shift
done
BACKUP_ROOT=${OUTPUT_DIR:-${SUBSOLO_BACKUP_DIR:-$INFRA_DIR/backups}}
STAMP=${SUBSOLO_BACKUP_TIMESTAMP:-$(date -u +%Y%m%dT%H%M%SZ)}
ARCHIVE_BASE="subsolo-backup-$STAMP"
FINAL="$BACKUP_ROOT/$ARCHIVE_BASE.tar.gz.enc"
VOLUMES="n8n_data freshrss_data freshrss_extensions uptime_kuma_data"
PRODUCT_VERSION=${SUBSOLO_PRODUCT_VERSION:-$(node -e 'const p=require(process.argv[1]); process.stdout.write(p.version)' "$PROJECT_ROOT/package.json")}
info "Plano de backup: PostgreSQL lógico, n8n, FreshRSS e Uptime Kuma."
info "Artefato final criptografado: $FINAL"
info "RPO=24h; RTO=4h; retenção local=${SUBSOLO_BACKUP_RETENTION_DAYS:-14} dias."
if [ "$MODE" = dry-run ]; then
  info "DRY-RUN: nenhum container, volume ou arquivo será alterado."
  exit 0
fi
require_docker; require_env; require_command openssl; require_command tar; require_command sha256sum; require_command node
[ -n "$PASSPHRASE_FILE" ] || fail "Defina SUBSOLO_BACKUP_PASSPHRASE_FILE ou use --passphrase-file."
[ -f "$PASSPHRASE_FILE" ] || fail "Arquivo de passphrase inexistente: $PASSPHRASE_FILE"
[ -s "$PASSPHRASE_FILE" ] || fail "Arquivo de passphrase vazio."
mkdir -p "$BACKUP_ROOT"
STAGING=$(mktemp -d "$BACKUP_ROOT/.staging-$STAMP-XXXXXX")
PLAIN=$(mktemp "$BACKUP_ROOT/.plain-$STAMP-XXXXXX.tar.gz")
cleanup(){ rm -rf "$STAGING" "$PLAIN"; }
trap cleanup EXIT INT TERM

log_event info backup.postgres.start "Gerando dump lógico PostgreSQL."
compose --profile core exec -T postgres pg_dump -U "${POSTGRES_USER:-subsolo_n8n}" -d "${POSTGRES_DB:-subsolo_n8n}" -Fc > "$STAGING/postgres.dump"
[ -s "$STAGING/postgres.dump" ] || fail "pg_dump gerou arquivo vazio."
for name in $VOLUMES; do
  volume="${COMPOSE_PROJECT_NAME:-subsolo}_$name"
  log_event info backup.volume.start "Arquivando volume $name."
  "$DOCKER_BIN" run --rm -v "$volume:/source:ro" -v "$STAGING:/backup" alpine:3.22 sh -c "cd /source && tar -czf /backup/$name.tar.gz ."
  [ -s "$STAGING/$name.tar.gz" ] || fail "Arquivo do volume $name ficou vazio."
done
cat > "$STAGING/runtime.json" <<JSON
{
  "schema_version": 1,
  "product_version": "$PRODUCT_VERSION",
  "timezone": "${SUBSOLO_TIMEZONE:-America/Sao_Paulo}",
  "compose_project": "${COMPOSE_PROJECT_NAME:-subsolo}",
  "postgres_database": "${POSTGRES_DB:-subsolo_n8n}",
  "secrets_included": false
}
JSON
node "$PROJECT_ROOT/scripts/backup-manifest.mjs" create --directory "$STAGING" --created-at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --product-version "$PRODUCT_VERSION" >/dev/null
node "$PROJECT_ROOT/scripts/backup-manifest.mjs" validate --directory "$STAGING" >/dev/null
( cd "$STAGING" && tar -czf "$PLAIN" . )
[ -s "$PLAIN" ] || fail "Bundle temporário vazio."
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$PLAIN" -out "$FINAL.tmp" -pass "file:$PASSPHRASE_FILE"
mv "$FINAL.tmp" "$FINAL"
chmod 600 "$FINAL"
sha256sum "$FINAL" > "$FINAL.sha256"
chmod 600 "$FINAL.sha256"
# Metadados externos não contêm segredos e permitem inventário sem descriptografar.
cat > "$FINAL.metadata.json" <<JSON
{
  "schema_version": 1,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "artifact": "$(basename "$FINAL")",
  "encryption": "AES-256-CBC/PBKDF2",
  "rpo_hours": 24,
  "rto_hours": 4,
  "contains_plaintext_credentials": false
}
JSON
chmod 600 "$FINAL.metadata.json"
find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'subsolo-backup-*.tar.gz.enc' -mtime "+${SUBSOLO_BACKUP_RETENTION_DAYS:-14}" -delete
info "Backup criptografado concluído: $FINAL"
