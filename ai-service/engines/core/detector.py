"""
Unified Detector - Main Analysis Orchestrator
Clean, focused orchestration of the analysis pipeline
"""

import logging
import time
from typing import Dict, List, Any, Optional

from models.analysis_models import AnalysisResult, AnalysisRequest, AnalysisType
from models.common_models import get_confidence_level
from ..analyzers.stack_analyzer import StackAnalyzer
from ..analyzers.dependency_analyzer import DependencyAnalyzer
from ..analyzers.code_analyzer import CodeAnalyzer
from ..enhancers.llm_enhancer import LLMEnhancer
from engines.llm.shared_client_manager import shared_llm_client_manager
from engines.utils.result_processor import AnalysisResultProcessor

# --- CACHE DISABLED FOR ENGINE DEBUGGING ---
# from ..utils.cache_manager import CacheManager
from .generator import UnifiedGenerator

logger = logging.getLogger(__name__)


class UnifiedDetector:
    """
    Main analysis orchestrator - coordinates rule-based analysis and LLM enhancement

    Flow:
    1. Rule-based analysis (Stack, Dependencies, Code)
    2. Confidence evaluation
    3. LLM enhancement (if needed)
    4. Result compilation
    """

    def __init__(self):
        # Initialize analyzers (rule-based only)
        self.stack_analyzer = StackAnalyzer()
        self.dependency_analyzer = DependencyAnalyzer()
        self.code_analyzer = CodeAnalyzer()

        # Initialize enhancer
        self.llm_enhancer = LLMEnhancer(client_manager=shared_llm_client_manager)

        # Initialize generator for configuration generation
        self.generator = UnifiedGenerator()

        # Initialize cache
        # --- CACHE DISABLED FOR ENGINE DEBUGGING ---
        # self.cache_manager = CacheManager()

        logger.info("UnifiedDetector initialized with clean architecture")

    async def analyze_repository(
        self,
        request: AnalysisRequest,
        generate_configs: bool = False,
        progress_callback: Optional[callable] = None,
    ) -> Dict[str, Any]:
        """
        Unified repository analysis with optional configuration generation

        Args:
            request: Analysis request with repository data and options
            generate_configs: Whether to generate configurations after analysis
            progress_callback: Optional callback for progress updates

        Returns:
            Dict containing analysis results and optionally configurations
        """
        start_time = time.time()

        repository_data = request.repository_data
        repo_name = repository_data.get("repository", {}).get("name", "unknown")

        logger.info(f"Starting unified analysis for repository: {repo_name}")

        try:
            # Step 1: Check cache for analysis
            # cache_key = self._generate_cache_key(request)
            # cached_result = await self.cache_manager.get(cache_key)

            # if cached_result and not request.force_llm_enhancement:
            #     logger.info(f"Cache hit for {repo_name}")
            #     # If we have cached analysis but need configs, generate them
            #     if generate_configs and "configurations" not in cached_result:
            #         if progress_callback:
            #             await progress_callback(
            #                 50, "Generating configurations from cached analysis"
            #             )

            #         config_types = getattr(
            #             request,
            #             "config_types",
            #             ["dockerfile", "docker_compose", "github_actions"],
            #         )
            #         configs = await self.generator.generate_configurations(
            #             cached_result.get("analysis", cached_result),
            #             repository_data,
            #             config_types,
            #             request.options,
            #         )

            #         return {
            #             "analysis": cached_result.get("analysis", cached_result),
            #             "configurations": configs,
            #         }
            #     return cached_result

            if progress_callback:
                await progress_callback(10, "Initializing analysis")

            # Step 2: Initialize result
            result = AnalysisResult(
                repository_name=repo_name,
                repository_url=repository_data.get("repository_url", ""),
                branch=repository_data.get("metadata", {}).get("branch", "main"),
                session_id=request.session_id,
                analysis_types=request.analysis_types,
            )

            if progress_callback:
                await progress_callback(20, "Performing rule-based analysis")

            # Step 3: Rule-based analysis
            await self._perform_rule_based_analysis(
                result, repository_data, request.analysis_types
            )

            if progress_callback:
                await progress_callback(40, "Calculating confidence scores")

            # Step 4: Calculate confidence
            confidence_score = self._calculate_overall_confidence(result)
            result.confidence_score = confidence_score
            result.confidence_level = get_confidence_level(confidence_score)

            # Step 5: LLM enhancement (if needed)
            if self._should_enhance_with_llm(result, request):
                if progress_callback:
                    await progress_callback(
                        50,
                        f"Enhancing analysis with LLM (confidence: {confidence_score:.2f})",
                    )

                logger.info(
                    f"Enhancing {repo_name} with LLM (confidence: {confidence_score:.2f})"
                )
                enhanced_result = await self._enhance_with_llm(
                    result, repository_data, request
                )
                # Ensure the enhanced result is used for downstream steps and returned to the UI
                result = enhanced_result

            if progress_callback:
                await progress_callback(70, "Finalizing analysis results")

            # Step 6: Finalize analysis result
            result.processing_time = time.time() - start_time
            result.completed_at = time.time()

            # Step 7: Generate configurations if requested
            configurations = None
            if generate_configs:
                if progress_callback:
                    await progress_callback(80, "Generating deployment configurations")

                config_types = getattr(
                    request,
                    "config_types",
                    ["dockerfile", "docker_compose", "github_actions"],
                )
                logger.info(
                    f"Generating configurations for {repo_name}: {config_types}"
                )

                configurations = await self.generator.generate_configurations(
                    result, repository_data, config_types, request.options
                )

            if progress_callback:
                await progress_callback(95, "Caching results")

            # Step 8: Cache the unified result
            unified_result = {"analysis": result, "configurations": configurations}

            # await self.cache_manager.set(cache_key, unified_result, ttl=3600)

            if progress_callback:
                await progress_callback(100, "Analysis completed successfully")

            logger.info(
                f"Analysis completed for {repo_name} in {time.time() - start_time:.2f}s"
            )

            return unified_result

        except Exception as e:
            logger.error(f"Analysis failed for {repo_name}: {str(e)}", exc_info=True)

            # Return partial result with error
            error_result = {
                "analysis": {
                    "error_message": str(e),
                    "processing_time": time.time() - start_time,
                    "repository_name": repo_name,
                },
                "configurations": None,
            }

            if progress_callback:
                await progress_callback(100, f"Analysis failed: {str(e)}")

            return error_result

    async def _perform_rule_based_analysis(
        self,
        result: AnalysisResult,
        repository_data: Dict[str, Any],
        analysis_types: List[AnalysisType],
    ):
        """Perform rule-based analysis with all analyzers"""
        logger.info(f"Starting rule-based analysis for {result.repository_name}")
        logger.debug(f"Analysis types requested: {[t.value for t in analysis_types]}")

        # Stack analysis (always performed)
        if AnalysisType.STACK_DETECTION in analysis_types:
            logger.info("Performing stack detection analysis...")
            start_time = time.time()
            stack_result = await self.stack_analyzer.analyze(repository_data)
            analysis_time = time.time() - start_time

            result.technology_stack = stack_result.technology_stack
            result.build_configuration = stack_result.build_configuration
            result.deployment_configuration = stack_result.deployment_configuration

            # Add insights from stack analysis
            insights_added = 0
            for insight in stack_result.insights:
                result.add_insight(insight)
                insights_added += 1

            logger.info(
                f"Stack analysis completed in {analysis_time:.2f}s - detected {stack_result.technology_stack.language or 'unknown'} language, {insights_added} insights"
            )

        # Dependency analysis
        if AnalysisType.DEPENDENCY_ANALYSIS in analysis_types:
            logger.info("Performing dependency analysis...")
            start_time = time.time()
            dependency_result = await self.dependency_analyzer.analyze(repository_data)
            analysis_time = time.time() - start_time

            result.dependency_analysis = dependency_result.dependency_analysis

            # Add insights from dependency analysis
            insights_added = 0
            for insight in dependency_result.insights:
                result.add_insight(insight)
                insights_added += 1

            deps_count = (
                len(dependency_result.dependency_analysis.dependencies)
                if dependency_result.dependency_analysis
                else 0
            )
            logger.info(
                f"Dependency analysis completed in {analysis_time:.2f}s - found {deps_count} dependencies, {insights_added} insights"
            )

        # Code analysis
        if AnalysisType.CODE_ANALYSIS in analysis_types:
            logger.info("Performing code quality analysis...")
            start_time = time.time()
            code_result = await self.code_analyzer.analyze(repository_data)
            analysis_time = time.time() - start_time

            result.code_analysis = code_result.code_analysis

            # Add insights from code analysis
            insights_added = 0
            for insight in code_result.insights:
                result.add_insight(insight)
                insights_added += 1

            logger.info(
                f"Code analysis completed in {analysis_time:.2f}s - {insights_added} insights added"
            )

        result.analysis_approach = "rule_based"
        total_insights = len(result.insights)
        logger.info(
            f"Rule-based analysis completed for {result.repository_name} - total insights: {total_insights}"
        )

    def _calculate_overall_confidence(self, result: AnalysisResult) -> float:
        """Calculate overall confidence score from all analysis components"""
        logger.debug(f"Calculating confidence for {result.repository_name}")
        confidences = []

        # Technology stack confidence
        if result.technology_stack and result.technology_stack.confidence > 0:
            confidences.append(result.technology_stack.confidence)
            logger.debug(
                f"Technology stack confidence: {result.technology_stack.confidence:.2f}"
            )

        # Dependency analysis confidence (if available)
        if result.dependency_analysis and result.dependency_analysis.health_score > 0:
            confidences.append(result.dependency_analysis.health_score)
            logger.debug(
                f"Dependency health score: {result.dependency_analysis.health_score:.2f}"
            )

        # Code analysis confidence (if available)
        if result.code_analysis and result.code_analysis.quality_score > 0:
            confidences.append(result.code_analysis.quality_score)
            logger.debug(
                f"Code quality score: {result.code_analysis.quality_score:.2f}"
            )

        # Calculate weighted average - deliberately conservative to trigger LLM enhancement
        if confidences:
            # Use weighted average but cap at 0.8 to ensure LLM enhancement
            raw_confidence = sum(confidences) / len(confidences)
            # Apply penalty to ensure LLM enhancement is triggered
            overall_confidence = min(0.8, raw_confidence * 0.85)
            logger.info(
                f"Overall confidence calculated: {overall_confidence:.2f} (from {len(confidences)} components, raw: {raw_confidence:.2f})"
            )
            return overall_confidence
        else:
            logger.warning(
                "No confidence scores available, using default low confidence"
            )
            return 0.3  # Low confidence if no analysis succeeded

    def _should_enhance_with_llm(
        self, result: AnalysisResult, request: AnalysisRequest
    ) -> bool:
        """Determine if LLM enhancement is needed - aggressive LLM usage for better results"""
        logger.debug(f"Evaluating LLM enhancement for {result.repository_name}")
        logger.debug(f"Current confidence: {result.confidence_score:.2f}")
        logger.debug(f"Current insights count: {len(result.insights)}")
        logger.debug(f"Current recommendations count: {len(result.recommendations)}")

        # Force enhancement if requested
        if request.force_llm_enhancement:
            logger.info("LLM enhancement forced by request")
            return True

        # Be aggressive about LLM usage - enhance for confidence < 0.95 (almost always)
        if result.confidence_score < 0.95:
            logger.info(
                f"LLM enhancement triggered by confidence below 95%: {result.confidence_score:.2f} < 0.95"
            )
            return True

        # Enhance if reasoning/insights are requested and insufficient
        if request.include_insights and len(result.insights) < 5:
            logger.info(
                f"LLM enhancement triggered by insufficient insights: {len(result.insights)} < 5"
            )
            return True

        # Enhance if recommendations are requested and insufficient
        if request.include_recommendations and len(result.recommendations) < 3:
            logger.info(
                f"LLM enhancement triggered by insufficient recommendations: {len(result.recommendations)} < 3"
            )
            return True

        # Always enhance if it's for configuration generation
        if request.generate_configs:
            logger.info("LLM enhancement triggered for configuration generation")
            return True

        logger.info("LLM enhancement not needed - analysis meets high standards")
        return False

    async def _enhance_with_llm(
        self,
        result: AnalysisResult,
        repository_data: Dict[str, Any],
        request: AnalysisRequest,
    ):
        """Enhance analysis result with LLM and merge with rule-based analysis for completeness."""
        logger.info(f"Starting LLM enhancement for {result.repository_name}")
        start_time = time.time()

        try:
            logger.debug("Calling LLM enhancer...")
            enhanced_result = await self.llm_enhancer.enhance_analysis(
                result, repository_data, request.options
            )

            enhancement_time = time.time() - start_time
            logger.info(f"LLM enhancement completed in {enhancement_time:.2f}s")

            # Merge LLM and rule-based results for completeness
            merged_result = AnalysisResultProcessor.merge_llm_and_rule_based(
                enhanced_result, result
            )
            merged_result.llm_enhanced = True
            merged_result.analysis_approach = "llm_enhanced"
            merged_result.processing_time = result.processing_time + enhancement_time

            # Use merged result if confidence is improved or equal, else fallback
            if merged_result.confidence_score >= result.confidence_score:
                logger.info(
                    f"LLM enhancement (merged) used: confidence {merged_result.confidence_score:.2f} >= {result.confidence_score:.2f}"
                )
                return merged_result
            else:
                logger.warning(
                    "LLM enhancement did not improve confidence, keeping rule-based result"
                )
                result.llm_enhanced = False
                result.analysis_approach = "rule_based_fallback"
                return result
        except Exception as e:
            enhancement_time = time.time() - start_time
            logger.error(
                f"LLM enhancement failed for {result.repository_name} after {enhancement_time:.2f}s: {str(e)}",
                exc_info=True,
            )
            result.add_warning(f"LLM enhancement failed: {str(e)}")
            result.llm_enhanced = False
            result.analysis_approach = "rule_based_fallback"
            return result

    def _generate_cache_key(self, request: AnalysisRequest) -> str:
        """Generate cache key for request"""
        repo_data = request.repository_data
        repo_id = repo_data.get("repository", {}).get("full_name", "unknown")
        branch = repo_data.get("metadata", {}).get("branch", "main")
        analysis_types = "_".join([t.value for t in request.analysis_types])

        return f"analysis_v2:{repo_id}:{branch}:{analysis_types}"
