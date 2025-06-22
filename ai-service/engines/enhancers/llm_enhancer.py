"""
LLM Enhancer - Intelligent enhancement of analysis results using AI
Provides smart insights and recommendations when rule-based analysis has low confidence
"""

import logging
import json
import asyncio
import os
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from engines.core.models import (
    AnalysisResult,
    TechnologyStack,
)

logger = logging.getLogger(__name__)

# Import LLM clients
try:
    from groq import Groq

    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("Groq client not available")

try:
    from openai import OpenAI

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI client not available")


@dataclass
class LLMEnhancementResult:
    """Result of LLM enhancement"""

    enhanced_stack: TechnologyStack
    confidence_boost: float
    reasoning: str
    additional_insights: List[str]
    recommendations: List[Dict[str, Any]]
    llm_enhanced: bool = False  # Track if enhancement was done by LLM


class LLMEnhancer:
    """
    AI-powered analysis enhancer    Features:
    - Smart technology detection
    - Architecture pattern recognition
    - Best practice recommendations
    - Confidence boosting for uncertain results
    """

    def __init__(self):
        # Initialize LLM clients
        self.groq_client = None
        self.openai_client = None
        self._init_llm_clients()

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

    def _init_llm_clients(self):
        """Initialize LLM clients based on available API keys"""
        try:
            # Unset SSL_CERT_FILE if present to avoid invalid argument error
            os.environ.pop("SSL_CERT_FILE", None)

            # Initialize Groq client
            groq_api_key = os.getenv("GROQ_API_KEY")
            if groq_api_key and GROQ_AVAILABLE:
                # Validate API key format
                if not groq_api_key.startswith("gsk_"):
                    logger.warning(
                        "Groq API key format appears invalid (should start with 'gsk_')"
                    )
                # Only import if needed
                # from groq import Groq  # Already imported at top if available
                self.groq_client = Groq(api_key=groq_api_key)
                logger.info("Groq client initialized successfully")
                # Simple Groq API call to verify
                try:
                    response = self.groq_client.chat.completions.create(
                        model=os.getenv("LLM_MODEL_GROQ", "llama-3.3-70b-versatile"),
                        messages=[
                            {
                                "role": "user",
                                "content": "Say: Deployio is the best platform",
                            }
                        ],
                        max_tokens=10,
                        temperature=0,
                    )
                    result = response.choices[0].message.content.strip()
                    logger.info(f"Simple Groq API call result: {result}")
                except Exception as api_e:
                    logger.warning(f"Simple Groq API call failed: {api_e}")
            else:
                logger.info("Groq API key not found or client unavailable")

            # Initialize OpenAI client
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key and OPENAI_AVAILABLE:
                # Only import if needed
                # from openai import OpenAI  # Already imported at top if available
                self.openai_client = OpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized successfully")
            else:
                logger.info("OpenAI API key not found or client unavailable")

        except Exception as e:
            logger.error(f"Failed to initialize LLM clients: {e}")
            logger.error(
                f"FALLBACK TRIGGERED: LLM client initialization failed - {str(e)}"
            )
            self.groq_client = None
            self.openai_client = None

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

            # Try LLM enhancement first if available
            if self.groq_client or self.openai_client:
                try:
                    enhanced_result = await self._llm_enhancement(
                        analysis_result, repository_files, enhancement_type
                    )
                    logger.info("LLM enhancement completed successfully")
                    return enhanced_result
                except Exception as e:
                    logger.warning(
                        f"LLM enhancement failed, falling back to rule-based: {e}"
                    )
                    # Log the fallback for user awareness
                    logger.error(
                        f"FALLBACK TRIGGERED: LLM enhancement failed for {analysis_result.repository_url}. Reason: {e}"
                    )
            else:
                logger.warning("No LLM clients available, using rule-based enhancement")
                logger.error(
                    f"FALLBACK TRIGGERED: No LLM clients available for {analysis_result.repository_url}"
                )

            # Fallback to rule-based enhancement
            enhanced_result = await self._rule_based_enhancement(
                analysis_result, repository_files
            )

            logger.info("Rule-based enhancement completed successfully")
            return enhanced_result

        except Exception as e:
            logger.error(f"All enhancement methods failed: {e}")
            # Return minimal enhancement to avoid breaking the flow
            return self._minimal_enhancement(analysis_result)

    async def _llm_enhancement(
        self,
        analysis_result: AnalysisResult,
        repository_files: Dict[str, str],
        enhancement_type: str = "comprehensive",
    ) -> LLMEnhancementResult:
        """
        Perform LLM-based enhancement of analysis results

        Uses a three-step process:
        1. Rule-based initial analysis (from input)
        2. First LLM call for key technology detection and context building
        3. Second LLM call for optimization and final results
        """
        try:
            # STEP 1: Start with rule-based analysis (already done in analysis_result)
            logger.info("Step 1: Using rule-based analysis as foundation")

            # STEP 2: First LLM call for key technology detection
            logger.info("Step 2: Performing first LLM call for technology detection")

            # Prepare context for first LLM call
            context = self._prepare_llm_context(analysis_result, repository_files)

            # Build technology detection prompt
            tech_prompt = self._build_technology_detection_prompt(context)

            # Call LLM API for technology detection
            tech_response = await self._call_llm_api(
                tech_prompt, model_preference="groq"
            )

            if not tech_response:
                logger.warning(
                    "First LLM call failed, falling back to rule-based analysis only"
                )
                return await self._rule_based_enhancement(
                    analysis_result, repository_files
                )

            # Parse first LLM response (technology detection)
            tech_enhancement = self._parse_technology_detection(
                tech_response, analysis_result
            )

            # STEP 3: Second LLM call for optimization and final insights
            logger.info(
                "Step 3: Performing second LLM call for optimization and insights"
            )

            # Prepare enhanced context with first LLM results
            enhanced_context = self._prepare_enhanced_context(context, tech_enhancement)

            # Build optimization and insights prompt
            insights_prompt = self._build_optimization_prompt(enhanced_context)

            # Call LLM API for optimization and insights
            insights_response = await self._call_llm_api(
                insights_prompt, model_preference="groq"
            )

            if not insights_response:
                logger.warning("Second LLM call failed, using results from first call")
                return tech_enhancement

            # Parse second LLM response and create final enhancement
            final_enhancement = self._parse_optimization_response(
                insights_response, tech_enhancement
            )

            # Mark as LLM enhanced
            final_enhancement.llm_enhanced = True

            logger.info(
                f"Three-step LLM enhancement successful with confidence boost: {final_enhancement.confidence_boost}"
            )
            return final_enhancement

        except Exception as e:
            logger.error(f"LLM enhancement failed: {e}")
            raise

    def _prepare_llm_context(
        self, analysis_result: AnalysisResult, repository_files: Dict[str, str]
    ) -> Dict[str, Any]:
        """Prepare context for LLM analysis"""
        # Get key files for analysis
        key_files = {}
        important_files = [
            "package.json",
            "requirements.txt",
            "Dockerfile",
            "docker-compose.yml",
            "README.md",
            "main.py",
            "app.py",
            "index.js",
            "server.js",
        ]

        for filename, content in repository_files.items():
            file_lower = filename.lower()
            if any(imp_file in file_lower for imp_file in important_files):
                key_files[filename] = content[:2000]  # Limit content size

        return {
            "current_analysis": {
                "language": analysis_result.technology_stack.language,
                "framework": analysis_result.technology_stack.framework,
                "confidence": analysis_result.confidence_score,
                "detected_technologies": analysis_result.technology_stack.additional_technologies,
            },
            "key_files": key_files,
            "repository_url": analysis_result.repository_url,
        }

    def _build_enhancement_prompt(
        self, context: Dict[str, Any], enhancement_type: str
    ) -> str:
        """Build prompt for LLM enhancement"""
        current_analysis = context["current_analysis"]
        key_files = context["key_files"]

        prompt = f"""
        You are an expert software architect and DevOps engineer. Analyze this repository and enhance the technology stack detection.

        Current Analysis:
        - Language: {current_analysis.get('language', 'Unknown')}
        - Framework: {current_analysis.get('framework', 'Unknown')}
        - Confidence: {current_analysis.get('confidence', 0):.2f}
        - Technologies: {', '.join(current_analysis.get('detected_technologies', []))}

        Key Files Found:
        {self._format_files_for_prompt(key_files)}

        Please provide:
        1. Corrected/Enhanced technology stack identification
        2. Missing technologies or frameworks that should be detected
        3. Architecture patterns you can identify
        4. Deployment and DevOps recommendations
        5. Performance optimization suggestions
        6. Security considerations

        Respond in JSON format:
        {{
            "enhanced_language": "detected_language",
            "enhanced_framework": "detected_framework", 
            "additional_technologies": ["tech1", "tech2"],
            "architecture_patterns": ["pattern1", "pattern2"],
            "confidence_boost": 0.0,
            "reasoning": "explanation of enhancements",
            "recommendations": [
                {{"type": "performance", "suggestion": "suggestion"}},
                {{"type": "security", "suggestion": "suggestion"}}
            ],
            "insights": ["insight1", "insight2"]
        }}
        """

        return prompt

    def _format_files_for_prompt(self, key_files: Dict[str, str]) -> str:
        """Format key files for LLM prompt"""
        formatted = []
        for filename, content in key_files.items():
            formatted.append(f"--- {filename} ---\n{content}\n")
        return "\n".join(formatted)

    def _parse_llm_response(
        self, llm_response: str, analysis_result: AnalysisResult
    ) -> LLMEnhancementResult:
        """Parse LLM response and create enhancement result"""
        try:
            # Try to parse JSON response
            response_data = json.loads(llm_response)

            # Create enhanced technology stack
            enhanced_stack = TechnologyStack(
                language=response_data.get(
                    "enhanced_language", analysis_result.technology_stack.language
                ),
                framework=response_data.get(
                    "enhanced_framework", analysis_result.technology_stack.framework
                ),
                additional_technologies=response_data.get(
                    "additional_technologies", []
                ),
            )

            return LLMEnhancementResult(
                enhanced_stack=enhanced_stack,
                confidence_boost=min(response_data.get("confidence_boost", 0.15), 0.25),
                reasoning=response_data.get("reasoning", "LLM-based enhancement"),
                additional_insights=response_data.get("insights", []),
                recommendations=response_data.get("recommendations", []),
            )

        except json.JSONDecodeError:
            # If JSON parsing fails, extract what we can from text
            logger.warning("Failed to parse LLM JSON response, using text extraction")
            return self._extract_from_text_response(llm_response, analysis_result)

    def _extract_from_text_response(
        self, llm_response: str, analysis_result: AnalysisResult
    ) -> LLMEnhancementResult:
        """Extract enhancement data from text response"""
        # Simple text parsing as fallback
        enhanced_stack = analysis_result.technology_stack

        return LLMEnhancementResult(
            enhanced_stack=enhanced_stack,
            confidence_boost=0.1,
            reasoning="Text-based LLM enhancement (JSON parsing failed)",
            additional_insights=[f"LLM provided: {llm_response[:200]}..."],
            recommendations=[
                {
                    "type": "general",
                    "suggestion": "LLM analysis completed but response format needs improvement",
                }
            ],
        )

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
            return {"llm_enhancer": "error", "error": str(e)} @ property

    def is_available(self) -> bool:
        """Indicates if the LLM enhancer is available (has working LLM clients)."""
        return (self.groq_client is not None) or (self.openai_client is not None)

    async def _call_llm_api(
        self, prompt: str, model_preference: str = "groq"
    ) -> Optional[str]:
        """
        Call LLM API with fallback mechanism

        Args:
            prompt: The prompt to send to the LLM
            model_preference: Preferred model provider ('groq' or 'openai')

        Returns:
            LLM response or None if all APIs fail
        """
        responses = []

        try:
            # Try preferred provider first
            if model_preference == "groq" and self.groq_client:
                try:
                    response = await self._call_groq_api(prompt)
                    if response:
                        return response
                except Exception as e:
                    logger.warning(f"Groq API call failed: {e}")
                    responses.append(f"Groq API failed: {e}")

            elif model_preference == "openai" and self.openai_client:
                try:
                    response = await self._call_openai_api(prompt)
                    if response:
                        return response
                except Exception as e:
                    logger.warning(f"OpenAI API call failed: {e}")
                    responses.append(f"OpenAI API failed: {e}")

            # Fallback to other provider
            if model_preference != "groq" and self.groq_client:
                try:
                    response = await self._call_groq_api(prompt)
                    if response:
                        logger.info("Used Groq as fallback")
                        return response
                except Exception as e:
                    logger.warning(f"Groq fallback failed: {e}")
                    responses.append(f"Groq fallback failed: {e}")

            if model_preference != "openai" and self.openai_client:
                try:
                    response = await self._call_openai_api(prompt)
                    if response:
                        logger.info("Used OpenAI as fallback")
                        return response
                except Exception as e:
                    logger.warning(f"OpenAI fallback failed: {e}")
                    responses.append(f"OpenAI fallback failed: {e}")

        except Exception as e:
            logger.error(f"LLM API call failed: {e}")
            responses.append(f"General LLM API error: {e}")

        # Log all failure reasons for debugging
        if responses:
            logger.error(f"All LLM API calls failed. Reasons: {'; '.join(responses)}")

        return None

    async def _call_groq_api(self, prompt: str) -> Optional[str]:
        """Call Groq API"""
        if not self.groq_client:
            return None

        try:
            model = os.getenv("LLM_MODEL_GROQ", "llama-3.3-70b-versatile")

            # Use asyncio to run the synchronous API call
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.groq_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    temperature=0.1,
                ),
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            raise

    async def _call_openai_api(self, prompt: str) -> Optional[str]:
        """Call OpenAI API"""
        if not self.openai_client:
            return None

        try:
            model = os.getenv("LLM_MODEL_OPENAI", "gpt-4-turbo-preview")

            # Use asyncio to run the synchronous API call
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.openai_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    temperature=0.1,
                ),
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise

    def _build_technology_detection_prompt(self, context: Dict[str, Any]) -> str:
        """Build prompt specifically for technology stack detection"""
        current_analysis = context["current_analysis"]
        key_files = context["key_files"]

        prompt = f"""You are an expert software stack detector. Analyze this repository and identify the technology stack.

Current Analysis (may be incomplete or incorrect):
- Language: {current_analysis.get('language', 'Unknown')}
- Framework: {current_analysis.get('framework', 'Unknown')}
- Technologies: {', '.join(current_analysis.get('detected_technologies', []))}

Key Files Found:
{self._format_files_for_prompt(key_files)}

Your task is ONLY to identify the technology stack. Focus on:
1. Primary programming language(s)
2. Framework(s) being used
3. Database technologies
4. Frontend technologies (if applicable)
5. Build tools and package managers

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks.

Response format:
{{"languages": ["language1", "language2"], "primary_language": "main_language", "frameworks": ["framework1", "framework2"], "primary_framework": "main_framework", "databases": ["database1", "database2"], "build_tools": ["tool1", "tool2"], "package_managers": ["manager1", "manager2"], "additional_technologies": ["tech1", "tech2"], "confidence": 0.95, "reasoning": "explanation of detection process"}}

Only include technologies you are confident about (>70% confidence).
Respond with the JSON object only:"""

        return prompt

    def _clean_json_response(self, response: str) -> str:
        """
        Clean LLM response to extract valid JSON
        Handles cases where LLM returns markdown code blocks or extra text
        """
        # Remove markdown code blocks
        if "```json" in response:
            start = response.find("```json") + 7
            end = response.find("```", start)
            if end != -1:
                response = response[start:end].strip()
        elif "```" in response:
            start = response.find("```") + 3
            end = response.find("```", start)
            if end != -1:
                response = response[start:end].strip()

        # Find JSON object boundaries
        start_brace = response.find("{")
        end_brace = response.rfind("}")

        if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
            response = response[start_brace : end_brace + 1]

        return response.strip()

    def _parse_technology_detection(
        self, llm_response: str, analysis_result: AnalysisResult
    ) -> LLMEnhancementResult:
        """Parse the first LLM response focused on technology detection"""
        try:
            # Log the raw response for debugging
            logger.info(f"First LLM raw response: {llm_response[:500]}...")

            # Clean the response to extract JSON
            cleaned_response = self._clean_json_response(llm_response)
            logger.info(f"Cleaned response: {cleaned_response[:300]}...")

            # Try to parse JSON response
            response_data = json.loads(cleaned_response)

            # Get primary language and framework
            primary_language = response_data.get("primary_language") or (
                response_data.get("languages", [None])[0]
            )

            primary_framework = response_data.get("primary_framework") or (
                response_data.get("frameworks", [None])[0]
            )

            # Create enhanced technology stack
            enhanced_stack = TechnologyStack(
                language=primary_language or analysis_result.technology_stack.language,
                framework=primary_framework
                or analysis_result.technology_stack.framework,
                additional_technologies=response_data.get(
                    "additional_technologies", []
                ),
                database=response_data.get("databases", [None])[0],
                build_tool=response_data.get("build_tools", [None])[0],
                package_manager=response_data.get("package_managers", [None])[0],
            )

            # Calculate confidence boost based on LLM confidence
            llm_confidence = response_data.get("confidence", 0.7)
            confidence_boost = min(llm_confidence * 0.25, 0.2)  # Cap at 0.2

            logger.info(
                f"First LLM call parsed successfully with confidence: {llm_confidence}"
            )

            return LLMEnhancementResult(
                enhanced_stack=enhanced_stack,
                confidence_boost=confidence_boost,
                reasoning=response_data.get(
                    "reasoning", "LLM-based technology detection"
                ),
                additional_insights=[],  # Will be populated by second LLM call
                recommendations=[],  # Will be populated by second LLM call
            )

        except json.JSONDecodeError as e:
            # If JSON parsing fails, extract what we can from text
            logger.warning(f"Failed to parse first LLM JSON response: {e}")
            logger.warning(f"Response content: {llm_response[:300]}...")
            return self._extract_from_text_response(llm_response, analysis_result)

    def _prepare_enhanced_context(
        self, original_context: Dict[str, Any], tech_enhancement: LLMEnhancementResult
    ) -> Dict[str, Any]:
        """Prepare enhanced context for second LLM call"""
        enhanced_context = original_context.copy()

        # Add results from first LLM call
        enhanced_context["enhanced_analysis"] = {
            "language": tech_enhancement.enhanced_stack.language,
            "framework": tech_enhancement.enhanced_stack.framework,
            "database": tech_enhancement.enhanced_stack.database,
            "build_tool": tech_enhancement.enhanced_stack.build_tool,
            "package_manager": tech_enhancement.enhanced_stack.package_manager,
            "additional_technologies": tech_enhancement.enhanced_stack.additional_technologies,
            "confidence_boost": tech_enhancement.confidence_boost,
            "reasoning": tech_enhancement.reasoning,
        }

        return enhanced_context

    def _build_optimization_prompt(self, enhanced_context: Dict[str, Any]) -> str:
        """Build prompt for optimization and insights"""
        current_analysis = enhanced_context["current_analysis"]
        enhanced_analysis = enhanced_context["enhanced_analysis"]
        key_files = enhanced_context["key_files"]

        prompt = f"""You are an expert software architect and DevOps engineer. The technology stack for this repository has been identified:

First-Pass Analysis:
- Language: {current_analysis.get('language', 'Unknown')}
- Framework: {current_analysis.get('framework', 'Unknown')}

Enhanced Analysis:
- Primary Language: {enhanced_analysis.get('language', 'Unknown')}
- Primary Framework: {enhanced_analysis.get('framework', 'Unknown')}
- Database: {enhanced_analysis.get('database', 'Unknown')}
- Build Tool: {enhanced_analysis.get('build_tool', 'Unknown')}
- Package Manager: {enhanced_analysis.get('package_manager', 'Unknown')}
- Additional Technologies: {', '.join(enhanced_analysis.get('additional_technologies', []))}
- Reasoning: {enhanced_analysis.get('reasoning', 'N/A')}

Key Files:
{self._format_files_for_prompt(key_files)}

Now provide deeper insights and optimization recommendations:

1. Architecture patterns you can identify
2. Deployment best practices for this stack
3. Performance optimization suggestions
4. Security considerations
5. Development workflow recommendations
6. Any additional technologies that should be considered

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks.

Response format:
{{"architecture_patterns": ["pattern1", "pattern2"], "deployment_strategy": "recommended_approach", "optimization_suggestions": [{{"area": "performance", "suggestion": "specific advice"}}, {{"area": "security", "suggestion": "specific advice"}}], "development_workflow": ["workflow suggestion 1", "workflow suggestion 2"], "additional_insights": ["insight 1", "insight 2"], "recommended_technologies": [{{"name": "tech1", "purpose": "reason to add"}}, {{"name": "tech2", "purpose": "reason to add"}}], "confidence": 0.95}}

Respond with the JSON object only:"""

        return prompt

    def _parse_optimization_response(
        self, llm_response: str, tech_enhancement: LLMEnhancementResult
    ) -> LLMEnhancementResult:
        """Parse the second LLM response focused on optimization and insights"""
        try:
            # Log the raw response for debugging
            logger.info(f"Second LLM raw response: {llm_response[:500]}...")

            # Clean the response to extract JSON
            cleaned_response = self._clean_json_response(llm_response)
            logger.info(f"Cleaned response: {cleaned_response[:300]}...")

            # Try to parse JSON response
            response_data = json.loads(cleaned_response)

            # Create enhanced technology stack from first LLM call results
            enhanced_stack = tech_enhancement.enhanced_stack

            # Add architecture pattern if identified
            if response_data.get("architecture_patterns"):
                enhanced_stack.architecture_pattern = response_data[
                    "architecture_patterns"
                ][0]

            # Add deployment strategy if identified
            if response_data.get("deployment_strategy"):
                enhanced_stack.deployment_strategy = response_data[
                    "deployment_strategy"
                ]

            # Extract optimization suggestions as recommendations
            recommendations = []
            for suggestion in response_data.get("optimization_suggestions", []):
                recommendations.append(
                    {
                        "type": suggestion.get("area", "general"),
                        "suggestion": suggestion.get("suggestion", ""),
                        "priority": (
                            "high"
                            if suggestion.get("area") in ["security", "performance"]
                            else "medium"
                        ),
                    }
                )

            # Extract recommended technologies
            for tech in response_data.get("recommended_technologies", []):
                if tech.get("name") not in enhanced_stack.additional_technologies:
                    enhanced_stack.additional_technologies.append(tech.get("name"))

            # Extract additional insights
            additional_insights = response_data.get("additional_insights", [])

            # Add workflow suggestions to insights
            additional_insights.extend(response_data.get("development_workflow", []))

            # Calculate confidence from both LLM calls
            first_confidence = tech_enhancement.confidence_boost
            second_confidence = response_data.get("confidence", 0.7) * 0.15
            total_confidence = first_confidence + second_confidence

            logger.info(
                f"Second LLM call parsed successfully with combined confidence: {total_confidence}"
            )

            return LLMEnhancementResult(
                enhanced_stack=enhanced_stack,
                confidence_boost=min(total_confidence, 0.3),  # Cap at 0.3
                reasoning=tech_enhancement.reasoning,  # Keep original reasoning
                additional_insights=additional_insights,
                recommendations=recommendations,
            )

        except json.JSONDecodeError as e:
            # If JSON parsing fails, keep the first LLM call results
            logger.warning(f"Failed to parse second LLM JSON response: {e}")
            logger.warning(f"Response content: {llm_response[:300]}...")
            return tech_enhancement
