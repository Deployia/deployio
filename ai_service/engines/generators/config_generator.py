"""
Configuration Generator - Generate deployment configurations based on analysis results
Supports Docker, Kubernetes, CI/CD, and various deployment platforms
"""

import logging
import json
import yaml
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from engines.core.models import TechnologyStack, AnalysisResult

logger = logging.getLogger(__name__)


@dataclass
class GeneratedConfig:
    """Generated configuration files and metadata"""
    config_type: str
    filename: str
    content: str
    description: str
    priority: str  # high, medium, low


@dataclass
class ConfigurationPackage:
    """Complete configuration package for deployment"""
    technology_stack: TechnologyStack
    configurations: List[GeneratedConfig]
    deployment_instructions: List[str]
    environment_variables: Dict[str, str]
    recommended_resources: Dict[str, Any]


class ConfigurationGenerator:
    """
    Multi-platform configuration generator
    
    Generates:
    - Dockerfiles
    - Docker Compose files
    - Kubernetes manifests
    - CI/CD pipeline configurations
    - Environment-specific configs
    """
    
    def __init__(self):
        self.generators = {
            "docker": self._generate_docker_config,
            "docker-compose": self._generate_docker_compose_config,
            "kubernetes": self._generate_kubernetes_config,
            "github-actions": self._generate_github_actions_config,
            "gitlab-ci": self._generate_gitlab_ci_config,
            "nginx": self._generate_nginx_config,
            "environment": self._generate_environment_config
        }
        
        logger.info("ConfigurationGenerator initialized successfully")
    
    async def generate_deployment_config(
        self,
        analysis_result: AnalysisResult,
        config_types: List[str] = None,
        deployment_target: str = "production"
    ) -> ConfigurationPackage:
        """
        Generate comprehensive deployment configuration
        
        Args:
            analysis_result: Analysis results from detection engine
            config_types: Types of configurations to generate
            deployment_target: Target environment (development, staging, production)
        
        Returns:
            ConfigurationPackage: Complete configuration package
        """
        if config_types is None:
            config_types = ["docker", "docker-compose", "github-actions", "environment"]
        
        logger.info(f"Generating configurations for {analysis_result.repository_url}")
        
        configurations = []
        
        for config_type in config_types:
            if config_type in self.generators:
                try:
                    config = await self.generators[config_type](
                        analysis_result.technology_stack,
                        deployment_target
                    )
                    if config:
                        configurations.append(config)
                except Exception as e:
                    logger.error(f"Failed to generate {config_type} config: {e}")
                    continue
        
        # Generate deployment instructions
        instructions = self._generate_deployment_instructions(
            analysis_result.technology_stack,
            config_types,
            deployment_target
        )
        
        # Generate environment variables
        env_vars = self._generate_environment_variables(
            analysis_result.technology_stack,
            deployment_target
        )
        
        # Generate resource recommendations
        resources = self._generate_resource_recommendations(
            analysis_result.technology_stack
        )
        
        return ConfigurationPackage(
            technology_stack=analysis_result.technology_stack,
            configurations=configurations,
            deployment_instructions=instructions,
            environment_variables=env_vars,
            recommended_resources=resources
        )
    
    async def _generate_docker_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate Dockerfile based on technology stack"""
        
        if not stack.language:
            return None
            
        language = stack.language.lower()
        
        if language == "javascript" or language == "typescript":
            content = self._generate_nodejs_dockerfile(stack, deployment_target)
        elif language == "python":
            content = self._generate_python_dockerfile(stack, deployment_target)
        elif language == "java":
            content = self._generate_java_dockerfile(stack, deployment_target)
        elif language == "go":
            content = self._generate_go_dockerfile(stack, deployment_target)
        else:
            content = self._generate_generic_dockerfile(stack, deployment_target)
        
        return GeneratedConfig(
            config_type="docker",
            filename="Dockerfile",
            content=content,
            description="Multi-stage Docker build configuration",
            priority="high"
        )
    
    def _generate_nodejs_dockerfile(self, stack: TechnologyStack, target: str) -> str:
        """Generate Node.js Dockerfile"""
        node_version = stack.runtime_version or "18"
        
        if target == "production":
            return f"""# Multi-stage Node.js Dockerfile
FROM node:{node_version}-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application (if needed)
RUN npm run build 2>/dev/null || true

# Production image
FROM node:{node_version}-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
"""
        else:
            return f"""# Development Node.js Dockerfile
FROM node:{node_version}-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
"""
    
    def _generate_python_dockerfile(self, stack: TechnologyStack, target: str) -> str:
        """Generate Python Dockerfile"""
        python_version = stack.runtime_version or "3.11"
        
        if target == "production":
            return f"""# Multi-stage Python Dockerfile
FROM python:{python_version}-slim AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PIP_NO_CACHE_DIR=1 \\
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements*.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Production image
FROM python:{python_version}-slim AS production

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PATH="/home/app/.local/bin:$PATH"

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /usr/local/lib/python{python_version.split('.')[0]}.{python_version.split('.')[1]}/site-packages /usr/local/lib/python{python_version.split('.')[0]}.{python_version.split('.')[1]}/site-packages

# Copy application
COPY --chown=app:app . .

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=3)" || exit 1

# Start the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
"""
        else:
            return f"""# Development Python Dockerfile
FROM python:{python_version}-slim

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements*.txt ./
RUN pip install -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start development server
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
"""
    
    def _generate_java_dockerfile(self, stack: TechnologyStack, target: str) -> str:
        """Generate Java Dockerfile"""
        java_version = stack.runtime_version or "17"
        
        if target == "production":
            return f"""# Multi-stage Java Dockerfile
FROM openjdk:{java_version}-jdk-slim AS builder

WORKDIR /app

# Copy build files
COPY pom.xml ./
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Production image
FROM openjdk:{java_version}-jre-slim AS production

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# Copy built JAR
COPY --from=builder --chown=app:app /app/target/*.jar app.jar

# Switch to non-root user
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Start the application
CMD ["java", "-jar", "app.jar"]
"""
        else:
            return f"""# Development Java Dockerfile
FROM openjdk:{java_version}-jdk-slim

WORKDIR /app

# Copy source code
COPY . .

# Make mvnw executable
RUN chmod +x ./mvnw

# Expose port
EXPOSE 8080

# Start development server
CMD ["./mvnw", "spring-boot:run"]
"""
    
    def _generate_go_dockerfile(self, stack: TechnologyStack, target: str) -> str:
        """Generate Go Dockerfile"""
        go_version = stack.runtime_version or "1.21"
        
        return f"""# Multi-stage Go Dockerfile
FROM golang:{go_version}-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Production image
FROM alpine:latest AS production

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy built binary
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Start the application
CMD ["./main"]
"""
    
    def _generate_generic_dockerfile(self, stack: TechnologyStack, target: str) -> str:
        """Generate generic Dockerfile"""
        return f"""# Generic Dockerfile for {stack.language or 'unknown'} application
FROM alpine:latest

# Install basic dependencies
RUN apk --no-cache add curl

WORKDIR /app

# Copy application files
COPY . .

# Expose port
EXPOSE 8080

# Start the application
CMD ["echo", "Please configure the startup command for your application"]
"""
    
    async def _generate_docker_compose_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate Docker Compose configuration"""
        
        services = {
            "app": {
                "build": ".",
                "ports": ["3000:3000" if stack.language == "JavaScript" else "8000:8000"],
                "environment": [
                    "NODE_ENV=production" if stack.language == "JavaScript" else "ENVIRONMENT=production"
                ],
                "restart": "unless-stopped",
                "healthcheck": {
                    "test": ["CMD", "curl", "-f", "http://localhost:3000/health"],
                    "interval": "30s",
                    "timeout": "10s",
                    "retries": 3
                }
            }
        }
        
        # Add database service if detected
        if stack.database:
            db_name = stack.database.lower()
            if "postgres" in db_name:
                services["db"] = {
                    "image": "postgres:15-alpine",
                    "environment": [
                        "POSTGRES_DB=myapp",
                        "POSTGRES_USER=myapp",
                        "POSTGRES_PASSWORD=myapp"
                    ],
                    "volumes": ["postgres_data:/var/lib/postgresql/data"],
                    "restart": "unless-stopped"
                }
                services["app"]["depends_on"] = ["db"]
                services["app"]["environment"].append("DATABASE_URL=postgresql://myapp:myapp@db:5432/myapp")
            
            elif "mysql" in db_name:
                services["db"] = {
                    "image": "mysql:8.0",
                    "environment": [
                        "MYSQL_DATABASE=myapp",
                        "MYSQL_USER=myapp",
                        "MYSQL_PASSWORD=myapp",
                        "MYSQL_ROOT_PASSWORD=rootpass"
                    ],
                    "volumes": ["mysql_data:/var/lib/mysql"],
                    "restart": "unless-stopped"
                }
                services["app"]["depends_on"] = ["db"]
                services["app"]["environment"].append("DATABASE_URL=mysql://myapp:myapp@db:3306/myapp")
        
        # Add Redis if caching is likely needed
        if stack.framework in ["Django", "Flask", "Express.js", "Next.js"]:
            services["redis"] = {
                "image": "redis:7-alpine",
                "restart": "unless-stopped",
                "volumes": ["redis_data:/data"]
            }
            services["app"]["depends_on"] = services["app"].get("depends_on", []) + ["redis"]
            services["app"]["environment"].append("REDIS_URL=redis://redis:6379")
        
        # Add volumes
        volumes = {}
        if "db" in services:
            if "postgres" in services["db"]["image"]:
                volumes["postgres_data"] = {}
            elif "mysql" in services["db"]["image"]:
                volumes["mysql_data"] = {}
        if "redis" in services:
            volumes["redis_data"] = {}
        
        compose_config = {
            "version": "3.8",
            "services": services
        }
        
        if volumes:
            compose_config["volumes"] = volumes
        
        content = yaml.dump(compose_config, default_flow_style=False, indent=2)
        
        return GeneratedConfig(
            config_type="docker-compose",
            filename="docker-compose.yml",
            content=content,
            description="Multi-service Docker Compose configuration",
            priority="high"
        )
    
    async def _generate_kubernetes_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate Kubernetes deployment configuration"""
        
        app_name = "myapp"
        
        # Deployment
        deployment = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {"name": app_name},
            "spec": {
                "replicas": 3 if deployment_target == "production" else 1,
                "selector": {"matchLabels": {"app": app_name}},
                "template": {
                    "metadata": {"labels": {"app": app_name}},
                    "spec": {
                        "containers": [{
                            "name": app_name,
                            "image": f"{app_name}:latest",
                            "ports": [{"containerPort": 8000}],
                            "env": [
                                {"name": "ENVIRONMENT", "value": deployment_target}
                            ],
                            "resources": {
                                "requests": {"memory": "256Mi", "cpu": "250m"},
                                "limits": {"memory": "512Mi", "cpu": "500m"}
                            },
                            "livenessProbe": {
                                "httpGet": {"path": "/health", "port": 8000},
                                "initialDelaySeconds": 30,
                                "periodSeconds": 10
                            },
                            "readinessProbe": {
                                "httpGet": {"path": "/health", "port": 8000},
                                "initialDelaySeconds": 5,
                                "periodSeconds": 5
                            }
                        }]
                    }
                }
            }
        }
        
        # Service
        service = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {"name": f"{app_name}-service"},
            "spec": {
                "selector": {"app": app_name},
                "ports": [{"port": 80, "targetPort": 8000}],
                "type": "ClusterIP"
            }
        }
        
        # Ingress
        ingress = {
            "apiVersion": "networking.k8s.io/v1",
            "kind": "Ingress",
            "metadata": {
                "name": f"{app_name}-ingress",
                "annotations": {
                    "kubernetes.io/ingress.class": "nginx",
                    "cert-manager.io/cluster-issuer": "letsencrypt-prod"
                }
            },
            "spec": {
                "tls": [{
                    "hosts": ["myapp.example.com"],
                    "secretName": f"{app_name}-tls"
                }],
                "rules": [{
                    "host": "myapp.example.com",
                    "http": {
                        "paths": [{
                            "path": "/",
                            "pathType": "Prefix",
                            "backend": {
                                "service": {
                                    "name": f"{app_name}-service",
                                    "port": {"number": 80}
                                }
                            }
                        }]
                    }
                }]
            }
        }
        
        # Combine all resources
        resources = [deployment, service, ingress]
        content = "---\n".join([yaml.dump(resource, default_flow_style=False) for resource in resources])
        
        return GeneratedConfig(
            config_type="kubernetes",
            filename="k8s-deployment.yml",
            content=content,
            description="Kubernetes deployment with service and ingress",
            priority="medium"
        )
    
    async def _generate_github_actions_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate GitHub Actions CI/CD configuration"""
        
        language = stack.language.lower() if stack.language else "generic"
        
        workflow = {
            "name": "CI/CD Pipeline",
            "on": {
                "push": {"branches": ["main", "develop"]},
                "pull_request": {"branches": ["main"]}
            },
            "jobs": {
                "test": {
                    "runs-on": "ubuntu-latest",
                    "steps": [
                        {"uses": "actions/checkout@v3"},
                        self._get_language_setup_step(language),
                        {"name": "Install dependencies", "run": self._get_install_command(language)},
                        {"name": "Run tests", "run": self._get_test_command(language)},
                        {"name": "Run linting", "run": self._get_lint_command(language)}
                    ]
                },
                "build": {
                    "needs": "test",
                    "runs-on": "ubuntu-latest",
                    "if": "github.ref == 'refs/heads/main'",
                    "steps": [
                        {"uses": "actions/checkout@v3"},
                        {"name": "Set up Docker Buildx", "uses": "docker/setup-buildx-action@v2"},
                        {"name": "Login to DockerHub", "uses": "docker/login-action@v2", "with": {
                            "username": "${{ secrets.DOCKER_USERNAME }}",
                            "password": "${{ secrets.DOCKER_PASSWORD }}"
                        }},
                        {"name": "Build and push", "uses": "docker/build-push-action@v3", "with": {
                            "context": ".",
                            "push": "true",
                            "tags": "myapp:latest"
                        }}
                    ]
                },
                "deploy": {
                    "needs": "build",
                    "runs-on": "ubuntu-latest",
                    "if": "github.ref == 'refs/heads/main'",
                    "steps": [
                        {"uses": "actions/checkout@v3"},
                        {"name": "Deploy to production", "run": "echo 'Add your deployment commands here'"}
                    ]
                }
            }
        }
        
        content = yaml.dump(workflow, default_flow_style=False, indent=2)
        
        return GeneratedConfig(
            config_type="github-actions",
            filename=".github/workflows/ci-cd.yml",
            content=content,
            description="Complete CI/CD pipeline with testing, building, and deployment",
            priority="high"
        )
    
    def _get_language_setup_step(self, language: str) -> Dict[str, Any]:
        """Get language-specific setup step for CI/CD"""
        if language == "javascript" or language == "typescript":
            return {"name": "Setup Node.js", "uses": "actions/setup-node@v3", "with": {"node-version": "18"}}
        elif language == "python":
            return {"name": "Setup Python", "uses": "actions/setup-python@v4", "with": {"python-version": "3.11"}}
        elif language == "java":
            return {"name": "Setup Java", "uses": "actions/setup-java@v3", "with": {"java-version": "17"}}
        elif language == "go":
            return {"name": "Setup Go", "uses": "actions/setup-go@v4", "with": {"go-version": "1.21"}}
        else:
            return {"name": "Setup environment", "run": "echo 'Configure your language environment'"}
    
    def _get_install_command(self, language: str) -> str:
        """Get install command for language"""
        if language == "javascript" or language == "typescript":
            return "npm ci"
        elif language == "python":
            return "pip install -r requirements.txt"
        elif language == "java":
            return "./mvnw install -DskipTests"
        elif language == "go":
            return "go mod download"
        else:
            return "echo 'Add your install command here'"
    
    def _get_test_command(self, language: str) -> str:
        """Get test command for language"""
        if language == "javascript" or language == "typescript":
            return "npm test"
        elif language == "python":
            return "python -m pytest"
        elif language == "java":
            return "./mvnw test"
        elif language == "go":
            return "go test ./..."
        else:
            return "echo 'Add your test command here'"
    
    def _get_lint_command(self, language: str) -> str:
        """Get lint command for language"""
        if language == "javascript" or language == "typescript":
            return "npm run lint"
        elif language == "python":
            return "flake8 . || true"
        elif language == "java":
            return "echo 'Add Java linting here'"
        elif language == "go":
            return "go vet ./..."
        else:
            return "echo 'Add your lint command here'"
    
    async def _generate_gitlab_ci_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate GitLab CI configuration"""
        
        language = stack.language.lower() if stack.language else "generic"
        
        gitlab_ci = {
            "stages": ["test", "build", "deploy"],
            "variables": {
                "DOCKER_IMAGE": "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
            },
            "test": {
                "stage": "test",
                "image": self._get_ci_image(language),
                "script": [
                    self._get_install_command(language),
                    self._get_test_command(language),
                    self._get_lint_command(language)
                ]
            },
            "build": {
                "stage": "build",
                "image": "docker:latest",
                "services": ["docker:dind"],
                "script": [
                    "docker build -t $DOCKER_IMAGE .",
                    "docker push $DOCKER_IMAGE"
                ],
                "only": ["main"]
            },
            "deploy": {
                "stage": "deploy",
                "image": "alpine:latest",
                "script": [
                    "echo 'Add your deployment commands here'"
                ],
                "only": ["main"]
            }
        }
        
        content = yaml.dump(gitlab_ci, default_flow_style=False, indent=2)
        
        return GeneratedConfig(
            config_type="gitlab-ci",
            filename=".gitlab-ci.yml",
            content=content,
            description="GitLab CI/CD pipeline configuration",
            priority="medium"
        )
    
    def _get_ci_image(self, language: str) -> str:
        """Get CI image for language"""
        if language == "javascript" or language == "typescript":
            return "node:18"
        elif language == "python":
            return "python:3.11"
        elif language == "java":
            return "openjdk:17"
        elif language == "go":
            return "golang:1.21"
        else:
            return "alpine:latest"
    
    async def _generate_nginx_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate Nginx configuration"""
        
        config = f"""# Nginx configuration for {stack.framework or 'application'}
upstream app {{
    server app:8000;
}}

server {{
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Static files
    location /static/ {{
        alias /app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
    
    # API routes
    location /api/ {{
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
    
    # Health check
    location /health {{
        proxy_pass http://app;
        access_log off;
    }}
    
    # Default location
    location / {{
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""
        
        return GeneratedConfig(
            config_type="nginx",
            filename="nginx.conf",
            content=config,
            description="Nginx reverse proxy configuration with security headers",
            priority="medium"
        )
    
    async def _generate_environment_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate environment configuration"""
        
        env_vars = []
        
        # Basic environment
        env_vars.append(f"ENVIRONMENT={deployment_target}")
        env_vars.append("DEBUG=false" if deployment_target == "production" else "DEBUG=true")
        
        # Language-specific variables
        if stack.language:
            lang = stack.language.lower()
            if lang == "python":
                env_vars.extend([
                    "PYTHONDONTWRITEBYTECODE=1",
                    "PYTHONUNBUFFERED=1"
                ])
            elif lang == "javascript":
                env_vars.append(f"NODE_ENV={deployment_target}")
        
        # Database configuration
        if stack.database:
            env_vars.append("DATABASE_URL=postgresql://user:password@localhost:5432/dbname")
        
        # Common application variables
        env_vars.extend([
            "PORT=8000",
            "HOST=0.0.0.0",
            "SECRET_KEY=your-secret-key-here",
            "REDIS_URL=redis://localhost:6379",
            "LOG_LEVEL=INFO"
        ])
        
        # Security variables
        env_vars.extend([
            "CORS_ALLOWED_ORIGINS=http://localhost:3000",
            "CSRF_TRUSTED_ORIGINS=http://localhost:3000",
            "SECURE_SSL_REDIRECT=true" if deployment_target == "production" else "SECURE_SSL_REDIRECT=false"
        ])
        
        content = "\n".join(env_vars)
        
        return GeneratedConfig(
            config_type="environment",
            filename=".env.example",
            content=content,
            description="Environment variables template",
            priority="high"
        )
    
    def _generate_deployment_instructions(
        self,
        stack: TechnologyStack,
        config_types: List[str],
        deployment_target: str
    ) -> List[str]:
        """Generate step-by-step deployment instructions"""
        
        instructions = [
            "# Deployment Instructions",
            "",
            "Follow these steps to deploy your application:",
            ""
        ]
        
        if "docker" in config_types:
            instructions.extend([
                "## Docker Deployment",
                "",
                "1. Build the Docker image:",
                "   ```bash",
                "   docker build -t myapp .",
                "   ```",
                "",
                "2. Run the container:",
                "   ```bash",
                "   docker run -p 8000:8000 myapp",
                "   ```",
                ""
            ])
        
        if "docker-compose" in config_types:
            instructions.extend([
                "## Docker Compose Deployment",
                "",
                "1. Start all services:",
                "   ```bash",
                "   docker-compose up -d",
                "   ```",
                "",
                "2. View logs:",
                "   ```bash",
                "   docker-compose logs -f",
                "   ```",
                ""
            ])
        
        if "kubernetes" in config_types:
            instructions.extend([
                "## Kubernetes Deployment",
                "",
                "1. Apply the configuration:",
                "   ```bash",
                "   kubectl apply -f k8s-deployment.yml",
                "   ```",
                "",
                "2. Check deployment status:",
                "   ```bash",
                "   kubectl get pods",
                "   ```",
                ""
            ])
        
        # Add general instructions
        instructions.extend([
            "## General Setup",
            "",
            "1. Configure environment variables:",
            "   - Copy `.env.example` to `.env`",
            "   - Update values according to your environment",
            "",
            "2. Set up monitoring:",
            "   - Configure health checks",
            "   - Set up logging and metrics",
            "",
            "3. Security considerations:",
            "   - Use HTTPS in production",
            "   - Implement proper authentication",
            "   - Regular security updates",
            ""
        ])
        
        return instructions
    
    def _generate_environment_variables(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> Dict[str, str]:
        """Generate environment variables dictionary"""
        
        env_vars = {
            "ENVIRONMENT": deployment_target,
            "DEBUG": "false" if deployment_target == "production" else "true",
            "PORT": "8000",
            "HOST": "0.0.0.0"
        }
        
        # Language-specific variables
        if stack.language:
            lang = stack.language.lower()
            if lang == "python":
                env_vars.update({
                    "PYTHONDONTWRITEBYTECODE": "1",
                    "PYTHONUNBUFFERED": "1"
                })
            elif lang == "javascript":
                env_vars["NODE_ENV"] = deployment_target
        
        # Database configuration
        if stack.database:
            if "postgres" in stack.database.lower():
                env_vars["DATABASE_URL"] = "postgresql://user:password@localhost:5432/dbname"
            elif "mysql" in stack.database.lower():
                env_vars["DATABASE_URL"] = "mysql://user:password@localhost:3306/dbname"
        
        return env_vars
    
    def _generate_resource_recommendations(
        self,
        stack: TechnologyStack
    ) -> Dict[str, Any]:
        """Generate resource recommendations"""
        
        # Base recommendations
        recommendations = {
            "cpu": {"min": "250m", "recommended": "500m", "max": "1000m"},
            "memory": {"min": "256Mi", "recommended": "512Mi", "max": "1Gi"},
            "storage": {"min": "1Gi", "recommended": "5Gi", "max": "20Gi"},
            "replicas": {"min": 1, "recommended": 3, "max": 10}
        }
        
        # Adjust based on language/framework
        if stack.language:
            lang = stack.language.lower()
            if lang == "java":
                # Java typically needs more memory
                recommendations["memory"] = {"min": "512Mi", "recommended": "1Gi", "max": "2Gi"}
            elif lang == "go":
                # Go is more efficient
                recommendations["memory"] = {"min": "128Mi", "recommended": "256Mi", "max": "512Mi"}
        
        # Adjust based on framework
        if stack.framework:
            framework = stack.framework.lower()
            if "spring" in framework:
                recommendations["memory"] = {"min": "512Mi", "recommended": "1Gi", "max": "2Gi"}
        
        return recommendations
    
    async def health_check(self) -> Dict[str, str]:
        """Check if configuration generator is healthy"""
        try:
            return {"config_generator": "healthy"}
        except Exception as e:
            return {"config_generator": "error", "error": str(e)}
