"""
Base WebSocket Namespace for Agent
Provides common functionality for all agent namespaces
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseAgentNamespace(ABC):
    """
    Abstract base class for Agent WebSocket namespaces
    Provides common functionality and interface for all agent namespaces
    """

    def __init__(self, namespace_path: str):
        self.namespace_path = namespace_path
        self.websocket_manager = None  # Will be set during initialization
        self.is_active = False
        self.connected_rooms: List[str] = []
        self.event_handlers: Dict[str, callable] = {}
        self.buffer: List[Dict] = []
        self.buffer_size = settings.log_bridge_buffer_size
        self.batch_size = settings.log_bridge_batch_size
        self.flush_interval = settings.log_bridge_flush_interval
        self._flush_task: Optional[asyncio.Task] = None

    async def initialize(self, websocket_manager):
        """
        Initialize the namespace with WebSocket manager

        Args:
            websocket_manager: WebSocket manager instance
        """
        self.websocket_manager = websocket_manager
        self.is_active = True

        # Register event handlers
        await self._register_event_handlers()

        # Start buffer flush task
        if self.flush_interval > 0:
            self._flush_task = asyncio.create_task(self._buffer_flush_loop())

        logger.info(f"SUCCESS: Initialized namespace: {self.namespace_path}")

    async def cleanup(self):
        """Cleanup namespace resources"""
        self.is_active = False

        # Cancel flush task
        if self._flush_task and not self._flush_task.done():
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass

        # Flush remaining buffer
        await self._flush_buffer()

        # Leave all rooms
        for room in self.connected_rooms:
            await self.leave_room(room)

        self.connected_rooms.clear()

        logger.info(f"SUCCESS: Cleaned up namespace: {self.namespace_path}")

    async def on_connected(self):
        """Called when WebSocket connection is established"""
        logger.debug(f"Namespace {self.namespace_path} connected to server")
        await self._on_connected()

    async def join_room(self, room_name: str) -> bool:
        """
        Join a specific room in the namespace

        Args:
            room_name: Name of the room to join

        Returns:
            bool: Success status
        """
        if not self.websocket_manager or not self.websocket_manager.is_connected:
            logger.warning(f"Cannot join room {room_name} - not connected")
            return False

        try:
            success = await self.websocket_manager.emit_to_namespace(
                self.namespace_path, "join_room", {"room": room_name}
            )

            if success and room_name not in self.connected_rooms:
                self.connected_rooms.append(room_name)
                logger.debug(f"SUCCESS: Joined room: {room_name} in {self.namespace_path}")

            return success

        except Exception as e:
            logger.error(f"Failed to join room {room_name}: {e}")
            return False

    async def leave_room(self, room_name: str) -> bool:
        """
        Leave a specific room in the namespace

        Args:
            room_name: Name of the room to leave

        Returns:
            bool: Success status
        """
        if not self.websocket_manager or not self.websocket_manager.is_connected:
            logger.warning(f"Cannot leave room {room_name} - not connected")
            return False

        try:
            success = await self.websocket_manager.emit_to_namespace(
                self.namespace_path, "leave_room", {"room": room_name}
            )

            if success and room_name in self.connected_rooms:
                self.connected_rooms.remove(room_name)
                logger.debug(f"SUCCESS: Left room: {room_name} in {self.namespace_path}")

            return success

        except Exception as e:
            logger.error(f"Failed to leave room {room_name}: {e}")
            return False

    async def emit_to_server(self, event: str, data: Any, room: str = None) -> bool:
        """
        Emit event to server through this namespace

        Args:
            event: Event name
            data: Event data
            room: Target room (optional)

        Returns:
            bool: Success status
        """
        if not self.websocket_manager or not self.websocket_manager.is_connected:
            logger.warning(f"Cannot emit {event} - not connected")
            # Add to buffer for later sending
            await self._add_to_buffer(event, data, room)
            return False

        try:
            success = await self.websocket_manager.emit_to_namespace(
                self.namespace_path, event, data, room
            )

            if success:
                logger.debug(f"SUCCESS: Emitted {event} to {self.namespace_path}")

            return success

        except Exception as e:
            logger.error(f"Failed to emit {event}: {e}")
            # Add to buffer for retry
            await self._add_to_buffer(event, data, room)
            return False

    async def _add_to_buffer(self, event: str, data: Any, room: str = None):
        """Add event to buffer for later sending"""
        buffer_item = {
            "event": event,
            "data": data,
            "room": room,
            "timestamp": datetime.utcnow().isoformat(),
            "namespace": self.namespace_path,
        }

        self.buffer.append(buffer_item)

        # Keep buffer size under limit
        if len(self.buffer) > self.buffer_size:
            # Remove oldest items
            self.buffer = self.buffer[-self.buffer_size :]
            logger.warning(
                f"Buffer size exceeded for {self.namespace_path}, removed old items"
            )

    async def _flush_buffer(self):
        """Flush buffered events to server"""
        if not self.buffer:
            return

        if not self.websocket_manager or not self.websocket_manager.is_connected:
            logger.debug(
                f"Cannot flush buffer for {self.namespace_path} - not connected"
            )
            return

        # Process buffer in batches
        while self.buffer:
            batch = self.buffer[: self.batch_size]
            self.buffer = self.buffer[self.batch_size :]

            for item in batch:
                try:
                    await self.websocket_manager.emit_to_namespace(
                        self.namespace_path,
                        item["event"],
                        item["data"],
                        item.get("room"),
                    )
                except Exception as e:
                    logger.error(f"Failed to flush buffered event: {e}")
                    # Put back in buffer for retry
                    self.buffer.insert(0, item)
                    break

        if not self.buffer:
            logger.debug(f"SUCCESS: Buffer flushed for {self.namespace_path}")

    async def _buffer_flush_loop(self):
        """Background task to periodically flush buffer"""
        while self.is_active:
            try:
                await asyncio.sleep(self.flush_interval)
                await self._flush_buffer()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in buffer flush loop: {e}")

    def get_status(self) -> Dict[str, Any]:
        """Get namespace status information"""
        return {
            "namespace_path": self.namespace_path,
            "is_active": self.is_active,
            "connected": (
                self.websocket_manager.is_connected if self.websocket_manager else False
            ),
            "connected_rooms": self.connected_rooms.copy(),
            "buffer_size": len(self.buffer),
            "event_handlers": list(self.event_handlers.keys()),
        }

    # Abstract methods to be implemented by subclasses
    @abstractmethod
    async def _register_event_handlers(self):
        """Register namespace-specific event handlers"""
        pass

    @abstractmethod
    async def _on_connected(self):
        """Handle connection established event"""
        pass

    @abstractmethod
    async def start_streaming(self):
        """Start data streaming for this namespace"""
        pass

    @abstractmethod
    async def stop_streaming(self):
        """Stop data streaming for this namespace"""
        pass
