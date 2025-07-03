"""
Request Validators

Input validation utilities for analysis requests and repository data.
Provides comprehensive validation with detailed error messages.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import urlparse
from pydantic import ValidationError

from models.analysis_models import AnalysisRequest
from models.common_models import AnalysisType

logger = logging.getLogger(__name__)


class RequestValidator:
    """
    Comprehensive request validation for analysis requests.
    Validates URLs, repository data, and request parameters.
    """
    
    # Supported Git hosting platforms
    SUPPORTED_PLATFORMS = {
        'github.com',
        'gitlab.com',
        'bitbucket.org',
        'codeberg.org',
        'git.sr.ht'
    }
    
    # Maximum file size for analysis (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    
    # Maximum total repository size (100MB)
    MAX_REPO_SIZE = 100 * 1024 * 1024
    
    # Supported file extensions for analysis
    SUPPORTED_EXTENSIONS = {
        '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.cs',
        '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.sh',
        '.yaml', '.yml', '.json', '.xml', '.toml', '.ini', '.cfg',
        '.md', '.txt', '.dockerfile', '.gitignore'
    }
    
    @classmethod
    def validate_analysis_request(cls, request_data: Dict[str, Any]) -> Tuple[bool, Optional[AnalysisRequest], List[str]]:
        """
        Validate analysis request data.
        
        Args:
            request_data: Raw request data
            
        Returns:
            Tuple of (is_valid, parsed_request, error_messages)
        """
        errors = []
        
        try:
            # Validate that either repository_url or repository_data is provided
            has_url = request_data.get('repository_url')
            has_data = request_data.get('repository_data')
            
            if not has_url and not has_data:
                errors.append("Either repository_url or repository_data must be provided")
            
            if has_url and has_data:
                errors.append("Provide either repository_url or repository_data, not both")
            
            # Validate repository URL if provided
            if has_url:
                url_valid, url_errors = cls.validate_repository_url(request_data['repository_url'])
                if not url_valid:
                    errors.extend(url_errors)
            
            # Validate repository data if provided
            if has_data:
                data_valid, data_errors = cls.validate_repository_data(request_data['repository_data'])
                if not data_valid:
                    errors.extend(data_errors)
            
            # Validate analysis types
            analysis_types = request_data.get('analysis_types', [])
            if analysis_types:
                type_valid, type_errors = cls.validate_analysis_types(analysis_types)
                if not type_valid:
                    errors.extend(type_errors)
            
            # Validate configuration generation options
            if request_data.get('generate_configs'):
                config_types = request_data.get('config_types', [])
                if config_types:
                    config_valid, config_errors = cls.validate_config_types(config_types)
                    if not config_valid:
                        errors.extend(config_errors)
            
            # Validate options
            options = request_data.get('options', {})
            if options:
                opt_valid, opt_errors = cls.validate_request_options(options)
                if not opt_valid:
                    errors.extend(opt_errors)
            
            # If no errors, try to create the request model
            if not errors:
                try:
                    request = AnalysisRequest(**request_data)
                    return True, request, []
                except ValidationError as e:
                    errors.extend([f"Validation error: {err['msg']}" for err in e.errors()])
            
            return False, None, errors
            
        except Exception as e:
            logger.error(f"Request validation failed: {e}")
            return False, None, [f"Validation error: {str(e)}"]
    
    @classmethod
    def validate_repository_url(cls, url: str) -> Tuple[bool, List[str]]:
        """
        Validate repository URL format and platform support.
        
        Args:
            url: Repository URL to validate
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        try:
            # Basic URL validation
            if not isinstance(url, str) or not url.strip():
                errors.append("Repository URL must be a non-empty string")
                return False, errors
            
            # Parse URL
            parsed = urlparse(url.strip())
            
            # Check scheme
            if parsed.scheme not in ['http', 'https', 'git']:
                errors.append("Repository URL must use http, https, or git scheme")
            
            # Check hostname
            if not parsed.hostname:
                errors.append("Repository URL must have a valid hostname")
                return False, errors
            
            # Check if platform is supported
            hostname = parsed.hostname.lower()
            if not any(platform in hostname for platform in cls.SUPPORTED_PLATFORMS):
                supported_list = ', '.join(cls.SUPPORTED_PLATFORMS)
                errors.append(f"Unsupported platform. Supported platforms: {supported_list}")
            
            # Check path format
            if not parsed.path or len(parsed.path.strip('/').split('/')) < 2:
                errors.append("Repository URL must include owner and repository name")
            
            # Check for common URL patterns
            path = parsed.path.strip('/')
            if path.endswith('.git'):
                path = path[:-4]
            
            parts = path.split('/')
            if len(parts) < 2:
                errors.append("Repository URL must be in format: platform.com/owner/repo")
            elif any(not part or part.startswith('.') for part in parts[:2]):
                errors.append("Owner and repository names cannot be empty or start with '.'")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"URL validation failed: {e}")
            return False, [f"URL validation error: {str(e)}"]
    
    @classmethod
    def validate_analysis_types(cls, analysis_types: List[str]) -> Tuple[bool, List[str]]:
        """
        Validate requested analysis types.
        
        Args:
            analysis_types: List of analysis type strings
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        try:
            if not isinstance(analysis_types, list):
                errors.append("Analysis types must be a list")
                return False, errors
            
            if not analysis_types:
                errors.append("At least one analysis type must be specified")
                return False, errors
            
            # Get valid analysis types
            valid_types = [t.value for t in AnalysisType]
            
            # Check each type
            for analysis_type in analysis_types:
                if not isinstance(analysis_type, str):
                    errors.append(f"Analysis type must be a string, got {type(analysis_type)}")
                elif analysis_type not in valid_types:
                    errors.append(f"Invalid analysis type '{analysis_type}'. Valid types: {', '.join(valid_types)}")
            
            # Check for duplicates
            if len(analysis_types) != len(set(analysis_types)):
                errors.append("Duplicate analysis types are not allowed")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Analysis types validation failed: {e}")
            return False, [f"Analysis types validation error: {str(e)}"]
    
    @classmethod
    def validate_request_options(cls, options: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate request options.
        
        Args:
            options: Options dictionary
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        try:
            if not isinstance(options, dict):
                errors.append("Options must be a dictionary")
                return False, errors
            
            # Validate include_llm_enhancement
            if 'include_llm_enhancement' in options:
                if not isinstance(options['include_llm_enhancement'], bool):
                    errors.append("include_llm_enhancement must be a boolean")
            
            # Validate cache_enabled
            if 'cache_enabled' in options:
                if not isinstance(options['cache_enabled'], bool):
                    errors.append("cache_enabled must be a boolean")
            
            # Validate max_file_size
            if 'max_file_size' in options:
                max_size = options['max_file_size']
                if not isinstance(max_size, int) or max_size <= 0:
                    errors.append("max_file_size must be a positive integer")
                elif max_size > cls.MAX_FILE_SIZE:
                    errors.append(f"max_file_size cannot exceed {cls.MAX_FILE_SIZE} bytes")
            
            # Validate timeout
            if 'timeout' in options:
                timeout = options['timeout']
                if not isinstance(timeout, (int, float)) or timeout <= 0:
                    errors.append("timeout must be a positive number")
                elif timeout > 300:  # 5 minutes max
                    errors.append("timeout cannot exceed 300 seconds")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Options validation failed: {e}")
            return False, [f"Options validation error: {str(e)}"]
    
    @classmethod
    def validate_repository_data(cls, repository_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate repository data structure and content.
        
        Args:
            repository_data: Repository data to validate
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        try:
            if not isinstance(repository_data, dict):
                errors.append("Repository data must be a dictionary")
                return False, errors
            
            # Check required fields
            if 'files' not in repository_data:
                errors.append("Repository data must contain 'files' field")
                return False, errors
            
            files = repository_data['files']
            if not isinstance(files, dict):
                errors.append("Files must be a dictionary mapping file paths to content")
                return False, errors
            
            if not files:
                errors.append("Repository must contain at least one file")
                return False, errors
            
            # Validate individual files
            total_size = 0
            for file_path, content in files.items():
                # Validate file path
                if not isinstance(file_path, str) or not file_path.strip():
                    errors.append("File paths must be non-empty strings")
                    continue
                
                # Validate content
                if not isinstance(content, str):
                    errors.append(f"File content for '{file_path}' must be a string")
                    continue
                
                # Check file size
                content_size = len(content.encode('utf-8'))
                if content_size > cls.MAX_FILE_SIZE:
                    errors.append(f"File '{file_path}' exceeds maximum size of {cls.MAX_FILE_SIZE} bytes")
                    continue
                
                total_size += content_size
                
                # Check file extension
                file_ext = '.' + file_path.split('.')[-1] if '.' in file_path else ''
                if file_ext and file_ext.lower() not in cls.SUPPORTED_EXTENSIONS:
                    logger.debug(f"Unsupported file extension: {file_ext} for {file_path}")
            
            # Check total repository size
            if total_size > cls.MAX_REPO_SIZE:
                errors.append(f"Total repository size exceeds maximum of {cls.MAX_REPO_SIZE} bytes")
            
            # Validate metadata if present
            if 'metadata' in repository_data:
                metadata = repository_data['metadata']
                if not isinstance(metadata, dict):
                    errors.append("Repository metadata must be a dictionary")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Repository data validation failed: {e}")
            return False, [f"Repository data validation error: {str(e)}"]
    
    @classmethod
    def validate_file_content(cls, file_path: str, content: str) -> Tuple[bool, List[str]]:
        """
        Validate individual file content.
        
        Args:
            file_path: Path of the file
            content: File content
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        try:
            # Check if content is valid UTF-8
            try:
                content.encode('utf-8')
            except UnicodeEncodeError:
                errors.append(f"File '{file_path}' contains invalid UTF-8 characters")
            
            # Check for extremely long lines (potential binary files)
            lines = content.split('\n')
            for i, line in enumerate(lines[:100]):  # Check first 100 lines
                if len(line) > 10000:  # 10k characters per line
                    errors.append(f"File '{file_path}' line {i+1} is extremely long (possible binary file)")
                    break
            
            # Check for suspicious patterns that might indicate binary files
            if len(content) > 1000:  # Only check larger files
                null_bytes = content.count('\x00')
                if null_bytes > len(content) * 0.01:  # More than 1% null bytes
                    errors.append(f"File '{file_path}' appears to be a binary file")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"File content validation failed: {e}")
            return False, [f"File validation error: {str(e)}"]
    
    @classmethod
    def sanitize_repository_data(cls, repository_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize repository data by removing or fixing problematic content.
        
        Args:
            repository_data: Raw repository data
            
        Returns:
            Sanitized repository data
        """
        sanitized = {
            'files': {},
            'metadata': repository_data.get('metadata', {})
        }
        
        files = repository_data.get('files', {})
        
        for file_path, content in files.items():
            try:
                # Skip binary files
                if cls._is_binary_file(file_path, content):
                    logger.debug(f"Skipping binary file: {file_path}")
                    continue
                
                # Limit file size
                if len(content) > cls.MAX_FILE_SIZE:
                    content = content[:cls.MAX_FILE_SIZE] + "\n... [file truncated]"
                    logger.warning(f"Truncated large file: {file_path}")
                
                # Clean content
                content = cls._clean_file_content(content)
                
                sanitized['files'][file_path] = content
                
            except Exception as e:
                logger.warning(f"Failed to sanitize file {file_path}: {e}")
                continue
        
        return sanitized
    
    @classmethod
    def _is_binary_file(cls, file_path: str, content: str) -> bool:
        """Check if a file is likely binary based on path and content."""
        # Check file extension
        binary_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.zip', '.tar', '.gz', '.rar', '.7z',
            '.exe', '.dll', '.so', '.dylib',
            '.mp3', '.mp4', '.avi', '.mov', '.wav',
            '.bin', '.dat', '.db', '.sqlite'
        }
        
        file_ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
        if file_ext in binary_extensions:
            return True
        
        # Check content for binary patterns
        if len(content) > 512:  # Check first 512 bytes
            sample = content[:512]
            null_bytes = sample.count('\x00')
            if null_bytes > len(sample) * 0.1:  # More than 10% null bytes
                return True
        
        return False
    
    @classmethod
    def _clean_file_content(cls, content: str) -> str:
        """Clean file content by removing problematic characters."""
        try:
            # Remove null bytes
            content = content.replace('\x00', '')
            
            # Normalize line endings
            content = content.replace('\r\n', '\n').replace('\r', '\n')
            
            # Limit line length
            lines = content.split('\n')
            cleaned_lines = []
            
            for line in lines:
                if len(line) > 1000:  # Truncate very long lines
                    line = line[:1000] + "... [line truncated]"
                cleaned_lines.append(line)
            
            return '\n'.join(cleaned_lines)
            
        except Exception as e:
            logger.warning(f"Failed to clean content: {e}")
            return content
    
    @classmethod
    def validate_config_types(cls, config_types: List[str]) -> Tuple[bool, List[str]]:
        """
        Validate requested configuration types.
        
        Args:
            config_types: List of configuration type strings
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        try:
            if not isinstance(config_types, list):
                errors.append("Configuration types must be a list")
                return False, errors
            
            if not config_types:
                errors.append("At least one configuration type must be specified when generate_configs is true")
                return False, errors
            
            # Valid configuration types
            valid_types = [
                "dockerfile", "docker_compose", "github_actions", "gitlab_ci", 
                "kubernetes", "azure_pipelines", "jenkins", "terraform"
            ]
            
            # Check each type
            for config_type in config_types:
                if not isinstance(config_type, str):
                    errors.append(f"Configuration type must be a string, got {type(config_type)}")
                elif config_type not in valid_types:
                    errors.append(f"Invalid configuration type '{config_type}'. Valid types: {', '.join(valid_types)}")
            
            # Check for duplicates
            if len(config_types) != len(set(config_types)):
                errors.append("Duplicate configuration types are not allowed")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Configuration types validation failed: {e}")
            return False, [f"Configuration types validation error: {str(e)}"]
