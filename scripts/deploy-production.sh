#!/usr/bin/env bash

set -Eeuo pipefail

required_variables=(RELEASE_SHA DEPLOY_PATH API_IMAGE WEB_IMAGE)
for variable_name in "${required_variables[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Required variable is missing: $variable_name" >&2
    exit 1
  fi
done

if [[ ! "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "RELEASE_SHA must be a full lowercase Git commit SHA." >&2
  exit 1
fi

if [[ "$DEPLOY_PATH" != /* || ! -d "$DEPLOY_PATH" ]]; then
  echo "DEPLOY_PATH must be an existing absolute directory." >&2
  exit 1
fi

if [[ "$API_IMAGE" != ghcr.io/* || "$WEB_IMAGE" != ghcr.io/* ]]; then
  echo "API_IMAGE and WEB_IMAGE must be GHCR image names." >&2
  exit 1
fi

cd "$DEPLOY_PATH"

deploy_state_dir="$DEPLOY_PATH/.deploy"
compose_file="$DEPLOY_PATH/docker-compose.prod.yml"
next_compose_file="$deploy_state_dir/docker-compose.prod.next.yml"

mkdir -p "$deploy_state_dir"

export FORMAUTO_RELEASE_TAG="$RELEASE_SHA"
export FORMAUTO_API_IMAGE="$API_IMAGE"
export FORMAUTO_WEB_IMAGE="$WEB_IMAGE"

show_failure_context() {
  local exit_code=$?
  echo "Deployment failed with exit code $exit_code." >&2
  docker compose -f "$compose_file" ps >&2 || true
  docker compose -f "$compose_file" logs --tail=120 --no-color formauto-api formauto-web >&2 || true
  exit "$exit_code"
}

trap show_failure_context ERR

echo "Preparing FormAuto Hub release $RELEASE_SHA"

git fetch --no-tags origin main
git cat-file -e "$RELEASE_SHA^{commit}"
git show "$RELEASE_SHA:docker-compose.prod.yml" > "$next_compose_file"

docker compose --project-directory "$DEPLOY_PATH" -f "$next_compose_file" config --quiet
if [[ -f "$compose_file" ]]; then
  cp "$compose_file" "$deploy_state_dir/docker-compose.prod.previous.yml"
fi
mv "$next_compose_file" "$compose_file"

docker compose -f "$compose_file" pull
docker compose -f "$compose_file" up -d --remove-orphans --wait --wait-timeout 180

curl --fail --silent --show-error --retry 10 --retry-delay 3 --retry-connrefused \
  http://127.0.0.1:5100/health > /dev/null
curl --fail --silent --show-error --retry 10 --retry-delay 3 --retry-connrefused \
  http://127.0.0.1:3000/ > /dev/null

printf '%s\n' "$RELEASE_SHA" > "$deploy_state_dir/current-release"

trap - ERR
docker compose -f "$compose_file" ps
echo "Deployment completed for release $RELEASE_SHA"
