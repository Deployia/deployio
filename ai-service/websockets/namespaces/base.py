"""
Base WebSocket Namespace for AI Service
Provides common functionality for all AI service namespaces
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class BaseAINamespace(ABC):
    """
    Abstract base class for AI Service WebSocket namespaces
    Provides common functionality and interface for all AI namespaces
    """

    def __init__(self, namespace_path: str):
        self.namespace_path = namespace_path
        self.websocket_manager = None
        self.active_sessions: Dict[str, Any] = {}
        self.is_active = False

    async def initialize(self, websocket_manager):
        """
        Initialize the namespace with WebSocket manager

        Args:
            websocket_manager: WebSocket manager instance
        """
        self.websocket_manager = websocket_manager
        self.is_active = True

        # Register event handlers
        await self._register_handlers()

        logger.info(f"AI namespace initialized: {self.namespace_path}")

    @abstractmethod
    async def _register_handlers(self):
        """Register namespace-specific event handlers"""
        pass

    async def emit_progress(self, session_id: str, progress: int, message: str):
        """
        Emit progress update to server

        Args:
            session_id: Session identifier
            progress: Progress percentage (0-100)
            message: Progress message
        """
        if not self.websocket_manager or not self.websocket_manager.is_connected:
            logger.warning("Cannot emit progress - WebSocket not connected")
            return

        try:
            await self.websocket_manager.emit_to_server(
                "progress_update",
                {
                    "session_id": session_id,
                    "progress": progress,
                    "message": message,
                    "namespace": self.namespace_path,
                    "timestamp": datetime.now().isoformat(),
                },
            )
        except Exception as e:
            logger.error(f"Failed to emit progress: {e}")

    async def emit_complete(
        self, session_id: str, operation_type: str, result: Dict[str, Any]
    ):
        """
        Emit completion event to server

        Args:
            session_id: Session identifier
            operation_type: Type of operation completed
            result: Operation result data
        """
        if not self.websocket_manager or not self.websocket_manager.is_connected:
            logger.warning("Cannot emit completion - WebSocket not connected")
            return

        try:
            await self.websocket_manager.emit_to_server(
                f"{operation_type}_complete",
                {
                    "session_id": session_id,
                    "result": result,
                    "namespace": self.namespace_path,
                    "timestamp": datetime.now().isoformat(),
                },
            )
        except Exception as e:
            logger.error(f"Failed to emit completion: {e}")

    async def emit_error(
        self, session_id: str, operation_type: str, error_message: str
    ):
        """
        Emit error event to server

        Args:
            session_id: Session identifier
            operation_type: Type of operation that failed
            error_message: Error message
        """
        if not self.websocket_manager or not self.websocket_manager.is_connected:
            logger.warning("Cannot emit error - WebSocket not connected")
            return

        try:
            await self.websocket_manager.emit_to_server(
                f"{operation_type}_error",
                {
                    "session_id": session_id,
                    "error": error_message,
                    "namespace": self.namespace_path,
                    "timestamp": datetime.now().isoformat(),
                },
            )
        except Exception as e:
            logger.error(f"Failed to emit error: {e}")

    def register_session(self, session_id: str, session_data: Dict[str, Any]):
        """Register an active session"""
        self.active_sessions[session_id] = {
            **session_data,
            "started_at": datetime.now(),
            "namespace": self.namespace_path,
        }

    def unregister_session(self, session_id: str):
        """Unregister a session"""
        self.active_sessions.pop(session_id, None)

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """Get session data"""
        return self.active_sessions.get(session_id)

    def get_active_sessions(self) -> Dict[str, Any]:
        """Get all active sessions"""
        return self.active_sessions.copy()

    async def cleanup(self):
        """Cleanup namespace resources"""
        self.active_sessions.clear()
        self.is_active = False
        logger.info(f"AI namespace cleaned up: {self.namespace_path}")
