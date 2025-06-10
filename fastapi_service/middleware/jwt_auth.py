"""
JWT Authentication middleware for FastAPI
"""

import os
import jwt
from typing import Optional
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.auth import JWTPayload, AuthenticatedUser


class JWTAuth(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTAuth, self).__init__(auto_error=auto_error)
        self._jwt_secret = None

    @property
    def jwt_secret(self):
        if self._jwt_secret is None:
            self._jwt_secret = os.getenv("JWT_SECRET")
            if not self._jwt_secret:
                raise ValueError("JWT_SECRET environment variable is required")
        return self._jwt_secret

    async def __call__(self, request: Request) -> Optional[AuthenticatedUser]:
        """Validate JWT token and return authenticated user"""

        # First check for token in cookies (preferred method from Node.js)
        token = request.cookies.get("token")

        # If no cookie token, check Authorization header
        if not token:
            credentials: HTTPAuthorizationCredentials = await super(
                JWTAuth, self
            ).__call__(request)
            if credentials:
                token = credentials.credentials

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authorized to access this route. Please log in.",
            )

        try:
            # Verify and decode JWT token
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            jwt_payload = JWTPayload(**payload)

            # Validate session with database
            user_data = await self._validate_session(
                jwt_payload.id, jwt_payload.sessionId
            )

            if not user_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session invalid or expired. Please log in again.",
                )

            return AuthenticatedUser(
                id=jwt_payload.id,
                session_id=jwt_payload.sessionId,
                username=user_data.get("username"),
                email=user_data.get("email"),
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please log in again.",
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
            )
        except Exception as e:
            # Enhanced error reporting for development
            if os.getenv("DEBUG", "false").lower() == "true":
                detail = f"Auth error: {str(e)}"
            else:
                detail = "Not authorized to access this route"
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=detail,
            )

    async def _validate_session(self, user_id: str, session_id: str) -> Optional[dict]:
        """Validate user session against database"""
        try:
            from config.database import get_sync_db_connection
            from bson import ObjectId

            # Get sync database connection for validation
            db, status = get_sync_db_connection()
            if status != "connected" or db is None:
                return None

            # Find user and validate session
            user = db.users.find_one(
                {"_id": ObjectId(user_id), "sessions._id": ObjectId(session_id)}
            )

            return user
        except Exception:
            return None


# Create JWT authentication instance
jwt_auth = JWTAuth()
