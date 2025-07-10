"""
Generator Prompt Templates

Specialized prompts for configuration generation tasks.
Provides structured prompts for Dockerfile, Docker Compose, CI/CD, and other deployment configurations.
"""

from typing import Dict, Any, List
from .base_prompts import BasePrompts


class GeneratorPrompts(BasePrompts):
    """
    Prompt templates for configuration generation tasks.
    """
    
    @classmethod
    def dockerfile_generation(
        cls,
        analysis_result: Any,
        repository_data: Dict[str, Any],
        optimization_level: str = "balanced"
    ) -> Dict[str, str]:
        """Generate prompts for Dockerfile creation."""
        
        system_prompt = cls.create_system_prompt(
            role="Senior DevOps Engineer and Docker Expert",
            expertise=[
                "Docker containerization best practices",
                "Multi-stage build optimization",
                "Security-hardened container images",
                "Performance optimization for containers",
                "Language-specific Docker patterns"
            ],
            guidelines=[
                "Create production-ready, secure Dockerfiles",
                "Optimize for image size and build speed",
                "Follow security best practices (non-root user, minimal base images)",
                "Implement proper layer caching strategies",
                "Include health checks and proper signal handling"
            ]
        )
        
        repository_context = cls.format_repository_context(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        
        # Extract build configuration
        try:
            build_config = getattr(analysis_result, 'build_configuration', None)
            build_info = ""
            if build_config:
                build_info = f"""
BUILD CONFIGURATION:
- Build Commands: {getattr(build_config, 'build_commands', [])}
- Start Commands: {getattr(build_config, 'start_commands', [])}
- Entry Points: {getattr(build_config, 'entry_points', [])}
- Ports: {getattr(build_config, 'ports', [])}
- Environment Variables: {dict(list(getattr(build_config, 'environment_variables', {}).items())[:5])}
"""
        except:
            build_info = "Build configuration not available"
        
        user_prompt = f"""
{repository_context}

{analysis_summary}

{build_info}

DOCKERFILE GENERATION TASK:
Create an optimized Dockerfile with optimization level: {optimization_level}

Requirements based on optimization level:
- basic: Simple, functional Dockerfile
- balanced: Production-ready with security and performance optimizations
- performance: Maximum performance optimization
- security: Maximum security hardening

Generate a comprehensive Dockerfile that includes:
1. **Base Image Selection**: Choose appropriate base image for the technology stack
2. **Multi-stage Build**: Use multi-stage builds when beneficial
3. **Security Hardening**: Non-root user, minimal attack surface
4. **Performance Optimization**: Layer caching, dependency optimization
5. **Health Checks**: Proper application health monitoring
6. **Signal Handling**: Graceful shutdown capabilities

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "dockerfile_content": "# Complete Dockerfile content here\\nFROM node:18-alpine AS builder\\nWORKDIR /app\\nCOPY package*.json ./\\nRUN npm install\\nCOPY . .\\nRUN npm run build\\n\\nFROM node:18-alpine\\nWORKDIR /app\\nCOPY --from=builder /app/dist ./dist\\nCOPY --from=builder /app/node_modules ./node_modules\\nEXPOSE 3000\\nCMD [\\"npm\\", \\"start\\"]",
    "base_image": "node:18-alpine",
    "multi_stage": true,
    "security_features": [
        "non-root user",
        "minimal base image",
        "security updates"
    ],
    "optimization_features": [
        "layer caching",
        "dependency optimization",
        "build cache"
    ],
    "ports_exposed": [3000, 8080],
    "health_check": {{
        "enabled": true,
        "endpoint": "/health",
        "interval": "30s"
    }},
    "environment_variables": {{
        "NODE_ENV": "production",
        "PORT": "3000"
    }},
    "build_instructions": [
        "docker build -t app-name .",
        "docker run -p 3000:3000 app-name"
    ],
    "size_estimate": "~150MB",
    "build_time_estimate": "2-3 minutes"
}}
"""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
    
    @classmethod
    def docker_compose_generation(
        cls,
        analysis_result: Any,
        repository_data: Dict[str, Any],
        optimization_level: str = "balanced"
    ) -> Dict[str, str]:
        """Generate prompts for Docker Compose configuration."""
        
        system_prompt = cls.create_system_prompt(
            role="Senior DevOps Architect and Container Orchestration Expert",
            expertise=[
                "Docker Compose orchestration patterns",
                "Service networking and communication",
                "Volume management and data persistence",
                "Environment configuration management",
                "Development and production workflows"
            ],
            guidelines=[
                "Design scalable, maintainable service architectures",
                "Implement proper service dependencies and health checks",
                "Configure appropriate networking and security",
                "Optimize for both development and production use",
                "Include monitoring and logging services when beneficial"
            ]
        )
        
        repository_context = cls.format_repository_context(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        
        # Extract database and service information
        try:
            tech_stack = getattr(analysis_result, 'technology_stack', None)
            databases = getattr(tech_stack, 'databases', []) if tech_stack else []
            build_config = getattr(analysis_result, 'build_configuration', None)
            ports = getattr(build_config, 'ports', []) if build_config else []
            
            services_info = f"""
DETECTED SERVICES:
- Databases: {databases}
- Application Ports: {ports}
- Additional Services: Based on technology stack analysis
"""
        except:
            services_info = "Service information not available"
        
        user_prompt = f"""
{repository_context}

{analysis_summary}

{services_info}

DOCKER COMPOSE GENERATION TASK:
Create a comprehensive docker-compose.yml with optimization level: {optimization_level}

Generate a complete Docker Compose configuration that includes:
1. **Application Service**: Main application container configuration
2. **Database Services**: Required database containers based on analysis
3. **Networking**: Proper service networking and communication
4. **Volumes**: Data persistence and development volumes
5. **Environment Configuration**: Environment variables and secrets
6. **Development Features**: Hot reload, debugging support (if applicable)
7. **Production Features**: Health checks, restart policies, resource limits

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "docker_compose_content": "version: '3.8'\\nservices:\\n  app:\\n    build: .\\n...",
    "services": {{
        "app": {{
            "description": "Main application service",
            "ports": ["3000:3000"],
            "environment": ["NODE_ENV=production"]
        }},
        "database": {{
            "description": "Database service",
            "image": "postgres:15-alpine",
            "ports": ["5432:5432"]
        }}
    }},
    "networks": {{
        "app_network": {{
            "driver": "bridge",
            "description": "Application network"
        }}
    }},
    "volumes": {{
        "db_data": {{
            "description": "Database persistent storage"
        }},
        "app_logs": {{
            "description": "Application logs"
        }}
    }},
    "features": [
        "hot reload support",
        "database persistence",
        "health checks",
        "logging configuration"
    ],
    "usage_instructions": [
        "docker-compose up -d",
        "docker-compose logs -f app",
        "docker-compose down"
    ],
    "environment_files": [".env", ".env.production"],
    "development_mode": {{
        "hot_reload": true,
        "debug_ports": [9229],
        "volume_mounts": ["./src:/app/src"]
    }}
}}
"""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
    
    @classmethod
    def github_actions_generation(
        cls,
        analysis_result: Any,
        repository_data: Dict[str, Any],
        optimization_level: str = "balanced"
    ) -> Dict[str, str]:
        """Generate prompts for GitHub Actions workflow."""
        
        system_prompt = cls.create_system_prompt(
            role="Senior DevOps Engineer and CI/CD Expert",
            expertise=[
                "GitHub Actions workflow design",
                "Automated testing and quality gates",
                "Container image building and publishing", 
                "Security scanning and compliance",
                "Deployment automation and rollback strategies"
            ],
            guidelines=[
                "Design robust, secure CI/CD pipelines",
                "Implement comprehensive testing strategies",
                "Include security scanning and quality gates",
                "Optimize for speed and reliability",
                "Follow GitHub Actions best practices"
            ]
        )
        
        repository_context = cls.format_repository_context(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        
        # Extract test and build information
        try:
            build_config = getattr(analysis_result, 'build_configuration', None)
            test_commands = getattr(build_config, 'test_commands', []) if build_config else []
            build_commands = getattr(build_config, 'build_commands', []) if build_config else []
            
            build_info = f"""
CI/CD CONFIGURATION:
- Test Commands: {test_commands}
- Build Commands: {build_commands}
- Deployment Ready: {bool(build_commands)}
"""
        except:
            build_info = "Build information not available"
        
        user_prompt = f"""
{repository_context}

{analysis_summary}

{build_info}

GITHUB ACTIONS GENERATION TASK:
Create a comprehensive GitHub Actions workflow with optimization level: {optimization_level}

Generate a complete CI/CD workflow that includes:
1. **Trigger Configuration**: Push, PR, and release triggers
2. **Testing Pipeline**: Unit tests, integration tests, quality checks
3. **Security Scanning**: Dependency scanning, code analysis
4. **Build Process**: Application building and Docker image creation
5. **Deployment**: Automated deployment with proper gates
6. **Notifications**: Success/failure notifications

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "workflow_content": "name: CI/CD Pipeline\\non:\\n  push:\\n    branches: [main]\\n...",
    "workflow_name": "CI/CD Pipeline",
    "triggers": {{
        "push": ["main", "develop"],
        "pull_request": ["main"],
        "release": ["published"]
    }},
    "jobs": {{
        "test": {{
            "description": "Run tests and quality checks",
            "steps": ["checkout", "setup", "test", "coverage"]
        }},
        "build": {{
            "description": "Build and publish Docker image",
            "steps": ["checkout", "docker-build", "docker-push"]
        }},
        "deploy": {{
            "description": "Deploy to production",
            "steps": ["checkout", "deploy", "health-check"]
        }}
    }},
    "security_features": [
        "dependency scanning",
        "code quality analysis",
        "container security scanning"
    ],
    "environment_variables": {{
        "NODE_ENV": "production",
        "DOCKER_REGISTRY": "ghcr.io"
    }},
    "secrets_required": [
        "DOCKER_USERNAME",
        "DOCKER_PASSWORD", 
        "DEPLOY_KEY"
    ],
    "estimated_runtime": "5-8 minutes",
    "caching_strategy": [
        "dependency caching",
        "docker layer caching"
    ]
}}
"""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
    
    @classmethod
    def kubernetes_generation(
        cls,
        analysis_result: Any,
        repository_data: Dict[str, Any],
        optimization_level: str = "balanced"
    ) -> Dict[str, str]:
        """Generate prompts for Kubernetes manifests."""
        
        system_prompt = cls.create_system_prompt(
            role="Senior Kubernetes Architect and Cloud Native Expert",
            expertise=[
                "Kubernetes resource design and management",
                "Service mesh and networking patterns",
                "Scaling and resource optimization",
                "Security policies and RBAC",
                "Monitoring and observability"
            ],
            guidelines=[
                "Design cloud-native, scalable Kubernetes deployments",
                "Implement proper resource limits and requests",
                "Follow Kubernetes security best practices",
                "Configure appropriate health checks and monitoring",
                "Use industry-standard naming and labeling conventions"
            ]
        )
        
        repository_context = cls.format_repository_context(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        
        user_prompt = f"""
{repository_context}

{analysis_summary}

KUBERNETES GENERATION TASK:
Create comprehensive Kubernetes manifests with optimization level: {optimization_level}

Generate complete Kubernetes resources including:
1. **Deployment**: Application deployment with proper scaling
2. **Service**: Service discovery and load balancing
3. **Ingress**: External traffic routing and SSL termination
4. **ConfigMap/Secret**: Configuration and secret management
5. **HPA**: Horizontal Pod Autoscaler for scaling
6. **NetworkPolicy**: Network security policies

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "manifests": {{
        "deployment": "apiVersion: apps/v1\\nkind: Deployment\\n...",
        "service": "apiVersion: v1\\nkind: Service\\n...",
        "ingress": "apiVersion: networking.k8s.io/v1\\nkind: Ingress\\n...",
        "configmap": "apiVersion: v1\\nkind: ConfigMap\\n...",
        "hpa": "apiVersion: autoscaling/v2\\nkind: HorizontalPodAutoscaler\\n..."
    }},
    "resource_summary": {{
        "deployment": {{
            "replicas": 3,
            "image": "app:latest",
            "resources": {{
                "requests": {{"cpu": "100m", "memory": "128Mi"}},
                "limits": {{"cpu": "500m", "memory": "512Mi"}}
            }}
        }},
        "service": {{
            "type": "ClusterIP",
            "ports": [8080]
        }},
        "ingress": {{
            "host": "app.example.com",
            "tls": true
        }}
    }},
    "scaling_configuration": {{
        "min_replicas": 2,
        "max_replicas": 10,
        "target_cpu": 70,
        "target_memory": 80
    }},
    "security_features": [
        "non-root containers",
        "security contexts",
        "network policies",
        "RBAC configuration"
    ],
    "deployment_instructions": [
        "kubectl apply -f manifests/",
        "kubectl get pods -l app=myapp",
        "kubectl logs -f deployment/myapp"
    ]
}}
"""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
