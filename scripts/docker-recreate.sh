#!/usr/bin/env bash
# docker-recreate.sh — docker compose up -d → 轮询 education-web-1 健康状态直到 healthy（约 30s 超时）。
# 用途：生产/容器模式下重启栈并等到 web 容器健康，再做后续验证。
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose up -d
echo "--- wait health (max ~30s) ---"
for _ in $(seq 1 10); do
  s="$(docker inspect -f '{{.State.Health.Status}}' education-web-1 2>/dev/null || echo unknown)"
  echo "web: $s"
  if [ "$s" = "healthy" ]; then break; fi
  sleep 3
done
