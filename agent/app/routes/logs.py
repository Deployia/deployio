"""
Log management routes for DeployIO Agent
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel

from app.services.log_bridge import log_bridge_service

router = APIRouter()
logger = logging.getLogger(__name__)


class LogEntry(BaseModel):
    """Log entry model"""

    timestamp: str
    level: str
    message: str
    source: str
    agent_id: str


class LogsResponse(BaseModel):
    """Logs response model"""

    logs: List[LogEntry]
    total: int
    agent_id: str
    timestamp: str


@router.get("/logs", response_model=LogsResponse)
async def get_logs(
    lines: int = Query(
        default=100, ge=1, le=1000, description="Number of log lines to return"
    ),
    level: Optional[str] = Query(default=None, description="Filter by log level"),
    source: Optional[str] = Query(default=None, description="Filter by log source"),
    since: Optional[str] = Query(
        default=None, description="Return logs since this timestamp (ISO format)"
    ),
):
    """Get recent logs from the agent"""

    try:
        # Get logs from log bridge buffer
        logs = []

        # For now, return recent log buffer entries
        # In a full implementation, you might read from log files or a log store
        buffer_logs = (
            log_bridge_service.log_buffer[-lines:]
            if log_bridge_service.log_buffer
            else []
        )

        for log_entry in buffer_logs:
            # Apply filters
            if level and log_entry.get("level", "").lower() != level.lower():
                continue

            if source and log_entry.get("source", "") != source:
                continue

            if since:
                try:
                    since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
                    log_dt = datetime.fromisoformat(
                        log_entry.get("timestamp", "").replace("Z", "+00:00")
                    )
                    if log_dt < since_dt:
                        continue
                except (ValueError, TypeError):
                    pass  # Skip invalid timestamps

            logs.append(
                LogEntry(
                    timestamp=log_entry.get("timestamp", datetime.now().isoformat()),
                    level=log_entry.get("level", "info"),
                    message=log_entry.get("message", ""),
                    source=log_entry.get("source", "unknown"),
                    agent_id=log_entry.get("agent_id", log_bridge_service.agent_id),
                )
            )

        return LogsResponse(
            logs=logs,
            total=len(logs),
            agent_id=log_bridge_service.agent_id,
            timestamp=datetime.now().isoformat(),
        )

    except Exception as e:
        logger.error(f"Error retrieving logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve logs: {str(e)}",
        )


@router.get("/logs/status")
async def get_log_status():
    """Get log bridge connection status"""

    return {
        "agent_id": log_bridge_service.agent_id,
        "connected": log_bridge_service.connected,
        "last_heartbeat": log_bridge_service.last_heartbeat,
        "buffer_size": len(log_bridge_service.log_buffer),
        "max_buffer_size": log_bridge_service.buffer_size,
        "reconnect_attempts": log_bridge_service.reconnect_attempts,
        "server_url": log_bridge_service.server_url,
        "timestamp": datetime.now().isoformat(),
    }


@router.post("/logs/test")
async def test_log_bridge():
    """Test the log bridge by sending a test message"""

    if not log_bridge_service.connected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Log bridge is not connected",
        )

    # Send a test log entry
    test_log = {
        "source": "test",
        "level": "info",
        "message": f"Test log entry from agent {log_bridge_service.agent_id}",
        "timestamp": datetime.now().isoformat(),
        "agent_id": log_bridge_service.agent_id,
        "test": True,
    }

    try:
        await log_bridge_service.queue_log(test_log)
        return {
            "success": True,
            "message": "Test log sent successfully",
            "test_log": test_log,
        }

    except Exception as e:
        logger.error(f"Failed to send test log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test log: {str(e)}",
        )
