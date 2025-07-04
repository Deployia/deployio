"""
Analyzer Enhancement Engine

Specialized enhancer for analysis-specific enhancements using modular LLM clients.
Focuses on improving technology stack, dependency analysis, and code quality insights.
"""

import logging
from typing import Dict, Any, List, Optional
from engines.llm.client_manager import LLMClientManager
from engines.llm.models import LLMRequest, LLMProvider
from engines.prompts.analysis_prompts import AnalysisPrompts
from models.analysis_models import (
    AnalysisResult,
    TechnologyStack,
    DependencyAnalysis,
    CodeAnalysis,
)

logger = logging.getLogger(__name__)


class AnalyzerEnhancer:
    """
    Specialized enhancer for analysis improvements.
    Uses modular LLM clients and analysis-specific prompts.
    """

    def __init__(self, client_manager: Optional[LLMClientManager] = None):
        self.client_manager = client_manager or LLMClientManager()
        self.prompts = AnalysisPrompts()

        # Configuration
        self.max_tokens = 2000
        self.temperature = 0.1

        logger.info("AnalyzerEnhancer initialized with modular LLM services")

    @property
    def is_available(self) -> bool:
        """Check if LLM services are available for enhancement."""
        return len(self.client_manager.get_available_providers()) > 0

    async def enhance_technology_stack(
        self, analysis_result: AnalysisResult, repository_data: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Enhance technology stack detection with LLM insights.

        Args:
            analysis_result: Current analysis results from rule-based analyzers
            repository_data: Repository files and metadata

        Returns:
            Enhanced analysis result with improved technology stack
        """
        if not self.is_available:
            logger.warning(
                "No LLM providers available for technology stack enhancement"
            )
            return analysis_result

        try:
            logger.info("Enhancing technology stack with LLM")

            # Generate technology stack enhancement prompt
            prompt_data = self.prompts.technology_stack_enhancement(
                analysis_result, repository_data
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
                # Parse and apply enhancements
                enhancements = self._parse_technology_enhancement(response.content)
                analysis_result = self._apply_technology_enhancements(
                    analysis_result, enhancements
                )

                logger.info("Technology stack enhancement completed successfully")
            else:
                logger.warning("Technology stack enhancement failed")

        except Exception as e:
            logger.error(f"Technology stack enhancement error: {e}")

        return analysis_result

    async def enhance_dependency_analysis(
        self, analysis_result: AnalysisResult, repository_data: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Enhance dependency analysis with security insights and recommendations.

        Args:
            analysis_result: Current analysis results
            repository_data: Repository files and metadata

        Returns:
            Enhanced analysis result with improved dependency insights
        """
        if not self.is_available:
            logger.warning(
                "No LLM providers available for dependency analysis enhancement"
            )
            return analysis_result

        try:
            logger.info("Enhancing dependency analysis with LLM")

            # Generate dependency analysis enhancement prompt
            prompt_data = self.prompts.dependency_enhancement(
                analysis_result, repository_data
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
                # Parse and apply enhancements
                enhancements = self._parse_dependency_enhancement(response.content)
                analysis_result = self._apply_dependency_enhancements(
                    analysis_result, enhancements
                )

                logger.info("Dependency analysis enhancement completed successfully")
            else:
                logger.warning("Dependency analysis enhancement failed")

        except Exception as e:
            logger.error(f"Dependency analysis enhancement error: {e}")

        return analysis_result

    async def enhance_code_quality(
        self, analysis_result: AnalysisResult, repository_data: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Enhance code quality analysis with architectural insights.

        Args:
            analysis_result: Current analysis results
            repository_data: Repository files and metadata

        Returns:
            Enhanced analysis result with improved code quality insights
        """
        if not self.is_available:
            logger.warning("No LLM providers available for code quality enhancement")
            return analysis_result

        try:
            logger.info("Enhancing code quality analysis with LLM")

            # Generate code quality enhancement prompt
            prompt_data = self.prompts.code_quality_enhancement(
                analysis_result, repository_data
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
                # Parse and apply enhancements
                enhancements = self._parse_code_quality_enhancement(response.content)
                analysis_result = self._apply_code_quality_enhancements(
                    analysis_result, enhancements
                )

                logger.info("Code quality enhancement completed successfully")
            else:
                logger.warning("Code quality enhancement failed")

        except Exception as e:
            logger.error(f"Code quality enhancement error: {e}")

        return analysis_result

    async def generate_comprehensive_insights(
        self, analysis_result: AnalysisResult, repository_data: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Generate comprehensive project insights and recommendations.

        Args:
            analysis_result: Current analysis results
            repository_data: Repository files and metadata

        Returns:
            Enhanced analysis result with comprehensive insights
        """
        if not self.is_available:
            logger.warning("No LLM providers available for comprehensive insights")
            return analysis_result

        try:
            logger.info("Generating comprehensive project insights with LLM")

            # Generate comprehensive insights prompt
            prompt_data = self.prompts.comprehensive_project_insights(
                analysis_result, repository_data
            )

            # Create LLM request
            request = LLMRequest(
                messages=[
                    {"role": "system", "content": prompt_data["system"]},
                    {"role": "user", "content": prompt_data["user"]},
                ],
                max_tokens=self.max_tokens
                * 2,  # More tokens for comprehensive insights
                temperature=self.temperature,
            )

            # Call LLM with fallback providers
            response = await self.client_manager.generate(
                request, preferred_provider=LLMProvider.GROQ
            )

            if response and response.success:
                # Parse and apply insights
                insights = self._parse_comprehensive_insights(response.content)
                analysis_result = self._apply_comprehensive_insights(
                    analysis_result, insights
                )

                logger.info("Comprehensive insights generation completed successfully")
            else:
                logger.warning("Comprehensive insights generation failed")

        except Exception as e:
            logger.error(f"Comprehensive insights generation error: {e}")

        return analysis_result

    def _parse_technology_enhancement(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response for technology stack enhancements."""
        try:
            import json

            # Clean and parse JSON response
            clean_content = self._clean_json_response(response_content)
            return json.loads(clean_content)

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse technology enhancement response: {e}")
            return {}

    def _parse_dependency_enhancement(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response for dependency analysis enhancements."""
        try:
            import json

            # Clean and parse JSON response
            clean_content = self._clean_json_response(response_content)
            return json.loads(clean_content)

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse dependency enhancement response: {e}")
            return {}

    def _parse_code_quality_enhancement(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response for code quality enhancements."""
        try:
            import json

            # Clean and parse JSON response
            clean_content = self._clean_json_response(response_content)
            return json.loads(clean_content)

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse code quality enhancement response: {e}")
            return {}

    def _parse_comprehensive_insights(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response for comprehensive insights."""
        try:
            import json

            # Clean and parse JSON response
            clean_content = self._clean_json_response(response_content)
            return json.loads(clean_content)

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse comprehensive insights response: {e}")
            return {}

    def _clean_json_response(self, content: str) -> str:
        """Clean LLM response to extract valid JSON."""
        # Remove code block markers if present
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()

        return content

    def _apply_technology_enhancements(
        self, analysis_result: AnalysisResult, enhancements: Dict[str, Any]
    ) -> AnalysisResult:
        """Apply technology stack enhancements to analysis result."""
        try:
            tech_stack = analysis_result.technology_stack

            # Enhance missing technologies
            if "missing_technologies" in enhancements:
                missing = enhancements["missing_technologies"]
                if "languages" in missing:
                    tech_stack.languages.extend(missing["languages"])
                if "frameworks" in missing:
                    tech_stack.frameworks.extend(missing["frameworks"])
                if "databases" in missing:
                    tech_stack.databases.extend(missing["databases"])

            # Add version information
            if "versions" in enhancements:
                versions = enhancements["versions"]
                # Update version information where available
                for key, version in versions.items():
                    setattr(tech_stack, f"{key}_version", version)

            # Add LLM-generated insights
            if "insights" in enhancements:
                for insight in enhancements["insights"]:
                    if isinstance(insight, str):
                        analysis_result.insights.append(insight)

            # Add recommendations
            if "recommendations" in enhancements:
                for rec in enhancements["recommendations"]:
                    if isinstance(rec, str):
                        analysis_result.recommendations.append(rec)

        except Exception as e:
            logger.warning(f"Error applying technology enhancements: {e}")

        return analysis_result

    def _apply_dependency_enhancements(
        self, analysis_result: AnalysisResult, enhancements: Dict[str, Any]
    ) -> AnalysisResult:
        """Apply dependency analysis enhancements to analysis result."""
        try:
            # Add security recommendations
            if "security_recommendations" in enhancements:
                for rec in enhancements["security_recommendations"]:
                    if isinstance(rec, str):
                        analysis_result.recommendations.append(f"Security: {rec}")

            # Add dependency insights
            if "dependency_insights" in enhancements:
                for insight in enhancements["dependency_insights"]:
                    if isinstance(insight, str):
                        analysis_result.insights.append(f"Dependencies: {insight}")

            # Update vulnerability information
            if "vulnerabilities" in enhancements:
                vuln_info = enhancements["vulnerabilities"]
                if isinstance(vuln_info, dict) and "summary" in vuln_info:
                    analysis_result.insights.append(
                        f"Vulnerabilities: {vuln_info['summary']}"
                    )

        except Exception as e:
            logger.warning(f"Error applying dependency enhancements: {e}")

        return analysis_result

    def _apply_code_quality_enhancements(
        self, analysis_result: AnalysisResult, enhancements: Dict[str, Any]
    ) -> AnalysisResult:
        """Apply code quality enhancements to analysis result."""
        try:
            # Add architectural insights
            if "architectural_insights" in enhancements:
                for insight in enhancements["architectural_insights"]:
                    if isinstance(insight, str):
                        analysis_result.insights.append(f"Architecture: {insight}")

            # Add quality recommendations
            if "quality_recommendations" in enhancements:
                for rec in enhancements["quality_recommendations"]:
                    if isinstance(rec, str):
                        analysis_result.recommendations.append(f"Code Quality: {rec}")

            # Update maintainability score if provided
            if "maintainability_score" in enhancements:
                score = enhancements["maintainability_score"]
                if isinstance(score, (int, float)) and 0 <= score <= 100:
                    # Add as insight since we don't have a direct field
                    analysis_result.insights.append(
                        f"Maintainability Score: {score}/100"
                    )

        except Exception as e:
            logger.warning(f"Error applying code quality enhancements: {e}")

        return analysis_result

    def _apply_comprehensive_insights(
        self, analysis_result: AnalysisResult, insights: Dict[str, Any]
    ) -> AnalysisResult:
        """Apply comprehensive insights to analysis result."""
        try:
            # Add general insights
            if "insights" in insights:
                for insight in insights["insights"]:
                    if isinstance(insight, str):
                        analysis_result.insights.append(insight)

            # Add recommendations
            if "recommendations" in insights:
                for rec in insights["recommendations"]:
                    if isinstance(rec, str):
                        analysis_result.recommendations.append(rec)

            # Add suggestions
            if "suggestions" in insights:
                for suggestion in insights["suggestions"]:
                    if isinstance(suggestion, str):
                        analysis_result.suggestions.append(suggestion)

            # Update confidence if provided
            if "confidence_boost" in insights:
                boost = insights["confidence_boost"]
                if isinstance(boost, (int, float)) and boost > 0:
                    # Apply confidence boost logic
                    if analysis_result.confidence_score < 0.8:
                        analysis_result.confidence_score = min(
                            1.0, analysis_result.confidence_score + boost
                        )

        except Exception as e:
            logger.warning(f"Error applying comprehensive insights: {e}")

        return analysis_result

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on analyzer enhancer."""
        try:
            # Check LLM client manager
            client_health = self.client_manager.health_check()

            return {
                "analyzer_enhancer": {
                    "status": "healthy",
                    "available_providers": self.client_manager.get_available_providers(),
                    "llm_clients": client_health,
                    "prompts_loaded": hasattr(
                        self.prompts, "technology_stack_enhancement"
                    ),
                }
            }
        except Exception as e:
            logger.error(f"Analyzer enhancer health check failed: {e}")
            return {
                "analyzer_enhancer": {
                    "status": "unhealthy",
                    "error": str(e),
                }
            }
