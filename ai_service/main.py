"""
FastAPI AI Service - Simplified Internal Microservice
"""

import time
from config import create_app
from config.redis_client import connect_redis, get_redis_client
from middleware import setup_exception_handlers
from routes import create_routes

# Server start time for uptime calculation
server_start = time.time()

# Create FastAPI app
app = create_app()


# Add health check endpoint before CORS middleware to avoid CORS issues
@app.get("/healthz")
async def health_check_direct():
    """Direct health check endpoint that bypasses CORS for Docker health checks"""
    try:
        # Check Redis connection
        redis_client = get_redis_client()
        try:
            redis_status = (
                "connected"
                if (redis_client and redis_client.ping())
                else "disconnected"
            )
        except Exception:
            redis_status = "disconnected"

        uptime = time.time() - server_start

        return {
            "service_name": "FastAPI AI Service",
            "status": "ok",
            "redis_status": redis_status,
            "uptime": uptime,
            "purpose": "AI processing microservice",
        }
    except Exception as e:
        return {
            "service_name": "FastAPI AI Service",
            "status": "error",
            "error": str(e),
            "redis_status": "unknown",
            "uptime": time.time() - server_start,
        }


# Setup exception handlers
setup_exception_handlers(app)

# Include routes
app.include_router(create_routes())


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await connect_redis()  # Only Redis for caching AI results


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
