"""
Unified Generator - Configuration Generation Orchestrator
Clean, focused orchestration of the configuration generation pipeline
"""

import logging
import time
from typing import Dict, List, Any

from models.analysis_models import AnalysisResult
from ..enhancers.llm_enhancer import LLMEnhancer
from ..generators.dockerfile_generator import DockerfileGenerator
from ..generators.config_generator import ConfigurationGenerator
from ..generators.pipeline_generator import PipelineGenerator
from ..utils.cache_manager import CacheManager
from engines.llm.shared_client_manager import shared_llm_client_manager

logger = logging.getLogger(__name__)


class UnifiedGenerator:
    """
    Main generation orchestrator - coordinates rule-based generators and LLM enhancement

    Flow:
    1. Rule-based generation (Dockerfile, Docker Compose, etc.)
    2. Confidence evaluation
    3. LLM enhancement (always applied for best results)
    4. Result compilation
    """

    def __init__(self):
        # Initialize rule-based generators
        self.dockerfile_generator = DockerfileGenerator()
        self.config_generator = ConfigurationGenerator()
        self.pipeline_generator = PipelineGenerator()

        # Initialize enhancer
        self.llm_enhancer = LLMEnhancer(client_manager=shared_llm_client_manager)

        # Initialize cache
        self.cache_manager = CacheManager()

        logger.info("UnifiedGenerator initialized with clean architecture")

    async def generate_configurations(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        config_types: List[str] = None,
        options: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Generate all requested configurations based on analysis results

        Args:
            analysis_result: Complete analysis results
            repository_data: Repository data with files and metadata
            config_types: List of configuration types to generate
            options: Generation options

        Returns:
            Dict containing all generated configurations
        """
        start_time = time.time()

        repo_name = analysis_result.repository_name
        logger.info(f"Starting configuration generation for repository: {repo_name}")

        try:
            # Set defaults
            if config_types is None:
                config_types = ["dockerfile", "docker_compose", "github_actions"]

            if options is None:
                options = {"optimization_level": "balanced"}

            logger.info(
                f"Generating {len(config_types)} configuration types: {config_types}"
            )
            logger.debug(f"Generation options: {options}")

            # --- CACHE DISABLED FOR ENGINE DEBUGGING ---
            # # Generate cache key
            # cache_key = self._generate_cache_key(
            #     analysis_result.repository_name, analysis_result.branch, config_types
            # )

            # # Check cache first (unless force refresh)
            # if not options.get("force_refresh"):
            #     logger.debug("Checking cache for existing configurations...")
            #     cached_result = await self.cache_manager.get(cache_key)
            #     if cached_result:
            #         logger.info(f"Cache hit for {repo_name} configurations")
            #         return cached_result
            #     logger.debug("No cached configurations found")

            # Step 1: Generate base configurations with rule-based generators
            logger.info(
                "Step 1: Generating base configurations with rule-based generators"
            )
            base_configs = await self._generate_base_configurations(
                analysis_result, repository_data, config_types, options
            )

            # Step 2: Enhance with LLM for high-quality results
            logger.info("Step 2: Enhancing configurations with LLM")
            enhanced_configs = await self._enhance_configurations(
                base_configs, analysis_result, repository_data, options
            )

            # Add metadata
            generation_time = time.time() - start_time
            enhanced_configs["metadata"] = {
                "generated_at": time.time(),
                "processing_time": generation_time,
                "repository_name": repo_name,
                "branch": analysis_result.branch,
                "config_types": config_types,
                "llm_enhanced": True,
            }

            # --- CACHE DISABLED FOR ENGINE DEBUGGING ---
            # logger.debug("Caching generated configurations...")
            # await self.cache_manager.set(
            #     cache_key, enhanced_configs, ttl=options.get("cache_ttl", 3600)
            # )

            logger.info(
                f"Configuration generation completed for {repo_name} in {generation_time:.2f}s"
            )
            return enhanced_configs

        except Exception as e:
            generation_time = time.time() - start_time
            logger.error(
                f"Error generating configurations for {repo_name} after {generation_time:.2f}s: {e}",
                exc_info=True,
            )
            return {
                "error": str(e),
                "metadata": {
                    "generated_at": time.time(),
                    "processing_time": generation_time,
                    "repository_name": repo_name,
                    "branch": analysis_result.branch,
                    "config_types": config_types or [],
                    "llm_enhanced": False,
                    "success": False,
                },
            }

    async def _generate_base_configurations(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        config_types: List[str],
        options: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate base configurations using rule-based generators."""

        base_configs = {}
        generation_start = time.time()
        logger.info(f"Generating base configurations for {len(config_types)} types")

        # Generate Dockerfile
        if "dockerfile" in config_types:
            logger.debug("Generating Dockerfile...")
            dockerfile_start = time.time()
            try:
                dockerfile = await self.dockerfile_generator.generate_dockerfile(
                    analysis_result, options.get("optimization_level", "balanced")
                )
                base_configs["dockerfile"] = dockerfile
                dockerfile_time = time.time() - dockerfile_start
                logger.info(
                    f"Dockerfile generated successfully in {dockerfile_time:.2f}s"
                )
            except Exception as e:
                dockerfile_time = time.time() - dockerfile_start
                logger.error(
                    f"Error generating Dockerfile after {dockerfile_time:.2f}s: {e}"
                )
                base_configs["dockerfile"] = {
                    "content": "",
                    "error": str(e),
                    "success": False,
                }

        # Generate Docker Compose
        if "docker_compose" in config_types:
            logger.debug("Generating Docker Compose...")
            compose_start = time.time()
            try:
                compose_config = (
                    await self.config_generator._generate_docker_compose_config(
                        analysis_result.technology_stack,
                        options.get("optimization_level", "balanced"),
                    )
                )
                base_configs["docker_compose"] = compose_config
                compose_time = time.time() - compose_start
                logger.info(
                    f"Docker Compose generated successfully in {compose_time:.2f}s"
                )
            except Exception as e:
                compose_time = time.time() - compose_start
                logger.error(
                    f"Error generating Docker Compose after {compose_time:.2f}s: {e}"
                )
                base_configs["docker_compose"] = {
                    "content": "",
                    "error": str(e),
                    "success": False,
                }

        # Generate GitHub Actions
        if "github_actions" in config_types:
            logger.debug("Generating GitHub Actions workflow...")
            actions_start = time.time()
            try:
                github_actions = await self.pipeline_generator.generate_pipeline(
                    analysis_result, "github-actions", options
                )
                base_configs["github_actions"] = {
                    "content": github_actions,
                    "success": True,
                    "type": "github-actions",
                }
                actions_time = time.time() - actions_start
                logger.info(
                    f"GitHub Actions workflow generated successfully in {actions_time:.2f}s"
                )
            except Exception as e:
                actions_time = time.time() - actions_start
                logger.error(
                    f"Error generating GitHub Actions after {actions_time:.2f}s: {e}"
                )
                base_configs["github_actions"] = {
                    "content": "",
                    "error": str(e),
                    "success": False,
                }

        # Generate Kubernetes manifests
        if "kubernetes" in config_types:
            logger.debug("Generating Kubernetes manifests...")
            k8s_start = time.time()
            try:
                kubernetes = self.config_generator.generate_kubernetes_manifests(
                    analysis_result, options.get("optimization_level", "balanced")
                )
                base_configs["kubernetes"] = kubernetes
                k8s_time = time.time() - k8s_start
                logger.info(
                    f"Kubernetes manifests generated successfully in {k8s_time:.2f}s"
                )
            except Exception as e:
                k8s_time = time.time() - k8s_start
                logger.error(
                    f"Error generating Kubernetes manifests after {k8s_time:.2f}s: {e}"
                )
                base_configs["kubernetes"] = {
                    "content": "",
                    "error": str(e),
                    "success": False,
                }

        base_generation_time = time.time() - generation_start
        successful_configs = len(
            [
                c
                for c in base_configs.values()
                if isinstance(c, dict) and not c.get("error")
            ]
        )
        logger.info(
            f"Base configuration generation completed in {base_generation_time:.2f}s - {successful_configs}/{len(config_types)} successful"
        )

        return base_configs

    async def _enhance_configurations(
        self,
        base_configs: Dict[str, Any],
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Enhance configurations using LLM enhancer."""

        enhancement_start = time.time()
        logger.info(f"Starting LLM enhancement for {len(base_configs)} configurations")

        # Only enhance if LLM services are available
        if not self.llm_enhancer.is_available:
            logger.warning("LLM enhancement not available, using base configurations")
            return base_configs

        try:
            logger.debug("Calling LLM enhancer for configuration generation...")
            # Use the generator enhancer to improve all configurations
            enhanced_configs = await self.llm_enhancer.generate_configurations(
                analysis_result, repository_data, options
            )

            enhancement_time = time.time() - enhancement_start

            # If LLM enhancement failed, fall back to base configs
            if "error" in enhanced_configs:
                logger.warning(
                    f"LLM enhancement failed after {enhancement_time:.2f}s: {enhanced_configs['error']}"
                )
                return base_configs

            # Merge any missing configs from base (fallback mechanism)
            merged_count = 0
            for config_type, content in base_configs.items():
                if config_type not in enhanced_configs:
                    enhanced_configs[config_type] = content
                    merged_count += 1

            if merged_count > 0:
                logger.info(
                    f"Merged {merged_count} fallback configurations from base configs"
                )

            logger.info(
                f"LLM configuration enhancement completed successfully in {enhancement_time:.2f}s"
            )
            return enhanced_configs

        except Exception as e:
            enhancement_time = time.time() - enhancement_start
            logger.error(
                f"Error during LLM enhancement after {enhancement_time:.2f}s: {e}",
                exc_info=True,
            )
            # Fall back to base configurations
            logger.info(
                "Falling back to base configurations due to LLM enhancement failure"
            )
            return base_configs

    def _generate_cache_key(
        self, repository_name: str, branch: str, config_types: List[str]
    ) -> str:
        """Generate cache key for configurations."""
        config_types_str = "_".join(sorted(config_types))
        return f"configs:{repository_name}:{branch}:{config_types_str}"
