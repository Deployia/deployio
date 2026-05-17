"""
Dockerfile Service for DeployIO Agent
Generates optimized Dockerfiles based on detected stack type.
"""

import logging
import re
from typing import Optional, Dict
from pathlib import Path

logger = logging.getLogger(__name__)

# Works with or without package-lock.json (npm ci requires a lockfile).
_NPM_INSTALL_ALL = (
    "RUN set -eux; "
    "if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then "
    "npm ci; "
    "else npm install --no-audit --no-fund; fi"
)
_NPM_INSTALL_PROD = (
    "RUN set -eux; "
    "if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then "
    "npm ci --omit=dev; "
    "else npm install --no-audit --no-fund --omit=dev; fi"
)


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

# Install dependencies (lockfile optional)
""" + _NPM_INSTALL_ALL + """

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

# Install dependencies (lockfile optional)
""" + _NPM_INSTALL_ALL + """

# Copy source
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only (lockfile optional)
""" + _NPM_INSTALL_PROD + """

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

# Install dependencies (lockfile optional)
""" + _NPM_INSTALL_PROD + """

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

# Install system dependencies required for native wheels
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    g++ \\
    libc6-dev \\
    python3-dev \\
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

# Install system dependencies required for native wheels
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    g++ \\
    libc6-dev \\
    python3-dev \\
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

# Install dependencies (lockfile optional)
""" + _NPM_INSTALL_ALL + """

# Copy source
COPY . .

# Build React application
RUN npm run build

# Production stage: serve with nginx
FROM nginx:alpine

# Minimal SPA config (no repo nginx.conf required)
RUN rm -f /etc/nginx/conf.d/default.conf && printf '%s\\n' \\
  'server {' \\
  '  listen 80;' \\
  '  server_name localhost;' \\
  '  root /usr/share/nginx/html;' \\
  '  location / { try_files $uri $uri/ /index.html; }' \\
  '}' > /etc/nginx/conf.d/default.conf

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
    def ensure_next_public_dir(repo_path: Path) -> None:
        """Next.js images often COPY ./public; create an empty directory if absent."""
        repo_path = Path(repo_path)
        public = repo_path / "public"
        if public.is_dir():
            return
        public.mkdir(parents=True, exist_ok=True)
        gitkeep = public / ".gitkeep"
        if not gitkeep.exists():
            gitkeep.write_text("", encoding="utf-8")
        logger.info("Created empty public/ for Next.js build context at %s", public)

    @staticmethod
    async def check_existing_dockerfile(
        repo_path: str, subpath: str = "Dockerfile"
    ) -> Dict:
        """
        Check if a usable Dockerfile exists in the repository (FROM + CMD/ENTRYPOINT).

        ``subpath`` is the path relative to repo root (default ``Dockerfile``).
        Pass the user-selected dockerfile path (e.g. ``apps/server/Dockerfile``)
        to check that specific file instead of always looking at the root.

        BuildService prefers this path before generating templates.

        Returns: {
            "exists": true/false,
            "valid": true/false,
            "content": "dockerfile content or None",
            "path": "/path/to/Dockerfile or None"
        }
        """
        repo_path = Path(repo_path)
        dockerfile_path = repo_path / subpath

        if not dockerfile_path.exists():
            return {"exists": False, "valid": False, "content": None, "path": None}

        try:
            with open(dockerfile_path, "r") as f:
                content = f.read()

            # Basic validation: must have FROM and CMD/ENTRYPOINT
            has_from = "FROM" in content
            has_cmd = "CMD" in content or "ENTRYPOINT" in content

            if has_from and has_cmd:
                logger.info(f"Valid existing Dockerfile found at {dockerfile_path}")
                return {
                    "exists": True,
                    "valid": True,
                    "content": content,
                    "path": str(dockerfile_path),
                }
            else:
                logger.warning(
                    f"Dockerfile found but invalid (missing FROM or CMD) at {dockerfile_path}"
                )
                return {
                    "exists": True,
                    "valid": False,
                    "content": None,
                    "path": str(dockerfile_path),
                }
        except Exception as e:
            logger.error(f"Error reading Dockerfile: {e}")
            return {
                "exists": True,
                "valid": False,
                "content": None,
                "path": str(dockerfile_path),
            }

    @staticmethod
    def _is_dockerfile_candidate(path: Path) -> bool:
        name = path.name
        if name == "Dockerfile":
            return True
        return bool(re.match(r"^Dockerfile\.[^/]+$", name, re.I))

    @staticmethod
    async def discover_valid_dockerfiles(
        repo_path: str, *, max_files: int = 30
    ) -> list[str]:
        """Return absolute paths of valid Dockerfiles under the repository."""
        root = Path(repo_path)
        if not root.is_dir():
            return []

        candidates: list[Path] = []
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if "node_modules" in path.parts or ".git" in path.parts:
                continue
            if not DockerfileService._is_dockerfile_candidate(path):
                continue
            candidates.append(path)

        candidates.sort(key=lambda p: (len(p.parts), str(p)))
        valid_paths: list[str] = []
        for path in candidates:
            rel = path.relative_to(root).as_posix()
            check = await DockerfileService.check_existing_dockerfile(repo_path, rel)
            if check.get("valid") and check.get("path"):
                valid_paths.append(check["path"])
            if len(valid_paths) >= max_files:
                break
        return valid_paths

    @staticmethod
    async def generate_dockerfile(
        stack_type: str,
        repo_path: Optional[str] = None,
        port: Optional[int] = None,
        *,
        force_template: bool = False,
    ) -> Dict[str, str]:
        """
        Generate Dockerfile for the given stack type, or use existing if valid.

        Strategy:
        1. If Dockerfile exists in repo and is valid, use it (unless force_template)
        2. Otherwise, generate from template

        Returns: {
            "dockerfile": "<full content>",
            "dockerfile_path": "/path/to/Dockerfile or None",
            "isGenerated": true/false,
            "port": 3000,
            "stack": "MERN"
        }
        """
        # First, check for existing Dockerfile if repo_path provided
        if repo_path and not force_template:
            existing = await DockerfileService.check_existing_dockerfile(repo_path)
            if existing["valid"]:
                logger.info(f"Using existing Dockerfile from {existing['path']}")
                return {
                    "dockerfile": existing["content"],
                    "dockerfile_path": existing["path"],
                    "isGenerated": False,
                    "port": port or 3000,
                    "stack": stack_type.upper(),
                }

        # Generate from template
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
                logger.info(f"Generated Dockerfile written to {dockerfile_path}")
                if stack_upper == "NEXT":
                    DockerfileService.ensure_next_public_dir(repo_path)
            except Exception as e:
                logger.warning(f"Failed to write Dockerfile to {dockerfile_path}: {e}")
                dockerfile_path = None

        return {
            "dockerfile": template,
            "dockerfile_path": str(dockerfile_path) if dockerfile_path else None,
            "isGenerated": True,
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
