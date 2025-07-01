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

    async def handle_analysis_request(self, request_data: Dict[str, Any]):
        """
        Handle analysis request from server bridge with real-time progress streaming

        Args:
            request_data: Contains sessionId, userId, repositoryData, analysisTypes, options
        """
        session_id = request_data["sessionId"]
        user_id = request_data["userId"]
        repository_data = request_data["repositoryData"]
        analysis_types = request_data.get(
            "analysisTypes", ["stack", "dependencies", "quality"]
        )
        options = request_data.get("options", {})

        try:
            # Register session with UUID
            self.register_session(
                session_id,
                {
                    "type": "analysis",
                    "user_id": user_id,
                    "repository": repository_data.get("repository", {}),
                    "analysis_types": analysis_types,
                    "options": options,
                },
            )

            logger.info(f"Starting analysis for session: {session_id}, user: {user_id}")

            # Import here to avoid circular imports
            from services.analysis_service import analysis_service

            # Emit initial progress to server bridge
            await self._emit_to_server(
                "analysis_progress",
                {
                    "session_id": session_id,
                    "progress": 10,
                    "status": "starting",
                    "message": "Analysis engine initialized...",
                },
            )

            # Process analysis with repository data and progress callbacks
            result = await analysis_service.analyze_repository(
                repository_data=repository_data,
                session_id=session_id,
                analysis_types=analysis_types,
                user_options=options,
                progress_callback=self._create_progress_callback(session_id),
            )

            # Send completion to server bridge
            await self._emit_to_server(
                "analysis_complete",
                {"session_id": session_id, "result": result, "status": "completed"},
            )

            logger.info(f"Analysis completed for session: {session_id}")

        except Exception as e:
            logger.error(f"Analysis failed for session {session_id}: {e}")
            await self._emit_to_server(
                "service_error",
                {
                    "session_id": session_id,
                    "error": str(e),
                    "context": "repository_analysis",
                },
            )
        finally:
            # Cleanup session
            self.unregister_session(session_id)

    def _create_progress_callback(self, session_id: str):
        """Create a progress callback function for the session"""

        async def progress_callback(progress: int, message: str, details: Dict = None):
            await self._emit_to_server(
                "analysis_progress",
                {
                    "session_id": session_id,
                    "progress": progress,
                    "status": "processing",
                    "message": message,
                    "details": details or {},
                },
            )

        return progress_callback

    async def _emit_to_server(self, event: str, data: Dict[str, Any]):
        """Emit event to server via WebSocket manager"""
        if self.websocket_manager and self.websocket_manager.is_connected:
            await self.websocket_manager.emit_to_server(event, data)
        else:
            logger.warning(f"Cannot emit {event} - not connected to server")

    async def get_analysis_status(self, session_id: str) -> Dict[str, Any]:
        """Get analysis status for a session"""
        session = self.get_session(session_id)
        if not session:
            return {"status": "not_found"}

        return {
            "status": "active",
            "session_id": session_id,
            "started_at": session["started_at"].isoformat(),
            "user_id": session.get("user_id"),
            "repository": session.get("repository", {}),
            "analysis_types": session.get("analysis_types", []),
        }
