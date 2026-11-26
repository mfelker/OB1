#!/bin/sh
# setup.sh: one-time, resumable setup for the lean self-hosted Supabase stack (spec 006 contract C1).
set -eu

PIN="self-hosted/v0.8.5"
SUPABASE_REPO="https://github.com/supabase/supabase"
RECIPE_DIR=$(cd "$(dirname "$0")" && pwd)
CLONE="$RECIPE_DIR/supabase"

die() { printf 'setup.sh: %s\n' "$*" >&2; exit 1; }

for tool in docker git openssl; do
  command -v "$tool" >/dev/null 2>&1 || die "$tool not found on PATH"
done

if [ -f "$CLONE/docker/docker-compose.yml" ]; then
  echo "clone: already present"
else
  git clone --quiet --depth 1 --branch "$PIN" "$SUPABASE_REPO" "$CLONE"
fi

echo "setup.sh: not implemented" >&2
exit 1
