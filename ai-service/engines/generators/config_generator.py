"""
Configuration Generator - Generate Docker Compose and Kubernetes configurations
Focused on orchestration and deployment configs only
"""

import logging
import yaml
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from engines.core.models import TechnologyStack, AnalysisResult

logger = logging.getLogger(__name__)


@dataclass
class GeneratedConfig:
    """Generated configuration files and metadata"""
    config_type: str
    filename: str
    content: str
    description: str
    priority: str  # high, medium, low


@dataclass
class ConfigurationPackage:
    """Complete configuration package for deployment"""
    technology_stack: TechnologyStack
    configurations: List[GeneratedConfig]
    deployment_instructions: List[str]
    environment_variables: Dict[str, str]
    recommended_resources: Dict[str, Any]


class ConfigurationGenerator:
    """
    Orchestration configuration generator
    
    Generates ONLY:
    - Docker Compose files
    - Kubernetes manifests
    - Environment configs
    """
    
    def __init__(self):
        self.generators = {
            "docker-compose": self._generate_docker_compose_config,
            "kubernetes": self._generate_kubernetes_config,
            "environment": self._generate_environment_config
        }
        
        logger.info("ConfigurationGenerator initialized successfully")
    
    async def generate_deployment_config(
        self,
        analysis_result: AnalysisResult,
        config_types: List[str] = None,
        deployment_target: str = "production"
    ) -> ConfigurationPackage:
        """
        Generate orchestration deployment configuration
        
        Args:
            analysis_result: Analysis results from detection engine
            config_types: Types of configurations to generate
            deployment_target: Target environment (development, staging, production)
        
        Returns:
            ConfigurationPackage: Complete configuration package
        """
        if config_types is None:
            config_types = ["docker-compose", "kubernetes", "environment"]
        
        logger.info(f"Generating orchestration configs for {analysis_result.repository_url}")
        
        configurations = []
        
        for config_type in config_types:
            if config_type in self.generators:
                try:
                    config = await self.generators[config_type](
                        analysis_result.technology_stack,
                        deployment_target
                    )
                    if config:
                        configurations.append(config)
                except Exception as e:
                    logger.error(f"Failed to generate {config_type} config: {e}")
                    continue
        
        # Generate deployment instructions
        instructions = self._generate_deployment_instructions(
            analysis_result.technology_stack,
            deployment_target
        )
        
        # Generate environment variables
        env_vars = self._generate_environment_variables(
            analysis_result.technology_stack,
            deployment_target
        )
        
        # Generate resource recommendations
        resources = self._generate_resource_recommendations(
            analysis_result.technology_stack
        )
        
        return ConfigurationPackage(
            technology_stack=analysis_result.technology_stack,
            configurations=configurations,
            deployment_instructions=instructions,
            environment_variables=env_vars,
            recommended_resources=resources
        )

    async def _generate_docker_compose_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate Docker Compose configuration"""
        
        services = {}
        
        # Main application service
        app_service = {
            "build": ".",
            "ports": [f"{self._get_default_port(stack)}:{self._get_default_port(stack)}"],
            "environment": self._get_compose_environment(stack, deployment_target),
            "depends_on": []
        }
        
        services["app"] = app_service
        
        # Add database if detected
        if stack.databases:
            for db in stack.databases:
                db_service = self._generate_database_service(db, deployment_target)
                services[db["name"]] = db_service
                app_service["depends_on"].append(db["name"])
        
        # Add cache if Redis is detected
        if any(dep.get("name") == "redis" for dep in stack.dependencies):
            services["redis"] = {
                "image": "redis:7-alpine",
                "ports": ["6379:6379"],
                "volumes": ["redis_data:/data"]
            }
            app_service["depends_on"].append("redis")
        
        compose_config = {
            "version": "3.8",
            "services": services,
            "volumes": self._generate_compose_volumes(services),
            "networks": {
                "app_network": {
                    "driver": "bridge"
                }
            }
        }
        
        # Add networks to all services
        for service in services.values():
            service["networks"] = ["app_network"]
        
        content = yaml.dump(compose_config, default_flow_style=False, indent=2)
        
        return GeneratedConfig(
            config_type="docker-compose",
            filename="docker-compose.yml",
            content=content,
            description="Docker Compose orchestration configuration",
            priority="high"
        )

    async def _generate_kubernetes_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate Kubernetes manifests"""
        
        app_name = stack.project_name.lower().replace(" ", "-") if stack.project_name else "app"
        
        # Deployment
        deployment = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": f"{app_name}-deployment",
                "labels": {"app": app_name}
            },
            "spec": {
                "replicas": 3 if deployment_target == "production" else 1,
                "selector": {"matchLabels": {"app": app_name}},
                "template": {
                    "metadata": {"labels": {"app": app_name}},
                    "spec": {
                        "containers": [{
                            "name": app_name,
                            "image": f"{app_name}:latest",
                            "ports": [{"containerPort": self._get_default_port(stack)}],
                            "env": self._get_k8s_environment(stack, deployment_target),
                            "resources": self._get_k8s_resources(deployment_target)
                        }]
                    }
                }
            }
        }
        
        # Service
        service = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": f"{app_name}-service",
                "labels": {"app": app_name}
            },
            "spec": {
                "selector": {"app": app_name},
                "ports": [{
                    "protocol": "TCP",
                    "port": 80,
                    "targetPort": self._get_default_port(stack)
                }],
                "type": "LoadBalancer" if deployment_target == "production" else "NodePort"
            }
        }
        
        # Combine manifests
        manifests = [deployment, service]
        content = "---\n".join([yaml.dump(manifest, default_flow_style=False) for manifest in manifests])
        
        return GeneratedConfig(
            config_type="kubernetes",
            filename="k8s-manifests.yml",
            content=content,
            description="Kubernetes deployment and service manifests",
            priority="medium"
        )

    async def _generate_environment_config(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> GeneratedConfig:
        """Generate environment configuration"""
        
        env_vars = {
            "NODE_ENV": deployment_target,
            "PORT": str(self._get_default_port(stack)),
            "LOG_LEVEL": "info" if deployment_target == "production" else "debug"
        }
        
        # Add database environment variables
        if stack.databases:
            for db in stack.databases:
                db_name = db.get("name", "postgres").upper()
                env_vars.update({
                    f"{db_name}_HOST": "localhost",
                    f"{db_name}_PORT": str(self._get_database_port(db.get("name", "postgres"))),
                    f"{db_name}_DB": "app_db",
                    f"{db_name}_USER": "app_user",
                    f"{db_name}_PASSWORD": "change_me_in_production"
                })
        
        # Add Redis if detected
        if any(dep.get("name") == "redis" for dep in stack.dependencies):
            env_vars.update({
                "REDIS_HOST": "localhost",
                "REDIS_PORT": "6379"
            })
        
        content = "\n".join([f"{key}={value}" for key, value in env_vars.items()])
        
        return GeneratedConfig(
            config_type="environment",
            filename=".env.example",
            content=content,
            description="Environment variables template",
            priority="high"
        )

    def _generate_deployment_instructions(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> List[str]:
        """Generate deployment instructions"""
        
        instructions = [
            "# Deployment Instructions",
            "",
            "## Docker Compose Deployment",
            "1. Copy .env.example to .env and update values",
            "2. Run: docker-compose up -d",
            "3. Access application at http://localhost:3000",
            "",
            "## Kubernetes Deployment", 
            "1. Apply manifests: kubectl apply -f k8s-manifests.yml",
            "2. Check status: kubectl get pods,services",
            "3. Get external IP: kubectl get service app-service"
        ]
        
        return instructions

    def _generate_environment_variables(
        self,
        stack: TechnologyStack,
        deployment_target: str
    ) -> Dict[str, str]:
        """Generate environment variables dictionary"""
        
        env_vars = {
            "NODE_ENV": deployment_target,
            "PORT": str(self._get_default_port(stack))
        }
        
        return env_vars

    def _generate_resource_recommendations(
        self,
        stack: TechnologyStack
    ) -> Dict[str, Any]:
        """Generate resource recommendations"""
        
        return {
            "cpu": "500m",
            "memory": "512Mi",
            "storage": "10Gi",
            "replicas": 3
        }

    def _get_default_port(self, stack: TechnologyStack) -> int:
        """Get default port for the technology stack"""
        
        if stack.language == "javascript" or stack.language == "typescript":
            return 3000
        elif stack.language == "python":
            return 8000
        elif stack.language == "java":
            return 8080
        else:
            return 3000

    def _get_database_port(self, db_name: str) -> int:
        """Get default database port"""
        
        ports = {
            "postgres": 5432,
            "mysql": 3306,
            "mongodb": 27017,
            "redis": 6379
        }
        
        return ports.get(db_name.lower(), 5432)

    def _generate_database_service(self, db: Dict[str, Any], target: str) -> Dict[str, Any]:
        """Generate database service for Docker Compose"""
        
        db_name = db.get("name", "postgres").lower()
        
        if db_name == "postgres":
            return {
                "image": "postgres:15-alpine",
                "environment": {
                    "POSTGRES_DB": "app_db",
                    "POSTGRES_USER": "app_user", 
                    "POSTGRES_PASSWORD": "change_me"
                },
                "ports": ["5432:5432"],
                "volumes": ["postgres_data:/var/lib/postgresql/data"]
            }
        elif db_name == "mysql":
            return {
                "image": "mysql:8.0",
                "environment": {
                    "MYSQL_DATABASE": "app_db",
                    "MYSQL_USER": "app_user",
                    "MYSQL_PASSWORD": "change_me",
                    "MYSQL_ROOT_PASSWORD": "root_change_me"
                },
                "ports": ["3306:3306"],
                "volumes": ["mysql_data:/var/lib/mysql"]
            }
        elif db_name == "mongodb":
            return {
                "image": "mongo:6.0",
                "environment": {
                    "MONGO_INITDB_DATABASE": "app_db"
                },
                "ports": ["27017:27017"],
                "volumes": ["mongo_data:/data/db"]
            }
        
        return {}

    def _generate_compose_volumes(self, services: Dict[str, Any]) -> Dict[str, Any]:
        """Generate volumes for Docker Compose"""
        
        volumes = {}
        
        for service_name, service_config in services.items():
            if "volumes" in service_config:
                for volume in service_config["volumes"]:
                    if ":" in volume:
                        volume_name = volume.split(":")[0]
                        if not volume_name.startswith("/"):
                            volumes[volume_name] = None
        
        return volumes

    def _get_compose_environment(self, stack: TechnologyStack, target: str) -> List[str]:
        """Get environment variables for Docker Compose"""
        
        env_vars = [
            f"NODE_ENV={target}",
            f"PORT={self._get_default_port(stack)}"
        ]
        
        return env_vars

    def _get_k8s_environment(self, stack: TechnologyStack, target: str) -> List[Dict[str, str]]:
        """Get environment variables for Kubernetes"""
        
        env_vars = [
            {"name": "NODE_ENV", "value": target},
            {"name": "PORT", "value": str(self._get_default_port(stack))}
        ]
        
        return env_vars

    def _get_k8s_resources(self, target: str) -> Dict[str, Dict[str, str]]:
        """Get resource requirements for Kubernetes"""
        
        if target == "production":
            return {
                "requests": {"cpu": "500m", "memory": "512Mi"},
                "limits": {"cpu": "1000m", "memory": "1Gi"}
            }
        else:
            return {
                "requests": {"cpu": "250m", "memory": "256Mi"},
                "limits": {"cpu": "500m", "memory": "512Mi"}
            }
