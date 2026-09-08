#!/usr/bin/env bash
# One-off: purge @example.com test accounts from PROD_DB (apps/api/.env).
# Guarded transaction — rolls back unless 18 real users / 0 test users remain.
set -euo pipefail

cd "$(dirname "$0")/.."

PROD_DB="$(grep '^PROD_DB=' .env | cut -d= -f2-)"
if [[ -z "${PROD_DB:-}" ]]; then
  echo "PROD_DB not found in apps/api/.env" >&2
  exit 1
fi

exec psql "$PROD_DB" --single-transaction -v ON_ERROR_STOP=1 \
  -f scripts/purge-test-users.sql
