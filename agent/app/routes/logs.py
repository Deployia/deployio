"""
Log management routes for DeployIO Agent
"""

import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Query, HTTPException, status, Depends
from pydantic import BaseModel

from app.services.log_bridge import log_bridge_service
from app.routes.security import get_bearer_token, verify_internal_service

router = APIRouter()
logger = logging.getLogger(__name__)


# --- FAST TAIL IMPLEMENTATION ---
def tail_file(file_path: Path, lines: int = 100, chunk_size: int = 4096) -> list[str]:
    """Efficiently read the last N lines from a file."""
    if not file_path.exists():
        return []
    line_ending = b"\n"
    lines_found = []
    buffer = b""
    with open(file_path, "rb") as f:
        f.seek(0, os.SEEK_END)
        file_size = f.tell()
        pos = file_size
        while pos > 0 and len(lines_found) <= lines:
            read_size = min(chunk_size, pos)
            pos -= read_size
            f.seek(pos)
            chunk = f.read(read_size)
            buffer = chunk + buffer
            while line_ending in buffer:
                idx = buffer.rfind(line_ending)
                line = buffer[idx + 1 :]
                buffer = buffer[:idx]
                if line:
                    lines_found.append(line)
            if pos == 0 and buffer:
                lines_found.append(buffer)
    # lines_found is in reverse order, decode and return last N
    return [
        line_bytes.decode(errors="replace")
        for line_bytes in reversed(lines_found[:lines])
    ]


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


@router.get(
    "/logs",
    tags=["Agent"],
    summary="Get recent logs from the agent service (supports filtering)",
    dependencies=[Depends(get_bearer_token), Depends(verify_internal_service)],
)
async def get_logs(
    lines: int = Query(
        default=100, ge=1, le=1000, description="Number of log lines to return"
    ),
    level: Optional[str] = Query(default="all", description="Filter by log level"),
    source: Optional[str] = Query(default=None, description="Filter by log source"),
    since: Optional[str] = Query(
        default=None, description="Return logs since this timestamp (ISO format)"
    ),
):
    """Get recent logs from the agent service. Supports filtering by level."""
    try:
        log_file = Path(__file__).parent.parent.parent / "logs" / "agent.log"
        if not log_file.exists():
            return {
                "success": False,
                "error": "Log file not found",
                "path": str(log_file),
                "logs": [],
                "totalLines": 0,
            }
        # Use fast Python tail instead of subprocess
        log_lines = tail_file(log_file, lines=lines)
        # Filter by level if specified
        if level != "all":
            log_lines = [line for line in log_lines if level.upper() in line.upper()]
        logs = []
        for i, line in enumerate(log_lines):
            if line.strip():
                logs.append(
                    {
                        "id": f"agent_{int(time.time())}_{i}",
                        "timestamp": time.time(),
                        "level": extract_log_level(line),
                        "message": line.strip(),
                        "service": "agent",
                        "source": "remote",
                    }
                )
        return {
            "success": True,
            "logs": logs,
            "totalLines": len(logs),
            "path": str(log_file),
            "source": "agent_service",
        }
    except Exception as e:
        logger.error(f"Error reading logs: {str(e)}")
        return {"success": False, "error": str(e), "logs": [], "totalLines": 0}


def extract_log_level(log_line: str) -> str:
    log_line_upper = log_line.upper()
    if "ERROR" in log_line_upper:
        return "ERROR"
    elif "WARN" in log_line_upper:
        return "WARN"
    elif "INFO" in log_line_upper:
        return "INFO"
    elif "DEBUG" in log_line_upper:
        return "DEBUG"
    else:
        return "INFO"


@router.get(
    "/logs/status",
    dependencies=[Depends(get_bearer_token), Depends(verify_internal_service)],
)
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


@router.post(
    "/logs/test",
    dependencies=[Depends(get_bearer_token), Depends(verify_internal_service)],
)
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
