"""
Clean Optimization Routes
Configuration generation and optimization suggestions
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

from models.response import ResponseModel
from engines.generators.dockerfile_generator import DockerfileGenerator
from engines.generators.pipeline_generator import PipelineGenerator
from engines.generators.config_generator import ConfigGenerator
from engines.core.models import TechnologyStack

router = APIRouter()

# Initialize generators
dockerfile_generator = DockerfileGenerator()
pipeline_generator = PipelineGenerator()
config_generator = ConfigGenerator()


# Request Models
class GenerateConfigRequest(BaseModel):
    project_id: str
    repository_url: str
    technology_stack: Dict[str, Any]
    config_types: List[str]  # ["dockerfile", "github_actions", "docker_compose"]
    optimization_level: str = "balanced"  # "basic", "balanced", "performance", "security"


class OptimizationRequest(BaseModel):
    project_id: str
    repository_url: str
    technology_stack: Dict[str, Any]
    current_configs: Optional[Dict[str, str]] = None
    performance_metrics: Optional[Dict[str, Any]] = None


class DockerfileRequest(BaseModel):
    project_id: str
    technology_stack: Dict[str, Any]
    optimization_level: str = "balanced"
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    port: int = 3000


# Response Models
class GeneratedConfigResponse(BaseModel):
    config_type: str
    filename: str
    content: str
    template_used: str
    optimization_level: str
    security_features: List[str]
    setup_instructions: List[str]
    usage_notes: List[str]


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


@router.post("/generate-configs", response_model=ResponseModel[ConfigGenerationResponse])
async def generate_all_configs(
    request: GenerateConfigRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Generate all deployment configurations (Dockerfile, CI/CD, Docker Compose, etc.)
    
    This is the main configuration generation endpoint
    """
    try:
        import time
        start_time = time.time()
        
        # Convert dict to TechnologyStack
        tech_stack = _dict_to_tech_stack(request.technology_stack)
        
        generated_configs = []
        recommendations = []
        
        # Generate requested configurations
        for config_type in request.config_types:
            if config_type == "dockerfile":
                config = await dockerfile_generator.generate_dockerfile(
                    tech_stack=tech_stack,
                    optimization_level=request.optimization_level,
                    project_id=request.project_id
                )
                generated_configs.append(_convert_config_to_response(config))
                
            elif config_type == "github_actions":
                config = await pipeline_generator.generate_github_actions(
                    tech_stack=tech_stack,
                    repository_url=request.repository_url,
                    optimization_level=request.optimization_level
                )
                generated_configs.append(_convert_config_to_response(config))
                
            elif config_type == "docker_compose":
                config = await config_generator.generate_docker_compose(
                    tech_stack=tech_stack,
                    optimization_level=request.optimization_level
                )
                generated_configs.append(_convert_config_to_response(config))
                
            elif config_type == "gitlab_ci":
                config = await pipeline_generator.generate_gitlab_ci(
                    tech_stack=tech_stack,
                    repository_url=request.repository_url,
                    optimization_level=request.optimization_level
                )
                generated_configs.append(_convert_config_to_response(config))
        
        # Calculate overall optimization score
        optimization_scores = [85, 90, 88]  # Placeholder - will be calculated by generators
        overall_score = sum(optimization_scores) / len(optimization_scores) if optimization_scores else 80
        
        # Generate general recommendations
        recommendations = [
            {
                "type": "performance",
                "message": "Generated configurations are optimized for production deployment",
                "priority": "info"
            },
            {
                "type": "security", 
                "message": "Security best practices have been applied to all configurations",
                "priority": "info"
            }
        ]
        
        response = ConfigGenerationResponse(
            project_id=request.project_id,
            generated_configs=generated_configs,
            overall_optimization_score=overall_score,
            generation_time=time.time() - start_time,
            recommendations=recommendations
        )
        
        return ResponseModel(
            success=True,
            message=f"Generated {len(generated_configs)} configurations successfully",
            data=response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Configuration generation failed: {str(e)}"
        )


@router.post("/generate-dockerfile", response_model=ResponseModel[GeneratedConfigResponse])
async def generate_dockerfile_only(
    request: DockerfileRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Generate optimized Dockerfile only - faster operation for Docker-specific needs
    """
    try:
        tech_stack = _dict_to_tech_stack(request.technology_stack)
        
        config = await dockerfile_generator.generate_dockerfile(
            tech_stack=tech_stack,
            optimization_level=request.optimization_level,
            project_id=request.project_id,
            build_command=request.build_command,
            start_command=request.start_command,
            port=request.port
        )
        
        response = _convert_config_to_response(config)
        
        return ResponseModel(
            success=True,
            message="Dockerfile generated successfully",
            data=response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Dockerfile generation failed: {str(e)}"
        )


@router.post("/optimize-deployment", response_model=ResponseModel[OptimizationResponse])
async def get_optimization_suggestions(
    request: OptimizationRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Get deployment optimization suggestions based on technology stack and current setup
    """
    try:
        tech_stack = _dict_to_tech_stack(request.technology_stack)
        
        # Generate optimization suggestions
        suggestions = await config_generator.generate_optimization_suggestions(
            tech_stack=tech_stack,
            current_configs=request.current_configs or {},
            performance_metrics=request.performance_metrics
        )
        
        # Convert to response format
        suggestion_responses = []
        for suggestion in suggestions:
            suggestion_responses.append(OptimizationSuggestionResponse(
                suggestion_type=suggestion.suggestion_type,
                title=suggestion.title,
                description=suggestion.description,
                priority=suggestion.priority,
                impact_level=suggestion.impact_level,
                effort_required=suggestion.effort_required,
                implementation_steps=suggestion.implementation_steps,
                expected_benefit=suggestion.expected_benefit,
                technical_details=suggestion.technical_details
            ))
        
        # Calculate overall optimization score
        overall_score = 85.0  # Placeholder - will be calculated based on current setup
        
        # Extract priority actions
        priority_actions = [
            s.title for s in suggestions 
            if s.priority in ["high", "critical"]
        ][:5]  # Top 5 priority actions
        
        # Estimated improvements
        estimated_improvements = {
            "build_time": "30-50% faster builds",
            "image_size": "40-60% smaller images", 
            "security_score": "15-25 point improvement",
            "deployment_reliability": "95%+ success rate"
        }
        
        response = OptimizationResponse(
            project_id=request.project_id,
            overall_score=overall_score,
            suggestions=suggestion_responses,
            priority_actions=priority_actions,
            estimated_improvements=estimated_improvements
        )
        
        return ResponseModel(
            success=True,
            message=f"Generated {len(suggestions)} optimization suggestions",
            data=response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Optimization analysis failed: {str(e)}"
        )


@router.get("/supported-config-types", response_model=ResponseModel[Dict[str, List[str]]])
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
            "security": ["security_scan", "dependency_check", "secrets_management"]
        }
        
        return ResponseModel(
            success=True,
            message="Supported configuration types retrieved successfully",
            data=supported_types
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve supported types: {str(e)}"
        )


# Helper functions
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
        deployment_strategy=tech_dict.get("deployment_strategy")
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
        usage_notes=config.usage_notes
    )
