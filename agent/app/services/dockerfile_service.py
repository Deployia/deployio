"""
Dockerfile Service for DeployIO Agent
Generates optimized Dockerfiles based on detected stack type.
"""

import logging
from typing import Optional, Dict
from pathlib import Path

logger = logging.getLogger(__name__)


class DockerfileService:
    """
    Generates Dockerfiles for different tech stacks.
    Supports: MERN, Next.js, FastAPI, Django, Flask, Express, generic Node, generic Python.
    """

    # Dockerfile templates by stack type
    TEMPLATES = {
        "MERN": """FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
""",
        "NEXT": """FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
""",
        "EXPRESS": """FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
""",
        "FASTAPI": """FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/docs')" || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
""",
        "DJANGO": """FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000')" || exit 1

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Start application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
""",
        "FLASK": """FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000')" || exit 1

# Start application
CMD ["python", "app.py"]
""",
        "PYTHON": """FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "app.py"]
""",
        "REACT": """FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build React application
RUN npm run build

# Production stage: serve with nginx
FROM nginx:alpine

# Copy nginx config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf || true

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD wget --quiet --tries=1 --spider http://localhost/

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
""",
    }

    @staticmethod
    async def generate_dockerfile(
        stack_type: str,
        repo_path: Optional[str] = None,
        port: Optional[int] = None,
    ) -> Dict[str, str]:
        """
        Generate a Dockerfile for the given stack type.

        Returns: {
            "dockerfile": "<content>",
            "dockerfile_path": "/path/to/Dockerfile.generated",
            "port": 3000,
            "stack": "MERN"
        }
        """
        # Get template
        stack_upper = stack_type.upper()
        template = DockerfileService.TEMPLATES.get(
            stack_upper,
            DockerfileService.TEMPLATES["PYTHON"],  # Default fallback
        )

        logger.info(f"Generated Dockerfile for stack: {stack_upper}")

        # Write to file if repo_path provided
        dockerfile_path = None
        if repo_path:
            repo_path = Path(repo_path)
            dockerfile_path = repo_path / "Dockerfile.generated"
            try:
                with open(dockerfile_path, "w") as f:
                    f.write(template)
                logger.info(f"Dockerfile written to {dockerfile_path}")
            except Exception as e:
                logger.warning(f"Failed to write Dockerfile to {dockerfile_path}: {e}")
                dockerfile_path = None

        return {
            "dockerfile": template,
            "dockerfile_path": str(dockerfile_path) if dockerfile_path else None,
            "port": port or 3000,
            "stack": stack_upper,
        }

    @staticmethod
    def get_build_command(stack_type: str) -> str:
        """Get the Docker build command for this stack."""
        stack_upper = stack_type.upper()

        # Determine Dockerfile name
        dockerfile = "Dockerfile"

        return f"docker build -t deployio/{{deployment_id}}:latest -f {dockerfile} ."
