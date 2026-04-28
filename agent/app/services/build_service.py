"""
Build Service for DeployIO Agent
Orchestrates: git clone → stack detection → dockerfile generation → docker build → deploy
"""

import asyncio
import logging
import uuid
from typing import Dict, Any, Optional, Callable
from pathlib import Path
import subprocess

from app.services.git_service import GitService
from app.services.dockerfile_service import DockerfileService
from app.services.deployment_service import DeploymentService

logger = logging.getLogger(__name__)


class BuildService:
    """
    Orchestrates the full build pipeline:
    1. Clone repo from GitHub
    2. Detect stack
    3. Generate Dockerfile
    4. Build Docker image
    5. Deploy container
    """

    def __init__(self):
        self.git_service = GitService()
        self.dockerfile_service = DockerfileService()
        self.deployment_service = DeploymentService()
        self.active_builds: Dict[str, Dict[str, Any]] = {}

    async def analyze_repository(
        self,
        git_url: str,
        github_token: Optional[str] = None,
        branch: str = "main",
    ) -> Dict[str, Any]:
        """
        Analyze a GitHub repository: clone + detect stack.
        Returns: { stack, language, framework, port, build_command, start_command }
        """
        deployment_id = f"analyze-{uuid.uuid4().hex[:8]}"

        try:
            # Clone repository
            repo_path = await self.git_service.clone_repository(
                git_url, github_token, branch, deployment_id
            )

            # Detect stack
            stack_info = await self.git_service.detect_stack(repo_path)

            # Cleanup
            await self.git_service.cleanup(repo_path)

            logger.info(f"✅ Stack detected: {stack_info['stack']}")
            return {
                "status": "success",
                "stack": stack_info.get("stack"),
                "language": stack_info.get("language"),
                "framework": stack_info.get("framework"),
                "port": stack_info.get("port"),
                "build_command": stack_info.get("build_command"),
                "start_command": stack_info.get("start_command"),
            }

        except Exception as e:
            logger.error(f"❌ Analysis failed: {e}")
            return {
                "status": "error",
                "error": str(e),
            }

    async def generate_dockerfile(
        self,
        git_url: str,
        github_token: Optional[str] = None,
        branch: str = "main",
    ) -> Dict[str, Any]:
        """
        Analyze repo + generate Dockerfile.
        Returns: { dockerfile, dockerfile_path, port, stack }
        """
        deployment_id = f"gen-{uuid.uuid4().hex[:8]}"

        try:
            # Clone repository
            repo_path = await self.git_service.clone_repository(
                git_url, github_token, branch, deployment_id
            )

            # Detect stack
            stack_info = await self.git_service.detect_stack(repo_path)
            stack_type = stack_info.get("stack", "UNKNOWN")
            port = stack_info.get("port", 3000)

            # Generate Dockerfile
            dockerfile_info = await self.dockerfile_service.generate_dockerfile(
                stack_type, repo_path, port
            )

            # Cleanup
            await self.git_service.cleanup(repo_path)

            logger.info(f"✅ Dockerfile generated for {stack_type}")
            return {
                "status": "success",
                **dockerfile_info,
            }

        except Exception as e:
            logger.error(f"❌ Dockerfile generation failed: {e}")
            return {
                "status": "error",
                "error": str(e),
            }

    async def build_and_deploy(
        self,
        git_url: str,
        github_token: Optional[str] = None,
        branch: str = "main",
        subdomain: Optional[str] = None,
        logs_callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """
        Full pipeline: clone → detect → generate Dockerfile → build → deploy.
        Returns: { deployment_id, subdomain, url, status, port }
        """
        deployment_id = f"dep-{uuid.uuid4().hex[:12]}"

        try:
            # Emit log
            if logs_callback:
                await logs_callback(f"[{deployment_id}] Starting deployment...", "info")

            # Clone repository
            if logs_callback:
                await logs_callback(f"[{deployment_id}] Cloning repository...", "info")

            repo_path = await self.git_service.clone_repository(
                git_url, github_token, branch, deployment_id
            )

            # Detect stack
            if logs_callback:
                await logs_callback(f"[{deployment_id}] Detecting stack...", "info")

            stack_info = await self.git_service.detect_stack(repo_path)
            stack_type = stack_info.get("stack", "UNKNOWN")
            port = stack_info.get("port", 3000)

            if logs_callback:
                await logs_callback(
                    f"[{deployment_id}] Stack detected: {stack_type}", "info"
                )

            # Generate Dockerfile
            if logs_callback:
                await logs_callback(
                    f"[{deployment_id}] Generating Dockerfile...", "info"
                )

            dockerfile_info = await self.dockerfile_service.generate_dockerfile(
                stack_type, repo_path, port
            )

            # Build Docker image
            if logs_callback:
                await logs_callback(
                    f"[{deployment_id}] Building Docker image...", "build"
                )

            repo_path = Path(repo_path)
            dockerfile_path = repo_path / "Dockerfile.generated"
            
            # Verify Dockerfile exists before building
            if not dockerfile_path.exists():
                raise Exception(f"Dockerfile not found at {dockerfile_path}")
            
            build_command = [
                "docker",
                "build",
                "-t",
                f"deployio/{deployment_id}:latest",
                "-f",
                str(dockerfile_path),  # Use absolute path
                str(repo_path),
            ]

            logger.info(f"Running build command: {' '.join(build_command)}")

            # Run build with streaming logs
            result = await asyncio.to_thread(
                self._run_build_with_logs,
                build_command,
                deployment_id,
                logs_callback,
            )

            if not result["success"]:
                raise Exception(f"Docker build failed: {result['error']}")

            if logs_callback:
                await logs_callback(
                    f"[{deployment_id}] ✅ Build completed successfully", "info"
                )

            # Generate subdomain
            if not subdomain:
                repo_name = git_url.split("/")[-1].replace(".git", "").lower()
                subdomain = f"{repo_name}-{deployment_id[:6]}"

            # Deploy to Docker + Traefik
            if logs_callback:
                await logs_callback(
                    f"[{deployment_id}] Deploying to subdomain: {subdomain}...", "info"
                )

            deploy_result = await asyncio.to_thread(
                self.deployment_service.deploy,
                deployment_id,
                f"deployio/{deployment_id}:latest",
                subdomain,
                port,
                {},
            )

            if logs_callback:
                await logs_callback(
                    f"[{deployment_id}] ✅ Deployment successful!", "info"
                )

            # Cleanup repo
            await self.git_service.cleanup(str(repo_path))

            return {
                "status": "success",
                "deployment_id": deployment_id,
                "subdomain": subdomain,
                "url": f"https://{subdomain}.deployio.tech",
                "port": port,
                "stack": stack_type,
                "logs": result.get("logs", []),
            }

        except Exception as e:
            logger.error(f"❌ Deployment failed: {e}")

            if logs_callback:
                await logs_callback(
                    f"[{deployment_id}] ❌ Deployment failed: {e}", "error"
                )

            return {
                "status": "error",
                "deployment_id": deployment_id,
                "error": str(e),
            }

    @staticmethod
    def _run_build_with_logs(
        build_command: list,
        deployment_id: str,
        logs_callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """
        Run Docker build command and stream logs via callback.
        """
        try:
            process = subprocess.Popen(
                build_command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            logs = []
            for line in process.stdout:
                line = line.rstrip()
                logs.append(line)
                logger.info(f"[BUILD] {line}")

                # If callback provided, emit log (but don't await in thread)
                if logs_callback:
                    try:
                        logs_callback(f"[{deployment_id}] {line}", "build")
                    except:
                        pass  # Callback may fail in thread context

            process.wait()

            if process.returncode != 0:
                return {
                    "success": False,
                    "error": f"Build failed with exit code {process.returncode}",
                    "logs": logs,
                }

            return {
                "success": True,
                "logs": logs,
            }

        except Exception as e:
            logger.error(f"Build execution error: {e}")
            return {
                "success": False,
                "error": str(e),
                "logs": [],
            }
