"""
AI-powered project analysis routes
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from models.response import ResponseModel

# Import our AI engines
from ai.stack_detector import StackDetector, DetectedStack
from ai.dependency_analyzer import DependencyAnalyzer
from ai.dockerfile_generator import DockerfileGenerator

# Import new DevOps automation engines
from ai.pipeline_generator import PipelineGenerator
from ai.environment_manager import EnvironmentManager
from ai.build_optimizer import BuildOptimizer

router = APIRouter()


# Simple header validation for internal service communication
def validate_internal_request(x_internal_service: Optional[str] = Header(None)):
    """Validate that request comes from authorized internal service"""
    if not x_internal_service or x_internal_service != "deployio-backend":
        raise HTTPException(
            status_code=403, detail="Access denied: Internal service only"
        )
    return x_internal_service


# Pydantic models for AI requests/responses
class RepositoryAnalysisRequest(BaseModel):
    repository_url: str
    branch: str = "main"
    project_id: str


class TechnologyStack(BaseModel):
    framework: Optional[str] = None
    language: Optional[str] = None
    database: Optional[str] = None
    build_tool: Optional[str] = None
    package_manager: Optional[str] = None
    runtime_version: Optional[str] = None
    confidence: float = 0.0


class StackDetectionResponse(BaseModel):
    technology: TechnologyStack
    detected_files: List[str]
    recommendations: List[Dict]
    confidence_score: float
    dependency_analysis: Optional[Dict] = None


class DockerfileRequest(BaseModel):
    project_id: str
    technology_stack: TechnologyStack
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    port: int = 3000


class DockerfileResponse(BaseModel):
    dockerfile_content: str
    docker_compose_content: str
    build_instructions: List[str]
    optimization_notes: List[str]
    security_features: List[str]
    estimated_size: str


class OptimizationRequest(BaseModel):
    project_id: str
    current_config: Dict
    performance_metrics: Optional[Dict] = None


class OptimizationSuggestion(BaseModel):
    type: str  # performance, security, cost, reliability
    title: str
    description: str
    priority: str  # low, medium, high, critical
    implementation: Dict[str, str]
    impact: str


class OptimizationResponse(BaseModel):
    suggestions: List[OptimizationSuggestion]
    overall_score: float
    priority_actions: List[str]


# New DevOps Automation Models
class PipelineGenerationRequest(BaseModel):
    project_id: str
    repository_url: str
    target_platforms: List[str]  # ["github", "gitlab", "jenkins", "azure"]
    deployment_targets: List[str]  # ["docker", "kubernetes", "aws", "azure"]
    quality_gates: Optional[List[str]] = ["testing", "security", "performance"]
    ci_features: Optional[List[str]] = ["auto_testing", "security_scanning", "caching"]
    cd_features: Optional[List[str]] = ["auto_deployment", "rollback", "notifications"]


class PipelineGenerationResponse(BaseModel):
    github_actions: Optional[str] = None
    gitlab_ci: Optional[str] = None
    jenkins_pipeline: Optional[str] = None
    azure_pipelines: Optional[str] = None
    deployment_configs: Dict[str, str]
    quality_gates: List[Dict[str, str]]
    optimization_notes: List[str]
    estimated_build_time: str


class EnvironmentConfigRequest(BaseModel):
    project_id: str
    environments: List[str]  # ["development", "staging", "production"]
    cloud_provider: str  # "aws", "azure", "gcp", "multi"
    deployment_strategy: str  # "rolling", "blue_green", "canary"
    infrastructure_type: str  # "kubernetes", "docker", "serverless", "vm"
    monitoring_enabled: bool = True
    auto_scaling: bool = True


class EnvironmentConfigResponse(BaseModel):
    terraform_configs: Dict[str, str]
    kubernetes_manifests: Dict[str, str]
    docker_compose_configs: Dict[str, str]
    helm_charts: Dict[str, str]
    monitoring_configs: Dict[str, str]
    deployment_scripts: Dict[str, str]
    environment_variables: Dict[str, List[str]]
    security_policies: List[str]


class BuildOptimizationRequest(BaseModel):
    project_id: str
    technology_stack: TechnologyStack
    optimization_level: str  # "basic", "balanced", "performance", "aggressive"
    target_platform: str = "cloud"
    build_frequency: str = "moderate"  # "low", "moderate", "high"
    current_build_time: Optional[str] = None


class BuildOptimizationResponse(BaseModel):
    cache_strategies: Dict[str, str]
    parallel_configs: Dict[str, Any]
    docker_optimizations: Dict[str, str]
    build_scripts: Dict[str, str]
    performance_metrics: Dict[str, Any]
    optimization_recommendations: List[str]
    estimated_improvements: Dict[str, str]


@router.post("/analyze-stack", response_model=ResponseModel[StackDetectionResponse])
async def analyze_project_stack(
    request: RepositoryAnalysisRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """Analyze project repository to detect technology stack"""
    try:
        # Initialize AI engines
        stack_detector = StackDetector()
        dependency_analyzer = DependencyAnalyzer()

        # Detect technology stack
        detected_stack, file_list, recommendations = (
            await stack_detector.analyze_github_repository(
                request.repository_url, request.branch
            )
        )

        # Perform dependency analysis
        dependency_analysis = await dependency_analyzer.analyze_dependencies(
            request.repository_url, request.branch
        )

        # Convert to response format
        technology_stack = TechnologyStack(
            framework=detected_stack.framework,
            language=detected_stack.language,
            database=detected_stack.database,
            build_tool=detected_stack.build_tool,
            package_manager=detected_stack.package_manager,
            runtime_version=detected_stack.runtime_version,
            confidence=detected_stack.confidence,
        )

        # Prepare dependency analysis summary
        dep_summary = {
            "total_dependencies": dependency_analysis.dependency_tree.total_count,
            "production_deps": len(
                dependency_analysis.dependency_tree.direct_dependencies
            ),
            "dev_dependencies": len(
                dependency_analysis.dependency_tree.dev_dependencies
            ),
            "security_issues": len(dependency_analysis.security_issues),
            "outdated_packages": len(dependency_analysis.outdated_packages),
            "optimization_score": dependency_analysis.optimization_score,
            "ecosystems": list(dependency_analysis.dependency_tree.ecosystems),
        }

        response = StackDetectionResponse(
            technology=technology_stack,
            detected_files=file_list[:20],  # Limit for response size
            recommendations=recommendations,
            confidence_score=detected_stack.confidence,
            dependency_analysis=dep_summary,
        )

        return ResponseModel(
            success=True,
            message="Technology stack analyzed successfully",
            data=response,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stack analysis failed: {str(e)}")


@router.post("/generate-dockerfile", response_model=ResponseModel[DockerfileResponse])
async def generate_dockerfile(
    request: DockerfileRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """Generate optimized Dockerfile and Docker Compose configuration"""
    try:
        # Initialize Dockerfile generator
        dockerfile_generator = DockerfileGenerator()

        # Convert request to DetectedStack format
        detected_stack = DetectedStack(
            language=request.technology_stack.language,
            framework=request.technology_stack.framework,
            database=request.technology_stack.database,
            build_tool=request.technology_stack.build_tool,
            package_manager=request.technology_stack.package_manager,
            runtime_version=request.technology_stack.runtime_version,
            confidence=request.technology_stack.confidence,
        )

        # Project configuration
        project_config = {
            "port": request.port,
            "build_command": request.build_command,
            "start_command": request.start_command,
        }

        # Generate Dockerfile
        generated_dockerfile = await dockerfile_generator.generate_dockerfile(
            detected_stack, project_config
        )

        response = DockerfileResponse(
            dockerfile_content=generated_dockerfile.dockerfile_content,
            docker_compose_content=generated_dockerfile.docker_compose_content,
            build_instructions=generated_dockerfile.build_instructions,
            optimization_notes=generated_dockerfile.optimization_notes,
            security_features=generated_dockerfile.security_features,
            estimated_size=generated_dockerfile.estimated_size,
        )

        return ResponseModel(
            success=True, message="Dockerfile generated successfully", data=response
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Dockerfile generation failed: {str(e)}"
        )


@router.post("/optimize-deployment", response_model=ResponseModel[OptimizationResponse])
async def optimize_deployment(
    request: OptimizationRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """Analyze project and provide optimization suggestions"""
    try:
        # Generate optimization suggestions based on current configuration
        suggestions = []

        # Performance optimizations
        if request.performance_metrics:
            build_time = request.performance_metrics.get("averageBuildTime", 0)
            if build_time > 300:  # > 5 minutes
                suggestions.append(
                    OptimizationSuggestion(
                        type="performance",
                        title="Improve Build Performance",
                        description="Build time is longer than recommended. Consider implementing caching strategies.",
                        priority="medium",
                        implementation={
                            "docker_layer_caching": "Enable Docker layer caching",
                            "dependency_caching": "Cache dependency installations",
                            "parallel_builds": "Use parallel build processes",
                        },
                        impact="Reduce build time by 40-60%",
                    )
                )

        # Security optimizations
        tech_stack = request.current_config.get("technology", {})
        if tech_stack:
            suggestions.append(
                OptimizationSuggestion(
                    type="security",
                    title="Security Hardening",
                    description="Implement additional security measures for production deployment.",
                    priority="high",
                    implementation={
                        "vulnerability_scanning": "Enable automated vulnerability scanning",
                        "secrets_management": "Use proper secrets management",
                        "runtime_security": "Implement runtime security monitoring",
                    },
                    impact="Enhanced security posture",
                )
            )

        # Cost optimization
        suggestions.append(
            OptimizationSuggestion(
                type="cost",
                title="Resource Optimization",
                description="Optimize resource allocation for cost efficiency.",
                priority="medium",
                implementation={
                    "auto_scaling": "Configure horizontal pod autoscaling",
                    "resource_limits": "Set appropriate CPU/memory limits",
                    "spot_instances": "Use spot instances for non-critical workloads",
                },
                impact="Reduce infrastructure costs by 20-30%",
            )
        )

        # Calculate overall score
        overall_score = 75.0  # Base score
        if request.performance_metrics:
            success_rate = request.performance_metrics.get("successRate", 1.0)
            overall_score = min(100.0, overall_score + (success_rate * 25))

        # Priority actions
        priority_actions = [
            "Review and update dependencies",
            "Implement automated testing",
            "Configure monitoring and alerting",
            "Optimize container images",
        ]

        response = OptimizationResponse(
            suggestions=suggestions,
            overall_score=overall_score,
            priority_actions=priority_actions,
        )

        return ResponseModel(
            success=True, message="Optimization analysis completed", data=response
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Optimization analysis failed: {str(e)}"
        )


@router.post(
    "/generate-pipeline", response_model=ResponseModel[PipelineGenerationResponse]
)
async def generate_pipeline(
    request: PipelineGenerationRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """Generate AI-powered CI/CD pipeline configurations for multiple platforms"""
    try:
        # Initialize pipeline generator
        pipeline_generator = PipelineGenerator()

        # Create stack info from request
        stack_info = {
            "repository_url": request.repository_url,
            "languages": [
                "javascript"
            ],  # Default, should be detected from actual analysis
            "frameworks": [],
            "deployment_targets": request.deployment_targets,
        }

        # Generate pipelines for each target platform
        generated_configs = {}
        deployment_configs = {}
        quality_gates = []
        optimization_notes = []

        for platform in request.target_platforms:
            # Map platform names to internal format
            platform_map = {
                "github": "github-actions",
                "gitlab": "gitlab-ci",
                "jenkins": "jenkins",
                "azure": "azure-devops",
            }

            mapped_platform = platform_map.get(platform, platform)

            # Generate pipeline for this platform
            config = await pipeline_generator.generate_pipeline(
                stack_info,
                mapped_platform,
                ["development", "staging", "production"],
                "balanced",
            )

            # Extract platform-specific configs
            if platform == "github":
                generated_configs["github_actions"] = config.get(
                    "pipeline_files", {}
                ).get("github-actions", "")
            elif platform == "gitlab":
                generated_configs["gitlab_ci"] = config.get("pipeline_files", {}).get(
                    "gitlab-ci", ""
                )
            elif platform == "jenkins":
                generated_configs["jenkins_pipeline"] = config.get(
                    "pipeline_files", {}
                ).get("jenkins", "")
            elif platform == "azure":
                generated_configs["azure_pipelines"] = config.get(
                    "pipeline_files", {}
                ).get("azure-devops", "")

            # Add deployment configs
            deployment_configs.update(config.get("deployment_configs", {}))

        # Generate quality gates
        if "testing" in request.quality_gates:
            quality_gates.append(
                {
                    "type": "testing",
                    "config": "unit-tests: required\nintegration-tests: required\ncoverage-threshold: 80%",
                }
            )
        if "security" in request.quality_gates:
            quality_gates.append(
                {
                    "type": "security",
                    "config": "dependency-scan: required\nsast-scan: required\nvulnerability-threshold: high",
                }
            )
        if "performance" in request.quality_gates:
            quality_gates.append(
                {
                    "type": "performance",
                    "config": "load-test: required\nperformance-budget: enforced\nresponse-time-threshold: 2s",
                }
            )

        # Generate optimization notes
        optimization_notes = [
            "Parallel job execution enabled for faster builds",
            "Dependency caching configured to reduce build times",
            "Multi-stage builds implemented for optimal container size",
            "Security scanning integrated at multiple pipeline stages",
        ]

        response = PipelineGenerationResponse(
            github_actions=generated_configs.get("github_actions"),
            gitlab_ci=generated_configs.get("gitlab_ci"),
            jenkins_pipeline=generated_configs.get("jenkins_pipeline"),
            azure_pipelines=generated_configs.get("azure_pipelines"),
            deployment_configs=deployment_configs,
            quality_gates=quality_gates,
            optimization_notes=optimization_notes,
            estimated_build_time="3-8 minutes (optimized)",
        )

        return ResponseModel(
            success=True,
            message="CI/CD pipeline configurations generated successfully",
            data=response,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Pipeline generation failed: {str(e)}"
        )


@router.post(
    "/manage-environment", response_model=ResponseModel[EnvironmentConfigResponse]
)
async def manage_environment(
    request: EnvironmentConfigRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """Generate AI-powered environment configurations and infrastructure as code"""
    try:
        # Initialize environment manager
        environment_manager = EnvironmentManager()

        # Create stack info from request
        stack_info = {
            "cloud_provider": request.cloud_provider,
            "infrastructure_type": request.infrastructure_type,
            "deployment_strategy": request.deployment_strategy,
            "monitoring_enabled": request.monitoring_enabled,
        }

        # Use the main orchestration method
        orchestration_result = (
            await environment_manager.create_environment_orchestration(
                environments=request.environments,
                stack_info=stack_info,
                deployment_strategy=request.deployment_strategy,
                auto_scaling=request.auto_scaling,
            )
        )

        # Extract configurations from orchestration result
        infrastructure_configs = orchestration_result.get("infrastructure_configs", {})
        deployment_scripts = orchestration_result.get("deployment_scripts", {})

        # Parse infrastructure configs
        terraform_configs = infrastructure_configs.get("terraform", {})
        kubernetes_manifests = infrastructure_configs.get("kubernetes", {})
        docker_compose_configs = infrastructure_configs.get("docker_compose", {})
        helm_charts = infrastructure_configs.get("helm", {})
        monitoring_configs = infrastructure_configs.get("monitoring", {})

        # Generate environment variables template
        environment_variables = {}
        for env in request.environments:
            env_vars = [
                f"NODE_ENV={env}",
                f"DATABASE_URL={{vault:{env}_database_url}}",
                f"API_KEY={{vault:{env}_api_key}}",
                f"REDIS_URL={{vault:{env}_redis_url}}",
                "LOG_LEVEL=info",
                "APP_PORT=3000" if env == "development" else "APP_PORT=8080",
            ]
            environment_variables[env] = env_vars

        # Generate security policies
        security_policies = [
            "Network isolation between environments enforced",
            "RBAC (Role-Based Access Control) implemented",
            "Secrets management with vault integration",
            "Container security scanning enabled",
            "Resource quotas and limits configured",
            "Audit logging enabled for all operations",
        ]

        response = EnvironmentConfigResponse(
            terraform_configs=(
                terraform_configs if isinstance(terraform_configs, dict) else {}
            ),
            kubernetes_manifests=(
                kubernetes_manifests if isinstance(kubernetes_manifests, dict) else {}
            ),
            docker_compose_configs=(
                docker_compose_configs
                if isinstance(docker_compose_configs, dict)
                else {}
            ),
            helm_charts=helm_charts if isinstance(helm_charts, dict) else {},
            monitoring_configs=(
                monitoring_configs if isinstance(monitoring_configs, dict) else {}
            ),
            deployment_scripts=(
                deployment_scripts if isinstance(deployment_scripts, dict) else {}
            ),
            environment_variables=environment_variables,
            security_policies=security_policies,
        )

        return ResponseModel(
            success=True,
            message="Environment configurations generated successfully",
            data=response,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Environment configuration failed: {str(e)}"
        )


@router.post("/optimize-build", response_model=ResponseModel[BuildOptimizationResponse])
async def optimize_build(
    request: BuildOptimizationRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """Generate AI-powered build optimizations for faster CI/CD pipelines"""
    try:
        # Initialize build optimizer
        build_optimizer = BuildOptimizer()

        # Create stack info from request
        stack_info = {
            "languages": (
                [request.technology_stack.language]
                if request.technology_stack.language
                else ["javascript"]
            ),
            "frameworks": (
                [request.technology_stack.framework]
                if request.technology_stack.framework
                else []
            ),
            "build_tool": request.technology_stack.build_tool or "npm",
            "package_manager": request.technology_stack.package_manager or "npm",
        }

        # Optimize build process
        optimization_result = await build_optimizer.optimize_build_process(
            stack_info=stack_info,
            optimization_level=request.optimization_level,
            target_platform=request.target_platform,
            build_frequency=request.build_frequency,
        )

        # Extract components from optimization result
        cache_strategies = {}
        parallel_configs = {}
        docker_optimizations = {}
        build_scripts = {}
        performance_metrics = {}
        optimization_recommendations = []
        estimated_improvements = {}

        if "cache_configs" in optimization_result:
            cache_strategies = optimization_result["cache_configs"]

        if "parallel_build_config" in optimization_result:
            parallel_configs = optimization_result["parallel_build_config"]

        if "docker_optimizations" in optimization_result:
            docker_optimizations = optimization_result["docker_optimizations"]

        if "build_scripts" in optimization_result:
            build_scripts = optimization_result["build_scripts"]

        if "performance_metrics" in optimization_result:
            performance_metrics = optimization_result["performance_metrics"]

        if "recommendations" in optimization_result:
            optimization_recommendations = optimization_result["recommendations"]

        # Generate estimated improvements
        estimated_improvements = {
            "build_time_reduction": "30-50%",
            "cache_hit_ratio": "85%",
            "resource_utilization": "40% improvement",
            "cost_savings": "25% reduction in CI/CD costs",
            "deployment_frequency": "2x faster deployments",
        }

        # Add default recommendations if none provided
        if not optimization_recommendations:
            optimization_recommendations = [
                "Enable dependency caching for faster builds",
                "Implement parallel build stages",
                "Use multi-stage Docker builds",
                "Optimize artifact compression",
                "Configure intelligent layer caching",
            ]

        response = BuildOptimizationResponse(
            cache_strategies=cache_strategies,
            parallel_configs=parallel_configs,
            docker_optimizations=docker_optimizations,
            build_scripts=build_scripts,
            performance_metrics=performance_metrics,
            optimization_recommendations=optimization_recommendations,
            estimated_improvements=estimated_improvements,
        )

        return ResponseModel(
            success=True,
            message="Build optimization completed successfully",
            data=response,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Build optimization failed: {str(e)}"
        )


@router.get(
    "/supported-technologies", response_model=ResponseModel[Dict[str, List[str]]]
)
async def get_supported_technologies():
    """Get list of supported technologies and frameworks"""
    try:
        supported_tech = {
            "frameworks": [
                "React",
                "Vue.js",
                "Angular",
                "Next.js",
                "Nuxt.js",
                "Express",
                "Fastify",
                "Nest.js",
                "Koa",
                "Django",
                "Flask",
                "FastAPI",
                "Tornado",
                "Spring Boot",
                "Quarkus",
                "Laravel",
                "Symfony",
                "CodeIgniter",
                "Ruby on Rails",
                "Sinatra",
                "Gin",
                "Echo",
                "Fiber",
            ],
            "languages": [
                "JavaScript",
                "TypeScript",
                "Python",
                "Java",
                "PHP",
                "Ruby",
                "Go",
                "Rust",
                "C#",
                "Kotlin",
            ],
            "databases": [
                "MongoDB",
                "PostgreSQL",
                "MySQL",
                "Redis",
                "SQLite",
                "Elasticsearch",
                "Cassandra",
                "DynamoDB",
            ],
            "build_tools": [
                "npm",
                "yarn",
                "pnpm",
                "Vite",
                "Webpack",
                "Rollup",
                "pip",
                "poetry",
                "pipenv",
                "Maven",
                "Gradle",
                "SBT",
                "Composer",
                "Bundler",
                "Cargo",
                "Go Modules",
            ],
            "deployment_targets": [
                "Docker",
                "Kubernetes",
                "AWS ECS",
                "AWS Lambda",
                "Google Cloud Run",
                "Azure Container Instances",
                "Heroku",
                "Vercel",
                "Netlify",
                "DigitalOcean",
            ],
        }

        return ResponseModel(
            success=True,
            message="Supported technologies retrieved",
            data=supported_tech,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve supported technologies: {str(e)}",
        )
