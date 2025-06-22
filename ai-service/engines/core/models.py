"""
Core data models for the AI analysis engine
Clean, standardized data structures
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum


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


@dataclass
class TechnologyStack:
    """Detected technology stack information"""

    # Primary technology identification
    language: Optional[str] = None
    framework: Optional[str] = None
    database: Optional[str] = None
    type: Optional[str] = None  # Added to support input dicts with 'type' key
    version: Optional[str] = None  # Added to support input dicts with 'version' key
    confidence: Optional[float] = (
        None  # Added to support input dicts with 'confidence' key
    )
    detection_method: Optional[str] = (
        None  # Added to support input dicts with 'detection_method' key
    )

    # Build and deployment tools
    build_tool: Optional[str] = None
    package_manager: Optional[str] = None
    runtime_version: Optional[str] = None

    # Additional technologies
    additional_technologies: List[str] = None

    # Architecture patterns
    architecture_pattern: Optional[str] = None

    # Deployment information
    deployment_strategy: Optional[str] = None

    # Name field added to support stack_analyzer usage
    name: Optional[str] = None

    def __post_init__(self):
        if self.additional_technologies is None:
            self.additional_technologies = []


@dataclass
class AnalysisResult:
    """Main result container for all analysis operations"""

    # Basic information
    repository_url: str
    branch: str
    analysis_type: AnalysisType

    # Core results
    technology_stack: TechnologyStack
    confidence_score: float
    confidence_level: ConfidenceLevel

    # Analysis details
    detected_files: List[str]
    analysis_approach: str  # "rule_based", "llm_enhanced", "hybrid"
    processing_time: float

    # Detailed results
    detailed_analysis: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    suggestions: List[str]

    # Quality metrics
    quality_metrics: Optional[Dict[str, Any]] = None
    security_metrics: Optional[Dict[str, Any]] = None
    performance_metrics: Optional[Dict[str, Any]] = None

    # LLM enhancement data
    llm_used: bool = False
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None

    def __post_init__(self):
        # Auto-calculate confidence level
        if self.confidence_score >= 0.95:
            self.confidence_level = ConfidenceLevel.VERY_HIGH
        elif self.confidence_score >= 0.80:
            self.confidence_level = ConfidenceLevel.HIGH
        elif self.confidence_score >= 0.60:
            self.confidence_level = ConfidenceLevel.MEDIUM
        elif self.confidence_score >= 0.40:
            self.confidence_level = ConfidenceLevel.LOW
        else:
            self.confidence_level = ConfidenceLevel.VERY_LOW


@dataclass
class DependencyInfo:
    """Information about a single dependency"""

    name: str
    version: Optional[str] = None
    ecosystem: str = "unknown"  # npm, pip, maven, etc.
    dependency_type: str = "production"  # production, development, peer

    # Security information
    has_vulnerabilities: bool = False
    vulnerability_count: int = 0
    severity_level: Optional[str] = None

    # Update information
    is_outdated: bool = False
    latest_version: Optional[str] = None

    # License information
    license_type: Optional[str] = None
    license_compatible: bool = True


@dataclass
class DependencyAnalysis:
    """Complete dependency analysis results"""

    # Dependency counts
    total_dependencies: int
    direct_dependencies: int  # Added to match analyzer usage
    dev_dependencies: int
    package_managers: List[str]
    dependencies: List["Dependency"]
    security_vulnerabilities: int
    outdated_dependencies: int
    dependency_categories: Dict[str, List[str]]
    metrics: Dict[str, Any]

    # Security analysis
    total_vulnerabilities: int
    critical_vulnerabilities: int
    high_vulnerabilities: int
    medium_vulnerabilities: int
    low_vulnerabilities: int

    # Update analysis
    major_updates_available: int

    # License analysis
    license_issues: int
    incompatible_licenses: List[str]

    # Optimization metrics
    optimization_score: float  # 0-100


@dataclass
class CodeQualityMetrics:
    """Code quality analysis results"""

    # Overall scores (0-100)
    overall_score: float
    maintainability_score: float
    reliability_score: float
    security_score: float

    # Code statistics
    total_lines: int
    code_lines: int
    comment_lines: int
    blank_lines: int

    # Issue counts
    critical_issues: int
    major_issues: int
    minor_issues: int
    info_issues: int

    # Test coverage
    test_coverage: Optional[float] = None
    has_tests: bool = False

    # Code smells
    code_smells: List[Dict[str, Any]] = None

    # Technical debt
    technical_debt_minutes: Optional[int] = None

    def __post_init__(self):
        if self.code_smells is None:
            self.code_smells = []


@dataclass
class GeneratedConfig:
    """Generated configuration content"""

    config_type: str  # "dockerfile", "github_actions", "docker_compose", etc.
    content: str
    filename: str

    # Generation metadata
    template_used: str
    optimization_level: str
    security_features: List[str]

    # Validation
    is_valid: bool = True
    validation_errors: List[str] = None

    # Instructions
    setup_instructions: List[str] = None
    usage_notes: List[str] = None

    def __post_init__(self):
        if self.validation_errors is None:
            self.validation_errors = []
        if self.setup_instructions is None:
            self.setup_instructions = []
        if self.usage_notes is None:
            self.usage_notes = []


@dataclass
class OptimizationSuggestion:
    """Single optimization suggestion"""

    # Basic information
    suggestion_type: str  # "performance", "security", "cost", "reliability"
    title: str
    description: str

    # Priority and impact
    priority: str  # "low", "medium", "high", "critical"
    impact_level: str  # "low", "medium", "high"
    effort_required: str  # "low", "medium", "high"

    # Implementation details
    implementation_steps: List[str]
    expected_benefit: str
    code_changes_required: bool = False
    config_changes_required: bool = False
    estimated_time_savings: Optional[str] = None
    estimated_cost_savings: Optional[str] = None

    # Technical details
    technical_details: Optional[Dict[str, Any]] = None


@dataclass
class StackDetectionResult:
    """Result of technology stack detection"""

    repository_url: str
    primary_stack: Any
    detected_technologies: Any
    analysis_metadata: dict


@dataclass
class Dependency:
    name: str
    version: str
    type: str
    dev_dependency: bool = False
    package_manager: str = "unknown"
    file_source: str = ""
    optional: bool = False
    transitive: bool = False  # Added to match analyzer usage


@dataclass
class QualityIssue:
    description: str
    severity: str  # e.g., 'low', 'medium', 'high'
    line_number: int = -1
    suggestion: str = ""


@dataclass
class CodeMetrics:
    lines_of_code: int
    cyclomatic_complexity: int
    maintainability_index: int
    code_duplication: int
    test_coverage: int
    technical_debt_ratio: float


@dataclass
class CodeAnalysis:
    total_files_analyzed: int
    total_lines_of_code: int
    language_distribution: Dict[str, int]
    framework_patterns: Dict[str, Any]
    architecture_insights: Any
    code_metrics: CodeMetrics
    quality_issues: List[QualityIssue]
    file_analyses: List[Any]


# Helper functions for working with confidence scores
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
