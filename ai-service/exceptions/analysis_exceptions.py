"""
Custom exceptions for analysis operations
Provides specific error types with appropriate HTTP status codes
"""


class AnalysisException(Exception):
    """Base exception for analysis operations"""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class RepositoryNotFoundException(AnalysisException):
    """Raised when repository is not found or inaccessible"""

    def __init__(self, repository_url: str, original_error: str = None):
        message = f"Repository not found or inaccessible: {repository_url}"
        if original_error:
            message += f" - {original_error}"
        super().__init__(message, status_code=404)
        self.repository_url = repository_url


class RepositoryAccessException(AnalysisException):
    """Raised when repository exists but access is denied"""

    def __init__(self, repository_url: str, original_error: str = None):
        message = f"Access denied to repository: {repository_url}"
        if original_error:
            message += f" - {original_error}"
        super().__init__(message, status_code=403)
        self.repository_url = repository_url


class InvalidRepositoryException(AnalysisException):
    """Raised when repository URL is invalid"""

    def __init__(self, repository_url: str):
        message = f"Invalid repository URL: {repository_url}"
        super().__init__(message, status_code=400)
        self.repository_url = repository_url


class BranchNotFoundException(AnalysisException):
    """Raised when specified branch does not exist"""

    def __init__(self, repository_url: str, branch: str):
        message = f"Branch '{branch}' not found in repository: {repository_url}"
        super().__init__(message, status_code=404)
        self.repository_url = repository_url
        self.branch = branch


class AnalysisTimeoutException(AnalysisException):
    """Raised when analysis operation times out"""

    def __init__(self, repository_url: str, timeout_duration: int):
        message = f"Analysis timed out after {timeout_duration}s for repository: {repository_url}"
        super().__init__(message, status_code=408)
        self.repository_url = repository_url
        self.timeout_duration = timeout_duration


class LLMServiceException(AnalysisException):
    """Raised when LLM service is unavailable or fails"""

    def __init__(self, operation: str, original_error: str = None):
        message = f"LLM service error during {operation}"
        if original_error:
            message += f": {original_error}"
        super().__init__(message, status_code=503)
        self.operation = operation


class RateLimitExceededException(AnalysisException):
    """Raised when API rate limits are exceeded"""

    def __init__(self, service: str, reset_time: int = None):
        message = f"Rate limit exceeded for {service}"
        if reset_time:
            message += f". Resets at {reset_time}"
        super().__init__(message, status_code=429)
        self.service = service
        self.reset_time = reset_time


class InsufficientDataException(AnalysisException):
    """Raised when repository has insufficient data for analysis"""

    def __init__(self, repository_url: str, reason: str):
        message = f"Insufficient data for analysis of {repository_url}: {reason}"
        super().__init__(message, status_code=422)
        self.repository_url = repository_url
        self.reason = reason


class ConfigurationException(AnalysisException):
    """Raised when service configuration is invalid"""

    def __init__(self, config_issue: str):
        message = f"Service configuration error: {config_issue}"
        super().__init__(message, status_code=500)
        self.config_issue = config_issue


class DependencyServiceException(AnalysisException):
    """Raised when external dependency service fails"""

    def __init__(self, service: str, operation: str, original_error: str = None):
        message = f"External service '{service}' failed during {operation}"
        if original_error:
            message += f": {original_error}"
        super().__init__(message, status_code=502)
        self.service = service
        self.operation = operation
