#!/usr/bin/env bash
# 启动生产 Docker 栈，并等待 web 容器健康。
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ 启动 Docker 栈…"
docker compose up -d

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

echo "❌ web 容器未在 60 秒内达到 healthy"
docker compose ps
exit 1
