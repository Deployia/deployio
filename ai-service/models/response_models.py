"""
Response Models - API response structures
"""

from typing import Generic, TypeVar, Optional, Any, Dict, List
from pydantic import BaseModel
from datetime import datetime

from .common_models import InsightModel, RecommendationModel, SuggestionModel
from .analysis_models import TechnologyStack, DependencyAnalysis, CodeAnalysis, BuildConfiguration, DeploymentConfiguration

T = TypeVar('T')


class ResponseModel(BaseModel, Generic[T]):
    """Generic response wrapper for all API responses"""
    success: bool
    message: str
    data: Optional[T] = None
    error: Optional[str] = None
    timestamp: datetime = datetime.now()


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    message: str
    error: str
    error_code: Optional[str] = None
    timestamp: datetime = datetime.now()


class TechnologyStackResponse(BaseModel):
    """Technology stack response data"""
    language: Optional[str] = None
    framework: Optional[str] = None
    database: Optional[str] = None
    version: Optional[str] = None
    confidence: float = 0.0
    detection_method: str = "rule_based"
    build_tool: Optional[str] = None
    package_manager: Optional[str] = None
    additional_technologies: List[str] = []
    architecture_pattern: Optional[str] = None
    
    # Generator-ready fields
    main_entry_point: Optional[str] = None
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    install_command: Optional[str] = None


class DependencyAnalysisResponse(BaseModel):
    """Dependency analysis response data"""
    total_dependencies: int = 0
    production_dependencies: int = 0
    development_dependencies: int = 0
    package_managers: List[str] = []
    
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
    security_recommendations: List[str] = []
    optimization_suggestions: List[str] = []


class CodeAnalysisResponse(BaseModel):
    """Code analysis response data"""
    total_files: int = 0
    total_lines: int = 0
    complexity_score: float = 0.0
    maintainability_score: float = 0.0
    quality_score: float = 0.0
    patterns_detected: List[str] = []
    architecture_patterns: List[str] = []


class BuildConfigurationResponse(BaseModel):
    """Build configuration response data"""
    build_commands: Dict[str, str] = {}
    install_commands: Dict[str, str] = {}
    start_commands: Dict[str, str] = {}
    test_commands: Dict[str, str] = {}
    main_entry_points: List[str] = []
    config_files: List[str] = []
    environment_variables: Dict[str, str] = {}
    exposed_ports: List[int] = []
    system_dependencies: List[str] = []


class DeploymentConfigurationResponse(BaseModel):
    """Deployment configuration response data"""
    service_name: Optional[str] = None
    service_type: str = "web"
    min_instances: int = 1
    max_instances: int = 10
    internal_ports: List[int] = []
    external_ports: List[int] = []
    health_check_path: Optional[str] = None
    service_dependencies: List[str] = []


class AnalysisResponse(BaseModel):
    """Complete analysis response model"""
    # Basic information
    repository_name: str
    repository_url: str
    branch: str
    analysis_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Core analysis results
    technology_stack: TechnologyStackResponse
    dependency_analysis: Optional[DependencyAnalysisResponse] = None
    code_analysis: Optional[CodeAnalysisResponse] = None
    
    # Generator-ready configuration
    build_configuration: BuildConfigurationResponse
    deployment_configuration: DeploymentConfigurationResponse
    
    # Analysis metadata
    confidence_score: float
    confidence_level: str
    analysis_approach: str
    processing_time: float
    analysis_types: List[str]
    
    # Enhanced insights
    insights: List[InsightModel] = []
    recommendations: List[RecommendationModel] = []
    suggestions: List[SuggestionModel] = []
    reasoning: str = ""
    null_field_explanations: Dict[str, str] = {}
    
    # LLM enhancement data
    llm_enhanced: bool = False
    llm_provider: Optional[str] = None
    llm_confidence: float = 0.0
    llm_reasoning: Optional[str] = None
    
    # Timing
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    # Error handling
    error_message: Optional[str] = None
    warnings: List[str] = []


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    version: str = "2.0.0"
    services: Dict[str, Any] = {}
    timestamp: datetime = datetime.now()
