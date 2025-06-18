"""
Traefik Service - Dynamic routing and subdomain management
"""

import os
import yaml
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from pathlib import Path
from config.settings import settings
import logging

logger = logging.getLogger(__name__)


class TraefikService:
    def __init__(self):
        self.traefik_api_url = settings.traefik_api_url or "http://traefik:8080"
        self.config_dir = Path(settings.traefik_config_dir or "/dynamic")
        self.dynamic_config_path = self.config_dir / "dynamic.yml"
        self.reserved_subdomains = {
            "agent",
            "app",
            "traefik",
            "api",
            "admin",
            "www",
            "mail",
            "ftp",
            "ssh",
            "vpn",
        }

    async def is_subdomain_available(self, subdomain: str) -> bool:
        """Check if a subdomain is available for use"""
        if subdomain.lower() in self.reserved_subdomains:
            return False

        # Check if already in use
        current_routes = await self.get_current_routes()
        for route_name, route_config in current_routes.items():
            if f"{subdomain}.{settings.base_domain}" in route_config.get("rule", ""):
                return False

        return True

    async def get_current_routes(self) -> Dict[str, Any]:
        """Get current Traefik routes"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.traefik_api_url}/api/http/routers")
                if response.status_code == 200:
                    return response.json()
                return {}
        except Exception as e:
            logger.error(f"Failed to get current routes: {e}")
            return {}

    async def create_app_route(
        self, subdomain: str, service_name: str, port: int
    ) -> bool:
        """Create a new route for a deployed application"""
        try:
            if not await self.is_subdomain_available(subdomain):
                logger.error(f"Subdomain {subdomain} is not available")
                return False

            # Load current dynamic configuration
            config = await self.load_dynamic_config()

            # Add new route for the application
            route_name = f"app-{subdomain}"
            service_key = f"app-{subdomain}-service"

            # Create router configuration
            config["http"]["routers"][route_name] = {
                "rule": f"Host(`{subdomain}.{settings.base_domain}`)",
                "service": service_key,
                "tls": {"certResolver": "letsencrypt"},
                "middlewares": ["app-cors", "app-security"],
            }

            # Create service configuration
            config["http"]["services"][service_key] = {
                "loadBalancer": {"servers": [{"url": f"http://{service_name}:{port}"}]}
            }

            # Add middleware for security and CORS
            if "middlewares" not in config["http"]:
                config["http"]["middlewares"] = {}

            config["http"]["middlewares"]["app-cors"] = {
                "headers": {
                    "accessControlAllowOriginList": ["*"],
                    "accessControlAllowMethods": [
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS",
                    ],
                    "accessControlAllowHeaders": ["*"],
                }
            }

            config["http"]["middlewares"]["app-security"] = {
                "headers": {
                    "customRequestHeaders": {"X-Forwarded-Proto": "https"},
                    "customResponseHeaders": {
                        "X-Frame-Options": "SAMEORIGIN",
                        "X-Content-Type-Options": "nosniff",
                        "X-XSS-Protection": "1; mode=block",
                    },
                }
            }

            # Save configuration
            await self.save_dynamic_config(config)

            logger.info(
                f"Created route for {subdomain}.{settings.base_domain} -> {service_name}:{port}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to create app route: {e}")
            return False

    async def remove_app_route(self, subdomain: str) -> bool:
        """Remove a route for a deployed application"""
        try:
            config = await self.load_dynamic_config()

            route_name = f"app-{subdomain}"
            service_key = f"app-{subdomain}-service"

            # Remove router and service
            config["http"]["routers"].pop(route_name, None)
            config["http"]["services"].pop(service_key, None)

            await self.save_dynamic_config(config)

            logger.info(f"Removed route for {subdomain}.{settings.base_domain}")
            return True

        except Exception as e:
            logger.error(f"Failed to remove app route: {e}")
            return False

    async def load_dynamic_config(self) -> Dict[str, Any]:
        """Load current dynamic configuration"""
        try:
            if self.dynamic_config_path.exists():
                with open(self.dynamic_config_path, "r") as f:
                    config = yaml.safe_load(f) or {}
            else:
                config = {}

            # Ensure basic structure exists
            if "http" not in config:
                config["http"] = {}
            if "routers" not in config["http"]:
                config["http"]["routers"] = {}
            if "services" not in config["http"]:
                config["http"]["services"] = {}
            if "middlewares" not in config["http"]:
                config["http"]["middlewares"] = {}

            return config

        except Exception as e:
            logger.error(f"Failed to load dynamic config: {e}")
            return {"http": {"routers": {}, "services": {}, "middlewares": {}}}

    async def save_dynamic_config(self, config: Dict[str, Any]) -> bool:
        """Save dynamic configuration"""
        try:
            # Ensure directory exists
            self.config_dir.mkdir(parents=True, exist_ok=True)

            with open(self.dynamic_config_path, "w") as f:
                yaml.dump(config, f, default_flow_style=False, sort_keys=False)

            logger.info("Dynamic configuration saved successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to save dynamic config: {e}")
            return False

    async def get_app_routes(self) -> List[Dict[str, Any]]:
        """Get all application routes"""
        try:
            config = await self.load_dynamic_config()
            app_routes = []

            for route_name, route_config in config["http"]["routers"].items():
                if route_name.startswith("app-"):
                    subdomain = route_name.replace("app-", "")
                    app_routes.append(
                        {
                            "subdomain": subdomain,
                            "route_name": route_name,
                            "rule": route_config.get("rule", ""),
                            "service": route_config.get("service", ""),
                        }
                    )

            return app_routes

        except Exception as e:
            logger.error(f"Failed to get app routes: {e}")
            return []

    async def health_check(self) -> Dict[str, Any]:
        """Check Traefik service health"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.traefik_api_url}/ping")
                if response.status_code == 200:
                    return {"status": "ok", "message": "Traefik is healthy"}
                else:
                    return {
                        "status": "error",
                        "message": f"Traefik returned {response.status_code}",
                    }
        except Exception as e:
            return {"status": "error", "message": f"Traefik health check failed: {e}"}

    async def get_ssl_certificates(self) -> List[Dict[str, Any]]:
        """Get SSL certificate information"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.traefik_api_url}/api/http/tls")
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception as e:
            logger.error(f"Failed to get SSL certificates: {e}")
            return []


# Global instance
traefik_service = TraefikService()
