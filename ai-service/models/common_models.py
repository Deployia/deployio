"""
Common Models - Shared enums and basic models
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime


class AnalysisType(Enum):
    """Types of analysis that can be performed"""
    STACK_DETECTION = "stack"
    DEPENDENCY_ANALYSIS = "dependencies" 
    CODE_ANALYSIS = "code"


class ConfidenceLevel(Enum):
    """Confidence levels for analysis results"""
    VERY_LOW = "very_low"    # 0-40%
    LOW = "low"              # 40-60%
    MEDIUM = "medium"        # 60-80%
    HIGH = "high"            # 80-95%
    VERY_HIGH = "very_high"  # 95-100%


class InsightModel(BaseModel):
    """Individual insight from analysis"""
    category: str
    title: str
    description: str
    confidence: float
    evidence: List[str] = []
    impact: str = "medium"  # low, medium, high, critical
    actionable: bool = True


class RecommendationModel(BaseModel):
    """Actionable recommendation"""
    type: str
    priority: str  # low, medium, high, critical
    title: str
    description: str
    reasoning: str
    implementation: Optional[str] = None


class SuggestionModel(BaseModel):
    """Simple suggestion"""
    type: str
    priority: str
    suggestion: str
    reason: str


def get_confidence_level(score: float) -> ConfidenceLevel:
    """Convert confidence score to level"""
    if score >= 0.95:
        return ConfidenceLevel.VERY_HIGH
    elif score >= 0.80:
        return ConfidenceLevel.HIGH
    elif score >= 0.60:
        return ConfidenceLevel.MEDIUM
    elif score >= 0.40:
        return ConfidenceLevel.LOW
    else:
        return ConfidenceLevel.VERY_LOW
