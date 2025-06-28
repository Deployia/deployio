#!/usr/bin/env python3
"""
DeployIO Agent - Main Entry Point
Updated to use modular architecture
"""

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
