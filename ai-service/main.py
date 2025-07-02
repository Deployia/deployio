"""
FastAPI AI Service - Modular Microservice with Robust WebSocket Initialization
"""

import time
import logging
from config import create_app
from middleware import setup_exception_handlers
from routes import create_routes

# Setup logging (optional, for consistency)
logger = logging.getLogger(__name__)

# Server start time for uptime calculation
server_start = time.time()

# Create FastAPI app with all config and lifespan
app = create_app()

# Setup exception handlers
setup_exception_handlers(app)

# Register all routes using the new clean structure
app.include_router(create_routes())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, ws="none")
