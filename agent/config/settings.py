"""
Settings configuration for the DeployIO Agent
"""

import os
from typing import Optional


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
    port: int = int(os.getenv("PORT", "8000"))

    # CORS settings
    cors_origins: Optional[str] = os.getenv("CORS_ORIGINS")
    whitelisted_subdomains: Optional[str] = os.getenv("WHITELISTED_SUBDOMAINS")
    allow_subdomain_wildcards: bool = (
        os.getenv("ALLOW_SUBDOMAIN_WILDCARDS", "false").lower() == "true"
    )

    # Docker settings
    docker_socket: str = os.getenv("DOCKER_SOCKET", "/var/run/docker.sock")
    docker_network: str = os.getenv("DOCKER_NETWORK", "deployio-network")

    # Traefik settings
    traefik_config_dir: str = os.getenv("TRAEFIK_CONFIG_DIR", "/dynamic")
    traefik_api_url: str = os.getenv(
        "TRAEFIK_API_URL", "http://traefik:8080"
    )  # MongoDB Atlas settings
    database_url: Optional[str] = os.getenv("DATABASE_URL")
    mongodb_database: str = os.getenv("MONGODB_DATABASE", "deployio_agent")

    # Authentication
    agent_secret: str = os.getenv(
        "AGENT_SECRET", "development-secret-change-in-production"
    )
    api_key_header: str = "X-Agent-Secret"

    # Platform Communication
    platform_url: str = os.getenv("PLATFORM_URL", "https://deployio.tech")
    platform_api_key: Optional[str] = os.getenv("PLATFORM_API_KEY")

    # AWS ECR settings
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    aws_account_id: Optional[str] = os.getenv("AWS_ACCOUNT_ID")
    ecr_registry_url: Optional[str] = os.getenv("ECR_REGISTRY_URL")

    # Deployment settings
    max_concurrent_deployments: int = int(os.getenv("MAX_CONCURRENT_DEPLOYMENTS", "5"))
    deployment_timeout: int = int(os.getenv("DEPLOYMENT_TIMEOUT", "600"))  # 10 minutes

    # Resource limits
    max_memory: str = os.getenv("MAX_MEMORY", "256m")
    max_cpu: str = os.getenv("MAX_CPU", "0.25")
    max_storage: str = os.getenv("MAX_STORAGE", "1g")

    # Subdomain settings
    base_domain: str = os.getenv("BASE_DOMAIN", "deployio.tech")
    wildcard_ssl_enabled: bool = (
        os.getenv("WILDCARD_SSL_ENABLED", "true").lower() == "true"
    )
    acme_email: str = os.getenv("ACME_EMAIL", "admin@deployio.tech")

    # Rate limiting
    rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    rate_limit_burst: int = int(os.getenv("RATE_LIMIT_BURST", "10"))

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "info")
    log_format: str = os.getenv("LOG_FORMAT", "json")


# Global settings instance
settings = Settings()
