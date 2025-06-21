"""
Main configuration settings for DeployIO AI Service
Multi-stack analysis and configuration generation
"""

import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import List

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    # =============================================================================
    # CORE SERVICE CONFIGURATION
    # =============================================================================
    app_name: str = "DeployIO AI Service"
    version: str = "2.0.0"
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
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # LLM Settings
    llm_confidence_threshold: float = float(os.getenv("LLM_CONFIDENCE_THRESHOLD", 0.75))
    llm_max_retries: int = int(os.getenv("LLM_MAX_RETRIES", 3))
    llm_timeout: int = int(os.getenv("LLM_TIMEOUT", 30))
    llm_model_groq: str = os.getenv("LLM_MODEL_GROQ", "llama3-70b-8192")
    llm_model_openai: str = os.getenv("LLM_MODEL_OPENAI", "gpt-4-turbo-preview")

    # =============================================================================
    # GITHUB INTEGRATION
    # =============================================================================
    github_token: str = os.getenv("GITHUB_TOKEN", "")
    github_api_url: str = os.getenv("GITHUB_API_URL", "https://api.github.com")
    github_rate_limit: int = int(os.getenv("GITHUB_RATE_LIMIT", 5000))

    # =============================================================================
    # ANALYSIS CONFIGURATION
    # =============================================================================
    max_concurrent_requests: int = int(os.getenv("MAX_CONCURRENT_REQUESTS", 10))
    analysis_timeout: int = int(os.getenv("ANALYSIS_TIMEOUT", 300))
    max_repository_size_mb: int = int(os.getenv("MAX_REPOSITORY_SIZE_MB", 500))
    max_file_count: int = int(os.getenv("MAX_FILE_COUNT", 10000))
    
    # Technology Detection
    supported_languages: List[str] = os.getenv("SUPPORTED_LANGUAGES", "javascript,typescript,python,java,go,php,ruby,csharp,rust,kotlin,swift,dart").split(",")
    supported_frameworks: List[str] = os.getenv("SUPPORTED_FRAMEWORKS", "react,vue,angular,express,nextjs,fastapi,django,spring,gin,laravel,rails,dotnet,flutter").split(",")
    
    # Security & Quality
    security_scan_enabled: bool = os.getenv("SECURITY_SCAN_ENABLED", "true").lower() == "true"
    code_quality_analysis: bool = os.getenv("CODE_QUALITY_ANALYSIS", "true").lower() == "true"
    dependency_vulnerability_check: bool = os.getenv("DEPENDENCY_VULNERABILITY_CHECK", "true").lower() == "true"
    complexity_threshold: int = int(os.getenv("COMPLEXITY_THRESHOLD", 10))

    # =============================================================================
    # CONFIGURATION GENERATION
    # =============================================================================
    docker_optimization: bool = os.getenv("DOCKER_OPTIMIZATION", "true").lower() == "true"
    multi_stage_builds: bool = os.getenv("MULTI_STAGE_BUILDS", "true").lower() == "true"
    security_scanning: bool = os.getenv("SECURITY_SCANNING", "true").lower() == "true"
    
    # CI/CD Configuration
    cicd_platforms: List[str] = os.getenv("CICD_PLATFORMS", "github-actions,gitlab-ci,jenkins").split(",")
    default_cicd_platform: str = os.getenv("DEFAULT_CICD_PLATFORM", "github-actions")
    
    # Orchestration
    kubernetes_configs: bool = os.getenv("KUBERNETES_CONFIGS", "true").lower() == "true"
    docker_compose_configs: bool = os.getenv("DOCKER_COMPOSE_CONFIGS", "true").lower() == "true"
    helm_charts: bool = os.getenv("HELM_CHARTS", "false").lower() == "true"

    # =============================================================================
    # PERFORMANCE & SECURITY
    # =============================================================================
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", 100))
    rate_limit_window: int = int(os.getenv("RATE_LIMIT_WINDOW", 60))
    max_request_size: str = os.getenv("MAX_REQUEST_SIZE", "10MB")
    request_timeout: int = int(os.getenv("REQUEST_TIMEOUT", 60))
    
    # CORS Configuration
    cors_origins: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,https://deployio.tech").split(",")

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
    enable_nodejs_analysis: bool = os.getenv("ENABLE_NODEJS_ANALYSIS", "true").lower() == "true"
    enable_python_analysis: bool = os.getenv("ENABLE_PYTHON_ANALYSIS", "true").lower() == "true"
    enable_java_analysis: bool = os.getenv("ENABLE_JAVA_ANALYSIS", "true").lower() == "true"
    enable_go_analysis: bool = os.getenv("ENABLE_GO_ANALYSIS", "true").lower() == "true"
    enable_php_analysis: bool = os.getenv("ENABLE_PHP_ANALYSIS", "true").lower() == "true"
    enable_dotnet_analysis: bool = os.getenv("ENABLE_DOTNET_ANALYSIS", "true").lower() == "true"
    enable_ruby_analysis: bool = os.getenv("ENABLE_RUBY_ANALYSIS", "true").lower() == "true"
    enable_rust_analysis: bool = os.getenv("ENABLE_RUST_ANALYSIS", "true").lower() == "true"
    
    # Frontend Frameworks
    enable_react_analysis: bool = os.getenv("ENABLE_REACT_ANALYSIS", "true").lower() == "true"
    enable_nextjs_analysis: bool = os.getenv("ENABLE_NEXTJS_ANALYSIS", "true").lower() == "true"
    enable_vue_analysis: bool = os.getenv("ENABLE_VUE_ANALYSIS", "true").lower() == "true"
    enable_angular_analysis: bool = os.getenv("ENABLE_ANGULAR_ANALYSIS", "true").lower() == "true"
    enable_svelte_analysis: bool = os.getenv("ENABLE_SVELTE_ANALYSIS", "true").lower() == "true"
    
    # Mobile & Cross-Platform
    enable_flutter_analysis: bool = os.getenv("ENABLE_FLUTTER_ANALYSIS", "true").lower() == "true"
    enable_react_native_analysis: bool = os.getenv("ENABLE_REACT_NATIVE_ANALYSIS", "true").lower() == "true"
    enable_swift_analysis: bool = os.getenv("ENABLE_SWIFT_ANALYSIS", "false").lower() == "true"
    enable_kotlin_analysis: bool = os.getenv("ENABLE_KOTLIN_ANALYSIS", "true").lower() == "true"
    
    # Emerging Technologies
    enable_dart_analysis: bool = os.getenv("ENABLE_DART_ANALYSIS", "false").lower() == "true"
    enable_scala_analysis: bool = os.getenv("ENABLE_SCALA_ANALYSIS", "false").lower() == "true"
    enable_elixir_analysis: bool = os.getenv("ENABLE_ELIXIR_ANALYSIS", "false").lower() == "true"

    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()
    production_url: str = os.getenv("PRODUCTION_URL", "")  # Security settings
    jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-here")
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    # AI/LLM Integration settings
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "llama3-8b-8192")
    groq_max_tokens: int = int(os.getenv("GROQ_MAX_TOKENS", 4096))
    groq_temperature: float = float(os.getenv("GROQ_TEMPERATURE", 0.3))

    # GitHub API settings
    github_token: str = os.getenv("GITHUB_TOKEN", "")

    # Template Engine settings
    templates_path: str = os.getenv("TEMPLATES_PATH", "./templates")
    enable_llm_fallback: bool = (
        os.getenv("ENABLE_LLM_FALLBACK", "true").lower() == "true"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra environment variables to be ignored


# Create settings instance
settings = Settings()
