#!/bin/sh
# Vercel runs this instead of `pnpm build` (the `vercel-build` script).
# Production deploys apply pending migrations first, so the tables always match the code.
set -e
if [ "$VERCEL_ENV" = "production" ]; then
  if [ -z "$DATABASE_URL_UNPOOLED$DATABASE_URL" ]; then
    echo "DATABASE_URL is not set. Connect Neon under Storage in the Vercel project, then redeploy." >&2
    exit 1
  fi
  pnpm db:migrate
fi
pnpm build
