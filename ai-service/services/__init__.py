"""
Services package for DeployIO AI Service
Clean service-oriented architecture for business logic
"""

from .analysis_service import AnalysisService
from .progress_service import ProgressService

# Service instances - singleton pattern for consistent state
analysis_service = AnalysisService()
progress_service = ProgressService()

__all__ = ["AnalysisService", "ProgressService", "analysis_service", "progress_service"]
