"""
Minimal Optimization Router for AI Service
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/ping")
def ping():
    return {"message": "Optimization route is alive"}
