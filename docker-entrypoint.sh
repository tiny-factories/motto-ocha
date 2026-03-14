#!/bin/sh
set -e
cd /app
if command -v npx >/dev/null 2>&1; then
  npx prisma migrate deploy 2>/dev/null || true
fi
exec "$@"
