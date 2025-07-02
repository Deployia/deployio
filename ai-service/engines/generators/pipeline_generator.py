"""
CI/CD Pipeline Generator - Generate pipeline configurations for various platforms
Supports GitHub Actions, GitLab CI, Jenkins, Azure Pipelines, and more
"""

import logging
import yaml
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

from models.analysis_models import AnalysisResult, TechnologyStack, BuildConfiguration, DeploymentConfiguration

logger = logging.getLogger(__name__)


@dataclass
class PipelineStep:
    """Individual pipeline step configuration"""

    name: str
    action: str
    parameters: Dict[str, Any]
    condition: Optional[str] = None
    timeout: Optional[str] = None


@dataclass
class PipelineJob:
    """Pipeline job configuration"""

    name: str
    runs_on: str
    steps: List[PipelineStep]
    environment: Optional[str] = None
    needs: Optional[List[str]] = None


@dataclass
class PipelineConfig:
    """Complete pipeline configuration"""

    platform: str
    name: str
    triggers: List[str]
    jobs: List[PipelineJob]
    environment_variables: Dict[str, str]
    secrets: List[str]


class PipelineGenerator:
    """
    Multi-platform CI/CD pipeline generator

    Platforms:
    - GitHub Actions
    - GitLab CI
    - Jenkins
    - Azure Pipelines
    - CircleCI
    """

    def __init__(self):
        self.supported_platforms = [
            "github-actions",
            "gitlab-ci",
            "jenkins",
            "azure-pipelines",
            "circleci",
        ]

    async def generate_pipeline(
        self,
        analysis: AnalysisResult,
        platform: str = "github-actions",
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Generate CI/CD pipeline configuration"""
        try:
            if platform not in self.supported_platforms:
                raise ValueError(f"Unsupported platform: {platform}")

            config = self._create_pipeline_config(analysis, platform, options or {})

            if platform == "github-actions":
                return self._generate_github_actions(config)
            elif platform == "gitlab-ci":
                return self._generate_gitlab_ci(config)
            elif platform == "jenkins":
                return self._generate_jenkins(config)
            elif platform == "azure-pipelines":
                return self._generate_azure_pipelines(config)
            elif platform == "circleci":
                return self._generate_circleci(config)

        except Exception as e:
            logger.error(f"Error generating pipeline for {platform}: {e}")
            # Handle both dict and object formats for fallback
            if isinstance(analysis, dict):
                stack_data = analysis.get("technology_stack", {})
                # Create a simple TechnologyStack for fallback
                from ..core.models import TechnologyStack

                fallback_stack = TechnologyStack(
                    language=stack_data.get("language", "unknown"),
                    framework=stack_data.get("framework"),
                )
            else:
                fallback_stack = analysis.technology_stack
            return self._generate_fallback_pipeline(fallback_stack, platform)

    def _create_pipeline_config(
        self, analysis: AnalysisResult, platform: str, options: Dict[str, Any]
    ) -> PipelineConfig:
        """Create pipeline configuration based on analysis results"""
        # Handle both dict and object formats
        if isinstance(analysis, dict):
            stack = analysis.get("technology_stack")
            if isinstance(stack, dict):
                # Convert dict to TechnologyStack object
                from ..core.models import TechnologyStack

                stack = TechnologyStack(
                    language=stack.get("language"),
                    framework=stack.get("framework"),
                    database=stack.get("database"),
                    build_tool=stack.get("build_tool"),
                    package_manager=stack.get("package_manager"),
                    runtime_version=stack.get("runtime_version"),
                    additional_technologies=stack.get("additional_technologies", []),
                    architecture_pattern=stack.get("architecture_pattern"),
                    deployment_strategy=stack.get("deployment_strategy"),
                )
        else:
            stack = analysis.technology_stack

        # Common configuration
        config = PipelineConfig(
            platform=platform,
            name=f"{stack.primary_language.title()} CI/CD",
            triggers=["push", "pull_request"],
            jobs=[],
            environment_variables={},
            secrets=[],
        )

        # Create jobs based on technology stack
        config.jobs = self._create_jobs(stack, platform, options)

        # Set environment variables
        config.environment_variables = self._get_environment_variables(stack)

        # Set required secrets
        config.secrets = self._get_required_secrets(stack, options)

        return config

    def _create_jobs(
        self, stack: TechnologyStack, platform: str, options: Dict[str, Any]
    ) -> List[PipelineJob]:
        """Create pipeline jobs based on technology stack"""
        jobs = []

        # Build job
        build_job = self._create_build_job(stack, platform)
        jobs.append(build_job)

        # Test job (if tests detected)
        if options.get("include_tests", True):
            test_job = self._create_test_job(stack, platform)
            jobs.append(test_job)

        # Security scan job
        if options.get("include_security", True):
            security_job = self._create_security_job(stack, platform)
            jobs.append(security_job)

        # Deploy job
        if options.get("include_deploy", True):
            deploy_job = self._create_deploy_job(stack, platform)
            jobs.append(deploy_job)

        return jobs

    def _create_build_job(self, stack: TechnologyStack, platform: str) -> PipelineJob:
        """Create build job based on technology stack"""
        primary_lang = stack.primary_language.lower()

        if platform == "github-actions":
            runs_on = "ubuntu-latest"
        else:
            runs_on = "ubuntu-latest"

        steps = []

        # Checkout step
        steps.append(
            PipelineStep(
                name="Checkout code",
                action="checkout",
                parameters={
                    "version": "v4" if platform == "github-actions" else "latest"
                },
            )
        )

        # Language-specific setup
        if primary_lang == "node":
            steps.extend(self._create_node_build_steps(stack, platform))
        elif primary_lang == "python":
            steps.extend(self._create_python_build_steps(stack, platform))
        elif primary_lang == "java":
            steps.extend(self._create_java_build_steps(stack, platform))
        elif primary_lang == "go":
            steps.extend(self._create_go_build_steps(stack, platform))
        elif primary_lang == "php":
            steps.extend(self._create_php_build_steps(stack, platform))
        elif primary_lang == "ruby":
            steps.extend(self._create_ruby_build_steps(stack, platform))
        elif primary_lang == "rust":
            steps.extend(self._create_rust_build_steps(stack, platform))
        elif primary_lang == "dotnet":
            steps.extend(self._create_dotnet_build_steps(stack, platform))

        return PipelineJob(name="build", runs_on=runs_on, steps=steps)

    def _create_node_build_steps(
        self, stack: TechnologyStack, platform: str
    ) -> List[PipelineStep]:
        """Create Node.js build steps"""
        steps = []

        # Setup Node.js
        steps.append(
            PipelineStep(
                name="Setup Node.js",
                action="setup-node" if platform == "github-actions" else "node:18",
                parameters={"node-version": "18", "cache": "npm"},
            )
        )

        # Install dependencies
        package_manager = "npm"
        if "yarn" in stack.package_managers:
            package_manager = "yarn"
        elif "pnpm" in stack.package_managers:
            package_manager = "pnpm"

        steps.append(
            PipelineStep(
                name="Install dependencies",
                action="run",
                parameters={"command": f"{package_manager} ci"},
            )
        )

        # Build
        steps.append(
            PipelineStep(
                name="Build application",
                action="run",
                parameters={"command": f"{package_manager} run build"},
            )
        )

        # Cache build artifacts
        steps.append(
            PipelineStep(
                name="Cache build artifacts",
                action="cache",
                parameters={"path": "dist/", "key": "build-${{ github.sha }}"},
            )
        )

        return steps

    def _create_python_build_steps(
        self, stack: TechnologyStack, platform: str
    ) -> List[PipelineStep]:
        """Create Python build steps"""
        steps = []

        # Setup Python
        steps.append(
            PipelineStep(
                name="Setup Python",
                action=(
                    "setup-python" if platform == "github-actions" else "python:3.11"
                ),
                parameters={"python-version": "3.11", "cache": "pip"},
            )
        )

        # Install dependencies
        steps.append(
            PipelineStep(
                name="Install dependencies",
                action="run",
                parameters={"command": "pip install -r requirements.txt"},
            )
        )

        # Build (if needed)
        if "setup.py" in stack.build_tools or "pyproject.toml" in stack.build_tools:
            steps.append(
                PipelineStep(
                    name="Build package",
                    action="run",
                    parameters={"command": "python -m build"},
                )
            )

        return steps

    def _create_test_job(self, stack: TechnologyStack, platform: str) -> PipelineJob:
        """Create test job"""
        primary_lang = stack.primary_language.lower()

        steps = [
            PipelineStep(
                name="Checkout code",
                action="checkout",
                parameters={
                    "version": "v4" if platform == "github-actions" else "latest"
                },
            )
        ]

        # Language-specific test commands
        if primary_lang == "node":
            steps.extend(
                [
                    PipelineStep(
                        name="Setup Node.js",
                        action="setup-node",
                        parameters={"node-version": "18", "cache": "npm"},
                    ),
                    PipelineStep(
                        name="Install dependencies",
                        action="run",
                        parameters={"command": "npm ci"},
                    ),
                    PipelineStep(
                        name="Run tests",
                        action="run",
                        parameters={"command": "npm test"},
                    ),
                ]
            )
        elif primary_lang == "python":
            steps.extend(
                [
                    PipelineStep(
                        name="Setup Python",
                        action="setup-python",
                        parameters={"python-version": "3.11"},
                    ),
                    PipelineStep(
                        name="Install dependencies",
                        action="run",
                        parameters={
                            "command": "pip install -r requirements.txt pytest"
                        },
                    ),
                    PipelineStep(
                        name="Run tests", action="run", parameters={"command": "pytest"}
                    ),
                ]
            )

        return PipelineJob(
            name="test", runs_on="ubuntu-latest", steps=steps, needs=["build"]
        )

    def _create_security_job(
        self, stack: TechnologyStack, platform: str
    ) -> PipelineJob:
        """Create security scanning job"""
        steps = [
            PipelineStep(
                name="Checkout code", action="checkout", parameters={"version": "v4"}
            ),
            PipelineStep(
                name="Run security scan",
                action=(
                    "github/codeql-action/analyze"
                    if platform == "github-actions"
                    else "security-scan"
                ),
                parameters={"languages": stack.primary_language.lower()},
            ),
        ]

        return PipelineJob(name="security", runs_on="ubuntu-latest", steps=steps)

    def _create_deploy_job(self, stack: TechnologyStack, platform: str) -> PipelineJob:
        """Create deployment job"""
        steps = [
            PipelineStep(
                name="Checkout code", action="checkout", parameters={"version": "v4"}
            ),
            PipelineStep(
                name="Build Docker image",
                action="run",
                parameters={"command": "docker build -t app:latest ."},
            ),
            PipelineStep(
                name="Deploy to production",
                action="run",
                parameters={"command": "echo 'Add your deployment commands here'"},
                condition="github.ref == 'refs/heads/main'",
            ),
        ]

        return PipelineJob(
            name="deploy",
            runs_on="ubuntu-latest",
            steps=steps,
            needs=["build", "test", "security"],
            environment="production",
        )

    def _generate_github_actions(self, config: PipelineConfig) -> str:
        """Generate GitHub Actions workflow"""
        workflow = {
            "name": config.name,
            "on": {
                "push": {"branches": ["main", "develop"]},
                "pull_request": {"branches": ["main"]},
            },
            "env": config.environment_variables,
            "jobs": {},
        }

        for job in config.jobs:
            job_config = {"runs-on": job.runs_on, "steps": []}

            if job.needs:
                job_config["needs"] = job.needs

            if job.environment:
                job_config["environment"] = job.environment

            for step in job.steps:
                step_config = {"name": step.name}

                if step.action == "checkout":
                    step_config["uses"] = "actions/checkout@v4"
                elif step.action == "setup-node":
                    step_config["uses"] = "actions/setup-node@v3"
                    step_config["with"] = step.parameters
                elif step.action == "setup-python":
                    step_config["uses"] = "actions/setup-python@v4"
                    step_config["with"] = step.parameters
                elif step.action == "cache":
                    step_config["uses"] = "actions/cache@v3"
                    step_config["with"] = step.parameters
                elif step.action == "run":
                    step_config["run"] = step.parameters["command"]
                else:
                    step_config["uses"] = step.action
                    if step.parameters:
                        step_config["with"] = step.parameters

                if step.condition:
                    step_config["if"] = step.condition

                job_config["steps"].append(step_config)

            workflow["jobs"][job.name] = job_config

        return yaml.dump(workflow, default_flow_style=False, sort_keys=False)

    def _generate_gitlab_ci(self, config: PipelineConfig) -> str:
        """Generate GitLab CI configuration"""
        # Implementation for GitLab CI
        gitlab_config = {
            "stages": [job.name for job in config.jobs],
            "variables": config.environment_variables,
        }

        for job in config.jobs:
            job_config = {
                "stage": job.name,
                "script": [
                    step.parameters.get("command", "echo 'No command'")
                    for step in job.steps
                    if step.action == "run"
                ],
            }
            gitlab_config[job.name] = job_config

        return yaml.dump(gitlab_config, default_flow_style=False)

    def _get_environment_variables(self, stack: TechnologyStack) -> Dict[str, str]:
        """Get environment variables based on technology stack"""
        env_vars = {}

        if stack.primary_language.lower() == "node":
            env_vars["NODE_ENV"] = "production"
        elif stack.primary_language.lower() == "python":
            env_vars["PYTHONUNBUFFERED"] = "1"

        return env_vars

    def _get_required_secrets(
        self, stack: TechnologyStack, options: Dict[str, Any]
    ) -> List[str]:
        """Get required secrets for the pipeline"""
        secrets = []

        if options.get("include_deploy", True):
            secrets.extend(["DOCKER_USERNAME", "DOCKER_PASSWORD"])

        return secrets

    def _generate_fallback_pipeline(self, stack: TechnologyStack, platform: str) -> str:
        """Generate basic fallback pipeline"""
        if platform == "github-actions":
            return f"""name: {stack.primary_language.title()} CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Build
      run: echo \"Please configure your build steps\"
    - name: Test
      run: echo \"Please configure your test steps\"
# Technology Stack: {stack.primary_language}
# Frameworks: {', '.join(stack.frameworks)}
# Please customize this workflow for your specific needs
"""
        else:
            return f"# Please configure your {platform} pipeline for {stack.primary_language}"
