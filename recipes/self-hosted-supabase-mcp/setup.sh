#!/bin/sh
# setup.sh: one-time, resumable setup for the lean self-hosted Supabase stack (spec 006 contract C1).
set -eu

die() { printf 'setup.sh: %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "docker not found on PATH (install Docker with Docker Compose)"

echo "setup.sh: not implemented" >&2
exit 1
