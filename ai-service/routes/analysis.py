"""
Analysis Routes - Clean API endpoints for repository analysis
Uses server-provided repository data architecture only
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
    AnalysisTimeoutException,
    LLMServiceException,
    RateLimitExceededException,
    InsufficientDataException,
)
from middleware.auth import (
    AuthUser,
    validate_demo_or_user_token,
)

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter()


# Request Models
class RepositoryAnalysisRequest(BaseModel):
    """Request model for repository analysis using server-provided data"""

    repository_data: Dict[str, Any]
    session_id: Optional[str] = None
    analysis_types: Optional[List[str]] = None  # ["stack", "dependencies", "quality"]
    force_llm_enhancement: bool = False
    include_reasoning: bool = True
    include_recommendations: bool = True
    include_insights: bool = True
    explain_null_fields: bool = True


class StackDetectionRequest(BaseModel):
    """Request model for technology stack detection only"""

    repository_data: Dict[str, Any]
    session_id: Optional[str] = None
    force_llm_enhancement: bool = False
    include_reasoning: bool = True
    explain_null_fields: bool = True


class CodeQualityRequest(BaseModel):
    """Request model for code quality analysis only"""

    repository_data: Dict[str, Any]
    session_id: Optional[str] = None
    include_reasoning: bool = True
    explain_null_fields: bool = True


class DependencyAnalysisRequest(BaseModel):
    """Request model for dependency analysis only"""

    repository_data: Dict[str, Any]
    session_id: Optional[str] = None
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
    repository_name: str
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
    # Basic information
    repository_name: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str

    # Stack-specific results
    technology_stack: Dict
    detected_files: List[str]
    primary_language: Optional[str] = None
    framework: Optional[str] = None
    build_tools: List[str] = []
    package_managers: List[str] = []

    # Architecture insights
    architecture_pattern: Optional[str] = None
    deployment_suggestions: List[str] = []

    # Enhanced insights
    insights: List[InsightModel] = []
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = {}

    # LLM enhancement info
    llm_used: bool = False
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None

    # Progress tracking
    analysis_id: Optional[str] = None


class CodeQualityResponse(BaseModel):
    # Basic information
    repository_name: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str

    # Code quality metrics
    quality_score: float
    total_files_analyzed: int
    total_lines_of_code: int
    average_complexity: float
    code_smells: List[Dict] = []

    # Issues and suggestions
    quality_issues: List[Dict] = []
    refactoring_suggestions: List[str] = []
    best_practices: List[str] = []

    # Enhanced insights
    insights: List[InsightModel] = []
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = {}

    # LLM enhancement info
    llm_used: bool = False
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None

    # Progress tracking
    analysis_id: Optional[str] = None


class DependencyAnalysisResponse(BaseModel):
    # Basic information
    repository_name: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str

    # Dependency information
    total_dependencies: int
    direct_dependencies: int
    transitive_dependencies: int
    package_managers: List[str] = []

    # Security and health
    vulnerable_packages: List[Dict] = []
    outdated_packages: List[Dict] = []
    license_issues: List[Dict] = []
    dependency_health_score: float

    # Insights and recommendations
    optimization_suggestions: List[str] = []
    security_recommendations: List[str] = []

    # Enhanced insights
    insights: List[InsightModel] = []
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = {}

    # LLM enhancement info
    llm_used: bool = False
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None

    # Progress tracking
    analysis_id: Optional[str] = None


# Authentication dependency
async def validate_internal_request(
    authorization: str = Depends(validate_demo_or_user_token),
) -> AuthUser:
    """Validate internal requests from server"""
    return authorization


# API Endpoints
@router.post("/analyze-repository", response_model=ResponseModel[AnalysisResponse])
async def analyze_repository(
    request: RepositoryAnalysisRequest,
    auth_user: AuthUser = Depends(validate_internal_request),
):
    """
    Complete repository analysis with detailed insights

    Provides comprehensive analysis including:
    - Technology stack detection with detailed reasoning
    - Dependency analysis with security insights
    - Code quality assessment with recommendations
    - Detailed insights with evidence and confidence scoring

    Uses server-provided repository data (no direct GitHub calls)
    """
    # Extract repository name from data
    repo_metadata = request.repository_data.get("metadata", {})
    repository_name = repo_metadata.get("full_name", "unknown")

    logger.info(f"Repository analysis request for {repository_name} from {auth_user}")

    try:
        # Delegate to service
        result = await analysis_service.analyze_repository(
            repository_data=request.repository_data,
            session_id=request.session_id,
            analysis_types=request.analysis_types,
            force_llm=request.force_llm_enhancement,
            include_reasoning=request.include_reasoning,
            include_recommendations=request.include_recommendations,
            include_insights=request.include_insights,
            explain_null_fields=request.explain_null_fields,
        )

        logger.info(f"Repository analysis completed successfully for {repository_name}")
        return ResponseModel(
            success=True,
            message="Repository analysis completed successfully",
            data=AnalysisResponse(**result),
        )

    except AnalysisTimeoutException as e:
        logger.error(f"Analysis timeout: {repository_name}")
        raise HTTPException(status_code=408, detail=e.message)

    except LLMServiceException as e:
        logger.error(f"LLM service error: {repository_name}")
        raise HTTPException(status_code=503, detail=e.message)

    except RateLimitExceededException as e:
        logger.error(f"Rate limit exceeded: {repository_name}")
        raise HTTPException(status_code=429, detail=e.message)

    except InsufficientDataException as e:
        logger.error(f"Insufficient data: {repository_name}")
        raise HTTPException(status_code=422, detail=e.message)

    except AnalysisException as e:
        logger.error(f"Analysis error: {repository_name}")
        raise HTTPException(status_code=e.status_code, detail=e.message)

    except Exception as e:
        logger.error(
            f"Repository analysis failed for {repository_name}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500, detail="Internal server error during analysis"
        )


@router.get("/analysis/{analysis_id}/status")
async def get_analysis_status(
    analysis_id: str,
    auth_user: AuthUser = Depends(validate_internal_request),
):
    """
    Get the status of a running analysis

    Returns current progress and status information
    """
    try:
        status = await progress_service.get_analysis_status(analysis_id)
        return ResponseModel(
            success=True,
            message="Analysis status retrieved successfully",
            data=status,
        )

    except Exception as e:
        logger.error(f"Failed to get analysis status for {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=404, detail="Analysis not found or status unavailable"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the analysis service
    """
    return ResponseModel(
        success=True,
        message="Analysis service is healthy",
        data={"status": "ok", "service": "ai-analysis"},
    )


@router.post("/detect-stack", response_model=ResponseModel[StackDetectionResponse])
async def detect_technology_stack(
    request: StackDetectionRequest,
    auth_user: AuthUser = Depends(validate_internal_request),
):
    """
    Technology stack detection only

    Provides focused analysis of:
    - Programming languages and versions
    - Frameworks and libraries
    - Build tools and package managers
    - Architecture patterns and deployment suggestions
    """
    repo_metadata = request.repository_data.get("metadata", {})
    repository_name = repo_metadata.get("full_name", "unknown")

    logger.info(f"Stack detection request for {repository_name} from {auth_user}")

    try:
        result = await analysis_service.analyze_repository(
            repository_data=request.repository_data,
            session_id=request.session_id,
            analysis_types=["stack"],
            force_llm=request.force_llm_enhancement,
            include_reasoning=request.include_reasoning,
            include_recommendations=True,
            include_insights=True,
            explain_null_fields=request.explain_null_fields,
        )

        logger.info(f"Stack detection completed successfully for {repository_name}")
        return ResponseModel(
            success=True,
            message="Technology stack detection completed successfully",
            data=StackDetectionResponse(**result),
        )

    except AnalysisTimeoutException as e:
        logger.error(f"Stack analysis timeout: {repository_name}")
        raise HTTPException(status_code=408, detail=e.message)

    except LLMServiceException as e:
        logger.error(f"LLM service error during stack detection: {repository_name}")
        raise HTTPException(status_code=503, detail=e.message)

    except AnalysisException as e:
        logger.error(f"Stack detection error: {repository_name}")
        raise HTTPException(status_code=e.status_code, detail=e.message)

    except Exception as e:
        logger.error(f"Stack detection failed for {repository_name}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Internal server error during stack detection"
        )


@router.post("/analyze-code-quality", response_model=ResponseModel[CodeQualityResponse])
async def analyze_code_quality(
    request: CodeQualityRequest,
    auth_user: AuthUser = Depends(validate_internal_request),
):
    """
    Code quality analysis only

    Provides focused analysis of:
    - Code complexity and maintainability metrics
    - Code smells and quality issues
    - Refactoring suggestions and best practices
    - Technical debt assessment
    """
    repo_metadata = request.repository_data.get("metadata", {})
    repository_name = repo_metadata.get("full_name", "unknown")

    logger.info(f"Code quality analysis request for {repository_name} from {auth_user}")

    try:
        result = await analysis_service.analyze_repository(
            repository_data=request.repository_data,
            session_id=request.session_id,
            analysis_types=["quality"],
            force_llm=False,  # Code quality doesn't typically need LLM enhancement
            include_reasoning=request.include_reasoning,
            include_recommendations=True,
            include_insights=True,
            explain_null_fields=request.explain_null_fields,
        )

        logger.info(
            f"Code quality analysis completed successfully for {repository_name}"
        )
        return ResponseModel(
            success=True,
            message="Code quality analysis completed successfully",
            data=CodeQualityResponse(**result),
        )

    except AnalysisTimeoutException as e:
        logger.error(f"Code quality analysis timeout: {repository_name}")
        raise HTTPException(status_code=408, detail=e.message)

    except InsufficientDataException as e:
        logger.error(f"Insufficient data for code quality analysis: {repository_name}")
        raise HTTPException(status_code=422, detail=e.message)

    except AnalysisException as e:
        logger.error(f"Code quality analysis error: {repository_name}")
        raise HTTPException(status_code=e.status_code, detail=e.message)

    except Exception as e:
        logger.error(f"Code quality analysis failed for {repository_name}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Internal server error during code quality analysis"
        )


@router.post(
    "/analyze-dependencies", response_model=ResponseModel[DependencyAnalysisResponse]
)
async def analyze_dependencies(
    request: DependencyAnalysisRequest,
    auth_user: AuthUser = Depends(validate_internal_request),
):
    """
    Dependency analysis only

    Provides focused analysis of:
    - Package dependencies and versions
    - Security vulnerabilities and licensing issues
    - Outdated packages and optimization opportunities
    - Dependency health and risk assessment
    """
    repo_metadata = request.repository_data.get("metadata", {})
    repository_name = repo_metadata.get("full_name", "unknown")

    logger.info(f"Dependency analysis request for {repository_name} from {auth_user}")

    try:
        result = await analysis_service.analyze_repository(
            repository_data=request.repository_data,
            session_id=request.session_id,
            analysis_types=["dependencies"],
            force_llm=False,  # Dependency analysis is rule-based
            include_reasoning=request.include_reasoning,
            include_recommendations=True,
            include_insights=True,
            explain_null_fields=request.explain_null_fields,
        )

        logger.info(f"Dependency analysis completed successfully for {repository_name}")
        return ResponseModel(
            success=True,
            message="Dependency analysis completed successfully",
            data=DependencyAnalysisResponse(**result),
        )

    except AnalysisTimeoutException as e:
        logger.error(f"Dependency analysis timeout: {repository_name}")
        raise HTTPException(status_code=408, detail=e.message)

    except InsufficientDataException as e:
        logger.error(f"Insufficient data for dependency analysis: {repository_name}")
        raise HTTPException(status_code=422, detail=e.message)

    except AnalysisException as e:
        logger.error(f"Dependency analysis error: {repository_name}")
        raise HTTPException(status_code=e.status_code, detail=e.message)

    except Exception as e:
        logger.error(f"Dependency analysis failed for {repository_name}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Internal server error during dependency analysis"
        )
