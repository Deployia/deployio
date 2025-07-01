"""
Analysis Namespace for AI Service
Handles repository analysis with real-time progress streaming
"""

import logging
from typing import Dict, Any

from .base import BaseAINamespace

logger = logging.getLogger(__name__)


class AnalysisNamespace(BaseAINamespace):
    """
    Analysis namespace for handling repository analysis requests
    Streams progress updates during analysis operations
    """

    def __init__(self):
        super().__init__("/analysis")

    async def _register_handlers(self):
        """Register analysis-specific event handlers"""
        # Event handlers will be registered with the WebSocket manager
        logger.info("Analysis namespace handlers registered")

    async def handle_analysis_request(self, session_data: Dict[str, Any]):
        """
        Handle analysis request with real-time progress streaming

        Args:
            session_data: Contains session_id, repository_data, analysis_types, etc.
        """
        session_id = session_data["session_id"]
        repository_data = session_data["repository_data"]
        analysis_types = session_data.get(
            "analysis_types", ["stack", "dependencies", "quality"]
        )

        try:
            # Register session
            self.register_session(
                session_id,
                {
                    "type": "analysis",
                    "repository": repository_data.get("repository", {}),
                    "analysis_types": analysis_types,
                },
            )

            logger.info(f"Starting analysis for session: {session_id}")

            # Import here to avoid circular imports
            from services.analysis_service import analysis_service

            # Stream initial progress
            await self.emit_progress(session_id, 5, "Initializing analysis...")

            # Process analysis with repository data and progress callbacks
            result = await analysis_service.analyze_repository(
                repository_data=repository_data,
                session_id=session_id,
                analysis_types=analysis_types,
                progress_callback=self._create_progress_callback(session_id),
            )

            # Send completion
            await self.emit_complete(session_id, "analysis", result)

            logger.info(f"Analysis completed for session: {session_id}")

        except Exception as e:
            logger.error(f"Analysis failed for session {session_id}: {e}")
            await self.emit_error(session_id, "analysis", str(e))
        finally:
            # Cleanup session
            self.unregister_session(session_id)

    def _create_progress_callback(self, session_id: str):
        """Create a progress callback function for the session"""

        async def progress_callback(progress: int, message: str):
            await self.emit_progress(session_id, progress, message)

        return progress_callback

    async def get_analysis_status(self, session_id: str) -> Dict[str, Any]:
        """Get analysis status for a session"""
        session = self.get_session(session_id)
        if not session:
            return {"status": "not_found"}

        return {
            "status": "active",
            "session_id": session_id,
            "started_at": session["started_at"].isoformat(),
            "repository": session.get("repository", {}),
            "analysis_types": session.get("analysis_types", []),
        }
