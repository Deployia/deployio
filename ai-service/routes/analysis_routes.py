"""
Analysis API Routes

Clean, focused API routes for repository analysis.
Provides comprehensive endpoints with proper error handling and progress tracking.
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from services.analysis_service import AnalysisService
from models.analysis_models import AnalysisRequest
from models.response_models import AnalysisResponse, AnalysisStatus
from models.common_models import AnalysisType

logger = logging.getLogger(__name__)

# Global analysis service instance
analysis_service: Optional[AnalysisService] = None


def get_analysis_service() -> AnalysisService:
    """Dependency to get the analysis service instance."""
    global analysis_service
    if analysis_service is None:
        analysis_service = AnalysisService()
    return analysis_service


# Request models for API endpoints
class AnalyzeRepositoryRequest(BaseModel):
    """Request model for repository analysis."""
    repository_url: str = Field(..., description="Repository URL to analyze")
    analysis_types: Optional[list] = Field(
        default=[AnalysisType.FULL], 
        description="Types of analysis to perform"
    )
    options: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Analysis options"
    )


class ValidateRepositoryRequest(BaseModel):
    """Request model for repository data validation."""
    repository_data: Dict[str, Any] = Field(..., description="Repository data to validate")


def create_analysis_routes() -> APIRouter:
    """
    Create and configure analysis API routes.
    
    Returns:
        Configured FastAPI router
    """
    router = APIRouter(prefix="/api/v1", tags=["analysis"])
    
    @router.post("/analyze-repository", response_model=AnalysisResponse)
    async def analyze_repository(
        request: AnalyzeRepositoryRequest,
        background_tasks: BackgroundTasks,
        service: AnalysisService = Depends(get_analysis_service)
    ):
        """
        Analyze a repository and return comprehensive analysis results.
        
        This is the main endpoint that performs complete repository analysis including:
        - Technology stack detection
        - Dependency analysis
        - Code quality assessment
        - Build configuration extraction
        - Deployment insights
        - LLM-enhanced recommendations
        
        Args:
            request: Analysis request with repository URL and options
            background_tasks: FastAPI background tasks
            service: Analysis service dependency
            
        Returns:
            Complete analysis results or error information
        """
        try:
            logger.info(f"Received analysis request for: {request.repository_url}")
            
            # Convert request to dict for service
            request_data = {
                "repository_url": request.repository_url,
                "analysis_types": request.analysis_types or [AnalysisType.FULL],
                "options": request.options or {}
            }
            
            # Set default options
            if "cache_enabled" not in request_data["options"]:
                request_data["options"]["cache_enabled"] = True
            if "include_llm_enhancement" not in request_data["options"]:
                request_data["options"]["include_llm_enhancement"] = True
            
            # Execute analysis
            result = await service.analyze_repository(request_data)
            
            # Log completion
            if result.status == AnalysisStatus.COMPLETED:
                logger.info(f"Analysis completed for {request.repository_url} in {result.execution_time:.2f}s")
            else:
                logger.warning(f"Analysis failed for {request.repository_url}: {result.error}")
            
            return result
            
        except Exception as e:
            logger.error(f"Analysis endpoint error: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Internal server error",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.get("/analysis/{analysis_id}/status")
    async def get_analysis_status(
        analysis_id: str,
        service: AnalysisService = Depends(get_analysis_service)
    ):
        """
        Get the status of a running analysis.
        
        Args:
            analysis_id: Analysis identifier
            service: Analysis service dependency
            
        Returns:
            Analysis status information
        """
        try:
            status = await service.get_analysis_status(analysis_id)
            
            if status is None:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "Analysis not found",
                        "analysis_id": analysis_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            
            return status
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Status check error for {analysis_id}: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Failed to get analysis status",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.delete("/analysis/{analysis_id}")
    async def cancel_analysis(
        analysis_id: str,
        service: AnalysisService = Depends(get_analysis_service)
    ):
        """
        Cancel a running analysis.
        
        Args:
            analysis_id: Analysis identifier
            service: Analysis service dependency
            
        Returns:
            Cancellation confirmation
        """
        try:
            success = await service.cancel_analysis(analysis_id)
            
            if not success:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "Analysis not found or already completed",
                        "analysis_id": analysis_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            
            return {
                "message": "Analysis cancelled successfully",
                "analysis_id": analysis_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Cancel analysis error for {analysis_id}: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Failed to cancel analysis",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.post("/validate-repository")
    async def validate_repository_data(
        request: ValidateRepositoryRequest,
        service: AnalysisService = Depends(get_analysis_service)
    ):
        """
        Validate and sanitize repository data.
        
        Args:
            request: Repository data validation request
            service: Analysis service dependency
            
        Returns:
            Validation results with sanitized data
        """
        try:
            result = await service.validate_repository_data(request.repository_data)
            
            return {
                "validation_result": result,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Repository validation error: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Validation failed",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.get("/health")
    async def get_service_health(
        service: AnalysisService = Depends(get_analysis_service)
    ):
        """
        Get service health and status information.
        
        Args:
            service: Analysis service dependency
            
        Returns:
            Service health information
        """
        try:
            health = await service.get_service_health()
            
            # Set appropriate status code based on health
            status_code = 200 if health.get('service_healthy', False) else 503
            
            return JSONResponse(
                status_code=status_code,
                content={
                    "health": health,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Health check error: {e}")
            return JSONResponse(
                status_code=503,
                content={
                    "health": {
                        "service_healthy": False,
                        "error": str(e)
                    },
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.post("/cache/cleanup")
    async def cleanup_cache(
        service: AnalysisService = Depends(get_analysis_service)
    ):
        """
        Clean up expired cache entries.
        
        Args:
            service: Analysis service dependency
            
        Returns:
            Cleanup results
        """
        try:
            result = await service.cleanup_cache()
            
            return {
                "cleanup_result": result,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Cache cleanup failed",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    @router.get("/info")
    async def get_api_info():
        """
        Get API information and capabilities.
        
        Returns:
            API information and supported features
        """
        return {
            "api_version": "1.0.0",
            "service_name": "Repository Analysis Service",
            "description": "Comprehensive repository analysis with technology detection, dependency analysis, and code quality assessment",
            "supported_platforms": [
                "github.com",
                "gitlab.com", 
                "bitbucket.org",
                "codeberg.org",
                "git.sr.ht"
            ],
            "supported_analysis_types": [t.value for t in AnalysisType],
            "features": {
                "technology_stack_detection": True,
                "dependency_analysis": True,
                "code_quality_assessment": True,
                "build_configuration_extraction": True,
                "deployment_insights": True,
                "llm_enhancement": True,
                "caching": True,
                "progress_tracking": True
            },
            "endpoints": {
                "analyze_repository": "/api/v1/analyze-repository",
                "get_status": "/api/v1/analysis/{analysis_id}/status",
                "cancel_analysis": "/api/v1/analysis/{analysis_id}",
                "validate_repository": "/api/v1/validate-repository",
                "health_check": "/api/v1/health",
                "cache_cleanup": "/api/v1/cache/cleanup"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Error handlers
    @router.exception_handler(ValueError)
    async def value_error_handler(request, exc):
        """Handle value errors with proper response."""
        logger.warning(f"Value error in request: {exc}")
        return JSONResponse(
            status_code=400,
            content={
                "error": "Bad request",
                "message": str(exc),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @router.exception_handler(Exception)
    async def general_exception_handler(request, exc):
        """Handle unexpected errors."""
        logger.error(f"Unexpected error in API: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    return router
