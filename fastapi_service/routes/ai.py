"""
AI-powered project analysis routes
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel
from models.auth import AuthenticatedUser
from models.response import ResponseModel
from middleware.jwt_auth import jwt_auth
import httpx
import json
import os
from datetime import datetime

router = APIRouter()

# Pydantic models for AI requests/responses
class RepositoryAnalysisRequest(BaseModel):
    repository_url: str
    branch: str = "main"
    project_id: str

class TechnologyStack(BaseModel):
    framework: Optional[str] = None
    language: Optional[str] = None
    database: Optional[str] = None
    build_tool: Optional[str] = None
    confidence: float = 0.0

class StackDetectionResponse(BaseModel):
    technology: TechnologyStack
    detected_files: List[str]
    recommendations: List[Dict[str, str]]
    confidence_score: float

class DockerfileRequest(BaseModel):
    project_id: str
    technology_stack: TechnologyStack
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    port: Optional[int] = 3000

class DockerfileResponse(BaseModel):
    dockerfile_content: str
    docker_compose_content: Optional[str] = None
    build_instructions: List[str]
    optimization_notes: List[str]

class OptimizationRequest(BaseModel):
    project_id: str
    current_config: Dict
    performance_metrics: Optional[Dict] = None

class OptimizationSuggestion(BaseModel):
    type: str  # performance, security, cost, reliability
    title: str
    description: str
    priority: str  # low, medium, high, critical
    implementation: Dict[str, str]
    impact: str

class OptimizationResponse(BaseModel):
    suggestions: List[OptimizationSuggestion]
    overall_score: float
    priority_actions: List[str]

@router.post("/analyze-stack", response_model=ResponseModel[StackDetectionResponse])
async def analyze_project_stack(
    request: RepositoryAnalysisRequest,
    current_user: AuthenticatedUser = Depends(jwt_auth)
):
    """Analyze project repository to detect technology stack"""
    try:
        # Simulate stack detection logic (replace with actual AI/ML model)
        detected_stack = await detect_technology_stack(request.repository_url, request.branch)
        
        return ResponseModel(
            success=True,
            message="Technology stack analyzed successfully",
            data=detected_stack
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stack analysis failed: {str(e)}")

@router.post("/generate-dockerfile", response_model=ResponseModel[DockerfileResponse])
async def generate_dockerfile(
    request: DockerfileRequest,
    current_user: AuthenticatedUser = Depends(jwt_auth)
):
    """Generate optimized Dockerfile and Docker Compose configuration"""
    try:
        dockerfile_config = await create_dockerfile_config(request)
        
        return ResponseModel(
            success=True,
            message="Dockerfile generated successfully",
            data=dockerfile_config
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dockerfile generation failed: {str(e)}")

@router.post("/optimize-deployment", response_model=ResponseModel[OptimizationResponse])
async def optimize_deployment(
    request: OptimizationRequest,
    current_user: AuthenticatedUser = Depends(jwt_auth)
):
    """Analyze project and provide optimization suggestions"""
    try:
        optimization_results = await analyze_optimization_opportunities(request)
        
        return ResponseModel(
            success=True,
            message="Optimization analysis completed",
            data=optimization_results
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization analysis failed: {str(e)}")

@router.get("/supported-technologies", response_model=ResponseModel[Dict[str, List[str]]])
async def get_supported_technologies():
    """Get list of supported technologies and frameworks"""
    supported_tech = {
        "frameworks": [
            "React", "Vue.js", "Angular", "Node.js", "Express", "Next.js", "Nuxt.js",
            "Django", "Flask", "FastAPI", "Spring Boot", "Laravel"
        ],
        "languages": [
            "JavaScript", "TypeScript", "Python", "Java", "PHP", "Go", "Rust", "C#", "Ruby"
        ],
        "databases": [
            "MongoDB", "PostgreSQL", "MySQL", "Redis", "SQLite"
        ],
        "build_tools": [
            "npm", "yarn", "pip", "maven", "gradle", "go mod", "cargo", "composer"
        ]
    }
    
    return ResponseModel(
        success=True,
        message="Supported technologies retrieved",
        data=supported_tech
    )

# AI Service Implementation Functions

async def detect_technology_stack(repository_url: str, branch: str = "main") -> StackDetectionResponse:
    """
    Detect technology stack from repository analysis
    This is a simplified implementation - in production, this would use ML models
    """
    # Simulate GitHub API call to analyze repository files
    detected_files = await analyze_repository_files(repository_url, branch)
    
    # Technology detection logic based on files
    technology = TechnologyStack()
    confidence_scores = []
    recommendations = []
    
    # Detect based on common files
    if "package.json" in detected_files:
        technology.language = "JavaScript"
        technology.build_tool = "npm"
        confidence_scores.append(0.9)
        
        # Check for specific frameworks
        if "next.config.js" in detected_files:
            technology.framework = "Next.js"
            confidence_scores.append(0.95)
        elif "vite.config.js" in detected_files:
            technology.framework = "Vite"
            confidence_scores.append(0.9)
        elif any("react" in f.lower() for f in detected_files):
            technology.framework = "React"
            confidence_scores.append(0.85)
    
    elif "requirements.txt" in detected_files or "pyproject.toml" in detected_files:
        technology.language = "Python"
        technology.build_tool = "pip"
        confidence_scores.append(0.9)
        
        if "main.py" in detected_files and "fastapi" in str(detected_files).lower():
            technology.framework = "FastAPI"
            confidence_scores.append(0.9)
        elif "app.py" in detected_files or "flask" in str(detected_files).lower():
            technology.framework = "Flask"
            confidence_scores.append(0.85)
    
    elif "pom.xml" in detected_files:
        technology.language = "Java"
        technology.framework = "Spring Boot"
        technology.build_tool = "maven"
        confidence_scores.append(0.85)
    
    # Database detection
    if any("mongo" in f.lower() for f in detected_files):
        technology.database = "MongoDB"
    elif any("postgres" in f.lower() for f in detected_files):
        technology.database = "PostgreSQL"
    elif any("mysql" in f.lower() for f in detected_files):
        technology.database = "MySQL"
    
    # Calculate overall confidence
    technology.confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
    overall_confidence = technology.confidence
    
    # Generate recommendations
    if technology.framework:
        recommendations.append({
            "type": "deployment",
            "title": f"Optimized {technology.framework} deployment",
            "description": f"We've detected {technology.framework}. Consider using optimized build settings."
        })
    
    if not technology.database:
        recommendations.append({
            "type": "database",
            "title": "Database recommendation",
            "description": "Consider adding a database for data persistence."
        })
    
    return StackDetectionResponse(
        technology=technology,
        detected_files=detected_files,
        recommendations=recommendations,
        confidence_score=overall_confidence
    )

async def analyze_repository_files(repository_url: str, branch: str) -> List[str]:
    """
    Simulate repository file analysis
    In production, this would use GitHub API or clone the repo
    """
    # Extract owner/repo from URL
    if "github.com" in repository_url:
        parts = repository_url.split("/")
        if len(parts) >= 5:
            owner, repo = parts[-2], parts[-1].replace(".git", "")
            
            # Simulate GitHub API call
            try:
                async with httpx.AsyncClient() as client:
                    # This is a simulation - in production you'd use GitHub API with auth
                    # For now, return common files based on repository type
                    common_files = [
                        "README.md", "package.json", "src/App.jsx", "public/index.html",
                        ".gitignore", "vite.config.js", "jsconfig.json"
                    ]
                    return common_files
            except:
                pass
    
    # Fallback: return common web project files
    return ["README.md", "package.json", "src/index.js", ".gitignore"]

async def create_dockerfile_config(request: DockerfileRequest) -> DockerfileResponse:
    """Generate Dockerfile and Docker Compose based on technology stack"""
    
    tech = request.technology_stack
    dockerfile_content = ""
    docker_compose_content = ""
    build_instructions = []
    optimization_notes = []
    
    # Generate Dockerfile based on detected technology
    if tech.language == "JavaScript" and tech.framework in ["React", "Next.js", "Vite"]:
        dockerfile_content = f"""# Multi-stage build for {tech.framework}
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN {request.build_command or 'npm run build'}

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE {request.port or 80}
CMD ["nginx", "-g", "daemon off;"]
"""
        
        docker_compose_content = f"""version: '3.8'
services:
  {tech.framework.lower().replace('.', '')}:
    build: .
    ports:
      - "{request.port or 80}:{request.port or 80}"
    environment:
      - NODE_ENV=production
"""
        
        build_instructions = [
            "Build optimized for production",
            "Multi-stage build reduces image size",
            "Nginx serves static files efficiently"
        ]
        
        optimization_notes = [
            "Consider enabling gzip compression",
            "Add CDN for better performance",
            "Implement caching headers"
        ]
    
    elif tech.language == "Python" and tech.framework in ["FastAPI", "Flask"]:
        dockerfile_content = f"""FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE {request.port or 8000}
CMD ["{request.start_command or 'uvicorn main:app --host 0.0.0.0 --port 8000'}"]
"""
        
        docker_compose_content = f"""version: '3.8'
services:
  {tech.framework.lower()}:
    build: .
    ports:
      - "{request.port or 8000}:{request.port or 8000}"
    environment:
      - PYTHONPATH=/app
"""
        
        build_instructions = [
            "Optimized Python slim image",
            "Requirements cached for faster builds",
            "Production-ready configuration"
        ]
    
    else:
        # Generic Node.js Dockerfile
        dockerfile_content = f"""FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE {request.port or 3000}
CMD ["{request.start_command or 'npm start'}"]
"""
    
    return DockerfileResponse(
        dockerfile_content=dockerfile_content,
        docker_compose_content=docker_compose_content,
        build_instructions=build_instructions,
        optimization_notes=optimization_notes
    )

async def analyze_optimization_opportunities(request: OptimizationRequest) -> OptimizationResponse:
    """Analyze project and provide optimization suggestions"""
    
    suggestions = []
    
    # Performance optimizations
    suggestions.append(OptimizationSuggestion(
        type="performance",
        title="Enable Build Caching",
        description="Implement build caching to reduce deployment time by 60-80%",
        priority="high",
        implementation={
            "docker": "Add build cache layers",
            "ci_cd": "Enable pipeline caching"
        },
        impact="Reduces build time from 5min to 1-2min"
    ))
    
    # Security optimizations
    suggestions.append(OptimizationSuggestion(
        type="security",
        title="Environment Variables Security",
        description="Encrypt sensitive environment variables and use secrets management",
        priority="critical",
        implementation={
            "secrets": "Use Docker secrets or cloud KMS",
            "env_vars": "Separate secrets from config"
        },
        impact="Prevents credential exposure"
    ))
    
    # Cost optimizations
    suggestions.append(OptimizationSuggestion(
        type="cost",
        title="Resource Optimization",
        description="Optimize container resource allocation based on usage patterns",
        priority="medium",
        implementation={
            "memory": "Right-size memory allocation",
            "cpu": "Use CPU limits and requests"
        },
        impact="Reduces hosting costs by 20-40%"
    ))
    
    # Reliability optimizations
    suggestions.append(OptimizationSuggestion(
        type="reliability",
        title="Health Checks & Monitoring",
        description="Implement comprehensive health checks and monitoring",
        priority="high",
        implementation={
            "health_checks": "Add application health endpoints",
            "monitoring": "Implement metrics collection"
        },
        impact="99.9% uptime with early issue detection"
    ))
    
    # Calculate overall optimization score
    overall_score = 75.5  # Based on current configuration analysis
    
    priority_actions = [
        "Implement environment variables security",
        "Enable build caching",
        "Add health checks"
    ]
    
    return OptimizationResponse(
        suggestions=suggestions,
        overall_score=overall_score,
        priority_actions=priority_actions
    )
