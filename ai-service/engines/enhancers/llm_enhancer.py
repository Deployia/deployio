"""
LLM Enhancement Orchestrator

Orchestrates modular enhancement system using specialized enhancers.
Coordinates between AnalyzerEnhancer, GeneratorEnhancer, and manages the overall enhancement flow.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any

from models.analysis_models import AnalysisResult
from models.common_models import ConfidenceLevel
from .analyzer_enhancer import AnalyzerEnhancer
from .generator_enhancer import GeneratorEnhancer

logger = logging.getLogger(__name__)


class LLMEnhancer:
    """
    Orchestrator for modular LLM enhancement system.
    
    Coordinates between specialized enhancers:
    - AnalyzerEnhancer: For analysis improvements
    - GeneratorEnhancer: For configuration generation
    """
    
    def __init__(self):
        self.analyzer_enhancer = AnalyzerEnhancer()
        self.generator_enhancer = GeneratorEnhancer()
        
        logger.info("LLMEnhancer orchestrator initialized with modular enhancers")    
    
    @property
    def is_available(self) -> bool:
        """Check if any enhancement services are available."""
        return (self.analyzer_enhancer.is_available or 
                self.generator_enhancer.is_available)
        
    async def enhance_analysis(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        enhancement_options: Optional[Dict[str, Any]] = None
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
        try:
            logger.info("Starting modular LLM enhancement orchestration")
            
            if not self.is_available:
                logger.warning("No LLM enhancement services available")
                return analysis_result
            
            options = enhancement_options or {}
            enhanced_result = analysis_result
            
            # Determine enhancement strategy based on confidence level
            needs_enhancement = self._needs_enhancement(analysis_result)
            
            if needs_enhancement and self.analyzer_enhancer.is_available:
                logger.info("Orchestrating analysis enhancements")
                
                # Create enhancement tasks based on what needs improvement
                enhancement_tasks = []
                
                # Technology stack enhancement
                if self._needs_technology_enhancement(analysis_result):
                    enhancement_tasks.append(
                        self.analyzer_enhancer.enhance_technology_stack(
                            enhanced_result, repository_data
                        )
                    )
                
                # Dependency analysis enhancement
                if self._needs_dependency_enhancement(analysis_result):
                    enhancement_tasks.append(
                        self.analyzer_enhancer.enhance_dependency_analysis(
                            enhanced_result, repository_data
                        )
                    )
                
                # Code quality enhancement
                if self._needs_code_quality_enhancement(analysis_result):
                    enhancement_tasks.append(
                        self.analyzer_enhancer.enhance_code_quality(
                            enhanced_result, repository_data
                        )
                    )
                
                # Execute enhancement tasks
                if enhancement_tasks:
                    # Run the most important enhancement first, then others
                    primary_enhancement = enhancement_tasks[0]
                    enhanced_result = await primary_enhancement
                    
                    # Run remaining enhancements with updated result
                    if len(enhancement_tasks) > 1:
                        remaining_tasks = []
                        for task_func in enhancement_tasks[1:]:
                            # Re-create tasks with updated result
                            if "technology_stack" in str(task_func):
                                remaining_tasks.append(
                                    self.analyzer_enhancer.enhance_technology_stack(
                                        enhanced_result, repository_data
                                    )
                                )
                            elif "dependency" in str(task_func):
                                remaining_tasks.append(
                                    self.analyzer_enhancer.enhance_dependency_analysis(
                                        enhanced_result, repository_data
                                    )
                                )
                            elif "code_quality" in str(task_func):
                                remaining_tasks.append(
                                    self.analyzer_enhancer.enhance_code_quality(
                                        enhanced_result, repository_data
                                    )
                                )
                        
                        # Execute remaining tasks in parallel
                        if remaining_tasks:
                            results = await asyncio.gather(*remaining_tasks, return_exceptions=True)
                            
                            # Apply results that succeeded
                            for result in results:
                                if isinstance(result, AnalysisResult):
                                    enhanced_result = result
                                elif isinstance(result, Exception):
                                    logger.warning(f"Enhancement task failed: {result}")
                
                # Generate comprehensive insights as final step
                if options.get("generate_insights", True):
                    enhanced_result = await self.analyzer_enhancer.generate_comprehensive_insights(
                        enhanced_result, repository_data
                    )
            
            # Update confidence level based on enhancements
            self._update_confidence_after_enhancement(enhanced_result, analysis_result)
            
            logger.info("LLM enhancement orchestration completed successfully")
            return enhanced_result
            
        except Exception as e:
            logger.error(f"LLM enhancement error: {e}")
            # Return original result on failure
            return analysis_result
    
    async def generate_configurations(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        generation_options: Optional[Dict[str, Any]] = None
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
            
            # Determine which configurations to generate
            generate_dockerfile = options.get("dockerfile", True)
            generate_compose = options.get("docker_compose", True)
            generate_ci_cd = options.get("ci_cd_pipeline", True)
            
            # Create generation tasks
            generation_tasks = []
            
            if generate_dockerfile:
                generation_tasks.append(
                    self.generator_enhancer.generate_dockerfile(
                        analysis_result, repository_data, options
                    )
                )
                
            if generate_compose:
                generation_tasks.append(
                    self.generator_enhancer.generate_docker_compose(
                        analysis_result, repository_data, options
                    )
                )
                
            if generate_ci_cd:
                generation_tasks.append(
                    self.generator_enhancer.generate_ci_cd_pipeline(
                        analysis_result, repository_data, options
                    )
                )
            
            # Execute generation tasks in parallel
            configurations = {}
            if generation_tasks:
                results = await asyncio.gather(*generation_tasks, return_exceptions=True)
                
                # Process successful results
                for i, result in enumerate(results):
                    if isinstance(result, Dict):
                        configurations.update(result)
                    elif isinstance(result, Exception):
                        logger.warning(f"Configuration generation failed: {result}")
            
            # Generate deployment recommendations
            if options.get("generate_recommendations", True):
                try:
                    recommendations = await self.generator_enhancer.generate_deployment_recommendations(
                        analysis_result, repository_data, configurations
                    )
                    configurations["recommendations"] = recommendations
                except Exception as rec_error:
                    logger.warning(f"Failed to generate recommendations: {rec_error}")
            
            logger.info(f"Generated {len(configurations)} configurations successfully")
            return configurations
            
        except Exception as e:
            logger.error(f"Configuration generation error: {e}")
            return {"error": str(e)}
    
    async def generate_specific_configuration(
        self,
        config_type: str,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None
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
        return (self._needs_technology_enhancement(analysis_result) or 
                self._needs_dependency_enhancement(analysis_result) or
                self._needs_code_quality_enhancement(analysis_result))
    
    def _needs_technology_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Determine if technology stack analysis needs enhancement."""
        if not analysis_result.technology_stack:
            return True
            
        # Check for low confidence in technology detection
        if analysis_result.confidence_scores.get('technology_stack', 0) < 0.7:
            return True
            
        # Check for incomplete framework detection
        if any(tech.get('confidence', 1.0) < 0.6 for tech in analysis_result.technology_stack):
            return True
            
        return False
    
    def _needs_dependency_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Determine if dependency analysis needs enhancement."""
        if not analysis_result.dependencies:
            return True
            
        # Check for low confidence in dependency analysis
        if analysis_result.confidence_scores.get('dependencies', 0) < 0.7:
            return True
            
        # Check if dependency analysis is incomplete
        if analysis_result.dependencies and 'unknown_dependencies' in analysis_result.dependencies:
            if analysis_result.dependencies.get('unknown_dependencies', 0) > 0:
                return True
                
        return False
    
    def _needs_code_quality_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Determine if code quality analysis needs enhancement."""
        if not analysis_result.code_quality:
            return True
            
        # Check for low confidence in code quality analysis
        if analysis_result.confidence_scores.get('code_quality', 0) < 0.6:
            return True
            
        return False
    
    def _update_confidence_after_enhancement(
        self, 
        enhanced_result: AnalysisResult, 
        original_result: AnalysisResult
    ):
        """Update confidence scores after enhancement."""
        # Update confidence scores for enhanced sections
        if enhanced_result.technology_stack != original_result.technology_stack:
            enhanced_result.confidence_scores['technology_stack'] = min(0.9, 
                enhanced_result.confidence_scores.get('technology_stack', 0) + 0.2)
                
        if enhanced_result.dependencies != original_result.dependencies:
            enhanced_result.confidence_scores['dependencies'] = min(0.9,
                enhanced_result.confidence_scores.get('dependencies', 0) + 0.2)
                
        if enhanced_result.code_quality != original_result.code_quality:
            enhanced_result.confidence_scores['code_quality'] = min(0.9,
                enhanced_result.confidence_scores.get('code_quality', 0) + 0.2)
                
        # Update overall confidence
        enhanced_result.confidence = sum(enhanced_result.confidence_scores.values()) / len(enhanced_result.confidence_scores)
    
    async def health_check(self) -> Dict[str, Any]:
        """Check the health of LLM enhancement services."""
        analyzer_health = {"status": "unavailable"}
        generator_health = {"status": "unavailable"}
        
        try:
            if self.analyzer_enhancer.is_available:
                analyzer_health = {
                    "status": "available",
                    "providers": self.analyzer_enhancer.client_manager.get_available_providers()
                }
        except Exception as e:
            analyzer_health["error"] = str(e)
            
        try:
            if self.generator_enhancer.is_available:
                generator_health = {
                    "status": "available",
                    "providers": self.generator_enhancer.client_manager.get_available_providers()
                }
        except Exception as e:
            generator_health["error"] = str(e)
            
        return {
            "analyzer_enhancer": analyzer_health,
            "generator_enhancer": generator_health,
            "overall_status": "available" if self.is_available else "unavailable"
        }
