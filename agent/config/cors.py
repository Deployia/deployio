"""
CORS configuration with subdomain whitelisting support
"""

import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import settings


def is_subdomain_allowed(
    origin: str, base_domain: str, whitelisted_subdomains: list
) -> bool:
    """
    Check if a subdomain origin is allowed based on whitelisted subdomains

    Args:
        origin: The origin URL (e.g., "https://app.deployio.tech")
        base_domain: The base domain (e.g., "deployio.tech")
        whitelisted_subdomains: List of allowed subdomain patterns

    Returns:
        bool: True if the subdomain is allowed
    """
    if not origin.startswith(("http://", "https://")):
        return False

    # Extract hostname from origin
    hostname = origin.replace("https://", "").replace("http://", "").split("/")[0]

    # Check if it's the base domain
    if hostname == base_domain or hostname == f"www.{base_domain}":
        return True

    # Check if it's a subdomain of the base domain
    if not hostname.endswith(f".{base_domain}"):
        return False

    # Extract subdomain
    subdomain = hostname.replace(f".{base_domain}", "")

    # Check against whitelisted subdomains
    for pattern in whitelisted_subdomains:
        pattern = pattern.strip()
        if not pattern:
            continue

        # Support wildcard patterns
        if "*" in pattern:
            # Convert wildcard pattern to regex
            regex_pattern = pattern.replace("*", ".*")
            if re.match(f"^{regex_pattern}$", subdomain):
                return True
        else:
            # Exact match
            if subdomain == pattern:
                return True

    return False


def get_allowed_origins() -> list:
    """
    Get the list of allowed CORS origins based on configuration

    Returns:
        list: List of allowed origin URLs
    """
    origins = []

    # Base production origins
    base_origins = [
        "https://deployio.tech",
        "https://www.deployio.tech",
        "https://api.deployio.tech",
        "https://service.deployio.tech",
        "https://agent.deployio.tech",
    ]

    if settings.debug:
        # Development origins
        dev_origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8000",
            "https://localhost:3000",
            "https://localhost:5173",
            "https://localhost:8000",
        ]
        origins.extend(dev_origins)
        origins.extend(base_origins)
    else:
        origins.extend(base_origins)

    # Add manually configured origins from environment
    if settings.cors_origins:
        additional_origins = [
            origin.strip()
            for origin in settings.cors_origins.split(",")
            if origin.strip()
        ]
        origins.extend(additional_origins)

    # Add whitelisted subdomain origins
    if settings.whitelisted_subdomains:
        whitelisted = [
            subdomain.strip()
            for subdomain in settings.whitelisted_subdomains.split(",")
            if subdomain.strip()
        ]

        base_domain = settings.base_domain

        # Generate origins for whitelisted subdomains
        for subdomain in whitelisted:
            if "*" not in subdomain:  # Only add exact matches, not wildcard patterns
                subdomain_origin = f"https://{subdomain}.{base_domain}"
                if subdomain_origin not in origins:
                    origins.append(subdomain_origin)

    return list(set(origins))  # Remove duplicates


def custom_cors_origin_validator(origin: str) -> bool:
    """
    Custom CORS origin validator that supports subdomain whitelisting

    Args:
        origin: The origin to validate

    Returns:
        bool: True if origin is allowed
    """
    if not origin:
        return True  # Allow requests with no origin (mobile apps, etc.)

    # Get static allowed origins
    allowed_origins = get_allowed_origins()

    # Check static origins first
    if origin in allowed_origins:
        return True

    # Check subdomain whitelisting if enabled
    if settings.allow_subdomain_wildcards and settings.whitelisted_subdomains:
        whitelisted = [
            subdomain.strip()
            for subdomain in settings.whitelisted_subdomains.split(",")
            if subdomain.strip()
        ]

        if is_subdomain_allowed(origin, settings.base_domain, whitelisted):
            return True

    return False


def setup_cors(app: FastAPI) -> None:
    """Setup CORS middleware with environment-specific settings and subdomain whitelisting"""

    # Get allowed origins
    origins = get_allowed_origins()

    # Build regex pattern for subdomain whitelisting if enabled
    origin_regex = None
    if settings.allow_subdomain_wildcards and settings.whitelisted_subdomains:
        whitelisted = [
            subdomain.strip()
            for subdomain in settings.whitelisted_subdomains.split(",")
            if subdomain.strip()
        ]

        base_domain = settings.base_domain.replace(".", r"\.")

        # Build regex patterns for whitelisted subdomains
        subdomain_patterns = []
        for subdomain in whitelisted:
            if "*" in subdomain:
                # Convert wildcard to regex
                pattern = subdomain.replace("*", ".*")
                subdomain_patterns.append(pattern)
            else:
                # Exact subdomain match
                subdomain_patterns.append(re.escape(subdomain))

        if subdomain_patterns:
            # Create regex that matches: https://[whitelisted-subdomain].deployio.tech
            subdomain_regex = (
                f"https://({'|'.join(subdomain_patterns)})\\.{base_domain}"
            )

            # Also allow the base domain and www
            base_regex = f"https://(www\\.)?{base_domain}"

            # Combine patterns
            origin_regex = f"^({base_regex}|{subdomain_regex})$"

    # Setup CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=origin_regex,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-API-Key",
            "X-Auth-Token",
            "X-Deployment-Key",
            "X-Agent-Secret",
        ],
    )
