"""
Analysis Service

Main service that orchestrates the repository analysis pipeline.
Handles request validation, caching, analysis execution, and response formatting.
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from engines.core.detector import UnifiedDetector
from engines.utils.cache_manager import CacheManager
from engines.utils.validators import RequestValidator
from models.analysis_models import AnalysisRequest, AnalysisResult
from models.response_models import (
    AnalysisResponse, AnalysisStatus, ProgressUpdate, ErrorResponse
)

logger = logging.getLogger(__name__)


class AnalysisService:
    """
    Main analysis service that orchestrates the repository analysis pipeline.
    Provides high-level interface for repository analysis with caching, validation,
    and progress tracking.
    """
    
    def __init__(self):
        self.detector = UnifiedDetector()
        self.cache_manager = CacheManager()
        self.validator = RequestValidator()
        
        # Track active analysis sessions
        self.active_analyses: Dict[str, Dict[str, Any]] = {}
        
    async def analyze_repository(
        self,
        request_data: Dict[str, Any],
        progress_callback: Optional[callable] = None
    ) -> AnalysisResponse:
        """
        Main entry point for repository analysis.
        
        Args:
            request_data: Raw request data
            progress_callback: Optional callback for progress updates
            
        Returns:
            Analysis response with results or error information
        """
        analysis_id = self._generate_analysis_id()
        start_time = datetime.utcnow()
        
        try:
            logger.info(f"Starting analysis {analysis_id}")
            
            # Initialize progress tracking
            self.active_analyses[analysis_id] = {
                'status': AnalysisStatus.STARTING,
                'start_time': start_time,
                'progress': 0,
                'current_step': 'Validating request'
            }
            
            await self._update_progress(analysis_id, progress_callback, 5, "Validating request")
            
            # Validate request
            is_valid, analysis_request, validation_errors = self.validator.validate_analysis_request(request_data)
            if not is_valid:
                await self._update_progress(analysis_id, progress_callback, 100, "Validation failed", AnalysisStatus.FAILED)
                return self._create_error_response(
                    analysis_id,
                    "Validation failed",
                    validation_errors,
                    start_time
                )
            
            await self._update_progress(analysis_id, progress_callback, 10, "Checking cache")
            
            # Check cache if enabled
            cached_result = None
            if analysis_request.options.cache_enabled:
                cached_result = await self.cache_manager.get_analysis_result(
                    analysis_request.repository_url,
                    'full'  # For now, we only cache full analyses
                )
                
                if cached_result:
                    logger.info(f"Cache hit for {analysis_request.repository_url}")
                    await self._update_progress(analysis_id, progress_callback, 100, "Retrieved from cache", AnalysisStatus.COMPLETED)
                    
                    # Clean up tracking
                    self.active_analyses.pop(analysis_id, None)
                    
                    return AnalysisResponse(
                        analysis_id=analysis_id,
                        status=AnalysisStatus.COMPLETED,
                        result=cached_result,
                        execution_time=(datetime.utcnow() - start_time).total_seconds(),
                        cached=True,
                        timestamp=datetime.utcnow()
                    )
            
            await self._update_progress(analysis_id, progress_callback, 15, "Preparing analysis")
            
            # Execute analysis
            try:
                self.active_analyses[analysis_id]['status'] = AnalysisStatus.ANALYZING
                
                # Create progress callback for the detector
                detector_progress_callback = lambda progress, step: asyncio.create_task(
                    self._update_progress(analysis_id, progress_callback, 15 + (progress * 0.8), step, AnalysisStatus.ANALYZING)
                )
                
                # Run the analysis
                result = await self.detector.analyze_repository(
                    analysis_request,
                    progress_callback=detector_progress_callback
                )
                
                await self._update_progress(analysis_id, progress_callback, 95, "Finalizing results")
                
                # Cache the result if caching is enabled
                if analysis_request.options.cache_enabled and result:
                    await self.cache_manager.store_analysis_result(
                        analysis_request.repository_url,
                        result,
                        'full'
                    )
                
                await self._update_progress(analysis_id, progress_callback, 100, "Analysis completed", AnalysisStatus.COMPLETED)
                
                # Clean up tracking
                self.active_analyses.pop(analysis_id, None)
                
                return AnalysisResponse(
                    analysis_id=analysis_id,
                    status=AnalysisStatus.COMPLETED,
                    result=result,
                    execution_time=(datetime.utcnow() - start_time).total_seconds(),
                    cached=False,
                    timestamp=datetime.utcnow()
                )
                
            except Exception as e:
                logger.error(f"Analysis execution failed for {analysis_id}: {e}")
                await self._update_progress(analysis_id, progress_callback, 100, f"Analysis failed: {str(e)}", AnalysisStatus.FAILED)
                
                return self._create_error_response(
                    analysis_id,
                    "Analysis execution failed",
                    [str(e)],
                    start_time
                )
                
        except Exception as e:
            logger.error(f"Unexpected error in analysis {analysis_id}: {e}")
            await self._update_progress(analysis_id, progress_callback, 100, f"Unexpected error: {str(e)}", AnalysisStatus.FAILED)
            
            return self._create_error_response(
                analysis_id,
                "Unexpected error occurred",
                [str(e)],
                start_time
            )
        
        finally:
            # Ensure cleanup
            self.active_analyses.pop(analysis_id, None)
    
    async def get_analysis_status(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current status of an analysis.
        
        Args:
            analysis_id: Analysis identifier
            
        Returns:
            Analysis status information or None if not found
        """
        analysis_info = self.active_analyses.get(analysis_id)
        if not analysis_info:
            return None
        
        return {
            'analysis_id': analysis_id,
            'status': analysis_info['status'],
            'progress': analysis_info['progress'],
            'current_step': analysis_info['current_step'],
            'start_time': analysis_info['start_time'],
            'elapsed_time': (datetime.utcnow() - analysis_info['start_time']).total_seconds()
        }
    
    async def cancel_analysis(self, analysis_id: str) -> bool:
        """
        Cancel an active analysis.
        
        Args:
            analysis_id: Analysis identifier
            
        Returns:
            True if cancelled successfully, False if not found
        """
        if analysis_id not in self.active_analyses:
            return False
        
        try:
            # Mark as cancelled
            self.active_analyses[analysis_id]['status'] = AnalysisStatus.FAILED
            self.active_analyses[analysis_id]['current_step'] = 'Cancelled by user'
            
            # Clean up after a short delay
            await asyncio.sleep(1)
            self.active_analyses.pop(analysis_id, None)
            
            logger.info(f"Analysis {analysis_id} cancelled")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel analysis {analysis_id}: {e}")
            return False
    
    async def validate_repository_data(self, repository_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and sanitize repository data.
        
        Args:
            repository_data: Raw repository data
            
        Returns:
            Validation result with sanitized data or errors
        """
        try:
            # Validate the data
            is_valid, errors = self.validator.validate_repository_data(repository_data)
            
            if not is_valid:
                return {
                    'valid': False,
                    'errors': errors,
                    'sanitized_data': None
                }
            
            # Sanitize the data
            sanitized_data = self.validator.sanitize_repository_data(repository_data)
            
            return {
                'valid': True,
                'errors': [],
                'sanitized_data': sanitized_data,
                'file_count': len(sanitized_data['files']),
                'total_size': sum(len(content.encode('utf-8')) for content in sanitized_data['files'].values())
            }
            
        except Exception as e:
            logger.error(f"Repository data validation failed: {e}")
            return {
                'valid': False,
                'errors': [f"Validation error: {str(e)}"],
                'sanitized_data': None
            }
    
    async def get_service_health(self) -> Dict[str, Any]:
        """
        Get service health and status information.
        
        Returns:
            Service health information
        """
        try:
            # Check cache health
            cache_healthy = await self.cache_manager.health_check()
            cache_stats = await self.cache_manager.get_cache_stats()
            
            # Check detector health
            detector_healthy = True  # UnifiedDetector doesn't have health check yet
            
            # Active analyses count
            active_count = len(self.active_analyses)
            
            return {
                'service_healthy': cache_healthy and detector_healthy,
                'cache': {
                    'healthy': cache_healthy,
                    'stats': cache_stats
                },
                'detector': {
                    'healthy': detector_healthy
                },
                'active_analyses': active_count,
                'analysis_details': list(self.active_analyses.keys()) if active_count > 0 else []
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'service_healthy': False,
                'error': str(e),
                'cache': {'healthy': False},
                'detector': {'healthy': False},
                'active_analyses': 0
            }
    
    async def cleanup_cache(self) -> Dict[str, Any]:
        """
        Clean up expired cache entries.
        
        Returns:
            Cleanup results
        """
        try:
            cleaned_count = await self.cache_manager.cleanup_expired_cache()
            
            return {
                'success': True,
                'cleaned_entries': cleaned_count,
                'message': f"Cleaned up {cleaned_count} expired cache entries"
            }
            
        except Exception as e:
            logger.error(f"Cache cleanup failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'cleaned_entries': 0
            }
    
    async def _update_progress(
        self,
        analysis_id: str,
        progress_callback: Optional[callable],
        progress: int,
        step: str,
        status: AnalysisStatus = AnalysisStatus.ANALYZING
    ):
        """Update analysis progress and notify callback."""
        try:
            # Update internal tracking
            if analysis_id in self.active_analyses:
                self.active_analyses[analysis_id].update({
                    'status': status,
                    'progress': progress,
                    'current_step': step
                })
            
            # Call progress callback if provided
            if progress_callback:
                progress_update = ProgressUpdate(
                    analysis_id=analysis_id,
                    progress=progress,
                    status=status,
                    current_step=step,
                    timestamp=datetime.utcnow()
                )
                
                # Handle both sync and async callbacks
                if asyncio.iscoroutinefunction(progress_callback):
                    await progress_callback(progress_update)
                else:
                    progress_callback(progress_update)
                    
        except Exception as e:
            logger.warning(f"Failed to update progress for {analysis_id}: {e}")
    
    def _generate_analysis_id(self) -> str:
        """Generate a unique analysis ID."""
        import uuid
        return f"analysis_{uuid.uuid4().hex[:8]}"
    
    def _create_error_response(
        self,
        analysis_id: str,
        error_message: str,
        error_details: List[str],
        start_time: datetime
    ) -> AnalysisResponse:
        """Create an error response."""
        error_response = ErrorResponse(
            error_type="AnalysisError",
            message=error_message,
            details=error_details,
            timestamp=datetime.utcnow()
        )
        
        return AnalysisResponse(
            analysis_id=analysis_id,
            status=AnalysisStatus.FAILED,
            result=None,
            error=error_response,
            execution_time=(datetime.utcnow() - start_time).total_seconds(),
            cached=False,
            timestamp=datetime.utcnow()
        )
    
    async def close(self):
        """Clean up service resources."""
        try:
            # Cancel all active analyses
            for analysis_id in list(self.active_analyses.keys()):
                await self.cancel_analysis(analysis_id)
            
            # Close cache manager
            await self.cache_manager.close()
            
            logger.info("Analysis service closed successfully")
            
        except Exception as e:
            logger.error(f"Error closing analysis service: {e}")
