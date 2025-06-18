#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

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
echo "🏗️ Building and pushing Docker images..."

# Build and push backend
echo "📦 Building backend service..."
docker build --compress -t "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest" .
echo "⬆️ Pushing backend image..."
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:latest"

# Build and push frontend
echo "📦 Building frontend service..."
docker build --compress -t "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest" ./client
echo "⬆️ Pushing frontend image..."
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:latest"

# Build and push AI service
echo "📦 Building AI service..."
docker build --compress -t "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$AI_SERVICE_REPO:latest" ./ai_service
echo "⬆️ Pushing AI service image..."
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$AI_SERVICE_REPO:latest"

echo "✅ All images pushed successfully!"

# --- Deploy on EC2 via SSH ---
echo "🚀 Deploying to EC2..."

# Note: The following block runs on the remote EC2 instance.
# It requires the EC2 instance to have AWS CLI and credentials configured
# (e.g., via an IAM role) to pull images from ECR.
ssh deployio <<ENDSSH
  set -e
  
  cd ~/deployio
  
  echo "🔐 Authenticating with ECR on EC2..."
  # Note: These variables are expanded locally and passed to the remote script.
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
  
  echo "📥 Pulling latest Docker images..."
  docker-compose pull
  
  echo "🚀 Restarting application..."
  docker-compose up -d --remove-orphans
  
  echo "✅ Deployment successful!"
ENDSSH
