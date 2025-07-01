"""
Generator Routes - Configuration generation endpoints
Provides intelligent deployment configuration generation based on analysis results
Includes: Dockerfile, docker-compose, CI/CD pipelines, and GitHub Actions
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import logging

from models.response import ResponseModel
from engines.generators.config_generator import ConfigurationGenerator
from engines.generators.dockerfile_generator import DockerfileGenerator
from engines.generators.pipeline_generator import PipelineGenerator
from engines.core.models import TechnologyStack
from engines.utils.validators import InputValidator

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize generators
config_generator = ConfigurationGenerator()
dockerfile_generator = DockerfileGenerator()
pipeline_generator = PipelineGenerator()
validator = InputValidator()


# Request Models
class GenerationFromAnalysisRequest(BaseModel):
    """Generate configurations from complete analysis results"""

    session_id: str
    analysis_result: Dict[str, Any]  # Complete analysis results from detector
    config_types: List[str]  # ["dockerfile", "github_actions", "docker_compose"]
    user_preferences: Optional[Dict[str, Any]] = None
    optimization_level: str = (
        "balanced"  # "basic", "balanced", "performance", "security"
    )


class GenerateConfigRequest(BaseModel):
    """Generate configurations from analysis results and repository data"""

    session_id: str
    repository_data: Dict[str, Any]  # Complete repository data from server
    analysis_results: Dict[str, Any]  # Results from analysis phase
    config_types: List[str]  # ["dockerfile", "github_actions", "docker_compose"]
    user_preferences: Optional[Dict[str, Any]] = None
    optimization_level: str = (
        "balanced"  # "basic", "balanced", "performance", "security"
    )


class OptimizationRequest(BaseModel):
    """Request optimizations based on current configurations"""

    session_id: str
    repository_data: Dict[str, Any]
    analysis_results: Dict[str, Any]
    current_configs: Dict[str, str]  # Current configuration files
    performance_metrics: Optional[Dict[str, Any]] = None
    optimization_goals: List[str] = ["performance", "security", "maintainability"]


class DockerfileRequest(BaseModel):
    """Generate Dockerfile from analysis results"""

    session_id: str
    repository_data: Dict[str, Any]  # Repository data from server
    analysis_results: Dict[str, Any]  # Technology stack from analysis
    optimization_level: str = "balanced"
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    port: Optional[int] = None  # Auto-detect if not specified
    base_image_preference: Optional[str] = None


# Response Models
class GeneratedConfigResponse(BaseModel):
    config_type: str
    filename: str
    content: str
    description: Optional[str] = None
    template_used: Optional[str] = "standard"
    optimization_level: str
    security_features: Optional[List[str]] = []
    setup_instructions: Optional[List[str]] = []
    usage_notes: Optional[List[str]] = []


class ConfigGenerationResponse(BaseModel):
    project_id: str
    generated_configs: List[GeneratedConfigResponse]
    overall_optimization_score: float
    generation_time: float
    recommendations: List[Dict[str, Any]]


class OptimizationSuggestionResponse(BaseModel):
    suggestion_type: str
    title: str
    description: str
    priority: str
    impact_level: str
    effort_required: str
    implementation_steps: List[str]
    expected_benefit: str
    technical_details: Optional[Dict[str, Any]] = None


class OptimizationResponse(BaseModel):
    project_id: str
    overall_score: float
    suggestions: List[OptimizationSuggestionResponse]
    priority_actions: List[str]
    estimated_improvements: Dict[str, str]


# Simple header validation
def validate_internal_request(x_internal_service: Optional[str] = Header(None)):
    """Validate that request comes from authorized internal service"""
    if not x_internal_service or x_internal_service != "deployio-backend":
        raise HTTPException(
            status_code=403, detail="Access denied: Internal service only"
        )
    return x_internal_service


@router.post(
    "/generate-from-analysis", response_model=ResponseModel[ConfigGenerationResponse]
)
async def generate_from_analysis(
    request: GenerationFromAnalysisRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Generate deployment configurations from analysis results
    Used in the WebSocket-based generation flow
    """
    logger.info(f"Generation from analysis request for session: {request.session_id}")

    try:
        # Import here to avoid circular imports
        from services.generation_service import GenerationService

        # Initialize the service and generate configurations
        generation_service = GenerationService()
        result = await generation_service.generate_configurations(
            analysis_result=request.analysis_result,
            session_id=request.session_id,
            config_types=request.config_types,
            user_preferences=request.user_preferences,
        )

        # Convert to response format
        generated_configs = []
        for config_type, config_data in result["configurations"].items():
            generated_configs.append(
                GeneratedConfigResponse(
                    config_type=config_type,
                    filename=config_data.get("filename", f"{config_type}.yml"),
                    content=config_data.get("content", ""),
                    template_used=config_data.get("template", "standard"),
                    optimization_level=request.optimization_level,
                    security_features=config_data.get("security_features", []),
                    setup_instructions=config_data.get("setup_instructions", []),
                    usage_notes=config_data.get("usage_notes", []),
                )
            )

        response_data = ConfigGenerationResponse(
            project_id=request.session_id,  # Using session_id as project_id
            generated_configs=generated_configs,
            overall_optimization_score=result["metadata"].get(
                "optimization_score", 0.85
            ),
            generation_time=result["metadata"].get("generation_time", 0.0),
            recommendations=result["metadata"].get("recommendations", []),
        )

        logger.info(
            f"Generation from analysis completed successfully for session: {request.session_id}"
        )

        return ResponseModel(
            success=True,
            message="Configurations generated successfully from analysis",
            data=response_data,
        )

    except Exception as e:
        logger.error(
            f"Generation from analysis failed for session {request.session_id}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post(
    "/generate-configs", response_model=ResponseModel[ConfigGenerationResponse]
)
async def generate_all_configs(
    request: GenerateConfigRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Generate all deployment configurations (Dockerfile, CI/CD, Docker Compose, etc.)

    This is the main configuration generation endpoint using repository data and analysis results
    """
    try:
        import time

        start_time = time.time()

        # Validate request has required fields
        if not request.repository_data:
            raise HTTPException(status_code=400, detail="repository_data is required")
        if not request.analysis_results:
            raise HTTPException(status_code=400, detail="analysis_results is required")

        # Extract technology stack from analysis results
        tech_stack_data = request.analysis_results.get("technology_stack", {})
        if not tech_stack_data:
            raise HTTPException(
                status_code=400, detail="technology_stack not found in analysis_results"
            )

        # Convert to TechnologyStack object
        tech_stack = _convert_analysis_to_tech_stack(tech_stack_data)

        # Create analysis result for generators using the new structure
        analysis_result = {
            "repository_data": request.repository_data,
            "analysis_results": request.analysis_results,
            "technology_stack": tech_stack_data,
            "session_id": request.session_id,
            "confidence_score": request.analysis_results.get("confidence_score", 0.95),
            "timestamp": time.time(),
        }

        generated_configs = []
        recommendations = []

        # Generate requested configurations
        for config_type in request.config_types:
            try:
                if config_type == "dockerfile":
                    config_content = await dockerfile_generator.generate_dockerfile(
                        analysis_result
                    )
                    generated_configs.append(
                        GeneratedConfigResponse(
                            config_type="dockerfile",
                            filename="Dockerfile",
                            content=config_content,
                            description="Production-ready Dockerfile with security best practices",
                            optimization_level=request.optimization_level,
                        )
                    )

                elif config_type == "github_actions":
                    pipeline_options = {
                        "include_tests": True,
                        "include_security": True,
                        "include_deploy": True,
                    }
                    config_content = await pipeline_generator.generate_pipeline(
                        analysis_result, "github-actions", pipeline_options
                    )
                    generated_configs.append(
                        GeneratedConfigResponse(
                            config_type="github_actions",
                            filename=".github/workflows/ci-cd.yml",
                            content=config_content,
                            description="Complete CI/CD pipeline with build, test, security scan, and deployment",
                            optimization_level=request.optimization_level,
                        )
                    )

                elif config_type == "docker_compose":
                    config_package = (
                        await config_generator.generate_configuration_package(
                            analysis_result, ["docker-compose"]
                        )
                    )
                    docker_compose_config = next(
                        (
                            config
                            for config in config_package.configurations
                            if config.config_type == "docker-compose"
                        ),
                        None,
                    )
                    if docker_compose_config:
                        generated_configs.append(
                            GeneratedConfigResponse(
                                config_type="docker_compose",
                                filename="docker-compose.yml",
                                content=docker_compose_config.content,
                                description=docker_compose_config.description,
                                optimization_level=request.optimization_level,
                            )
                        )

                elif config_type == "gitlab_ci":
                    pipeline_options = {
                        "include_tests": True,
                        "include_security": True,
                        "include_deploy": True,
                    }
                    config_content = await pipeline_generator.generate_pipeline(
                        analysis_result, "gitlab-ci", pipeline_options
                    )
                    generated_configs.append(
                        GeneratedConfigResponse(
                            config_type="gitlab_ci",
                            filename=".gitlab-ci.yml",
                            content=config_content,
                            description="GitLab CI/CD pipeline configuration",
                            optimization_level=request.optimization_level,
                        )
                    )

                elif config_type == "kubernetes":
                    config_package = (
                        await config_generator.generate_configuration_package(
                            analysis_result, ["kubernetes"]
                        )
                    )
                    k8s_configs = [
                        config
                        for config in config_package.configurations
                        if config.config_type == "kubernetes"
                    ]
                    for k8s_config in k8s_configs:
                        generated_configs.append(
                            GeneratedConfigResponse(
                                config_type="kubernetes",
                                filename=k8s_config.filename,
                                content=k8s_config.content,
                                description=k8s_config.description,
                                optimization_level=request.optimization_level,
                            )
                        )

                else:
                    logger.warning(f"Unsupported config type: {config_type}")

            except Exception as e:
                logger.error(f"Error generating {config_type}: {e}")
                continue

        # Generate optimization recommendations based on analysis results
        recommendations = _generate_optimization_recommendations(
            tech_stack, request.optimization_level
        )
        processing_time = time.time() - start_time

        response_data = ConfigGenerationResponse(
            project_id=request.session_id,
            generated_configs=generated_configs,
            overall_optimization_score=0.85,  # Default score, should be calculated
            generation_time=processing_time,
            recommendations=recommendations,
        )

        return ResponseModel(
            success=True,
            data=response_data,
            message=f"Successfully generated {len(generated_configs)} configurations",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Configuration generation failed: {str(e)}"
        )


@router.post(
    "/generate-dockerfile", response_model=ResponseModel[GeneratedConfigResponse]
)
async def generate_dockerfile_only(
    request: DockerfileRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Generate optimized Dockerfile only - faster operation for Docker-specific needs
    """
    try:
        # Extract technology stack from analysis results
        tech_stack_data = request.analysis_results.get("technology_stack", {})
        if not tech_stack_data:
            raise HTTPException(
                status_code=400, detail="technology_stack not found in analysis_results"
            )

        tech_stack = _convert_analysis_to_tech_stack(tech_stack_data)

        # Create analysis context for dockerfile generator
        analysis_context = {
            "repository_data": request.repository_data,
            "analysis_results": request.analysis_results,
            "technology_stack": tech_stack_data,
            "session_id": request.session_id,
        }

        config = await dockerfile_generator.generate_dockerfile(
            analysis_context=analysis_context,
            tech_stack=tech_stack,
            optimization_level=request.optimization_level,
            build_command=request.build_command,
            start_command=request.start_command,
            port=request.port,
            base_image_preference=request.base_image_preference,
        )

        response = _convert_config_to_response(config)

        return ResponseModel(
            success=True, message="Dockerfile generated successfully", data=response
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Dockerfile generation failed: {str(e)}"
        )


@router.post("/optimize-deployment", response_model=ResponseModel[OptimizationResponse])
async def get_optimization_suggestions(
    request: OptimizationRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Get deployment optimization suggestions based on analysis results and current setup
    """
    try:
        # Extract technology stack from analysis results
        tech_stack_data = request.analysis_results.get("technology_stack", {})
        if not tech_stack_data:
            raise HTTPException(
                status_code=400, detail="technology_stack not found in analysis_results"
            )

        tech_stack = _convert_analysis_to_tech_stack(tech_stack_data)

        # Create analysis context for optimization
        analysis_context = {
            "repository_data": request.repository_data,
            "analysis_results": request.analysis_results,
            "session_id": request.session_id,
        }

        # Generate optimization suggestions
        suggestions = await config_generator.generate_optimization_suggestions(
            analysis_context=analysis_context,
            tech_stack=tech_stack,
            current_configs=request.current_configs or {},
            performance_metrics=request.performance_metrics,
            optimization_goals=request.optimization_goals,
        )

        # Convert to response format
        suggestion_responses = []
        for suggestion in suggestions:
            suggestion_responses.append(
                OptimizationSuggestionResponse(
                    suggestion_type=suggestion.suggestion_type,
                    title=suggestion.title,
                    description=suggestion.description,
                    priority=suggestion.priority,
                    impact_level=suggestion.impact_level,
                    effort_required=suggestion.effort_required,
                    implementation_steps=suggestion.implementation_steps,
                    expected_benefit=suggestion.expected_benefit,
                    technical_details=suggestion.technical_details,
                )
            )

        # Calculate overall optimization score
        overall_score = 85.0  # Placeholder - will be calculated based on current setup

        # Extract priority actions
        priority_actions = [
            s.title for s in suggestions if s.priority in ["high", "critical"]
        ][
            :5
        ]  # Top 5 priority actions

        # Estimated improvements
        estimated_improvements = {
            "build_time": "30-50% faster builds",
            "image_size": "40-60% smaller images",
            "security_score": "15-25 point improvement",
            "deployment_reliability": "95%+ success rate",
        }

        response = OptimizationResponse(
            project_id=request.session_id,
            overall_score=overall_score,
            suggestions=suggestion_responses,
            priority_actions=priority_actions,
            estimated_improvements=estimated_improvements,
        )

        return ResponseModel(
            success=True,
            message=f"Generated {len(suggestions)} optimization suggestions",
            data=response,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Optimization analysis failed: {str(e)}"
        )


@router.get(
    "/supported-config-types", response_model=ResponseModel[Dict[str, List[str]]]
)
async def get_supported_config_types(
    internal_service: str = Depends(validate_internal_request),
):
    """
    Get list of supported configuration types that can be generated
    """
    try:
        supported_types = {
            "containerization": ["dockerfile", "docker_compose"],
            "ci_cd": ["github_actions", "gitlab_ci", "jenkins", "azure_pipelines"],
            "deployment": ["kubernetes", "docker_swarm", "aws_ecs"],
            "monitoring": ["prometheus", "grafana", "health_checks"],
            "security": ["security_scan", "dependency_check", "secrets_management"],
        }

        return ResponseModel(
            success=True,
            message="Supported configuration types retrieved successfully",
            data=supported_types,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve supported types: {str(e)}"
        )


# Helper functions
def _convert_analysis_to_tech_stack(analysis_data: Dict[str, Any]) -> TechnologyStack:
    """Convert analysis results to TechnologyStack object"""
    return TechnologyStack(
        language=analysis_data.get("primary_language", "unknown"),
        frameworks=analysis_data.get("frameworks", []),
        databases=analysis_data.get("databases", []),
        package_managers=analysis_data.get("package_managers", []),
        build_tools=analysis_data.get("build_tools", []),
        deployment_targets=analysis_data.get("deployment_targets", []),
        runtime_version=analysis_data.get("runtime_version"),
        architecture_pattern=analysis_data.get("architecture_pattern"),
        additional_technologies=analysis_data.get("additional_technologies", []),
    )


def _dict_to_tech_stack(tech_dict: Dict[str, Any]) -> TechnologyStack:
    """Convert dictionary to TechnologyStack object"""
    return TechnologyStack(
        language=tech_dict.get("language"),
        framework=tech_dict.get("framework"),
        database=tech_dict.get("database"),
        build_tool=tech_dict.get("build_tool"),
        package_manager=tech_dict.get("package_manager"),
        runtime_version=tech_dict.get("runtime_version"),
        additional_technologies=tech_dict.get("additional_technologies", []),
        architecture_pattern=tech_dict.get("architecture_pattern"),
        deployment_strategy=tech_dict.get("deployment_strategy"),
    )


def _convert_config_to_response(config) -> GeneratedConfigResponse:
    """Convert generated config to response format"""
    return GeneratedConfigResponse(
        config_type=config.config_type,
        filename=config.filename,
        content=config.content,
        template_used=config.template_used,
        optimization_level=config.optimization_level,
        security_features=config.security_features,
        setup_instructions=config.setup_instructions,
        usage_notes=config.usage_notes,
    )


def _generate_optimization_recommendations(
    tech_stack: TechnologyStack, optimization_level: str
) -> List[Dict[str, Any]]:
    """Generate optimization recommendations based on technology stack"""
    recommendations = []

    # General recommendations
    recommendations.append(
        {
            "type": "security",
            "title": "Use non-root user in containers",
            "description": "Run applications as non-root user for better security",
            "priority": "high",
            "implementation": "Add USER directive in Dockerfile",
            "impact": "Reduces security risks",
            "effort": "low",
        }
    )

    # Language-specific recommendations
    lang = getattr(tech_stack, "primary_language", "").lower()
    if lang == "node" or lang == "javascript":
        recommendations.extend(
            [
                {
                    "type": "performance",
                    "title": "Use multi-stage Docker builds",
                    "description": "Separate build and runtime stages to reduce image size",
                    "priority": "medium",
                    "implementation": "Implement multi-stage Dockerfile",
                    "impact": "30-50% smaller images",
                    "effort": "medium",
                },
                {
                    "type": "performance",
                    "title": "Enable npm cache in CI/CD",
                    "description": "Cache npm dependencies to speed up builds",
                    "priority": "medium",
                    "implementation": "Add cache configuration to CI/CD pipeline",
                    "impact": "40-60% faster builds",
                    "effort": "low",
                },
            ]
        )

    elif lang == "python":
        recommendations.extend(
            [
                {
                    "type": "performance",
                    "title": "Use Python slim images",
                    "description": "Use python:slim base images to reduce size",
                    "priority": "medium",
                    "implementation": "Change FROM directive to python:3.11-slim",
                    "impact": "40-60% smaller images",
                    "effort": "low",
                },
                {
                    "type": "security",
                    "title": "Pin Python package versions",
                    "description": "Pin exact versions in requirements.txt for reproducible builds",
                    "priority": "high",
                    "implementation": "Update requirements.txt with exact versions",
                    "impact": "Better build reproducibility",
                    "effort": "low",
                },
            ]
        )

    return recommendations


async def validate_internal_request(x_internal_service: str = Header(None)):
    """Validate internal service requests"""
    if x_internal_service != "deployio-main-service":
        raise HTTPException(
            status_code=403, detail="Access forbidden - internal service only"
        )
    return x_internal_service
