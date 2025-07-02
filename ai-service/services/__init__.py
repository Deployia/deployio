"""
Services Package

Main service layer that orchestrates the analysis pipeline
and provides business logic for repository analysis.
"""

from .analysis_service import AnalysisService

__all__ = ['AnalysisService']
