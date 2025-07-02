"""
Generator Routes - Modern configuration generation endpoints

Provides intelligent deployment configuration generation based on unified analysis results.
Works with the new AnalysisResult model and provides comprehensive generation capabilities.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from engines.generators.dockerfile_generator import DockerfileGenerator
from engines.generators.config_generator import ConfigurationGenerator  
from engines.generators.pipeline_generator import PipelineGenerator
from models.analysis_models import AnalysisResult
from models.response_models import ErrorResponse

logger = logging.getLogger(__name__)

# Initialize generators
dockerfile_generator = DockerfileGenerator()
config_generator = ConfigurationGenerator()
pipeline_generator = PipelineGenerator()


# Request Models
class GenerateFromAnalysisRequest(BaseModel):
    """Generate configurations from unified analysis results."""
    
    analysis_result: AnalysisResult = Field(..., description="Complete analysis results")
    config_types: List[str] = Field(
        default=["dockerfile", "docker_compose", "github_actions"], 
        description="Configuration types to generate"
    )
    user_preferences: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="User preferences for generation"
    )
    optimization_level: str = Field(
        default="balanced",
        description="Optimization level: basic, balanced, performance, security"
    )


class GenerateDockerfileRequest(BaseModel):
    """Generate Dockerfile from analysis results."""
    
    analysis_result: AnalysisResult = Field(..., description="Analysis results")
    optimization_level: str = Field(default="balanced", description="Optimization level")
    user_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)


class GenerateConfigRequest(BaseModel):
    """Generate orchestration configs from analysis results."""
    
    analysis_result: AnalysisResult = Field(..., description="Analysis results")
    config_type: str = Field(..., description="Configuration type: docker_compose, kubernetes")
    optimization_level: str = Field(default="balanced", description="Optimization level")
    user_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)


class GeneratePipelineRequest(BaseModel):
    """Generate CI/CD pipeline from analysis results."""
    
    analysis_result: AnalysisResult = Field(..., description="Analysis results")
    platform: str = Field(default="github_actions", description="CI/CD platform")
    optimization_level: str = Field(default="balanced", description="Optimization level")
    user_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)


def create_generator_routes() -> APIRouter:
    """Create and configure generator API routes."""
    
    router = APIRouter(prefix="/api/v1/generators", tags=["generators"])
    
    @router.post("/complete")
    async def generate_complete_configuration(request: GenerateFromAnalysisRequest):
        """
        Generate complete deployment configuration from analysis results.
        
        Creates a comprehensive set of deployment files including:
        - Dockerfile (optimized for the technology stack)
        - docker-compose.yml (with all services and dependencies)
        - CI/CD pipeline configuration
        - Environment and configuration files
        
        Args:
            request: Generation request with analysis results and preferences
            
        Returns:
            Complete configuration package with all generated files
        """
        try:
            logger.info(f"Generating complete configuration for {len(request.config_types)} types")
            
            # Validate optimization level
            valid_levels = ["basic", "balanced", "performance", "security"]
            if request.optimization_level not in valid_levels:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid optimization level. Must be one of: {valid_levels}"
                )
            
            # Validate config types
            valid_types = ["dockerfile", "docker_compose", "kubernetes", "github_actions", "gitlab_ci", "jenkins"]
            invalid_types = [t for t in request.config_types if t not in valid_types]
            if invalid_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid config types: {invalid_types}. Valid types: {valid_types}"
                )
            
            generated_configs = {}
            
            # Generate Dockerfile if requested
            if "dockerfile" in request.config_types:
                try:
                    dockerfile = await dockerfile_generator.generate_dockerfile(
                        request.analysis_result,
                        optimization_level=request.optimization_level,
                        user_preferences=request.user_preferences
                    )
                    generated_configs["dockerfile"] = dockerfile
                except Exception as e:
                    logger.error(f"Dockerfile generation failed: {e}")
                    generated_configs["dockerfile"] = {"error": str(e)}
            
            # Generate Docker Compose if requested
            if "docker_compose" in request.config_types:
                try:
                    compose_config = await config_generator.generate_docker_compose(
                        request.analysis_result,
                        optimization_level=request.optimization_level,
                        user_preferences=request.user_preferences
                    )
                    generated_configs["docker_compose"] = compose_config
                except Exception as e:
                    logger.error(f"Docker Compose generation failed: {e}")
                    generated_configs["docker_compose"] = {"error": str(e)}
            
            # Generate Kubernetes if requested
            if "kubernetes" in request.config_types:
                try:
                    k8s_config = await config_generator.generate_kubernetes(
                        request.analysis_result,
                        optimization_level=request.optimization_level,
                        user_preferences=request.user_preferences
                    )
                    generated_configs["kubernetes"] = k8s_config
                except Exception as e:
                    logger.error(f"Kubernetes generation failed: {e}")
                    generated_configs["kubernetes"] = {"error": str(e)}
            
            # Generate CI/CD pipelines if requested
            pipeline_types = [t for t in request.config_types if t in ["github_actions", "gitlab_ci", "jenkins"]]
            for pipeline_type in pipeline_types:
                try:
                    pipeline_config = await pipeline_generator.generate_pipeline(
                        request.analysis_result,
                        platform=pipeline_type,
                        optimization_level=request.optimization_level,
                        user_preferences=request.user_preferences
                    )
                    generated_configs[pipeline_type] = pipeline_config
                except Exception as e:
                    logger.error(f"{pipeline_type} generation failed: {e}")
                    generated_configs[pipeline_type] = {"error": str(e)}
            
            # Calculate success rate
            successful_generations = sum(1 for config in generated_configs.values() if "error" not in config)
            total_generations = len(generated_configs)
            success_rate = successful_generations / total_generations if total_generations > 0 else 0
            
            return {
                "success": True,
                "configurations": generated_configs,
                "metadata": {
                    "total_configs": total_generations,
                    "successful_configs": successful_generations,
                    "success_rate": success_rate,
                    "optimization_level": request.optimization_level,
                    "technology_stack": {
                        "languages": request.analysis_result.technology_stack.languages,
                        "frameworks": request.analysis_result.technology_stack.frameworks,
                        "databases": request.analysis_result.technology_stack.databases
                    }
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Complete configuration generation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Configuration generation failed",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.post("/dockerfile")
    async def generate_dockerfile(request: GenerateDockerfileRequest):
        """
        Generate optimized Dockerfile from analysis results.
        
        Args:
            request: Dockerfile generation request
            
        Returns:
            Generated Dockerfile with metadata
        """
        try:
            logger.info("Generating Dockerfile")
            
            dockerfile = await dockerfile_generator.generate_dockerfile(
                request.analysis_result,
                optimization_level=request.optimization_level,
                user_preferences=request.user_preferences
            )
            
            return {
                "success": True,
                "dockerfile": dockerfile,
                "metadata": {
                    "optimization_level": request.optimization_level,
                    "base_image": dockerfile.get("base_image"),
                    "multi_stage": dockerfile.get("multi_stage", False),
                    "security_features": dockerfile.get("security_features", [])
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Dockerfile generation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Dockerfile generation failed",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.post("/orchestration")
    async def generate_orchestration_config(request: GenerateConfigRequest):
        """
        Generate orchestration configuration (Docker Compose or Kubernetes).
        
        Args:
            request: Configuration generation request
            
        Returns:
            Generated orchestration configuration
        """
        try:
            logger.info(f"Generating {request.config_type} configuration")
            
            if request.config_type == "docker_compose":
                config = await config_generator.generate_docker_compose(
                    request.analysis_result,
                    optimization_level=request.optimization_level,
                    user_preferences=request.user_preferences
                )
            elif request.config_type == "kubernetes":
                config = await config_generator.generate_kubernetes(
                    request.analysis_result,
                    optimization_level=request.optimization_level,
                    user_preferences=request.user_preferences
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported config type: {request.config_type}"
                )
            
            return {
                "success": True,
                "configuration": config,
                "config_type": request.config_type,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"{request.config_type} generation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": f"{request.config_type} generation failed",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.post("/pipeline")
    async def generate_pipeline_config(request: GeneratePipelineRequest):
        """
        Generate CI/CD pipeline configuration.
        
        Args:
            request: Pipeline generation request
            
        Returns:
            Generated CI/CD pipeline configuration
        """
        try:
            logger.info(f"Generating {request.platform} pipeline")
            
            pipeline_config = await pipeline_generator.generate_pipeline(
                request.analysis_result,
                platform=request.platform,
                optimization_level=request.optimization_level,
                user_preferences=request.user_preferences
            )
            
            return {
                "success": True,
                "pipeline": pipeline_config,
                "platform": request.platform,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"{request.platform} pipeline generation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": f"{request.platform} pipeline generation failed",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.get("/supported-types")
    async def get_supported_types():
        """
        Get list of supported configuration types and platforms.
        
        Returns:
            Supported configuration types and CI/CD platforms
        """
        return {
            "config_types": [
                "dockerfile",
                "docker_compose", 
                "kubernetes"
            ],
            "pipeline_platforms": [
                "github_actions",
                "gitlab_ci",
                "jenkins"
            ],
            "optimization_levels": [
                "basic",
                "balanced", 
                "performance",
                "security"
            ],
            "features": {
                "multi_stage_docker": True,
                "security_scanning": True,
                "health_checks": True,
                "environment_optimization": True,
                "dependency_caching": True
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    return router
