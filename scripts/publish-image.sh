#!/usr/bin/env bash
# Build the current workspace as a linux/amd64 image and push it to Docker Hub.
set -euo pipefail
cd "$(dirname "$0")/.."

DOCKER_IMAGE="${DOCKER_IMAGE:-hlc2012/mlk}"
IMAGE_TAG="${IMAGE_TAG:-$(date -u +%Y%m%d-%H%M%S)}"
read -r -a DOCKER_CMD <<< "${DOCKER_CMD:-docker}"

if ! "${DOCKER_CMD[@]}" info >/dev/null 2>&1; then
  echo "Docker daemon is unavailable. Fix Docker permissions or set DOCKER_CMD." >&2
  exit 1
fi

echo "Building and pushing ${DOCKER_IMAGE}:${IMAGE_TAG}"
"${DOCKER_CMD[@]}" buildx build \
  --platform linux/amd64 \
  --tag "${DOCKER_IMAGE}:${IMAGE_TAG}" \
  --tag "${DOCKER_IMAGE}:latest" \
  --push \
  .

printf '%s\n' "$IMAGE_TAG"
