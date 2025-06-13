"""
Protected routes that require JWT authentication
"""

from fastapi import APIRouter, Depends
from models.auth import AuthenticatedUser
from models.response import ResponseModel
from middleware.jwt_auth import jwt_auth

router = APIRouter()


@router.get("/profile", response_model=ResponseModel[AuthenticatedUser])
async def get_profile(current_user: AuthenticatedUser = Depends(jwt_auth)):
    """Get current user profile (protected route)"""
    return ResponseModel(
        success=True, message="Profile retrieved successfully", data=current_user
    )


@router.get("/dashboard", response_model=ResponseModel[dict])
async def get_dashboard(current_user: AuthenticatedUser = Depends(jwt_auth)):
    """Get user dashboard data (protected route)"""
    return ResponseModel(
        success=True,
        message="Dashboard data retrieved successfully",
        data={
            "user_id": current_user.id,
            "session_id": current_user.session_id,
            "message": f"Welcome {current_user.username or current_user.email}!",
            "timestamp": "2024-12-19T10:00:00Z",
        },
    )


@router.get("/data", response_model=ResponseModel[dict])
async def get_protected_data(current_user: AuthenticatedUser = Depends(jwt_auth)):
    """Get some protected data (protected route)"""
    from datetime import datetime

    return ResponseModel(
        success=True,
        message="Protected data retrieved successfully",
        data={
            "message": "This is protected data that requires authentication",
            "user_id": current_user.id,
            "username": current_user.username or current_user.email,
            "access_level": "authenticated",
            "service": "FastAPI Python",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )


@router.post("/action", response_model=ResponseModel[dict])
async def perform_action(current_user: AuthenticatedUser = Depends(jwt_auth)):
    """Perform some protected action (protected route)"""
    from datetime import datetime

    return ResponseModel(
        success=True,
        message="Action performed successfully",
        data={
            "action": "completed",
            "performed_by": current_user.id,
            "username": current_user.username or current_user.email,
            "service": "FastAPI Python",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )
