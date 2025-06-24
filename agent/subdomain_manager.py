#!/usr/bin/env python3
"""
Subdomain Management Service for Deployio Agent
Handles reserved subdomain detection and routing
"""

import json
from pathlib import Path


class SubdomainManager:
    def __init__(self, config_path="config/subdomains.json"):
        self.config_path = Path(config_path)
        self.config = self.load_config()

    def load_config(self):
        """Load subdomain configuration from JSON file"""
        try:
            with open(self.config_path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            # Default configuration if file doesn't exist
            return {
                "reserved": [
                    "agent",
                    "app",
                    "traefik",
                    "landing",
                    "admin",
                    "dashboard",
                ],
                "blocked": ["admin", "root", "support", "help"],
                "platform": {
                    "name": "Deployio",
                    "url": "https://deployio.tech",
                    "contact": "support@deployio.tech",
                },
            }

    def reload_config(self):
        """Reload configuration from file"""
        self.config = self.load_config()

    def is_reserved(self, subdomain):
        """Check if subdomain is reserved"""
        subdomain = subdomain.lower().strip()
        return subdomain in self.config.get("reserved", [])

    def is_blocked(self, subdomain):
        """Check if subdomain is blocked"""
        subdomain = subdomain.lower().strip()
        return subdomain in self.config.get("blocked", [])

    def is_available(self, subdomain):
        """Check if subdomain is available for deployment"""
        return not (self.is_reserved(subdomain) or self.is_blocked(subdomain))

    def get_reserved_list(self):
        """Get list of all reserved subdomains"""
        return self.config.get("reserved", [])

    def get_blocked_list(self):
        """Get list of all blocked subdomains"""
        return self.config.get("blocked", [])

    def add_reserved(self, subdomain):
        """Add subdomain to reserved list"""
        subdomain = subdomain.lower().strip()
        if subdomain not in self.config.get("reserved", []):
            self.config.setdefault("reserved", []).append(subdomain)
            self.save_config()
            return True
        return False

    def remove_reserved(self, subdomain):
        """Remove subdomain from reserved list"""
        subdomain = subdomain.lower().strip()
        if subdomain in self.config.get("reserved", []):
            self.config["reserved"].remove(subdomain)
            self.save_config()
            return True
        return False

    def save_config(self):
        """Save configuration to file"""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, "w") as f:
            json.dump(self.config, f, indent=2)

    def get_platform_info(self):
        """Get platform information"""
        return self.config.get("platform", {})


# Example usage and API endpoints
if __name__ == "__main__":
    # Example usage
    manager = SubdomainManager()

    # Test subdomains
    test_subdomains = ["agent", "app", "myapp", "admin", "test123"]

    for subdomain in test_subdomains:
        print(
            f"{subdomain}: Reserved={manager.is_reserved(subdomain)}, "
            f"Blocked={manager.is_blocked(subdomain)}, "
            f"Available={manager.is_available(subdomain)}"
        )
