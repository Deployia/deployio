"""
Enhanced Authentication middleware for DeployIO Agent
Robust JWT validation with caching, enhanced service validation, and improved security
"""

import os
import logging
import httpx
import jwt
import time
import hashlib
from datetime import datetime, timezone
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings

logger = logging.getLogger(__name__)

# Enhanced Configuration
BACKEND_URL = settings.platform_url
TOKEN_VALIDATION_URL = f"{BACKEND_URL}/api/internal/auth/validate-token"
JWT_SECRET = (
    os.getenv("JWT_SECRET")
    or os.getenv("SECRET_KEY")
    or "default_secret_key_change_in_production"
)
JWT_ALGORITHM = "HS256"

# Enhanced service validation configuration
SERVICE_CONFIG = {
    "deployio-backend": {
        "allowed_ips": ["127.0.0.1", "::1"],  # Add production IPs as needed
        "rate_limit": 1000,  # requests per minute
        "require_token": True,
        "allowed_endpoints": ["*"],  # All endpoints allowed for backend
    },
    "deployio-ai-service": {
        "allowed_ips": [],  # No IP restriction for AI service
        "rate_limit": 500,
        "require_token": True,
        "allowed_endpoints": ["/agent/v1/deploy", "/agent/v1/status"],
    },
}

# Token caching
TOKEN_CACHE_TTL = 300  # 5 minutes
TOKEN_CACHE = {}


class AuthMiddleware(BaseHTTPMiddleware):
    """Enhanced Authentication middleware for DeployIO Agent"""

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

        # Enhanced internal service validation
        if not self._enhanced_service_validation(request):
            x_internal_service = request.headers.get("X-Internal-Service")
            logger.warning(
                f"Enhanced service validation failed for {request.url.path} from service: {x_internal_service}"
            )
            return Response(
                content='{"error": true, "message": "Forbidden: Service validation failed", "service": "deployio-agent"}',
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

        # Check cache first
        cached_result = self._get_cached_result(token)
        if cached_result is not None:
            if cached_result:
                logger.debug("Using cached token validation result")
                return await call_next(request)
            else:
                logger.warning(f"Cached token validation failed for {request.url.path}")
                return Response(
                    content='{"error": true, "message": "Unauthorized: Invalid token (cached)", "service": "deployio-agent"}',
                    status_code=401,
                    media_type="application/json",
                )

        # Validate token (backend, fallback to local)
        try:
            is_valid = await self._validate_token_with_backend(token)
        except Exception as e:
            logger.error(f"Error validating token with backend: {str(e)}")
            is_valid = self._decode_jwt_token_fallback(token)

        # Cache the result
        self._cache_token_result(token, is_valid)

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

    def _get_cache_key(self, token: str) -> str:
        """Generate cache key for token"""
        return hashlib.sha256(token.encode()).hexdigest()

    def _is_cache_valid(self, cache_entry: dict) -> bool:
        """Check if cache entry is still valid"""
        return cache_entry["expires"] > time.time()

    def _cache_token_result(self, token: str, result: bool, ttl: int = TOKEN_CACHE_TTL):
        """Cache token validation result"""
        cache_key = self._get_cache_key(token)
        TOKEN_CACHE[cache_key] = {
            "result": result,
            "expires": time.time() + ttl,
            "cached_at": time.time(),
        }

    def _get_cached_result(self, token: str) -> bool:
        """Get cached token validation result"""
        cache_key = self._get_cache_key(token)
        cache_entry = TOKEN_CACHE.get(cache_key)

        if cache_entry and self._is_cache_valid(cache_entry):
            logger.debug("Cache hit for token validation")
            return cache_entry["result"]

        if cache_entry:
            # Remove expired entry
            del TOKEN_CACHE[cache_key]

        return None

    def _enhanced_service_validation(self, request: Request) -> bool:
        """Enhanced internal service validation with IP and endpoint checking"""
        service_header = request.headers.get("X-Internal-Service")

        # Check if service is in allowed list
        if service_header not in SERVICE_CONFIG:
            logger.warning(f"Unknown service header: {service_header}")
            return False

        service_config = SERVICE_CONFIG[service_header]

        # Check source IP if configured
        if service_config.get("allowed_ips"):
            client_ip = request.client.host if request.client else None
            allowed_ips = service_config["allowed_ips"]

            if allowed_ips and client_ip not in allowed_ips:
                logger.warning(
                    f"Service {service_header} accessed from unauthorized IP: {client_ip}. "
                    f"Allowed IPs: {allowed_ips}"
                )
                # Don't block in development, just log
                if settings.environment == "production":
                    return False

        # Check endpoint permissions
        endpoint = request.url.path
        allowed_endpoints = service_config.get("allowed_endpoints", ["*"])

        if allowed_endpoints != ["*"]:
            endpoint_allowed = any(
                allowed_ep in endpoint for allowed_ep in allowed_endpoints
            )
            if not endpoint_allowed:
                logger.warning(
                    f"Service {service_header} tried to access unauthorized endpoint: {endpoint}. "
                    f"Allowed endpoints: {allowed_endpoints}"
                )
                return False

        return True
