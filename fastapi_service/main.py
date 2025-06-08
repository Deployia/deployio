"""
FastAPI Service Main Application
"""

from config import create_app
from config.database import initialize_database
from middleware import setup_exception_handlers
from routes import create_routes

# Create FastAPI app
app = create_app()

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
