"""
FastAPI AI Service - Modular Microservice with Robust WebSocket Initialization
"""

import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from config.redis_client import get_redis_client
from config.settings import settings
from middleware import setup_exception_handlers
from routes.analysis_routes import create_analysis_routes
from routes.generator_routes import create_generator_routes
from websockets.manager import ai_websocket_manager

# Setup logging (optional, for consistency)
logger = logging.getLogger(__name__)

# Server start time for uptime calculation
server_start = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await get_redis_client()  # Only Redis for caching AI results
    if settings.websocket_enabled:
        try:
            success = await ai_websocket_manager.initialize()
            if success:
                logger.info("WebSocket connection to server established")
            else:
                logger.error("Failed to connect to server WebSocket")
        except Exception as e:
            logger.error(f"WebSocket initialization error: {e}")
    yield
    # Shutdown
    if settings.websocket_enabled:
        await ai_websocket_manager.disconnect()


# Create FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)


# Setup exception handlers
setup_exception_handlers(app)

# Include routes
app.include_router(create_analysis_routes())
app.include_router(create_generator_routes())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, ws='none')
