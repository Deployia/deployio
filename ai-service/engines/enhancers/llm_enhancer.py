"""
Simplified LLM Enhancer - Focused on orchestrating enhancement process
Uses modular LLM services for clean separation of concerns
"""

import logging
from typing import Dict, Optional, Any

from engines.core.models import AnalysisResult, TechnologyStack, LLMEnhancementResult
from engines.core.llm import LLMClientManager, LLMAPIClient, LLMRequest, LLMProvider
from engines.core.llm.response_parser import LLMResponseParser
from .prompt_templates import PromptTemplates

logger = logging.getLogger(__name__)


class LLMEnhancer:
    """
    Simplified LLM Enhancer focused on orchestration

    Responsibilities:
    - Orchestrate the three-step enhancement process
    - Coordinate between different LLM services
    - Merge enhancement results with original analysis
    - Calculate confidence boosts

    NOT responsible for:
    - LLM client management (delegated to LLMClientManager)
    - API calls (delegated to LLMAPIClient)
    - Response parsing (delegated to LLMResponseParser)
    - Prompt generation (delegated to PromptTemplates)
    """

    def __init__(self):
        # Initialize modular LLM services
        self.client_manager = LLMClientManager()
        self.api_client = LLMAPIClient(self.client_manager)
        self.prompt_templates = PromptTemplates()
        self.response_parser = LLMResponseParser()

        # Configuration
        self.max_tokens = 4000
        self.temperature = 0.1

        logger.info("LLMEnhancer initialized with modular services")

    @property
    def is_available(self) -> bool:
        """Check if any LLM providers are available for enhancement."""
        return bool(self.client_manager.get_available_providers())

    async def enhance_analysis(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        enhancement_type: str = "comprehensive",
    ) -> LLMEnhancementResult:
        """
        Main entry point for LLM enhancement

        Args:
            analysis_result: Current analysis results
            repository_data: Full repository data structure from GitHub client
            enhancement_type: Type of enhancement (three_step, comprehensive, etc.)        Returns:
            LLMEnhancementResult with enhanced analysis
        """
        try:
            logger.info(
                f"Starting modular LLM enhancement for {analysis_result.repository_url}"
            )

            # Extract repository files from repository_data structure
            repository_files = (
                repository_data.get("key_files", {}) if repository_data else {}
            )

            # Check if LLM services are available
            if not self.client_manager.get_available_providers():
                logger.warning(
                    "No LLM providers available, falling back to rule-based enhancement"
                )
                logger.error(
                    f"FALLBACK TRIGGERED: No LLM providers available for {analysis_result.repository_url}"
                )
                return await self._rule_based_enhancement(
                    analysis_result, repository_files
                )

            # Choose enhancement strategy
            if enhancement_type == "three_step":
                enhanced_result = await self._three_step_enhancement(
                    analysis_result, repository_files
                )
            elif enhancement_type == "comprehensive":
                enhanced_result = await self._comprehensive_enhancement(
                    analysis_result, repository_files
                )
            else:
                logger.warning(
                    f"Unknown enhancement type: {enhancement_type}, using three_step"
                )
                enhanced_result = await self._three_step_enhancement(
                    analysis_result, repository_files
                )

            # Mark as LLM enhanced if successful
            if enhanced_result:
                enhanced_result.llm_enhanced = True
                logger.info(
                    f"LLM enhancement completed successfully with confidence boost: {enhanced_result.confidence_boost}"
                )
                return enhanced_result
            else:
                logger.warning("LLM enhancement failed, falling back to rule-based")
                return await self._rule_based_enhancement(
                    analysis_result, repository_files
                )

        except Exception as e:
            logger.error(f"LLM enhancement failed: {e}")
            logger.error(
                f"FALLBACK TRIGGERED: LLM enhancement exception for {analysis_result.repository_url} - {str(e)}"
            )
            return await self._rule_based_enhancement(analysis_result, repository_files)

    async def _three_step_enhancement(
        self, analysis_result: AnalysisResult, repository_files: Dict[str, str]
    ) -> Optional[LLMEnhancementResult]:
        """
        Three-step enhancement process:
        1. Rule-based foundation (already done)
        2. LLM technology detection
        3. LLM optimization and insights
        """
        try:
            logger.info("Starting three-step LLM enhancement process")

            # STEP 1: Use existing rule-based analysis as foundation
            logger.info("Step 1: Using rule-based analysis as foundation")

            # STEP 2: LLM technology detection
            logger.info("Step 2: LLM technology detection")
            tech_data = await self._detect_technologies(
                analysis_result, repository_files
            )
            if not tech_data:
                logger.warning("Technology detection failed")
                return None

            # STEP 3: LLM optimization and insights
            logger.info("Step 3: LLM optimization and insights")
            optimization_data = await self._generate_optimization_insights(
                analysis_result, tech_data
            )
            if not optimization_data:
                logger.warning("Optimization insights generation failed")
                # Still return tech detection results
                return self._create_enhancement_result(analysis_result, tech_data, {})

            # Combine results
            final_result = self._create_enhancement_result(
                analysis_result, tech_data, optimization_data
            )
            logger.info("Three-step enhancement completed successfully")
            return final_result

        except Exception as e:
            logger.error(f"Three-step enhancement failed: {e}")
            return None

    async def _comprehensive_enhancement(
        self, analysis_result: AnalysisResult, repository_files: Dict[str, str]
    ) -> Optional[LLMEnhancementResult]:
        """
        Comprehensive enhancement in a single LLM call
        """
        try:
            logger.info("Starting comprehensive LLM enhancement")

            # Prepare context
            context = self._prepare_analysis_context(analysis_result, repository_files)

            # Generate comprehensive prompt
            prompt = self.prompt_templates.get_comprehensive_analysis_prompt(context)

            # Make LLM request
            request = LLMRequest(
                prompt=prompt,
                model=self.client_manager.config.groq_model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                provider_preference=LLMProvider.GROQ,
            )

            response = await self.api_client.call_llm(request)
            if not response or not response.success:
                logger.error("Comprehensive analysis LLM call failed")
                return None

            # Parse comprehensive response
            parsed_data = self.response_parser.parse_comprehensive_response(
                response.content
            )

            # Create result
            result = self._create_comprehensive_result(analysis_result, parsed_data)
            logger.info("Comprehensive enhancement completed successfully")
            return result

        except Exception as e:
            logger.error(f"Comprehensive enhancement failed: {e}")
            return None

    async def _detect_technologies(
        self, analysis_result: AnalysisResult, repository_files: Dict[str, str]
    ) -> Optional[Dict[str, Any]]:
        """Technology detection using LLM"""
        try:
            # Prepare context
            context = self._prepare_analysis_context(analysis_result, repository_files)

            # Generate technology detection prompt
            prompt = self.prompt_templates.get_technology_detection_prompt(context)

            # Make LLM request
            request = LLMRequest(
                prompt=prompt,
                model=self.client_manager.config.groq_model,
                max_tokens=2000,
                temperature=self.temperature,
                provider_preference=LLMProvider.GROQ,
            )

            response = await self.api_client.call_llm(request)
            if not response or not response.success:
                logger.error("Technology detection LLM call failed")
                return None

            # Parse technology detection response
            fallback_data = {
                "language": analysis_result.technology_stack.language,
                "framework": analysis_result.technology_stack.framework,
                "confidence": analysis_result.confidence_score,
            }

            tech_data = self.response_parser.parse_technology_detection(
                response.content, fallback_data
            )

            # logger.debug(
            #     f"Technology detection successful: {tech_data.get('language')} / {tech_data.get('framework')}"
            # )
            return tech_data

        except Exception as e:
            logger.error(f"Technology detection failed: {e}")
            return None

    async def _generate_optimization_insights(
        self, analysis_result: AnalysisResult, tech_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generate optimization insights using LLM"""
        try:
            # Prepare enhanced context
            context = {
                "technology_data": tech_data,
                "original_analysis": {
                    "confidence": analysis_result.confidence_score,
                    "detected_files": analysis_result.detected_files,
                },
            }

            # Generate optimization prompt
            prompt = self.prompt_templates.get_optimization_prompt(context)

            # Make LLM request
            request = LLMRequest(
                prompt=prompt,
                model=self.client_manager.config.groq_model,
                max_tokens=2000,
                temperature=self.temperature,
                provider_preference=LLMProvider.GROQ,
            )

            response = await self.api_client.call_llm(request)
            if not response or not response.success:
                logger.error("Optimization insights LLM call failed")
                return None  # Parse optimization response
            optimization_data = self.response_parser.parse_optimization_response(
                response.content
            )

            # logger.debug(
            #     f"Optimization insights generated: {len(optimization_data.get('recommendations', []))} recommendations"
            # )
            return optimization_data
        except Exception as e:
            logger.error(f"Optimization insights generation failed: {e}")
            return None

    def _prepare_analysis_context(
        self, analysis_result: AnalysisResult, repository_files: Dict[str, str]
    ) -> Dict[str, Any]:
        """Prepare comprehensive context for LLM analysis with all analyzer results"""
        # Get important files (extended list)
        key_files = {}
        important_files = [
            "package.json",
            "requirements.txt",
            "pyproject.toml",
            "pipfile",
            "pom.xml",
            "build.gradle",
            "composer.json",
            "cargo.toml",
            "go.mod",
            "gemfile",
            "dockerfile",
            "docker-compose.yml",
            ".dockerignore",
            "readme.md",
            "main.py",
            "app.py",
            "index.js",
            "server.js",
            "app.js",
            ".gitignore",
            "config.py",
            "settings.py",
            "webpack.config.js",
            "vite.config.js",
            "tsconfig.json",
            "babel.config.js",
            "eslint.config.js",
        ]

        for filename, content in repository_files.items():
            file_lower = filename.lower()
            if any(imp_file in file_lower for imp_file in important_files):
                # Limit content size for context window (increased for better analysis)
                key_files[filename] = content[:3000]

        # Extract full analyzer context
        stack_context = {}
        if analysis_result.technology_stack:
            stack_context = {
                "language": getattr(analysis_result.technology_stack, "language", None),
                "framework": getattr(
                    analysis_result.technology_stack, "framework", None
                ),
                "database": getattr(analysis_result.technology_stack, "database", None),
                "build_tool": getattr(
                    analysis_result.technology_stack, "build_tool", None
                ),
                "package_manager": getattr(
                    analysis_result.technology_stack, "package_manager", None
                ),
                "runtime_version": getattr(
                    analysis_result.technology_stack, "runtime_version", None
                ),
                "additional_technologies": getattr(
                    analysis_result.technology_stack, "additional_technologies", []
                ),
                "architecture_pattern": getattr(
                    analysis_result.technology_stack, "architecture_pattern", None
                ),
                "deployment_strategy": getattr(
                    analysis_result.technology_stack, "deployment_strategy", None
                ),
            }

        # Extract dependency context
        dependency_context = {}
        if analysis_result.dependency_analysis:
            if hasattr(analysis_result.dependency_analysis, "__dict__"):
                dependency_context = {
                    "total_dependencies": getattr(
                        analysis_result.dependency_analysis, "total_dependencies", 0
                    ),
                    "security_vulnerabilities": getattr(
                        analysis_result.dependency_analysis,
                        "security_vulnerabilities",
                        0,
                    ),
                    "outdated_dependencies": getattr(
                        analysis_result.dependency_analysis, "outdated_dependencies", 0
                    ),
                    "package_managers": getattr(
                        analysis_result.dependency_analysis, "package_managers", []
                    ),
                    "optimization_score": getattr(
                        analysis_result.dependency_analysis, "optimization_score", 0
                    ),
                }
            elif isinstance(analysis_result.dependency_analysis, dict):
                dependency_context = analysis_result.dependency_analysis

        # Extract code quality context
        quality_context = {}
        if analysis_result.quality_metrics:
            quality_context = analysis_result.quality_metrics

        # Prepare comprehensive context
        return {
            "repository_info": {
                "url": analysis_result.repository_url,
                "branch": getattr(analysis_result, "branch", "main"),
                "analysis_approach": analysis_result.analysis_approach,
            },
            "rule_based_analysis": {
                "confidence_score": analysis_result.confidence_score,
                "stack_detection": stack_context,
                "dependency_analysis": dependency_context,
                "code_quality": quality_context,
            },
            "file_previews": key_files,
            "detected_files": analysis_result.detected_files[:20],  # Limit for context
            "existing_insights": getattr(analysis_result, "insights", []),
        }

    def _create_enhancement_result(
        self,
        analysis_result: AnalysisResult,
        tech_data: Dict[str, Any],
        optimization_data: Dict[str, Any],
    ) -> LLMEnhancementResult:
        """Create final enhancement result from tech detection and optimization data"""  # Create enhanced technology stack
        enhanced_stack = TechnologyStack(
            language=tech_data.get(
                "language", analysis_result.technology_stack.language
            ),
            framework=tech_data.get(
                "framework", analysis_result.technology_stack.framework
            ),
            database=tech_data.get(
                "database", analysis_result.technology_stack.database
            ),
            additional_technologies=tech_data.get(
                "additional_technologies",
                analysis_result.technology_stack.additional_technologies,
            ),
            architecture_pattern=tech_data.get(
                "architecture_pattern",
                analysis_result.technology_stack.architecture_pattern,
            ),
            deployment_strategy=optimization_data.get("deployment_strategy"),
            confidence=tech_data.get("confidence", 0.0),  # Set LLM confidence
        )

        # Calculate confidence boost
        base_confidence_boost = (
            tech_data.get("confidence", 0) - analysis_result.confidence_score
        )
        optimization_boost = optimization_data.get("confidence_boost", 0)
        total_confidence_boost = max(
            0, min(0.4, base_confidence_boost + optimization_boost)
        )  # Combine reasoning
        tech_reasoning = tech_data.get("reasoning", "")
        opt_reasoning = optimization_data.get("reasoning", "")
        combined_reasoning = f"{tech_reasoning}. {opt_reasoning}".strip(". ")

        return LLMEnhancementResult(
            enhanced_stack=enhanced_stack,
            reasoning=combined_reasoning or "LLM enhancement applied",
            suggestions=optimization_data.get("additional_insights", []),
            recommendations=optimization_data.get("recommendations", []),
            insights=[],  # Will be populated from tech_data insights
            confidence_improvement=total_confidence_boost,
            llm_enhanced=True,
            llm_provider="openai",
            processing_time=0.0,
        )

    def _create_comprehensive_result(
        self, analysis_result: AnalysisResult, parsed_data: Dict[str, Any]
    ) -> LLMEnhancementResult:
        """Create enhancement result from comprehensive analysis"""
        # # Log the parsed LLM response for debugging
        # logger.debug(f"Parsed LLM response: {parsed_data}")

        tech_stack_data = parsed_data.get("technology_stack", {})
        # Always prefer LLM's detected values if present
        enhanced_stack = TechnologyStack(
            language=tech_stack_data.get(
                "language", analysis_result.technology_stack.language
            ),
            framework=tech_stack_data.get(
                "framework", analysis_result.technology_stack.framework
            ),
            database=tech_stack_data.get(
                "database", analysis_result.technology_stack.database
            ),
            additional_technologies=tech_stack_data.get("additional_technologies", []),
            architecture_pattern=tech_stack_data.get("architecture_pattern"),
            deployment_strategy=tech_stack_data.get("deployment_strategy", None),
            confidence=parsed_data.get("confidence", 0.0),
        )

        confidence_boost = max(0, min(0.4, parsed_data.get("confidence_boost", 0.1)))

        # Null field explanations: if a field is null but mentioned in reasoning, add an explanation
        null_field_explanations = parsed_data.get("null_field_explanations", {})
        for field_name in ["database", "architecture_pattern", "deployment_strategy"]:
            if getattr(enhanced_stack, field_name, None) is None:
                # Try to extract explanation from reasoning if available
                reasoning = parsed_data.get("reasoning", "")
                if (
                    field_name in reasoning.lower()
                    and field_name not in null_field_explanations
                ):
                    null_field_explanations[field_name] = (
                        "Mentioned in reasoning but not detected in files."
                    )

        # Log the final merged result for debugging
        # logger.debug(
        #     f"Final merged enhancement result: stack={enhanced_stack}, insights={parsed_data.get('insights', [])}, suggestions={parsed_data.get('suggestions', [])}"
        # )

        return LLMEnhancementResult(
            enhanced_stack=enhanced_stack,
            reasoning=parsed_data.get("reasoning", "Comprehensive LLM analysis"),
            suggestions=parsed_data.get("additional_insights", []),
            recommendations=parsed_data.get("recommendations", []),
            insights=[],  # Will be populated from parsed_data insights
            confidence_improvement=confidence_boost,
            llm_enhanced=True,
            llm_provider="openai",
            processing_time=0.0,
        )

    async def _rule_based_enhancement(
        self, analysis_result: AnalysisResult, repository_files: Dict[str, str]
    ) -> LLMEnhancementResult:
        """Fallback rule-based enhancement when LLM is unavailable"""
        logger.info("Performing rule-based enhancement fallback")

        # Simple rule-based recommendations based on detected technology
        recommendations = []
        language = analysis_result.technology_stack.language

        if language == "javascript" or language == "node.js":
            recommendations.extend(
                [
                    {
                        "type": "performance",
                        "priority": "medium",
                        "suggestion": "Use PM2 for process management in production",
                        "reason": "Better process management and monitoring",
                    },
                    {
                        "type": "security",
                        "priority": "high",
                        "suggestion": "Implement helmet.js for security headers",
                        "reason": "Protect against common web vulnerabilities",
                    },
                ]
            )
        elif language == "python":
            recommendations.extend(
                [
                    {
                        "type": "performance",
                        "priority": "medium",
                        "suggestion": "Use Gunicorn with multiple workers for WSGI apps",
                        "reason": "Better performance and concurrency",
                    },
                    {
                        "type": "monitoring",
                        "priority": "medium",
                        "suggestion": "Add health check endpoints",
                        "reason": "Enable proper monitoring and load balancer integration",
                    },
                ]
            )

        return LLMEnhancementResult(
            enhanced_stack=analysis_result.technology_stack,
            reasoning="Rule-based enhancement applied (LLM unavailable)",
            suggestions=["Rule-based analysis completed"],
            recommendations=recommendations,
            insights=[],
            confidence_improvement=0.05,  # Small boost for rule-based enhancement
            llm_enhanced=False,
            llm_provider=None,
            processing_time=0.0,
        )

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on modular LLM services"""
        try:
            # Check LLM services
            llm_health = await self.api_client.health_check()

            return {
                "modular_enhancer": {
                    "status": "healthy",
                    "services_initialized": True,
                    "llm_services": llm_health,
                }
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "modular_enhancer": {
                    "status": "unhealthy",
                    "error": str(e),
                    "services_initialized": False,
                }
            }
