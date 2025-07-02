"""
API Routes Package

Clean, focused API routes for repository analysis and configuration generation.
Provides comprehensive endpoints with proper error handling.
"""

from .analysis_routes import create_analysis_routes
from .generator_routes import create_generator_routes

__all__ = ['create_analysis_routes', 'create_generator_routes']
