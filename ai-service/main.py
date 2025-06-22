"""
FastAPI AI Service - Simplified Internal Microservice
"""

import time
from config import create_app
from config.redis_client import get_redis_client
from middleware import setup_exception_handlers
from routes import create_routes

# Server start time for uptime calculation
server_start = time.time()

# Create FastAPI app
app = create_app()


# Setup exception handlers
setup_exception_handlers(app)

# Include routes
app.include_router(create_routes())


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await get_redis_client()  # Only Redis for caching AI results


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
