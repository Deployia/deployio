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
            logger.error(f"LLM enhancement orchestration failed: {e}")
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
            logger.info("Starting configuration generation orchestration")
            
            if not self.generator_enhancer.is_available:
                logger.warning("Generator enhancer not available")
                return {"error": "Configuration generation service unavailable"}
            
            options = generation_options or {}
            
            # Generate all configurations
            configurations = await self.generator_enhancer.generate_all_configurations(
                analysis_result, repository_data, options
            )
            
            logger.info("Configuration generation orchestration completed")
            return configurations
            
        except Exception as e:
            logger.error(f"Configuration generation orchestration failed: {e}")
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
            config_type: Type of configuration (dockerfile, compose, github_actions, kubernetes)
            analysis_result: Analysis results
            repository_data: Repository files and metadata
            options: Generation options
            
        Returns:
            Dictionary containing generated configuration
        """
        try:
            logger.info(f"Generating {config_type} configuration")
            
            if not self.generator_enhancer.is_available:
                return {"error": "Generator enhancer not available"}
            
            if config_type == "dockerfile":
                return await self.generator_enhancer.generate_dockerfile(
                    analysis_result, repository_data, options
                )
            elif config_type == "docker_compose":
                return await self.generator_enhancer.generate_docker_compose(
                    analysis_result, repository_data, options
                )
            elif config_type == "github_actions":
                return await self.generator_enhancer.generate_github_actions(
                    analysis_result, repository_data, options
                )
            elif config_type == "kubernetes":
                return await self.generator_enhancer.generate_kubernetes_manifests(
                    analysis_result, repository_data, options
                )
            else:
                return {"error": f"Unsupported configuration type: {config_type}"}
                
        except Exception as e:
            logger.error(f"Configuration generation failed for {config_type}: {e}")
            return {"error": str(e)}
    
    def _needs_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Determine if analysis result needs LLM enhancement."""
        # Check confidence level
        if analysis_result.confidence == ConfidenceLevel.LOW:
            return True
        
        # Check if confidence score is below threshold
        if hasattr(analysis_result, 'confidence_score') and analysis_result.confidence_score < 0.75:
            return True
        
        # Check for incomplete technology stack
        tech_stack = analysis_result.technology_stack
        if not tech_stack.languages or not tech_stack.frameworks:
            return True
        
        return False
    
    def _needs_technology_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Check if technology stack needs enhancement."""
        tech_stack = analysis_result.technology_stack
        
        # Missing core technologies
        if not tech_stack.languages or not tech_stack.frameworks:
            return True
        
        # Missing version information
        if not hasattr(tech_stack, 'versions') or not tech_stack.versions:
            return True
        
        return False
    
    def _needs_dependency_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Check if dependency analysis needs enhancement."""
        if not analysis_result.dependency_analysis:
            return True
        
        dep_analysis = analysis_result.dependency_analysis
        
        # Missing security analysis
        if not hasattr(dep_analysis, 'vulnerabilities') or not dep_analysis.vulnerabilities:
            return True
        
        return False
    
    def _needs_code_quality_enhancement(self, analysis_result: AnalysisResult) -> bool:
        """Check if code quality analysis needs enhancement."""
        if not analysis_result.code_analysis:
            return True
        
        code_analysis = analysis_result.code_analysis
        
        # Missing quality metrics
        if not hasattr(code_analysis, 'quality_score') or code_analysis.quality_score == 0:
            return True
        
        return False
    
    def _update_confidence_after_enhancement(
        self, 
        enhanced_result: AnalysisResult, 
        original_result: AnalysisResult
    ):
        """Update confidence level after successful enhancement."""
        # If we successfully enhanced, boost confidence
        if enhanced_result != original_result:
            if enhanced_result.confidence == ConfidenceLevel.LOW:
                enhanced_result.confidence = ConfidenceLevel.MEDIUM
            elif enhanced_result.confidence == ConfidenceLevel.MEDIUM:
                enhanced_result.confidence = ConfidenceLevel.HIGH
            
            # Also boost numerical confidence score if present
            if hasattr(enhanced_result, 'confidence_score'):
                enhanced_result.confidence_score = min(
                    1.0, enhanced_result.confidence_score + 0.2
                )
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on all enhancer components."""
        try:
            # Check both enhancers
            analyzer_health = await self.analyzer_enhancer.health_check()
            generator_health = await self.generator_enhancer.health_check()
            
            overall_status = "healthy"
            if (analyzer_health.get("analyzer_enhancer", {}).get("status") != "healthy" and
                generator_health.get("generator_enhancer", {}).get("status") != "healthy"):
                overall_status = "unhealthy"
            elif (analyzer_health.get("analyzer_enhancer", {}).get("status") != "healthy" or
                  generator_health.get("generator_enhancer", {}).get("status") != "healthy"):
                overall_status = "degraded"
            
            return {
                "llm_enhancer_orchestrator": {
                    "status": overall_status,
                    "analyzer_enhancer": analyzer_health,
                    "generator_enhancer": generator_health,
                    "services_available": self.is_available,
                }
            }
        except Exception as e:
            logger.error(f"LLM enhancer health check failed: {e}")            
            return {
                "llm_enhancer_orchestrator": {
                    "status": "unhealthy",
                    "error": str(e),
                }
            }                
            
        except Exception as e:
            logger.error(f"LLM enhancement failed: {e}")
            # Return original result if enhancement fails
