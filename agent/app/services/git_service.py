"""
Git Service for DeployIO Agent
Handles repository cloning, stack detection from package managers.
"""

import asyncio
import json
import logging
import os
import shutil
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional
from subprocess import run, PIPE, DEVNULL

from git import Repo, GitCommandError

logger = logging.getLogger(__name__)


class StackDetectionError(Exception):
    """Raised when stack cannot be detected."""

    pass


class GitService:
    """
    Handles Git operations: clone, stack detection.
    Stack detection: checks for package.json, requirements.txt, pom.xml, etc.
    """

    def __init__(self):
        self.clone_base = Path(
            os.getenv("DEPLOYIO_CLONE_BASE", "/app/tmp/deployio-clones")
        )
        self.clone_base.mkdir(exist_ok=True)
        self.max_clone_size = 500 * 1024 * 1024  # 500MB limit

    async def clone_repository(
        self,
        git_url: str,
        github_token: Optional[str] = None,
        branch: str = "main",
        deployment_id: Optional[str] = None,
    ) -> str:
        """
        Clone a GitHub repository to a temporary directory.
        Returns the clone path.
        """
        try:
            # Create unique directory for this clone
            clone_id = deployment_id or git_url.split("/")[-1].replace(".git", "")
            clone_dir = self.clone_base / clone_id

            # Clean if already exists
            if clone_dir.exists():
                shutil.rmtree(clone_dir)

            clone_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Cloning {git_url} to {clone_dir}")

            # Prepare clone URL with token if provided
            clone_url = git_url
            if github_token:
                # Inject token into URL: https://token@github.com/...
                if "https://" in clone_url:
                    clone_url = clone_url.replace(
                        "https://", f"https://{github_token}@"
                    )

            # Clone repository
            await asyncio.to_thread(
                Repo.clone_from,
                clone_url,
                clone_dir,
                branch=branch,
                depth=1,  # Shallow clone for speed
            )

            logger.info(f"✅ Repository cloned to {clone_dir}")
            return str(clone_dir)

        except GitCommandError as e:
            logger.error(f"❌ Git clone failed: {e}")
            raise StackDetectionError(f"Failed to clone repository: {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected error during clone: {e}")
            raise StackDetectionError(f"Clone error: {e}")

    async def detect_stack(self, repo_path: str) -> Dict[str, Any]:
        """
        Detect the tech stack of a repository.
        Checks for package.json (Node), requirements.txt (Python), pom.xml (Java), etc.
        Returns: {
            "stack": "MERN" | "NEXT" | "FASTAPI" | "EXPRESS" | "UNKNOWN",
            "language": "JavaScript" | "Python" | "Java" | ...,
            "framework": "React" | "Next.js" | "FastAPI" | ...,
            "port": 3000,
            "build_command": "npm install && npm run build",
            "start_command": "npm start",
        }
        """
        repo_path = Path(repo_path)

        if not repo_path.exists():
            raise StackDetectionError(f"Repository path does not exist: {repo_path}")

        # Check for Node.js stack
        package_json = repo_path / "package.json"
        if package_json.exists():
            return await self._detect_node_stack(repo_path, package_json)

        # Check for Python stack
        requirements_txt = repo_path / "requirements.txt"
        if requirements_txt.exists():
            return await self._detect_python_stack(repo_path, requirements_txt)

        # Check for Java stack
        pom_xml = repo_path / "pom.xml"
        if pom_xml.exists():
            return {
                "stack": "JAVA",
                "language": "Java",
                "framework": "Spring Boot",
                "port": 8080,
            }

        # Default to unknown
        return {
            "stack": "UNKNOWN",
            "language": "Unknown",
            "framework": "Unknown",
            "port": 5000,
        }

    async def _detect_node_stack(
        self, repo_path: Path, package_json: Path
    ) -> Dict[str, Any]:
        """Detect Node.js stack: Next.js, MERN, or Express."""
        try:
            with open(package_json, "r") as f:
                pkg = json.load(f)
        except Exception as e:
            logger.error(f"Failed to parse package.json: {e}")
            return {
                "stack": "NODE",
                "language": "JavaScript",
                "framework": "Node.js",
                "port": 3000,
                "build_command": "npm install && npm run build",
                "start_command": "npm start",
            }

        dependencies = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

        # Check for Next.js
        if "next" in dependencies:
            port = 3000
            build_cmd = "npm install && npm run build"
            start_cmd = "npm start"

            return {
                "stack": "NEXT",
                "language": "JavaScript",
                "framework": "Next.js",
                "port": port,
                "build_command": build_cmd,
                "start_command": start_cmd,
            }

        # Check for React (MERN)
        if "react" in dependencies:
            # Check if it has Express backend
            has_express = "express" in dependencies

            if has_express:
                port = 3000
                build_cmd = "npm install && npm run build"
                start_cmd = "npm start"

                return {
                    "stack": "MERN",
                    "language": "JavaScript",
                    "framework": "Express + React",
                    "port": port,
                    "build_command": build_cmd,
                    "start_command": start_cmd,
                }
            else:
                # Just React frontend
                port = 5173  # Vite default or 3000 for CRA
                build_cmd = "npm install && npm run build"
                start_cmd = "npm run dev"

                return {
                    "stack": "REACT",
                    "language": "JavaScript",
                    "framework": "React",
                    "port": port,
                    "build_command": build_cmd,
                    "start_command": start_cmd,
                }

        # Default Node.js / Express
        port = pkg.get("deployio", {}).get("port", 5000)
        return {
            "stack": "EXPRESS",
            "language": "JavaScript",
            "framework": "Express",
            "port": port,
            "build_command": "npm install",
            "start_command": "npm start",
        }

    async def _detect_python_stack(
        self, repo_path: Path, requirements_txt: Path
    ) -> Dict[str, Any]:
        """Detect Python stack: FastAPI, Django, Flask, etc."""
        try:
            with open(requirements_txt, "r") as f:
                requirements = f.read().lower()
        except Exception as e:
            logger.error(f"Failed to parse requirements.txt: {e}")
            return {
                "stack": "PYTHON",
                "language": "Python",
                "framework": "Python",
                "port": 8000,
                "build_command": "pip install -r requirements.txt",
                "start_command": "python app.py",
            }

        # Check for FastAPI
        if "fastapi" in requirements:
            return {
                "stack": "FASTAPI",
                "language": "Python",
                "framework": "FastAPI",
                "port": 8000,
                "build_command": "pip install -r requirements.txt",
                "start_command": "uvicorn main:app --host 0.0.0.0 --port 8000",
            }

        # Check for Django
        if "django" in requirements:
            return {
                "stack": "DJANGO",
                "language": "Python",
                "framework": "Django",
                "port": 8000,
                "build_command": "pip install -r requirements.txt",
                "start_command": "python manage.py runserver 0.0.0.0:8000",
            }

        # Check for Flask
        if "flask" in requirements:
            return {
                "stack": "FLASK",
                "language": "Python",
                "framework": "Flask",
                "port": 5000,
                "build_command": "pip install -r requirements.txt",
                "start_command": "python app.py",
            }

        # Default Python
        return {
            "stack": "PYTHON",
            "language": "Python",
            "framework": "Python",
            "port": 8000,
            "build_command": "pip install -r requirements.txt",
            "start_command": "python app.py",
        }

    async def cleanup(self, repo_path: str) -> None:
        """Remove cloned repository."""
        try:
            repo_path = Path(repo_path)
            if repo_path.exists():
                await asyncio.to_thread(shutil.rmtree, repo_path)
                logger.info(f"Cleaned up {repo_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup {repo_path}: {e}")
