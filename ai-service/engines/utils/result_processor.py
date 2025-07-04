"""
Enhanced Analysis Result Processor

This module ensures LLM enhancements properly replace rule-based analysis
and provides comprehensive field population with explanations for null values.
"""

import logging
from typing import Dict, Any, Optional
from models.analysis_models import (
    AnalysisResult,
    DependencyAnalysis,
    CodeAnalysis,
    TechnologyStack,
)
from models.common_models import InsightModel, RecommendationModel

logger = logging.getLogger(__name__)


class AnalysisResultProcessor:
    """
    Processes and enhances analysis results to ensure comprehensive data population.
    """

    @staticmethod
    def ensure_comprehensive_result(
        analysis_result: AnalysisResult,
        llm_enhancements: Optional[Dict[str, Any]] = None,
    ) -> AnalysisResult:
        """
        Ensure analysis result has comprehensive data with explanations for null fields.
        LLM enhancements are prioritized; fallback data is only added if LLM provides none.

        Args:
            analysis_result: Base analysis result
            llm_enhancements: LLM enhancement data to integrate

        Returns:
            Enhanced analysis result with comprehensive data
        """
        # Create a deep copy to avoid modifying the original
        import copy

        enhanced_result = copy.deepcopy(analysis_result)

        # Ensure metadata field exists and is properly initialized
        if not hasattr(enhanced_result, "metadata") or enhanced_result.metadata is None:
            enhanced_result.metadata = {}

        # Ensure other optional fields exist
        if not hasattr(enhanced_result, "insights") or enhanced_result.insights is None:
            enhanced_result.insights = []
        if (
            not hasattr(enhanced_result, "recommendations")
            or enhanced_result.recommendations is None
        ):
            enhanced_result.recommendations = []
        if (
            not hasattr(enhanced_result, "suggestions")
            or enhanced_result.suggestions is None
        ):
            enhanced_result.suggestions = []
        if (
            not hasattr(enhanced_result, "null_field_explanations")
            or enhanced_result.null_field_explanations is None
        ):
            enhanced_result.null_field_explanations = {}
        if not hasattr(enhanced_result, "warnings") or enhanced_result.warnings is None:
            enhanced_result.warnings = []

        # Apply LLM enhancements if available
        if llm_enhancements:
            enhanced_result = AnalysisResultProcessor._apply_llm_enhancements(
                enhanced_result, llm_enhancements
            )

        # Only add fallback/system-generated data if LLM did not provide any
        if not enhanced_result.recommendations:
            enhanced_result = AnalysisResultProcessor._add_fallback_recommendations(
                enhanced_result
            )
        if not enhanced_result.insights:
            enhanced_result = AnalysisResultProcessor._add_fallback_insights(
                enhanced_result
            )

        # Ensure all critical fields are populated with explanations
        enhanced_result = AnalysisResultProcessor._ensure_field_completeness(
            enhanced_result
        )

        # Update confidence to reflect enhancement
        enhanced_result.confidence_score = min(
            0.95, enhanced_result.confidence_score + 0.15
        )

        # Mark as LLM enhanced if LLM data was used
        enhanced_result.metadata["llm_enhanced"] = bool(llm_enhancements)
        enhanced_result.metadata["enhancement_applied"] = True

        return enhanced_result

    @staticmethod
    def _apply_llm_enhancements(
        analysis_result: AnalysisResult, llm_enhancements: Dict[str, Any]
    ) -> AnalysisResult:
        """Apply LLM enhancements to replace/enhance rule-based analysis."""

        # Technology Stack Enhancement
        if "enhanced_technologies" in llm_enhancements:
            tech_data = llm_enhancements["enhanced_technologies"]
            if isinstance(tech_data, dict):
                # Update technology stack with LLM insights
                tech_stack = analysis_result.technology_stack

                if "languages" in tech_data and tech_data["languages"]:
                    tech_stack.language = tech_data["languages"][0]  # Primary language
                    if len(tech_data["languages"]) > 1:
                        tech_stack.additional_technologies.extend(
                            tech_data["languages"][1:]
                        )

                if "frameworks" in tech_data and tech_data["frameworks"]:
                    tech_stack.framework = tech_data["frameworks"][
                        0
                    ]  # Primary framework
                    if len(tech_data["frameworks"]) > 1:
                        tech_stack.additional_technologies.extend(
                            tech_data["frameworks"][1:]
                        )

                if "databases" in tech_data and tech_data["databases"]:
                    tech_stack.database = tech_data["databases"][0]
                    tech_stack.additional_technologies.extend(tech_data["databases"])

                # Boost confidence for LLM-enhanced technology detection
                tech_stack.confidence = min(0.95, tech_stack.confidence + 0.2)

        # Technology Insights
        if "technology_insights" in llm_enhancements:
            for insight in llm_enhancements["technology_insights"]:
                if isinstance(insight, dict):
                    insight_text = f"Technology: {insight.get('technology', 'Unknown')} - {insight.get('reasoning', '')}"
                    analysis_result.insights.append(
                        InsightModel(
                            type="technology",
                            category="technology_stack",
                            title=f"Technology Detection: {insight.get('technology', 'Unknown')}",
                            description=insight_text,
                            confidence=insight.get("confidence", 0.8),
                            source="llm_enhancement",
                        )
                    )

        # Architecture and Build Configuration
        if "build_configuration" in llm_enhancements:
            build_data = llm_enhancements["build_configuration"]
            if isinstance(build_data, dict):
                build_config = analysis_result.build_configuration

                if "build_tools" in build_data:
                    build_config.build_tools.extend(build_data["build_tools"])
                if "entry_points" in build_data:
                    build_config.entry_points.extend(build_data["entry_points"])
                if "deployment_ready" in build_data:
                    build_config.deployment_ready = build_data["deployment_ready"]

        # Security and Dependency Analysis Enhancement
        if "security_analysis" in llm_enhancements:
            security_data = llm_enhancements["security_analysis"]
            if isinstance(security_data, dict):
                # Add security insights
                risk_score = security_data.get("risk_score", 0)
                analysis_result.insights.append(
                    InsightModel(
                        type="security",
                        category="dependencies",
                        title="Security Risk Assessment",
                        description=f"Security risk score: {risk_score}/100",
                        confidence=0.9,
                        source="llm_enhancement",
                    )
                )

                # Add vulnerability insights
                for vuln in security_data.get("vulnerabilities", []):
                    if isinstance(vuln, dict):
                        vuln_text = f"{vuln.get('dependency', 'Unknown')}: {vuln.get('description', '')}"
                        analysis_result.insights.append(
                            InsightModel(
                                type="vulnerability",
                                category="dependencies",
                                title=f"Vulnerability: {vuln.get('dependency', 'Unknown')}",
                                description=vuln_text,
                                confidence=0.9,
                                source="llm_enhancement",
                            )
                        )

        # Comprehensive Recommendations
        if "recommendations" in llm_enhancements:
            for rec in llm_enhancements["recommendations"]:
                if isinstance(rec, dict):
                    analysis_result.recommendations.append(
                        RecommendationModel(
                            type=rec.get("type", "enhancement"),
                            category=rec.get("category", "general"),
                            title=rec.get("title", "Recommendation"),
                            description=rec.get("description", ""),
                            priority=rec.get("priority", "medium"),
                            confidence=0.85,
                            source="llm_enhancement",
                        )
                    )

        # Project Assessment Insights
        if "project_assessment" in llm_enhancements:
            assessment = llm_enhancements["project_assessment"]
            if isinstance(assessment, dict):
                analysis_result.insights.append(
                    InsightModel(
                        type="assessment",
                        category="project_health",
                        title="Project Health Assessment",
                        description=f"Maturity: {assessment.get('maturity_level', 'Unknown')}, Health Score: {assessment.get('health_score', 'N/A')}",
                        confidence=0.9,
                        source="llm_enhancement",
                    )
                )

        return analysis_result

    @staticmethod
    def _add_fallback_recommendations(
        analysis_result: AnalysisResult,
    ) -> AnalysisResult:
        """Add system-generated recommendations if LLM did not provide any."""
        analysis_result.recommendations.append(
            RecommendationModel(
                type="general",
                category="improvement",
                title="Documentation Enhancement",
                description="Consider adding comprehensive README and documentation",
                priority="medium",
                confidence=0.8,
                source="system_generated",
                reasoning="Documentation is essential for maintainability and onboarding.",
            )
        )
        analysis_result.recommendations.append(
            RecommendationModel(
                type="general",
                category="deployment",
                title="Containerization",
                description="Consider containerizing the application with Docker for easier deployment",
                priority="medium",
                confidence=0.8,
                source="system_generated",
                reasoning="Containerization simplifies deployment and ensures environment consistency.",
            )
        )
        return analysis_result

    @staticmethod
    def _add_fallback_insights(analysis_result: AnalysisResult) -> AnalysisResult:
        """Add system-generated insights if LLM did not provide any."""
        analysis_result.insights.append(
            InsightModel(
                type="general",
                category="analysis",
                title="Analysis Completeness",
                description="Analysis completed with available repository data",
                confidence=0.7,
                source="system_generated",
            )
        )
        return analysis_result

    @staticmethod
    def _ensure_field_completeness(analysis_result: AnalysisResult) -> AnalysisResult:
        """Ensure all critical fields are populated with explanations for null values."""

        # Ensure Technology Stack completeness
        tech_stack = analysis_result.technology_stack
        if not tech_stack.language:
            tech_stack.language = "unknown"
            analysis_result.insights.append(
                InsightModel(
                    type="explanation",
                    category="technology_stack",
                    title="Language Detection Limitation",
                    description="Unable to definitively determine primary programming language from available files",
                    confidence=0.7,
                    source="system_explanation",
                )
            )

        if not tech_stack.framework:
            tech_stack.framework = "unknown"
            analysis_result.insights.append(
                InsightModel(
                    type="explanation",
                    category="technology_stack",
                    title="Framework Detection Limitation",
                    description="No clear framework patterns detected in the codebase",
                    confidence=0.7,
                    source="system_explanation",
                )
            )

        # Ensure Dependency Analysis exists
        if not analysis_result.dependency_analysis:
            analysis_result.dependency_analysis = DependencyAnalysis()
            analysis_result.insights.append(
                InsightModel(
                    type="explanation",
                    category="dependencies",
                    title="Dependency Analysis Limitation",
                    description="No recognizable package management files found or parsed",
                    confidence=0.8,
                    source="system_explanation",
                )
            )

        # Ensure Code Analysis exists
        if not analysis_result.code_analysis:
            analysis_result.code_analysis = CodeAnalysis()
            analysis_result.insights.append(
                InsightModel(
                    type="explanation",
                    category="code_quality",
                    title="Code Analysis Limitation",
                    description="Insufficient code files available for comprehensive quality analysis",
                    confidence=0.8,
                    source="system_explanation",
                )
            )

        return analysis_result
