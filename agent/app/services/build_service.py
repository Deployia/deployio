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
from app.services.deployment_service import DeploymentService, deployment_service

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

    async def _set_stage(
        self,
        deployment_id: str,
        stage: str,
        message: str = "",
        status_callback: Optional[Callable] = None,
        **status_kwargs: Any,
    ) -> None:
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
        if status_callback:
            try:
                if inspect.iscoroutinefunction(status_callback):
                    await status_callback(
                        deployment_id, stage, message, **status_kwargs
                    )
                else:
                    status_callback(deployment_id, stage, message, **status_kwargs)
            except Exception:
                logger.debug("status_callback failed for stage %s", stage, exc_info=True)

    async def _set_failed(
        self,
        deployment_id: str,
        error: str,
        status_callback: Optional[Callable] = None,
    ) -> None:
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
        if status_callback:
            try:
                if inspect.iscoroutinefunction(status_callback):
                    await status_callback(deployment_id, "failed", error)
                else:
                    status_callback(deployment_id, "failed", error)
            except Exception:
                logger.debug("status_callback failed on failed stage", exc_info=True)

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

    async def _resolve_repository_dockerfile(
        self, repo_path: Path, dockerfile_path: Optional[str]
    ) -> Path:
        """
        Resolve the repository Dockerfile to build. Never generates templates.
        """
        if dockerfile_path:
            check = await self.dockerfile_service.check_existing_dockerfile(
                str(repo_path), dockerfile_path
            )
            if not check.get("valid"):
                detail = (
                    f"not found at {dockerfile_path}"
                    if not check.get("exists")
                    else f"at {dockerfile_path} is missing FROM or CMD/ENTRYPOINT"
                )
                raise ValueError(
                    f"Invalid platform Dockerfile ({detail}). "
                    "Fix the file in your repository or choose another service Dockerfile."
                )
            return Path(check["path"])

        discovered = await self.dockerfile_service.discover_valid_dockerfiles(
            str(repo_path)
        )
        if len(discovered) == 1:
            logger.info("Auto-selected repository Dockerfile at %s", discovered[0])
            return Path(discovered[0])
        if not discovered:
            raise ValueError(
                "No valid Dockerfile in repository. Add a Dockerfile with FROM and "
                "CMD or ENTRYPOINT, or select one during project creation."
            )
        rel_paths = [
            Path(p).relative_to(repo_path).as_posix() for p in discovered[:8]
        ]
        raise ValueError(
            "Multiple valid Dockerfiles found "
            f"({', '.join(rel_paths)}). Select one during project creation."
        )

    @staticmethod
    def _resolve_docker_build_paths(
        repo_path: Path, dockerfile_path: Path
    ) -> tuple[str, Path]:
        """
        Resolve docker build -f and context directory.

        Build context is the Dockerfile's directory (not repo root). COPY paths must
        exist inside that context — fix Dockerfiles in the repo if they reference siblings.
        """
        repo_path = repo_path.resolve()
        dockerfile_path = dockerfile_path.resolve()
        dockerfile_dir = dockerfile_path.parent

        if dockerfile_dir != repo_path:
            logger.info(
                "Using Dockerfile directory as build context: %s", dockerfile_dir
            )
            return str(dockerfile_path), dockerfile_dir

        return str(dockerfile_path), repo_path

    async def build_and_deploy(
        self,
        git_url: str,
        github_token: Optional[str] = None,
        branch: str = "main",
        commit_sha: Optional[str] = None,
        subdomain: Optional[str] = None,
        logs_callback: Optional[Callable] = None,
        deployment_id: Optional[str] = None,
        status_callback: Optional[Callable] = None,
        env_vars: Optional[Dict[str, Any]] = None,
        dockerfile_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Full pipeline: clone → detect stack → build with repository Dockerfile → deploy.
        Only Dockerfiles committed in the repository are used (no generated templates).
        ``dockerfile_path`` is relative to the repo root (e.g. ``backend/Dockerfile``).
        Returns: { deployment_id, subdomain, url, status, port }
        """
        # Allow server to provide a deployment_id to keep things in sync
        deployment_id = deployment_id or f"dep-{uuid.uuid4().hex[:12]}"
        repo_path: Optional[Path] = None
        runtime_env = DeploymentService._coerce_env_vars(env_vars)

        async def _stage(stage: str, message: str = "") -> None:
            await self._set_stage(
                deployment_id, stage, message, status_callback=status_callback
            )

        try:
            if not git_url or not str(git_url).strip():
                raise ValueError("Repository URL is required for build")

            repo_profile = self._assert_supported_repository(git_url)
            await _stage("queued", "Deployment accepted")
            event_loop = asyncio.get_running_loop()

            await self._emit_log(
                logs_callback, deployment_id, "info", "Starting deployment..."
            )

            await _stage("cloning", "Cloning repository")
            pin_label = f" @ {commit_sha[:8]}" if commit_sha else ""
            await self._emit_log(
                logs_callback,
                deployment_id,
                "info",
                f"Cloning {branch}{pin_label}...",
            )

            repo_path_str = await self.git_service.clone_repository(
                git_url,
                github_token,
                branch,
                deployment_id,
                commit_sha=commit_sha,
            )
            repo_path = Path(repo_path_str)

            # Detect stack
            await _stage("detecting", "Detecting stack")
            await self._emit_log(
                logs_callback, deployment_id, "info", "Detecting stack..."
            )

            stack_info = await self.git_service.detect_stack(str(repo_path))
            stack_type = repo_profile.get("stack", stack_info.get("stack", "UNKNOWN"))
            port = repo_profile.get("port", stack_info.get("port", 3000))
            await self._emit_log(
                logs_callback, deployment_id, "info", f"Stack detected: {stack_type}"
            )

            await _stage("building", "Resolving Dockerfile")
            await self._emit_log(
                logs_callback, deployment_id, "info", "Resolving repository Dockerfile..."
            )

            dockerfile_path_obj = await self._resolve_repository_dockerfile(
                repo_path, dockerfile_path
            )
            logger.info("Building with repository Dockerfile at %s", dockerfile_path_obj)
            await self._emit_log(
                logs_callback,
                deployment_id,
                "info",
                f"Using Dockerfile: {dockerfile_path_obj.relative_to(repo_path)}",
            )

            # Build Docker image
            await _stage("building", "Running Docker build")
            await self._emit_log(
                logs_callback, deployment_id, "info", "Building Docker image..."
            )

            if str(stack_type).upper() == "NEXT":
                DockerfileService.ensure_next_public_dir(repo_path)

            # Verify Dockerfile exists before building
            if not dockerfile_path_obj.exists():
                raise Exception(f"Dockerfile not found at {dockerfile_path_obj}")

            dockerfile_arg, build_context = self._resolve_docker_build_paths(
                repo_path, dockerfile_path_obj
            )
            build_command = [
                "docker",
                "build",
                "-t",
                f"deployio/{deployment_id}:latest",
                "-f",
                dockerfile_arg,
                str(build_context),
            ]

            logger.info(
                "Running build command: %s (context=%s)",
                " ".join(build_command),
                build_context,
            )

            # Run build with streaming logs
            result = await asyncio.to_thread(
                self._run_build_with_logs,
                build_command,
                deployment_id,
                logs_callback,
                event_loop,
            )

            if not result["success"]:
                rel = dockerfile_path_obj.relative_to(repo_path)
                raise Exception(
                    f"Docker build failed for {rel}: {result.get('error', 'unknown error')}. "
                    "Fix the Dockerfile in your repository (build context is the Dockerfile's folder)."
                )

            await self._emit_log(
                logs_callback, deployment_id, "info", "Build completed successfully"
            )

            # Generate subdomain
            if not subdomain:
                repo_name = git_url.split("/")[-1].replace(".git", "").lower()
                subdomain = f"{repo_name}-{deployment_id[:6]}"

            # Deploy to Docker + Traefik
            await _stage("deploying", "Starting runtime container")
            await self._emit_log(
                logs_callback,
                deployment_id,
                "info",
                f"Deploying to subdomain: {subdomain}...",
            )
            if runtime_env:
                await self._emit_log(
                    logs_callback,
                    deployment_id,
                    "info",
                    "Injecting %d runtime environment variable(s): %s"
                    % (
                        len(runtime_env),
                        ", ".join(sorted(runtime_env.keys())[:20])
                        + ("…" if len(runtime_env) > 20 else ""),
                    ),
                )

            async def _deploy_status_cb(dep_id, status, message, **kwargs):
                # deploy() uses "building" for its pre-run phase; map to deploying here.
                mapped = "deploying" if status == "building" else status
                await _stage(
                    mapped,
                    message or mapped,
                    status_callback=status_callback,
                    **kwargs,
                )

            deploy_result = await self.deployment_service.deploy(
                deployment_id,
                f"deployio/{deployment_id}:latest",
                subdomain,
                port,
                runtime_env,
                status_callback=_deploy_status_cb,
                log_callback=logs_callback,
            )

            deploy_status = deploy_result.get("status")
            if deploy_status != "running":
                raise Exception(deploy_result.get("error") or "Deployment failed")

            await self._emit_log(
                logs_callback, deployment_id, "info", "Deployment successful!"
            )

            await _stage(
                "running",
                "Deployment running",
                status_callback=status_callback,
                container_id=deploy_result.get("container_id"),
                url=deploy_result.get("url"),
            )
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
            await self._set_failed(
                deployment_id, str(e), status_callback=status_callback
            )

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
        result = await self.build_and_deploy(
            git_url=repo_url,
            github_token=github_token,
            branch=branch,
            subdomain=subdomain,
            deployment_id=deployment_id,
            env_vars=env,
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
                if not isinstance(line, str):
                    line = str(line)
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
