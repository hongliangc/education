#!/usr/bin/env bash
# Pull a published Docker Hub image on Lighthouse and restart the production stack.
set -euo pipefail
cd "$(dirname "$0")/.."

DOCKER_IMAGE="${DOCKER_IMAGE:-hlc2012/mlk}"
IMAGE_TAG="${IMAGE_TAG:-${1:-latest}}"
DEPLOY_HOST="${DEPLOY_HOST:-ubuntu@119.91.153.49}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/kidora}"
HEALTH_URL="${HEALTH_URL:-http://kidora.cn/api/health}"
DEPLOY_MODE="${DEPLOY_MODE:-transfer}"
read -r -a DOCKER_CMD <<< "${DOCKER_CMD:-docker}"

# Preflight: in transfer mode the image must already exist locally — fail here with a
# clear hint instead of a cryptic `docker image save` error after we touched the server.
if [ "$DEPLOY_MODE" = "transfer" ] &&
   ! "${DOCKER_CMD[@]}" image inspect "${DOCKER_IMAGE}:${IMAGE_TAG}" >/dev/null 2>&1; then
  echo "本地不存在镜像 ${DOCKER_IMAGE}:${IMAGE_TAG}。" >&2
  echo "先构建：IMAGE_TAG=${IMAGE_TAG} bash scripts/publish-image.sh（或 docker build）。" >&2
  exit 1
fi

ssh "$DEPLOY_HOST" "mkdir -p '$DEPLOY_DIR/deploy'"
scp deploy/docker-compose.production.yml deploy/nginx.production.conf \
  "${DEPLOY_HOST}:${DEPLOY_DIR}/deploy/"

if [ "$DEPLOY_MODE" = "transfer" ]; then
  echo "Transferring ${DOCKER_IMAGE}:${IMAGE_TAG} to ${DEPLOY_HOST}"
  "${DOCKER_CMD[@]}" image save "${DOCKER_IMAGE}:${IMAGE_TAG}" |
    gzip |
    ssh "$DEPLOY_HOST" "gunzip | sudo docker load"
elif [ "$DEPLOY_MODE" != "pull" ]; then
  echo "Unsupported DEPLOY_MODE: $DEPLOY_MODE (expected pull or transfer)" >&2
  exit 1
fi

ssh "$DEPLOY_HOST" bash -s -- "$DEPLOY_DIR" "$DOCKER_IMAGE" "$IMAGE_TAG" <<'REMOTE'
set -euo pipefail
deploy_dir="$1"
docker_image="$2"
image_tag="$3"
cd "$deploy_dir"

# Both secret files must be provisioned (see deploy/README.md「一、首次安装 §3」),
# otherwise `docker compose` fails with an opaque env-file error.
for f in .env .env.production; do
  if [ ! -f "$f" ]; then
    echo "缺少 $deploy_dir/$f —— 请先按 deploy/README.md「一、首次安装 §3」创建密钥文件。" >&2
    exit 1
  fi
done

compose=(
  sudo env
  "DOCKER_IMAGE=$docker_image"
  "IMAGE_TAG=$image_tag"
  docker compose
  -p kidora
  --project-directory "$deploy_dir"
  --env-file .env
  -f deploy/docker-compose.production.yml
)

if ! sudo docker image inspect "${docker_image}:${image_tag}" >/dev/null 2>&1; then
  "${compose[@]}" pull web
fi
"${compose[@]}" up -d db web nginx

for _ in $(seq 1 30); do
  status="$(sudo docker inspect -f '{{.State.Health.Status}}' kidora-web-1 2>/dev/null || echo unknown)"
  echo "web health=$status"
  if [ "$status" = "healthy" ]; then
    "${compose[@]}" ps
    exit 0
  fi
  sleep 3
done

"${compose[@]}" logs --tail=80 web
exit 1
REMOTE

for _ in $(seq 1 20); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "Deployment healthy: ${DOCKER_IMAGE}:${IMAGE_TAG}"
    exit 0
  fi
  sleep 3
done

echo "Deployment finished, but health check failed: $HEALTH_URL" >&2
exit 1
