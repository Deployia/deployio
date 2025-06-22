"""
Main Detection Engine - Orchestrates all analysis operations
Clean, modular, and highly accurate detection system
"""

import asyncio
import logging
import time
from typing import Dict, List
from urllib.parse import urlparse

from .models import (
    AnalysisResult,
    AnalysisType,
    TechnologyStack,
    ConfidenceLevel,
    calculate_weighted_confidence,
)
from ..analyzers.stack_analyzer import StackAnalyzer
from ..analyzers.dependency_analyzer import DependencyAnalyzer
from ..analyzers.code_analyzer import CodeAnalyzer
from ..enhancers.llm_enhancer import LLMEnhancer
from ..utils.github_client import GitHubClient
from ..utils.cache_manager import CacheManager

logger = logging.getLogger(__name__)


class UnifiedDetectionEngine:
    """
    Main detection engine that orchestrates all analysis operations.

    Features:
    - Unified analysis workflow
    - Smart LLM enhancement
    - Confidence-based decision making
    - Comprehensive caching
    - Modular architecture
    """

    def __init__(self):
        # Initialize all analyzers
        self.stack_analyzer = StackAnalyzer()
        self.dependency_analyzer = DependencyAnalyzer()
        self.code_analyzer = CodeAnalyzer()

        # Initialize enhancers
        self.llm_enhancer = LLMEnhancer()

        # Initialize utilities
        self.github_client = GitHubClient()
        self.cache_manager = CacheManager()

        # Configuration
        self.llm_enhancement_threshold = 0.75  # Use LLM if confidence < 75%
        self.parallel_analysis = True

        logger.info("UnifiedDetectionEngine initialized successfully")

    async def analyze_repository(
        self,
        repository_url: str,
        branch: str = "main",
        analysis_types: List[AnalysisType] = None,
        force_llm: bool = False,
    ) -> AnalysisResult:
        """
        Perform comprehensive repository analysis

        Args:
            repository_url: GitHub repository URL
            branch: Branch to analyze (default: main)
            analysis_types: Types of analysis to perform (default: all)
            force_llm: Force LLM enhancement regardless of confidence

        Returns:
            AnalysisResult: Comprehensive analysis results
        """
        start_time = time.time()

        # Default analysis types
        if analysis_types is None:
            analysis_types = [
                AnalysisType.STACK_DETECTION,
                AnalysisType.DEPENDENCY_ANALYSIS,
                AnalysisType.CODE_QUALITY,
            ]

        logger.info(f"Starting analysis for {repository_url} (branch: {branch})")

        try:
            # Step 1: Check cache
            cache_key = self._generate_cache_key(repository_url, branch, analysis_types)
            cached_result = await self.cache_manager.get(cache_key)

            if cached_result and not force_llm:
                # Only return if it's a valid AnalysisResult
                from engines.core.models import AnalysisResult

                if isinstance(cached_result, AnalysisResult):
                    logger.info("Returning cached analysis result")
                    return cached_result
                else:
                    logger.warning(
                        "Cached result is invalid, ignoring and recomputing."
                    )

            # Step 2: Fetch repository data
            repo_data = await self.github_client.fetch_repository_data(
                repository_url, branch
            )

            # Step 3: Perform parallel analysis
            analysis_results = await self._perform_parallel_analysis(
                repo_data, analysis_types
            )

            # Step 4: Combine results
            combined_result = await self._combine_analysis_results(
                repository_url, branch, analysis_results, repo_data
            )

            # Step 5: LLM enhancement (if needed)
            if (
                combined_result.confidence_score < self.llm_enhancement_threshold
                or force_llm
            ):
                if self.llm_enhancer.is_available:
                    logger.info("Enhancing analysis with LLM")
                    enhancement = await self.llm_enhancer.enhance_analysis(
                        combined_result, repo_data
                    )
                    # Merge enhancement into combined_result (AnalysisResult)
                    combined_result.technology_stack = enhancement.enhanced_stack
                    combined_result.confidence_score = min(
                        combined_result.confidence_score + enhancement.confidence_boost,
                        1.0,
                    )
                    combined_result.llm_used = True
                    combined_result.llm_confidence = enhancement.confidence_boost
                    combined_result.llm_reasoning = enhancement.reasoning
                    combined_result.recommendations.extend(enhancement.recommendations)
                    combined_result.suggestions.extend(enhancement.additional_insights)
                else:
                    logger.warning(
                        f"FALLBACK TRIGGERED: LLM enhancement requested but not available for {repository_url}"
                    )
                    logger.error(
                        f"ENGINE FALLBACK: LLM enhancer unavailable - confidence: {combined_result.confidence_score:.2f}, threshold: {self.llm_enhancement_threshold}"
                    )

            # Step 6: Final processing
            combined_result.processing_time = time.time() - start_time

            # Step 7: Cache result
            await self.cache_manager.set(cache_key, combined_result, ttl=3600)  # 1 hour

            logger.info(
                f"Analysis completed: {combined_result.confidence_level.value} "
                f"confidence ({combined_result.confidence_score:.2f}) "
                f"in {combined_result.processing_time:.2f}s"
            )

            return combined_result

        except Exception as e:
            logger.error(f"Analysis failed for {repository_url}: {e}")
            return await self._create_error_result(repository_url, branch, str(e))

    async def analyze_code_quality_only(
        self, repository_url: str, branch: str = "main"
    ) -> AnalysisResult:
        """
        Perform code quality analysis only
        Lighter weight operation for quick quality checks
        """
        return await self.analyze_repository(
            repository_url, branch, analysis_types=[AnalysisType.CODE_QUALITY]
        )

    async def analyze_stack_only(
        self, repository_url: str, branch: str = "main"
    ) -> AnalysisResult:
        """
        Perform stack detection only
        Fast operation for technology identification
        """
        return await self.analyze_repository(
            repository_url, branch, analysis_types=[AnalysisType.STACK_DETECTION]
        )

    async def _perform_parallel_analysis(
        self, repo_data: Dict, analysis_types: List[AnalysisType]
    ) -> Dict[AnalysisType, Dict]:
        """
        Perform analysis operations in parallel for better performance
        """
        tasks = {}

        # Create analysis tasks
        if AnalysisType.STACK_DETECTION in analysis_types:
            tasks[AnalysisType.STACK_DETECTION] = self.stack_analyzer.analyze(repo_data)

        if AnalysisType.DEPENDENCY_ANALYSIS in analysis_types:
            tasks[AnalysisType.DEPENDENCY_ANALYSIS] = self.dependency_analyzer.analyze(
                repo_data
            )

        if AnalysisType.CODE_QUALITY in analysis_types:
            tasks[AnalysisType.CODE_QUALITY] = self.code_analyzer.analyze(repo_data)

        # Execute tasks in parallel
        if self.parallel_analysis and len(tasks) > 1:
            logger.info(f"Running {len(tasks)} analysis tasks in parallel")
            results = await asyncio.gather(*tasks.values(), return_exceptions=True)

            # Map results back to analysis types
            analysis_results = {}
            for i, analysis_type in enumerate(tasks.keys()):
                if isinstance(results[i], Exception):
                    logger.error(f"{analysis_type.value} analysis failed: {results[i]}")
                    analysis_results[analysis_type] = {"error": str(results[i])}
                else:
                    analysis_results[analysis_type] = results[i]
        else:
            # Sequential execution
            logger.info("Running analysis tasks sequentially")
            analysis_results = {}
            for analysis_type, task in tasks.items():
                try:
                    analysis_results[analysis_type] = await task
                except Exception as e:
                    logger.error(f"{analysis_type.value} analysis failed: {e}")
                    analysis_results[analysis_type] = {"error": str(e)}

        return analysis_results

    async def _combine_analysis_results(
        self,
        repository_url: str,
        branch: str,
        analysis_results: Dict[AnalysisType, Dict],
        repo_data: Dict,
    ) -> AnalysisResult:
        """
        Combine results from different analyzers into a unified result
        """
        # Extract stack detection results
        stack_result = analysis_results.get(AnalysisType.STACK_DETECTION, {})
        dependency_result = analysis_results.get(AnalysisType.DEPENDENCY_ANALYSIS, {})
        code_quality_result = analysis_results.get(AnalysisType.CODE_QUALITY, {})

        # Create technology stack from stack analyzer
        if "error" not in stack_result:
            technology_stack = TechnologyStack(
                language=stack_result.get("language"),
                framework=stack_result.get("framework"),
                database=stack_result.get("database"),
                build_tool=stack_result.get("build_tool"),
                package_manager=stack_result.get("package_manager"),
                runtime_version=stack_result.get("runtime_version"),
                additional_technologies=stack_result.get("additional_technologies", []),
                architecture_pattern=stack_result.get("architecture_pattern"),
                deployment_strategy=stack_result.get("deployment_strategy"),
            )
        else:
            technology_stack = TechnologyStack()

        # Calculate overall confidence
        confidence_scores = []
        confidence_weights = []

        if "error" not in stack_result:
            confidence_scores.append(stack_result.get("confidence", 0.0))
            confidence_weights.append(0.5)  # Stack detection is most important

        if "error" not in dependency_result:
            confidence_scores.append(dependency_result.get("confidence", 0.0))
            confidence_weights.append(0.3)  # Dependencies are important

        if "error" not in code_quality_result:
            confidence_scores.append(code_quality_result.get("confidence", 0.0))
            confidence_weights.append(0.2)  # Code quality is supplementary

        overall_confidence = calculate_weighted_confidence(
            confidence_scores, confidence_weights
        )

        # Combine detected files
        detected_files = []
        for result in analysis_results.values():
            if "detected_files" in result and "error" not in result:
                detected_files.extend(result["detected_files"])

        # Remove duplicates while preserving order
        detected_files = list(dict.fromkeys(detected_files))

        # Combine recommendations
        recommendations = []
        for result in analysis_results.values():
            if "recommendations" in result and "error" not in result:
                recommendations.extend(result["recommendations"])

        # Combine suggestions
        suggestions = []
        for result in analysis_results.values():
            if "suggestions" in result and "error" not in result:
                suggestions.extend(result["suggestions"])

        # Create detailed analysis
        detailed_analysis = {
            "stack_detection": stack_result,
            "dependency_analysis": dependency_result,
            "code_quality": code_quality_result,
            "repository_stats": {
                "total_files": repo_data.get("total_files", 0),
                "analyzed_files": len(detected_files),
                "file_types": repo_data.get("file_types", {}),
            },
        }

        # Determine analysis approach
        analysis_approach = "rule_based"
        if any("llm_enhanced" in str(result) for result in analysis_results.values()):
            analysis_approach = "llm_enhanced"

        return AnalysisResult(
            repository_url=repository_url,
            branch=branch,
            analysis_type=AnalysisType.STACK_DETECTION,  # Primary type
            technology_stack=technology_stack,
            confidence_score=overall_confidence,
            confidence_level=ConfidenceLevel.MEDIUM,  # Will be auto-calculated
            detected_files=detected_files[:50],  # Limit for response size
            analysis_approach=analysis_approach,
            processing_time=0.0,  # Will be set by caller
            detailed_analysis=detailed_analysis,
            recommendations=recommendations,
            suggestions=suggestions,
            quality_metrics=code_quality_result.get("metrics"),
            security_metrics=dependency_result.get("security_metrics"),
            performance_metrics=code_quality_result.get("performance_metrics"),
        )

    async def _create_error_result(
        self, repository_url: str, branch: str, error_message: str
    ) -> AnalysisResult:
        """
        Create error result when analysis fails
        """
        return AnalysisResult(
            repository_url=repository_url,
            branch=branch,
            analysis_type=AnalysisType.STACK_DETECTION,
            technology_stack=TechnologyStack(),
            confidence_score=0.0,
            confidence_level=ConfidenceLevel.VERY_LOW,
            detected_files=[],
            analysis_approach="error",
            processing_time=0.0,
            detailed_analysis={"error": error_message},
            recommendations=[],
            suggestions=[f"Analysis failed: {error_message}"],
        )

    def _generate_cache_key(
        self, repository_url: str, branch: str, analysis_types: List[AnalysisType]
    ) -> str:
        """
        Generate cache key for analysis results
        """
        parsed_url = urlparse(repository_url)
        repo_path = parsed_url.path.strip("/")

        analysis_type_str = "-".join(sorted([at.value for at in analysis_types]))

        return f"analysis:{repo_path}:{branch}:{analysis_type_str}"

    async def get_supported_technologies(self) -> Dict[str, List[str]]:
        """
        Get list of supported technologies across all analyzers
        """
        return {
            "languages": await self.stack_analyzer.get_supported_languages(),
            "frameworks": await self.stack_analyzer.get_supported_frameworks(),
            "databases": await self.stack_analyzer.get_supported_databases(),
            "build_tools": await self.stack_analyzer.get_supported_build_tools(),
            "ecosystems": await self.dependency_analyzer.get_supported_ecosystems(),
        }

    async def health_check(self) -> Dict[str, str]:
        """
        Perform health check on all components
        """
        health_status = {
            "engine": "healthy",
            "stack_analyzer": "healthy",
            "dependency_analyzer": "healthy",
            "code_analyzer": "healthy",
            "llm_enhancer": (
                "healthy" if self.llm_enhancer.is_available else "unavailable"
            ),
            "github_client": "healthy",
            "cache_manager": "healthy",
        }

        # Test each component
        try:
            await self.github_client.test_connection()
        except Exception as e:
            health_status["github_client"] = f"error: {str(e)}"

        try:
            await self.cache_manager.test_connection()
        except Exception as e:
            health_status["cache_manager"] = f"error: {str(e)}"

        return health_status
