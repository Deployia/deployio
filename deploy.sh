#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Help Function ---
show_help() {
    echo "Usage: ./deploy.sh [options] [service...]"
    echo ""
    echo "Builds and deploys specified services to AWS ECR and EC2."
    echo ""
    echo "Services:"
    echo "  frontend        Build and push the frontend service."
    echo "  backend         Build and push the backend service."
    echo "  ai_service      Build and push the AI service."
    echo "  *               Build and push all services (use quotes: './deploy.sh \"*\"')."
    echo "  If no services are specified, all services will be built by default."
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
# If no args, or if '*' is an arg, build all.
if [ "$#" -eq 0 ] || [[ " $@ " =~ " * " ]]; then
    echo "▶️ Building all services."
    services_to_build=("frontend" "backend" "ai_service")
else
    for arg in "$@"; do
        case $arg in
        frontend | backend | ai_service)
            services_to_build+=("$arg")
            ;;
        *)
            echo "⚠️ Warning: Ignoring invalid argument '$arg'. Valid options are 'frontend', 'backend', 'ai_service', '*'"
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
echo "🔎 Retrieving AWS configuration..."
# Automatically get AWS Account ID from the configured AWS CLI
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
# Use environment variable for region or default to ap-south-1
AWS_REGION="${AWS_REGION:-ap-south-1}"

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "❌ Error: Could not determine AWS Account ID. Please ensure AWS CLI is configured correctly."
    exit 1
fi

echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"
echo "✅ AWS Region: $AWS_REGION"

# ECR repository names
FRONTEND_REPO="deployio-frontend"
BACKEND_REPO="deployio-backend"
AI_SERVICE_REPO="deployio-ai-service"

# --- ECR Authentication ---
echo "🔐 Authenticating with Amazon ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
echo "✅ ECR authentication successful"

# --- Build and Push Docker Images ---
for service in "${services_to_build[@]}"; do
    echo "--- Building and pushing $service ---"
    case $service in
    frontend)
        echo "📦 Building frontend service..."
        docker build --compress -t "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest" ./client
        echo "⬆️ Pushing frontend image..."
        docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest"
        ;;
    backend)
        echo "📦 Building backend service..."
        docker build --compress -t "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest" .
        echo "⬆️ Pushing backend image..."
        docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest"
        ;;
    ai_service)
        echo "📦 Building AI service..."
        docker build --compress -t "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$AI_SERVICE_REPO:latest" ./ai_service
        echo "⬆️ Pushing AI service image..."
        docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$AI_SERVICE_REPO:latest"
        ;;
    esac
    echo "✅ Finished building and pushing $service"
done

echo "✅ All specified images pushed successfully!"

# --- Deploy on EC2 via SSH ---
echo "🚀 Deploying to EC2..."

# Execute the deployment commands on the remote server via SSH.
# This is a single command spread across multiple lines for readability.
ssh deployio "set -e; \
  cd ~/deployio; \
  echo '🔄 Pulling latest changes from git...'; \
  git pull origin main; \
  echo '🛑 Stopping current services...'; \
  docker-compose down --remove-orphans; \
  echo '🔐 Authenticating with ECR on EC2...'; \
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com; \
  echo '📥 Pulling latest Docker images...'; \
  docker-compose pull; \
  echo '🚀 Restarting application...'; \
  docker-compose up -d; \
  echo '✅ Deployment successful!'"
