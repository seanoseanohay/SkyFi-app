#!/usr/bin/env sh
set -e
if [ -n "$DATABASE_URL" ]; then
  npx prisma migrate deploy
fi
exec npm run start
