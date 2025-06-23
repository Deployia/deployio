"""
Analysis Routes - Clean API endpoints delegating to services
Request/response handling only - all business logic in services
"""

import logging
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

from models.response import ResponseModel
from services.analysis_service import analysis_service
from services.progress_service import progress_service

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter()


# Request Models
class RepositoryAnalysisRequest(BaseModel):
    repository_url: str
    branch: str = "main"
    analysis_types: Optional[List[str]] = None  # ["stack", "dependencies", "quality"]
    force_llm_enhancement: bool = False
    include_reasoning: bool = True
    include_recommendations: bool = True
    include_insights: bool = True
    explain_null_fields: bool = True
    track_progress: bool = False


class CodeQualityRequest(BaseModel):
    repository_url: str
    branch: str = "main"
    include_reasoning: bool = True
    explain_null_fields: bool = True


class StackDetectionRequest(BaseModel):
    repository_url: str
    branch: str = "main"
    include_reasoning: bool = True
    explain_null_fields: bool = True


class DependencyAnalysisRequest(BaseModel):
    repository_url: str
    branch: str = "main"
    include_reasoning: bool = True
    explain_null_fields: bool = True


# Response Models
class InsightModel(BaseModel):
    """Model for analysis insights"""

    category: str
    title: str
    description: str
    reasoning: str
    confidence: float
    evidence: List[str] = []
    recommendations: List[str] = []
    severity: Optional[str] = None
    tags: List[str] = []


class SuggestionModel(BaseModel):
    type: Optional[str] = None
    priority: Optional[str] = None
    suggestion: str
    reason: Optional[str] = None


class AnalysisResponse(BaseModel):
    # Basic information
    repository_url: str
    branch: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str

    # Core results
    technology_stack: Dict
    detected_files: List[str]
    recommendations: List[Dict]
    suggestions: List[SuggestionModel]

    # Insights
    insights: List[InsightModel] = []
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = {}

    # Optional detailed results
    quality_metrics: Optional[Dict] = None
    security_metrics: Optional[Dict] = None
    dependency_analysis: Optional[Dict] = None

    # LLM enhancement info
    llm_used: bool = False
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None

    # Progress tracking
    analysis_id: Optional[str] = None


class StackDetectionResponse(BaseModel):
    repository_url: str
    branch: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str
    technology_stack: Dict
    detected_files: List[str]
    insights: List[InsightModel] = []
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = {}
    analysis_id: Optional[str] = None


class CodeQualityResponse(BaseModel):
    repository_url: str
    branch: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str
    quality_metrics: Dict
    recommendations: List[Dict]
    suggestions: List[SuggestionModel]
    insights: List[InsightModel] = []
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = {}
    analysis_id: Optional[str] = None


class DependencyAnalysisResponse(BaseModel):
    repository_url: str
    branch: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str
    dependency_analysis: Dict
    recommendations: List[Dict]
    suggestions: List[SuggestionModel]
    insights: List[InsightModel] = []
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = {}
    analysis_id: Optional[str] = None


class ProgressResponse(BaseModel):
    """Response model for progress tracking"""

    operation_id: str
    step_name: str
    percentage: float
    status: str
    message: str
    timestamp: str


# Authentication/Authorization
def validate_internal_request(x_internal_service: Optional[str] = Header(None)):
    """Validate that request comes from authorized internal service"""
    if not x_internal_service or x_internal_service != "deployio-backend":
        raise HTTPException(
            status_code=403, detail="Access denied: Internal service only"
        )
    return x_internal_service


# API Endpoints
@router.post("/analyze-repository", response_model=ResponseModel[AnalysisResponse])
async def analyze_repository(
    request: RepositoryAnalysisRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Complete repository analysis with detailed insights and optional progress tracking

    Provides comprehensive analysis including:
    - Technology stack detection with detailed reasoning
    - Dependency analysis with security insights
    - Code quality assessment with recommendations
    - Detailed insights with evidence and confidence scoring
    """
    logger.info(
        f"Repository analysis request for {request.repository_url} from {internal_service}"
    )

    try:
        # Delegate to service
        result = await analysis_service.analyze_repository(
            repository_url=request.repository_url,
            branch=request.branch,
            analysis_types=request.analysis_types,
            force_llm=request.force_llm_enhancement,
            include_reasoning=request.include_reasoning,
            include_recommendations=request.include_recommendations,
            include_insights=request.include_insights,
            explain_null_fields=request.explain_null_fields,
            track_progress=request.track_progress,
        )

        logger.info(
            f"Repository analysis completed successfully for {request.repository_url}"
        )
        return ResponseModel(
            success=True,
            message="Repository analysis completed successfully",
            data=AnalysisResponse(**result),
        )

    except Exception as e:
        logger.error(
            f"Repository analysis failed for {request.repository_url}: {str(e)}",
            exc_info=True,
        )
        # Custom error handling for known errors
        error_message = str(e)
        if "Repository not found" in error_message or "invalid response" in error_message:
            raise HTTPException(
                status_code=404,
                detail=f"Repository not found or inaccessible: {request.repository_url}"
            )
        # Add more custom error checks as needed
        raise HTTPException(
            status_code=500, detail=f"Repository analysis failed: {error_message}"
        )


@router.post("/detect-stack", response_model=ResponseModel[StackDetectionResponse])
async def detect_technology_stack(
    request: StackDetectionRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Focused technology stack detection with insights and reasoning
    """
    logger.info(f"Technology stack detection request for {request.repository_url}")

    try:
        # Delegate to service
        result = await analysis_service.analyze_technology_stack(
            repository_url=request.repository_url,
            branch=request.branch,
            include_reasoning=request.include_reasoning,
            explain_null_fields=request.explain_null_fields,
        )

        logger.info(
            f"Technology stack detection completed for {request.repository_url}"
        )
        return ResponseModel(
            success=True,
            message="Technology stack analysis completed successfully",
            data=StackDetectionResponse(**result),
        )

    except Exception as e:
        logger.error(
            f"Technology stack detection failed for {request.repository_url}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500, detail=f"Technology stack analysis failed: {str(e)}"
        )


@router.post("/analyze-code-quality", response_model=ResponseModel[CodeQualityResponse])
async def analyze_code_quality(
    request: CodeQualityRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Focused code quality assessment with metrics and recommendations
    """
    try:
        # Delegate to service
        result = await analysis_service.analyze_code_quality(
            repository_url=request.repository_url,
            branch=request.branch,
            include_reasoning=request.include_reasoning,
            explain_null_fields=request.explain_null_fields,
        )

        return ResponseModel(
            success=True,
            message="Code quality analysis completed successfully",
            data=CodeQualityResponse(**result),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Code quality analysis failed: {str(e)}"
        )


@router.post(
    "/analyze-dependencies", response_model=ResponseModel[DependencyAnalysisResponse]
)
async def analyze_dependencies(
    request: DependencyAnalysisRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Focused dependency analysis with security insights and recommendations
    """
    try:
        # Delegate to service
        result = await analysis_service.analyze_dependencies(
            repository_url=request.repository_url,
            branch=request.branch,
            include_reasoning=request.include_reasoning,
            explain_null_fields=request.explain_null_fields,
        )

        return ResponseModel(
            success=True,
            message="Dependency analysis completed successfully",
            data=DependencyAnalysisResponse(**result),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Dependency analysis failed: {str(e)}"
        )


@router.get("/supported-technologies", response_model=ResponseModel[Dict[str, Any]])
async def get_supported_technologies(
    internal_service: str = Depends(validate_internal_request),
):
    """
    Get list of supported technologies and frameworks
    """
    try:
        # Delegate to service
        result = await analysis_service.get_supported_technologies()

        return ResponseModel(
            success=True,
            message="Supported technologies retrieved successfully",
            data=result,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get supported technologies: {str(e)}"
        )


@router.get("/progress/{operation_id}", response_model=ResponseModel[ProgressResponse])
async def get_analysis_progress(operation_id: str):
    """
    Get progress status for a running analysis operation
    """
    try:
        # Delegate to progress service
        tracker = progress_service.get_tracker(operation_id)
        if not tracker:
            raise HTTPException(status_code=404, detail="Operation not found")

        progress_data = tracker.get_current_state()

        return ResponseModel(
            success=True,
            message="Progress retrieved successfully",
            data=ProgressResponse(
                operation_id=operation_id,
                step_name=progress_data["step_name"],
                percentage=progress_data["percentage"],
                status=progress_data["status"],
                message=progress_data["message"],
                timestamp=progress_data["timestamp"],
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")


@router.get("/health", response_model=ResponseModel[Dict[str, str]])
async def health_check():
    """
    Basic health check endpoint
    """
    try:
        return ResponseModel(
            success=True,
            message="Service is healthy",
            data={
                "status": "healthy",
                "service": "ai-service-analysis",
                "timestamp": str(int(__import__("time").time())),
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.get("/health/detailed", response_model=ResponseModel[Dict[str, Any]])
async def detailed_health_check():
    """
    Detailed health check including service dependencies
    """
    try:
        # Delegate to service
        health_data = await analysis_service.get_health_status()

        # Add progress service health
        progress_health = progress_service.get_health_status()
        health_data["progress_service"] = progress_health

        return ResponseModel(
            success=True,
            message="Detailed health check completed",
            data=health_data,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Detailed health check failed: {str(e)}"
        )
