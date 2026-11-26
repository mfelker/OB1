#!/bin/sh
# setup.sh: one-time, resumable setup for the lean self-hosted Supabase stack (spec 006 contract C1).
set -eu

PIN="self-hosted/v0.8.5"
SUPABASE_REPO="https://github.com/supabase/supabase"
RECIPE_DIR=$(cd "$(dirname "$0")" && pwd)
CLONE="$RECIPE_DIR/supabase"
ENV_FILE="$CLONE/docker/.env"
TESTED_COMPOSE="v5.6.1"

die() { printf 'setup.sh: %s\n' "$*" >&2; exit 1; }

for tool in docker git openssl; do
  command -v "$tool" >/dev/null 2>&1 || die "$tool not found on PATH"
done

if [ -f "$CLONE/docker/docker-compose.yml" ]; then
  tag=$(git -C "$CLONE" describe --tags --exact-match 2>/dev/null || echo "an unknown version")
  [ "$tag" = "$PIN" ] || die "supabase/ is at $tag, but this recipe is pinned to $PIN. To change the pin, see \"Changing the Supabase version\" in README.md; nothing was changed."
  echo "clone: already present"
else
  git clone --quiet --depth 1 --branch "$PIN" "$SUPABASE_REPO" "$CLONE"
fi

# Can this Docker Compose read the recipe? (include: with !reset/!override overrides.)
# The include needs its env file, so a placeholder stands in until the real one exists.
placeholder=""
if [ ! -f "$ENV_FILE" ]; then placeholder=1; : > "$ENV_FILE"; fi
if ! (cd "$RECIPE_DIR" && docker compose config -q >/dev/null 2>&1); then
  [ -n "$placeholder" ] && rm -f "$ENV_FILE"
  found=$(docker compose version --short 2>/dev/null || echo "unknown")
  die "Docker Compose $found cannot read this recipe's compose files. Update Docker Compose; this recipe was tested with Compose $TESTED_COMPOSE."
fi
[ -n "$placeholder" ] && rm -f "$ENV_FILE"

echo "setup.sh: not implemented" >&2
exit 1
