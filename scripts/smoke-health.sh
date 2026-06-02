#!/usr/bin/env bash
# smoke-health.sh — 起 dev server → 轮询 /api/health → 打印 health + 日志尾 → 清理进程。
# 用途：快速确认 dev 能起来且健康检查通过（一次性冒烟，跑完自动关掉 dev）。
set -euo pipefail
cd "$(dirname "$0")/.."

pkill -f "next dev" 2>/dev/null || true
pkill -f next-server 2>/dev/null || true
sleep 1

( npm run dev > /tmp/mlk-dev.log 2>&1 & )

echo "--- waiting for /api/health (max 90s) ---"
for _ in $(seq 1 90); do
  if curl -s -o /dev/null "http://localhost:3000/api/health"; then break; fi
  sleep 1
done

echo "--- HEALTH ---"
curl -s -w '\nHTTP_%{http_code}\n' "http://localhost:3000/api/health" || true
echo "--- LOG TAIL ---"
tail -8 /tmp/mlk-dev.log 2>/dev/null || true

pkill -f "next dev" 2>/dev/null || true
pkill -f next-server 2>/dev/null || true
