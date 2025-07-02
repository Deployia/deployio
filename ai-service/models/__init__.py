"""
Clean Data Models Package
Unified data structures for the entire AI analysis pipeline
"""

from .analysis_models import (
    AnalysisRequest,
    AnalysisResult,
    TechnologyStack,
    DependencyAnalysis,
    CodeAnalysis,
    BuildConfiguration,
    DeploymentConfiguration,
)
from .response_models import (
    ResponseModel,
    AnalysisResponse,
    ErrorResponse,
)
from .common_models import (
    ConfidenceLevel,
    AnalysisType,
    InsightModel,
    RecommendationModel,
    SuggestionModel,
)

__all__ = [
    # Analysis Models
    "AnalysisRequest",
    "AnalysisResult",
    "TechnologyStack",
    "DependencyAnalysis", 
    "CodeAnalysis",
    "BuildConfiguration",
    "DeploymentConfiguration",
    
    # Response Models
    "ResponseModel",
    "AnalysisResponse",
    "ErrorResponse",
    
    # Common Models
    "ConfidenceLevel",
    "AnalysisType", 
    "InsightModel",
    "RecommendationModel",
    "SuggestionModel",
]
