"""
Main configuration settings for DeployIO AI Service
Multi-stack analysis and configuration generation
"""

import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import List
import yaml

# Load environment variables from .env file
load_dotenv()

# Load engine config YAML at module level
with open(os.path.join(os.path.dirname(__file__), "engine_config.yaml"), "r") as _f:
    _engine_config = yaml.safe_load(_f)


class Settings(BaseSettings):
    # =============================================================================
    # CORE SERVICE CONFIGURATION
    # =============================================================================
    app_name: str = "DeployIO AI Service"
    version: str = "1.0.0"
    description: str = "Multi-stack analysis and configuration generation service"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    environment: str = os.getenv("ENVIRONMENT", "development")

    # Server Configuration
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", 8001))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_format: str = os.getenv("LOG_FORMAT", "json")

    # =============================================================================
    # DEPLOYIO PLATFORM INTEGRATION
    # =============================================================================
    client_url: str = os.getenv("CLIENT_URL", "http://localhost:5173")
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:3000")
    frontend_url_dev: str = os.getenv("FRONTEND_URL_DEV", "http://localhost:5173")
    frontend_url_prod: str = os.getenv("FRONTEND_URL_PROD", "https://deployio.tech")
    production_url: str = os.getenv("PRODUCTION_URL", "https://deployio.tech")

    # Internal Service Authentication
    internal_service_token: str = os.getenv("INTERNAL_SERVICE_TOKEN", "")
    deployio_api_key: str = os.getenv("DEPLOYIO_API_KEY", "")

    # =============================================================================
    # WEBSOCKET CONFIGURATION
    # =============================================================================
    server_websocket_url: str = os.getenv(
        "SERVER_WEBSOCKET_URL", "http://localhost:3000"
    )
    websocket_enabled: bool = os.getenv("WEBSOCKET_ENABLED", "true").lower() == "true"
    websocket_reconnect_attempts: int = int(
        os.getenv("WEBSOCKET_RECONNECT_ATTEMPTS", 5)
    )
    websocket_reconnect_delay: int = int(os.getenv("WEBSOCKET_RECONNECT_DELAY", 5))

    # =============================================================================
    # REDIS CACHE CONFIGURATION
    # =============================================================================
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", 6379))
    redis_password: str = os.getenv("REDIS_PASSWORD", "")
    redis_db: int = int(os.getenv("REDIS_DB", 0))
    redis_ttl: int = int(os.getenv("REDIS_TTL", 3600))
    cache_enabled: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"

    @property
    def redis_url(self) -> str:
        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    # =============================================================================
    # AI & LLM CONFIGURATION
    # =============================================================================
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

    # LLM Settings
    llm_confidence_threshold: float = float(os.getenv("LLM_CONFIDENCE_THRESHOLD", 0.75))
    llm_max_retries: int = int(os.getenv("LLM_MAX_RETRIES", 3))
    llm_timeout: int = int(os.getenv("LLM_TIMEOUT", 30))
    llm_model_gemini: str = os.getenv("LLM_MODEL_GEMINI", "gemini-flash-latest")
    llm_model_groq: str = os.getenv("LLM_MODEL_GROQ", "llama3-70b-8192")
    llm_model_openai: str = os.getenv("LLM_MODEL_OPENAI", "gpt-4-turbo-preview")

    # =============================================================================
    # GITHUB INTEGRATION
    # =============================================================================
    github_token: str = os.getenv("GITHUB_TOKEN", "")
    github_api_url: str = os.getenv("GITHUB_API_URL", "https://api.github.com")
    github_rate_limit: int = int(os.getenv("GITHUB_RATE_LIMIT", 5000))

    # =============================================================================
    # ENGINE CONFIGURATION (Loaded from YAML)
    # =============================================================================
    # Analysis
    max_concurrent_requests: int = _engine_config["analysis"]["max_concurrent_requests"]
    analysis_timeout: int = _engine_config["analysis"]["analysis_timeout"]
    max_repository_size_mb: int = _engine_config["analysis"]["max_repository_size_mb"]
    max_file_count: int = _engine_config["analysis"]["max_file_count"]
    supported_languages: list = _engine_config["analysis"]["supported_languages"]
    supported_frameworks: list = _engine_config["analysis"]["supported_frameworks"]
    security_scan_enabled: bool = _engine_config["analysis"]["security_scan_enabled"]
    code_quality_analysis: bool = _engine_config["analysis"]["code_quality_analysis"]
    dependency_vulnerability_check: bool = _engine_config["analysis"][
        "dependency_vulnerability_check"
    ]
    complexity_threshold: int = _engine_config["analysis"]["complexity_threshold"]
    # Config Generation
    docker_optimization: bool = _engine_config["config_generation"][
        "docker_optimization"
    ]
    multi_stage_builds: bool = _engine_config["config_generation"]["multi_stage_builds"]
    security_scanning: bool = _engine_config["config_generation"]["security_scanning"]
    # CI/CD
    cicd_platforms: list = _engine_config["cicd"]["platforms"]
    default_cicd_platform: str = _engine_config["cicd"]["default_platform"]
    # Orchestration
    kubernetes_configs: bool = _engine_config["orchestration"]["kubernetes_configs"]
    docker_compose_configs: bool = _engine_config["orchestration"][
        "docker_compose_configs"
    ]
    helm_charts: bool = _engine_config["orchestration"]["helm_charts"]

    # =============================================================================
    # PERFORMANCE & SECURITY
    # =============================================================================
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", 100))
    rate_limit_window: int = int(os.getenv("RATE_LIMIT_WINDOW", 60))
    max_request_size: str = os.getenv("MAX_REQUEST_SIZE", "10MB")
    request_timeout: int = int(os.getenv("REQUEST_TIMEOUT", 60))  # CORS Configuration
    cors_origins_str: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,https://deployio.tech",
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",")]

    # =============================================================================
    # MONITORING & LOGGING
    # =============================================================================
    health_check_interval: int = int(os.getenv("HEALTH_CHECK_INTERVAL", 30))
    metrics_enabled: bool = os.getenv("METRICS_ENABLED", "true").lower() == "true"
    structured_logging: bool = os.getenv("STRUCTURED_LOGGING", "true").lower() == "true"

    # External Monitoring (Optional)
    sentry_dsn: str = os.getenv("SENTRY_DSN", "")
    datadog_api_key: str = os.getenv("DATADOG_API_KEY", "")

    # =============================================================================
    # FEATURE FLAGS - MULTI-STACK SUPPORT
    # =============================================================================
    # Primary Stack Support
    enable_nodejs_analysis: bool = _engine_config["feature_flags"][
        "enable_nodejs_analysis"
    ]
    enable_python_analysis: bool = _engine_config["feature_flags"][
        "enable_python_analysis"
    ]
    enable_java_analysis: bool = _engine_config["feature_flags"]["enable_java_analysis"]
    enable_go_analysis: bool = _engine_config["feature_flags"]["enable_go_analysis"]
    enable_php_analysis: bool = _engine_config["feature_flags"]["enable_php_analysis"]
    enable_dotnet_analysis: bool = _engine_config["feature_flags"][
        "enable_dotnet_analysis"
    ]
    enable_ruby_analysis: bool = _engine_config["feature_flags"]["enable_ruby_analysis"]
    enable_rust_analysis: bool = _engine_config["feature_flags"]["enable_rust_analysis"]

    # Frontend Frameworks
    enable_react_analysis: bool = _engine_config["feature_flags"][
        "enable_react_analysis"
    ]
    enable_nextjs_analysis: bool = _engine_config["feature_flags"][
        "enable_nextjs_analysis"
    ]
    enable_vue_analysis: bool = _engine_config["feature_flags"]["enable_vue_analysis"]
    enable_angular_analysis: bool = _engine_config["feature_flags"][
        "enable_angular_analysis"
    ]
    enable_svelte_analysis: bool = _engine_config["feature_flags"][
        "enable_svelte_analysis"
    ]

    # Mobile & Cross-Platform
    enable_flutter_analysis: bool = _engine_config["feature_flags"][
        "enable_flutter_analysis"
    ]
    enable_react_native_analysis: bool = _engine_config["feature_flags"][
        "enable_react_native_analysis"
    ]
    enable_swift_analysis: bool = _engine_config["feature_flags"][
        "enable_swift_analysis"
    ]
    enable_kotlin_analysis: bool = _engine_config["feature_flags"][
        "enable_kotlin_analysis"
    ]

    # Emerging Technologies
    enable_dart_analysis: bool = _engine_config["feature_flags"]["enable_dart_analysis"]
    enable_scala_analysis: bool = _engine_config["feature_flags"][
        "enable_scala_analysis"
    ]
    enable_elixir_analysis: bool = _engine_config["feature_flags"][
        "enable_elixir_analysis"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Create settings instance
settings = Settings()
