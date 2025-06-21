"""
Input Validators - Validation utilities for AI service inputs
Ensures data integrity and security for all analysis operations
"""

import re
import logging
from typing import Dict, List, Optional, Any, Union
from urllib.parse import urlparse
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of validation operation"""
    is_valid: bool
    errors: List[str]
    warnings: List[str] = None
    sanitized_input: Optional[Any] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


class InputValidator:
    """
    Comprehensive input validation for AI service
    
    Validates:
    - Repository URLs
    - Analysis options
    - Configuration parameters
    - User inputs
    """
    
    def __init__(self):
        self.github_url_pattern = re.compile(
            r'^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/?$'
        )
        self.gitlab_url_pattern = re.compile(
            r'^https://gitlab\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/?$'
        )
        self.bitbucket_url_pattern = re.compile(
            r'^https://bitbucket\.org/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/?$'
        )
        
        self.supported_languages = {
            'javascript', 'typescript', 'python', 'java', 'go', 'php', 'ruby',
            'rust', 'c', 'cpp', 'csharp', 'swift', 'kotlin', 'scala', 'dart'
        }
        
        self.supported_frameworks = {
            'react', 'vue', 'angular', 'svelte', 'express', 'fastapi', 'django',
            'flask', 'spring', 'gin', 'laravel', 'rails', 'actix', 'rocket'
        }
    
    def validate_repository_url(self, url: str) -> ValidationResult:
        """Validate repository URL format and accessibility"""
        errors = []
        warnings = []
        
        if not url:
            errors.append("Repository URL is required")
            return ValidationResult(False, errors, warnings)
        
        if not isinstance(url, str):
            errors.append("Repository URL must be a string")
            return ValidationResult(False, errors, warnings)
        
        # Clean up URL
        url = url.strip().rstrip('/')
        
        # Basic URL validation
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                errors.append("Invalid URL format")
                return ValidationResult(False, errors, warnings)
        except Exception as e:
            errors.append(f"Invalid URL format: {str(e)}")
            return ValidationResult(False, errors, warnings)
        
        # Check supported platforms
        is_supported = (
            self.github_url_pattern.match(url) or
            self.gitlab_url_pattern.match(url) or
            self.bitbucket_url_pattern.match(url)
        )
        
        if not is_supported:
            errors.append("Unsupported repository platform. Supported: GitHub, GitLab, Bitbucket")
            return ValidationResult(False, errors, warnings)
        
        # Additional checks
        if len(url) > 500:
            errors.append("Repository URL too long (max 500 characters)")
        
        # Check for suspicious patterns
        suspicious_patterns = ['javascript:', 'data:', 'vbscript:', '<script']
        if any(pattern in url.lower() for pattern in suspicious_patterns):
            errors.append("Repository URL contains suspicious content")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_input=url
        )
    
    def validate_analysis_options(self, options: Dict[str, Any]) -> ValidationResult:
        """Validate analysis options dictionary"""
        errors = []
        warnings = []
        sanitized_options = {}
        
        if not isinstance(options, dict):
            errors.append("Analysis options must be a dictionary")
            return ValidationResult(False, errors, warnings)
        
        # Validate specific options
        for key, value in options.items():
            if key == "include_dependencies":
                if not isinstance(value, bool):
                    errors.append("include_dependencies must be a boolean")
                else:
                    sanitized_options[key] = value
            
            elif key == "include_security":
                if not isinstance(value, bool):
                    errors.append("include_security must be a boolean")
                else:
                    sanitized_options[key] = value
            
            elif key == "analysis_depth":
                if not isinstance(value, str) or value not in ["shallow", "medium", "deep"]:
                    errors.append("analysis_depth must be 'shallow', 'medium', or 'deep'")
                else:
                    sanitized_options[key] = value
            
            elif key == "target_languages":
                if isinstance(value, list):
                    valid_languages = [lang for lang in value if lang.lower() in self.supported_languages]
                    if len(valid_languages) != len(value):
                        invalid_langs = set(value) - set(valid_languages)
                        warnings.append(f"Unsupported languages ignored: {', '.join(invalid_langs)}")
                    sanitized_options[key] = valid_languages
                else:
                    errors.append("target_languages must be a list")
            
            elif key == "timeout":
                if isinstance(value, (int, float)) and 1 <= value <= 300:
                    sanitized_options[key] = int(value)
                else:
                    errors.append("timeout must be between 1 and 300 seconds")
            
            elif key == "use_llm":
                if not isinstance(value, bool):
                    errors.append("use_llm must be a boolean")
                else:
                    sanitized_options[key] = value
            
            elif key == "cache_results":
                if not isinstance(value, bool):
                    errors.append("cache_results must be a boolean")
                else:
                    sanitized_options[key] = value
            
            else:
                warnings.append(f"Unknown option '{key}' ignored")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_input=sanitized_options
        )
    
    def validate_code_content(self, content: str, max_size: int = 1048576) -> ValidationResult:
        """Validate code content for analysis"""
        errors = []
        warnings = []
        
        if not isinstance(content, str):
            errors.append("Code content must be a string")
            return ValidationResult(False, errors, warnings)
        
        if len(content) == 0:
            errors.append("Code content cannot be empty")
            return ValidationResult(False, errors, warnings)
        
        if len(content) > max_size:
            errors.append(f"Code content too large (max {max_size} bytes)")
            return ValidationResult(False, errors, warnings)
        
        # Check for potentially malicious content
        malicious_patterns = [
            r'eval\s*\(',
            r'exec\s*\(',
            r'__import__\s*\(',
            r'system\s*\(',
            r'shell_exec\s*\(',
            r'passthru\s*\(',
        ]
        
        for pattern in malicious_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                warnings.append("Code contains potentially dangerous functions")
                break
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_input=content
        )
    
    def validate_configuration_request(self, request_data: Dict[str, Any]) -> ValidationResult:
        """Validate configuration generation request"""
        errors = []
        warnings = []
        sanitized_data = {}
        
        if not isinstance(request_data, dict):
            errors.append("Request data must be a dictionary")
            return ValidationResult(False, errors, warnings)
        
        # Required fields
        required_fields = ["technology_stack", "config_type"]
        for field in required_fields:
            if field not in request_data:
                errors.append(f"Required field '{field}' missing")
            else:
                sanitized_data[field] = request_data[field]
        
        # Validate config_type
        if "config_type" in request_data:
            valid_config_types = [
                "dockerfile", "docker-compose", "kubernetes", "github-actions",
                "gitlab-ci", "jenkins", "azure-pipelines"
            ]
            if request_data["config_type"] not in valid_config_types:
                errors.append(f"Invalid config_type. Valid types: {', '.join(valid_config_types)}")
        
        # Validate technology_stack
        if "technology_stack" in request_data:
            stack_result = self.validate_technology_stack(request_data["technology_stack"])
            if not stack_result.is_valid:
                errors.extend([f"Technology stack error: {error}" for error in stack_result.errors])
            else:
                sanitized_data["technology_stack"] = stack_result.sanitized_input
        
        # Validate optional fields
        if "options" in request_data:
            options_result = self.validate_analysis_options(request_data["options"])
            if not options_result.is_valid:
                errors.extend([f"Options error: {error}" for error in options_result.errors])
            else:
                sanitized_data["options"] = options_result.sanitized_input
                warnings.extend(options_result.warnings)
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_input=sanitized_data
        )
    
    def validate_technology_stack(self, stack_data: Dict[str, Any]) -> ValidationResult:
        """Validate technology stack data"""
        errors = []
        warnings = []
        sanitized_stack = {}
        
        if not isinstance(stack_data, dict):
            errors.append("Technology stack must be a dictionary")
            return ValidationResult(False, errors, warnings)
        
        # Validate primary_language
        if "primary_language" in stack_data:
            lang = stack_data["primary_language"]
            if isinstance(lang, str) and lang.lower() in self.supported_languages:
                sanitized_stack["primary_language"] = lang.lower()
            else:
                errors.append(f"Unsupported primary language: {lang}")
        
        # Validate frameworks
        if "frameworks" in stack_data:
            if isinstance(stack_data["frameworks"], list):
                valid_frameworks = [
                    fw for fw in stack_data["frameworks"] 
                    if fw.lower() in self.supported_frameworks
                ]
                sanitized_stack["frameworks"] = valid_frameworks
                
                invalid_frameworks = set(stack_data["frameworks"]) - set(valid_frameworks)
                if invalid_frameworks:
                    warnings.append(f"Unsupported frameworks ignored: {', '.join(invalid_frameworks)}")
            else:
                errors.append("Frameworks must be a list")
        
        # Validate other fields
        list_fields = ["databases", "package_managers", "build_tools", "deployment_targets"]
        for field in list_fields:
            if field in stack_data:
                if isinstance(stack_data[field], list):
                    sanitized_stack[field] = [str(item) for item in stack_data[field]]
                else:
                    errors.append(f"{field} must be a list")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_input=sanitized_stack
        )
    
    def sanitize_string(self, input_str: str, max_length: int = 1000) -> str:
        """Sanitize string input by removing dangerous characters"""
        if not isinstance(input_str, str):
            return ""
        
        # Remove control characters except whitespace
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', input_str)
        
        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        # Remove potentially dangerous patterns
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'data:',
            r'vbscript:',
            r'on\w+\s*=',
        ]
        
        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)
        
        return sanitized.strip()
    
    def validate_batch_request(self, repositories: List[str], options: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Validate batch analysis request"""
        errors = []
        warnings = []
        sanitized_repos = []
        
        if not isinstance(repositories, list):
            errors.append("Repositories must be a list")
            return ValidationResult(False, errors, warnings)
        
        if len(repositories) == 0:
            errors.append("At least one repository is required")
            return ValidationResult(False, errors, warnings)
        
        if len(repositories) > 10:
            errors.append("Maximum 10 repositories allowed per batch")
            return ValidationResult(False, errors, warnings)
        
        # Validate each repository
        for i, repo_url in enumerate(repositories):
            repo_result = self.validate_repository_url(repo_url)
            if repo_result.is_valid:
                sanitized_repos.append(repo_result.sanitized_input)
            else:
                errors.extend([f"Repository {i+1}: {error}" for error in repo_result.errors])
        
        # Validate options if provided
        sanitized_options = {}
        if options:
            options_result = self.validate_analysis_options(options)
            if options_result.is_valid:
                sanitized_options = options_result.sanitized_input
                warnings.extend(options_result.warnings)
            else:
                errors.extend([f"Options error: {error}" for error in options_result.errors])
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_input={
                "repositories": sanitized_repos,
                "options": sanitized_options
            }
        )
