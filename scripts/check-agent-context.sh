#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

fail=0

check_max_lines() {
  local file="$1"
  local max="$2"
  local lines

  lines="$(wc -l < "$file")"
  if (( lines > max )); then
    printf 'FAIL: %s has %s lines (max %s)\n' "$file" "$lines" "$max"
    fail=1
  fi
}

check_absent() {
  local path="$1"

  if [[ -e "$path" ]]; then
    printf 'FAIL: obsolete path still exists: %s\n' "$path"
    fail=1
  fi
}

check_max_lines AGENTS.md 80
check_max_lines CLAUDE.md 50

check_absent .workflow
check_absent docs/agent
check_absent WORKFLOW.md
check_absent scripts/init-workflow.sh
check_absent scripts/check-routing-sync.sh

if ! grep -q '/mnt/e/workspace/knowledge-wiki/' CLAUDE.md; then
  echo 'FAIL: CLAUDE.md must identify the external WSL wiki path'
  fail=1
fi

obsolete_refs="$(
  grep -nE '\.workflow|WORKFLOW\.md|init-workflow|check-routing-sync' \
    AGENTS.md CLAUDE.md skills/README.md scripts/README.md || true
)"
if [[ -n "$obsolete_refs" ]]; then
  echo 'FAIL: active guidance still references the obsolete workflow layer'
  printf '%s\n' "$obsolete_refs"
  fail=1
fi

if (( fail != 0 )); then
  exit 1
fi

echo 'agent context checks passed'
