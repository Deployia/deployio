"""
LLM Enhancer - Intelligent enhancement of analysis results using AI
Provides smart insights and recommendations when rule-based analysis has low confidence
"""

import logging
import json  # noqa: F401
import asyncio  # noqa: F401
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from engines.core.models import (
    AnalysisResult,
    TechnologyStack,
)  # noqa: F401

logger = logging.getLogger(__name__)


@dataclass
class LLMEnhancementResult:
    """Result of LLM enhancement"""

    enhanced_stack: TechnologyStack
    confidence_boost: float
    reasoning: str
    additional_insights: List[str]
    recommendations: List[Dict[str, Any]]


class LLMEnhancer:
    """
    AI-powered analysis enhancer

    Features:
    - Smart technology detection
    - Architecture pattern recognition
    - Best practice recommendations
    - Confidence boosting for uncertain results
    """

    def __init__(self):
        self.enhancement_prompts = {
            "stack_detection": self._get_stack_detection_prompt(),
            "architecture_analysis": self._get_architecture_prompt(),
            "optimization_recommendations": self._get_optimization_prompt(),
        }

        # Fallback responses for when LLM is unavailable
        self.fallback_responses = {
            "node_js": {
                "framework": "Express.js",
                "recommendations": [
                    {
                        "type": "performance",
                        "suggestion": "Use PM2 for process management",
                    },
                    {
                        "type": "security",
                        "suggestion": "Implement helmet.js for security headers",
                    },
                    {
                        "type": "monitoring",
                        "suggestion": "Add structured logging with Winston",
                    },
                ],
            },
            "python": {
                "framework": "FastAPI",
                "recommendations": [
                    {
                        "type": "performance",
                        "suggestion": "Use Gunicorn with multiple workers",
                    },
                    {
                        "type": "security",
                        "suggestion": "Implement proper authentication and authorization",
                    },
                    {
                        "type": "monitoring",
                        "suggestion": "Add health checks and metrics endpoints",
                    },
                ],
            },
        }

        logger.info("LLMEnhancer initialized successfully")

    async def enhance_analysis(
        self,
        analysis_result: AnalysisResult,
        repository_files: Dict[str, str],
        enhancement_type: str = "comprehensive",
    ) -> LLMEnhancementResult:
        """
        Enhance analysis results using AI insights

        Args:
            analysis_result: Current analysis results
            repository_files: Repository file contents
            enhancement_type: Type of enhancement to perform

        Returns:
            LLMEnhancementResult: Enhanced analysis with AI insights
        """
        try:
            logger.info(
                f"Starting LLM enhancement for {analysis_result.repository_url}"
            )

            # For now, use rule-based enhancement as fallback
            # In production, this would integrate with actual LLM APIs
            enhanced_result = await self._rule_based_enhancement(
                analysis_result, repository_files
            )

            logger.info("LLM enhancement completed successfully")
            return enhanced_result

        except Exception as e:
            logger.error(f"LLM enhancement failed: {e}")
            # Return minimal enhancement to avoid breaking the flow
            return self._minimal_enhancement(analysis_result)

    async def _rule_based_enhancement(
        self, analysis_result: AnalysisResult, repository_files: Dict[str, str]
    ) -> LLMEnhancementResult:
        """
        Rule-based enhancement as fallback when LLM is unavailable
        """
        enhanced_stack = analysis_result.technology_stack
        confidence_boost = 0.0
        reasoning = "Rule-based enhancement applied"
        additional_insights = []
        recommendations = []

        # Detect primary language
        primary_language = enhanced_stack.language or self._detect_primary_language(
            repository_files
        )

        if primary_language:
            enhanced_stack.language = primary_language
            confidence_boost += 0.15

            # Add language-specific insights
            if primary_language.lower() == "javascript":
                insights, recs = self._enhance_javascript_analysis(repository_files)
                additional_insights.extend(insights)
                recommendations.extend(recs)

            elif primary_language.lower() == "python":
                insights, recs = self._enhance_python_analysis(repository_files)
                additional_insights.extend(insights)
                recommendations.extend(recs)

            elif primary_language.lower() == "java":
                insights, recs = self._enhance_java_analysis(repository_files)
                additional_insights.extend(insights)
                recommendations.extend(recs)

        # Detect missing framework information
        if not enhanced_stack.framework:
            framework = self._detect_framework(repository_files, primary_language)
            if framework:
                enhanced_stack.framework = framework
                confidence_boost += 0.10
                additional_insights.append(f"Detected {framework} framework")

        # Detect architecture patterns
        if not enhanced_stack.architecture_pattern:
            pattern = self._detect_architecture_pattern(repository_files)
            if pattern:
                enhanced_stack.architecture_pattern = pattern
                confidence_boost += 0.08
                additional_insights.append(f"Architecture pattern: {pattern}")

        # Add deployment recommendations
        deployment_recs = self._generate_deployment_recommendations(enhanced_stack)
        recommendations.extend(deployment_recs)

        return LLMEnhancementResult(
            enhanced_stack=enhanced_stack,
            confidence_boost=confidence_boost,
            reasoning=reasoning,
            additional_insights=additional_insights,
            recommendations=recommendations,
        )

    def _detect_primary_language(
        self, repository_files: Dict[str, str]
    ) -> Optional[str]:
        """Detect primary programming language from file extensions"""
        language_counts = {}

        for file_path in repository_files.keys():
            ext = file_path.split(".")[-1].lower()

            language_map = {
                "js": "JavaScript",
                "ts": "TypeScript",
                "py": "Python",
                "java": "Java",
                "php": "PHP",
                "go": "Go",
                "rb": "Ruby",
                "cs": "C#",
                "cpp": "C++",
                "c": "C",
            }

            if ext in language_map:
                lang = language_map[ext]
                language_counts[lang] = language_counts.get(lang, 0) + 1

        if language_counts:
            return max(language_counts, key=language_counts.get)
        return None

    def _enhance_javascript_analysis(
        self, repository_files: Dict[str, str]
    ) -> Tuple[List[str], List[Dict]]:
        """Enhance JavaScript/Node.js analysis"""
        insights = []
        recommendations = []

        # Check for package.json
        if "package.json" in repository_files or any(
            "package.json" in path for path in repository_files.keys()
        ):
            insights.append("Node.js project with package.json detected")
            recommendations.append(
                {
                    "type": "dependency_management",
                    "suggestion": "Consider using npm audit to check for vulnerabilities",
                    "priority": "high",
                }
            )

        # Check for React/Vue/Angular
        def safe_lower(val):
            return val.lower() if isinstance(val, str) else ""

        has_react = any(
            "react" in safe_lower(content) for content in repository_files.values()
        )
        has_vue = any(
            "vue" in safe_lower(content) for content in repository_files.values()
        )
        has_angular = any(
            "angular" in safe_lower(content) for content in repository_files.values()
        )

        if has_react:
            insights.append("React.js components detected")
            recommendations.append(
                {
                    "type": "build_optimization",
                    "suggestion": "Use React.StrictMode and consider code splitting",
                    "priority": "medium",
                }
            )

        if has_vue:
            insights.append("Vue.js components detected")
            recommendations.append(
                {
                    "type": "build_optimization",
                    "suggestion": "Use Vue CLI for optimal build configuration",
                    "priority": "medium",
                }
            )

        if has_angular:
            insights.append("Angular framework detected")
            recommendations.append(
                {
                    "type": "build_optimization",
                    "suggestion": "Use Angular CLI for production builds",
                    "priority": "medium",
                }
            )

        return insights, recommendations

    def _enhance_python_analysis(
        self, repository_files: Dict[str, str]
    ) -> Tuple[List[str], List[Dict]]:
        """Enhance Python analysis"""
        insights = []
        recommendations = []

        # Check for requirements.txt or setup.py
        has_requirements = any(
            "requirements.txt" in path for path in repository_files.keys()
        )
        has_setup = any("setup.py" in path for path in repository_files.keys())

        if has_requirements:
            insights.append("Python project with requirements.txt detected")
            recommendations.append(
                {
                    "type": "dependency_management",
                    "suggestion": "Pin dependency versions for reproducible builds",
                    "priority": "high",
                }
            )

        if has_setup:
            insights.append("Python package with setup.py detected")
            recommendations.append(
                {
                    "type": "packaging",
                    "suggestion": "Consider migrating to pyproject.toml for modern packaging",
                    "priority": "low",
                }
            )

        # Check for popular frameworks
        file_contents = " ".join(
            [
                str(val) if isinstance(val, str) else ""
                for val in repository_files.values()
            ]
        ).lower()

        if "django" in file_contents:
            insights.append("Django web framework detected")
            recommendations.append(
                {
                    "type": "deployment",
                    "suggestion": "Use Gunicorn with Django for production deployment",
                    "priority": "high",
                }
            )

        if "flask" in file_contents:
            insights.append("Flask web framework detected")
            recommendations.append(
                {
                    "type": "deployment",
                    "suggestion": "Use Gunicorn or uWSGI for production Flask deployment",
                    "priority": "high",
                }
            )

        if "fastapi" in file_contents:
            insights.append("FastAPI framework detected")
            recommendations.append(
                {
                    "type": "deployment",
                    "suggestion": "Use Uvicorn with multiple workers for FastAPI",
                    "priority": "high",
                }
            )

        return insights, recommendations

    def _enhance_java_analysis(
        self, repository_files: Dict[str, str]
    ) -> Tuple[List[str], List[Dict]]:
        """Enhance Java analysis"""
        insights = []
        recommendations = []

        # Check for build files
        has_maven = any("pom.xml" in path for path in repository_files.keys())
        has_gradle = any("build.gradle" in path for path in repository_files.keys())

        if has_maven:
            insights.append("Maven build system detected")
            recommendations.append(
                {
                    "type": "build_optimization",
                    "suggestion": "Use Maven wrapper for consistent builds across environments",
                    "priority": "medium",
                }
            )

        if has_gradle:
            insights.append("Gradle build system detected")
            recommendations.append(
                {
                    "type": "build_optimization",
                    "suggestion": "Use Gradle wrapper and consider build caching",
                    "priority": "medium",
                }
            )

        # Check for Spring framework
        file_contents = " ".join(
            [
                str(val) if isinstance(val, str) else ""
                for val in repository_files.values()
            ]
        ).lower()
        if "spring" in file_contents:
            insights.append("Spring framework detected")
            recommendations.append(
                {
                    "type": "deployment",
                    "suggestion": "Use Spring Boot for simplified deployment",
                    "priority": "high",
                }
            )

        return insights, recommendations

    def _detect_framework(
        self, repository_files: Dict[str, str], language: Optional[str]
    ) -> Optional[str]:
        """Detect web framework based on file contents"""
        if not language:
            return None

        file_contents = " ".join(repository_files.values()).lower()

        # JavaScript/TypeScript frameworks
        if language.lower() in ["javascript", "typescript"]:
            if "react" in file_contents:
                return "React"
            elif "vue" in file_contents:
                return "Vue.js"
            elif "angular" in file_contents:
                return "Angular"
            elif "express" in file_contents:
                return "Express.js"
            elif "next" in file_contents:
                return "Next.js"

        # Python frameworks
        elif language.lower() == "python":
            if "django" in file_contents:
                return "Django"
            elif "flask" in file_contents:
                return "Flask"
            elif "fastapi" in file_contents:
                return "FastAPI"

        # Java frameworks
        elif language.lower() == "java":
            if "spring" in file_contents:
                return "Spring Boot"

        return None

    def _detect_architecture_pattern(
        self, repository_files: Dict[str, str]
    ) -> Optional[str]:
        """Detect architecture pattern from project structure"""
        file_paths = list(repository_files.keys())

        # Check for common patterns
        has_controllers = any("controller" in path.lower() for path in file_paths)
        has_models = any("model" in path.lower() for path in file_paths)
        has_views = any("view" in path.lower() for path in file_paths)
        has_services = any("service" in path.lower() for path in file_paths)
        has_api = any("api" in path.lower() for path in file_paths)

        if has_controllers and has_models and has_views:
            return "Model-View-Controller (MVC)"
        elif has_api and has_services:
            return "Service-Oriented Architecture (SOA)"
        elif has_controllers and has_services:
            return "Layered Architecture"
        elif any("microservice" in path.lower() for path in file_paths):
            return "Microservices"

        return None

    def _generate_deployment_recommendations(
        self, stack: TechnologyStack
    ) -> List[Dict[str, Any]]:
        """Generate deployment recommendations based on technology stack"""
        recommendations = []

        # Language-specific recommendations
        if stack.language:
            lang = stack.language.lower()

            if lang == "javascript":
                recommendations.append(
                    {
                        "type": "deployment",
                        "suggestion": "Use Node.js runtime with PM2 for process management",
                        "priority": "high",
                    }
                )
            elif lang == "python":
                recommendations.append(
                    {
                        "type": "deployment",
                        "suggestion": "Use Python 3.9+ with virtual environment",
                        "priority": "high",
                    }
                )
            elif lang == "java":
                recommendations.append(
                    {
                        "type": "deployment",
                        "suggestion": "Use OpenJDK 11+ with proper JVM tuning",
                        "priority": "high",
                    }
                )

        # Framework-specific recommendations
        if stack.framework:
            recommendations.append(
                {
                    "type": "containerization",
                    "suggestion": f"Consider Docker containerization for {stack.framework}",
                    "priority": "medium",
                }
            )

        # Database recommendations
        if stack.database:
            recommendations.append(
                {
                    "type": "database",
                    "suggestion": f"Ensure {stack.database} is properly configured for production",
                    "priority": "high",
                }
            )

        # General recommendations
        recommendations.extend(
            [
                {
                    "type": "monitoring",
                    "suggestion": "Implement health checks and monitoring",
                    "priority": "high",
                },
                {
                    "type": "security",
                    "suggestion": "Enable HTTPS and security headers",
                    "priority": "high",
                },
                {
                    "type": "performance",
                    "suggestion": "Implement caching strategy",
                    "priority": "medium",
                },
            ]
        )

        return recommendations

    def _minimal_enhancement(
        self, analysis_result: AnalysisResult
    ) -> LLMEnhancementResult:
        """Minimal enhancement when LLM enhancement fails"""
        return LLMEnhancementResult(
            enhanced_stack=analysis_result.technology_stack,
            confidence_boost=0.0,
            reasoning="LLM enhancement unavailable, using original analysis",
            additional_insights=["Analysis completed using rule-based detection"],
            recommendations=[
                {
                    "type": "general",
                    "suggestion": "Review deployment configuration for production readiness",
                    "priority": "medium",
                }
            ],
        )

    def _get_stack_detection_prompt(self) -> str:
        """Get prompt for stack detection enhancement"""
        return """
        Analyze the provided repository files and enhance the technology stack detection:
        
        1. Identify the primary programming language and framework
        2. Detect database systems and deployment tools
        3. Identify architecture patterns
        4. Provide confidence scores for each detection
        5. Suggest improvements for uncertain detections
        """

    def _get_architecture_prompt(self) -> str:
        """Get prompt for architecture analysis"""
        return """
        Analyze the repository structure and code to identify:
        
        1. Architecture patterns (MVC, SOA, Microservices, etc.)
        2. Design patterns used
        3. Code organization and modularity
        4. Potential architectural improvements
        """

    def _get_optimization_prompt(self) -> str:
        """Get prompt for optimization recommendations"""
        return """
        Based on the technology stack and code analysis, provide:
        
        1. Performance optimization recommendations
        2. Security best practices
        3. Deployment strategy improvements
        4. Monitoring and logging suggestions
        5. Scalability considerations
        """

    async def health_check(self) -> Dict[str, str]:
        """Check if LLM enhancer is healthy"""
        try:
            # In production, this would check LLM API availability
            return {"llm_enhancer": "healthy", "mode": "rule_based_fallback"}
        except Exception as e:
            return {"llm_enhancer": "error", "error": str(e)}

    @property
    def is_available(self) -> bool:
        """Indicates if the LLM enhancer is available (health check passes)."""
        # Synchronous property for health; always returns True for now
        return True
