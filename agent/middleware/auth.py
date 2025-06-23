"""
Authentication middleware for DeployIO Agent
Header-based authentication for backend-to-agent communication
"""

import httpx
import logging
import os
from fastapi import APIRouter, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
TOKEN_VALIDATION_URL = f"{BACKEND_URL}/api/internal/auth/validate-token"


class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication middleware for DeployIO Agent"""

    def __init__(self, app, agent_secret: str):
        super().__init__(app)
        self.agent_secret = agent_secret

        # Public endpoints that don't require authentication
        self.public_endpoints = {
            "/",
            "/health",
            "/agent/v1/health",
            "/agent/v1/docs",
            "/agent/v1/redoc",
            "/agent/v1/openapi.json",
        }

    async def dispatch(self, request: Request, call_next):
        """Process the request and check authentication"""

        # Allow public endpoints
        if request.url.path in self.public_endpoints:
            return await call_next(request)

        # Allow wildcard subdomain requests (these will be HTML responses)
        if self._is_wildcard_request(request):
            return await call_next(request)

        # Only allow requests from backend express service (by header)
        x_internal_service = request.headers.get("X-Internal-Service")
        if x_internal_service != "deployio-backend":
            logger.warning(
                f"Blocked request to {request.url.path} from non-backend-service: {x_internal_service}"
            )
            return Response(
                content='{"error": true, "message": "Forbidden: Only backend service allowed", "service": "deployio-agent"}',
                status_code=403,
                media_type="application/json",
            )

        # Require Bearer token and validate with backend
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.warning(
                f"Missing or invalid Authorization header for {request.url.path}"
            )
            return Response(
                content='{"error": true, "message": "Unauthorized: Missing Bearer token", "service": "deployio-agent"}',
                status_code=401,
                media_type="application/json",
            )
        token = auth_header.split(" ", 1)[1]
        is_valid = await self._validate_token_with_backend(token)
        if not is_valid:
            logger.warning(f"Token validation failed for {request.url.path}")
            return Response(
                content='{"error": true, "message": "Unauthorized: Invalid token", "service": "deployio-agent"}',
                status_code=401,
                media_type="application/json",
            )
        return await call_next(request)

    def _is_wildcard_request(self, request: Request) -> bool:
        """Check if this is a wildcard subdomain request (should serve HTML)"""
        host = request.headers.get("host", "")

        # If the request is for a subdomain pattern like *.deployio.dev
        # and not hitting API endpoints, treat as wildcard
        if "/agent/v1/" not in request.url.path and host:
            # This would be for deployed apps on subdomains
            return True

        return False

    async def _validate_token_with_backend(self, token: str) -> bool:
        """Validate the Bearer token with the backend service"""

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    TOKEN_VALIDATION_URL,
                    json={"token": token},
                    headers={"X-Internal-Service": "deployio-agent"},
                )
                if response.status_code == 200:
                    result = response.json()
                    return result.get("success") and result.get("data", {}).get("valid")
                else:
                    logger.warning(f"Backend token validation failed: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Error validating token with backend: {str(e)}")
            return False


def create_demo_routes(app):
    router = APIRouter()

    @router.post("/agent/v1/demo-token")
    async def get_demo_token():
        """Fetch a demo user JWT token from backend for testing"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{BACKEND_URL}/api/internal/auth/demo-token",
                    headers={"X-Internal-Service": "deployio-agent"},
                )
                if response.status_code == 200:
                    return response.json()
                return {"error": True, "message": response.text}
        except Exception as e:
            return {"error": True, "message": str(e)}

    @router.get("/agent/v1/protected-test")
    async def protected_test():
        """A protected endpoint to test authentication"""
        return {"message": "You have accessed a protected endpoint!"}

    app.include_router(router)
