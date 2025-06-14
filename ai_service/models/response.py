"""
Base response models for API responses
"""

from typing import Any, Optional, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: Optional[str] = None
    details: Optional[Any] = None


class HealthResponse(BaseModel):
    service_name: str
    status: str
    redis_status: str
    uptime: float


class HelloResponse(BaseModel):
    message: str
    uptime: float
