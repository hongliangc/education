#!/usr/bin/env bash
# Fail if the routing block in WORKFLOW.md §3 and scripts/init-workflow.sh
# emit_routing() drift apart (whitespace-insensitive).
set -euo pipefail
cd "$(dirname "$0")/.."

wf="$(awk '
  /^## 3\./             {in3=1}
  in3 && /^```markdown/ {grab=1; next}
  grab && /^```/        {grab=0; in3=0}
  grab                  {print}
' WORKFLOW.md)"

init="$(awk '/cat <<.RT./{g=1;next} g&&/^RT$/{g=0} g{print}' \
  scripts/init-workflow.sh | grep -v '<!-- workflow-routing -->')"

norm() { sed 's/[[:space:]]*$//' | grep -v '^[[:space:]]*$'; }

if ! diff <(printf '%s\n' "$wf" | norm) <(printf '%s\n' "$init" | norm) >/dev/null; then
  echo "ROUTING DRIFT: WORKFLOW.md §3 vs init-workflow.sh emit_routing"
  diff <(printf '%s\n' "$wf" | norm) <(printf '%s\n' "$init" | norm) || true
  exit 1
fi
echo "routing block in sync"
