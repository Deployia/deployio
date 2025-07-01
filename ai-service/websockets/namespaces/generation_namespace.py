"""
Generation Namespace for AI Service
Handles configuration generation with real-time progress streaming
"""

import logging
from typing import Dict, Any

from .base import BaseAINamespace

logger = logging.getLogger(__name__)


class GenerationNamespace(BaseAINamespace):
    """
    Generation namespace for handling configuration generation requests
    Streams progress updates during generation operations
    """

    def __init__(self):
        super().__init__("/generation")

    async def _register_handlers(self):
        """Register generation-specific event handlers"""
        logger.info("Generation namespace handlers registered")

    async def handle_generation_request(self, request_data: Dict[str, Any]):
        """
        Handle generation request from server bridge with real-time progress streaming

        Args:
            request_data: Contains sessionId, userId, repositoryData, analysisResults, configTypes, options
        """
        session_id = request_data["sessionId"]
        user_id = request_data["userId"]
        repository_data = request_data["repositoryData"]
        analysis_results = request_data["analysisResults"]
        config_types = request_data.get(
            "configTypes", ["dockerfile", "docker_compose", "github_actions"]
        )
        options = request_data.get("options", {})

        try:
            # Register session
            self.register_session(
                session_id,
                {
                    "type": "generation",
                    "user_id": user_id,
                    "config_types": config_types,
                    "options": options,
                },
            )

            logger.info(
                f"Starting generation for session: {session_id}, user: {user_id}"
            )

            # Import here to avoid circular imports
            from services.generation_service import generation_service

            # Emit initial progress to server bridge
            await self._emit_to_server(
                "generation_progress",
                {
                    "session_id": session_id,
                    "progress": 15,
                    "status": "starting",
                    "message": "Configuration generation engine initialized...",
                },
            )

            # Process generation with progress callbacks
            result = await generation_service.generate_configurations(
                repository_data=repository_data,
                analysis_results=analysis_results,
                config_types=config_types,
                user_options=options,
                session_id=session_id,
                progress_callback=self._create_progress_callback(session_id),
            )

            # Send completion to server bridge
            await self._emit_to_server(
                "generation_complete",
                {"session_id": session_id, "result": result, "status": "completed"},
            )

            logger.info(f"Generation completed for session: {session_id}")

        except Exception as e:
            logger.error(f"Generation failed for session {session_id}: {e}")
            await self._emit_to_server(
                "service_error",
                {
                    "session_id": session_id,
                    "error": str(e),
                    "context": "configuration_generation",
                },
            )
        finally:
            # Cleanup session
            self.unregister_session(session_id)

    async def handle_individual_generation(
        self, request_data: Dict[str, Any], config_type: str
    ):
        """
        Handle individual configuration generation request

        Args:
            request_data: Request data with analysis result and preferences
            config_type: Type of configuration to generate (dockerfile, docker_compose, etc.)
        """
        session_id = request_data["sessionId"]
        user_id = request_data["userId"]
        analysis_results = request_data["analysisResults"]
        options = request_data.get("options", {})

        try:
            self.register_session(
                session_id,
                {
                    "type": f"{config_type}_generation",
                    "config_type": config_type,
                    "user_id": user_id,
                    "options": options,
                },
            )

            logger.info(
                f"Starting {config_type} generation for session: {session_id}, user: {user_id}"
            )

            # Emit initial progress
            await self._emit_to_server(
                "generation_progress",
                {
                    "session_id": session_id,
                    "progress": 10,
                    "status": "starting",
                    "message": f"Generating {config_type} configuration...",
                    "config_type": config_type,
                },
            )

            # Import here to avoid circular imports
            from services.generation_service import generation_service

            # Generate specific configuration
            if config_type == "dockerfile":
                result = await generation_service.generate_dockerfile(
                    analysis_results,
                    options.get("dockerfile", {}),
                    session_id,
                    progress_callback=self._create_progress_callback(session_id),
                )
            elif config_type == "docker_compose":
                result = await generation_service.generate_docker_compose(
                    analysis_results,
                    options.get("docker_compose", {}),
                    session_id,
                    progress_callback=self._create_progress_callback(session_id),
                )
            elif config_type == "github_actions":
                result = await generation_service.generate_github_actions(
                    analysis_results,
                    options.get("github_actions", {}),
                    session_id,
                    progress_callback=self._create_progress_callback(session_id),
                )
            else:
                raise ValueError(f"Unknown config type: {config_type}")

            # Send completion to server bridge
            await self._emit_to_server(
                "generation_complete",
                {
                    "session_id": session_id,
                    "result": result,
                    "status": "completed",
                    "config_type": config_type,
                },
            )

            logger.info(f"{config_type} generation completed for session: {session_id}")

        except Exception as e:
            logger.error(
                f"{config_type} generation failed for session {session_id}: {e}"
            )
            await self._emit_to_server(
                "service_error",
                {
                    "session_id": session_id,
                    "error": str(e),
                    "context": f"{config_type}_generation",
                    "config_type": config_type,
                },
            )
        finally:
            self.unregister_session(session_id)

    def _create_progress_callback(self, session_id: str):
        """Create a progress callback function for the session"""

        async def progress_callback(
            progress: int, message: str, config_type: str = None, details: Dict = None
        ):
            await self._emit_to_server(
                "generation_progress",
                {
                    "session_id": session_id,
                    "progress": progress,
                    "status": "processing",
                    "message": message,
                    "config_type": config_type,
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

    async def get_generation_status(self, session_id: str) -> Dict[str, Any]:
        """Get generation status for a session"""
        session = self.get_session(session_id)
        if not session:
            return {"status": "not_found"}

        return {
            "status": "active",
            "session_id": session_id,
            "started_at": session["started_at"].isoformat(),
            "user_id": session.get("user_id"),
            "config_types": session.get("config_types", []),
            "options": session.get("options", {}),
        }
