"""
Authentication middleware for AI Service
Handles JWT token validation for backend communication with database verification
"""

import os
import jwt
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configure logger
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    logger.warning("JWT_SECRET not set - using default (INSECURE for production)")
    JWT_SECRET = "default_secret_key_change_in_production"

JWT_ALGORITHM = "HS256"
REQUIRED_INTERNAL_SERVICE = "deployio-backend"

# Backend URL for token validation
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
TOKEN_VALIDATION_URL = f"{BACKEND_URL}/api/internal/auth/validate-token"

# Security scheme for FastAPI docs
security = HTTPBearer()


class AuthUser:
    """Represents an authenticated user"""

    def __init__(
        self, user_id: str, email: str, username: str, token_type: str = "user"
    ):
        self.id = user_id
        self.email = email
        self.username = username
        self.token_type = token_type
        self.is_demo = token_type == "demo"

    def __str__(self):
        return f"User(id={self.id}, email={self.email}, type={self.token_type})"


async def validate_token_with_backend(token: str) -> Dict[str, Any]:
    """
    Validate JWT token with backend database verification

    Args:
        token: JWT token string

    Returns:
        Token validation result from backend

    Raises:
        HTTPException: If token is invalid or backend validation fails
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                TOKEN_VALIDATION_URL,
                json={"token": token},
                headers={"X-Internal-Service": "deployio-ai-service"},
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("data", {}).get("valid"):
                    return result["data"]
                else:
                    raise HTTPException(
                        status_code=401, detail="Token validation failed"
                    )
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            elif response.status_code == 403:
                raise HTTPException(
                    status_code=403, detail="User account access denied"
                )
            elif response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found")
            else:
                raise HTTPException(
                    status_code=500, detail="Token validation service error"
                )

    except httpx.RequestError as e:
        logger.error(f"Backend token validation request failed: {str(e)}")
        # Fallback to basic JWT validation if backend is unavailable
        logger.warning("Falling back to basic JWT validation due to backend error")
        return decode_jwt_token_fallback(token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during token validation: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication service error")


def decode_jwt_token_fallback(token: str) -> Dict[str, Any]:
    """
    Fallback JWT validation when backend is unavailable
    Only validates signature and expiration - does NOT verify user exists

    Args:
        token: JWT token string

    Returns:
        Basic token payload with fallback indicator

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        # Check token expiration
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(
            timezone.utc
        ):
            raise HTTPException(status_code=401, detail="Token has expired")

        # Return as fallback format
        return {
            "valid": True,
            "user": {
                "id": payload.get("id", "unknown"),
                "email": payload.get("email", "unknown@example.com"),
                "username": payload.get("username", "unknown"),
                "type": payload.get("type", "user"),
            },
            "isDemo": payload.get("type") == "demo",
            "fallback": True,  # Indicates this wasn't validated against database
        }

    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token in fallback: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Error in fallback token decode: {str(e)}")
        raise HTTPException(status_code=401, detail="Token validation failed")


def validate_internal_service_header(
    x_internal_service: Optional[str] = Header(None),
) -> str:
    """
    Validate internal service header

    Args:
        x_internal_service: Internal service identifier header

    Returns:
        Service name if valid

    Raises:
        HTTPException: If service header is missing or invalid
    """
    if not x_internal_service:
        raise HTTPException(status_code=403, detail="Missing X-Internal-Service header")

    if x_internal_service != REQUIRED_INTERNAL_SERVICE:
        logger.warning(f"Invalid internal service: {x_internal_service}")
        raise HTTPException(
            status_code=403, detail="Access denied: Invalid internal service"
        )

    return x_internal_service


async def validate_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_internal_service: str = Depends(validate_internal_service_header),
) -> AuthUser:
    """
    Validate JWT token with backend database verification

    Args:
        credentials: HTTP Bearer credentials
        x_internal_service: Internal service identifier

    Returns:
        AuthUser object if authentication succeeds

    Raises:
        HTTPException: If authentication fails
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization credentials")

    # Validate token with backend
    try:
        validation_result = await validate_token_with_backend(credentials.credentials)
        user_data = validation_result["user"]

        # Create authenticated user
        auth_user = AuthUser(
            user_id=str(user_data["id"]),
            email=user_data["email"],
            username=user_data["username"],
            token_type=user_data["type"],
        )

        # Log validation method
        if validation_result.get("fallback"):
            logger.warning(f"Token validated using fallback method for {auth_user}")
        else:
            logger.info(f"Token validated with database verification for {auth_user}")

        return auth_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in JWT validation: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication service error")


async def validate_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_internal_service: str = Depends(validate_internal_service_header),
) -> AuthUser:
    """
    Validate JWT token and ensure it's not a demo token

    Args:
        credentials: HTTP Bearer credentials
        x_internal_service: Internal service identifier

    Returns:
        AuthUser object if authentication succeeds

    Raises:
        HTTPException: If authentication fails or token is demo
    """
    auth_user = await validate_jwt_token(credentials, x_internal_service)

    if auth_user.is_demo:
        raise HTTPException(
            status_code=403, detail="Demo tokens not allowed for this endpoint"
        )

    return auth_user


async def validate_demo_or_user_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_internal_service: str = Depends(validate_internal_service_header),
) -> Optional[AuthUser]:
    """
    Validate JWT token but allow demo tokens or no token (public access)

    Args:
        credentials: HTTP Bearer credentials (optional)
        x_internal_service: Internal service identifier

    Returns:
        AuthUser object if token provided, None for public access

    Raises:
        HTTPException: If token is provided but invalid
    """
    if not credentials:
        # No token provided - allow as public/demo access
        logger.info("Public access - no token provided")
        return None

    # Token provided - validate it
    return await validate_jwt_token(credentials, x_internal_service)


# Legacy compatibility function
def validate_internal_request(x_internal_service: Optional[str] = Header(None)):
    """
    Legacy function for backward compatibility
    Only validates internal service header (no JWT)

    Args:
        x_internal_service: Internal service identifier header

    Returns:
        Service name if valid

    Raises:
        HTTPException: If service header is invalid
    """
    return validate_internal_service_header(x_internal_service)


# Development/testing helpers
def create_demo_user() -> AuthUser:
    """Create a demo user for testing"""
    return AuthUser(
        user_id="demo_user",
        email="demo@deployio.com",
        username="demo",
        token_type="demo",
    )


def log_authentication_event(
    auth_user: Optional[AuthUser], endpoint: str, success: bool = True
):
    """Log authentication events for monitoring"""
    if auth_user:
        logger.info(
            f"Auth event - User: {auth_user.id} ({auth_user.token_type}), "
            f"Endpoint: {endpoint}, Success: {success}"
        )
    else:
        logger.info(
            f"Auth event - Public access, Endpoint: {endpoint}, Success: {success}"
        )


# Rate limiting helpers (for future implementation)
def get_rate_limit_key(auth_user: Optional[AuthUser]) -> str:
    """Get rate limiting key based on user type"""
    if not auth_user:
        return "public"
    elif auth_user.is_demo:
        return f"demo:{auth_user.id}"
    else:
        return f"user:{auth_user.id}"


def get_rate_limit_config(auth_user: Optional[AuthUser]) -> Dict[str, int]:
    """Get rate limiting configuration based on user type"""
    if not auth_user or auth_user.is_demo:
        return {"requests_per_minute": 5, "requests_per_hour": 20, "burst_limit": 2}
    else:
        return {"requests_per_minute": 60, "requests_per_hour": 1000, "burst_limit": 10}
