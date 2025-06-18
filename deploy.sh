#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Help Function ---
show_help() {
    echo "Usage: ./deploy.sh [options] [service... | all]"
    echo ""
    echo "Builds and deploys specified services to AWS ECR and EC2."
    echo ""
    echo "Services:"
    echo "  frontend        Build and push the frontend service."
    echo "  backend         Build and push the backend service."
    echo "  ai_service      Build and push the AI service."
    echo "  agent           Build and push the DeployIO agent."
    echo "  all             Build and push all services."
    echo "  If no services are specified, 'all' is assumed."
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help message and exit."
}

# --- Argument Parsing ---
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

services_to_build=()
# If no args, or if 'all' is an arg, build everything.
if [ "$#" -eq 0 ] || [[ " $@ " =~ " all " ]]; then
    echo "▶️ Building all services."
    services_to_build=("frontend" "backend" "ai_service" "agent")
else
    for arg in "$@"; do
        case $arg in
        frontend | backend | ai_service | agent)
            services_to_build+=("$arg")
            ;;
        *)
            echo "⚠️ Warning: Ignoring invalid argument '$arg'. Valid options are 'frontend', 'backend', 'ai_service', 'agent', 'all'"
            ;;
        esac
    done
fi

if [ ${#services_to_build[@]} -eq 0 ]; then
    echo "❌ Error: No valid services specified to build. Use -h for help."
    exit 1
fi

echo "🔨 Services to build: ${services_to_build[*]}"

# --- Configuration ---
declare -A service_config
service_config["frontend"]="repo=deployio-frontend context=./client profile=default ssh_host=deployio"
service_config["backend"]="repo=deployio-backend context=. profile=default ssh_host=deployio"
service_config["ai_service"]="repo=deployio-ai-service context=./ai_service profile=default ssh_host=deployio"
service_config["agent"]="repo=deployio-agent context=./deployio-agent profile=deployio-agent ssh_host=deployio-agent"

AWS_REGION="${AWS_REGION:-ap-south-1}"

# --- Build and Push Docker Images ---
for service in "${services_to_build[@]}"; do
    echo "--- Building and pushing $service ---"

    # Parse config
    eval $(echo "${service_config[$service]}")

    # Get AWS Account ID
    if [ "$profile" == "default" ]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    else
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile "$profile" --query Account --output text)
    fi

    if [ -z "$AWS_ACCOUNT_ID" ]; then
        echo "❌ Error: Could not determine AWS Account ID for profile '$profile'. Please ensure AWS CLI is configured correctly."
        exit 1
    fi

    echo "🔐 Authenticating with Amazon ECR for profile '$profile'..."
    if [ "$profile" == "default" ]; then
        aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    else
        aws ecr get-login-password --region "$AWS_REGION" --profile "$profile" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    fi
    echo "✅ ECR authentication successful"

    echo "📦 Building $service service..."
    docker build --compress -t "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo:latest" "$context"

    echo "⬆️ Pushing $service image..."
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo:latest"

    echo "✅ Finished building and pushing $service"
done

echo "✅ All specified images pushed successfully!"

# --- Deploy on EC2 via SSH ---

# Deploy platform services
if [[ " ${services_to_build[*]} " =~ " frontend " || " ${services_to_build[*]} " =~ " backend " || " ${services_to_build[*]} " =~ " ai_service " ]]; then
    echo "🚀 Deploying platform services to EC2..."
    ssh deployio "set -e; \
      cd ~/deployio; \
      echo '🔄 Pulling latest changes from git...'; \
      git pull origin main; \
      echo '🛑 Stopping current services...'; \
      docker-compose down --remove-orphans; \
      echo '🔐 Authenticating with ECR on EC2...'; \
      aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com; \
      echo '📥 Pulling latest Docker images...'; \
      docker-compose pull; \
      echo '🚀 Restarting application...'; \
      docker-compose up -d; \
      echo '✅ Platform deployment successful!'"
fi

# Deploy agent service
if [[ " ${services_to_build[*]} " =~ " agent " ]]; then
    echo "🚀 Deploying agent service to EC2..."
    ssh deployio-agent "set -e; \
        cd ~/deployio/deployio-agent; \
        echo '🔄 Pulling latest changes from git...'; \
        git pull origin main; \
        echo '🔐 Authenticating with ECR on EC2...'; \
        aws ecr get-login-password --region $AWS_REGION --profile deployio-agent | docker login --username AWS --password-stdin $(aws sts get-caller-identity --profile deployio-agent --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com; \
        echo '🛑 Stopping and removing old containers...'; \
        docker-compose down --remove-orphans; \
        echo '📥 Pulling latest Docker image...'; \
        docker-compose pull; \
        echo '🚀 Starting new containers...'; \
        docker-compose up -d; \
        echo '🧹 Cleaning up unused Docker images...'; \
        docker image prune -f; \
        echo '✅ Agent deployment successful!'"
fi
