"""
Configuration module for DeployIO Agent
"""

from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with Pydantic validation"""

    # App metadata
    app_name: str = "DeployIO Agent"
    version: str = "1.0.0"
    description: str = "Container deployment management service for DeployIO platform"

    # Environment
    debug: bool = False
    environment: str = "development"

    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS settings
    cors_origins: Optional[str] = None

    # Authentication
    agent_secret: str = "development-secret-change-in-production"
    api_key_header: str = "X-Agent-Secret"

    # Platform Communication
    platform_url: str = "http://localhost:3000"
    platform_api_key: Optional[str] = None

    # Log Bridge Configuration
    agent_id: str = "agent-ec2-2"
    log_bridge_enabled: bool = True
    log_bridge_reconnect_attempts: int = 10
    log_bridge_reconnect_delay: int = 5
    log_bridge_buffer_size: int = 1000
    log_bridge_batch_size: int = 50
    log_bridge_flush_interval: int = 5

    # Docker settings
    docker_socket: str = "/var/run/docker.sock"
    docker_network: str = "deployio-network"

    # Resource limits
    max_memory: str = "256m"
    max_cpu: str = "0.25"
    max_storage: str = "1g"

    # Rate limiting
    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 10

    # Logging
    log_level: str = "info"
    log_format: str = "json"

    # Health check settings
    health_check_interval: int = 30
    heartbeat_interval: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
