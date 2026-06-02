#!/usr/bin/env bash
# dev-status.sh — 打印 dev server 日志尾 + :3000 端口占用 + curl 是否可用。
# 用途：dev 起不来 / 端口被占 / 行为异常时，一眼看现状（只读，不动任何进程）。
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== LOG (tail 30) ==="
tail -30 /tmp/mlk-dev.log 2>/dev/null || echo "(no /tmp/mlk-dev.log)"
echo "=== PORT 3000 ==="
ss -ltnp 2>/dev/null | grep ':3000' || echo "nothing on 3000"
echo "=== curl ==="
command -v curl >/dev/null && echo "curl ok" || echo "no curl"
