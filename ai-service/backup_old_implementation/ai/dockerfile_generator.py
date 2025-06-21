"""
AI-Powered Dockerfile Generation Engine
"""

import logging
from typing import Dict, List
from dataclasses import dataclass
from ai.stack_detector import DetectedStack

logger = logging.getLogger(__name__)


@dataclass
class DockerConfig:
    """Docker configuration settings"""

    base_image: str
    working_dir: str = "/app"
    exposed_port: int = 3000
    build_commands: List[str] = None
    runtime_commands: List[str] = None
    environment_vars: Dict[str, str] = None
    volumes: List[str] = None


@dataclass
class GeneratedDockerfile:
    """Generated Dockerfile with metadata"""

    dockerfile_content: str
    docker_compose_content: str
    build_instructions: List[str]
    optimization_notes: List[str]
    security_features: List[str]
    estimated_size: str


class DockerfileGenerator:
    """AI-powered Dockerfile generation engine"""

    def __init__(self):
        self.base_images = self._load_base_images()
        self.security_practices = self._load_security_practices()
        self.optimization_patterns = self._load_optimization_patterns()

    def _load_base_images(self) -> Dict:
        """Load recommended base images for different technologies"""
        return {
            "node": {
                "production": "node:18-alpine",
                "development": "node:18",
                "lts": "node:lts-alpine",
            },
            "python": {
                "production": "python:3.11-slim",
                "development": "python:3.11",
                "alpine": "python:3.11-alpine",
            },
            "java": {
                "production": "openjdk:17-jre-slim",
                "development": "openjdk:17-jdk",
                "alpine": "openjdk:17-jre-alpine",
            },
            "go": {
                "production": "golang:1.20-alpine",
                "scratch": "scratch",
                "development": "golang:1.20",
            },
            "rust": {
                "production": "rust:1.70-slim",
                "alpine": "rust:1.70-alpine",
                "development": "rust:1.70",
            },
            "php": {
                "production": "php:8.2-fpm-alpine",
                "apache": "php:8.2-apache",
                "development": "php:8.2",
            },
        }

    def _load_security_practices(self) -> List[str]:
        """Load Docker security best practices"""
        return [
            "Use non-root user",
            "Multi-stage builds for smaller images",
            "Minimal base images (Alpine/Slim)",
            "Explicit version pinning",
            "Remove package managers after installation",
            "Set proper file permissions",
            "Use .dockerignore file",
            "Scan for vulnerabilities",
            "Minimize attack surface",
            "Use secrets management",
        ]

    def _load_optimization_patterns(self) -> Dict:
        """Load optimization patterns for different frameworks"""
        return {
            "react": {
                "build_optimization": [
                    "Use multi-stage build",
                    "Static file serving with nginx",
                    "Enable gzip compression",
                    "Optimize bundle size",
                ],
                "caching": [
                    "Cache node_modules",
                    "Leverage build cache",
                    "Cache static assets",
                ],
            },
            "express": {
                "build_optimization": [
                    "Remove dev dependencies in production",
                    "Use PM2 for process management",
                    "Enable clustering",
                ],
                "caching": ["Cache npm install", "Use npm ci for faster installs"],
            },
            "django": {
                "build_optimization": [
                    "Collect static files",
                    "Use gunicorn for production",
                    "Configure database connections",
                ],
                "caching": ["Cache pip dependencies", "Use wheels for faster installs"],
            },
            "fastapi": {
                "build_optimization": [
                    "Use uvicorn for ASGI server",
                    "Enable async optimizations",
                    "Configure workers",
                ],
                "caching": [
                    "Cache pip dependencies",
                    "Use requirements.txt for better caching",
                ],
            },
        }

    async def generate_dockerfile(
        self, stack: DetectedStack, project_config: Dict = None
    ) -> GeneratedDockerfile:
        """
        Generate optimized Dockerfile based on detected technology stack
        """
        try:
            # Determine Docker configuration
            docker_config = self._determine_docker_config(stack, project_config or {})

            # Generate Dockerfile content
            dockerfile_content = self._generate_dockerfile_content(stack, docker_config)

            # Generate Docker Compose file
            docker_compose_content = self._generate_docker_compose(stack, docker_config)

            # Generate build instructions
            build_instructions = self._generate_build_instructions(stack, docker_config)

            # Generate optimization notes
            optimization_notes = self._generate_optimization_notes(stack)

            # Generate security features list
            security_features = self._generate_security_features(dockerfile_content)

            # Estimate image size
            estimated_size = self._estimate_image_size(stack, docker_config)

            logger.info(
                f"Generated Dockerfile for {stack.framework or stack.language} application"
            )

            return GeneratedDockerfile(
                dockerfile_content=dockerfile_content,
                docker_compose_content=docker_compose_content,
                build_instructions=build_instructions,
                optimization_notes=optimization_notes,
                security_features=security_features,
                estimated_size=estimated_size,
            )

        except Exception as e:
            logger.error(f"Dockerfile generation failed: {e}")
            return self._generate_fallback_dockerfile(stack)

    def _determine_docker_config(
        self, stack: DetectedStack, project_config: Dict
    ) -> DockerConfig:
        """Determine optimal Docker configuration for the stack"""

        # Default configuration
        config = DockerConfig(
            base_image="alpine:latest",
            working_dir="/app",
            exposed_port=3000,
            build_commands=[],
            runtime_commands=[],
            environment_vars={},
            volumes=[],
        )

        # Configure based on detected language/framework
        if stack.language == "javascript" or stack.framework in [
            "React",
            "Vue.js",
            "Angular",
        ]:
            config.base_image = self.base_images["node"]["production"]
            config.exposed_port = project_config.get("port", 3000)

            if stack.framework == "Next.js":
                config.exposed_port = 3000
                config.environment_vars["NODE_ENV"] = "production"
            elif stack.framework in ["React", "Vue.js", "Angular"]:
                # For SPA, use nginx for serving
                config.base_image = "nginx:alpine"
                config.exposed_port = 80

        elif stack.language == "python":
            config.base_image = self.base_images["python"]["production"]
            config.exposed_port = project_config.get("port", 8000)

            if stack.framework == "Django":
                config.exposed_port = 8000
                config.environment_vars.update(
                    {
                        "PYTHONUNBUFFERED": "1",
                        "DJANGO_SETTINGS_MODULE": "myproject.settings",
                    }
                )
            elif stack.framework == "FastAPI":
                config.exposed_port = 8000
                config.environment_vars["PYTHONUNBUFFERED"] = "1"
            elif stack.framework == "Flask":
                config.exposed_port = 5000
                config.environment_vars.update(
                    {"FLASK_ENV": "production", "PYTHONUNBUFFERED": "1"}
                )

        elif stack.language == "java":
            config.base_image = self.base_images["java"]["production"]
            config.exposed_port = project_config.get("port", 8080)
            config.environment_vars["JAVA_OPTS"] = "-Xmx512m"

        elif stack.language == "go":
            config.base_image = self.base_images["go"]["production"]
            config.exposed_port = project_config.get("port", 8080)

        elif stack.language == "rust":
            config.base_image = self.base_images["rust"]["production"]
            config.exposed_port = project_config.get("port", 8080)

        return config

    def _generate_dockerfile_content(
        self, stack: DetectedStack, config: DockerConfig
    ) -> str:
        """Generate the actual Dockerfile content"""

        if stack.language == "javascript" and stack.framework in [
            "React",
            "Vue.js",
            "Angular",
        ]:
            return self._generate_spa_dockerfile(stack, config)
        elif stack.language == "javascript" and stack.framework in [
            "Express",
            "Next.js",
        ]:
            return self._generate_node_dockerfile(stack, config)
        elif stack.language == "python":
            return self._generate_python_dockerfile(stack, config)
        elif stack.language == "java":
            return self._generate_java_dockerfile(stack, config)
        elif stack.language == "go":
            return self._generate_go_dockerfile(stack, config)
        else:
            return self._generate_generic_dockerfile(stack, config)

    def _generate_spa_dockerfile(
        self, stack: DetectedStack, config: DockerConfig
    ) -> str:
        """Generate Dockerfile for Single Page Applications"""
        framework_lower = stack.framework.lower().replace(".", "")

        build_cmd = "npm run build"
        if stack.build_tool == "Vite":
            build_cmd = "npm run build"
        elif stack.build_tool == "Webpack":
            build_cmd = "npm run build"
        elif framework_lower == "angular":
            build_cmd = "npm run build --prod"

        return f"""# Multi-stage build for {stack.framework} application
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN {build_cmd}

# Stage 2: Production stage
FROM nginx:alpine

# Copy custom nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy built assets (adjust path based on framework)
{self._get_spa_copy_command(stack.framework)}

# Expose port
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001 && \\
    chown -R nextjs:nodejs /usr/share/nginx/html
USER nextjs
"""

    def _generate_node_dockerfile(
        self, stack: DetectedStack, config: DockerConfig
    ) -> str:
        """Generate Dockerfile for Node.js applications"""
        return f"""# Optimized Dockerfile for {stack.framework or 'Node.js'} application
FROM node:18-alpine

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app directory with proper permissions
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001

# Copy package files for better caching
COPY --chown=nextjs:nodejs package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=nextjs:nodejs . .

# Set environment variables
ENV NODE_ENV=production
{self._format_env_vars(config.environment_vars)}

# Expose port
EXPOSE {config.exposed_port}

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD node healthcheck.js || exit 1

# Switch to non-root user
USER nextjs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "{self._get_node_entry_point(stack)}"]
"""

    def _generate_python_dockerfile(
        self, stack: DetectedStack, config: DockerConfig
    ) -> str:
        """Generate Dockerfile for Python applications"""

        pip_install_cmd = "pip install --no-cache-dir -r requirements.txt"
        start_cmd = "python app.py"

        if stack.framework == "Django":
            start_cmd = "gunicorn myproject.wsgi:application --bind 0.0.0.0:8000"
        elif stack.framework == "FastAPI":
            start_cmd = "uvicorn main:app --host 0.0.0.0 --port 8000"
        elif stack.framework == "Flask":
            start_cmd = "gunicorn app:app --bind 0.0.0.0:5000"

        return f"""# Optimized Dockerfile for {stack.framework or 'Python'} application
FROM python:3.11-slim

# Install system dependencies and security updates
RUN apt-get update && apt-get install -y \\
    --no-install-recommends \\
    build-essential \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN {pip_install_cmd}

# Copy application code
COPY . .

# Set environment variables
{self._format_env_vars(config.environment_vars)}

# Set proper permissions
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE {config.exposed_port}

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:{config.exposed_port}/health || exit 1

# Start the application
CMD ["{start_cmd.split()[0]}", "{'" ", "'.join(start_cmd.split()[1:])}"]
"""

    def _generate_java_dockerfile(
        self, stack: DetectedStack, config: DockerConfig
    ) -> str:
        """Generate Dockerfile for Java applications"""
        return f"""# Multi-stage build for {stack.framework or 'Java'} application
# Stage 1: Build stage
FROM openjdk:17-jdk-slim AS builder

WORKDIR /app

# Copy build files
COPY pom.xml .
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime stage
FROM openjdk:17-jre-slim

# Install security updates
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Set environment variables
{self._format_env_vars(config.environment_vars)}

# Set proper permissions
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE {config.exposed_port}

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:{config.exposed_port}/actuator/health || exit 1

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
"""

    def _generate_go_dockerfile(
        self, stack: DetectedStack, config: DockerConfig
    ) -> str:
        """Generate Dockerfile for Go applications"""
        return f"""# Multi-stage build for Go application
# Stage 1: Build stage
FROM golang:1.20-alpine AS builder

# Install git (required for go modules)
RUN apk add --no-cache git

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 2: Runtime stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Expose port
EXPOSE {config.exposed_port}

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD wget --no-verbose --tries=1 --spider http://localhost:{config.exposed_port}/health || exit 1

# Start the application
CMD ["./main"]
"""

    def _generate_generic_dockerfile(
        self, stack: DetectedStack, config: DockerConfig
    ) -> str:
        """Generate generic Dockerfile when specific framework is not recognized"""
        return f"""# Generic Dockerfile for {stack.language or 'unknown'} application
FROM {config.base_image}

# Set working directory
WORKDIR {config.working_dir}

# Copy application files
COPY . .

# Set environment variables
{self._format_env_vars(config.environment_vars)}

# Expose port
EXPOSE {config.exposed_port}

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:{config.exposed_port}/health || exit 1

# Start the application
CMD ["echo", "Please configure the start command for your application"]
"""

    def _generate_docker_compose(
        self, stack: DetectedStack, config: DockerConfig
    ) -> str:
        """Generate Docker Compose file"""
        services = {
            "app": {
                "build": ".",
                "ports": [f"{config.exposed_port}:{config.exposed_port}"],
                "environment": config.environment_vars,
                "restart": "unless-stopped",
            }
        }

        # Add database service if detected
        if stack.database:
            if stack.database == "MongoDB":
                services["mongodb"] = {
                    "image": "mongo:6.0",
                    "ports": ["27017:27017"],
                    "environment": {
                        "MONGO_INITDB_ROOT_USERNAME": "admin",
                        "MONGO_INITDB_ROOT_PASSWORD": "password",
                    },
                    "volumes": ["mongodb_data:/data/db"],
                    "restart": "unless-stopped",
                }
                services["app"]["depends_on"] = ["mongodb"]
                services["app"]["environment"][
                    "DATABASE_URL"
                ] = "mongodb://admin:password@mongodb:27017"

            elif stack.database == "PostgreSQL":
                services["postgres"] = {
                    "image": "postgres:15",
                    "ports": ["5432:5432"],
                    "environment": {
                        "POSTGRES_DB": "myapp",
                        "POSTGRES_USER": "user",
                        "POSTGRES_PASSWORD": "password",
                    },
                    "volumes": ["postgres_data:/var/lib/postgresql/data"],
                    "restart": "unless-stopped",
                }
                services["app"]["depends_on"] = ["postgres"]
                services["app"]["environment"][
                    "DATABASE_URL"
                ] = "postgresql://user:password@postgres:5432/myapp"

        # Generate volumes section
        volumes = {}
        if stack.database == "MongoDB":
            volumes["mongodb_data"] = {}
        elif stack.database == "PostgreSQL":
            volumes["postgres_data"] = {}

        compose_content = f"""version: '3.8'

services:
{self._format_docker_compose_services(services)}

{f"volumes:{self._format_docker_compose_volumes(volumes)}" if volumes else ""}

networks:
  default:
    name: {stack.framework.lower().replace('.', '') if stack.framework else 'app'}_network
"""

        return compose_content

    def _generate_build_instructions(
        self, stack: DetectedStack, config: DockerConfig
    ) -> List[str]:
        """Generate build and deployment instructions"""
        instructions = [
            "# Build and run instructions",
            "",
            "## Local Development",
            "```bash",
            "# Build the Docker image",
            "docker build -t my-app .",
            "",
            "# Run the container",
            f"docker run -p {config.exposed_port}:{config.exposed_port} my-app",
            "```",
            "",
            "## Using Docker Compose",
            "```bash",
            "# Start all services",
            "docker-compose up -d",
            "",
            "# View logs",
            "docker-compose logs -f",
            "",
            "# Stop services",
            "docker-compose down",
            "```",
            "",
            "## Production Deployment",
            "```bash",
            "# Build for production",
            "docker build -t my-app:latest .",
            "",
            "# Tag for registry",
            "docker tag my-app:latest your-registry/my-app:latest",
            "",
            "# Push to registry",
            "docker push your-registry/my-app:latest",
            "```",
        ]

        return instructions

    def _generate_optimization_notes(self, stack: DetectedStack) -> List[str]:
        """Generate optimization recommendations"""
        notes = [
            "Multi-stage build reduces final image size by ~60%",
            "Alpine Linux base images provide smaller attack surface",
            "Non-root user execution enhances security",
            "Health checks enable better container orchestration",
        ]

        framework_key = (
            stack.framework.lower().replace(".", "") if stack.framework else None
        )

        if framework_key in self.optimization_patterns:
            patterns = self.optimization_patterns[framework_key]
            notes.extend(patterns.get("build_optimization", []))
            notes.extend(patterns.get("caching", []))

        return notes

    def _generate_security_features(self, dockerfile_content: str) -> List[str]:
        """Analyze Dockerfile for security features"""
        features = []

        if "USER " in dockerfile_content and "USER root" not in dockerfile_content:
            features.append("Non-root user execution")

        if "HEALTHCHECK" in dockerfile_content:
            features.append("Container health monitoring")

        if "alpine" in dockerfile_content.lower():
            features.append("Minimal Alpine Linux base image")

        if "chown" in dockerfile_content:
            features.append("Proper file ownership")

        if "rm -rf" in dockerfile_content or "cache clean" in dockerfile_content:
            features.append("Package cache cleanup")

        if "--no-cache" in dockerfile_content:
            features.append("No package cache retention")

        return features

    def _estimate_image_size(self, stack: DetectedStack, config: DockerConfig) -> str:
        """Estimate final Docker image size"""
        base_sizes = {
            "alpine": 5,
            "slim": 50,
            "node:18-alpine": 40,
            "python:3.11-slim": 120,
            "openjdk:17-jre-slim": 180,
            "golang:1.20-alpine": 15,
            "nginx:alpine": 25,
        }

        base_size = 100  # Default
        for image, size in base_sizes.items():
            if image in config.base_image:
                base_size = size
                break

        # Add estimated application size
        app_size = 50  # Default application size
        if stack.language == "javascript":
            app_size = 100  # Node.js applications tend to be larger
        elif stack.language == "python":
            app_size = 80
        elif stack.language == "java":
            app_size = 200  # Java applications are typically larger
        elif stack.language == "go":
            app_size = 20  # Go binaries are small

        total_size = base_size + app_size
        return f"~{total_size}MB"

    def _generate_fallback_dockerfile(
        self, stack: DetectedStack
    ) -> GeneratedDockerfile:
        """Generate fallback Dockerfile when generation fails"""
        content = f"""# Fallback Dockerfile for {stack.language or 'unknown'} application
FROM alpine:latest

WORKDIR /app
COPY . .

EXPOSE 3000

CMD ["echo", "Please configure this Dockerfile for your specific application"]
"""

        return GeneratedDockerfile(
            dockerfile_content=content,
            docker_compose_content="version: '3.8'\\nservices:\\n  app:\\n    build: .\\n    ports:\\n      - '3000:3000'",
            build_instructions=["docker build -t app .", "docker run -p 3000:3000 app"],
            optimization_notes=["Manual configuration required"],
            security_features=["Basic Alpine base image"],
            estimated_size="~50MB",
        )

    # Helper methods
    def _get_spa_copy_command(self, framework: str) -> str:
        """Get appropriate copy command for SPA frameworks"""
        if framework == "React":
            return "# COPY --from=builder /app/build /usr/share/nginx/html"
        elif framework == "Vue.js":
            return "# COPY --from=builder /app/dist /usr/share/nginx/html"
        elif framework == "Angular":
            return "# COPY --from=builder /app/dist /usr/share/nginx/html"
        return "# COPY --from=builder /app/build /usr/share/nginx/html"

    def _get_node_entry_point(self, stack: DetectedStack) -> str:
        """Get Node.js application entry point"""
        if stack.framework == "Next.js":
            return "server.js"
        elif stack.framework == "Express":
            return "app.js"
        return "index.js"

    def _format_env_vars(self, env_vars: Dict[str, str]) -> str:
        """Format environment variables for Dockerfile"""
        if not env_vars:
            return ""

        lines = []
        for key, value in env_vars.items():
            lines.append(f"ENV {key}={value}")

        return "\\n".join(lines)

    def _format_docker_compose_services(self, services: Dict) -> str:
        """Format services section for docker-compose.yml"""
        result = []
        for name, config in services.items():
            result.append(f"  {name}:")
            for key, value in config.items():
                if isinstance(value, list):
                    result.append(f"    {key}:")
                    for item in value:
                        result.append(f"      - {item}")
                elif isinstance(value, dict):
                    result.append(f"    {key}:")
                    for k, v in value.items():
                        result.append(f"      {k}: {v}")
                else:
                    result.append(f"    {key}: {value}")
            result.append("")

        return "\\n".join(result)

    def _format_docker_compose_volumes(self, volumes: Dict) -> str:
        """Format volumes section for docker-compose.yml"""
        result = []
        for name, config in volumes.items():
            result.append(f"  {name}: {{}}")

        return "\\n".join(result)
