#!/bin/bash

# Build and Push DeployIO Agent to ECR
# Usage: ./build-push-ecr.sh [tag]

set -e

# Default values
DEFAULT_TAG="latest"
TAG=${1:-$DEFAULT_TAG}

echo "🏗️  Building and Pushing DeployIO Agent to ECR"
echo "============================================="

# Check if required environment variables are set
if [ -z "$AWS_REGION" ] || [ -z "$ECR_REGISTRY_URL" ]; then
    echo "❌ Missing required environment variables:"
    echo "   AWS_REGION: $AWS_REGION"
    echo "   ECR_REGISTRY_URL: $ECR_REGISTRY_URL"
    echo ""
    echo "Please set these in your .env file or export them:"
    echo "export AWS_REGION=us-east-1"
    echo "export ECR_REGISTRY_URL=your-account.dkr.ecr.us-east-1.amazonaws.com"
    exit 1
fi

IMAGE_NAME="deployio-agent"
FULL_IMAGE_NAME="$ECR_REGISTRY_URL/$IMAGE_NAME:$TAG"

echo "📋 Build Configuration:"
echo "   Registry: $ECR_REGISTRY_URL"
echo "   Image: $IMAGE_NAME"
echo "   Tag: $TAG"
echo "   Full Name: $FULL_IMAGE_NAME"
echo ""

# Authenticate Docker to ECR
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY_URL

# Build the image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME:$TAG .
docker tag $IMAGE_NAME:$TAG $FULL_IMAGE_NAME

# Push to ECR
echo "⬆️  Pushing to ECR..."
docker push $FULL_IMAGE_NAME

echo ""
echo "✅ Build and Push Complete!"
echo ""
echo "🚀 To deploy from ECR, run:"
echo "export ECR_IMAGE=$FULL_IMAGE_NAME"
echo "./deploy.sh"
echo ""
echo "Or on EC2:"
echo "ECR_IMAGE=$FULL_IMAGE_NAME docker-compose up -d"
