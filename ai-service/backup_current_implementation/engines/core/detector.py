"""
Main Detection Engine - Orchestrates all analysis operations
Clean, modular, and highly accurate detection system
"""

import logging
import time
from typing import Dict, List, Any

from .models import (
    AnalysisResult,
    AnalysisType,
    TechnologyStack,
    ConfidenceLevel,
    calculate_weighted_confidence,
    get_confidence_level,
)
from ..analyzers.stack_analyzer import StackAnalyzer
from ..analyzers.dependency_analyzer import DependencyAnalyzer
from ..analyzers.code_analyzer import CodeAnalyzer
from ..enhancers.llm_enhancer import LLMEnhancer
from ..utils.cache_manager import CacheManager
from ..analyzers.base_analyzer import BaseAnalyzer
from exceptions import AnalysisException

logger = logging.getLogger(__name__)


class UnifiedDetectionEngine:
    """
    Main detection engine that orchestrates all analysis operations.
    Works with repository data from server (no direct API calls)

    Features:
    - Unified analysis workflow using repository data
    - Smart LLM enhancement
    - Confidence-based decision making
    - Comprehensive caching
    - Modular architecture
    """

    def __init__(self):
        # Initialize all analyzers as BaseAnalyzer
        self.stack_analyzer: BaseAnalyzer = StackAnalyzer()
        self.dependency_analyzer: BaseAnalyzer = DependencyAnalyzer()
        self.code_analyzer: BaseAnalyzer = CodeAnalyzer()
        self.llm_enhancer = LLMEnhancer()
        self.cache_manager = CacheManager()

        logger.info("UnifiedDetectionEngine initialized for repository data analysis")

    async def analyze_repository(
        self,
        repository_data: Dict[str, Any],
        analysis_types: List[AnalysisType] = None,
        force_llm: bool = False,
    ) -> AnalysisResult:
        """
        Perform comprehensive analysis using repository data from server

        Args:
            repository_data: Repository data from server (files, structure, metadata)
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

        repository_name = repository_data.get("repository", {}).get("name", "unknown")
        logger.info(f"Starting repository analysis for {repository_name}")

        try:
            # Step 1: Check cache based on repository metadata
            cache_key = self._generate_cache_key_from_data(
                repository_data, analysis_types
            )
            cached_result = await self.cache_manager.get(cache_key)

            if cached_result and not force_llm:
                from engines.core.models import AnalysisResult

                if isinstance(cached_result, AnalysisResult):
                    logger.info("Returning cached analysis result")
                    return cached_result

            # Step 2: Perform parallel analysis using repository data
            analysis_results = await self._perform_parallel_analysis(
                repository_data, analysis_types
            )

            # Step 3: Combine rule-based analyzer results
            combined_result = await self._combine_analysis_results(
                repository_data, analysis_results
            )

            # Step 4: Run LLM enhancer for insights/recommendations/suggestions
            logger.info(
                "Running LLM enhancer for insights, recommendations, and suggestions"
            )

            enhancement = await self.llm_enhancer.enhance_analysis(
                combined_result, repository_data
            )

            if enhancement and enhancement.llm_enhanced:
                # Use LLM-enhanced stack and fields if available
                logger.info(
                    f"Using LLM technology stack (confidence improvement: {enhancement.confidence_improvement:.2f})"
                )
                if enhancement.enhanced_stack:
                    combined_result.technology_stack = enhancement.enhanced_stack
                    # Update confidence with improvement
                    combined_result.confidence_score = min(
                        1.0,
                        combined_result.confidence_score
                        + enhancement.confidence_improvement,
                    )

                combined_result.llm_used = True
                combined_result.analysis_approach = "llm_enhanced"
                combined_result.recommendations = enhancement.recommendations
                combined_result.suggestions = enhancement.suggestions
                combined_result.llm_reasoning = enhancement.reasoning
                combined_result.llm_confidence = combined_result.confidence_score
                combined_result.insights = enhancement.insights
                combined_result.llm_provider = enhancement.llm_provider

            # Step 5: Cache the result
            await self.cache_manager.set(cache_key, combined_result)

            # Update timing
            combined_result.processing_time = time.time() - start_time

            logger.info(
                f"Analysis completed for {repository_name} "
                f"(confidence: {combined_result.confidence_score:.2f}, "
                f"time: {combined_result.processing_time:.2f}s)"
            )

            return combined_result

        except Exception as e:
            logger.error(f"Analysis failed for {repository_name}: {e}")
            # Convert generic errors to analysis exceptions
            raise AnalysisException(
                f"Analysis failed for {repository_name}: {str(e)}", 500
            )

    async def analyze_code_quality_only(
        self, repository_data: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Perform code quality analysis only
        Lighter weight operation for quick quality checks
        """
        return await self.analyze_repository(
            repository_data, analysis_types=[AnalysisType.CODE_QUALITY]
        )

    async def analyze_stack_only(
        self, repository_data: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Perform stack detection only
        Fast operation for technology identification
        """
        return await self.analyze_repository(
            repository_data, analysis_types=[AnalysisType.STACK_DETECTION]
        )

    async def detect_technology_stack(
        self,
        repository_data: Dict[str, Any],
        analysis_type: AnalysisType = AnalysisType.STACK_DETECTION,
    ) -> AnalysisResult:
        """
        Main entry point for technology stack detection
        Alias for analyze_repository with stack detection focus
        """
        return await self.analyze_repository(
            repository_data=repository_data, analysis_types=[analysis_type]
        )

    async def _perform_parallel_analysis(
        self, repository_data: Dict[str, Any], analysis_types: List[AnalysisType]
    ) -> Dict[str, Any]:
        """
        Perform parallel analysis using repository data
        """
        results = {}

        # Run different analyzers based on analysis types
        if AnalysisType.STACK_DETECTION in analysis_types:
            results["stack"] = await self.stack_analyzer.analyze_repository(
                repository_data
            )

        if AnalysisType.DEPENDENCY_ANALYSIS in analysis_types:
            results["dependencies"] = await self.dependency_analyzer.analyze_repository(
                repository_data
            )

        if AnalysisType.CODE_QUALITY in analysis_types:
            results["code_quality"] = await self.code_analyzer.analyze_repository(
                repository_data
            )

        return results

    async def _combine_analysis_results(
        self,
        repository_data: Dict[str, Any],
        analysis_results: Dict[str, Any],
    ) -> AnalysisResult:
        """
        Combine results from multiple analyzers into a unified AnalysisResult
        """
        # Get basic repository info
        repo_info = repository_data.get("repository", {})
        repo_metadata = repository_data.get("metadata", {})
        repository_url = repo_info.get("url", "")
        repository_name = repo_metadata.get(
            "full_name", repo_info.get("name", "unknown")
        )
        branch = repo_info.get("branch", "main")

        # Extract stack analysis
        stack_result = analysis_results.get("stack", {})
        stack_dict = stack_result.get("technology_stack", {})

        # Convert stack dictionary to TechnologyStack object
        if stack_dict and isinstance(stack_dict, dict):
            detected_technologies = stack_dict.get("detected_technologies", [])
            primary_tech = detected_technologies[0] if detected_technologies else {}

            technology_stack = TechnologyStack(
                language=stack_dict.get("primary_language")
                or primary_tech.get("language"),
                framework=stack_dict.get("framework")
                or (
                    primary_tech.get("name")
                    if primary_tech.get("type") == "framework"
                    else None
                ),
                version=stack_dict.get("version") or primary_tech.get("version"),
                confidence=primary_tech.get("confidence", 0.0),
                detection_method=primary_tech.get("detection_method", "rule_based"),
                additional_technologies=[
                    tech.get("name", "") for tech in detected_technologies[1:]
                ],
                build_tool=(
                    stack_dict.get("build_tools", [None])[0]
                    if stack_dict.get("build_tools")
                    else None
                ),
                package_manager=(
                    stack_dict.get("package_managers", [None])[0]
                    if stack_dict.get("package_managers")
                    else None
                ),
                architecture_pattern=stack_dict.get("architecture_pattern"),
                deployment_strategy=(
                    stack_dict.get("deployment_suggestions", [None])[0]
                    if stack_dict.get("deployment_suggestions")
                    else None
                ),
            )
        else:
            technology_stack = TechnologyStack()

        stack_confidence = stack_result.get("confidence_score", 0.0)

        # Extract dependency analysis and convert to unified format
        dependency_result = analysis_results.get("dependencies", {})
        dependency_data = dependency_result.get("dependencies", {})

        dependency_analysis = None
        if dependency_data:
            from .models import DependencyAnalysis

            # Convert dependency data to structured format
            vulnerable_packages = dependency_data.get("vulnerable_packages", [])
            outdated_packages = dependency_data.get("outdated_packages", [])

            dependency_analysis = DependencyAnalysis(
                total_dependencies=dependency_data.get("total_dependencies", 0),
                direct_dependencies=dependency_data.get("direct_dependencies", 0),
                transitive_dependencies=dependency_data.get(
                    "transitive_dependencies", 0
                ),
                package_managers=dependency_data.get("package_managers", []),
                vulnerable_count=len(vulnerable_packages),
                outdated_count=len(outdated_packages),
                health_score=dependency_result.get("dependency_health_score", 0.0),
                confidence_score=dependency_result.get("confidence_score", 0.0),
                security_recommendations=dependency_result.get(
                    "security_recommendations", []
                ),
                optimization_suggestions=dependency_result.get(
                    "optimization_suggestions", []
                ),
            )

        dependency_confidence = dependency_result.get("confidence_score", 0.0)

        # Extract code quality analysis and convert to unified format
        quality_result = analysis_results.get("code_quality", {})
        quality_data = quality_result.get("quality_metrics", {})

        quality_metrics = None
        if quality_data:
            from .models import QualityMetrics

            quality_metrics = QualityMetrics(
                total_files_analyzed=quality_data.get("total_files_analyzed", 0),
                total_lines_of_code=quality_data.get("total_lines_of_code", 0),
                average_complexity=quality_data.get("average_complexity", 0.0),
                quality_score=quality_data.get("quality_score", 0.0),
                code_smells=quality_data.get("code_smells", []),
            )

        quality_confidence = quality_result.get("confidence_score", 0.0)

        # Calculate weighted confidence
        confidence_scores = [
            ("stack", stack_confidence, 0.4),
            ("dependencies", dependency_confidence, 0.3),
            ("quality", quality_confidence, 0.3),
        ]
        # Unpack scores and weights for the helper
        scores = [score for _, score, _ in confidence_scores]
        weights = [weight for _, _, weight in confidence_scores]
        overall_confidence = calculate_weighted_confidence(scores, weights)

        # Create unified result using the new comprehensive model
        result = AnalysisResult(
            repository_url=repository_url,
            repository_name=repository_name,
            branch=branch,
            technology_stack=technology_stack,
            dependency_analysis=dependency_analysis,
            quality_metrics=quality_metrics,
            confidence_score=overall_confidence,
            confidence_level=get_confidence_level(overall_confidence),
            analysis_approach="rule_based",
            llm_used=False,
            processing_time=0.0,  # Will be updated later
            detected_files=stack_result.get("detected_files", []),
            file_tree=repository_data.get("file_tree", []),
            key_files=repository_data.get("key_files", {}),
            detailed_analysis={
                "stack_analysis": stack_result,
                "dependency_analysis": dependency_result,
                "quality_analysis": quality_result,
            },
        )

        return result

    def _generate_cache_key_from_data(
        self, repository_data: Dict[str, Any], analysis_types: List[AnalysisType]
    ) -> str:
        """
        Generate cache key from repository data
        """
        repo_info = repository_data.get("repository", {})
        repo_name = repo_info.get("name", "unknown")
        commit_sha = repo_info.get("latest_commit", "unknown")
        analysis_type_str = "-".join([t.value for t in analysis_types])

        return f"analysis:{repo_name}:{commit_sha}:{analysis_type_str}"

    async def _create_error_result(
        self, repository_data: Dict[str, Any], error: str
    ) -> AnalysisResult:
        """
        Create an error result when analysis fails
        """
        repo_info = repository_data.get("repository", {})
        repo_metadata = repository_data.get("metadata", {})

        return AnalysisResult(
            repository_url=repo_info.get("url", ""),
            repository_name=repo_metadata.get(
                "full_name", repo_info.get("name", "unknown")
            ),
            branch=repo_info.get("branch", "main"),
            technology_stack=TechnologyStack(),
            confidence_score=0.0,
            confidence_level=ConfidenceLevel.LOW,
            analysis_approach="error",
            llm_used=False,
            processing_time=0.0,
            error_message=error,
        )

    async def get_supported_technologies(self) -> Dict[str, List[str]]:
        """
        Get list of all supported technologies across all analyzers
        """
        return {
            "languages": ["python", "javascript", "typescript", "java", "go", "rust"],
            "frameworks": ["react", "vue", "angular", "django", "flask", "express"],
            "databases": ["postgresql", "mysql", "mongodb", "redis"],
            "tools": ["docker", "kubernetes", "terraform", "ansible"],
        }

    async def health_check(self) -> Dict[str, str]:
        """
        Perform health check on all components
        """
        try:
            # Check cache manager
            await self.cache_manager.health_check()

            return {
                "status": "healthy",
                "stack_analyzer": "operational",
                "dependency_analyzer": "operational",
                "code_analyzer": "operational",
                "llm_enhancer": "operational",
                "cache_manager": "operational",
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
            }
