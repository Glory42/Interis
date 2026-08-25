#!/bin/sh
set -e

echo "Running database migrations..."
bun run scripts/docker-migrate.ts

exec "$@"
