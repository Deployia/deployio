"""
Base Optimizer - Abstract base class for all optimization engines
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
from dataclasses import dataclass


@dataclass
class OptimizationSuggestion:
    """Optimization suggestion with impact assessment"""

    type: str
    title: str
    description: str
    priority: str  # "high", "medium", "low"
    impact_level: str  # "significant", "moderate", "minor"
    effort_required: str  # "low", "medium", "high"
    implementation_steps: List[str]
    expected_benefit: str
    technical_details: Dict[str, Any] = None


@dataclass
class OptimizationResult:
    """Result of optimization analysis"""

    overall_score: float
    suggestions: List[OptimizationSuggestion]
    priority_actions: List[str]
    estimated_improvements: Dict[str, str]
    optimization_areas: List[str]


class BaseOptimizer(ABC):
    """
    Abstract base class for optimization engines
    """

    @abstractmethod
    async def optimize(
        self, analysis_result: Dict[str, Any], preferences: Dict[str, Any] = None
    ) -> OptimizationResult:
        """
        Perform optimization analysis

        Args:
            analysis_result: Results from repository analysis
            preferences: User preferences and constraints

        Returns:
            OptimizationResult: Optimization suggestions and recommendations
        """
        pass

    @abstractmethod
    def get_optimization_type(self) -> str:
        """Return the type of optimization this engine provides"""
        pass
