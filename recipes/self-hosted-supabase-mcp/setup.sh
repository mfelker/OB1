#!/bin/sh
# setup.sh: one-time, resumable setup for the lean self-hosted Supabase stack (spec 006 contract C1).
set -eu

PIN="self-hosted/v0.8.5"
SUPABASE_REPO="https://github.com/supabase/supabase"
RECIPE_DIR=$(cd "$(dirname "$0")" && pwd)
CLONE="$RECIPE_DIR/supabase"
FUNCTION_DIR="$RECIPE_DIR/../../integrations/self-hosted-llm-mcp"
ENV_FILE="$CLONE/docker/.env"
TESTED_COMPOSE="v5.6.1"
# Keys Supabase's utils/generate-keys.sh writes. They are never regenerated in an existing .env:
# they sign the stored API keys and the dashboard login.
SUPABASE_KEYS="JWT_SECRET ANON_KEY SERVICE_ROLE_KEY SECRET_KEY_BASE REALTIME_DB_ENC_KEY VAULT_ENC_KEY PG_META_CRYPTO_KEY LOGFLARE_PUBLIC_ACCESS_TOKEN LOGFLARE_PRIVATE_ACCESS_TOKEN S3_PROTOCOL_ACCESS_KEY_ID S3_PROTOCOL_ACCESS_KEY_SECRET MINIO_ROOT_PASSWORD POSTGRES_PASSWORD DASHBOARD_PASSWORD"

MODEL_SETTINGS="EMBEDDING_API_BASE EMBEDDING_API_KEY EMBEDDING_MODEL CHAT_API_BASE CHAT_API_KEY CHAT_MODEL FETCH_TIMEOUT_MS"
KEEP_KEYS="Setup does not regenerate Supabase keys in an existing .env; see \"Starting over\" in README.md. Nothing was changed."

die() { printf 'setup.sh: %s\n' "$*" >&2; exit 1; }
add_mcp_key() { printf '\n# Open Brain MCP access key (spec 004)\nMCP_ACCESS_KEY=%s\n' "$(openssl rand -hex 32)" >> "$1"; }

for tool in docker git openssl; do
  command -v "$tool" >/dev/null 2>&1 || die "$tool not found on PATH"
done

# The stack mounts spec 004's MCP server from this checkout; fail before changing anything if it is absent.
[ -d "$FUNCTION_DIR" ] || die "this checkout has no integrations/self-hosted-llm-mcp, the MCP server the stack runs. Clone the full OB1 repository and run setup.sh from recipes/self-hosted-supabase-mcp."

if [ -f "$CLONE/docker/docker-compose.yml" ]; then
  tag=$(git -C "$CLONE" describe --tags --exact-match 2>/dev/null || echo "an unknown version")
  [ "$tag" = "$PIN" ] || die "supabase/ is at $tag, but this recipe is pinned to $PIN. To change the pin, see \"Changing the Supabase version\" in README.md; nothing was changed."
  echo "clone: already present"
else
  git clone --quiet --depth 1 --branch "$PIN" "$SUPABASE_REPO" "$CLONE"
  echo "clone: completed"
fi

# Can this Docker Compose read the recipe? (include: with !reset/!override overrides.)
# The include needs its env file, so a placeholder stands in until the real one exists.
# An empty .env holds no keys (an interrupted earlier check can leave one); treat it as absent.
placeholder=""
if [ ! -s "$ENV_FILE" ]; then placeholder=1; : > "$ENV_FILE"; trap 'rm -f "$ENV_FILE"' INT TERM; fi
if ! (cd "$RECIPE_DIR" && docker compose config -q >/dev/null 2>&1); then
  [ -n "$placeholder" ] && rm -f "$ENV_FILE"
  found=$(docker compose version --short 2>/dev/null || echo "unknown")
  die "Docker Compose $found cannot read this recipe's compose files. Update Docker Compose; this recipe was tested with Compose $TESTED_COMPOSE."
fi
[ -n "$placeholder" ] && { rm -f "$ENV_FILE"; trap - INT TERM; }

# Secrets. A new .env is built in a temporary folder by Supabase's own generator and moved into
# place only when complete, so an interrupted run leaves no .env. An existing .env keeps every
# Supabase key as it is; only the OB1 key is added if it is missing.
if [ ! -s "$ENV_FILE" ]; then
  build=$(mktemp -d "${TMPDIR:-/tmp}/ob1-setup.XXXXXX")
  trap 'rm -rf "$build"' EXIT
  cp "$CLONE/docker/.env.example" "$build/.env"
  (cd "$build" && sh "$CLONE/docker/utils/generate-keys.sh" --update-env >/dev/null)
  add_mcp_key "$build/.env"
  mv "$build/.env" "$ENV_FILE"
  echo "secrets: completed"
else
  for k in $SUPABASE_KEYS; do
    grep -q "^$k=" "$ENV_FILE" || die "supabase/docker/.env has no $k. $KEEP_KEYS"
    value=$(sed -n "s/^$k=//p" "$ENV_FILE" | head -n 1)
    example=$(sed -n "s/^$k=//p" "$CLONE/docker/.env.example" | head -n 1)
    [ "$value" != "$example" ] || die "$k in supabase/docker/.env still has its .env.example value. $KEEP_KEYS"
  done
  if grep -q '^MCP_ACCESS_KEY=' "$ENV_FILE"; then
    echo "secrets: already present"
  else
    add_mcp_key "$ENV_FILE"
    echo "secrets: completed"
  fi
fi

# Model server settings (spec 004 names): add any name that is missing, blank.
added=""
for k in $MODEL_SETTINGS; do
  grep -q "^$k=" "$ENV_FILE" && continue
  [ -n "$added" ] || printf '\n# Model server settings (spec 004); fill these in, see README.md\n' >> "$ENV_FILE"
  printf '%s=\n' "$k" >> "$ENV_FILE"
  added=1
done
if [ -n "$added" ]; then echo "model-settings: completed"; else echo "model-settings: already present"; fi

echo "function-link: present"
