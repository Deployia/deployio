"""
Analysis Service - Business logic for repository analysis
Clean separation of concerns following service architecture pattern
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

from engines.core.detector import UnifiedDetectionEngine
from engines.core.models import AnalysisType, AnalysisResult
from services.progress_service import progress_service, OperationSteps

# Configure logger
logger = logging.getLogger(__name__)


class AnalysisService:
    """
    Main analysis service handling all analysis operations
    Serves as blueprint for other services in the DeployIO AI Service

    This service encapsulates:
    - Repository analysis workflows
    - Technology stack detection
    - Code quality assessment
    - Dependency analysis
    - Insight generation
    - Progress tracking integration
    """

    def __init__(self):
        self.detection_engine = UnifiedDetectionEngine()
        logger.info("Analysis service initialized")

    async def analyze_repository(
        self,
        repository_url: str,
        branch: str = "main",
        analysis_types: Optional[List[str]] = None,
        force_llm: bool = False,
        include_reasoning: bool = True,
        include_recommendations: bool = True,
        include_insights: bool = True,
        explain_null_fields: bool = True,
        track_progress: bool = False,
    ) -> Dict[str, Any]:
        """
        Complete repository analysis with insights and progress tracking

        Args:
            repository_url: URL of the repository to analyze
            branch: Git branch to analyze (default: main)
            analysis_types: Specific analysis types to run
            force_llm: Force LLM enhancement even for simple cases
            include_reasoning: Include detailed reasoning in response
            include_recommendations: Include actionable recommendations
            include_insights: Include analysis insights
            explain_null_fields: Explain why certain fields are null/empty
            track_progress: Enable progress tracking

        Returns:
            Comprehensive analysis result with insights, reasoning, and metadata
        """

        logger.info(
            f"Starting repository analysis for {repository_url} on branch {branch}"
        )

        # Setup progress tracking
        analysis_id = None
        if track_progress:
            analysis_id = progress_service.create_operation(
                operation_type="repository_analysis",
                steps=OperationSteps.analysis_steps(),
            )
            tracker = progress_service.get_tracker(analysis_id)
            await tracker.start("Starting repository analysis")
            logger.info(f"Progress tracking enabled with ID: {analysis_id}")

        try:
            # Convert analysis types
            engine_analysis_types = self._convert_analysis_types(analysis_types)
            logger.debug(f"Analysis types: {engine_analysis_types}")

            # Progress update
            if track_progress:
                await tracker.next_step("Performing core analysis")

            # Core analysis
            result = await self.detection_engine.analyze_repository(
                repository_url=repository_url,
                branch=branch,
                analysis_types=engine_analysis_types,
                force_llm=force_llm,
            )

            logger.info(
                f"Core analysis completed with confidence: {result.confidence_score}"
            )

            # Progress update
            if track_progress:
                await tracker.next_step("Generating insights and reasoning")

            # Process and enhance the analysis result
            analysis_data = await self._process_analysis_result(
                result=result,
                repository_url=repository_url,
                branch=branch,
                include_reasoning=include_reasoning,
                include_insights=include_insights,
                include_recommendations=include_recommendations,
                explain_null_fields=explain_null_fields,
                analysis_id=analysis_id,
            )

            # Complete progress tracking
            if track_progress:
                await tracker.complete("Repository analysis completed successfully")
                logger.info(f"Progress tracking completed for {analysis_id}")

            logger.info(
                f"Repository analysis completed successfully for {repository_url}"
            )
            return analysis_data

        except Exception as e:
            logger.error(
                f"Repository analysis failed for {repository_url}: {str(e)}",
                exc_info=True,
            )
            if track_progress and analysis_id:
                tracker = progress_service.get_tracker(analysis_id)
                if tracker:
                    await tracker.fail(f"Analysis failed: {str(e)}", e)
            raise

    async def analyze_technology_stack(
        self,
        repository_url: str,
        branch: str = "main",
        include_reasoning: bool = True,
        explain_null_fields: bool = True,
    ) -> Dict[str, Any]:
        """
        Focused technology stack detection

        Returns:
            Technology stack analysis with insights and reasoning
        """
        logger.info(f"Starting technology stack analysis for {repository_url}")

        try:
            # Core stack detection
            result = await self.detection_engine.analyze_repository(
                repository_url=repository_url,
                branch=branch,
                analysis_types=[AnalysisType.STACK_DETECTION],
                force_llm=False,
            )

            logger.info(f"Stack detection completed for {repository_url}")

            # Process result for stack detection
            return await self._process_analysis_result(
                result=result,
                repository_url=repository_url,
                branch=branch,
                include_reasoning=include_reasoning,
                include_insights=True,
                include_recommendations=False,
                explain_null_fields=explain_null_fields,
                mode="stack",
            )

        except Exception as e:
            logger.error(
                f"Technology stack analysis failed for {repository_url}: {str(e)}",
                exc_info=True,
            )
            raise Exception(f"Technology stack analysis failed: {str(e)}")

    async def analyze_code_quality(
        self,
        repository_url: str,
        branch: str = "main",
        include_reasoning: bool = True,
        explain_null_fields: bool = True,
    ) -> Dict[str, Any]:
        """
        Focused code quality assessment

        Returns:
            Code quality analysis with metrics and recommendations
        """
        logger.info(f"Starting code quality analysis for {repository_url}")

        try:
            # Core quality analysis
            result = await self.detection_engine.analyze_repository(
                repository_url=repository_url,
                branch=branch,
                analysis_types=[AnalysisType.CODE_QUALITY],
                force_llm=False,
            )

            logger.info(f"Code quality analysis completed for {repository_url}")

            # Process result for code quality
            return await self._process_analysis_result(
                result=result,
                repository_url=repository_url,
                branch=branch,
                include_reasoning=include_reasoning,
                include_insights=True,
                include_recommendations=True,
                explain_null_fields=explain_null_fields,
                mode="quality",
            )

        except Exception as e:
            logger.error(
                f"Code quality analysis failed for {repository_url}: {str(e)}",
                exc_info=True,
            )
            raise Exception(f"Code quality analysis failed: {str(e)}")

    async def analyze_dependencies(
        self,
        repository_url: str,
        branch: str = "main",
        include_reasoning: bool = True,
        explain_null_fields: bool = True,
    ) -> Dict[str, Any]:
        """
        Focused dependency analysis

        Returns:
            Dependency analysis with security insights and recommendations
        """
        logger.info(f"Starting dependency analysis for {repository_url}")

        try:
            # Core dependency analysis
            result = await self.detection_engine.analyze_repository(
                repository_url=repository_url,
                branch=branch,
                analysis_types=[AnalysisType.DEPENDENCY_ANALYSIS],
                force_llm=False,
            )

            logger.info(f"Dependency analysis completed for {repository_url}")

            # Process result for dependencies
            return await self._process_analysis_result(
                result=result,
                repository_url=repository_url,
                branch=branch,
                include_reasoning=include_reasoning,
                include_insights=True,
                include_recommendations=True,
                explain_null_fields=explain_null_fields,
                mode="dependencies",
            )

        except Exception as e:
            logger.error(
                f"Dependency analysis failed for {repository_url}: {str(e)}",
                exc_info=True,
            )
            raise Exception(f"Dependency analysis failed: {str(e)}")

    async def get_supported_technologies(self) -> Dict[str, Any]:
        """
        Get list of supported technologies and frameworks

        Returns:
            Dictionary of supported technologies organized by category
        """
        logger.debug("Retrieving supported technologies")

        try:
            result = await self.detection_engine.get_supported_technologies()
            logger.info("Successfully retrieved supported technologies")
            return result
        except Exception as e:
            logger.error(
                f"Failed to get supported technologies: {str(e)}", exc_info=True
            )
            raise Exception(f"Failed to get supported technologies: {str(e)}")

    async def get_health_status(self) -> Dict[str, Any]:
        """
        Get health status of analysis service and dependencies

        Returns:
            Health status information including engine status
        """
        logger.debug("Checking analysis service health")

        try:
            # Check detection engine health
            engine_status = await self.detection_engine.health_check()

            health_data = {
                "service": "analysis_service",
                "status": "healthy",
                "detection_engine": engine_status,
                "timestamp": datetime.now().isoformat(),
            }

            logger.info("Analysis service health check completed successfully")
            return health_data

        except Exception as e:
            logger.error(
                f"Analysis service health check failed: {str(e)}", exc_info=True
            )
            return {
                "service": "analysis_service",
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }

    # Private helper methods

    def _convert_analysis_types(
        self, analysis_types: Optional[List[str]]
    ) -> Optional[List[AnalysisType]]:
        """Convert string analysis types to AnalysisType enums"""
        if not analysis_types:
            return None

        type_mapping = {
            "stack": AnalysisType.STACK_DETECTION,
            "dependencies": AnalysisType.DEPENDENCY_ANALYSIS,
            "quality": AnalysisType.CODE_QUALITY,
            "security": AnalysisType.SECURITY_SCAN,
        }

        result = []
        for type_str in analysis_types:
            if type_str in type_mapping:
                result.append(type_mapping[type_str])
            else:
                logger.warning(f"Unknown analysis type: {type_str}")

        return result if result else None

    async def _process_analysis_result(
        self,
        result: AnalysisResult,
        repository_url: str,
        branch: str,
        include_reasoning: bool = True,
        include_insights: bool = True,
        include_recommendations: bool = True,
        explain_null_fields: bool = True,
        analysis_id: Optional[str] = None,
        mode: str = "full",
    ) -> Dict[str, Any]:
        """
        Process and enhance the raw analysis result

        Args:
            result: Raw analysis result from detection engine
            repository_url: Repository URL being analyzed
            branch: Git branch being analyzed
            include_reasoning: Whether to include detailed reasoning
            include_insights: Whether to generate insights
            include_recommendations: Whether to include recommendations
            explain_null_fields: Whether to explain null/empty fields
            analysis_id: Optional analysis ID for progress tracking
            mode: Analysis mode (full, stack, quality, dependencies)

        Returns:
            Processed analysis result with insights, reasoning, and metadata
        """

        logger.debug(f"Processing analysis result for mode: {mode}")

        # Base response structure
        response_data = {
            "repository_url": repository_url,
            "branch": branch,
            "analysis_approach": result.analysis_approach,
            "processing_time": result.processing_time,
            "confidence_score": result.confidence_score,
            "confidence_level": self._get_confidence_level(result.confidence_score),
            "analysis_id": analysis_id,
        }

        # Add core data based on mode
        if mode in ["full", "stack"]:
            response_data.update(
                {
                    "technology_stack": self._convert_technology_stack(
                        result.technology_stack
                    ),
                    "detected_files": result.detected_files,
                }
            )

        if mode in ["full", "quality"] and result.quality_metrics:
            response_data["quality_metrics"] = result.quality_metrics

        if mode in ["full", "dependencies"]:
            # Always include dependency_analysis as a dict for response model compatibility
            if result.dependency_analysis is not None:
                # Convert dataclass to dict if needed
                if hasattr(result.dependency_analysis, "__dict__"):
                    response_data["dependency_analysis"] = (
                        result.dependency_analysis.__dict__
                    )
                else:
                    response_data["dependency_analysis"] = result.dependency_analysis
            else:
                response_data["dependency_analysis"] = {}

        if mode == "full":
            response_data.update(
                {
                    "security_metrics": result.security_metrics,
                    "llm_used": result.llm_used,
                    "llm_confidence": getattr(result, "llm_confidence", 0.0),
                    "llm_reasoning": getattr(result, "llm_reasoning", None),
                }
            )

        # Add recommendations if requested
        if include_recommendations:
            response_data.update(
                {
                    "recommendations": result.recommendations or [],
                    "suggestions": self._normalize_suggestions_service(
                        result.suggestions
                    ),
                }
            )  # Generate insights if requested
        if include_insights:
            # Use LLM-generated insights ONLY
            if hasattr(result, "insights") and result.insights:
                # Convert insight objects to dicts if needed
                insights = []
                for insight in result.insights:
                    if hasattr(insight, "__dict__"):
                        insight_dict = {
                            "category": insight.category,
                            "title": insight.title,
                            "description": insight.description,
                            "reasoning": insight.reasoning,
                            "confidence": insight.confidence,
                            "evidence": insight.evidence or [],
                            "recommendations": insight.recommendations or [],
                            "severity": getattr(insight, "severity", None),
                            "tags": getattr(insight, "tags", []),
                        }
                        insights.append(insight_dict)
                    else:
                        insights.append(insight)
                response_data["insights"] = insights
            else:
                # Only include insights if LLM provided them
                response_data["insights"] = []
            logger.debug(
                f"Generated {len(response_data['insights'])} insights"
            )  # Add reasoning if requested (LLM-only, no hardcoded fallbacks)
        if include_reasoning:
            if hasattr(result, "llm_reasoning") and result.llm_reasoning:
                response_data["reasoning"] = result.llm_reasoning
            # No fallback reasoning - if LLM didn't provide it, we don't include it        # Explain null fields if requested (LLM-only, no hardcoded fallbacks)
        if explain_null_fields:
            if (
                hasattr(result, "llm_null_explanations")
                and result.llm_null_explanations
            ):
                response_data["null_field_explanations"] = result.llm_null_explanations
            # Only include null field explanations if provided by LLM

        # Ensure all response fields are properly populated
        response_data = self._ensure_complete_response(response_data, mode)

        logger.debug("Analysis result processing completed")
        return response_data

    def _convert_technology_stack(self, technology_stack) -> Dict[str, Any]:
        """Convert technology stack to dict format"""
        if hasattr(technology_stack, "__dict__"):
            return {
                "language": getattr(technology_stack, "language", None),
                "framework": getattr(technology_stack, "framework", None),
                "database": getattr(technology_stack, "database", None),
                "build_tool": getattr(technology_stack, "build_tool", None),
                "package_manager": getattr(technology_stack, "package_manager", None),
                "runtime_version": getattr(technology_stack, "runtime_version", None),
                "additional_technologies": getattr(
                    technology_stack, "additional_technologies", []
                ),
                "architecture_pattern": getattr(
                    technology_stack, "architecture_pattern", None
                ),
                "deployment_strategy": getattr(
                    technology_stack, "deployment_strategy", None
                ),
            }
        elif isinstance(technology_stack, dict):
            return technology_stack
        else:
            logger.warning(f"Unknown technology stack format: {type(technology_stack)}")
            return {}

    def _get_confidence_level(self, confidence_score: float) -> str:
        """Convert confidence score to human-readable level"""
        if confidence_score >= 0.8:
            return "high"
        elif confidence_score >= 0.6:
            return "medium"
        elif confidence_score >= 0.4:
            return "low"
        else:
            return "very_low"

    def _ensure_complete_response(
        self, response_data: Dict[str, Any], mode: str
    ) -> Dict[str, Any]:
        """Ensure response has no null fields and all required data"""

        # Ensure basic fields are always present
        if (
            "technology_stack" not in response_data
            or not response_data["technology_stack"]
        ):
            response_data["technology_stack"] = {
                "language": None,
                "framework": None,
                "database": None,
                "build_tool": None,
                "package_manager": None,
                "runtime_version": None,
                "additional_technologies": [],
                "architecture_pattern": None,
                "deployment_strategy": None,
            }

        # Ensure dependency analysis is properly formatted
        if mode in ["full", "dependencies"]:
            if (
                "dependency_analysis" not in response_data
                or not response_data["dependency_analysis"]
            ):
                response_data["dependency_analysis"] = {
                    "total_dependencies": 0,
                    "direct_dependencies": 0,
                    "dev_dependencies": 0,
                    "package_managers": [],
                    "security_vulnerabilities": 0,
                    "outdated_dependencies": 0,
                    "optimization_score": 0,
                    "ecosystems": [],
                    "critical_vulnerabilities": 0,
                    "high_vulnerabilities": 0,
                    "medium_vulnerabilities": 0,
                    "low_vulnerabilities": 0,
                    "license_issues": 0,
                    "major_updates_available": 0,
                }

        # Ensure quality metrics are present
        if mode in ["full", "quality"]:
            if (
                "quality_metrics" not in response_data
                or not response_data["quality_metrics"]
            ):
                response_data["quality_metrics"] = {
                    "overall_score": 0,
                    "maintainability": 0,
                    "complexity": 0,
                    "test_coverage": 0,
                    "code_duplication": 0,
                    "technical_debt": 0,
                }

        # Ensure lists are never null
        list_fields = ["recommendations", "suggestions", "insights", "detected_files"]
        for field in list_fields:
            if field not in response_data or response_data[field] is None:
                response_data[field] = []

        # Ensure numeric fields are never null
        numeric_fields = ["confidence_score", "processing_time"]
        for field in numeric_fields:
            if field not in response_data or response_data[field] is None:
                response_data[field] = 0.0

        # Ensure string fields are never null
        string_fields = [
            "repository_url",
            "branch",
            "analysis_approach",
            "confidence_level",
        ]
        for field in string_fields:
            if field not in response_data or response_data[field] is None:
                response_data[field] = "unknown"

        # Fix specific field issues
        if response_data["analysis_approach"] == "unknown":
            response_data["analysis_approach"] = "rule_based"

        if response_data["confidence_level"] == "unknown":
            if response_data["confidence_score"] >= 0.8:
                response_data["confidence_level"] = "high"
            elif response_data["confidence_score"] >= 0.6:
                response_data["confidence_level"] = "medium"
            elif response_data["confidence_score"] >= 0.4:
                response_data["confidence_level"] = "low"
            else:
                response_data["confidence_level"] = "very_low"

        return response_data

    def _normalize_suggestions_service(self, suggestions) -> list:
        """Ensure suggestions is a list of dicts with expected fields for API response"""
        if not suggestions:
            return []
        normalized = []
        for item in suggestions:
            if isinstance(item, dict):
                # Only keep allowed fields
                norm = {
                    "type": item.get("type"),
                    "priority": item.get("priority"),
                    "suggestion": item.get("suggestion")
                    or item.get("title")
                    or str(item),
                    "reason": item.get("reason") or item.get("description"),
                }
                # Remove None fields
                norm = {k: v for k, v in norm.items() if v is not None}
                normalized.append(norm)
            elif isinstance(item, str):
                normalized.append({"suggestion": item})
            else:
                normalized.append({"suggestion": str(item)})
        return normalized


# Singleton instance for use across the application
analysis_service = AnalysisService()
