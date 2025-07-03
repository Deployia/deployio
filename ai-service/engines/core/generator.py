"""
Unified Generator - Configuration Generation Orchestrator
Clean, focused orchestration of the configuration generation pipeline
"""

import logging
import time
from typing import Dict, List, Any, Optional

from models.analysis_models import AnalysisResult
from models.common_models import ConfigurationType
from ..enhancers.llm_enhancer import LLMEnhancer
from ..generators.dockerfile_generator import DockerfileGenerator
from ..generators.config_generator import ConfigurationGenerator
from ..generators.pipeline_generator import PipelineGenerator
from ..utils.cache_manager import CacheManager

logger = logging.getLogger(__name__)


class UnifiedGenerator:
    """
    Main generation orchestrator - coordinates rule-based generators and LLM enhancement
    
    Flow:
    1. Rule-based generation (Dockerfile, Docker Compose, etc.)
    2. Confidence evaluation
    3. LLM enhancement (always applied for best results)
    4. Result compilation
    """
    
    def __init__(self):
        # Initialize rule-based generators
        self.dockerfile_generator = DockerfileGenerator()
        self.config_generator = ConfigurationGenerator()
        self.pipeline_generator = PipelineGenerator()
        
        # Initialize enhancer
        self.llm_enhancer = LLMEnhancer()
        
        # Initialize cache
        self.cache_manager = CacheManager()
        
        logger.info("UnifiedGenerator initialized with clean architecture")
    
    async def generate_configurations(
        self, 
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        config_types: List[str] = None,
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate all requested configurations based on analysis results
        
        Args:
            analysis_result: Complete analysis results
            repository_data: Repository data with files and metadata
            config_types: List of configuration types to generate
            options: Generation options
            
        Returns:
            Dict containing all generated configurations
        """
        start_time = time.time()
        
        repo_name = analysis_result.repository_name
        logger.info(f"Starting configuration generation for repository: {repo_name}")
        
        try:
            # Set defaults
            if config_types is None:
                config_types = ["dockerfile", "docker_compose", "github_actions"]
                
            if options is None:
                options = {"optimization_level": "balanced"}
            
            # Generate cache key
            cache_key = self._generate_cache_key(
                analysis_result.repository_name,
                analysis_result.branch,
                config_types
            )
            
            # Check cache first (unless force refresh)
            if not options.get("force_refresh"):
                cached_result = await self.cache_manager.get(cache_key)
                if cached_result:
                    logger.info(f"Cache hit for {repo_name} configurations")
                    return cached_result
            
            # Initialize results container
            configurations = {}
            
            # Step 1: Generate base configurations with rule-based generators
            base_configs = await self._generate_base_configurations(
                analysis_result, repository_data, config_types, options
            )
            
            # Step 2: Enhance with LLM for high-quality results
            enhanced_configs = await self._enhance_configurations(
                base_configs, analysis_result, repository_data, options
            )
            
            # Add metadata
            enhanced_configs["metadata"] = {
                "generated_at": time.time(),
                "processing_time": time.time() - start_time,
                "repository_name": repo_name,
                "branch": analysis_result.branch,
                "config_types": config_types,
                "llm_enhanced": True,
            }
            
            # Cache the results
            await self.cache_manager.set(
                cache_key, enhanced_configs, ttl=options.get("cache_ttl", 3600)
            )
            
            logger.info(f"Configuration generation completed for {repo_name}")
            return enhanced_configs
            
        except Exception as e:
            logger.error(f"Error generating configurations: {e}")
            return {
                "error": str(e),
                "metadata": {
                    "generated_at": time.time(),
                    "processing_time": time.time() - start_time,
                    "repository_name": repo_name,
                    "branch": analysis_result.branch,
                    "config_types": config_types or [],
                    "llm_enhanced": False,
                    "success": False
                }
            }
    
    async def _generate_base_configurations(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        config_types: List[str],
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate base configurations using rule-based generators."""
        
        base_configs = {}
        
        # Generate Dockerfile
        if "dockerfile" in config_types:
            try:
                dockerfile = self.dockerfile_generator.generate_dockerfile(
                    analysis_result, options.get("optimization_level", "balanced")
                )
                base_configs["dockerfile"] = dockerfile
            except Exception as e:
                logger.error(f"Error generating Dockerfile: {e}")
                base_configs["dockerfile"] = {
                    "content": "",
                    "error": str(e),
                    "success": False
                }
        
        # Generate Docker Compose
        if "docker_compose" in config_types:
            try:
                compose_config = self.config_generator.generate_docker_compose(
                    analysis_result, options.get("optimization_level", "balanced")
                )
                base_configs["docker_compose"] = compose_config
            except Exception as e:
                logger.error(f"Error generating Docker Compose: {e}")
                base_configs["docker_compose"] = {
                    "content": "",
                    "error": str(e),
                    "success": False
                }
        
        # Generate GitHub Actions
        if "github_actions" in config_types:
            try:
                github_actions = self.pipeline_generator.generate_github_actions(
                    analysis_result, options.get("optimization_level", "balanced")
                )
                base_configs["github_actions"] = github_actions
            except Exception as e:
                logger.error(f"Error generating GitHub Actions: {e}")
                base_configs["github_actions"] = {
                    "content": "",
                    "error": str(e),
                    "success": False
                }
        
        # Generate Kubernetes manifests
        if "kubernetes" in config_types:
            try:
                kubernetes = self.config_generator.generate_kubernetes_manifests(
                    analysis_result, options.get("optimization_level", "balanced")
                )
                base_configs["kubernetes"] = kubernetes
            except Exception as e:
                logger.error(f"Error generating Kubernetes manifests: {e}")
                base_configs["kubernetes"] = {
                    "content": "",
                    "error": str(e),
                    "success": False
                }
        
        return base_configs
    
    async def _enhance_configurations(
        self,
        base_configs: Dict[str, Any],
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any],
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhance configurations using LLM enhancer."""
        
        # Only enhance if LLM services are available
        if not self.llm_enhancer.is_available:
            logger.warning("LLM enhancement not available, using base configurations")
            return base_configs
        
        try:
            # Use the generator enhancer to improve all configurations
            enhanced_configs = await self.llm_enhancer.generate_configurations(
                analysis_result, repository_data, options
            )
            
            # If LLM enhancement failed, fall back to base configs
            if "error" in enhanced_configs:
                logger.warning(f"LLM enhancement failed: {enhanced_configs['error']}")
                return base_configs
            
            # Merge any missing configs from base (fallback mechanism)
            for config_type, content in base_configs.items():
                if config_type not in enhanced_configs:
                    enhanced_configs[config_type] = content
            
            return enhanced_configs
            
        except Exception as e:
            logger.error(f"Error during LLM enhancement: {e}")
            # Fall back to base configurations
            return base_configs
    
    def _generate_cache_key(
        self, repository_name: str, branch: str, config_types: List[str]
    ) -> str:
        """Generate cache key for configurations."""
        config_types_str = "_".join(sorted(config_types))
        return f"configs:{repository_name}:{branch}:{config_types_str}"
