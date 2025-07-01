# ECR and Pipeline Configuration
# AWS ECR setup for DeployIO container deployment

# ECR Repository Configuration
resource "aws_ecr_repository" "deployio_ai_service" {
  name                 = "deployio/ai-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "Keep last 10 production images"
          selection = {
            tagStatus = "tagged"
            tagPrefixList = ["prod"]
            countType     = "imageCountMoreThan"
            countNumber   = 10
          }
          action = {
            type = "expire"
          }
        },
        {
          rulePriority = 2
          description  = "Keep last 5 staging images"
          selection = {
            tagStatus = "tagged"
            tagPrefixList = ["staging"]
            countType     = "imageCountMoreThan"
            countNumber   = 5
          }
          action = {
            type = "expire"
          }
        },
        {
          rulePriority = 3
          description  = "Expire untagged images older than 1 day"
          selection = {
            tagStatus   = "untagged"
            countType   = "sinceImagePushed"
            countUnit   = "days"
            countNumber = 1
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }

  tags = {
    Name        = "DeployIO AI Service"
    Environment = "production"
    Service     = "ai-service"
  }
}

resource "aws_ecr_repository" "deployio_server" {
  name                 = "deployio/server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "Keep last 10 production images"
          selection = {
            tagStatus = "tagged"
            tagPrefixList = ["prod"]
            countType     = "imageCountMoreThan"
            countNumber   = 10
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }

  tags = {
    Name        = "DeployIO Server"
    Environment = "production"
    Service     = "server"
  }
}

resource "aws_ecr_repository" "deployio_client" {
  name                 = "deployio/client"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "Keep last 10 production images"
          selection = {
            tagStatus = "tagged"
            tagPrefixList = ["prod"]
            countType     = "imageCountMoreThan"
            countNumber   = 10
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }

  tags = {
    Name        = "DeployIO Client"
    Environment = "production"
    Service     = "client"
  }
}

# IAM Role for ECR Access
resource "aws_iam_role" "ecr_role" {
  name = "deployio-ecr-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "ecs-tasks.amazonaws.com",
            "codebuild.amazonaws.com"
          ]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecr_policy" {
  name = "deployio-ecr-policy"
  role = aws_iam_role.ecr_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = [
          aws_ecr_repository.deployio_ai_service.arn,
          aws_ecr_repository.deployio_server.arn,
          aws_ecr_repository.deployio_client.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      }
    ]
  })
}

# Outputs
output "ai_service_repository_url" {
  description = "URL of the AI Service ECR repository"
  value       = aws_ecr_repository.deployio_ai_service.repository_url
}

output "server_repository_url" {
  description = "URL of the Server ECR repository"
  value       = aws_ecr_repository.deployio_server.repository_url
}

output "client_repository_url" {
  description = "URL of the Client ECR repository"
  value       = aws_ecr_repository.deployio_client.repository_url
}

output "ecr_role_arn" {
  description = "ARN of the ECR IAM role"
  value       = aws_iam_role.ecr_role.arn
}
