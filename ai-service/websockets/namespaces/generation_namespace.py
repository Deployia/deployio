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

    async def handle_generation_request(self, session_data: Dict[str, Any]):
        """
        Handle generation request with real-time progress streaming

        Args:
            session_data: Contains session_id, analysis_result, config_types, user_preferences
        """
        session_id = session_data["session_id"]
        analysis_result = session_data["analysis_result"]
        config_types = session_data.get(
            "config_types", ["dockerfile", "docker_compose"]
        )
        user_preferences = session_data.get("user_preferences", {})

        try:
            # Register session
            self.register_session(
                session_id,
                {
                    "type": "generation",
                    "config_types": config_types,
                    "user_preferences": user_preferences,
                },
            )

            logger.info(f"Starting generation for session: {session_id}")

            # Import here to avoid circular imports
            from services.generation_service import generation_service

            # Stream initial progress
            await self.emit_progress(
                session_id, 5, "Initializing configuration generation..."
            )

            # Process generation with progress callbacks
            result = await generation_service.generate_configurations(
                analysis_result=analysis_result,
                config_types=config_types,
                user_preferences=user_preferences,
                session_id=session_id,
                progress_callback=self._create_progress_callback(session_id),
            )

            # Send completion
            await self.emit_complete(session_id, "generation", result)

            logger.info(f"Generation completed for session: {session_id}")

        except Exception as e:
            logger.error(f"Generation failed for session {session_id}: {e}")
            await self.emit_error(session_id, "generation", str(e))
        finally:
            # Cleanup session
            self.unregister_session(session_id)

    async def handle_individual_generation(
        self, session_data: Dict[str, Any], config_type: str
    ):
        """
        Handle individual configuration generation request

        Args:
            session_data: Session data with analysis result and preferences
            config_type: Type of configuration to generate (dockerfile, docker_compose, etc.)
        """
        session_id = session_data["session_id"]
        analysis_result = session_data["analysis_result"]
        user_preferences = session_data.get("user_preferences", {})

        try:
            self.register_session(
                session_id,
                {"type": f"{config_type}_generation", "config_type": config_type},
            )

            await self.emit_progress(session_id, 10, f"Generating {config_type}...")

            # Import here to avoid circular imports
            from services.generation_service import generation_service

            if config_type == "dockerfile":
                result = await generation_service.generate_dockerfile(
                    analysis_result, user_preferences.get("dockerfile", {}), session_id
                )
            elif config_type == "docker_compose":
                result = await generation_service.generate_docker_compose(
                    analysis_result,
                    user_preferences.get("docker_compose", {}),
                    session_id,
                )
            elif config_type == "github_actions":
                result = await generation_service.generate_github_actions(
                    analysis_result,
                    user_preferences.get("github_actions", {}),
                    session_id,
                )
            else:
                raise ValueError(f"Unknown config type: {config_type}")

            await self.emit_complete(session_id, f"{config_type}_generation", result)

        except Exception as e:
            logger.error(
                f"{config_type} generation failed for session {session_id}: {e}"
            )
            await self.emit_error(session_id, f"{config_type}_generation", str(e))
        finally:
            self.unregister_session(session_id)

    def _create_progress_callback(self, session_id: str):
        """Create a progress callback function for the session"""

        async def progress_callback(
            progress: int, message: str, config_type: str = None
        ):
            if config_type:
                message = f"[{config_type}] {message}"
            await self.emit_progress(session_id, progress, message)

        return progress_callback

    async def get_generation_status(self, session_id: str) -> Dict[str, Any]:
        """Get generation status for a session"""
        session = self.get_session(session_id)
        if not session:
            return {"status": "not_found"}

        return {
            "status": "active",
            "session_id": session_id,
            "started_at": session["started_at"].isoformat(),
            "config_types": session.get("config_types", []),
            "type": session.get("type", "generation"),
        }
