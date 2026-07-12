#!/usr/bin/env bash
# 一键发布入口。必须显式选择目标，避免本地验证时误发布到现网。
#
#   bash scripts/release.sh local              # 构建镜像，用 production compose 在本机启动验证
#   bash scripts/release.sh prod               # 构建镜像，通过 scripts/deploy.sh 发布到 Lighthouse
#   IMAGE_TAG=20260617-01 bash scripts/release.sh local
#   PUSH_HUB=1 bash scripts/release.sh prod    # 额外推送 Docker Hub（需先 docker login）
#
# 两段式，local 与 prod 完全复用：
#   1. 构建：build_image 对两个 target 完全相同，产出同一个 DOCKER_IMAGE:IMAGE_TAG。
#   2. 部署：都交给同一个 scripts/deploy.sh <target>——它按入参渲染同一组参数并跑同一个
#      deploy-stack.sh；prod 唯一区别是 deploy.sh 会先把镜像与配置上传到服务器。
#
# 变量（均可覆盖）：DOCKER_IMAGE / IMAGE_TAG / PUSH_HUB / DEPLOY_MODE / DOCKER_CMD。
# 发布成功后会清理同仓库旧本地镜像标签；设 RELEASE_CLEANUP_IMAGES=0 可临时关闭。
# local 的 LOCAL_ENV_FILE / LOCAL_PROJECT_NAME / LOCAL_PUBLIC_URL 等覆盖项见 scripts/deploy.sh。
set -euo pipefail
cd "$(dirname "$0")/.."

usage() {
  cat <<'USAGE'
Usage: bash scripts/release.sh {local|prod}

Targets:
  local   Build the release image and run the production compose stack locally.
  prod    Build the release image and deploy it to the production server.

Aliases:
  local: --local
  prod:  production, --prod, --production
USAGE
}

target="${RELEASE_TARGET:-${1:-}}"
case "$target" in
  local|--local)
    target="local"
    ;;
  prod|production|--prod|--production)
    target="prod"
    ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 64
    ;;
esac

DOCKER_IMAGE="${DOCKER_IMAGE:-hlc2012/mlk}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
PUSH_HUB="${PUSH_HUB:-0}"
DEPLOY_MODE="${DEPLOY_MODE:-transfer}"
RELEASE_CLEANUP_IMAGES="${RELEASE_CLEANUP_IMAGES:-1}"
read -r -a DOCKER_CMD <<< "${DOCKER_CMD:-docker}"

if ! "${DOCKER_CMD[@]}" info >/dev/null 2>&1; then
  echo "Docker daemon 不可用。修复 Docker 权限或设置 DOCKER_CMD。" >&2
  exit 1
fi

build_image() {
  echo "▶ [1/2] 构建 ${DOCKER_IMAGE}:${IMAGE_TAG} (linux/amd64)"
  if [ "$PUSH_HUB" = "1" ]; then
    DOCKER_IMAGE="$DOCKER_IMAGE" IMAGE_TAG="$IMAGE_TAG" bash scripts/publish-image.sh
  else
    "${DOCKER_CMD[@]}" build \
      --platform linux/amd64 \
      --tag "${DOCKER_IMAGE}:${IMAGE_TAG}" \
      --tag "${DOCKER_IMAGE}:latest" \
      .
  fi
}

cleanup_old_images() {
  if [ "$RELEASE_CLEANUP_IMAGES" != "1" ]; then
    echo "▶ 跳过旧镜像清理（RELEASE_CLEANUP_IMAGES=${RELEASE_CLEANUP_IMAGES}）"
    return
  fi

  echo "▶ 清理旧本地镜像（保留 ${DOCKER_IMAGE}:${IMAGE_TAG} 和 ${DOCKER_IMAGE}:latest）"
  "${DOCKER_CMD[@]}" image ls "$DOCKER_IMAGE" --format '{{.Repository}}:{{.Tag}}' |
    while IFS= read -r ref; do
      case "$ref" in
        "${DOCKER_IMAGE}:${IMAGE_TAG}"|"${DOCKER_IMAGE}:latest"|*":<none>")
          ;;
        *)
          "${DOCKER_CMD[@]}" image rm "$ref" >/dev/null 2>&1 ||
            echo "  - 保留 ${ref}（仍被容器使用或删除失败）"
          ;;
      esac
    done
}

# ── 第 2 段：部署 ──────────────────────────────────────────────────────────
# local 与 prod 都交给同一个 deploy.sh：按 target 渲染参数、是否上传、以及在本机还是
# 服务器跑同一个 deploy-stack.sh，全部由 deploy.sh 内部处理。release.sh 不含 local/prod 部署分支。
build_image
echo "▶ [2/2] 部署 ${DOCKER_IMAGE}:${IMAGE_TAG}（target=${target}）"
DOCKER_IMAGE="$DOCKER_IMAGE" IMAGE_TAG="$IMAGE_TAG" DEPLOY_MODE="$DEPLOY_MODE" \
  bash scripts/deploy.sh "$target"

cleanup_old_images

echo "✅ 发布完成：${target} ${DOCKER_IMAGE}:${IMAGE_TAG}"
