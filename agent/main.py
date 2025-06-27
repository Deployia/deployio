#!/usr/bin/env python3
"""
DeployIO Agent - FastAPI Service for Container Deployment Management
"""

import time
from config import create_app
from config.settings import settings
from middleware import setup_exception_handlers, AuthMiddleware
from routes import create_routes

# Server start time for uptime calculation
server_start = time.time()

# Create FastAPI app
app = create_app()


# Setup exception handlers
setup_exception_handlers(app)

# Add authentication middleware
app.add_middleware(AuthMiddleware, agent_secret=settings.agent_secret)

# Include routes
app.include_router(create_routes())

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
