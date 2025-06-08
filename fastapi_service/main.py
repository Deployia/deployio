"""
FastAPI Service Main Application
"""

import time
from config import create_app
from config.database import initialize_database, get_sync_db_connection
from middleware import setup_exception_handlers
from routes import create_routes

# Server start time for uptime calculation
server_start = time.time()

# Create FastAPI app
app = create_app()


# Add health check endpoint before CORS middleware to avoid CORS issues
@app.get("/service/v1/health")
async def health_check_direct():
    """Direct health check endpoint that bypasses CORS for Docker health checks"""
    try:
        # Check database connection
        _, db_status = get_sync_db_connection()
        uptime = time.time() - server_start

        return {
            "service_name": "FastAPI Service",
            "status": "ok",
            "mongodb_status": db_status,
            "uptime": uptime,
        }
    except Exception as e:
        return {
            "service_name": "FastAPI Service",
            "status": "error",
            "error": str(e),
            "uptime": time.time() - server_start,
        }


# Setup exception handlers
setup_exception_handlers(app)

# Include routes
app.include_router(create_routes())


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await initialize_database()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
