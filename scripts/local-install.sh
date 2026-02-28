#!/usr/bin/env bash
set -euo pipefail

# Skip "--" that pnpm passes through
[[ "${1:-}" == "--" ]] && shift

TARGET="${1:?Usage: pnpm local-install -- <target-skill-dir>}"
SRC="$(cd "$(dirname "$0")/../skills/soulsys" && pwd)"

mkdir -p "$TARGET/scripts"
cp "$SRC/SKILL.md" "$SRC/BOOTSTRAP.md" "$TARGET/"
cp "$SRC/scripts/soulsys.js" "$TARGET/scripts/"
echo "✓ Installed to $TARGET"
