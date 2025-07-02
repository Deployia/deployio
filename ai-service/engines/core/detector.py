"""
Unified Detector - Main Analysis Orchestrator
Clean, focused orchestration of the analysis pipeline
"""

import logging
import time
from typing import Dict, List, Any, Optional

from models.analysis_models import AnalysisResult, AnalysisRequest, AnalysisType
from models.common_models import get_confidence_level
from ..analyzers.stack_analyzer import StackAnalyzer
from ..analyzers.dependency_analyzer import DependencyAnalyzer
from ..analyzers.code_analyzer import CodeAnalyzer
from ..enhancers.llm_enhancer import LLMEnhancer
from ..utils.cache_manager import CacheManager

logger = logging.getLogger(__name__)


class UnifiedDetector:
    """
    Main analysis orchestrator - coordinates rule-based analysis and LLM enhancement
    
    Flow:
    1. Rule-based analysis (Stack, Dependencies, Code)
    2. Confidence evaluation
    3. LLM enhancement (if needed)
    4. Result compilation
    """
    
    def __init__(self):
        # Initialize analyzers (rule-based only)
        self.stack_analyzer = StackAnalyzer()
        self.dependency_analyzer = DependencyAnalyzer()
        self.code_analyzer = CodeAnalyzer()
        
        # Initialize enhancer
        self.llm_enhancer = LLMEnhancer()
        
        # Initialize cache
        self.cache_manager = CacheManager()
        
        logger.info("UnifiedDetector initialized with clean architecture")
    
    async def analyze_repository(self, request: AnalysisRequest) -> AnalysisResult:
        """
        Perform complete repository analysis
        
        Args:
            request: Analysis request with repository data and options
            
        Returns:
            AnalysisResult: Complete analysis with all components
        """
        start_time = time.time()
        
        repository_data = request.repository_data
        repo_name = repository_data.get("repository", {}).get("name", "unknown")
        
        logger.info(f"Starting analysis for repository: {repo_name}")
        
        try:
            # Step 1: Check cache
            cache_key = self._generate_cache_key(request)
            cached_result = await self.cache_manager.get(cache_key)
            
            if cached_result and not request.force_llm_enhancement:
                logger.info(f"Cache hit for {repo_name}")
                return cached_result
            
            # Step 2: Initialize result
            result = AnalysisResult(
                repository_name=repo_name,
                repository_url=repository_data.get("repository_url", ""),
                branch=repository_data.get("metadata", {}).get("branch", "main"),
                session_id=request.session_id,
                analysis_types=request.analysis_types,
            )
            
            # Step 3: Rule-based analysis
            await self._perform_rule_based_analysis(result, repository_data, request.analysis_types)
            
            # Step 4: Calculate confidence
            confidence_score = self._calculate_overall_confidence(result)
            result.confidence_score = confidence_score
            result.confidence_level = get_confidence_level(confidence_score)
            
            # Step 5: LLM enhancement (if needed)
            if self._should_enhance_with_llm(result, request):
                logger.info(f"Enhancing {repo_name} with LLM (confidence: {confidence_score:.2f})")
                await self._enhance_with_llm(result, repository_data, request)
            
            # Step 6: Finalize result
            result.processing_time = time.time() - start_time
            result.completed_at = time.time()
            
            # Step 7: Cache result
            await self.cache_manager.set(cache_key, result)
            
            logger.info(f"Analysis completed for {repo_name} in {result.processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"Analysis failed for {repo_name}: {str(e)}", exc_info=True)
            # Return partial result with error
            result.error_message = str(e)
            result.processing_time = time.time() - start_time
            return result
    
    async def _perform_rule_based_analysis(
        self, 
        result: AnalysisResult, 
        repository_data: Dict[str, Any],
        analysis_types: List[AnalysisType]
    ):
        """Perform rule-based analysis with all analyzers"""
        
        # Stack analysis (always performed)
        if AnalysisType.STACK_DETECTION in analysis_types:
            stack_result = await self.stack_analyzer.analyze(repository_data)
            result.technology_stack = stack_result.technology_stack
            result.build_configuration = stack_result.build_configuration
            result.deployment_configuration = stack_result.deployment_configuration
            
            # Add insights from stack analysis
            for insight in stack_result.insights:
                result.add_insight(insight)
        
        # Dependency analysis
        if AnalysisType.DEPENDENCY_ANALYSIS in analysis_types:
            dependency_result = await self.dependency_analyzer.analyze(repository_data)
            result.dependency_analysis = dependency_result.dependency_analysis
            
            # Add insights from dependency analysis
            for insight in dependency_result.insights:
                result.add_insight(insight)
        
        # Code analysis
        if AnalysisType.CODE_ANALYSIS in analysis_types:
            code_result = await self.code_analyzer.analyze(repository_data)
            result.code_analysis = code_result.code_analysis
            
            # Add insights from code analysis
            for insight in code_result.insights:
                result.add_insight(insight)
        
        result.analysis_approach = "rule_based"
        logger.info(f"Rule-based analysis completed for {result.repository_name}")
    
    def _calculate_overall_confidence(self, result: AnalysisResult) -> float:
        """Calculate overall confidence score from all analysis components"""
        confidences = []
        
        # Technology stack confidence
        if result.technology_stack and result.technology_stack.confidence > 0:
            confidences.append(result.technology_stack.confidence)
        
        # Dependency analysis confidence (if available)
        if result.dependency_analysis and result.dependency_analysis.health_score > 0:
            confidences.append(result.dependency_analysis.health_score)
        
        # Code analysis confidence (if available)
        if result.code_analysis and result.code_analysis.quality_score > 0:
            confidences.append(result.code_analysis.quality_score)
        
        # Calculate weighted average
        if confidences:
            return sum(confidences) / len(confidences)
        else:
            return 0.3  # Low confidence if no analysis succeeded
    
    def _should_enhance_with_llm(self, result: AnalysisResult, request: AnalysisRequest) -> bool:
        """Determine if LLM enhancement is needed"""
        
        # Force enhancement if requested
        if request.force_llm_enhancement:
            return True
        
        # Enhance if confidence is low
        if result.confidence_score < 0.75:
            return True
        
        # Enhance if reasoning/insights are requested and missing
        if request.include_insights and len(result.insights) < 3:
            return True
        
        # Enhance if recommendations are requested and missing
        if request.include_recommendations and len(result.recommendations) == 0:
            return True
        
        return False
    
    async def _enhance_with_llm(
        self, 
        result: AnalysisResult, 
        repository_data: Dict[str, Any],
        request: AnalysisRequest
    ):
        """Enhance analysis result with LLM"""
        try:
            enhanced_result = await self.llm_enhancer.enhance_analysis(
                result, 
                repository_data,
                request
            )
            
            # Merge enhanced data
            if enhanced_result.enhanced_stack:
                # Update technology stack with enhanced data
                self._merge_technology_stack(result, enhanced_result.enhanced_stack)
            
            # Add LLM insights and recommendations
            result.insights.extend(enhanced_result.insights)
            result.recommendations.extend(enhanced_result.recommendations)
            result.suggestions.extend(enhanced_result.suggestions)
            
            # Update metadata
            result.llm_enhanced = True
            result.llm_provider = enhanced_result.llm_provider
            result.llm_confidence = enhanced_result.llm_confidence
            result.llm_reasoning = enhanced_result.reasoning
            result.analysis_approach = "llm_enhanced"
            
            # Recalculate confidence
            if enhanced_result.llm_confidence > result.confidence_score:
                result.confidence_score = enhanced_result.llm_confidence
                result.confidence_level = get_confidence_level(result.confidence_score)
            
            logger.info(f"LLM enhancement completed for {result.repository_name}")
            
        except Exception as e:
            logger.warning(f"LLM enhancement failed for {result.repository_name}: {str(e)}")
            result.add_warning(f"LLM enhancement failed: {str(e)}")
    
    def _merge_technology_stack(self, result: AnalysisResult, enhanced_stack):
        """Merge enhanced technology stack data"""
        if not enhanced_stack:
            return
        
        # Update fields that are None or low confidence
        if not result.technology_stack.language and enhanced_stack.language:
            result.technology_stack.language = enhanced_stack.language
        
        if not result.technology_stack.framework and enhanced_stack.framework:
            result.technology_stack.framework = enhanced_stack.framework
        
        if not result.technology_stack.database and enhanced_stack.database:
            result.technology_stack.database = enhanced_stack.database
        
        # Update build configuration
        if enhanced_stack.build_command and not result.technology_stack.build_command:
            result.technology_stack.build_command = enhanced_stack.build_command
        
        # Update confidence if higher
        if enhanced_stack.confidence > result.technology_stack.confidence:
            result.technology_stack.confidence = enhanced_stack.confidence
    
    def _generate_cache_key(self, request: AnalysisRequest) -> str:
        """Generate cache key for request"""
        repo_data = request.repository_data
        repo_id = repo_data.get("repository", {}).get("full_name", "unknown")
        branch = repo_data.get("metadata", {}).get("branch", "main")
        analysis_types = "_".join([t.value for t in request.analysis_types])
        
        return f"analysis_v2:{repo_id}:{branch}:{analysis_types}"
