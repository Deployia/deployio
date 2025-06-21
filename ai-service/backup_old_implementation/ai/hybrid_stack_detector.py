"""
Enhanced Hybrid Stack Detector
Combines rule-based detection with LLM intelligence for maximum accuracy
"""

import asyncio
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import aiohttp
from urllib.parse import urlparse

from .stack_detector import StackDetector as BaseStackDetector, DetectedStack
from .llm_service import LLMService, LLMAnalysisResult
from config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class HybridAnalysisResult:
    """Enhanced analysis result combining rule-based and LLM detection"""
    
    # Core detection results
    detected_stack: DetectedStack
    
    # Rule-based analysis
    rule_based_confidence: float
    rule_based_details: Dict
    
    # LLM enhancement
    llm_confidence: float
    llm_reasoning: str
    llm_suggestions: List[str]
    
    # Combined results
    final_confidence: float
    enhanced_technologies: Dict
    architecture_pattern: Optional[str] = None
    deployment_strategy: Optional[str] = None
    
    # Analysis metadata
    processing_time: float = 0.0
    analysis_approach: str = "hybrid"  # "hybrid", "rule-based", "llm-only"


class HybridStackDetector:
    """
    Advanced hybrid stack detection combining rule-based patterns with LLM intelligence
    
    Process:
    1. Rule-based detection for speed and accuracy on known patterns
    2. LLM enhancement for complex scenarios and validation
    3. Confidence scoring and result combination
    4. Fallback mechanisms for reliability
    """
    
    def __init__(self):
        self.rule_detector = BaseStackDetector()
        self.llm_service = LLMService()
        self.confidence_threshold = 0.8  # Threshold for high confidence
        self.llm_enhancement_threshold = 0.6  # When to use LLM enhancement
    
    async def analyze_repository(
        self,
        repository_url: str,
        branch: str = "main",
        enable_llm_enhancement: bool = True
    ) -> HybridAnalysisResult:
        """
        Perform hybrid analysis of a repository
        
        Args:
            repository_url: GitHub repository URL
            branch: Branch to analyze
            enable_llm_enhancement: Whether to use LLM for enhancement
        """
        import time
        start_time = time.time()
        
        try:
            # Step 1: Rule-based detection
            logger.info(f"Starting hybrid analysis for {repository_url}")
            rule_result = await self.rule_detector.analyze_repository(repository_url, branch)
            
            # Step 2: Get additional context for LLM
            repository_context = await self._get_repository_context(repository_url, branch)
            
            # Step 3: Determine if LLM enhancement is needed
            use_llm = (
                enable_llm_enhancement 
                and self.llm_service.enabled 
                and (rule_result.confidence < self.llm_enhancement_threshold or settings.enable_llm_fallback)
            )
            
            if use_llm:
                # Step 4: LLM enhancement
                llm_result = await self._enhance_with_llm(rule_result, repository_context)
                
                # Step 5: Combine results
                final_result = await self._combine_results(rule_result, llm_result, repository_context)
                final_result.analysis_approach = "hybrid"
            else:
                # Use rule-based only
                final_result = await self._create_rule_based_result(rule_result)
                final_result.analysis_approach = "rule-based"
            
            final_result.processing_time = time.time() - start_time
            
            logger.info(
                f"Hybrid analysis completed: {final_result.analysis_approach} "
                f"(confidence: {final_result.final_confidence:.2f}, "
                f"time: {final_result.processing_time:.2f}s)"
            )
            
            return final_result
            
        except Exception as e:
            logger.error(f"Hybrid analysis failed for {repository_url}: {e}")
            # Fallback to rule-based only
            try:
                rule_result = await self.rule_detector.analyze_repository(repository_url, branch)
                fallback_result = await self._create_rule_based_result(rule_result)
                fallback_result.processing_time = time.time() - start_time
                fallback_result.analysis_approach = "rule-based-fallback"
                return fallback_result
            except Exception as fallback_error:
                logger.error(f"Fallback analysis also failed: {fallback_error}")
                return await self._create_error_result(repository_url, str(e))
    
    async def analyze_code_quality(
        self,
        repository_url: str,
        branch: str = "main",
        detected_stack: Optional[DetectedStack] = None
    ) -> Dict:
        """
        Perform code quality analysis using hybrid approach
        """
        try:
            # Get code samples for analysis
            code_samples = await self._get_code_samples(repository_url, branch)
            
            if not detected_stack:
                analysis_result = await self.analyze_repository(repository_url, branch)
                detected_stack = analysis_result.detected_stack
            
            # Use LLM for code quality analysis
            if self.llm_service.enabled:
                llm_result = await self.llm_service.analyze_code_patterns(
                    code_samples, 
                    asdict(detected_stack)
                )
                
                return {
                    "analysis_type": "llm_enhanced",
                    "confidence": llm_result.confidence,
                    "reasoning": llm_result.reasoning,
                    "quality_metrics": llm_result.enhanced_detection,
                    "suggestions": llm_result.suggestions,
                    "code_samples_analyzed": len(code_samples)
                }
            else:
                # Fallback to basic analysis
                return await self._basic_code_quality_analysis(code_samples, detected_stack)
                
        except Exception as e:
            logger.error(f"Code quality analysis failed: {e}")
            return {
                "analysis_type": "error",
                "error": str(e),
                "suggestions": ["Enable LLM integration for advanced code quality analysis"]
            }
    
    async def get_optimization_suggestions(
        self,
        analysis_result: HybridAnalysisResult,
        performance_metrics: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Get optimization suggestions based on analysis results
        """
        try:
            if self.llm_service.enabled:
                # Prepare analysis data for LLM
                analysis_data = {
                    "detected_stack": asdict(analysis_result.detected_stack),
                    "enhanced_technologies": analysis_result.enhanced_technologies,
                    "architecture_pattern": analysis_result.architecture_pattern,
                    "deployment_strategy": analysis_result.deployment_strategy,
                    "confidence": analysis_result.final_confidence
                }
                
                suggestions = await self.llm_service.generate_optimization_suggestions(
                    analysis_data,
                    performance_metrics
                )
                
                return suggestions
            else:
                # Rule-based optimization suggestions
                return await self._rule_based_optimization_suggestions(analysis_result)
                
        except Exception as e:
            logger.error(f"Optimization suggestion generation failed: {e}")
            return [{
                "type": "error",
                "title": "Optimization Analysis Failed",
                "description": f"Error generating suggestions: {str(e)}",
                "priority": "low",
                "implementation": {"steps": ["Check AI service configuration"]},
                "impact": "Limited optimization insights available",
                "effort": "low"
            }]
    
    async def validate_dockerfile(
        self,
        dockerfile_content: str,
        detected_stack: DetectedStack,
        security_requirements: List[str] = None
    ) -> Dict:
        """
        Validate and enhance Dockerfile using hybrid approach
        """
        try:
            if self.llm_service.enabled:
                validation_result = await self.llm_service.validate_and_enhance_dockerfile(
                    dockerfile_content,
                    asdict(detected_stack),
                    security_requirements or []
                )
                
                return validation_result
            else:
                # Rule-based validation
                return await self._rule_based_dockerfile_validation(dockerfile_content, detected_stack)
                
        except Exception as e:
            logger.error(f"Dockerfile validation failed: {e}")
            return {
                "validated": True,
                "suggestions": [f"Validation error: {str(e)}"],
                "enhanced_content": dockerfile_content,
                "fallback": True
            }
    
    async def _get_repository_context(self, repository_url: str, branch: str) -> Dict:
        """Get additional repository context for LLM analysis"""
        try:
            parsed_url = urlparse(repository_url)
            path_parts = parsed_url.path.strip('/').split('/')
            
            if len(path_parts) >= 2:
                owner, repo = path_parts[0], path_parts[1]
                
                # Get file structure and key files
                files_data = await self.rule_detector._fetch_github_files(owner, repo, branch)
                
                # Get contents of key configuration files
                key_files = {}
                structure = []
                
                for file_info in files_data[:20]:  # Limit to first 20 files
                    file_path = file_info.get('path', '')
                    structure.append(file_path)
                    
                    # Get content for key files
                    if any(key in file_path.lower() for key in [
                        'package.json', 'requirements.txt', 'dockerfile', 
                        'docker-compose', 'makefile', 'pom.xml', 'build.gradle'
                    ]):
                        try:
                            content = await self._fetch_file_content(owner, repo, branch, file_path)
                            if content and len(content) < 10000:  # Limit content size
                                key_files[file_path] = content
                        except Exception as e:
                            logger.debug(f"Could not fetch {file_path}: {e}")
                
                return {
                    "repository_structure": structure,
                    "key_files": key_files,
                    "total_files": len(files_data)
                }
            
            return {"repository_structure": [], "key_files": {}, "total_files": 0}
            
        except Exception as e:
            logger.error(f"Failed to get repository context: {e}")
            return {"repository_structure": [], "key_files": {}, "total_files": 0}
    
    async def _fetch_file_content(self, owner: str, repo: str, branch: str, file_path: str) -> Optional[str]:
        """Fetch content of a specific file from GitHub"""
        try:
            url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
            params = {"ref": branch}
            headers = {}
            
            if settings.github_token:
                headers["Authorization"] = f"token {settings.github_token}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("content"):
                            import base64
                            content = base64.b64decode(data["content"]).decode("utf-8")
                            return content
            
            return None
            
        except Exception as e:
            logger.debug(f"Failed to fetch file content for {file_path}: {e}")
            return None
    
    async def _get_code_samples(self, repository_url: str, branch: str) -> Dict[str, str]:
        """Get code samples for quality analysis"""
        context = await self._get_repository_context(repository_url, branch)
        
        # Filter for actual code files
        code_files = {}
        for file_path, content in context["key_files"].items():
            if any(ext in file_path.lower() for ext in ['.js', '.py', '.java', '.go', '.php', '.rb']):
                # Limit content length for LLM processing
                if len(content) > 3000:
                    code_files[file_path] = content[:3000] + "\n... [truncated]"
                else:
                    code_files[file_path] = content
        
        return code_files
    
    async def _enhance_with_llm(
        self, 
        rule_result: DetectedStack, 
        context: Dict
    ) -> LLMAnalysisResult:
        """Enhance rule-based detection with LLM"""
        
        rule_dict = asdict(rule_result)
        
        return await self.llm_service.enhance_stack_detection(
            rule_dict,
            context["key_files"],
            context["repository_structure"]
        )
    
    async def _combine_results(
        self, 
        rule_result: DetectedStack, 
        llm_result: LLMAnalysisResult,
        context: Dict
    ) -> HybridAnalysisResult:
        """Combine rule-based and LLM results intelligently"""
        
        # Calculate combined confidence
        rule_weight = 0.6  # Rule-based gets 60% weight (more reliable)
        llm_weight = 0.4   # LLM gets 40% weight (enhancement)
        
        final_confidence = (
            rule_result.confidence * rule_weight + 
            llm_result.confidence * llm_weight
        )
        
        # Merge detected technologies
        enhanced = llm_result.enhanced_detection
        
        # Create enhanced DetectedStack
        enhanced_stack = DetectedStack(
            language=enhanced.get("language") or rule_result.language,
            framework=enhanced.get("framework") or rule_result.framework,
            database=enhanced.get("database") or rule_result.database,
            build_tool=enhanced.get("build_tool") or rule_result.build_tool,
            package_manager=enhanced.get("package_manager") or rule_result.package_manager,
            runtime_version=enhanced.get("runtime_version") or rule_result.runtime_version,
            confidence=final_confidence
        )
        
        return HybridAnalysisResult(
            detected_stack=enhanced_stack,
            rule_based_confidence=rule_result.confidence,
            rule_based_details=asdict(rule_result),
            llm_confidence=llm_result.confidence,
            llm_reasoning=llm_result.reasoning,
            llm_suggestions=llm_result.suggestions,
            final_confidence=final_confidence,
            enhanced_technologies=enhanced,
            architecture_pattern=enhanced.get("architecture_pattern"),
            deployment_strategy=enhanced.get("deployment_strategy")
        )
    
    async def _create_rule_based_result(self, rule_result: DetectedStack) -> HybridAnalysisResult:
        """Create result when only using rule-based detection"""
        
        return HybridAnalysisResult(
            detected_stack=rule_result,
            rule_based_confidence=rule_result.confidence,
            rule_based_details=asdict(rule_result),
            llm_confidence=0.0,
            llm_reasoning="LLM enhancement not used",
            llm_suggestions=[],
            final_confidence=rule_result.confidence,
            enhanced_technologies=asdict(rule_result),
            architecture_pattern=None,
            deployment_strategy="containerized"  # Default
        )
    
    async def _create_error_result(self, repository_url: str, error: str) -> HybridAnalysisResult:
        """Create error result when analysis fails"""
        
        error_stack = DetectedStack(
            language="unknown",
            framework="unknown",
            confidence=0.0
        )
        
        return HybridAnalysisResult(
            detected_stack=error_stack,
            rule_based_confidence=0.0,
            rule_based_details={"error": error},
            llm_confidence=0.0,
            llm_reasoning=f"Analysis failed: {error}",
            llm_suggestions=[f"Unable to analyze {repository_url}"],
            final_confidence=0.0,
            enhanced_technologies={},
            architecture_pattern=None,
            deployment_strategy=None
        )
    
    async def _basic_code_quality_analysis(self, code_samples: Dict, stack: DetectedStack) -> Dict:
        """Basic code quality analysis without LLM"""
        
        total_lines = sum(len(content.split('\n')) for content in code_samples.values())
        
        return {
            "analysis_type": "basic",
            "confidence": 0.6,
            "quality_metrics": {
                "code_files_analyzed": len(code_samples),
                "total_lines": total_lines,
                "detected_languages": [stack.language] if stack.language else []
            },
            "suggestions": [
                "Enable LLM integration for advanced code quality analysis",
                "Consider implementing automated testing",
                "Add code documentation and comments"
            ]
        }
    
    async def _rule_based_optimization_suggestions(self, analysis: HybridAnalysisResult) -> List[Dict]:
        """Generate rule-based optimization suggestions"""
        
        suggestions = []
        stack = analysis.detected_stack
        
        # Performance suggestions
        if stack.framework in ["react", "vue", "angular"]:
            suggestions.append({
                "type": "performance",
                "title": "Bundle Optimization",
                "description": "Implement code splitting and tree shaking for smaller bundle sizes",
                "priority": "medium",
                "implementation": {
                    "steps": ["Configure webpack/vite for code splitting", "Add dynamic imports"],
                    "code_changes": "Add React.lazy() or dynamic imports",
                    "config_changes": "Update build configuration"
                },
                "impact": "Reduce initial bundle size by 30-50%",
                "effort": "medium"
            })
        
        # Security suggestions
        if stack.language == "javascript":
            suggestions.append({
                "type": "security",
                "title": "Dependency Security Audit",
                "description": "Regular security auditing of npm dependencies",
                "priority": "high",
                "implementation": {
                    "steps": ["npm audit", "Update vulnerable packages", "Add audit to CI/CD"],
                    "code_changes": "Update package.json dependencies",
                    "config_changes": "Add security checks to pipeline"
                },
                "impact": "Reduce security vulnerabilities",
                "effort": "low"
            })
        
        # Docker optimization
        suggestions.append({
            "type": "performance",
            "title": "Multi-stage Docker Build",
            "description": "Optimize Docker image size with multi-stage builds",
            "priority": "medium",
            "implementation": {
                "steps": ["Create multi-stage Dockerfile", "Separate build and runtime stages"],
                "code_changes": "Update Dockerfile structure",
                "config_changes": "Optimize base images"
            },
            "impact": "Reduce image size by 60-80%",
            "effort": "medium"
        })
        
        return suggestions
    
    async def _rule_based_dockerfile_validation(self, content: str, stack: DetectedStack) -> Dict:
        """Basic Dockerfile validation without LLM"""
        
        issues = []
        suggestions = []
        
        # Basic validation rules
        if "FROM scratch" in content or "FROM alpine" not in content:
            issues.append({
                "type": "security",
                "severity": "medium",
                "description": "Consider using Alpine Linux base image for smaller size",
                "fix": "Use FROM node:alpine or python:alpine"
            })
        
        if "USER root" in content or "USER" not in content:
            issues.append({
                "type": "security",
                "severity": "high",
                "description": "Running as root user is a security risk",
                "fix": "Add USER non-root directive"
            })
        
        suggestions.extend([
            "Use multi-stage builds to reduce image size",
            "Add health checks for better container monitoring",
            "Use .dockerignore to exclude unnecessary files"
        ])
        
        return {
            "validated": True,
            "security_score": 70 if not issues else 50,
            "performance_score": 75,
            "best_practices_score": 80,
            "issues": issues,
            "suggestions": suggestions,
            "enhanced_content": content,
            "rule_based": True
        }
