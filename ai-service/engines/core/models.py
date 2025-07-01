"""
Core data models for the AI analysis engine
Clean, standardized data structures with enhanced insights and reasoning
Comprehensive redesign for consistency across all components
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime


class AnalysisType(Enum):
    """Types of analysis that can be performed"""

    STACK_DETECTION = "stack_detection"
    CODE_QUALITY = "code_quality"
    DEPENDENCY_ANALYSIS = "dependency_analysis"
    SECURITY_SCAN = "security_scan"
    PERFORMANCE_ANALYSIS = "performance_analysis"


class ConfidenceLevel(Enum):
    """Confidence levels for analysis results"""

    VERY_LOW = "very_low"  # 0-40%
    LOW = "low"  # 40-60%
    MEDIUM = "medium"  # 60-80%
    HIGH = "high"  # 80-95%
    VERY_HIGH = "very_high"  # 95-100%


class ProgressStatus(Enum):
    """Status of analysis progress"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# ============= Core Technology and Infrastructure Models =============


@dataclass
class TechnologyStack:
    """Detected technology stack information"""

    # Primary technology identification
    language: Optional[str] = None
    framework: Optional[str] = None
    database: Optional[str] = None
    type: Optional[str] = None

    # Enhanced fields
    confidence: Optional[float] = None
    version: Optional[str] = None
    detection_method: Optional[str] = None

    # Build and deployment tools
    build_tool: Optional[str] = None
    package_manager: Optional[str] = None
    runtime_version: Optional[str] = None

    # Additional technologies
    additional_technologies: List[str] = field(default_factory=list)

    # Architecture patterns
    architecture_pattern: Optional[str] = None

    # Deployment information
    deployment_strategy: Optional[str] = None

    # Name field added to support stack_analyzer usage
    name: Optional[str] = None

    @property
    def primary_language(self) -> Optional[str]:
        """Backwards compatibility property for primary_language"""
        return self.language

    @primary_language.setter
    def primary_language(self, value: Optional[str]):
        """Backwards compatibility setter for primary_language"""
        self.language = value


@dataclass
class DependencyInfo:
    """Individual dependency information"""

    name: str
    version: Optional[str] = None
    type: str = "dependency"  # dependency, dev_dependency, peer_dependency
    manager: Optional[str] = None  # npm, pip, composer, etc.
    is_vulnerable: bool = False
    is_outdated: bool = False
    latest_version: Optional[str] = None
    vulnerabilities: List[Dict[str, Any]] = field(default_factory=list)
    license: Optional[str] = None

    # Additional fields used by dependency analyzer
    dev_dependency: bool = False
    package_manager: Optional[str] = None
    file_source: Optional[str] = None
    transitive: bool = False
    vulnerability_level: Optional[str] = None  # critical, high, medium, low
    scope: Optional[str] = None
    optional: bool = False


@dataclass
class DependencyAnalysis:
    """Complete dependency analysis results"""

    total_dependencies: int = 0
    direct_dependencies: int = 0
    transitive_dependencies: int = 0
    dev_dependencies: int = 0  # Added missing field
    package_managers: List[str] = field(default_factory=list)
    dependencies: List[DependencyInfo] = field(default_factory=list)

    # Security metrics
    vulnerable_count: int = 0  # Keep for backwards compatibility
    security_vulnerabilities: int = 0  # Used by analyzer
    total_vulnerabilities: int = 0
    critical_vulnerabilities: int = 0
    high_vulnerabilities: int = 0
    medium_vulnerabilities: int = 0
    low_vulnerabilities: int = 0

    # Update metrics
    outdated_count: int = 0  # Keep for backwards compatibility
    outdated_dependencies: int = 0  # Used by analyzer
    major_updates_available: int = 0

    # License metrics
    license_issues: int = 0
    incompatible_licenses: List[str] = field(default_factory=list)

    # Scores and analysis
    health_score: float = 0.0
    confidence_score: float = 0.0
    optimization_score: float = 0.0

    # Categories and metadata
    dependency_categories: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)

    # Recommendations
    security_recommendations: List[str] = field(default_factory=list)
    optimization_suggestions: List[str] = field(default_factory=list)


@dataclass
class QualityMetrics:
    """Code quality metrics"""

    total_files_analyzed: int = 0
    total_lines_of_code: int = 0
    average_complexity: float = 0.0
    quality_score: float = 0.0
    code_smells: List[Dict[str, Any]] = field(default_factory=list)
    test_coverage: Optional[float] = None
    maintainability_index: Optional[float] = None
    technical_debt_hours: Optional[float] = None
    duplication_percentage: Optional[float] = None


@dataclass
class SecurityMetrics:
    """Security analysis metrics"""

    vulnerability_count: int = 0
    critical_vulnerabilities: int = 0
    high_vulnerabilities: int = 0
    medium_vulnerabilities: int = 0
    low_vulnerabilities: int = 0
    security_score: float = 0.0
    recommendations: List[str] = field(default_factory=list)


@dataclass
class AnalysisInsight:
    """Individual analysis insight"""

    category: str
    title: str
    description: str
    confidence: float
    evidence: List[str] = field(default_factory=list)
    impact: str = "medium"  # low, medium, high, critical
    actionable: bool = True


# ============= Unified Analysis Result Model =============


@dataclass
class AnalysisResult:
    """
    Unified analysis result container for all analysis operations
    This is the primary data structure used throughout the system
    """

    # ===== Basic Information =====
    repository_url: str = ""
    repository_name: str = ""
    branch: str = "main"
    analysis_id: Optional[str] = None

    # ===== Core Analysis Results =====
    technology_stack: TechnologyStack = field(default_factory=TechnologyStack)
    dependency_analysis: Optional[DependencyAnalysis] = None
    quality_metrics: Optional[QualityMetrics] = None
    security_metrics: Optional[SecurityMetrics] = None

    # ===== Confidence and Scoring =====
    confidence_score: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.LOW

    # ===== Analysis Metadata =====
    analysis_approach: str = "rule_based"  # rule_based, llm_enhanced, hybrid
    processing_time: float = 0.0
    detected_files: List[str] = field(default_factory=list)
    analysis_types: List[AnalysisType] = field(default_factory=list)

    # ===== Enhanced Insights and Reasoning =====
    insights: List[AnalysisInsight] = field(default_factory=list)
    recommendations: List[Dict[str, Any]] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    reasoning: str = ""
    thought_process: str = ""
    null_field_explanations: Dict[str, str] = field(default_factory=dict)

    # ===== LLM Enhancement Data =====
    llm_used: bool = False
    llm_provider: Optional[str] = None
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None

    # ===== Progress and Timing =====
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    analysis_steps: List[str] = field(default_factory=list)

    # ===== Additional Data for Generators/Optimizers =====
    file_tree: List[Dict[str, Any]] = field(default_factory=list)
    key_files: Dict[str, str] = field(default_factory=dict)
    detailed_analysis: Dict[str, Any] = field(default_factory=dict)

    # ===== Error Handling =====
    error_message: Optional[str] = None
    warnings: List[str] = field(default_factory=list)

    def add_insight(self, insight: AnalysisInsight):
        """Add an insight to the analysis result"""
        self.insights.append(insight)

    def add_warning(self, warning: str):
        """Add a warning message"""
        self.warnings.append(warning)

    def explain_null_field(self, field_name: str, explanation: str):
        """Add explanation for why a field is null/empty"""
        self.null_field_explanations[field_name] = explanation

    def get_primary_language(self) -> Optional[str]:
        """Get the primary language from technology stack"""
        return self.technology_stack.language if self.technology_stack else None

    def get_primary_framework(self) -> Optional[str]:
        """Get the primary framework from technology stack"""
        return self.technology_stack.framework if self.technology_stack else None

    def has_vulnerabilities(self) -> bool:
        """Check if any vulnerabilities were found"""
        if self.dependency_analysis:
            return self.dependency_analysis.vulnerable_count > 0
        if self.security_metrics:
            return self.security_metrics.vulnerability_count > 0
        return False

    def get_quality_score(self) -> float:
        """Get overall quality score"""
        if self.quality_metrics:
            return self.quality_metrics.quality_score
        return 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "repository_url": self.repository_url,
            "repository_name": self.repository_name,
            "branch": self.branch,
            "analysis_id": self.analysis_id,
            "technology_stack": (
                {
                    "language": self.technology_stack.language,
                    "framework": self.technology_stack.framework,
                    "database": self.technology_stack.database,
                    "version": self.technology_stack.version,
                    "confidence": self.technology_stack.confidence,
                    "detection_method": self.technology_stack.detection_method,
                    "build_tool": self.technology_stack.build_tool,
                    "package_manager": self.technology_stack.package_manager,
                    "additional_technologies": self.technology_stack.additional_technologies,
                    "architecture_pattern": self.technology_stack.architecture_pattern,
                    "deployment_strategy": self.technology_stack.deployment_strategy,
                }
                if self.technology_stack
                else {}
            ),
            "dependency_analysis": (
                {
                    "total_dependencies": self.dependency_analysis.total_dependencies,
                    "vulnerable_count": self.dependency_analysis.vulnerable_count,
                    "outdated_count": self.dependency_analysis.outdated_count,
                    "health_score": self.dependency_analysis.health_score,
                    "package_managers": self.dependency_analysis.package_managers,
                    "security_recommendations": self.dependency_analysis.security_recommendations,
                }
                if self.dependency_analysis
                else None
            ),
            "quality_metrics": (
                {
                    "total_files_analyzed": self.quality_metrics.total_files_analyzed,
                    "total_lines_of_code": self.quality_metrics.total_lines_of_code,
                    "quality_score": self.quality_metrics.quality_score,
                    "average_complexity": self.quality_metrics.average_complexity,
                    "code_smells": len(self.quality_metrics.code_smells),
                }
                if self.quality_metrics
                else None
            ),
            "confidence_score": self.confidence_score,
            "confidence_level": self.confidence_level.value,
            "analysis_approach": self.analysis_approach,
            "processing_time": self.processing_time,
            "detected_files": self.detected_files,
            "insights": [
                {
                    "category": insight.category,
                    "title": insight.title,
                    "description": insight.description,
                    "confidence": insight.confidence,
                    "impact": insight.impact,
                    "actionable": insight.actionable,
                }
                for insight in self.insights
            ],
            "recommendations": self.recommendations,
            "suggestions": self.suggestions,
            "reasoning": self.reasoning,
            "llm_used": self.llm_used,
            "llm_confidence": self.llm_confidence,
            "llm_reasoning": self.llm_reasoning,
            "error_message": self.error_message,
            "warnings": self.warnings,
        }


# ============= LLM Enhancement Models =============


@dataclass
class LLMEnhancementResult:
    """Result from LLM enhancement process"""

    enhanced_stack: Optional[TechnologyStack] = None
    recommendations: List[Dict[str, Any]] = field(default_factory=list)
    insights: List[AnalysisInsight] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    reasoning: str = ""
    confidence_improvement: float = 0.0
    llm_enhanced: bool = False
    llm_provider: Optional[str] = None
    processing_time: float = 0.0


# ============= Request Configuration Models =============


@dataclass
class AnalysisConfiguration:
    """Configuration for analysis operations"""

    # Analysis types to perform
    analysis_types: List[AnalysisType] = field(
        default_factory=lambda: [
            AnalysisType.STACK_DETECTION,
            AnalysisType.DEPENDENCY_ANALYSIS,
            AnalysisType.CODE_QUALITY,
        ]
    )

    # LLM enhancement settings
    force_llm: bool = False
    llm_provider: Optional[str] = None

    # Output customization
    include_reasoning: bool = True
    include_recommendations: bool = True
    include_insights: bool = True
    explain_null_fields: bool = True

    # Progress and streaming
    progress_callback_url: Optional[str] = None
    stream_progress: bool = False

    # Analysis customization
    options: Dict[str, Any] = field(default_factory=dict)
    max_file_size: int = 1024 * 1024  # 1MB default
    timeout_seconds: int = 300  # 5 minutes default


# ============= Helper Functions =============


def calculate_weighted_confidence(scores: List[float], weights: List[float]) -> float:
    """Calculate weighted average confidence score"""
    if len(scores) != len(weights):
        raise ValueError("Scores and weights must have the same length")

    if not scores:
        return 0.0

    weighted_sum = sum(score * weight for score, weight in zip(scores, weights))
    total_weight = sum(weights)

    return min(weighted_sum / total_weight, 1.0) if total_weight > 0 else 0.0


def get_confidence_level(score: float) -> ConfidenceLevel:
    """Convert numeric confidence score to confidence level"""
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


def create_analysis_insight(
    category: str,
    title: str,
    description: str,
    confidence: float,
    evidence: List[str] = None,
    impact: str = "medium",
    actionable: bool = True,
) -> AnalysisInsight:
    """Helper function to create analysis insights"""
    return AnalysisInsight(
        category=category,
        title=title,
        description=description,
        confidence=confidence,
        evidence=evidence or [],
        impact=impact,
        actionable=actionable,
    )


def create_technology_stack(
    language: str = None, framework: str = None, confidence: float = 0.0, **kwargs
) -> TechnologyStack:
    """Helper function to create technology stack"""
    return TechnologyStack(
        language=language, framework=framework, confidence=confidence, **kwargs
    )


# ============= Legacy Compatibility =============
# These are kept for backwards compatibility during migration


@dataclass
class QualityIssue:
    """Legacy quality issue model"""

    file_path: str
    line_number: int
    issue_type: str
    description: str
    severity: str = "medium"


@dataclass
class CodeMetrics:
    """Legacy code metrics model"""

    lines_of_code: int = 0
    complexity_score: float = 0.0
    maintainability_index: float = 0.0
    quality_score: float = 0.0


@dataclass
class CodeAnalysis:
    """Legacy code analysis model - use QualityMetrics instead"""

    total_files: int = 0
    total_lines: int = 0
    average_complexity: float = 0.0
    quality_score: float = 0.0
    quality_issues: List[QualityIssue] = field(default_factory=list)
    metrics: Optional[CodeMetrics] = None

    def __post_init__(self):
        import warnings

        warnings.warn(
            "CodeAnalysis is deprecated, use QualityMetrics instead",
            DeprecationWarning,
            stacklevel=2,
        )


@dataclass
class DependencyAnalysisLegacy:
    """Legacy dependency analysis model - use DependencyAnalysis instead"""

    def __post_init__(self):
        import warnings

        warnings.warn(
            "DependencyAnalysisLegacy is deprecated, use DependencyAnalysis instead",
            DeprecationWarning,
            stacklevel=2,
        )
