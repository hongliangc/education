#!/usr/bin/env bash
# 停止生产 Docker 栈，保留容器和数据卷，便于稍后快速启动。
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ 停止 Docker 栈…"
docker compose stop
docker compose ps
echo "✅ Docker 栈已停止，数据卷保持不变。"
