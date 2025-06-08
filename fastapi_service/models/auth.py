"""
Authentication models for JWT validation
"""

from typing import Optional
from pydantic import BaseModel
from bson import ObjectId


class JWTPayload(BaseModel):
    """JWT payload structure from Node.js server"""

    id: str
    sessionId: str
    iat: Optional[int] = None
    exp: Optional[int] = None


class AuthenticatedUser(BaseModel):
    """Authenticated user information"""

    id: str
    session_id: str
    username: Optional[str] = None
    email: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
