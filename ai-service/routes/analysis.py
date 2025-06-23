"""
Analysis Routes - Clean API endpoints delegating to services
Request/response handling only - all business logic in services
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

from models.response import ResponseModel
from services.analysis_service import analysis_service
from services.progress_service import progress_service
from exceptions import (
    AnalysisException,
    RepositoryNotFoundException,
    RepositoryAccessException,
    InvalidRepositoryException,
    BranchNotFoundException,
    AnalysisTimeoutException,
    LLMServiceException,
    RateLimitExceededException,
    InsufficientDataException,
)
from middleware.auth import (
    AuthUser,
    validate_jwt_token,
    validate_demo_or_user_token,
    log_authentication_event,
)

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


# Authentication Dependencies
def validate_internal_request(auth_user: AuthUser = Depends(validate_jwt_token)):
    """Validate JWT token and internal service header"""
    log_authentication_event(auth_user, "repository_analysis")
    return auth_user


def validate_demo_access(
    auth_user: Optional[AuthUser] = Depends(validate_demo_or_user_token),
):
    """Allow both authenticated users and demo access"""
    log_authentication_event(auth_user, "demo_analysis")
    return auth_user


# API Endpoints
@router.post("/analyze-repository", response_model=ResponseModel[AnalysisResponse])
async def analyze_repository(
    request: RepositoryAnalysisRequest,
    auth_user: AuthUser = Depends(validate_internal_request),
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
        f"Repository analysis request for {request.repository_url} from {auth_user}"
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

    except RepositoryNotFoundException as e:
        logger.error(f"Repository not found: {request.repository_url}")
        raise HTTPException(status_code=404, detail=e.message)

    except RepositoryAccessException as e:
        logger.error(f"Repository access denied: {request.repository_url}")
        raise HTTPException(status_code=403, detail=e.message)

    except InvalidRepositoryException as e:
        logger.error(f"Invalid repository URL: {request.repository_url}")
        raise HTTPException(status_code=400, detail=e.message)

    except BranchNotFoundException as e:
        logger.error(f"Branch not found: {request.branch} in {request.repository_url}")
        raise HTTPException(status_code=404, detail=e.message)

    except RateLimitExceededException as e:
        logger.error(f"Rate limit exceeded: {e.service}")
        raise HTTPException(status_code=429, detail=e.message)

    except AnalysisTimeoutException as e:
        logger.error(f"Analysis timeout: {request.repository_url}")
        raise HTTPException(status_code=408, detail=e.message)

    except LLMServiceException as e:
        logger.error(f"LLM service error: {e.operation}")
        raise HTTPException(status_code=503, detail=e.message)

    except InsufficientDataException as e:
        logger.error(f"Insufficient data: {request.repository_url}")
        raise HTTPException(status_code=422, detail=e.message)

    except AnalysisException as e:
        logger.error(f"Analysis error: {request.repository_url}")
        raise HTTPException(status_code=e.status_code, detail=e.message)

    except Exception as e:
        logger.error(
            f"Repository analysis failed for {request.repository_url}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/detect-stack", response_model=ResponseModel[StackDetectionResponse])
async def detect_technology_stack(
    request: StackDetectionRequest,
    auth_user: AuthUser = Depends(validate_internal_request),
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

    except RepositoryNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except RepositoryAccessException as e:
        raise HTTPException(status_code=403, detail=e.message)
    except InvalidRepositoryException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except BranchNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except RateLimitExceededException as e:
        raise HTTPException(status_code=429, detail=e.message)
    except AnalysisTimeoutException as e:
        raise HTTPException(status_code=408, detail=e.message)
    except LLMServiceException as e:
        raise HTTPException(status_code=503, detail=e.message)
    except InsufficientDataException as e:
        raise HTTPException(status_code=422, detail=e.message)
    except AnalysisException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
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
    auth_user: AuthUser = Depends(validate_internal_request),
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

    except RepositoryNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except RepositoryAccessException as e:
        raise HTTPException(status_code=403, detail=e.message)
    except InvalidRepositoryException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except BranchNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except RateLimitExceededException as e:
        raise HTTPException(status_code=429, detail=e.message)
    except AnalysisTimeoutException as e:
        raise HTTPException(status_code=408, detail=e.message)
    except LLMServiceException as e:
        raise HTTPException(status_code=503, detail=e.message)
    except InsufficientDataException as e:
        raise HTTPException(status_code=422, detail=e.message)
    except AnalysisException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Code quality analysis failed: {str(e)}"
        )


@router.post(
    "/analyze-dependencies", response_model=ResponseModel[DependencyAnalysisResponse]
)
async def analyze_dependencies(
    request: DependencyAnalysisRequest,
    auth_user: AuthUser = Depends(validate_internal_request),
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

    except RepositoryNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except RepositoryAccessException as e:
        raise HTTPException(status_code=403, detail=e.message)
    except InvalidRepositoryException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except BranchNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except RateLimitExceededException as e:
        raise HTTPException(status_code=429, detail=e.message)
    except AnalysisTimeoutException as e:
        raise HTTPException(status_code=408, detail=e.message)
    except LLMServiceException as e:
        raise HTTPException(status_code=503, detail=e.message)
    except InsufficientDataException as e:
        raise HTTPException(status_code=422, detail=e.message)
    except AnalysisException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Dependency analysis failed: {str(e)}"
        )


@router.get("/supported-technologies", response_model=ResponseModel[Dict[str, Any]])
async def get_supported_technologies(
    auth_user: Optional[AuthUser] = Depends(validate_demo_access),
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

class AnalysisResult:
    """Placeholder class for AnalysisResult"""

    def __init__(
        self,
        repository_url,
        branch,
        analysis_approach,
        processing_time,
        confidence_score,
        confidence_level,
        technology_stack,
        detected_files,
        recommendations,
        suggestions,
        quality_metrics=None,
        security_metrics=None,
        detailed_analysis=None,
        llm_used=False,
        llm_confidence=0.0,
        llm_reasoning=None,
    ):
        self.repository_url = repository_url
        self.branch = branch
        self.analysis_approach = analysis_approach
        self.processing_time = processing_time
        self.confidence_score = confidence_score
        self.confidence_level = confidence_level
        self.technology_stack = technology_stack
        self.detected_files = detected_files
        self.recommendations = recommendations
        self.suggestions = suggestions
        self.quality_metrics = quality_metrics
        self.security_metrics = security_metrics
        self.detailed_analysis = detailed_analysis or {}
        self.llm_used = llm_used
        self.llm_confidence = llm_confidence
        self.llm_reasoning = llm_reasoning

    class TechnologyStack:
        def __init__(
            self,
            language,
            framework,
            database,
            build_tool,
            package_manager,
            runtime_version,
            additional_technologies,
            architecture_pattern,
            deployment_strategy,
        ):
            self.language = language
            self.framework = framework
            self.database = database
            self.build_tool = build_tool
            self.package_manager = package_manager
            self.runtime_version = runtime_version
            self.additional_technologies = additional_technologies
            self.architecture_pattern = architecture_pattern
            self.deployment_strategy = deployment_strategy

    technology_stack = TechnologyStack(
        language="Python",
        framework="FastAPI",
        database="PostgreSQL",
        build_tool="Docker",
        package_manager="pip",
        runtime_version="3.9",
        additional_technologies=["Redis", "Celery"],
        architecture_pattern="Microservices",
        deployment_strategy="Kubernetes",
    )
