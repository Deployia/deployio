"""
Generator Enhancement Engine

Specialized enhancer for configuration generation using modular LLM clients.
Focuses on creating Dockerfiles, CI/CD pipelines, and deployment configurations.
"""

import logging
from typing import Dict, Any, List, Optional
from engines.llm.client_manager import LLMClientManager
from engines.llm.models import LLMRequest, LLMProvider
from engines.prompts.generator_prompts import GeneratorPrompts
from models.analysis_models import AnalysisResult 

logger = logging.getLogger(__name__)


class GeneratorEnhancer:
    """
    Specialized enhancer for configuration generation.
    Uses modular LLM clients and generation-specific prompts.
    """

    def __init__(self, client_manager: Optional[LLMClientManager] = None):
        self.client_manager = client_manager or LLMClientManager()
        self.prompts = GeneratorPrompts()

        # Configuration for generation tasks
        self.max_tokens = 3000  # More tokens for configuration generation
        self.temperature = 0.2  # Slightly higher for creative generation

        logger.info("GeneratorEnhancer initialized with modular LLM services")

    @property
    def is_available(self) -> bool:
        """Check if LLM services are available for generation."""
        return len(self.client_manager.get_available_providers()) > 0

    async def generate_dockerfile(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate optimized Dockerfile for the analyzed project.

        Args:
            analysis_result: Analysis results from rule-based analyzers
            repository_data: Repository files and metadata
            options: Generation options (multi-stage, optimization level, etc.)

        Returns:
            Dictionary containing generated Dockerfile and metadata
        """
        if not self.is_available:
            logger.warning("No LLM providers available for Dockerfile generation")
            return {"error": "LLM services unavailable"}

        try:
            logger.info("Generating Dockerfile with LLM")

            # Generate Dockerfile prompt
            prompt_data = self.prompts.dockerfile_generation(
                analysis_result, repository_data, options or {}
            )

            # Create LLM request
            request = LLMRequest(
                messages=[
                    {"role": "system", "content": prompt_data["system"]},
                    {"role": "user", "content": prompt_data["user"]},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )

            # Call LLM with fallback providers
            response = await self.client_manager.generate(
                request, preferred_provider=LLMProvider.GROQ
            )

            if response and response.success:
                # Parse and structure Dockerfile
                dockerfile_data = self._parse_dockerfile_response(response.content)

                logger.info("Dockerfile generation completed successfully")
                return dockerfile_data
            else:
                logger.warning("Dockerfile generation failed")
                return {"error": "LLM generation failed"}

        except Exception as e:
            logger.error(f"Dockerfile generation error: {e}")
            return {"error": str(e)}

    async def generate_docker_compose(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate Docker Compose configuration for the project.

        Args:
            analysis_result: Analysis results from rule-based analyzers
            repository_data: Repository files and metadata
            options: Generation options (services, networks, volumes, etc.)

        Returns:
            Dictionary containing generated Docker Compose and metadata
        """
        if not self.is_available:
            logger.warning("No LLM providers available for Docker Compose generation")
            return {"error": "LLM services unavailable"}

        try:
            logger.info("Generating Docker Compose with LLM")

            # Generate Docker Compose prompt
            prompt_data = self.prompts.docker_compose_generation(
                analysis_result, repository_data, options or {}
            )

            # Create LLM request
            request = LLMRequest(
                messages=[
                    {"role": "system", "content": prompt_data["system"]},
                    {"role": "user", "content": prompt_data["user"]},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )

            # Call LLM with fallback providers
            response = await self.client_manager.generate(
                request, preferred_provider=LLMProvider.GROQ
            )

            if response and response.success:
                # Parse and structure Docker Compose
                compose_data = self._parse_docker_compose_response(response.content)

                logger.info("Docker Compose generation completed successfully")
                return compose_data
            else:
                logger.warning("Docker Compose generation failed")
                return {"error": "LLM generation failed"}

        except Exception as e:
            logger.error(f"Docker Compose generation error: {e}")
            return {"error": str(e)}

    async def generate_github_actions(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate GitHub Actions workflow for CI/CD.

        Args:
            analysis_result: Analysis results from rule-based analyzers
            repository_data: Repository files and metadata
            options: Generation options (deployment target, testing strategy, etc.)

        Returns:
            Dictionary containing generated GitHub Actions workflow and metadata
        """
        if not self.is_available:
            logger.warning("No LLM providers available for GitHub Actions generation")
            return {"error": "LLM services unavailable"}

        try:
            logger.info("Generating GitHub Actions workflow with LLM")

            # Generate GitHub Actions prompt
            prompt_data = self.prompts.github_actions_generation(
                analysis_result, repository_data, options or {}
            )

            # Create LLM request
            request = LLMRequest(
                messages=[
                    {"role": "system", "content": prompt_data["system"]},
                    {"role": "user", "content": prompt_data["user"]},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )

            # Call LLM with fallback providers
            response = await self.client_manager.generate(
                request, preferred_provider=LLMProvider.GROQ
            )

            if response and response.success:
                # Parse and structure GitHub Actions workflow
                workflow_data = self._parse_github_actions_response(response.content)

                logger.info("GitHub Actions workflow generation completed successfully")
                return workflow_data
            else:
                logger.warning("GitHub Actions workflow generation failed")
                return {"error": "LLM generation failed"}

        except Exception as e:
            logger.error(f"GitHub Actions workflow generation error: {e}")
            return {"error": str(e)}

    async def generate_kubernetes_manifests(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate Kubernetes deployment manifests.

        Args:
            analysis_result: Analysis results from rule-based analyzers
            repository_data: Repository files and metadata
            options: Generation options (replicas, resources, ingress, etc.)

        Returns:
            Dictionary containing generated Kubernetes manifests and metadata
        """
        if not self.is_available:
            logger.warning(
                "No LLM providers available for Kubernetes manifests generation"
            )
            return {"error": "LLM services unavailable"}

        try:
            logger.info("Generating Kubernetes manifests with LLM")

            # Generate Kubernetes manifests prompt
            prompt_data = self.prompts.kubernetes_manifests_generation(
                analysis_result, repository_data, options or {}
            )

            # Create LLM request
            request = LLMRequest(
                messages=[
                    {"role": "system", "content": prompt_data["system"]},
                    {"role": "user", "content": prompt_data["user"]},
                ],
                max_tokens=self.max_tokens * 2,  # More tokens for multiple manifests
                temperature=self.temperature,
            )

            # Call LLM with fallback providers
            response = await self.client_manager.generate(
                request, preferred_provider=LLMProvider.GROQ
            )

            if response and response.success:
                # Parse and structure Kubernetes manifests
                manifests_data = self._parse_kubernetes_manifests_response(
                    response.content
                )

                logger.info("Kubernetes manifests generation completed successfully")
                return manifests_data
            else:
                logger.warning("Kubernetes manifests generation failed")
                return {"error": "LLM generation failed"}

        except Exception as e:
            logger.error(f"Kubernetes manifests generation error: {e}")
            return {"error": str(e)}

    async def generate_all_configurations(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate all deployment configurations at once.

        Args:
            analysis_result: Analysis results from rule-based analyzers
            repository_data: Repository files and metadata
            options: Generation options for all configurations

        Returns:
            Dictionary containing all generated configurations
        """
        logger.info("Generating all deployment configurations")

        results = {}

        # Generate configurations in parallel for efficiency
        import asyncio

        tasks = []
        task_names = []

        # Add generation tasks
        if options is None or options.get("include_dockerfile", True):
            tasks.append(
                self.generate_dockerfile(analysis_result, repository_data, options)
            )
            task_names.append("dockerfile")

        if options is None or options.get("include_compose", True):
            tasks.append(
                self.generate_docker_compose(analysis_result, repository_data, options)
            )
            task_names.append("docker_compose")

        if options is None or options.get("include_github_actions", True):
            tasks.append(
                self.generate_github_actions(analysis_result, repository_data, options)
            )
            task_names.append("github_actions")

        if options is None or options.get("include_kubernetes", True):
            tasks.append(
                self.generate_kubernetes_manifests(
                    analysis_result, repository_data, options
                )
            )
            task_names.append("kubernetes")

        # Execute all tasks
        try:
            task_results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            for i, result in enumerate(task_results):
                task_name = task_names[i]

                if isinstance(result, Exception):
                    logger.error(
                        f"Configuration generation failed for {task_name}: {result}"
                    )
                    results[task_name] = {"error": str(result)}
                else:
                    results[task_name] = result

        except Exception as e:
            logger.error(f"Error in parallel configuration generation: {e}")
            results["error"] = str(e)

        return results

    def _parse_dockerfile_response(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response for Dockerfile generation."""
        try:
            # Extract JSON metadata first
            metadata = self._extract_json_metadata(response_content)
            
            # Extract dockerfile content from JSON if available
            dockerfile_content = ""
            if metadata and "dockerfile_content" in metadata:
                dockerfile_content = metadata["dockerfile_content"]
                # Remove dockerfile_content from metadata to avoid duplication
                metadata = {k: v for k, v in metadata.items() if k != "dockerfile_content"}
            else:
                # Fallback: try to extract Dockerfile code block
                dockerfile_content = self._extract_code_block(
                    response_content, "dockerfile"
                )

            return {
                "dockerfile": dockerfile_content,
                "filename": "Dockerfile",
                "type": "dockerfile",
                "metadata": metadata,
                "success": True,
            }

        except Exception as e:
            logger.warning(f"Failed to parse Dockerfile response: {e}")
            return {
                "dockerfile": response_content,  # Fallback to raw content
                "filename": "Dockerfile",
                "type": "dockerfile",
                "metadata": {},
                "success": False,
                "error": str(e),
            }

    def _parse_docker_compose_response(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response for Docker Compose generation."""
        try:
            # Extract JSON metadata first
            metadata = self._extract_json_metadata(response_content)
            
            # Extract docker compose content from JSON if available
            compose_content = ""
            if metadata and "docker_compose_content" in metadata:
                compose_content = metadata["docker_compose_content"]
                # Remove docker_compose_content from metadata to avoid duplication
                metadata = {k: v for k, v in metadata.items() if k != "docker_compose_content"}
            else:
                # Fallback: try to extract YAML code block
                compose_content = self._extract_code_block(response_content, "yaml")

            return {
                "docker_compose": compose_content,
                "filename": "docker-compose.yml",
                "type": "docker_compose",
                "metadata": metadata,
                "success": True,
            }

        except Exception as e:
            logger.warning(f"Failed to parse Docker Compose response: {e}")
            return {
                "docker_compose": response_content,  # Fallback to raw content
                "filename": "docker-compose.yml",
                "type": "docker_compose",
                "metadata": {},
                "success": False,
                "error": str(e),
            }

    def _parse_github_actions_response(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response for GitHub Actions workflow generation."""
        try:
            # Extract JSON metadata first
            metadata = self._extract_json_metadata(response_content)
            
            # Extract workflow content from JSON if available
            workflow_content = ""
            if metadata and "workflow_content" in metadata:
                workflow_content = metadata["workflow_content"]
                # Remove workflow_content from metadata to avoid duplication
                metadata = {k: v for k, v in metadata.items() if k != "workflow_content"}
            else:
                # Fallback: try to extract YAML code block
                workflow_content = self._extract_code_block(response_content, "yaml")

            return {
                "github_actions": workflow_content,
                "filename": ".github/workflows/deploy.yml",
                "type": "github_actions",
                "metadata": metadata,
                "success": True,
            }

        except Exception as e:
            logger.warning(f"Failed to parse GitHub Actions response: {e}")
            return {
                "github_actions": response_content,  # Fallback to raw content
                "filename": ".github/workflows/deploy.yml",
                "type": "github_actions",
                "metadata": {},
                "success": False,
                "error": str(e),
            }

    def _parse_kubernetes_manifests_response(
        self, response_content: str
    ) -> Dict[str, Any]:
        """Parse LLM response for Kubernetes manifests generation."""
        try:
            # Extract Kubernetes manifests content
            manifests_content = self._extract_code_block(response_content, "yaml")

            # Also try to extract JSON metadata if present
            metadata = self._extract_json_metadata(response_content)

            # Split manifests if multiple documents
            manifests = self._split_yaml_documents(manifests_content)

            return {
                "kubernetes": manifests_content,
                "manifests": manifests,
                "filename": "k8s-manifests.yml",
                "type": "kubernetes",
                "metadata": metadata,
                "success": True,
            }

        except Exception as e:
            logger.warning(f"Failed to parse Kubernetes manifests response: {e}")
            return {
                "kubernetes": response_content,  # Fallback to raw content
                "manifests": [],
                "filename": "k8s-manifests.yml",
                "type": "kubernetes",
                "metadata": {},
                "success": False,
                "error": str(e),
            }

    def _extract_code_block(self, content: str, language: str) -> str:
        """Extract code block from LLM response."""
        # Look for code blocks with specific language
        import re

        pattern = f"```{language}\\n(.*?)```"
        match = re.search(pattern, content, re.DOTALL)

        if match:
            return match.group(1).strip()

        # Fallback: look for any code block
        pattern = "```\\n(.*?)```"
        match = re.search(pattern, content, re.DOTALL)

        if match:
            return match.group(1).strip()

        # Final fallback: return entire content
        return content.strip()

    def _extract_json_metadata(self, content: str) -> Dict[str, Any]:
        """Extract JSON metadata from LLM response if present."""
        try:
            import re
            import json

            # Look for JSON blocks
            pattern = "```json\\n(.*?)```"
            match = re.search(pattern, content, re.DOTALL)

            if match:
                return json.loads(match.group(1).strip())

            return {}

        except Exception:
            return {}

    def _split_yaml_documents(self, yaml_content: str) -> List[str]:
        """Split YAML content into individual documents."""
        try:
            # Split by YAML document separator
            documents = yaml_content.split("---")

            # Clean and filter non-empty documents
            manifests = []
            for doc in documents:
                doc = doc.strip()
                if doc and not doc.startswith("#"):
                    manifests.append(doc)

            return manifests

        except Exception as e:
            logger.warning(f"Failed to split YAML documents: {e}")
            return [yaml_content]

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on generator enhancer."""
        try:
            # Check LLM client manager
            client_health = self.client_manager.health_check()

            return {
                "generator_enhancer": {
                    "status": "healthy",
                    "available_providers": self.client_manager.get_available_providers(),
                    "llm_clients": client_health,
                    "prompts_loaded": hasattr(self.prompts, "dockerfile_generation"),
                }
            }
        except Exception as e:
            logger.error(f"Generator enhancer health check failed: {e}")
            return {
                "generator_enhancer": {
                    "status": "unhealthy",
                    "error": str(e),
                }
            }
