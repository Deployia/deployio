"""
LLM Enhancement Orchestrator

Orchestrates modular enhancement system using specialized enhancers.
Coordinates between AnalyzerEnhancer, GeneratorEnhancer, and manages the overall enhancement flow.
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional

from models.analysis_models import AnalysisResult
from .analyzer_enhancer import AnalyzerEnhancer
from .generator_enhancer import GeneratorEnhancer
from engines.llm.shared_client_manager import shared_llm_client_manager

logger = logging.getLogger(__name__)


class LLMEnhancer:
    """
    Orchestrator for modular LLM enhancement system.

    Coordinates between specialized enhancers:
    - AnalyzerEnhancer: For analysis improvements
    - GeneratorEnhancer: For configuration generation
    """

    def __init__(self, client_manager=None):
        from config.settings import Settings

        self.settings = Settings()
        self.client_manager = client_manager or shared_llm_client_manager
        self.analyzer_enhancer = AnalyzerEnhancer(client_manager=self.client_manager)
        self.generator_enhancer = GeneratorEnhancer(client_manager=self.client_manager)
        logger.info("LLMEnhancer orchestrator initialized with modular enhancers")

        # --- CACHE DISABLED FOR ENGINE DEBUGGING ---
        from ..utils.cache_manager import CacheManager

        self.cache_manager = CacheManager()
        # --- END CACHE DISABLED ---

    async def async_init(self):
        """Async initialization for LLM clients and health check."""
        try:
            await self.analyzer_enhancer.client_manager.initialize()
            await self.generator_enhancer.client_manager.initialize()
            analyzer_health = await self.analyzer_enhancer.client_manager.health_check()
            generator_health = (
                await self.generator_enhancer.client_manager.health_check()
            )
            logger.info(f"LLMEnhancer: Analyzer LLM health: {analyzer_health}")
            logger.info(f"LLMEnhancer: Generator LLM health: {generator_health}")
            logger.info(
                f"LLMEnhancer: LLM clients initialized. Available providers: {self.analyzer_enhancer.client_manager.get_available_providers()}"
            )
        except Exception as e:
            logger.error(f"LLMEnhancer: Failed to initialize LLM clients: {e}")
        # --- END LLM Client Initialization ---

        # --- CACHE DISABLED FOR ENGINE DEBUGGING ---
        from ..utils.cache_manager import CacheManager

        self.cache_manager = CacheManager()
        # --- END CACHE DISABLED ---

    @property
    def is_available(self) -> bool:
        """Check if any enhancement services are available."""
        return (
            self.analyzer_enhancer.is_available or self.generator_enhancer.is_available
        )

    async def enhance_analysis(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        enhancement_options: Optional[Dict[str, Any]] = None,
    ) -> AnalysisResult:
        """
        Main enhancement orchestration method.

        Args:
            analysis_result: Rule-based analysis results
            repository_data: Repository file contents and metadata
            enhancement_options: Options for controlling enhancement behavior

        Returns:
            Enhanced analysis result with AI-generated insights
        """
        repo_name = analysis_result.repository_name
        start_time = time.time()

        try:
            logger.info(f"Starting LLM enhancement orchestration for {repo_name}")

            if not self.is_available:
                logger.warning("No LLM enhancement services available")
                return analysis_result

            options = enhancement_options or {}
            enhanced_result = analysis_result

            # --- CACHE DISABLED FOR ENGINE DEBUGGING ---
            # # Check cache for existing enhancement
            cache_key = self._generate_cache_key(
                analysis_result, repository_data, options
            )
            cached_result = await self.cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for LLM enhancement: {cache_key}")
                return cached_result
            # --- END CACHE DISABLED ---

            # Determine enhancement strategy based on confidence level
            needs_enhancement = self._needs_enhancement(analysis_result)
            logger.debug(f"Enhancement needed: {needs_enhancement}")

            if needs_enhancement and self.analyzer_enhancer.is_available:
                logger.info(f"Orchestrating analysis enhancements for {repo_name}")

                # Create enhancement task functions (not coroutines yet)
                enhancement_task_funcs = []

                # Technology stack enhancement
                if self._needs_technology_enhancement(analysis_result):
                    logger.debug("Scheduling technology stack enhancement")
                    enhancement_task_funcs.append(
                        self.analyzer_enhancer.enhance_technology_stack
                    )

                # Dependency analysis enhancement
                if self._needs_dependency_enhancement(analysis_result):
                    logger.debug("Scheduling dependency analysis enhancement")
                    enhancement_task_funcs.append(
                        self.analyzer_enhancer.enhance_dependency_analysis
                    )

                # Code quality enhancement
                if self._needs_code_quality_enhancement(analysis_result):
                    logger.debug("Scheduling code quality enhancement")
                    enhancement_task_funcs.append(
                        self.analyzer_enhancer.enhance_code_quality
                    )

                # Execute enhancement tasks
                if enhancement_task_funcs:
                    logger.info(
                        f"Executing {len(enhancement_task_funcs)} enhancement tasks for {repo_name}"
                    )

                    # Run the most important enhancement first, then others
                    primary_enhancement_func = enhancement_task_funcs[0]
                    logger.debug("Running primary enhancement task...")
                    enhanced_result = await primary_enhancement_func(
                        enhanced_result, repository_data
                    )

                    # Run remaining enhancements with updated result
                    if len(enhancement_task_funcs) > 1:
                        logger.debug(
                            f"Running {len(enhancement_task_funcs) - 1} additional enhancement tasks..."
                        )
                        remaining_funcs = enhancement_task_funcs[1:]
                        for func in remaining_funcs:
                            enhanced_result = await func(
                                enhanced_result, repository_data
                            )
                        logger.info(
                            f"Completed {len(remaining_funcs)}/{len(remaining_funcs)} additional enhancement tasks"
                        )

                # Generate comprehensive insights as final step
                if options.get("generate_insights", True):
                    logger.debug("Generating comprehensive insights...")
                    enhanced_result = (
                        await self.analyzer_enhancer.generate_comprehensive_insights(
                            enhanced_result, repository_data
                        )
                    )

            # Update confidence level based on enhancements
            old_confidence = analysis_result.confidence_score
            self._update_confidence_after_enhancement(enhanced_result, analysis_result)
            new_confidence = enhanced_result.confidence_score

            enhancement_time = time.time() - start_time
            logger.info(
                f"LLM enhancement completed for {repo_name} in {enhancement_time:.2f}s - confidence: {old_confidence:.2f} -> {new_confidence:.2f}"
            )

            # --- CACHE DISABLED FOR ENGINE DEBUGGING ---
            # # Cache the enhanced result
            await self.cache_manager.set(cache_key, enhanced_result, ttl=3600)
            # --- END CACHE DISABLED ---

            return enhanced_result

        except Exception as e:
            enhancement_time = time.time() - start_time
            logger.error(
                f"LLM enhancement error for {repo_name} after {enhancement_time:.2f}s: {e}",
                exc_info=True,
            )
            # Return original result on failure
            return analysis_result

    async def generate_configurations(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        generation_options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate deployment configurations using GeneratorEnhancer.

        Args:
            analysis_result: Analysis results
            repository_data: Repository files and metadata
            generation_options: Options for configuration generation

        Returns:
            Dictionary containing generated configurations
        """
        try:
            logger.info("Starting configuration generation with LLM enhancement")

            if not self.generator_enhancer.is_available:
                logger.warning("No LLM generator services available")
                return {"error": "LLM generation service unavailable"}

            options = generation_options or {}

            # Only use supported config types
            generate_dockerfile = options.get("dockerfile", True)
            generate_compose = options.get("docker_compose", True)
            generate_github_actions = options.get("github_actions", True)

            # Create generation tasks
            generation_tasks = []
            config_names = []

            if generate_dockerfile:
                generation_tasks.append(
                    self.generator_enhancer.generate_dockerfile(
                        analysis_result, repository_data, options
                    )
                )
                config_names.append("dockerfile")

            if generate_compose:
                generation_tasks.append(
                    self.generator_enhancer.generate_docker_compose(
                        analysis_result, repository_data, options
                    )
                )
                config_names.append("docker_compose")

            if generate_github_actions:
                generation_tasks.append(
                    self.generator_enhancer.generate_github_actions(
                        analysis_result, repository_data, options
                    )
                )
                config_names.append("github_actions")

            # Execute generation tasks in parallel
            configurations = {}
            if generation_tasks:
                results = await asyncio.gather(
                    *generation_tasks, return_exceptions=True
                )

                # Process successful results
                for name, result in zip(config_names, results):
                    configurations[name] = result

            return configurations

        except Exception as e:
            logger.error(f"Configuration generation error: {e}")
            return {"error": str(e)}

    async def generate_specific_configuration(
        self,
        config_type: str,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a specific type of configuration.

        Args:
            config_type: Type of configuration to generate
            analysis_result: Analysis results
            repository_data: Repository data
            options: Generation options

        Returns:
            Generated configuration
        """
        try:
            logger.info(f"Generating specific configuration: {config_type}")

            if not self.generator_enhancer.is_available:
                logger.warning("No LLM generator services available")
                return {"error": "LLM generation service unavailable"}

            result = {}

            if config_type == "dockerfile":
                result = await self.generator_enhancer.generate_dockerfile(
                    analysis_result, repository_data, options
                )
            elif config_type == "docker_compose":
                result = await self.generator_enhancer.generate_docker_compose(
                    analysis_result, repository_data, options
                )
            elif config_type == "ci_cd_pipeline":
                result = await self.generator_enhancer.generate_ci_cd_pipeline(
                    analysis_result, repository_data, options
                )
            elif config_type == "kubernetes":
                result = await self.generator_enhancer.generate_kubernetes_manifests(
                    analysis_result, repository_data, options
                )
            else:
                logger.warning(f"Unknown configuration type: {config_type}")
                result = {"error": f"Unknown configuration type: {config_type}"}

            return result

        except Exception as e:
            logger.error(f"Specific configuration generation error: {e}")
            return {"error": str(e)}

    def _needs_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Determine if any part of the analysis needs enhancement."""
        return (
            self._needs_technology_enhancement(analysis_result)
            or self._needs_dependency_enhancement(analysis_result)
            or self._needs_code_quality_enhancement(analysis_result)
        )

    def _needs_technology_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Determine if technology stack analysis needs enhancement."""
        tech_stack = getattr(analysis_result, "technology_stack", None)
        if not tech_stack:
            return True
        # If it's a list, check all; if not, check single
        if isinstance(tech_stack, list):
            if any(tech.get("confidence", 1.0) < 0.6 for tech in tech_stack):
                return True
        else:
            if getattr(tech_stack, "confidence", 1.0) < 0.6:
                return True
        if getattr(analysis_result, "confidence_score", 1.0) < 0.7:
            return True
        return False

    def _needs_dependency_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Determine if dependency analysis needs enhancement."""
        if not getattr(analysis_result, "dependencies", None):
            return True
        if getattr(analysis_result, "confidence_score", 1.0) < 0.7:
            return True
        if (
            getattr(analysis_result, "dependencies", None)
            and "unknown_dependencies" in analysis_result.dependencies
        ):
            if analysis_result.dependencies.get("unknown_dependencies", 0) > 0:
                return True
        return False

    def _needs_code_quality_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Determine if code quality analysis needs enhancement."""
        # Use code_analysis, not code_quality
        code_analysis = getattr(analysis_result, "code_analysis", None)
        if not code_analysis:
            return True
        # Use confidence_score for code_analysis if available
        if (
            hasattr(code_analysis, "quality_score")
            and code_analysis.quality_score < 0.6
        ):
            return True
        if getattr(analysis_result, "confidence_score", 1.0) < 0.6:
            return True
        return False

    def _update_confidence_after_enhancement(
        self, enhanced_result: AnalysisResult, original_result: AnalysisResult
    ):
        """Update confidence score after enhancement (single float, not dict)."""
        # If any of the main sections were enhanced, bump the confidence
        enhanced = False
        if enhanced_result.technology_stack != original_result.technology_stack:
            enhanced = True
        if enhanced_result.dependency_analysis != original_result.dependency_analysis:
            enhanced = True
        if enhanced_result.code_analysis != original_result.code_analysis:
            enhanced = True
        if enhanced:
            enhanced_result.confidence_score = min(
                0.95, getattr(enhanced_result, "confidence_score", 0.0) + 0.15
            )
        # else, leave as is
        return

    async def health_check(self) -> Dict[str, Any]:
        """Check the health of LLM enhancement services."""
        analyzer_health = {"status": "unavailable"}
        generator_health = {"status": "unavailable"}

        try:
            if self.analyzer_enhancer.is_available:
                analyzer_health = {
                    "status": "available",
                    "providers": self.analyzer_enhancer.client_manager.get_available_providers(),
                }
        except Exception as e:
            analyzer_health["error"] = str(e)

        try:
            if self.generator_enhancer.is_available:
                generator_health = {
                    "status": "available",
                    "providers": self.generator_enhancer.client_manager.get_available_providers(),
                }
        except Exception as e:
            generator_health["error"] = str(e)

        return {
            "analyzer_enhancer": analyzer_health,
            "generator_enhancer": generator_health,
            "overall_status": "available" if self.is_available else "unavailable",
        }

    def _generate_cache_key(self, analysis_result, repository_data, options=None):
        """Generate a cache key for LLM enhancement results."""
        repo_name = getattr(
            analysis_result, "repository_name", None
        ) or repository_data.get("repository", {}).get("name", "unknown")
        branch = getattr(analysis_result, "branch", None) or repository_data.get(
            "branch", "main"
        )
        enhancement_flags = ""
        if options:
            enhancement_flags = str(
                sorted(
                    (k, v)
                    for k, v in options.items()
                    if k.startswith("include_") or k.startswith("force_")
                )
            )
        return f"llm_enhance:{repo_name}:{branch}:{enhancement_flags}"
