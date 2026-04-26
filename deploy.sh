#!/usr/bin/env bash

set -euo pipefail

show_help() {
    cat <<'EOF'
Usage: ./deploy.sh [--pull] [--no-build] [--rebuild] [--compose-file FILE]

Deployio VPS deployment script (local Docker builds, no ECR/GitHub Actions).

Options:
    --pull                 Run git pull origin main before deployment.
    --no-build             Skip docker compose build.
    --rebuild              Force build with --no-cache.
    --compose-file FILE    Use a custom compose file (default: docker-compose.yml).
    -h, --help             Show this help message.

Example:
    ./deploy.sh --pull --rebuild
EOF
}

COMPOSE_FILE="docker-compose.yml"
DO_PULL="false"
DO_BUILD="true"
NO_CACHE="false"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --pull)
            DO_PULL="true"
            ;;
        --no-build)
            DO_BUILD="false"
            ;;
        --rebuild)
            NO_CACHE="true"
            ;;
        --compose-file)
            COMPOSE_FILE="${2:-}"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown argument: $1"
            show_help
            exit 1
            ;;
    esac
    shift
done

if ! command -v docker >/dev/null 2>&1; then
    echo "Error: docker is not installed."
    exit 1
fi

if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD=(docker-compose)
else
    echo "Error: docker compose is not available."
    exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "Error: compose file not found: $COMPOSE_FILE"
    exit 1
fi

ensure_env_file() {
    local target_file="$1"
    local example_file="$2"

    if [[ -f "$target_file" ]]; then
        return
    fi

    if [[ -f "$example_file" ]]; then
        cp "$example_file" "$target_file"
        echo "Created $target_file from $example_file"
        echo "Warning: update placeholders in $target_file before public production traffic."
        return
    fi

    echo "Error: missing required env file: $target_file"
    exit 1
}

ensure_env_file "server/.env.production" "server/.env.example"
ensure_env_file "ai-service/.env.production" "ai-service/.env.example"

ensure_log_permissions() {
    local uid="${LOG_UID:-1001}"
    local gid="${LOG_GID:-1001}"

    echo "Preparing log directories with uid:gid ${uid}:${gid}..."

    # Use a short-lived container so ownership is fixed even when previous runs created root-owned directories.
    docker run --rm \
        -v "$PWD/server/logs:/logs/server" \
        -v "$PWD/ai-service/logs:/logs/ai-service" \
        -v "$PWD/agent/logs:/logs/agent" \
        alpine:3.20 sh -c "mkdir -p /logs/server /logs/ai-service /logs/agent && chown -R ${uid}:${gid} /logs && chmod -R ug+rwX /logs"
}

ensure_log_permissions

if [[ "$DO_PULL" == "true" ]]; then
    echo "Pulling latest code..."
    git pull origin main
fi

echo "Stopping existing containers..."
"${DOCKER_COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" down --remove-orphans

if [[ "$DO_BUILD" == "true" ]]; then
    echo "Building images locally..."
    if [[ "$NO_CACHE" == "true" ]]; then
        "${DOCKER_COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" build --no-cache
    else
        "${DOCKER_COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" build
    fi
fi

echo "Starting containers..."
"${DOCKER_COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Container status:"
"${DOCKER_COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" ps

echo "Health checks:"
curl -fsS -H "Host: api.deployio.tech" http://127.0.0.1:4567/health && echo " - backend ok"
curl -fsS -H "Host: ai.deployio.tech" http://127.0.0.1:4567/service/v1/health && echo " - ai-service ok"
curl -fsS -H "Host: deployio.tech" http://127.0.0.1:4567 >/dev/null && echo " - frontend ok"
curl -fsS -H "Host: agent.deployio.tech" http://127.0.0.1:4567/health && echo " - agent ok"

echo "Deployment completed."
