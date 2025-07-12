"""
Response Models - API response structures
"""

from typing import Generic, TypeVar, Optional, Any, Dict, List
from pydantic import BaseModel
from datetime import datetime

from .common_models import (
    InsightModel,
    RecommendationModel,
    SuggestionModel,
    AnalysisStatus,
)

T = TypeVar("T")


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
    """Unified analysis response containing all analysis data and optional configurations"""

    # Analysis metadata
    analysis_id: Optional[str] = None
    session_id: Optional[str] = None
    status: AnalysisStatus = AnalysisStatus.COMPLETED

    # Repository information
    repository_name: str = ""
    repository_url: str = ""
    branch: str = "main"

    # Core analysis results
    analysis: Optional[Dict[str, Any]] = None  # Contains AnalysisResult data
    configurations: Optional[Dict[str, Any]] = None  # Contains generated configs if requested

    # Execution metadata
    execution_time: float = 0.0
    cached: bool = False
    timestamp: datetime = datetime.now()

    # Error handling
    error: Optional[str] = None
    warnings: List[str] = []


# Legacy response models for backward compatibility
class LegacyAnalysisResponse(BaseModel):
    """Legacy analysis response for backward compatibility"""

    analysis_id: str
    status: AnalysisStatus
    result: Optional[Dict[str, Any]] = None
    execution_time: float = 0.0
    cached: bool = False
    timestamp: datetime
    error: Optional[str] = None


class ProgressUpdate(BaseModel):
    analysis_id: str
    progress: float  # Changed from int to float to handle decimal progress values
    status: "AnalysisStatus"
    current_step: str
    timestamp: datetime


class HelloResponse(BaseModel):
    message: str
    uptime: float


class HealthResponse(BaseModel):
    service: str
    status: str
    timestamp: float
    version: str
    uptime: float
    responseTime: float
    memory: Dict[str, Any]
    cpu: Dict[str, Any]
    disk: Dict[str, Any]
    services: Dict[str, Any]
