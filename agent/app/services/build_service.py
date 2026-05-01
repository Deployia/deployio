"""
Build Service for DeployIO Agent.
Orchestrates: clone -> detect -> build -> deploy with staged status tracking.
"""

import asyncio
import inspect
import logging
import subprocess
import time
import uuid
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from app.services.git_service import GitService
from app.services.dockerfile_service import DockerfileService
from app.services.deployment_service import deployment_service

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
        self.deployment_service = deployment_service
        self.active_builds: Dict[str, Dict[str, Any]] = {}
        self.supported_repositories = {
            "github.com/deployia/deployio-mern": {
                "stack": "MERN",
                "framework": "Express + React",
                "port": 3000,
            },
            "github.com/deployia/deployio-next": {
                "stack": "NEXT",
                "framework": "Next.js",
                "port": 3000,
            },
            "github.com/deployia/deployio-fastapi": {
                "stack": "FASTAPI",
                "framework": "FastAPI",
                "port": 8000,
            },
        }

    def _normalize_repo_url(self, git_url: str) -> str:
        if not isinstance(git_url, str) or not git_url.strip():
            raise ValueError("Repository URL is required")
        normalized = (
            git_url.strip().lower().replace("https://", "").replace("http://", "")
        )
        if normalized.endswith(".git"):
            normalized = normalized[:-4]
        return normalized.strip("/")

    def _assert_supported_repository(self, git_url: str) -> Dict[str, Any]:
        normalized = self._normalize_repo_url(git_url)
        return self.supported_repositories.get(normalized, {})

    def _set_stage(self, deployment_id: str, stage: str, message: str = "") -> None:
        entry = self.active_builds.setdefault(
            deployment_id,
            {
                "deployment_id": deployment_id,
                "status": "queued",
                "logs": [],
                "created_at": int(time.time()),
            },
        )
        entry["status"] = stage
        entry["updated_at"] = int(time.time())
        if message:
            entry["logs"].append(
                {
                    "ts": int(time.time()),
                    "level": "info",
                    "stage": stage,
                    "message": message,
                }
            )

    def _set_failed(self, deployment_id: str, error: str) -> None:
        entry = self.active_builds.setdefault(
            deployment_id, {"deployment_id": deployment_id, "logs": []}
        )
        entry["status"] = "failed"
        entry["error"] = error
        entry["updated_at"] = int(time.time())
        entry["logs"].append(
            {
                "ts": int(time.time()),
                "level": "error",
                "stage": "failed",
                "message": error,
            }
        )

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
        repo_path: Optional[str] = None

        try:
            repo_profile = self._assert_supported_repository(git_url)
            # Clone repository
            repo_path = await self.git_service.clone_repository(
                git_url, github_token, branch, deployment_id
            )

            # Detect stack
            stack_info = await self.git_service.detect_stack(repo_path)

            logger.info(f"✅ Stack detected: {stack_info['stack']}")
            return {
                "status": "success",
                "stack": repo_profile.get("stack", stack_info.get("stack")),
                "language": stack_info.get("language"),
                "framework": repo_profile.get("framework", stack_info.get("framework")),
                "port": repo_profile.get("port", stack_info.get("port", 3000)),
                "build_command": stack_info.get("build_command"),
                "start_command": stack_info.get("start_command"),
                "analysis_id": deployment_id,
                "supported": bool(repo_profile),
            }

        except Exception as e:
            logger.error(f"❌ Analysis failed: {e}")
            return {
                "status": "error",
                "error": str(e),
            }
        finally:
            if repo_path:
                await self.git_service.cleanup(repo_path)

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
        repo_path: Optional[str] = None

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

            logger.info(f"✅ Dockerfile generated for {stack_type}")
            return {
                "status": "success",
                **dockerfile_info,
                "analysis_id": deployment_id,
            }

        except Exception as e:
            logger.error(f"❌ Dockerfile generation failed: {e}")
            return {
                "status": "error",
                "error": str(e),
            }
        finally:
            if repo_path:
                await self.git_service.cleanup(repo_path)

    async def _emit_log(
        self,
        logs_callback: Optional[Callable],
        deployment_id: str,
        level: str,
        message: str,
    ) -> None:
        if not logs_callback:
            return

        if inspect.iscoroutinefunction(logs_callback):
            await logs_callback(deployment_id, level, message)
            return

        try:
            logs_callback(deployment_id, level, message)
        except TypeError:
            # Backward compatibility for older two-argument callbacks.
            logs_callback(message, level)

    async def build_and_deploy(
        self,
        git_url: str,
        github_token: Optional[str] = None,
        branch: str = "main",
        subdomain: Optional[str] = None,
        logs_callback: Optional[Callable] = None,
        deployment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Full pipeline: clone → detect → generate Dockerfile → build → deploy.
        Returns: { deployment_id, subdomain, url, status, port }
        """
        # Allow server to provide a deployment_id to keep things in sync
        deployment_id = deployment_id or f"dep-{uuid.uuid4().hex[:12]}"
        repo_path: Optional[Path] = None

        try:
            repo_profile = self._assert_supported_repository(git_url)
            self._set_stage(deployment_id, "queued", "Deployment accepted")
            event_loop = asyncio.get_running_loop()

            # Emit log
            await self._emit_log(
                logs_callback, deployment_id, "info", "Starting deployment..."
            )

            # Clone repository
            self._set_stage(deployment_id, "cloning", "Cloning repository")
            await self._emit_log(
                logs_callback, deployment_id, "info", "Cloning repository..."
            )

            repo_path_str = await self.git_service.clone_repository(
                git_url, github_token, branch, deployment_id
            )
            repo_path = Path(repo_path_str)

            # Detect stack
            self._set_stage(deployment_id, "detecting", "Detecting stack")
            await self._emit_log(
                logs_callback, deployment_id, "info", "Detecting stack..."
            )

            stack_info = await self.git_service.detect_stack(str(repo_path))
            stack_type = repo_profile.get("stack", stack_info.get("stack", "UNKNOWN"))
            port = repo_profile.get("port", stack_info.get("port", 3000))
            await self._emit_log(
                logs_callback, deployment_id, "info", f"Stack detected: {stack_type}"
            )

            self._set_stage(deployment_id, "building", "Preparing Dockerfile")
            # Prefer repository Dockerfile for known examples.
            await self._emit_log(
                logs_callback, deployment_id, "info", "Preparing Dockerfile..."
            )

            dockerfile_path = repo_path / "Dockerfile"
            using_repo_dockerfile = dockerfile_path.exists()
            if not using_repo_dockerfile:
                dockerfile_info = await self.dockerfile_service.generate_dockerfile(
                    stack_type, str(repo_path), port
                )
                _ = dockerfile_info
                dockerfile_path = repo_path / "Dockerfile.generated"
            else:
                logger.info("Using repository Dockerfile at %s", dockerfile_path)

            # Build Docker image
            await self._emit_log(
                logs_callback, deployment_id, "info", "Building Docker image..."
            )

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
                event_loop,
            )

            if not result["success"]:
                if using_repo_dockerfile:
                    logger.warning(
                        "Build failed with repository Dockerfile for %s, retrying with generated profile",
                        deployment_id,
                    )
                    dockerfile_info = await self.dockerfile_service.generate_dockerfile(
                        stack_type, str(repo_path), port
                    )
                    _ = dockerfile_info
                    dockerfile_path = repo_path / "Dockerfile.generated"
                    build_command = [
                        "docker",
                        "build",
                        "-t",
                        f"deployio/{deployment_id}:latest",
                        "-f",
                        str(dockerfile_path),
                        str(repo_path),
                    ]
                    result = await asyncio.to_thread(
                        self._run_build_with_logs,
                        build_command,
                        deployment_id,
                        logs_callback,
                        event_loop,
                    )
                if not result["success"]:
                    raise Exception(f"Docker build failed: {result['error']}")

            await self._emit_log(
                logs_callback, deployment_id, "info", "Build completed successfully"
            )

            # Generate subdomain
            if not subdomain:
                repo_name = git_url.split("/")[-1].replace(".git", "").lower()
                subdomain = f"{repo_name}-{deployment_id[:6]}"

            # Deploy to Docker + Traefik
            self._set_stage(deployment_id, "deploying", "Starting runtime container")
            await self._emit_log(
                logs_callback,
                deployment_id,
                "info",
                f"Deploying to subdomain: {subdomain}...",
            )

            # Call async deploy method directly (not in thread)
            deploy_result = await self.deployment_service.deploy(
                deployment_id,
                f"deployio/{deployment_id}:latest",
                subdomain,
                port,
                {},
            )

            deploy_status = deploy_result.get("status")
            if deploy_status != "running":
                raise Exception(deploy_result.get("error") or "Deployment failed")

            await self._emit_log(
                logs_callback, deployment_id, "info", "Deployment successful!"
            )

            self._set_stage(deployment_id, "running", "Deployment running")
            self.active_builds[deployment_id].update(
                {
                    "url": deploy_result.get("url"),
                    "subdomain": subdomain,
                    "stack": stack_type,
                    "image": f"deployio/{deployment_id}:latest",
                    "port": port,
                    "container_name": deploy_result.get("container_name"),
                    "container_id": deploy_result.get("container_id"),
                }
            )

            return {
                "status": "running",
                "deployment_id": deployment_id,
                "subdomain": subdomain,
                "url": deploy_result.get("url") or f"https://{subdomain}.deployio.tech",
                "port": port,
                "stack": stack_type,
                "logs": result.get("logs", []),
            }

        except Exception as e:
            logger.error(f"❌ Deployment failed: {e}")
            self._set_failed(deployment_id, str(e))

            await self._emit_log(
                logs_callback, deployment_id, "error", f"Deployment failed: {e}"
            )

            return {
                "status": "error",
                "deployment_id": deployment_id,
                "error": str(e),
            }
        finally:
            if repo_path:
                await self.git_service.cleanup(str(repo_path))

    async def deploy_repository(
        self,
        repo_url: str,
        branch: str = "main",
        subdomain: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
        deployment_id: Optional[str] = None,
        github_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        # deployment_id/env are accepted for contract compatibility.
        _ = deployment_id, env
        result = await self.build_and_deploy(
            git_url=repo_url,
            github_token=github_token,
            branch=branch,
            subdomain=subdomain,
        )
        return {
            "deployment_id": result.get("deployment_id"),
            "status": result.get("status"),
            "stack": result.get("stack"),
            "container_name": self.active_builds.get(
                result.get("deployment_id", ""), {}
            ).get("container_name"),
            "url": result.get("url"),
            "logs_ref": (
                f"/agent/v1/deploy/{result.get('deployment_id')}/logs"
                if result.get("deployment_id")
                else None
            ),
            "error": result.get("error"),
        }

    async def get_deployment_status(self, deployment_id: str) -> Dict[str, Any]:
        local = self.active_builds.get(deployment_id)
        runtime = await self.deployment_service.get_status(deployment_id)
        if local:
            merged = {**runtime, **local}
            merged["runtime_status"] = runtime.get("status")
            return merged
        return runtime

    async def get_deployment_logs(
        self, deployment_id: str, tail: int = 200
    ) -> Dict[str, Any]:
        runtime = await self.deployment_service.get_logs(deployment_id, tail=tail)
        local = self.active_builds.get(deployment_id, {})
        return {
            "deployment_id": deployment_id,
            "status": local.get("status", runtime.get("status")),
            "pipeline_logs": local.get("logs", []),
            "runtime_logs": runtime.get("logs", ""),
            "runtime_error": runtime.get("error"),
        }

    async def stop_deployment(self, deployment_id: str) -> Dict[str, Any]:
        result = await self.deployment_service.stop(deployment_id)
        if deployment_id in self.active_builds:
            self.active_builds[deployment_id]["status"] = result.get(
                "status", "stopped"
            )
        return result

    @staticmethod
    def _run_build_with_logs(
        build_command: list,
        deployment_id: str,
        logs_callback: Optional[Callable] = None,
        event_loop: Optional[asyncio.AbstractEventLoop] = None,
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
                        if inspect.iscoroutinefunction(logs_callback) and event_loop:
                            future = asyncio.run_coroutine_threadsafe(
                                logs_callback(deployment_id, "info", line), event_loop
                            )
                            future.result(timeout=5)
                        else:
                            logs_callback(deployment_id, "info", line)
                    except Exception:
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
