#!/usr/bin/env bash
# 重建并重启 web 容器（生产构建：改了 app/ components/ content/ lib/ 等代码后用，无热更需重建）。
# 用法（WSL 内）：bash scripts/docker-rebuild-web.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ 重建 web 镜像并重启…"
docker compose up -d --build web

echo "▶ 等待 web 健康检查…"
for _ in $(seq 1 30); do
  status="$(docker inspect -f '{{.State.Health.Status}}' education-web-1 2>/dev/null || echo unknown)"
  echo "  health=$status"
  if [ "$status" = "healthy" ]; then
    break
  fi
  sleep 2
done

echo "✅ 完成。浏览器请硬刷新（Ctrl+F5）——生产 bundle 带 hash 缓存，旧标签页会命中旧代码。"
