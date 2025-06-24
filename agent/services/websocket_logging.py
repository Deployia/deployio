import logging
import asyncio
import time
from typing import Optional
import httpx


class WebSocketLogHandler(logging.Handler):
    """
    Custom logging handler that sends logs to Express backend via WebSocket
    """

    def __init__(
        self, backend_url: str = "http://localhost:3000", service_name: str = "agent"
    ):
        super().__init__()
        self.backend_url = backend_url
        self.service_name = service_name
        self.log_queue = asyncio.Queue()
        self.is_running = False

    async def start_log_sender(self):
        """Start the background task to send logs"""
        self.is_running = True
        asyncio.create_task(self._log_sender())

    async def stop_log_sender(self):
        """Stop the background log sender"""
        self.is_running = False

    def emit(self, record):
        """Emit a log record by adding it to the queue"""
        try:
            log_entry = {
                "timestamp": time.time(),
                "level": record.levelname,
                "message": self.format(record),
                "service": self.service_name,
                "logger": record.name,
                "pathname": record.pathname,
                "lineno": record.lineno,
                "funcName": record.funcName,
            }

            # Add to queue (non-blocking)
            try:
                loop = asyncio.get_event_loop()
                loop.call_soon_threadsafe(self.log_queue.put_nowait, log_entry)
            except Exception:
                # If we can't add to queue, just continue (don't break logging)
                pass

        except Exception:
            # Don't let logging errors break the application
            pass

    async def _log_sender(self):
        """Background task to send logs to backend"""
        while self.is_running:
            try:
                # Wait for logs or timeout after 5 seconds
                log_entry = await asyncio.wait_for(self.log_queue.get(), timeout=5.0)

                # Send log to backend
                await self._send_log(log_entry)

            except asyncio.TimeoutError:
                # No logs to send, continue
                continue
            except Exception as e:
                # Log sender error - don't break the loop
                print(f"Log sender error: {e}")
                await asyncio.sleep(1)

    async def _send_log(self, log_entry: dict):
        """Send a single log entry to the backend"""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                await client.post(
                    f"{self.backend_url}/api/internal/logs/stream",
                    json=log_entry,
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": f"{self.service_name}-log-streamer/1.0",
                    },
                )
        except Exception:
            # Don't log errors from log sending to avoid recursion
            pass


# Global log handler instance
websocket_log_handler: Optional[WebSocketLogHandler] = None


def setup_websocket_logging(
    backend_url: str = "http://localhost:3000", service_name: str = "agent"
):
    """Setup WebSocket logging for the agent"""
    global websocket_log_handler

    # Create and configure the handler
    websocket_log_handler = WebSocketLogHandler(backend_url, service_name)
    websocket_log_handler.setLevel(logging.INFO)

    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    websocket_log_handler.setFormatter(formatter)

    # Add to root logger
    root_logger = logging.getLogger()
    root_logger.addHandler(websocket_log_handler)

    return websocket_log_handler


async def start_websocket_logging():
    """Start the WebSocket logging background task"""
    global websocket_log_handler
    if websocket_log_handler:
        await websocket_log_handler.start_log_sender()


async def stop_websocket_logging():
    """Stop the WebSocket logging background task"""
    global websocket_log_handler
    if websocket_log_handler:
        await websocket_log_handler.stop_log_sender()


def generate_test_logs():
    """Generate test log entries for demonstration"""
    logger = logging.getLogger("agent.test")

    logger.info("Agent started successfully")
    logger.debug("Debug: Connection established to MongoDB")
    logger.warning("Warning: Docker container memory usage is high")
    logger.error("Error: Failed to connect to external service")
    logger.info("Test deployment initiated for project: test-app")
    logger.info("Container deployed successfully: test-app-v1.2.3")

    return {"message": "Test logs generated", "count": 6}
