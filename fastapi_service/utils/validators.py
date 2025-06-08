"""
Utility functions for FastAPI service
"""

import re
from typing import Optional


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_password(password: str) -> bool:
    """Validate password strength"""
    return len(password) >= 6


def validate_username(username: str) -> bool:
    """Validate username format"""
    return len(username) >= 3 and username.replace("_", "").replace("-", "").isalnum()


def clean_string(text: Optional[str]) -> Optional[str]:
    """Clean and trim string"""
    if not text:
        return text
    return text.strip()


def format_error_message(error: str) -> str:
    """Format error message for consistent responses"""
    return error.replace("_", " ").title()
