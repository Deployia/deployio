"""
Settings configuration for the DeployIO Agent
"""

import os
from typing import Optional, List


class Settings:
    """Application settings"""

    # App metadata
    app_name: str = "DeployIO Agent"
    version: str = "1.0.0"
    description: str = "Container deployment management service for DeployIO platform"

    # Environment
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    environment: str = os.getenv("ENVIRONMENT", "development")

    # Server configuration
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))  # CORS settings
    cors_origins: Optional[str] = os.getenv("CORS_ORIGINS")

    # Docker settings
    docker_socket: str = os.getenv("DOCKER_SOCKET", "/var/run/docker.sock")
    docker_network: str = os.getenv("DOCKER_NETWORK", "deployio_network")

    # Traefik settings
    traefik_config_path: str = os.getenv("TRAEFIK_CONFIG_PATH", "/etc/traefik")
    traefik_api_url: str = os.getenv("TRAEFIK_API_URL", "http://traefik:8080")

    # Authentication
    agent_secret: str = os.getenv(
        "AGENT_SECRET", "development-secret-change-in-production"
    )
    api_key_header: str = "X-Agent-Secret"

    # AWS ECR settings
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    aws_account_id: Optional[str] = os.getenv("AWS_ACCOUNT_ID")
    ecr_registry_prefix: Optional[str] = None

    # Deployment settings
    max_concurrent_deployments: int = int(os.getenv("MAX_CONCURRENT_DEPLOYMENTS", "5"))
    deployment_timeout: int = int(os.getenv("DEPLOYMENT_TIMEOUT", "600"))  # 10 minutes

    # Subdomain settings
    base_domain: str = os.getenv("BASE_DOMAIN", "deployio.dev")
    wildcard_ssl_enabled: bool = (
        os.getenv("WILDCARD_SSL_ENABLED", "false").lower() == "true"
    )

    def __post_init__(self):
        """Post-initialization setup"""
        if self.aws_account_id:
            self.ecr_registry_prefix = (
                f"{self.aws_account_id}.dkr.ecr.{self.aws_region}.amazonaws.com"
            )


# Global settings instance
settings = Settings()
