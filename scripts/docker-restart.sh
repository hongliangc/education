#!/usr/bin/env bash
# 重启生产 Docker 栈，并等待 web 容器恢复健康。
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ 重启 Docker 栈…"
docker compose restart

echo "▶ 等待 web 健康检查…"
for _ in $(seq 1 20); do
  status="$(docker inspect -f '{{.State.Health.Status}}' education-web-1 2>/dev/null || echo unknown)"
  echo "  health=$status"
  if [ "$status" = "healthy" ]; then
    docker compose ps
    exit 0
  fi
  sleep 3
done

echo "❌ web 容器未在 60 秒内恢复 healthy"
docker compose ps
exit 1
