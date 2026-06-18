#!/usr/bin/env bash
# Start the Kidora production compose stack from parameters.
#
# This script does not know whether it is running for local or prod. deploy.sh renders
# the target-specific values (same keys, different values) and runs this file:
#   - local: deploy.sh runs it directly on this machine with local paths, COMPOSE_SUDO=0.
#   - prod:  deploy.sh uploads it and runs it on the server with server paths, COMPOSE_SUDO=1.
set -euo pipefail

DOCKER_IMAGE="${DOCKER_IMAGE:-hlc2012/mlk}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PROJECT_NAME="${PROJECT_NAME:-kidora}"
DEPLOY_DIR="${DEPLOY_DIR:-$(pwd)}"
# 密钥注入：两条独立通道，密钥都来自调用方传入的本地/服务器文件，绝不进镜像或 Git。
#   ENV_FILE      → 下面 compose 的 `--env-file`，只做 ${...} 插值：POSTGRES_PASSWORD 拼
#                   DATABASE_URL、AUTH_SECRET/PUBLIC_URL 经 compose environment: 透传给 web。
#   APP_ENV_FILE  → 作为 compose 变量传入，web 服务用它做 env_file，把 DEEPSEEK_API_KEY /
#                   TENCENT_* / OPENLIST_* 等运行时密钥直接注入 web 容器进程环境。
# 完整链路见 deploy/README.md「九、密钥流向」。
ENV_FILE="${ENV_FILE:-$DEPLOY_DIR/.env}"
APP_ENV_FILE="${APP_ENV_FILE:-$DEPLOY_DIR/.env.production}"
PUBLIC_URL="${PUBLIC_URL:-}"
HEALTH_URL="${HEALTH_URL:-${PUBLIC_URL:-http://kidora.cn}/api/health}"
COMPOSE_SUDO="${COMPOSE_SUDO:-0}"
PULL_IF_MISSING="${PULL_IF_MISSING:-0}"
read -r -a DOCKER_CMD <<< "${DOCKER_CMD:-docker}"

if [ ! -f "$ENV_FILE" ]; then
  echo "环境文件不存在：$ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$APP_ENV_FILE" ]; then
  echo "应用环境文件不存在：$APP_ENV_FILE" >&2
  exit 1
fi

compose_env=(
  "DOCKER_IMAGE=$DOCKER_IMAGE"
  "IMAGE_TAG=$IMAGE_TAG"
  "APP_ENV_FILE=$APP_ENV_FILE"
  "PUBLIC_URL=$PUBLIC_URL"
)

if [ "$COMPOSE_SUDO" = "1" ]; then
  compose=(sudo env "${compose_env[@]}" docker compose)
  inspect=(sudo docker image inspect)
else
  compose=(env "${compose_env[@]}" "${DOCKER_CMD[@]}" compose)
  inspect=("${DOCKER_CMD[@]}" image inspect)
fi

compose+=(
  --project-name "$PROJECT_NAME"
  --project-directory "$DEPLOY_DIR"
  --env-file "$ENV_FILE"
  -f deploy/docker-compose.production.yml
)

if [ "$PULL_IF_MISSING" = "1" ] && ! "${inspect[@]}" "${DOCKER_IMAGE}:${IMAGE_TAG}" >/dev/null 2>&1; then
  "${compose[@]}" pull web
fi

"${compose[@]}" up -d db openlist web nginx

for _ in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "Deployment healthy: ${PROJECT_NAME} ${DOCKER_IMAGE}:${IMAGE_TAG}"
    "${compose[@]}" ps
    exit 0
  fi
  sleep 3
done

"${compose[@]}" logs --tail=80 web
echo "Deployment finished, but health check failed: $HEALTH_URL" >&2
exit 1
