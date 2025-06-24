from fastapi import APIRouter, HTTPException, Header
import os
import httpx

router = APIRouter()


@router.get(
    "/service/v1/dev/demo-token",
    tags=["Dev"],
    include_in_schema=os.getenv("ENVIRONMENT", "development") != "production",
)
async def get_demo_user_token(
    x_internal_service: str = Header(
        default="deployio-ai-service",
        description="Internal service header required for backend authentication. Should be 'deployio-ai-service' for this route.",
    ),
):
    """
    Get a demo user auth bearer token from the backend for development/testing purposes only.
    This route is disabled in production.

    Internal API usage:
    - Makes a POST request to /api/internal/auth/demo-token on the backend.
    - Requires the header: X-Internal-Service: deployio-ai-service
    - This is similar to how analysis routes require X-Internal-Service: deployio-backend
    """
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise HTTPException(status_code=404, detail="Not found")

    backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{backend_url}/api/internal/auth/demo-token",
                headers={"X-Internal-Service": x_internal_service},
            )
            resp.raise_for_status()
            data = resp.json()
            if not data.get("success") or not data.get("token"):
                raise HTTPException(
                    status_code=500, detail="Token not found in backend response"
                )
            return {"access_token": data["token"], "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get demo token: {str(e)}"
        )
