"""
Reusable security dependencies for FastAPI routes (Swagger docs)
"""

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer()


def get_bearer_token(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
):
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer token",
        )
    return credentials.credentials


def verify_internal_service(
    x_internal_service: str = Header(
        ..., description="Internal service header for backend authentication"
    )
):
    # This dependency is only for OpenAPI docs and route signature, not runtime logic
    return x_internal_service
