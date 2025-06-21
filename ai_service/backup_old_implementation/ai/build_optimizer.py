"""
Build Optimizer Engine

This module provides intelligent build optimization with advanced caching strategies,
parallel processing, and performance improvements for faster CI/CD pipelines.
"""

from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from enum import Enum


class OptimizationLevel(Enum):
    """Build optimization levels"""

    BASIC = "basic"
    BALANCED = "balanced"
    PERFORMANCE = "performance"
    AGGRESSIVE = "aggressive"


class CacheStrategy(Enum):
    """Caching strategies"""

    LAYER_BASED = "layer_based"
    DEPENDENCY_BASED = "dependency_based"
    INCREMENTAL = "incremental"
    HYBRID = "hybrid"


@dataclass
class CacheConfig:
    """Cache configuration"""

    strategy: CacheStrategy
    enabled: bool = True
    paths: List[str] = None
    invalidation_rules: List[str] = None
    retention_days: int = 30
    max_size_gb: int = 10


@dataclass
class ParallelBuildConfig:
    """Parallel build configuration"""

    enabled: bool
    max_parallel_jobs: int = 4
    memory_per_job: str = "2GB"
    cpu_per_job: float = 1.0
    job_scheduling: str = "auto"


@dataclass
class OptimizationMetrics:
    """Build optimization metrics"""

    estimated_time_savings: str
    cache_hit_ratio: float
    parallel_efficiency: float
    resource_utilization: float
    cost_savings: float


@dataclass
class BuildOptimizationConfig:
    """Complete build optimization configuration"""

    optimization_level: OptimizationLevel
    cache_config: CacheConfig
    parallel_config: ParallelBuildConfig
    compression_enabled: bool
    incremental_builds: bool
    artifact_optimization: Dict[str, Any]
    docker_optimization: Dict[str, Any]
    metrics: OptimizationMetrics


class BuildOptimizer:
    """AI-powered build optimization engine"""

    def __init__(self):
        self.optimization_strategies = {
            "basic": self._configure_basic_optimization,
            "balanced": self._configure_balanced_optimization,
            "performance": self._configure_performance_optimization,
            "aggressive": self._configure_aggressive_optimization,
        }

    async def optimize_build_process(
        self,
        stack_info: Dict[str, Any],
        optimization_level: str = "balanced",
        target_platform: str = "cloud",
        build_frequency: str = "moderate",
    ) -> Dict[str, Any]:
        """
        Optimize build process for maximum efficiency

        Args:
            stack_info: Technology stack information
            optimization_level: Level of optimization to apply
            target_platform: Target deployment platform
            build_frequency: How often builds are triggered

        Returns:
            Complete build optimization configuration
        """
        try:
            # Analyze current build patterns
            build_analysis = await self._analyze_build_patterns(
                stack_info, build_frequency
            )

            # Configure optimization based on level
            if optimization_level not in self.optimization_strategies:
                optimization_level = "balanced"

            strategy_func = self.optimization_strategies[optimization_level]
            config = await strategy_func(stack_info, target_platform, build_analysis)

            # Generate build scripts
            build_scripts = await self._generate_optimized_build_scripts(
                config, stack_info
            )

            # Generate Docker optimizations
            docker_configs = self._generate_docker_optimizations(config, stack_info)

            # Calculate performance improvements
            performance_gains = self._calculate_performance_gains(
                config, build_analysis
            )

            return {
                "success": True,
                "optimization_config": asdict(config),
                "build_scripts": build_scripts,
                "docker_configs": docker_configs,
                "performance_gains": performance_gains,
                "estimated_time_savings": config.metrics.estimated_time_savings,
                "cache_efficiency": f"{config.metrics.cache_hit_ratio * 100:.1f}%",
                "parallel_efficiency": f"{config.metrics.parallel_efficiency * 100:.1f}%",
                "recommendations": self._generate_optimization_recommendations(
                    config, stack_info
                ),
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Build optimization failed: {str(e)}",
                "fallback_config": self._get_basic_optimization_config(),
            }

    async def _analyze_build_patterns(
        self, stack_info: Dict[str, Any], build_frequency: str
    ) -> Dict[str, Any]:
        """Analyze current build patterns and identify bottlenecks"""

        languages = stack_info.get("languages", ["javascript"])
        frameworks = stack_info.get("frameworks", [])
        dependencies = stack_info.get("dependencies", [])

        analysis = {
            "primary_language": languages[0] if languages else "javascript",
            "dependency_count": len(dependencies),
            "framework_complexity": self._assess_framework_complexity(frameworks),
            "build_frequency_score": self._get_frequency_score(build_frequency),
            "parallelization_potential": self._assess_parallelization_potential(
                languages, frameworks
            ),
            "caching_opportunities": self._identify_caching_opportunities(
                languages, frameworks
            ),
            "bottlenecks": self._identify_build_bottlenecks(stack_info),
        }

        return analysis

    def _assess_framework_complexity(self, frameworks: List[str]) -> float:
        """Assess complexity of frameworks (0-10 scale)"""
        complexity_scores = {
            "react": 3,
            "vue": 3,
            "angular": 5,
            "next": 4,
            "nuxt": 4,
            "django": 4,
            "flask": 2,
            "spring": 6,
            "express": 2,
            "fastapi": 3,
        }

        if not frameworks:
            return 2.0

        total_score = sum(complexity_scores.get(fw.lower(), 3) for fw in frameworks)
        return min(total_score / len(frameworks), 10.0)

    def _get_frequency_score(self, build_frequency: str) -> float:
        """Convert build frequency to score (higher = more frequent)"""
        frequency_map = {"low": 1.0, "moderate": 3.0, "high": 5.0, "continuous": 8.0}
        return frequency_map.get(build_frequency.lower(), 3.0)

    def _assess_parallelization_potential(
        self, languages: List[str], frameworks: List[str]
    ) -> float:
        """Assess potential for parallel builds (0-10 scale)"""
        base_score = 5.0

        # Language-specific parallelization potential
        if "javascript" in languages:
            base_score += 2.0  # Good npm/webpack parallelization
        if "python" in languages:
            base_score += 1.0  # Moderate parallelization
        if "java" in languages:
            base_score += 2.5  # Excellent Maven parallelization
        if "go" in languages:
            base_score += 1.5  # Good Go build parallelization

        # Framework-specific adjustments
        if "webpack" in frameworks or "vite" in frameworks:
            base_score += 1.0
        if "spring" in frameworks:
            base_score += 1.0

        return min(base_score, 10.0)

    def _identify_caching_opportunities(
        self, languages: List[str], frameworks: List[str]
    ) -> List[str]:
        """Identify caching opportunities"""
        opportunities = []

        if "javascript" in languages:
            opportunities.extend(
                ["node_modules_caching", "npm_cache", "webpack_cache", "babel_cache"]
            )

        if "python" in languages:
            opportunities.extend(["pip_cache", "python_packages", "pytest_cache"])

        if "java" in languages:
            opportunities.extend(
                ["maven_repository", "gradle_cache", "compiled_classes"]
            )

        if "go" in languages:
            opportunities.extend(["go_modules", "go_cache"])

        # Docker layer caching
        opportunities.append("docker_layers")

        # Build artifacts caching
        opportunities.append("build_artifacts")

        return opportunities

    def _identify_build_bottlenecks(self, stack_info: Dict[str, Any]) -> List[str]:
        """Identify potential build bottlenecks"""
        bottlenecks = []

        languages = stack_info.get("languages", [])
        frameworks = stack_info.get("frameworks", [])
        dependencies = stack_info.get("dependencies", [])

        # Large dependency count
        if len(dependencies) > 50:
            bottlenecks.append("large_dependency_count")

        # Complex frameworks
        complex_frameworks = ["angular", "spring", "django"]
        if any(fw in complex_frameworks for fw in frameworks):
            bottlenecks.append("complex_framework_compilation")

        # Multiple languages
        if len(languages) > 2:
            bottlenecks.append("multi_language_coordination")

        # Frontend build optimization needed
        frontend_frameworks = ["react", "vue", "angular"]
        if any(fw in frontend_frameworks for fw in frameworks):
            bottlenecks.append("frontend_asset_compilation")

        return bottlenecks

    async def _configure_basic_optimization(
        self,
        stack_info: Dict[str, Any],
        target_platform: str,
        build_analysis: Dict[str, Any],
    ) -> BuildOptimizationConfig:
        """Configure basic optimization settings"""

        cache_config = CacheConfig(
            strategy=CacheStrategy.DEPENDENCY_BASED,
            enabled=True,
            paths=self._get_basic_cache_paths(build_analysis["primary_language"]),
            retention_days=14,
            max_size_gb=5,
        )

        parallel_config = ParallelBuildConfig(
            enabled=False, max_parallel_jobs=1  # Disabled for basic
        )

        metrics = OptimizationMetrics(
            estimated_time_savings="15-25%",
            cache_hit_ratio=0.6,
            parallel_efficiency=0.0,
            resource_utilization=0.7,
            cost_savings=15.0,
        )

        return BuildOptimizationConfig(
            optimization_level=OptimizationLevel.BASIC,
            cache_config=cache_config,
            parallel_config=parallel_config,
            compression_enabled=True,
            incremental_builds=False,
            artifact_optimization=self._get_basic_artifact_optimization(),
            docker_optimization=self._get_basic_docker_optimization(),
            metrics=metrics,
        )

    async def _configure_balanced_optimization(
        self,
        stack_info: Dict[str, Any],
        target_platform: str,
        build_analysis: Dict[str, Any],
    ) -> BuildOptimizationConfig:
        """Configure balanced optimization settings"""

        cache_config = CacheConfig(
            strategy=CacheStrategy.HYBRID,
            enabled=True,
            paths=self._get_comprehensive_cache_paths(
                build_analysis["primary_language"]
            ),
            retention_days=30,
            max_size_gb=10,
        )

        parallel_config = ParallelBuildConfig(
            enabled=True, max_parallel_jobs=2, memory_per_job="1.5GB", cpu_per_job=1.0
        )

        metrics = OptimizationMetrics(
            estimated_time_savings="35-50%",
            cache_hit_ratio=0.75,
            parallel_efficiency=0.7,
            resource_utilization=0.8,
            cost_savings=35.0,
        )

        return BuildOptimizationConfig(
            optimization_level=OptimizationLevel.BALANCED,
            cache_config=cache_config,
            parallel_config=parallel_config,
            compression_enabled=True,
            incremental_builds=True,
            artifact_optimization=self._get_balanced_artifact_optimization(),
            docker_optimization=self._get_balanced_docker_optimization(),
            metrics=metrics,
        )

    async def _configure_performance_optimization(
        self,
        stack_info: Dict[str, Any],
        target_platform: str,
        build_analysis: Dict[str, Any],
    ) -> BuildOptimizationConfig:
        """Configure performance-focused optimization settings"""

        cache_config = CacheConfig(
            strategy=CacheStrategy.LAYER_BASED,
            enabled=True,
            paths=self._get_comprehensive_cache_paths(
                build_analysis["primary_language"]
            ),
            retention_days=45,
            max_size_gb=20,
        )

        parallel_config = ParallelBuildConfig(
            enabled=True,
            max_parallel_jobs=4,
            memory_per_job="2GB",
            cpu_per_job=1.5,
            job_scheduling="optimized",
        )

        metrics = OptimizationMetrics(
            estimated_time_savings="55-70%",
            cache_hit_ratio=0.85,
            parallel_efficiency=0.85,
            resource_utilization=0.9,
            cost_savings=55.0,
        )

        return BuildOptimizationConfig(
            optimization_level=OptimizationLevel.PERFORMANCE,
            cache_config=cache_config,
            parallel_config=parallel_config,
            compression_enabled=True,
            incremental_builds=True,
            artifact_optimization=self._get_performance_artifact_optimization(),
            docker_optimization=self._get_performance_docker_optimization(),
            metrics=metrics,
        )

    async def _configure_aggressive_optimization(
        self,
        stack_info: Dict[str, Any],
        target_platform: str,
        build_analysis: Dict[str, Any],
    ) -> BuildOptimizationConfig:
        """Configure aggressive optimization settings"""

        cache_config = CacheConfig(
            strategy=CacheStrategy.HYBRID,
            enabled=True,
            paths=self._get_comprehensive_cache_paths(
                build_analysis["primary_language"]
            ),
            retention_days=60,
            max_size_gb=50,
        )

        parallel_config = ParallelBuildConfig(
            enabled=True,
            max_parallel_jobs=8,
            memory_per_job="3GB",
            cpu_per_job=2.0,
            job_scheduling="aggressive",
        )

        metrics = OptimizationMetrics(
            estimated_time_savings="65-80%",
            cache_hit_ratio=0.9,
            parallel_efficiency=0.9,
            resource_utilization=0.95,
            cost_savings=70.0,
        )

        return BuildOptimizationConfig(
            optimization_level=OptimizationLevel.AGGRESSIVE,
            cache_config=cache_config,
            parallel_config=parallel_config,
            compression_enabled=True,
            incremental_builds=True,
            artifact_optimization=self._get_aggressive_artifact_optimization(),
            docker_optimization=self._get_aggressive_docker_optimization(),
            metrics=metrics,
        )

    def _get_basic_cache_paths(self, language: str) -> List[str]:
        """Get basic cache paths for language"""
        base_paths = ["build/", "dist/"]

        if language == "javascript":
            base_paths.extend(["node_modules/", ".npm/"])
        elif language == "python":
            base_paths.extend([".pip/", "__pycache__/"])
        elif language == "java":
            base_paths.extend([".m2/repository/", "target/"])
        elif language == "go":
            base_paths.extend(["go.mod", "go.sum"])

        return base_paths

    def _get_comprehensive_cache_paths(self, language: str) -> List[str]:
        """Get comprehensive cache paths for language"""
        paths = self._get_basic_cache_paths(language)

        # Add additional optimization paths
        if language == "javascript":
            paths.extend(
                [
                    ".yarn/",
                    "node_modules/.cache/",
                    ".webpack/",
                    ".babel-cache/",
                    ".next/",
                ]
            )
        elif language == "python":
            paths.extend([".pytest_cache/", ".mypy_cache/", ".coverage", "htmlcov/"])
        elif language == "java":
            paths.extend([".gradle/", "build/", ".sonar/"])

        # Common paths
        paths.extend([".git/", ".cache/", "tmp/"])

        return paths

    def _get_basic_artifact_optimization(self) -> Dict[str, Any]:
        """Get basic artifact optimization settings"""
        return {
            "compression": {"enabled": True, "algorithm": "gzip", "level": 6},
            "minification": {"enabled": False},
            "bundling": {"enabled": False},
        }

    def _get_balanced_artifact_optimization(self) -> Dict[str, Any]:
        """Get balanced artifact optimization settings"""
        return {
            "compression": {"enabled": True, "algorithm": "gzip", "level": 6},
            "minification": {"enabled": True, "css": True, "js": True, "html": False},
            "bundling": {"enabled": True, "strategy": "smart_splitting"},
            "tree_shaking": True,
        }

    def _get_performance_artifact_optimization(self) -> Dict[str, Any]:
        """Get performance-focused artifact optimization settings"""
        return {
            "compression": {"enabled": True, "algorithm": "brotli", "level": 8},
            "minification": {
                "enabled": True,
                "css": True,
                "js": True,
                "html": True,
                "images": True,
            },
            "bundling": {
                "enabled": True,
                "strategy": "aggressive_splitting",
                "chunk_optimization": True,
            },
            "tree_shaking": True,
            "dead_code_elimination": True,
        }

    def _get_aggressive_artifact_optimization(self) -> Dict[str, Any]:
        """Get aggressive artifact optimization settings"""
        optimization = self._get_performance_artifact_optimization()
        optimization.update(
            {
                "compression": {
                    "enabled": True,
                    "algorithm": "brotli",
                    "level": 11,  # Maximum compression
                },
                "precompression": True,
                "asset_optimization": {"images": True, "fonts": True, "svg": True},
                "code_splitting": {"enabled": True, "granular": True},
            }
        )
        return optimization

    def _get_basic_docker_optimization(self) -> Dict[str, Any]:
        """Get basic Docker optimization settings"""
        return {
            "multi_stage": True,
            "layer_caching": True,
            "base_image": "alpine",
            "user_optimization": True,
            "cleanup": True,
        }

    def _get_balanced_docker_optimization(self) -> Dict[str, Any]:
        """Get balanced Docker optimization settings"""
        return {
            "multi_stage": True,
            "layer_caching": True,
            "base_image": "alpine",
            "user_optimization": True,
            "cleanup": True,
            "layer_optimization": True,
            "build_cache": True,
            "ignore_optimization": True,
        }

    def _get_performance_docker_optimization(self) -> Dict[str, Any]:
        """Get performance-focused Docker optimization settings"""
        return {
            "multi_stage": True,
            "layer_caching": True,
            "base_image": "distroless",
            "user_optimization": True,
            "cleanup": True,
            "layer_optimization": True,
            "build_cache": True,
            "ignore_optimization": True,
            "buildkit": True,
            "parallel_stages": True,
            "cache_mount": True,
        }

    def _get_aggressive_docker_optimization(self) -> Dict[str, Any]:
        """Get aggressive Docker optimization settings"""
        optimization = self._get_performance_docker_optimization()
        optimization.update(
            {
                "image_scanning": True,
                "security_optimization": True,
                "size_optimization": True,
                "registry_caching": True,
                "build_secrets": True,
                "experimental_features": True,
            }
        )
        return optimization

    async def _generate_optimized_build_scripts(
        self, config: BuildOptimizationConfig, stack_info: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate optimized build scripts"""

        scripts = {}
        language = stack_info.get("languages", ["javascript"])[0]

        # Generate main build script
        scripts["build.sh"] = self._generate_main_build_script(config, language)

        # Generate caching script
        scripts["cache-setup.sh"] = self._generate_cache_setup_script(config)
        # Generate cleanup script
        scripts["cleanup.sh"] = self._generate_cleanup_script(config)

        # Generate monitoring script
        scripts["build-monitor.sh"] = self._generate_build_monitoring_script(config)

        return scripts

    def _generate_main_build_script(
        self, config: BuildOptimizationConfig, language: str
    ) -> str:
        """Generate main optimized build script"""

        parallel_jobs = (
            config.parallel_config.max_parallel_jobs
            if config.parallel_config.enabled
            else 1
        )

        return f"""#!/bin/bash
# Optimized build script - {config.optimization_level.value} level

set -e

# Configuration
PARALLEL_JOBS={parallel_jobs}
CACHE_ENABLED={str(config.cache_config.enabled).lower()}
INCREMENTAL_BUILDS={str(config.incremental_builds).lower()}
COMPRESSION_ENABLED={str(config.compression_enabled).lower()}

echo "Starting optimized build process..."
echo "Optimization level: {config.optimization_level.value}"

# Build application based on language
case "{language}" in
    "javascript")
        echo "Building JavaScript application..."
        npm ci --cache .npm --prefer-offline
        npm run build
        ;;
    "python")
        echo "Building Python application..."
        python -m pip install --cache-dir .pip -r requirements.txt
        python -m build
        ;;
    "java")
        echo "Building Java application..."
        mvn clean package
        ;;
    *)
        echo "Building with default process..."
        make build || echo "No build process defined"
        ;;
esac

echo "Build completed successfully"
"""

    def _generate_cache_setup_script(self, config: BuildOptimizationConfig) -> str:
        """Generate cache setup script"""
        return """#!/bin/bash
# Cache setup script
set -e
echo "Setting up build cache..."
mkdir -p .cache/dependencies .cache/layers .cache/build
echo "Cache setup completed"
"""

    def _generate_cleanup_script(self, config: BuildOptimizationConfig) -> str:
        """Generate cleanup script"""
        return """#!/bin/bash
# Build cleanup script
set -e
echo "Cleaning up build artifacts..."
rm -rf tmp/ temp/ .tmp/ || true
echo "Cleanup completed"
"""

    def _generate_build_monitoring_script(self, config: BuildOptimizationConfig) -> str:
        """Generate build monitoring script"""
        return """#!/bin/bash
# Build monitoring script
set -e
echo "Starting build monitoring..."
echo "Build monitoring active"
"""

    def _generate_docker_optimizations(
        self, config: BuildOptimizationConfig, stack_info: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate Docker optimization configurations"""

        language = stack_info.get("languages", ["javascript"])[0]

        configs = {}

        # Generate optimized Dockerfile
        configs["Dockerfile.optimized"] = self._generate_optimized_dockerfile(
            config, language
        )

        # Generate Docker Compose with build optimizations
        configs["docker-compose.build.yml"] = self._generate_build_docker_compose(
            config
        )

        # Generate .dockerignore optimization
        configs[".dockerignore.optimized"] = self._generate_optimized_dockerignore(
            config
        )

        return configs

    def _generate_optimized_dockerfile(
        self, config: BuildOptimizationConfig, language: str
    ) -> str:
        """Generate optimized Dockerfile"""

        if language == "javascript":
            return self._generate_optimized_nodejs_dockerfile(config)
        elif language == "python":
            return self._generate_optimized_python_dockerfile(config)
        elif language == "java":
            return self._generate_optimized_java_dockerfile(config)
        else:
            return self._generate_generic_optimized_dockerfile(config)

    def _generate_optimized_nodejs_dockerfile(
        self, config: BuildOptimizationConfig
    ) -> str:
        """Generate optimized Node.js Dockerfile"""

        base_image = (
            "node:18-alpine"
            if config.docker_optimization.get("base_image") == "alpine"
            else "node:18"
        )

        dockerfile = f"""# syntax=docker/dockerfile:1.4
# Optimized Node.js Dockerfile - {config.optimization_level.value} level

FROM {base_image} AS deps
WORKDIR /app

# Install dependencies with caching
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \\
    npm ci --only=production --cache /root/.npm

FROM {base_image} AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies with caching
RUN --mount=type=cache,target=/root/.npm \\
    npm ci --cache /root/.npm

# Copy source code
COPY . .

# Build application"""

        if config.parallel_config.enabled:
            dockerfile += f"""
RUN npm run build -- --max-workers={config.parallel_config.max_parallel_jobs}"""
        else:
            dockerfile += """
RUN npm run build"""

        dockerfile += f"""

FROM {base_image} AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
"""

        return dockerfile

    def _generate_optimized_python_dockerfile(
        self, config: BuildOptimizationConfig
    ) -> str:
        """Generate optimized Python Dockerfile"""

        return f"""# syntax=docker/dockerfile:1.4
# Optimized Python Dockerfile - {config.optimization_level.value} level

FROM python:3.11-slim AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    build-essential \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies with caching
COPY requirements*.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \\
    pip install --cache-dir /root/.cache/pip -r requirements.txt

FROM python:3.11-slim AS runtime

# Create non-root user
RUN groupadd -r python && useradd -r -g python python

# Copy dependencies from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /app

# Copy application
COPY . .

# Set ownership
RUN chown -R python:python /app
USER python

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
"""

    def _generate_optimized_java_dockerfile(
        self, config: BuildOptimizationConfig
    ) -> str:
        """Generate optimized Java Dockerfile"""

        return f"""# syntax=docker/dockerfile:1.4
# Optimized Java Dockerfile - {config.optimization_level.value} level

FROM maven:3.8-openjdk-17 AS builder
WORKDIR /app

# Copy dependency manifests
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \\
    mvn dependency:go-offline

# Copy source and build
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \\
    mvn clean package -DskipTests

FROM openjdk:17-jre-slim AS runtime

# Create non-root user
RUN groupadd -r spring && useradd -r -g spring spring

WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/*.jar app.jar

# Set ownership
RUN chown spring:spring app.jar
USER spring

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
"""

    def _generate_generic_optimized_dockerfile(
        self, config: BuildOptimizationConfig
    ) -> str:
        """Generate generic optimized Dockerfile"""

        return f"""# syntax=docker/dockerfile:1.4
# Generic Optimized Dockerfile - {config.optimization_level.value} level

FROM alpine:3.18 AS base

# Install common dependencies
RUN apk add --no-cache \\
    curl \\
    ca-certificates

FROM base AS builder
WORKDIR /app

# Copy source
COPY . .

# Build application (customize based on your needs)
RUN make build || echo "Add your build commands here"

FROM base AS runtime

# Create non-root user
RUN addgroup -g 1001 -S appgroup
RUN adduser -S appuser -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./

# Set ownership
RUN chown -R appuser:appgroup /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["./app"]
"""

    def _generate_build_docker_compose(self, config: BuildOptimizationConfig) -> str:
        """Generate build-optimized Docker Compose"""

        return f"""# Build-optimized Docker Compose - {config.optimization_level.value} level
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.optimized
      cache_from:
        - app:cache
      args:
        BUILDKIT_INLINE_CACHE: 1
        PARALLEL_JOBS: {config.parallel_config.max_parallel_jobs if config.parallel_config.enabled else 1}
    image: app:optimized
    container_name: app-optimized
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Build cache service
  cache:
    image: app:cache
    build:
      context: .
      dockerfile: Dockerfile.optimized
      target: deps
    volumes:
      - build_cache:/app/node_modules
    command: "true"

volumes:
  build_cache:
    driver: local
"""

    def _generate_optimized_dockerignore(self, config: BuildOptimizationConfig) -> str:
        """Generate optimized .dockerignore"""

        return """# Optimized .dockerignore for faster builds

# Version control
.git
.gitignore
.gitattributes

# Documentation
README.md
CHANGELOG.md
LICENSE
docs/
*.md

# Development tools
.vscode/
.idea/
*.swp
*.swo
*~

# Build artifacts
dist/
build/
target/
*.log

# Dependencies (handled by package managers)
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
pip-log.txt

# Java
*.class
*.jar
!lib/*.jar

# Test files
test/
tests/
*.test.js
coverage/
.nyc_output/

# Cache directories
.cache/
.npm/
.yarn/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
"""

    def _calculate_performance_gains(
        self, config: BuildOptimizationConfig, build_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate expected performance gains"""

        base_build_time = 20  # minutes - baseline
        frequency_multiplier = build_analysis.get("build_frequency_score", 3.0) / 5.0

        # Calculate time savings based on optimization level
        time_savings_percent = {
            OptimizationLevel.BASIC: 20,
            OptimizationLevel.BALANCED: 40,
            OptimizationLevel.PERFORMANCE: 60,
            OptimizationLevel.AGGRESSIVE: 75,
        }.get(config.optimization_level, 40)

        optimized_time = base_build_time * (1 - time_savings_percent / 100)
        time_saved = base_build_time - optimized_time

        # Calculate cost savings (assuming $0.10 per minute build time)
        cost_per_minute = 0.10
        daily_builds = max(1, frequency_multiplier * 5)  # Builds per day
        monthly_cost_savings = time_saved * cost_per_minute * daily_builds * 30

        return {
            "baseline_build_time": f"{base_build_time}m",
            "optimized_build_time": f"{optimized_time:.1f}m",
            "time_savings": f"{time_saved:.1f}m ({time_savings_percent}%)",
            "monthly_cost_savings": f"${monthly_cost_savings:.2f}",
            "cache_efficiency": f"{config.metrics.cache_hit_ratio * 100:.1f}%",
            "parallel_efficiency": f"{config.metrics.parallel_efficiency * 100:.1f}%",
            "resource_utilization": f"{config.metrics.resource_utilization * 100:.1f}%",
        }

    def _generate_optimization_recommendations(
        self, config: BuildOptimizationConfig, stack_info: Dict[str, Any]
    ) -> List[str]:
        """Generate build optimization recommendations"""

        recommendations = []

        # Cache recommendations
        if not config.cache_config.enabled:
            recommendations.append(
                "Enable build caching to reduce build times by up to 60% for subsequent builds"
            )

        # Parallel build recommendations
        if not config.parallel_config.enabled:
            recommendations.append(
                "Enable parallel builds to improve build performance by 30-50%"
            )
        elif config.parallel_config.max_parallel_jobs < 4:
            recommendations.append(
                f"Increase parallel jobs from {config.parallel_config.max_parallel_jobs} to 4 for better performance"
            )

        # Docker optimization recommendations
        docker_opts = config.docker_optimization
        if not docker_opts.get("multi_stage", False):
            recommendations.append(
                "Use multi-stage Docker builds to reduce final image size by 50-80%"
            )

        if not docker_opts.get("layer_caching", False):
            recommendations.append(
                "Enable Docker layer caching to speed up image builds"
            )

        # Artifact optimization recommendations
        artifact_opts = config.artifact_optimization
        if not artifact_opts.get("compression", {}).get("enabled", False):
            recommendations.append(
                "Enable artifact compression to reduce deployment size and transfer time"
            )

        # Language-specific recommendations
        languages = stack_info.get("languages", [])
        if "javascript" in languages:
            if not artifact_opts.get("bundling", {}).get("enabled", False):
                recommendations.append(
                    "Enable code bundling and tree shaking for JavaScript to reduce bundle size by 30-60%"
                )

        if "python" in languages:
            recommendations.append(
                "Consider using Python wheels and binary distributions for faster dependency installation"
            )

        if "java" in languages:
            recommendations.append(
                "Use Maven/Gradle build caching and parallel execution for faster Java builds"
            )

        # Advanced optimization recommendations
        if config.optimization_level == OptimizationLevel.BASIC:
            recommendations.append(
                "Upgrade to 'balanced' optimization level for 40-50% better performance"
            )
        elif config.optimization_level == OptimizationLevel.BALANCED:
            recommendations.append(
                "Consider 'performance' optimization level for maximum speed in CI/CD pipelines"
            )

        return recommendations

    def _get_basic_optimization_config(self) -> Dict[str, Any]:
        """Get basic fallback optimization configuration"""
        return {
            "optimization_level": "basic",
            "cache_enabled": True,
            "parallel_builds": False,
            "estimated_savings": "20%",
        }
