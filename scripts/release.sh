#!/usr/bin/env bash
# 一键发布：把当前源码构建成服务器可运行的 linux/amd64 镜像，并通过 SSH 直传部署到
# Lighthouse 生产栈。默认 transfer 模式，全程不依赖 Docker Hub（广州直连私有 Registry
# 已验证会超时）。构建用的 publish-image.sh / 部署用的 deploy.sh 仍是底层积木，本脚本
# 只负责把两步串成一条命令。
#
#   bash scripts/release.sh                 # 自动生成版本号，构建 + 直传部署
#   IMAGE_TAG=20260617-01 bash scripts/release.sh
#   PUSH_HUB=1 bash scripts/release.sh      # 额外推送 Docker Hub（需先 docker login）
#   DEPLOY_MODE=pull PUSH_HUB=1 bash scripts/release.sh   # 推 Hub 后服务器直接拉取
#
# 变量（均可覆盖）：DOCKER_IMAGE / IMAGE_TAG / DEPLOY_HOST / DEPLOY_DIR / HEALTH_URL /
# DEPLOY_MODE / PUSH_HUB / DOCKER_CMD —— 含义见 deploy/README.md。
set -euo pipefail
cd "$(dirname "$0")/.."

DOCKER_IMAGE="${DOCKER_IMAGE:-hlc2012/mlk}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
PUSH_HUB="${PUSH_HUB:-0}"
DEPLOY_MODE="${DEPLOY_MODE:-transfer}"
read -r -a DOCKER_CMD <<< "${DOCKER_CMD:-docker}"

if ! "${DOCKER_CMD[@]}" info >/dev/null 2>&1; then
  echo "Docker daemon 不可用。修复 Docker 权限或设置 DOCKER_CMD。" >&2
  exit 1
fi

echo "▶ [1/2] 构建 ${DOCKER_IMAGE}:${IMAGE_TAG} (linux/amd64)"
if [ "$PUSH_HUB" = "1" ]; then
  # 推 Hub 时复用 publish-image.sh（buildx --push + 本地保留镜像）。
  DOCKER_IMAGE="$DOCKER_IMAGE" IMAGE_TAG="$IMAGE_TAG" bash scripts/publish-image.sh
else
  # 默认只构建本地镜像，供 transfer 直传，不碰 Docker Hub。
  "${DOCKER_CMD[@]}" build \
    --platform linux/amd64 \
    --tag "${DOCKER_IMAGE}:${IMAGE_TAG}" \
    --tag "${DOCKER_IMAGE}:latest" \
    .
fi

echo "▶ [2/2] 部署 ${DOCKER_IMAGE}:${IMAGE_TAG} → ${DEPLOY_HOST:-ubuntu@1.14.158.167} (${DEPLOY_MODE})"
DOCKER_IMAGE="$DOCKER_IMAGE" IMAGE_TAG="$IMAGE_TAG" DEPLOY_MODE="$DEPLOY_MODE" \
  bash scripts/deploy.sh

echo "✅ 发布完成：${DOCKER_IMAGE}:${IMAGE_TAG}"
