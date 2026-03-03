#!/usr/bin/env bash
set -euo pipefail

# Skip "--" that pnpm passes through
[[ "${1:-}" == "--" ]] && shift

TARGET="${1:?Usage: pnpm local-install -- <target-skill-dir>}"
SRC="$(cd "$(dirname "$0")/../skills/soulsys" && pwd)"
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

# Resolve relative paths from repo root, not package dir
if [[ "$TARGET" != /* ]]; then
  TARGET="$REPO_ROOT/$TARGET"
fi

mkdir -p "$TARGET/scripts" "$TARGET/templates"
cp "$SRC/SKILL.md" "$SRC/BOOTSTRAP.md" "$SRC/package.json" "$TARGET/"
cp "$SRC/scripts/soulsys" "$SRC/scripts/soulsys.js" "$TARGET/scripts/"
cp "$SRC/templates/"* "$TARGET/templates/"
echo "✓ Installed to $TARGET"
