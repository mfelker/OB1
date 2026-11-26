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

# Secrets: Supabase's own generator fills a copy of .env.example. The file is built in a
# temporary folder and moved into place only when complete, so an interrupted run leaves no .env.
if [ ! -f "$ENV_FILE" ]; then
  build=$(mktemp -d)
  trap 'rm -rf "$build"' EXIT
  cp "$CLONE/docker/.env.example" "$build/.env"
  (cd "$build" && sh "$CLONE/docker/utils/generate-keys.sh" --update-env >/dev/null)
  printf '\n# Open Brain MCP access key (spec 004)\nMCP_ACCESS_KEY=%s\n' "$(openssl rand -hex 32)" >> "$build/.env"
  printf '\n# Model server settings (spec 004); fill these in, see README.md\n' >> "$build/.env"
  for k in EMBEDDING_API_BASE EMBEDDING_API_KEY EMBEDDING_MODEL CHAT_API_BASE CHAT_API_KEY CHAT_MODEL FETCH_TIMEOUT_MS; do
    printf '%s=\n' "$k" >> "$build/.env"
  done
  mv "$build/.env" "$ENV_FILE"
elif ! grep -q '^MCP_ACCESS_KEY=' "$ENV_FILE"; then
  printf '\n# Open Brain MCP access key (spec 004)\nMCP_ACCESS_KEY=%s\n' "$(openssl rand -hex 32)" >> "$ENV_FILE"
  echo "secrets: completed"
fi

# Model server settings (spec 004 names): add any name that is missing, blank.
added=""
for k in EMBEDDING_API_BASE EMBEDDING_API_KEY EMBEDDING_MODEL CHAT_API_BASE CHAT_API_KEY CHAT_MODEL FETCH_TIMEOUT_MS; do
  grep -q "^$k=" "$ENV_FILE" || { printf '%s=\n' "$k" >> "$ENV_FILE"; added=1; }
done
if [ -n "$added" ]; then echo "model-settings: completed"; fi

echo "setup.sh: not implemented" >&2
exit 1
