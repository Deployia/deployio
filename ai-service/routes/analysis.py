"""
Clean Analysis Routes
Simplified, focused API endpoints for repository analysis
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, List, Optional
from pydantic import BaseModel

from models.response import ResponseModel
from engines.core.detector import UnifiedDetectionEngine
from engines.core.models import AnalysisType, AnalysisResult

router = APIRouter()

# Initialize the unified detection engine
detection_engine = UnifiedDetectionEngine()


# Request/Response Models
class RepositoryAnalysisRequest(BaseModel):
    repository_url: str
    branch: str = "main"
    analysis_types: Optional[List[str]] = None  # ["stack", "dependencies", "quality"]
    force_llm_enhancement: bool = False


class CodeQualityRequest(BaseModel):
    repository_url: str
    branch: str = "main"


class StackDetectionRequest(BaseModel):
    repository_url: str
    branch: str = "main"


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
    suggestions: List[str]

    # Optional detailed results
    quality_metrics: Optional[Dict] = None
    security_metrics: Optional[Dict] = None
    dependency_analysis: Optional[Dict] = None

    # LLM enhancement info
    llm_used: bool = False
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None


# Dedicated response models for each analysis type
class StackDetectionResponse(BaseModel):
    repository_url: str
    branch: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str
    technology_stack: Dict
    detected_files: List[str]


class DependencyAnalysisResponse(BaseModel):
    repository_url: str
    branch: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str
    dependency_analysis: Dict
    recommendations: List[Dict]
    suggestions: List[str]


class CodeQualityResponse(BaseModel):
    repository_url: str
    branch: str
    analysis_approach: str
    processing_time: float
    confidence_score: float
    confidence_level: str
    quality_metrics: Dict
    recommendations: List[Dict]
    suggestions: List[str]


# Simple header validation for internal service communication
def validate_internal_request(x_internal_service: Optional[str] = Header(None)):
    """Validate that request comes from authorized internal service"""
    if not x_internal_service or x_internal_service != "deployio-backend":
        raise HTTPException(
            status_code=403, detail="Access denied: Internal service only"
        )
    return x_internal_service


@router.post("/analyze-repository", response_model=ResponseModel[AnalysisResponse])
async def analyze_repository(
    request: RepositoryAnalysisRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Complete repository analysis including stack detection, dependencies, and code quality

    This is the main analysis endpoint that provides comprehensive insights
    """
    try:
        # Convert analysis types from strings to enums
        analysis_types = []
        if request.analysis_types:
            type_mapping = {
                "stack": AnalysisType.STACK_DETECTION,
                "dependencies": AnalysisType.DEPENDENCY_ANALYSIS,
                "quality": AnalysisType.CODE_QUALITY,
                "security": AnalysisType.SECURITY_SCAN,
            }

            for type_str in request.analysis_types:
                if type_str in type_mapping:
                    analysis_types.append(type_mapping[type_str])

        # Perform analysis
        result = await detection_engine.analyze_repository(
            repository_url=request.repository_url,
            branch=request.branch,
            analysis_types=analysis_types if analysis_types else None,
            force_llm=request.force_llm_enhancement,
        )

        # Convert to response format
        response = _convert_to_response(result, mode="full")

        return ResponseModel(
            success=True,
            message="Repository analysis completed successfully",
            data=response,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Repository analysis failed: {str(e)}"
        )


@router.post("/analyze-code-quality", response_model=ResponseModel[CodeQualityResponse])
async def analyze_code_quality(
    request: CodeQualityRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Code quality analysis only - faster operation for quality checks
    """
    try:
        result = await detection_engine.analyze_code_quality_only(
            repository_url=request.repository_url, branch=request.branch
        )

        response = _convert_to_response(result, mode="quality")

        return ResponseModel(
            success=True,
            message="Code quality analysis completed successfully",
            data=response,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Code quality analysis failed: {str(e)}"
        )


@router.post("/detect-stack", response_model=ResponseModel[StackDetectionResponse])
async def detect_technology_stack(
    request: StackDetectionRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Technology stack detection only - fastest operation for stack identification
    """
    try:
        result = await detection_engine.analyze_stack_only(
            repository_url=request.repository_url, branch=request.branch
        )

        response = _convert_to_response(result, mode="stack")

        return ResponseModel(
            success=True,
            message="Technology stack detection completed successfully",
            data=response,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stack detection failed: {str(e)}")


@router.post(
    "/analyze-dependencies", response_model=ResponseModel[DependencyAnalysisResponse]
)
async def analyze_dependencies(
    request: RepositoryAnalysisRequest,
    internal_service: str = Depends(validate_internal_request),
):
    """
    Dependency analysis for a repository (only dependency analysis)
    """
    try:
        result = await detection_engine.analyze_repository(
            repository_url=request.repository_url,
            branch=request.branch,
            analysis_types=[AnalysisType.DEPENDENCY_ANALYSIS],
            force_llm=request.force_llm_enhancement,
        )
        response = _convert_to_response(result, mode="dependency")
        return ResponseModel(
            success=True,
            message="Dependency analysis completed successfully",
            data=response,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Dependency analysis failed: {str(e)}"
        )


@router.get(
    "/supported-technologies", response_model=ResponseModel[Dict[str, List[str]]]
)
async def get_supported_technologies(
    internal_service: str = Depends(validate_internal_request),
):
    """
    Get list of all supported technologies across all analyzers
    """
    try:
        technologies = await detection_engine.get_supported_technologies()

        return ResponseModel(
            success=True,
            message="Supported technologies retrieved successfully",
            data=technologies,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve supported technologies: {str(e)}",
        )


@router.get("/health", response_model=ResponseModel[Dict[str, str]])
async def health_check():
    """
    Health check for the analysis engine and all its components
    """
    try:
        health_status = await detection_engine.health_check()

        # Determine overall health
        overall_healthy = all(
            status == "healthy" or status == "unavailable"
            for status in health_status.values()
        )

        return ResponseModel(
            success=overall_healthy,
            message="Health check completed",
            data=health_status,
        )

    except Exception as e:
        return ResponseModel(
            success=False,
            message=f"Health check failed: {str(e)}",
            data={"engine": "error", "error": str(e)},
        )


# Helper function to convert AnalysisResult to AnalysisResponse
def _convert_to_response(result: AnalysisResult, mode: str = "full"):
    """Convert internal AnalysisResult to API response format, with error handling and mode"""
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(
            status_code=500, detail=f"Stack detection failed: {result['error']}"
        )

    # Convert technology stack to dict
    tech_stack = {
        "language": result.technology_stack.language,
        "framework": result.technology_stack.framework,
        "database": result.technology_stack.database,
        "build_tool": result.technology_stack.build_tool,
        "package_manager": result.technology_stack.package_manager,
        "runtime_version": result.technology_stack.runtime_version,
        "additional_technologies": result.technology_stack.additional_technologies,
        "architecture_pattern": result.technology_stack.architecture_pattern,
        "deployment_strategy": result.technology_stack.deployment_strategy,
    }

    if mode == "stack":
        return StackDetectionResponse(
            repository_url=result.repository_url,
            branch=result.branch,
            analysis_approach=result.analysis_approach,
            processing_time=result.processing_time,
            confidence_score=result.confidence_score,
            confidence_level=result.confidence_level.value,
            technology_stack=tech_stack,
            detected_files=result.detected_files,
        )
    elif mode == "dependency":
        return DependencyAnalysisResponse(
            repository_url=result.repository_url,
            branch=result.branch,
            analysis_approach=result.analysis_approach,
            processing_time=result.processing_time,
            confidence_score=result.confidence_score,
            confidence_level=result.confidence_level.value,
            dependency_analysis=result.detailed_analysis.get("dependency_analysis"),
            recommendations=result.recommendations,
            suggestions=result.suggestions,
        )
    elif mode == "quality":
        return CodeQualityResponse(
            repository_url=result.repository_url,
            branch=result.branch,
            analysis_approach=result.analysis_approach,
            processing_time=result.processing_time,
            confidence_score=result.confidence_score,
            confidence_level=result.confidence_level.value,
            quality_metrics=result.quality_metrics,
            recommendations=result.recommendations,
            suggestions=result.suggestions,
        )
    else:  # full
        return AnalysisResponse(
            repository_url=result.repository_url,
            branch=result.branch,
            analysis_approach=result.analysis_approach,
            processing_time=result.processing_time,
            confidence_score=result.confidence_score,
            confidence_level=result.confidence_level.value,
            technology_stack=tech_stack,
            detected_files=result.detected_files,
            recommendations=result.recommendations,
            suggestions=result.suggestions,
            quality_metrics=result.quality_metrics,
            security_metrics=result.security_metrics,
            dependency_analysis=result.detailed_analysis.get("dependency_analysis"),
            llm_used=result.llm_used,
            llm_confidence=result.llm_confidence,
            llm_reasoning=result.llm_reasoning,
        )
