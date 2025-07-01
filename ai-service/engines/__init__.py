"""
Engines Package - Modular AI Analysis System
Clean, maintainable, and highly accurate AI engines
"""

from .core.detector import UnifiedDetectionEngine
from .core.models import (
    AnalysisResult,
    AnalysisType,
    TechnologyStack,
    ConfidenceLevel,
    DependencyAnalysis,
    QualityMetrics,
)
from .optimizers.base_optimizer import OptimizationSuggestion

__all__ = [
    "UnifiedDetectionEngine",
    "AnalysisResult",
    "AnalysisType",
    "TechnologyStack",
    "ConfidenceLevel",
    "DependencyAnalysis",
    "QualityMetrics",
    "OptimizationSuggestion",
]
