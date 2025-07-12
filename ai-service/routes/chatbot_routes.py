"""
Chatbot API Routes

Provides endpoints for business and DevOps chatbot functionality.
Business chatbot is public, DevOps chatbot requires authentication.
"""

import logging
from typing import Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from services.chatbot_service import (
    get_business_chatbot_service,
    get_devops_chatbot_service,
    BusinessChatbotService,
    DevOpsChatbotService,
)

logger = logging.getLogger(__name__)


# Request models
class BusinessChatRequest(BaseModel):
    """Request model for business chat."""

    message: str = Field(..., min_length=1, max_length=1000, description="User message")
    session_id: str = Field(default="default", description="Conversation session ID")


class DevOpsChatRequest(BaseModel):
    """Request model for DevOps chat."""

    message: str = Field(..., min_length=1, max_length=1000, description="User message")
    context: Dict[str, Any] = Field(
        default_factory=dict, description="Optional context (file, repository, etc.)"
    )


class ChatResponse(BaseModel):
    """Response model for chat."""

    message: str = Field(..., description="Bot response message")
    suggestions: list[str] = Field(
        default_factory=list, description="Suggested follow-up questions"
    )
    timestamp: str = Field(..., description="Response timestamp")
    session_id: str = Field(default="", description="Session ID for business chat")
    error: bool = Field(default=False, description="Whether an error occurred")


def validate_internal_service(x_internal_service: str = Header(default="")):
    """Validate internal service access for DevOps chat."""
    allowed_services = ["deployio-ai-service", "deployio-backend", "deployio-client"]
    if x_internal_service not in allowed_services:
        raise HTTPException(
            status_code=403, detail="Unauthorized internal service access"
        )


def create_chatbot_routes() -> APIRouter:
    """
    Create and configure chatbot API routes.

    Returns:
        Configured FastAPI router
    """
    router = APIRouter()

    @router.post("/business", response_model=ChatResponse)
    async def business_chat(
        request: BusinessChatRequest,
        service: BusinessChatbotService = Depends(get_business_chatbot_service),
    ):
        """
        Public business chatbot endpoint for customer support and sales inquiries.

        Uses RAG system to provide context-aware responses about DeployIO platform.
        No authentication required - accessible to all visitors.

        Args:
            request: Chat request with user message and session ID

        Returns:
            Bot response with message, suggestions, and metadata
        """
        try:
            logger.info(f"Business chat request: {request.message[:50]}...")

            response = await service.get_response(
                user_message=request.message, session_id=request.session_id
            )

            return ChatResponse(
                message=response["message"],
                suggestions=response.get("suggestions", []),
                timestamp=response["timestamp"],
                session_id=request.session_id,
                error=response.get("error", False),
            )

        except Exception as e:
            logger.error(f"Business chat error: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Internal server error",
                    "message": "Failed to process chat request",
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )

    @router.post("/devops")
    async def devops_chat(
        request: DevOpsChatRequest,
        service: DevOpsChatbotService = Depends(get_devops_chatbot_service),
        x_internal_service: str = Depends(validate_internal_service),
    ):
        """
        Protected DevOps chatbot endpoint for technical assistance.

        Requires internal service authentication (from backend after user auth).
        Provides expert-level DevOps advice and troubleshooting.

        Args:
            request: Chat request with user message and optional context

        Returns:
            Technical response with examples and guidance
        """
        try:
            logger.info(
                f"DevOps chat request from {x_internal_service}: {request.message[:50]}..."
            )

            response = await service.get_response(
                user_message=request.message, context=request.context
            )

            return {
                "message": response["message"],
                "timestamp": response["timestamp"],
                "error": response.get("error", False),
            }

        except Exception as e:
            logger.error(f"DevOps chat error: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Internal server error",
                    "message": "Failed to process DevOps chat request",
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )

    from fastapi import Query

    @router.post("/business/reset")
    async def reset_business_conversation(
        session_id: str = Query(..., description="Session ID to reset"),
        service: BusinessChatbotService = Depends(get_business_chatbot_service),
    ):
        """
        Reset business chat conversation history.

        Args:
            session_id: Session ID to reset

        Returns:
            Success confirmation
        """
        try:
            service.reset_conversation(session_id)

            return {
                "success": True,
                "message": "Conversation history reset",
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Reset conversation error: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Internal server error",
                    "message": "Failed to reset conversation",
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )

    @router.get("/business/welcome")
    async def get_business_welcome():
        """
        Get welcome message for business chat.

        Returns:
            Welcome message with initial suggestions
        """
        return {
            "message": "👋 Hi! I'm **DeployBot**. Ask me about:\n• **How deployio works**\n• **Pricing & plans**\n• **Tech help** (Docker, CI/CD)\n• **Getting started**\n\nWhat would you like to know?",
            "suggestions": [
                "How does deployio work?",
                "Show me pricing",
                "Help with Docker",
                "How do I get started?",
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": "welcome",
        }

    @router.get("/health")
    async def chatbot_health():
        """
        Health check for chatbot services.

        Returns:
            Service health status
        """
        try:
            business_service = get_business_chatbot_service()
            devops_service = get_devops_chatbot_service()

            business_available = (
                business_service.groq_client is not None
                and business_service.groq_client.is_available
            )

            devops_available = (
                devops_service.groq_client is not None
                and devops_service.groq_client.is_available
            )

            return {
                "service": "Chatbot Services",
                "status": (
                    "healthy"
                    if (business_available and devops_available)
                    else "degraded"
                ),
                "timestamp": datetime.utcnow().isoformat(),
                "services": {
                    "business_chatbot": {
                        "status": "available" if business_available else "fallback",
                        "ai_enabled": business_available,
                        "rag_enabled": True,
                    },
                    "devops_chatbot": {
                        "status": "available" if devops_available else "fallback",
                        "ai_enabled": devops_available,
                    },
                },
            }

        except Exception as e:
            logger.error(f"Chatbot health check error: {e}")
            return {
                "service": "Chatbot Services",
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    return router
