#!/usr/bin/env bash
# 统一部署脚本：local 与 prod 走同一条路——「按 target 渲染入参 → 跑同一个 deploy-stack.sh」。
# 两个 target 渲染的是同一组键（见 stack_env），只有取值与来源不同；deploy-stack.sh 完全复用。
# prod 相对 local 唯一多出的步骤：把镜像与非密钥配置上传到服务器，并在服务器（而非本机）执行。
#
# 密钥零接触：本脚本只上传非密钥配置（compose / nginx / deploy-stack.sh）；密钥由 deploy-stack.sh
# 通过 ENV_FILE / APP_ENV_FILE 在各自环境注入——local 用本机 env 文件，prod 用服务器自带的
# /opt/kidora/.env(.production)，内容从不经过本脚本。详见 deploy/README.md「九、密钥流向」。
set -euo pipefail
cd "$(dirname "$0")/.."

# 目标：local 在本机起 production 栈做验证；prod 发布到 Lighthouse。无参时默认 prod（兼容旧用法）。
target="${1:-prod}"
case "$target" in
  local|--local) target="local" ;;
  prod|production|--prod|--production) target="prod" ;;
  *) echo "Usage: bash scripts/deploy.sh {local|prod}（旧的位置参数=镜像标签已改为环境变量 IMAGE_TAG）" >&2; exit 64 ;;
esac

# ── 通用入参：两个 target 共用同一份默认值与覆盖方式 ──
DOCKER_IMAGE="${DOCKER_IMAGE:-hlc2012/mlk}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DEPLOY_MODE="${DEPLOY_MODE:-transfer}"
read -r -a DOCKER_CMD <<< "${DOCKER_CMD:-docker}"

# ── 按 target 渲染差异入参：键完全相同，只是取值/来源不同（这就是「根据入参渲染不同参数」）──
if [ "$target" = "local" ]; then
  PROJECT_NAME="${LOCAL_PROJECT_NAME:-kidora-local-release}"   # 与现网 kidora 栈隔离
  DEPLOY_DIR="$PWD"                                            # compose project 目录 = 仓库根
  # 本地密钥文件：优先 LOCAL_ENV_FILE，否则 .env.local，再退回 .env；统一转绝对路径，
  # 否则 web 的 env_file 会按 DEPLOY_DIR 解析相对路径而找错文件。
  if [ -z "${LOCAL_ENV_FILE:-}" ]; then
    if [ -f .env.local ]; then ENV_FILE="$PWD/.env.local"; else ENV_FILE="$PWD/.env"; fi
  elif [[ "$LOCAL_ENV_FILE" = /* ]]; then ENV_FILE="$LOCAL_ENV_FILE"
  else ENV_FILE="$PWD/$LOCAL_ENV_FILE"; fi
  APP_ENV_FILE="${LOCAL_APP_ENV_FILE:-$ENV_FILE}"
  PUBLIC_URL="${LOCAL_PUBLIC_URL:-http://localhost}"
  COMPOSE_SUDO=0
  PULL_IF_MISSING=0
  # 本地 env 通常没有这两项，给 dev 默认值供 compose 插值（现网由服务器 .env 提供）。
  export POSTGRES_PASSWORD="${LOCAL_POSTGRES_PASSWORD:-mlk_dev_pw}"
  export AUTH_SECRET="${LOCAL_AUTH_SECRET:-dev-secret-please-replace-in-prod-0123456789abcdef}"
else
  DEPLOY_HOST="${DEPLOY_HOST:-ubuntu@119.91.153.49}"
  PROJECT_NAME=kidora
  DEPLOY_DIR="${DEPLOY_DIR:-/opt/kidora}"
  ENV_FILE="$DEPLOY_DIR/.env"
  APP_ENV_FILE="$DEPLOY_DIR/.env.production"
  PUBLIC_URL="${PUBLIC_URL:-}"
  COMPOSE_SUDO=1
  PULL_IF_MISSING=1
fi
HEALTH_URL="${HEALTH_URL:-${PUBLIC_URL:-http://kidora.cn}/api/health}"

# deploy-stack.sh 的入参集合：local 与 prod 用完全相同的键，仅取值不同。
stack_env=(
  "DOCKER_IMAGE=$DOCKER_IMAGE"
  "IMAGE_TAG=$IMAGE_TAG"
  "PROJECT_NAME=$PROJECT_NAME"
  "DEPLOY_DIR=$DEPLOY_DIR"
  "ENV_FILE=$ENV_FILE"
  "APP_ENV_FILE=$APP_ENV_FILE"
  "PUBLIC_URL=$PUBLIC_URL"
  "HEALTH_URL=$HEALTH_URL"
  "COMPOSE_SUDO=$COMPOSE_SUDO"
  "PULL_IF_MISSING=$PULL_IF_MISSING"
)

# ── local：直接在本机用上面这组入参跑 deploy-stack.sh，不接触服务器（exec 后不会进入下方 prod 段）──
if [ "$target" = "local" ]; then
  echo "▶ 本地部署 ${DOCKER_IMAGE}:${IMAGE_TAG}（project=${PROJECT_NAME}）"
  exec env "${stack_env[@]}" bash scripts/deploy-stack.sh
fi

# PROD-ONLY: 以下是 prod 相对 local 唯一多出的部分——上传 + 在服务器执行同一个 deploy-stack.sh。
echo "▶ 现网部署 ${DOCKER_IMAGE}:${IMAGE_TAG} → ${DEPLOY_HOST} (${DEPLOY_MODE})"

# 直传模式下镜像必须已在本地（否则 docker image save 会失败）；先报错，别等动了服务器才崩。
if [ "$DEPLOY_MODE" = "transfer" ] &&
   ! "${DOCKER_CMD[@]}" image inspect "${DOCKER_IMAGE}:${IMAGE_TAG}" >/dev/null 2>&1; then
  echo "本地不存在镜像 ${DOCKER_IMAGE}:${IMAGE_TAG}。" >&2
  echo "先构建：IMAGE_TAG=${IMAGE_TAG} bash scripts/publish-image.sh（或 docker build）。" >&2
  exit 1
fi

ssh "$DEPLOY_HOST" "mkdir -p '$DEPLOY_DIR/deploy' '$DEPLOY_DIR/scripts'"
# 只上传非密钥配置（compose / nginx / 共用的 deploy-stack.sh）；密钥不在其中。
scp deploy/docker-compose.production.yml deploy/nginx.production.conf \
  "${DEPLOY_HOST}:${DEPLOY_DIR}/deploy/"
scp scripts/deploy-stack.sh "${DEPLOY_HOST}:${DEPLOY_DIR}/scripts/"

if [ "$DEPLOY_MODE" = "transfer" ]; then
  echo "Transferring ${DOCKER_IMAGE}:${IMAGE_TAG} to ${DEPLOY_HOST}"
  "${DOCKER_CMD[@]}" image save "${DOCKER_IMAGE}:${IMAGE_TAG}" |
    gzip |
    ssh "$DEPLOY_HOST" "gunzip | sudo docker load"
elif [ "$DEPLOY_MODE" != "pull" ]; then
  echo "Unsupported DEPLOY_MODE: $DEPLOY_MODE (expected pull or transfer)" >&2
  exit 1
fi

# 在服务器执行与 local 完全相同的一组入参（仅 COMPOSE_SUDO/PULL_IF_MISSING/路径取值不同）。
# 密钥内容始终留在服务器：ENV_FILE/APP_ENV_FILE 只是路径，不经过本机或 SSH 通道。
remote_assign=""
for kv in "${stack_env[@]}"; do
  remote_assign+="${kv%%=*}='${kv#*=}' "
done
ssh "$DEPLOY_HOST" "cd '$DEPLOY_DIR' && ${remote_assign}bash scripts/deploy-stack.sh"
