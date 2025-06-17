"""
Authentication middleware for DeployIO Agent
Header-based authentication for backend-to-agent communication
"""

import logging
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


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

        # Check authentication for protected endpoints
        if not self._authenticate_request(request):
            logger.warning(
                f"Unauthorized request to {request.url.path} from {request.client.host}"
            )
            return Response(
                content='{"error": true, "message": "Unauthorized", "service": "deployio-agent"}',
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

    def _authenticate_request(self, request: Request) -> bool:
        """Authenticate the request using headers"""

        # Check for X-Agent-Secret header
        agent_secret = request.headers.get("X-Agent-Secret")
        if agent_secret and agent_secret == self.agent_secret:
            return True

        # Check for Authorization header (Bearer token)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            if token == self.agent_secret:
                return True

        # Check for X-API-Key header
        api_key = request.headers.get("X-API-Key")
        if api_key and api_key == self.agent_secret:
            return True

        return False
