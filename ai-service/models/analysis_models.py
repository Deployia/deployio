"""
Core Analysis Data Models
Comprehensive data structures for analysis pipeline
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

from .common_models import ConfidenceLevel, AnalysisType, InsightModel, RecommendationModel, SuggestionModel


# ============= Request Models =============

class AnalysisRequest(BaseModel):
    """Single unified request model for all analysis and configuration generation"""
    repository_url: Optional[str] = None
    repository_data: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    analysis_types: List[AnalysisType] = [
        AnalysisType.STACK_DETECTION,
        AnalysisType.DEPENDENCY_ANALYSIS, 
        AnalysisType.CODE_ANALYSIS
    ]
    # Configuration generation options
    generate_configs: bool = False
    config_types: List[str] = ["dockerfile", "docker_compose", "github_actions"]
    # LLM enhancement options
    force_llm_enhancement: bool = False
    include_reasoning: bool = True
    include_recommendations: bool = True
    include_insights: bool = True
    explain_null_fields: bool = True
    # Progress and caching
    track_progress: bool = False
    cache_enabled: bool = True
    # Additional options
    options: Dict[str, Any] = {}


# ============= Core Analysis Models =============

@dataclass
class TechnologyStack:
    """Complete technology stack information"""
    # Primary identification
    language: Optional[str] = None
    framework: Optional[str] = None
    database: Optional[str] = None
    
    # Enhanced information
    version: Optional[str] = None
    confidence: float = 0.0
    detection_method: str = "rule_based"
    
    # Build and deployment
    build_tool: Optional[str] = None
    package_manager: Optional[str] = None
    runtime_version: Optional[str] = None
    
    # Additional technologies
    additional_technologies: List[str] = field(default_factory=list)
    architecture_pattern: Optional[str] = None
    
    # Generator-ready data
    main_entry_point: Optional[str] = None
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    install_command: Optional[str] = None


@dataclass 
class DependencyInfo:
    """Individual dependency information"""
    name: str
    version: Optional[str] = None
    type: str = "production"  # production, development, peer
    manager: str = "unknown"  # npm, pip, maven, etc.
    
    # Security and health
    is_vulnerable: bool = False
    is_outdated: bool = False
    vulnerability_level: Optional[str] = None  # critical, high, medium, low
    latest_version: Optional[str] = None
    license: Optional[str] = None


@dataclass
class DependencyAnalysis:
    """Complete dependency analysis"""
    # Counts
    total_dependencies: int = 0
    production_dependencies: int = 0
    development_dependencies: int = 0
    
    # Package managers detected
    package_managers: List[str] = field(default_factory=list)
    
    # Dependencies list
    dependencies: List[DependencyInfo] = field(default_factory=list)
    
    # Security metrics
    vulnerable_count: int = 0
    critical_vulnerabilities: int = 0
    high_vulnerabilities: int = 0
    medium_vulnerabilities: int = 0
    low_vulnerabilities: int = 0
    
    # Health metrics
    outdated_count: int = 0
    health_score: float = 0.0
    
    # Recommendations
    security_recommendations: List[str] = field(default_factory=list)
    optimization_suggestions: List[str] = field(default_factory=list)


@dataclass
class CodeAnalysis:
    """Code quality and structure analysis"""
    # Basic metrics
    total_files: int = 0
    total_lines: int = 0
    
    # Quality metrics
    complexity_score: float = 0.0
    maintainability_score: float = 0.0
    quality_score: float = 0.0
    
    # Issues found
    code_smells: List[Dict[str, Any]] = field(default_factory=list)
    patterns_detected: List[str] = field(default_factory=list)
    
    # Architecture insights
    architecture_patterns: List[str] = field(default_factory=list)
    design_patterns: List[str] = field(default_factory=list)


@dataclass
class BuildConfiguration:
    """Build and deployment configuration data"""
    # Build information
    build_commands: Dict[str, str] = field(default_factory=dict)  # {"build": "npm run build"}
    install_commands: Dict[str, str] = field(default_factory=dict)  # {"install": "npm install"}
    start_commands: Dict[str, str] = field(default_factory=dict)   # {"start": "npm start"}
    test_commands: Dict[str, str] = field(default_factory=dict)    # {"test": "npm test"}
    
    # File paths
    main_entry_points: List[str] = field(default_factory=list)    # ["src/index.js", "main.py"]
    config_files: List[str] = field(default_factory=list)         # ["package.json", "requirements.txt"]
    dockerfile_hints: List[str] = field(default_factory=list)     # Dockerfile generation hints
    
    # Environment
    environment_variables: Dict[str, str] = field(default_factory=dict)
    exposed_ports: List[int] = field(default_factory=list)        # [3000, 8080]
    
    # Dependencies
    system_dependencies: List[str] = field(default_factory=list)  # ["nodejs", "python3"]


@dataclass
class DeploymentConfiguration:
    """Deployment-specific configuration"""
    # Service configuration
    service_name: Optional[str] = None
    service_type: str = "web"  # web, api, worker, database
    
    # Scaling information
    min_instances: int = 1
    max_instances: int = 10
    cpu_requirements: Optional[str] = None     # "500m"
    memory_requirements: Optional[str] = None  # "512Mi"
    
    # Network configuration
    internal_ports: List[int] = field(default_factory=list)
    external_ports: List[int] = field(default_factory=list)
    
    # Health checks
    health_check_path: Optional[str] = None    # "/health"
    readiness_probe_path: Optional[str] = None # "/ready"
    
    # Dependencies
    service_dependencies: List[str] = field(default_factory=list)  # ["database", "redis"]
    external_dependencies: List[str] = field(default_factory=list)  # ["postgres", "mongodb"]


# ============= Main Analysis Result =============

@dataclass
class AnalysisResult:
    """
    Unified analysis result containing all analysis data
    This is the main data structure used throughout the system
    """
    
    # ===== Basic Information =====
    repository_name: str = ""
    repository_url: str = ""
    branch: str = "main"
    analysis_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # ===== Core Analysis Results =====
    technology_stack: TechnologyStack = field(default_factory=TechnologyStack)
    dependency_analysis: Optional[DependencyAnalysis] = None
    code_analysis: Optional[CodeAnalysis] = None
    
    # ===== Generator-Ready Configuration =====
    build_configuration: BuildConfiguration = field(default_factory=BuildConfiguration) 
    deployment_configuration: DeploymentConfiguration = field(default_factory=DeploymentConfiguration)
    
    # ===== Analysis Metadata =====
    confidence_score: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.LOW
    analysis_approach: str = "rule_based"  # rule_based, llm_enhanced, hybrid
    processing_time: float = 0.0
    analysis_types: List[AnalysisType] = field(default_factory=list)
    
    # ===== Enhanced Insights =====
    insights: List[InsightModel] = field(default_factory=list)
    recommendations: List[RecommendationModel] = field(default_factory=list)
    suggestions: List[SuggestionModel] = field(default_factory=list)
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = field(default_factory=dict)
    
    # ===== LLM Enhancement Data =====
    llm_enhanced: bool = False
    llm_provider: Optional[str] = None
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None
    
    # ===== Timing and Progress =====
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    # ===== Error Handling =====
    error_message: Optional[str] = None
    warnings: List[str] = field(default_factory=list)
    
    def add_insight(self, insight: InsightModel):
        """Add an insight to the analysis result"""
        self.insights.append(insight)
    
    def add_recommendation(self, recommendation: RecommendationModel):
        """Add a recommendation to the analysis result"""
        self.recommendations.append(recommendation)
    
    def add_warning(self, warning: str):
        """Add a warning message"""
        self.warnings.append(warning)
    
    def explain_null_field(self, field_name: str, explanation: str):
        """Add explanation for why a field is null/empty"""
        self.null_field_explanations[field_name] = explanation
    
    def has_vulnerabilities(self) -> bool:
        """Check if any vulnerabilities were found"""
        return (
            self.dependency_analysis and 
            self.dependency_analysis.vulnerable_count > 0
        )
    
    def get_primary_language(self) -> Optional[str]:
        """Get the primary language"""
        return self.technology_stack.language
    
    def get_primary_framework(self) -> Optional[str]:
        """Get the primary framework"""
        return self.technology_stack.framework
