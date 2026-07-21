BEGIN;
CREATE TABLE IF NOT EXISTS publication_runs (
  run_id text PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  article_id text NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  edition_id text NOT NULL,
  state text NOT NULL,
  package_sha256 text,
  drive_file_id text,
  branch text,
  pull_request_url text,
  error_code text,
  retryable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS publication_locks (
  idempotency_key text PRIMARY KEY,
  owner_run_id text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS publication_dead_letters (
  id bigserial PRIMARY KEY,
  run_id text NOT NULL,
  idempotency_key text NOT NULL,
  error_code text NOT NULL,
  retryable boolean NOT NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
