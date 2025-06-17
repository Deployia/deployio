"""
AI-powered project analysis routes
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, List, Optional
from pydantic import BaseModel
from models.response import ResponseModel

# Import our AI engines
from ai.stack_detector import StackDetector, DetectedStack
from ai.dependency_analyzer import DependencyAnalyzer
from ai.dockerfile_generator import DockerfileGenerator

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
