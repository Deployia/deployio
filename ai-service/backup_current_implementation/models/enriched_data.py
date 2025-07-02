"""
Enriched Data Models for AI Service
Defines data structures for repository data received from server
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime


class RepositoryMetadata(BaseModel):
    """Basic repository information"""

    name: str
    full_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    size: int = 0
    default_branch: str = "main"
    private: bool = False
    fork: bool = False


class FileTreeNode(BaseModel):
    """File tree node structure"""

    path: str
    type: str  # "file" or "dir"
    size: Optional[int] = None
    extension: Optional[str] = None
    content: Optional[str] = None  # For small key files


class ExtractionMetadata(BaseModel):
    """Metadata about the data extraction process"""

    extracted_at: datetime
    branch: str
    permissions: List[str] = []
    total_files: int = 0
    extraction_method: str = "oauth"
    server_version: Optional[str] = None


class EnrichedRepositoryData(BaseModel):
    """
    Complete enriched repository data from server
    Contains all necessary information for analysis without API calls
    """

    repository: RepositoryMetadata
    file_tree: List[FileTreeNode] = Field(description="Filtered file structure")
    config_files: Dict[str, str] = Field(description="Key configuration file contents")
    package_manifests: Dict[str, Any] = Field(description="Parsed package manifests")
    metadata: ExtractionMetadata


class AnalysisRequest(BaseModel):
    """Request model for repository analysis"""

    session_id: str
    repository_data: EnrichedRepositoryData
    analysis_types: Optional[List[str]] = ["stack", "dependencies", "quality"]
    options: Optional[Dict[str, Any]] = {}


class GenerationRequest(BaseModel):
    """Request model for configuration generation"""

    session_id: str
    analysis_result: Dict[str, Any]  # AnalysisResult from completed analysis
    config_types: List[str] = ["dockerfile", "docker_compose"]
    user_preferences: Optional[Dict[str, Any]] = {}
    deployment_config: Optional[Dict[str, Any]] = None


class DockerfileGenerationRequest(BaseModel):
    """Specific request for Dockerfile generation"""

    session_id: str
    analysis_result: Dict[str, Any]
    optimization_level: str = (
        "balanced"  # "minimal", "balanced", "performance", "security"
    )
    custom_commands: Optional[Dict[str, str]] = None
    environment_variables: Optional[Dict[str, str]] = None
    exposed_ports: Optional[List[int]] = None
    user_preferences: Optional[Dict[str, Any]] = {}


class DockerComposeGenerationRequest(BaseModel):
    """Specific request for docker-compose generation"""

    session_id: str
    analysis_result: Dict[str, Any]
    services_config: Optional[Dict[str, Any]] = None
    networks_config: Optional[Dict[str, Any]] = None
    volumes_config: Optional[Dict[str, Any]] = None
    environment_variables: Optional[Dict[str, str]] = None
    user_preferences: Optional[Dict[str, Any]] = {}


class GitHubActionsGenerationRequest(BaseModel):
    """Specific request for GitHub Actions workflow generation"""

    session_id: str
    analysis_result: Dict[str, Any]
    deployment_target: str = "aws"  # "aws", "gcp", "azure"
    ecr_config: Optional[Dict[str, Any]] = None
    environment_config: Optional[Dict[str, Any]] = None
    testing_config: Optional[Dict[str, Any]] = None
    user_preferences: Optional[Dict[str, Any]] = {}


# Response Models for WebSocket Events
class ProgressUpdate(BaseModel):
    """Progress update event"""

    session_id: str
    progress: int  # 0-100
    message: str
    namespace: str
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None


class OperationComplete(BaseModel):
    """Operation completion event"""

    session_id: str
    operation_type: str  # "analysis", "generation", etc.
    result: Dict[str, Any]
    namespace: str
    timestamp: datetime
    duration_ms: Optional[int] = None


class OperationError(BaseModel):
    """Operation error event"""

    session_id: str
    operation_type: str
    error: str
    namespace: str
    timestamp: datetime
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
