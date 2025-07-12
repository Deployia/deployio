"""
Dockerfile Generator - Clean, focused Dockerfile generation
Production-ready Docker configurations for various technology stacks
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass

from models.analysis_models import AnalysisResult, TechnologyStack

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
            "dotnet": "mcr.microsoft.com/dotnet/aspnet:7.0",
        }

    async def generate_dockerfile(
        self,
        analysis: Optional[AnalysisResult] = None,
        analysis_context: Optional[Dict] = None,
        tech_stack: Optional[TechnologyStack] = None,
        optimization_level: str = "balanced",
        build_command: Optional[str] = None,
        start_command: Optional[str] = None,
        port: Optional[int] = None,
        base_image_preference: Optional[str] = None,
    ) -> str:
        """Generate optimized Dockerfile based on analysis results or context"""
        try:
            # Handle both legacy and new formats
            if analysis:
                # Handle string, dict, and object formats
                if isinstance(analysis, str):
                    # If analysis is a string, we can't extract technology stack
                    logger.warning("Analysis provided as string, using default configuration")
                    stack = None
                elif isinstance(analysis, dict):
                    stack = analysis.get("technology_stack")
                    if isinstance(stack, dict):
                        # Convert dict to TechnologyStack object
                        from ...models.analysis_models import TechnologyStack

                        stack = TechnologyStack(
                            language=stack.get("language", "unknown"),
                            framework=stack.get("framework"),
                            database=stack.get("database"),
                            build_tool=stack.get("build_tool"),
                            package_manager=stack.get("package_manager"),
                            runtime_version=stack.get("runtime_version"),
                            architecture_pattern=stack.get("architecture_pattern"),
                            additional_technologies=stack.get(
                                "additional_technologies", []
                            ),
                        )
                else:
                    # Legacy object format
                    stack = analysis.technology_stack
            elif analysis_context and tech_stack:
                # New format
                stack = tech_stack
            else:
                raise ValueError(
                    "Either analysis or (analysis_context + tech_stack) must be provided"
                )

            config = self._create_config(stack, base_image_preference)

            # Apply custom commands if provided
            if build_command:
                config.build_commands.extend(build_command.split(" && "))
            if start_command:
                config.runtime_commands = [start_command]
            if port:
                config.expose_ports = [port]

            if config.multi_stage:
                return self._generate_multi_stage_dockerfile(config, stack)
            else:
                return self._generate_single_stage_dockerfile(config, stack)

        except Exception as e:
            logger.error(f"Error generating Dockerfile: {e}")
            # Fallback with basic config
            fallback_stack = tech_stack or (
                analysis.technology_stack if analysis else None
            )
            if fallback_stack:
                return self._generate_fallback_dockerfile(fallback_stack)
            else:
                return self._generate_basic_fallback_dockerfile()

    async def generate_multistage_dockerfiles(
        self,
        analysis: Optional[AnalysisResult] = None,
        analysis_context: Optional[Dict] = None,
        tech_stack: Optional[TechnologyStack] = None,
        frontend_path: Optional[str] = None,
        backend_path: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Generate optimized Dockerfiles for multi-service applications (frontend and backend)

        Args:
            analysis: Analysis result containing technology information
            analysis_context: Additional context for analysis
            tech_stack: Technology stack information
            frontend_path: Path to frontend code (relative to repo root)
            backend_path: Path to backend code (relative to repo root)

        Returns:
            Dictionary of paths and Dockerfile contents
        """
        result = {}

        # Extract tech stack information
        if analysis:
            stack = (
                analysis.technology_stack
                if hasattr(analysis, "technology_stack")
                else None
            )
        elif tech_stack:
            stack = tech_stack
        else:
            logger.warning(
                "No technology stack information provided for multi-service Dockerfile generation"
            )
            return result

        # Detect if we have a frontend and backend
        has_frontend = False
        has_backend = False

        # Auto-detect frontend frameworks
        frontend_frameworks = ["react", "vue", "angular", "svelte"]
        if hasattr(stack, "framework") and stack.framework in frontend_frameworks:
            has_frontend = True

        # Auto-detect backend frameworks
        backend_frameworks = ["express", "django", "flask", "spring", "fastapi"]
        if hasattr(stack, "additional_technologies"):
            for tech in stack.additional_technologies:
                if any(bf in tech.lower() for bf in backend_frameworks):
                    has_backend = True
                    break

        # Generate frontend Dockerfile if needed
        if has_frontend:
            frontend_stack = self._clone_stack_for_frontend(stack)
            frontend_dockerfile = await self.generate_dockerfile(
                tech_stack=frontend_stack,
                optimization_level="balanced",
                port=3000,
            )
            path = (
                "client/Dockerfile"
                if frontend_path is None
                else f"{frontend_path}/Dockerfile"
            )
            result[path] = frontend_dockerfile

        # Generate backend Dockerfile if needed
        if has_backend:
            backend_stack = self._clone_stack_for_backend(stack)
            backend_dockerfile = await self.generate_dockerfile(
                tech_stack=backend_stack,
                optimization_level="balanced",
                port=8000,
            )
            path = (
                "server/Dockerfile"
                if backend_path is None
                else f"{backend_path}/Dockerfile"
            )
            result[path] = backend_dockerfile

        # If no specific services detected, generate a single Dockerfile
        if not (has_frontend or has_backend):
            generic_dockerfile = await self.generate_dockerfile(
                tech_stack=stack,
                optimization_level="balanced",
            )
            result["Dockerfile"] = generic_dockerfile

        return result

    def _create_config(
        self, stack: TechnologyStack, base_image_preference: Optional[str] = None
    ) -> DockerfileConfig:
        """Create Dockerfile configuration based on technology stack"""
        primary_lang = stack.language.lower() if stack.language else "unknown"

        # Base configuration
        base_image = base_image_preference or self.base_images.get(
            primary_lang, "alpine:latest"
        )
        config = DockerfileConfig(
            base_image=base_image,
            working_dir="/app",
            expose_ports=[],
            environment_vars={},
            build_commands=[],
            runtime_commands=[],
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
        config.environment_vars.update(
            {"NODE_ENV": "production", "NPM_CONFIG_LOGLEVEL": "warn"}
        )

        # Detect package manager
        package_manager = "npm"
        if "yarn" in stack.package_managers:
            package_manager = "yarn"
        elif "pnpm" in stack.package_managers:
            package_manager = "pnpm"

        config.build_commands = [
            "COPY package.json ./",
            "COPY package-lock.json ./",
            f"RUN {package_manager} ci --only=production && {package_manager} cache clean --force",
        ]

        config.runtime_commands = ["COPY . .", 'CMD ["node", "index.js"]']

        config.health_check = "curl -f http://localhost:3000/health || exit 1"
        config.user = "node"
        config.multi_stage = True

    def _configure_python(self, config: DockerfileConfig, stack: TechnologyStack):
        """Configure for Python applications"""
        config.expose_ports = [8000]
        config.environment_vars.update(
            {
                "PYTHONUNBUFFERED": "1",
                "PYTHONDONTWRITEBYTECODE": "1",
                "PIP_NO_CACHE_DIR": "1",
                "PIP_DISABLE_PIP_VERSION_CHECK": "1",
            }
        )

        # Detect if it's a web framework
        web_frameworks = ["django", "flask", "fastapi", "tornado"]
        # Check framework and additional_technologies instead of frameworks
        all_frameworks = [stack.framework] if stack.framework else []
        all_frameworks.extend(stack.additional_technologies or [])
        is_web_app = any(
            fw in [f.lower() for f in all_frameworks] for fw in web_frameworks
        )

        if is_web_app:
            config.build_commands = [
                "RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*",
                "COPY requirements.txt .",
                "RUN pip install --no-cache-dir -r requirements.txt",
            ]

            if stack.framework and "django" in stack.framework.lower():
                config.runtime_commands = [
                    "COPY . .",
                    "RUN python manage.py collectstatic --noinput",
                    'CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]',
                ]
            elif stack.framework and "fastapi" in stack.framework.lower():
                config.runtime_commands = [
                    "COPY . .",
                    'CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]',
                ]
            else:
                config.runtime_commands = ["COPY . .", 'CMD ["python", "app.py"]']
        else:
            config.build_commands = [
                "COPY requirements.txt .",
                "RUN pip install --no-cache-dir -r requirements.txt",
            ]
            config.runtime_commands = ["COPY . .", 'CMD ["python", "main.py"]']

        config.health_check = (
            "curl -f http://localhost:8000/health || exit 1" if is_web_app else None
        )
        config.user = "www-data"

    def _configure_java(self, config: DockerfileConfig, stack: TechnologyStack):
        """Configure for Java applications"""
        config.expose_ports = [8080]
        config.environment_vars.update({"JAVA_OPTS": "-Xmx512m -Xms256m"})

        if "maven" in stack.build_tools:
            config.build_commands = [
                "COPY pom.xml .",
                "RUN mvn dependency:go-offline",
                "COPY src ./src",
                "RUN mvn clean package -DskipTests",
            ]
        elif "gradle" in stack.build_tools:
            config.build_commands = [
                "COPY build.gradle settings.gradle ./",
                "COPY gradle gradle",
                "COPY gradlew .",
                "RUN ./gradlew dependencies",
                "COPY src ./src",
                "RUN ./gradlew build -x test",
            ]

        config.runtime_commands = ['CMD ["java", "-jar", "target/app.jar"]']

        config.health_check = "curl -f http://localhost:8080/actuator/health || exit 1"
        config.multi_stage = True

    def _configure_frameworks(self, config: DockerfileConfig, stack: TechnologyStack):
        """Apply framework-specific configurations"""
        # Get all frameworks (framework + additional_technologies)
        all_frameworks = [stack.framework] if stack.framework else []
        all_frameworks.extend(stack.additional_technologies or [])
        all_frameworks = [f.lower() for f in all_frameworks if f]

        # Web framework ports
        if "react" in all_frameworks and config.expose_ports == [3000]:
            config.expose_ports = [3000]
        elif "vue" in all_frameworks and config.expose_ports == [3000]:
            config.expose_ports = [8080]
        elif "angular" in all_frameworks and config.expose_ports == [3000]:
            config.expose_ports = [4200]

    def _generate_single_stage_dockerfile(
        self, config: DockerfileConfig, stack: TechnologyStack
    ) -> str:
        """Generate single-stage Dockerfile"""
        lines = [f"FROM {config.base_image}", "", f"WORKDIR {config.working_dir}", ""]

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
            lines.append(
                f"HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD {config.health_check}"
            )
            lines.append("")

        # User
        if config.user:
            lines.append(f"USER {config.user}")

        return "\n".join(lines).strip()

    def _generate_multi_stage_dockerfile(
        self, config: DockerfileConfig, stack: TechnologyStack
    ) -> str:
        """Generate multi-stage Dockerfile for optimized builds"""
        lines = [
            "# Build stage",
            f"FROM {config.base_image} AS builder",
            "",
            f"WORKDIR {config.working_dir}",
            "",
        ]

        # Build stage commands
        if config.build_commands:
            lines.extend(config.build_commands)
            lines.append("")

        # Production stage
        lines.extend(
            [
                "# Production stage",
                f"FROM {config.base_image}",
                "",
                f"WORKDIR {config.working_dir}",
                "",
            ]
        )

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
            lines.append(
                f"HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD {config.health_check}"
            )
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

# Technology Stack Detected: {stack.language or 'unknown'}
# Framework: {stack.framework or 'none'}
# Additional Technologies: {', '.join(stack.additional_technologies or [])}
# Please customize this Dockerfile for your specific needs
"""

    def _generate_basic_fallback_dockerfile(self) -> str:
        """Generate very basic fallback Dockerfile when no stack info available"""
        return """FROM alpine:latest

WORKDIR /app

COPY . .

EXPOSE 8000

CMD ["echo", "Application configuration needed"]

# Basic Dockerfile template
# Please customize for your specific application
"""

    def _clone_stack_for_frontend(self, stack: TechnologyStack) -> TechnologyStack:
        """Create a copy of the tech stack optimized for frontend services"""
        from models.analysis_models import TechnologyStack

        return TechnologyStack(
            language=stack.language,
            framework=stack.framework,
            database=None,  # Frontend doesn't need database info
            build_tool=stack.build_tool,
            package_manager=stack.package_manager,
            runtime_version=stack.runtime_version,
            architecture_pattern="spa",  # Assume SPA for frontend
            additional_technologies=[
                tech
                for tech in getattr(stack, "additional_technologies", [])
                if not any(
                    db in tech.lower()
                    for db in ["mongo", "postgres", "mysql", "sql", "database"]
                )
            ],
            main_entry_point=getattr(stack, "main_entry_point", None),
            build_command=getattr(stack, "build_command", None),
            start_command=(
                "serve -s build" if stack.framework == "react" else "npm start"
            ),
        )

    def _clone_stack_for_backend(self, stack: TechnologyStack) -> TechnologyStack:
        """Create a copy of the tech stack optimized for backend services"""
        from models.analysis_models import TechnologyStack

        return TechnologyStack(
            language=stack.language,
            framework=next(
                (
                    tech
                    for tech in getattr(stack, "additional_technologies", [])
                    if any(
                        bf in tech.lower()
                        for bf in ["express", "django", "flask", "spring", "fastapi"]
                    )
                ),
                "express",
            ),  # Default to express for Node.js backends
            database=stack.database,
            build_tool=stack.build_tool,
            package_manager=stack.package_manager,
            runtime_version=stack.runtime_version,
            architecture_pattern=getattr(stack, "architecture_pattern", "rest-api"),
            additional_technologies=[
                tech
                for tech in getattr(stack, "additional_technologies", [])
                if any(
                    be in tech.lower() for be in ["server", "api", "backend", "rest"]
                )
            ],
            main_entry_point=getattr(stack, "main_entry_point", None),
            build_command=getattr(stack, "build_command", None),
            start_command="node server.js" if stack.language == "javascript" else None,
        )
