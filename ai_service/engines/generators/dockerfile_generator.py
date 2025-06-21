"""
Dockerfile Generator - Clean, focused Dockerfile generation
Production-ready Docker configurations for various technology stacks
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass

from ..core.models import TechnologyStack, AnalysisResult

logger = logging.getLogger(__name__)


@dataclass
class DockerfileConfig:
    """Configuration for Dockerfile generation"""
    base_image: str
    working_dir: str
    expose_ports: List[int]
    environment_vars: Dict[str, str]
    build_commands: List[str]
    runtime_commands: List[str]
    health_check: Optional[str] = None
    user: Optional[str] = None
    multi_stage: bool = False


class DockerfileGenerator:
    """
    Production-ready Dockerfile generator
    
    Features:
    - Multi-stage builds
    - Security best practices
    - Optimized layer caching
    - Health checks
    - Non-root user setup
    """
    
    def __init__(self):
        self.base_images = {
            "node": "node:18-alpine",
            "python": "python:3.11-slim",
            "java": "openjdk:17-jdk-slim",
            "go": "golang:1.21-alpine",
            "php": "php:8.2-fpm-alpine",
            "ruby": "ruby:3.2-alpine",
            "rust": "rust:1.70-slim",
            "dotnet": "mcr.microsoft.com/dotnet/aspnet:7.0"
        }
    
    async def generate_dockerfile(self, analysis: AnalysisResult) -> str:
        """Generate optimized Dockerfile based on analysis results"""
        try:
            stack = analysis.technology_stack
            config = self._create_config(stack)
            
            if config.multi_stage:
                return self._generate_multi_stage_dockerfile(config, stack)
            else:
                return self._generate_single_stage_dockerfile(config, stack)
                
        except Exception as e:
            logger.error(f"Error generating Dockerfile: {e}")
            return self._generate_fallback_dockerfile(analysis.technology_stack)
    
    def _create_config(self, stack: TechnologyStack) -> DockerfileConfig:
        """Create Dockerfile configuration based on technology stack"""
        primary_lang = stack.primary_language.lower()
        
        # Base configuration
        config = DockerfileConfig(
            base_image=self.base_images.get(primary_lang, "alpine:latest"),
            working_dir="/app",
            expose_ports=[],
            environment_vars={},
            build_commands=[],
            runtime_commands=[]
        )
        
        # Language-specific configuration
        if primary_lang == "node":
            self._configure_node(config, stack)
        elif primary_lang == "python":
            self._configure_python(config, stack)
        elif primary_lang == "java":
            self._configure_java(config, stack)
        elif primary_lang == "go":
            self._configure_go(config, stack)
        elif primary_lang == "php":
            self._configure_php(config, stack)
        elif primary_lang == "ruby":
            self._configure_ruby(config, stack)
        elif primary_lang == "rust":
            self._configure_rust(config, stack)
        elif primary_lang == "dotnet":
            self._configure_dotnet(config, stack)
        
        # Framework-specific adjustments
        self._configure_frameworks(config, stack)
        
        return config
    
    def _configure_node(self, config: DockerfileConfig, stack: TechnologyStack):
        """Configure for Node.js applications"""
        config.expose_ports = [3000]
        config.environment_vars.update({
            "NODE_ENV": "production",
            "NPM_CONFIG_LOGLEVEL": "warn"
        })
        
        # Detect package manager
        package_manager = "npm"
        if "yarn" in stack.package_managers:
            package_manager = "yarn"
        elif "pnpm" in stack.package_managers:
            package_manager = "pnpm"
        
        config.build_commands = [
            f"COPY package*.json ./",
            f"RUN {package_manager} ci --only=production && {package_manager} cache clean --force"
        ]
        
        config.runtime_commands = [
            "COPY . .",
            "CMD [\"node\", \"index.js\"]"
        ]
        
        config.health_check = "curl -f http://localhost:3000/health || exit 1"
        config.user = "node"
        config.multi_stage = True
    
    def _configure_python(self, config: DockerfileConfig, stack: TechnologyStack):
        """Configure for Python applications"""
        config.expose_ports = [8000]
        config.environment_vars.update({
            "PYTHONUNBUFFERED": "1",
            "PYTHONDONTWRITEBYTECODE": "1",
            "PIP_NO_CACHE_DIR": "1",
            "PIP_DISABLE_PIP_VERSION_CHECK": "1"
        })
        
        # Detect if it's a web framework
        web_frameworks = ["django", "flask", "fastapi", "tornado"]
        is_web_app = any(fw in stack.frameworks for fw in web_frameworks)
        
        if is_web_app:
            config.build_commands = [
                "RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*",
                "COPY requirements.txt .",
                "RUN pip install --no-cache-dir -r requirements.txt"
            ]
            
            if "django" in stack.frameworks:
                config.runtime_commands = [
                    "COPY . .",
                    "RUN python manage.py collectstatic --noinput",
                    "CMD [\"gunicorn\", \"--bind\", \"0.0.0.0:8000\", \"app:app\"]"
                ]
            elif "fastapi" in stack.frameworks:
                config.runtime_commands = [
                    "COPY . .",
                    "CMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]"
                ]
            else:
                config.runtime_commands = [
                    "COPY . .",
                    "CMD [\"python\", \"app.py\"]"
                ]
        else:
            config.build_commands = [
                "COPY requirements.txt .",
                "RUN pip install --no-cache-dir -r requirements.txt"
            ]
            config.runtime_commands = [
                "COPY . .",
                "CMD [\"python\", \"main.py\"]"
            ]
        
        config.health_check = "curl -f http://localhost:8000/health || exit 1" if is_web_app else None
        config.user = "www-data"
    
    def _configure_java(self, config: DockerfileConfig, stack: TechnologyStack):
        """Configure for Java applications"""
        config.expose_ports = [8080]
        config.environment_vars.update({
            "JAVA_OPTS": "-Xmx512m -Xms256m"
        })
        
        if "maven" in stack.build_tools:
            config.build_commands = [
                "COPY pom.xml .",
                "RUN mvn dependency:go-offline",
                "COPY src ./src",
                "RUN mvn clean package -DskipTests"
            ]
        elif "gradle" in stack.build_tools:
            config.build_commands = [
                "COPY build.gradle settings.gradle ./",
                "COPY gradle gradle",
                "COPY gradlew .",
                "RUN ./gradlew dependencies",
                "COPY src ./src",
                "RUN ./gradlew build -x test"
            ]
        
        config.runtime_commands = [
            "CMD [\"java\", \"-jar\", \"target/app.jar\"]"
        ]
        
        config.health_check = "curl -f http://localhost:8080/actuator/health || exit 1"
        config.multi_stage = True
    
    def _configure_frameworks(self, config: DockerfileConfig, stack: TechnologyStack):
        """Apply framework-specific configurations"""
        # Web framework ports
        if "react" in stack.frameworks and config.expose_ports == [3000]:
            config.expose_ports = [3000]
        elif "vue" in stack.frameworks and config.expose_ports == [3000]:
            config.expose_ports = [8080]
        elif "angular" in stack.frameworks and config.expose_ports == [3000]:
            config.expose_ports = [4200]
    
    def _generate_single_stage_dockerfile(self, config: DockerfileConfig, stack: TechnologyStack) -> str:
        """Generate single-stage Dockerfile"""
        lines = [
            f"FROM {config.base_image}",
            "",
            f"WORKDIR {config.working_dir}",
            ""
        ]
        
        # Environment variables
        if config.environment_vars:
            for key, value in config.environment_vars.items():
                lines.append(f"ENV {key}={value}")
            lines.append("")
        
        # Build commands
        if config.build_commands:
            lines.extend(config.build_commands)
            lines.append("")
        
        # Runtime commands
        if config.runtime_commands:
            lines.extend(config.runtime_commands)
            lines.append("")
        
        # Expose ports
        if config.expose_ports:
            for port in config.expose_ports:
                lines.append(f"EXPOSE {port}")
            lines.append("")
        
        # Health check
        if config.health_check:
            lines.append(f"HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD {config.health_check}")
            lines.append("")
        
        # User
        if config.user:
            lines.append(f"USER {config.user}")
        
        return "\n".join(lines).strip()
    
    def _generate_multi_stage_dockerfile(self, config: DockerfileConfig, stack: TechnologyStack) -> str:
        """Generate multi-stage Dockerfile for optimized builds"""
        lines = [
            "# Build stage",
            f"FROM {config.base_image} AS builder",
            "",
            f"WORKDIR {config.working_dir}",
            ""
        ]
        
        # Build stage commands
        if config.build_commands:
            lines.extend(config.build_commands)
            lines.append("")
        
        # Production stage
        lines.extend([
            "# Production stage",
            f"FROM {config.base_image}",
            "",
            f"WORKDIR {config.working_dir}",
            ""
        ])
        
        # Environment variables
        if config.environment_vars:
            for key, value in config.environment_vars.items():
                lines.append(f"ENV {key}={value}")
            lines.append("")
        
        # Copy from builder
        lines.append("COPY --from=builder /app .")
        lines.append("")
        
        # Runtime commands
        if config.runtime_commands:
            lines.extend(config.runtime_commands)
            lines.append("")
        
        # Expose ports
        if config.expose_ports:
            for port in config.expose_ports:
                lines.append(f"EXPOSE {port}")
            lines.append("")
        
        # Health check
        if config.health_check:
            lines.append(f"HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD {config.health_check}")
            lines.append("")
        
        # User
        if config.user:
            lines.append(f"USER {config.user}")
        
        return "\n".join(lines).strip()
    
    def _generate_fallback_dockerfile(self, stack: TechnologyStack) -> str:
        """Generate basic fallback Dockerfile"""
        return f"""FROM alpine:latest

WORKDIR /app

COPY . .

EXPOSE 8000

CMD ["echo", "Please configure your application properly"]

# Technology Stack Detected: {stack.primary_language}
# Frameworks: {', '.join(stack.frameworks)}
# Please customize this Dockerfile for your specific needs
"""
