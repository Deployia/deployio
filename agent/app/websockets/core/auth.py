"""
WebSocket Authentication for Agent
Handles server authentication and connection validation
"""

import logging
from typing import Dict, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentWebSocketAuth:
    """
    Authentication handler for Agent WebSocket connections
    Manages agent credentials and server validation
    """

    def __init__(self):
        self.agent_id = settings.agent_id
        self.agent_secret = settings.agent_secret
        self.platform_url = settings.platform_url
        self.platform_api_key = settings.platform_api_key

    def get_auth_headers(self) -> Dict[str, str]:
        """
        Generate authentication headers for server connection

        Returns:
            Dict[str, str]: Authentication headers
        """
        headers = {
            "x-agent-secret": self.agent_secret,
            "x-agent-id": self.agent_id,
            "x-platform-domain": self.platform_url,
            "user-agent": f"DeployIO-Agent/{settings.version}",
        }

        # Add API key or fallback to agent secret for Bearer token
        if self.platform_api_key:
            headers["authorization"] = f"Bearer {self.platform_api_key}"
        else:
            headers["authorization"] = f"Bearer {self.agent_secret}"

        return headers

    def validate_connection_config(self) -> Tuple[bool, Optional[str]]:
        """
        Validate that all required configuration is present

        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message)
        """
        if not self.agent_id:
            return False, "Agent ID is required"

        if not self.agent_secret:
            return False, "Agent secret is required"

        if not self.platform_url:
            return False, "Platform URL is required"

        # Validate agent_id format (should be alphanumeric with hyphens)
        if not self.agent_id.replace("-", "").replace("_", "").isalnum():
            return False, "Agent ID contains invalid characters"

        # Validate platform URL format (basic check)
        if not (
            self.platform_url.startswith("http://")
            or self.platform_url.startswith("https://")
        ):
            return False, "Platform URL must start with http:// or https://"

        return True, None

    def get_connection_info(self) -> Dict[str, str]:
        """
        Get connection information for logging

        Returns:
            Dict[str, str]: Connection info (safe for logging)
        """
        return {
            "agent_id": self.agent_id,
            "platform_url": self.platform_url,
            "agent_secret_length": len(self.agent_secret) if self.agent_secret else 0,
            "has_platform_api_key": bool(self.platform_api_key),
            "agent_version": settings.version,
        }

    def mask_sensitive_data(self, data: Dict) -> Dict:
        """
        Mask sensitive data in dictionary for safe logging

        Args:
            data: Dictionary that may contain sensitive data

        Returns:
            Dict: Dictionary with sensitive data masked
        """
        sensitive_keys = {
            "agent_secret",
            "platform_api_key",
            "authorization",
            "x-agent-secret",
            "password",
            "token",
        }

        masked_data = data.copy()
        for key, value in masked_data.items():
            if any(sensitive_key in key.lower() for sensitive_key in sensitive_keys):
                if isinstance(value, str) and len(value) > 4:
                    masked_data[key] = f"{value[:4]}{'*' * (len(value) - 4)}"
                else:
                    masked_data[key] = "***"

        return masked_data


# Global auth instance
agent_auth = AgentWebSocketAuth()
