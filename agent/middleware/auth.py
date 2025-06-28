"""
Authentication middleware for DeployIO Agent
Robust JWT validation for backend-to-agent communication, with fallback and clear logging
"""

import os
import logging
import httpx
import jwt
from datetime import datetime, timezone
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
TOKEN_VALIDATION_URL = f"{BACKEND_URL}/api/internal/auth/validate-token"
JWT_SECRET = (
    os.getenv("JWT_SECRET")
    or os.getenv("SECRET_KEY")
    or "default_secret_key_change_in_production"
)
JWT_ALGORITHM = "HS256"
REQUIRED_INTERNAL_SERVICE = "deployio-backend"


class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication middleware for DeployIO Agent (backend-first JWT validation, fallback to local)"""

    def __init__(self, app, agent_secret: str):
        super().__init__(app)
        self.agent_secret = agent_secret
        self.public_endpoints = {
            "/",
            "/health",
            "/agent/v1/health",
            "/agent/v1/docs",
            "/agent/v1/redoc",
            "/agent/v1/openapi.json",
        }

    async def dispatch(self, request: Request, call_next):
        # Allow public endpoints and wildcard subdomain requests
        if request.url.path in self.public_endpoints or self._is_wildcard_request(
            request
        ):
            return await call_next(request)

        # Internal service header check
        x_internal_service = request.headers.get("X-Internal-Service")
        if x_internal_service != REQUIRED_INTERNAL_SERVICE:
            logger.warning(
                f"Blocked request to {request.url.path} from non-backend-service: {x_internal_service}"
            )
            return Response(
                content='{"error": true, "message": "Forbidden: Only backend service allowed", "service": "deployio-agent"}',
                status_code=403,
                media_type="application/json",
            )

        # Bearer token extraction
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
        logger.info(f"Validating token for {request.url.path}")

        # Validate token (backend, fallback to local)
        try:
            is_valid = await self._validate_token_with_backend(token)
        except Exception as e:
            logger.error(f"Error validating token with backend: {str(e)}")
            is_valid = self._decode_jwt_token_fallback(token)

        if not is_valid:
            logger.warning(f"Token validation failed for {request.url.path}")
            return Response(
                content='{"error": true, "message": "Unauthorized: Invalid token", "service": "deployio-agent"}',
                status_code=401,
                media_type="application/json",
            )
        return await call_next(request)

    def _is_wildcard_request(self, request: Request) -> bool:
        host = request.headers.get("host", "")
        if "/agent/v1/" not in request.url.path and host:
            return True
        return False

    async def _validate_token_with_backend(self, token: str) -> bool:
        logger.info(f"Calling backend token validation at {TOKEN_VALIDATION_URL}")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    TOKEN_VALIDATION_URL,
                    json={"token": token},
                    headers={"X-Internal-Service": "deployio-agent"},
                )
                logger.info(f"Backend response: {response.status_code} {response.text}")
                if response.status_code == 200:
                    result = response.json()
                    return result.get("success") and result.get("data", {}).get("valid")
                else:
                    logger.warning(f"Backend token validation failed: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Exception during backend token validation: {str(e)}")
            raise

    def _decode_jwt_token_fallback(self, token: str) -> bool:
        logger.info("Attempting local JWT fallback validation")
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(
                timezone.utc
            ):
                logger.warning("Token has expired (fallback)")
                return False
            return True
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token in fallback: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error in fallback token decode: {str(e)}")
            return False
