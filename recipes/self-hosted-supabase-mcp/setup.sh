#!/bin/sh
# setup.sh: one-time, resumable setup for the lean self-hosted Supabase stack (spec 006 contract C1).
set -eu

die() { printf 'setup.sh: %s\n' "$*" >&2; exit 1; }

for tool in docker git openssl; do
  command -v "$tool" >/dev/null 2>&1 || die "$tool not found on PATH"
done

echo "setup.sh: not implemented" >&2
exit 1
