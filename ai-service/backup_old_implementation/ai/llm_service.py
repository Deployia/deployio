"""
LLM Service Integration for Enhanced Code Analysis
Hybrid approach combining rule-based detection with Groq/Llama intelligence
"""

import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import httpx
from config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class LLMAnalysisResult:
    """Result from LLM analysis"""
    
    confidence: float
    reasoning: str
    suggestions: List[str]
    enhanced_detection: Dict[str, Any]


class LLMService:
    """
    LLM Service for enhanced code analysis using Groq/Llama
    Works in conjunction with rule-based detection for higher accuracy
    """
    
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.model = settings.groq_model
        self.max_tokens = settings.groq_max_tokens
        self.temperature = settings.groq_temperature
        self.base_url = "https://api.groq.com/openai/v1"
        
        if not self.api_key:
            logger.warning("Groq API key not configured. LLM features will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
    
    async def enhance_stack_detection(
        self, 
        rule_based_result: Dict,
        file_contents: Dict[str, str],
        repository_structure: List[str]
    ) -> LLMAnalysisResult:
        """
        Enhance rule-based stack detection with LLM intelligence
        
        Args:
            rule_based_result: Result from rule-based detection
            file_contents: Key files and their contents
            repository_structure: List of file paths in repository
        """
        if not self.enabled:
            return self._create_fallback_result(rule_based_result)
        
        try:
            prompt = self._create_stack_detection_prompt(
                rule_based_result, file_contents, repository_structure
            )
            
            response = await self._call_llm(prompt)
            return self._parse_stack_detection_response(response, rule_based_result)
            
        except Exception as e:
            logger.error(f"LLM stack detection failed: {e}")
            return self._create_fallback_result(rule_based_result)
    
    async def analyze_code_patterns(
        self,
        code_samples: Dict[str, str],
        detected_stack: Dict
    ) -> LLMAnalysisResult:
        """
        Analyze code patterns for advanced insights
        
        Args:
            code_samples: Code samples from key files
            detected_stack: Already detected technology stack
        """
        if not self.enabled:
            return self._create_fallback_result({})
        
        try:
            prompt = self._create_code_analysis_prompt(code_samples, detected_stack)
            response = await self._call_llm(prompt)
            return self._parse_code_analysis_response(response)
            
        except Exception as e:
            logger.error(f"LLM code analysis failed: {e}")
            return self._create_fallback_result({})
    
    async def generate_optimization_suggestions(
        self,
        project_analysis: Dict,
        performance_metrics: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered optimization suggestions
        
        Args:
            project_analysis: Complete project analysis
            performance_metrics: Optional performance data
        """
        if not self.enabled:
            return self._create_fallback_suggestions()
        
        try:
            prompt = self._create_optimization_prompt(project_analysis, performance_metrics)
            response = await self._call_llm(prompt)
            return self._parse_optimization_response(response)
            
        except Exception as e:
            logger.error(f"LLM optimization generation failed: {e}")
            return self._create_fallback_suggestions()
    
    async def validate_and_enhance_dockerfile(
        self,
        dockerfile_content: str,
        detected_stack: Dict,
        security_requirements: List[str] = None
    ) -> Dict[str, Any]:
        """
        Use LLM to validate and enhance generated Dockerfiles
        
        Args:
            dockerfile_content: Generated Dockerfile content
            detected_stack: Detected technology stack
            security_requirements: Security requirements to validate
        """
        if not self.enabled:
            return {"validated": True, "suggestions": [], "enhanced_content": dockerfile_content}
        
        try:
            prompt = self._create_dockerfile_validation_prompt(
                dockerfile_content, detected_stack, security_requirements or []
            )
            
            response = await self._call_llm(prompt)
            return self._parse_dockerfile_validation_response(response, dockerfile_content)
            
        except Exception as e:
            logger.error(f"LLM Dockerfile validation failed: {e}")
            return {"validated": True, "suggestions": [], "enhanced_content": dockerfile_content}
    
    def _create_stack_detection_prompt(
        self, 
        rule_result: Dict, 
        files: Dict[str, str], 
        structure: List[str]
    ) -> str:
        """Create prompt for stack detection enhancement"""
        
        # Limit file contents to avoid token limits
        limited_files = {}
        for filename, content in files.items():
            if len(content) > 2000:  # Limit content size
                limited_files[filename] = content[:2000] + "... [truncated]"
            else:
                limited_files[filename] = content
        
        return f"""
You are an expert DevOps engineer and software architect. Analyze this repository to enhance technology stack detection.

RULE-BASED DETECTION RESULT:
```json
{json.dumps(rule_result, indent=2)}
```

KEY FILES CONTENT:
{json.dumps(limited_files, indent=2)}

REPOSITORY STRUCTURE (first 50 files):
{json.dumps(structure[:50], indent=2)}

Please provide enhanced analysis in this EXACT JSON format:
{{
    "confidence": 0.95,
    "reasoning": "Detailed explanation of your analysis",
    "enhanced_detection": {{
        "framework": "detected_framework",
        "language": "primary_language", 
        "database": "database_type",
        "build_tool": "build_system",
        "architecture_pattern": "pattern_detected",
        "additional_technologies": ["tech1", "tech2"],
        "deployment_strategy": "recommended_strategy"
    }},
    "suggestions": [
        "Specific improvement suggestion 1",
        "Specific improvement suggestion 2"
    ]
}}

Focus on:
1. Validating rule-based detection accuracy
2. Identifying missed technologies or frameworks
3. Detecting architectural patterns (MVC, microservices, etc.)
4. Recommending deployment strategies
5. Suggesting performance optimizations
"""
    
    def _create_code_analysis_prompt(self, code_samples: Dict[str, str], stack: Dict) -> str:
        """Create prompt for code pattern analysis"""
        
        return f"""
You are a senior software engineer performing code quality analysis.

DETECTED TECHNOLOGY STACK:
```json
{json.dumps(stack, indent=2)}
```

CODE SAMPLES:
{json.dumps(code_samples, indent=2)}

Analyze the code for:
1. Code quality and best practices
2. Security vulnerabilities
3. Performance issues
4. Architecture patterns
5. Testing strategy

Provide analysis in this EXACT JSON format:
{{
    "confidence": 0.90,
    "reasoning": "Detailed analysis explanation",
    "code_quality": {{
        "score": 85,
        "issues": ["issue1", "issue2"],
        "strengths": ["strength1", "strength2"]
    }},
    "security": {{
        "score": 90,
        "vulnerabilities": ["vuln1", "vuln2"],
        "recommendations": ["rec1", "rec2"]
    }},
    "performance": {{
        "score": 80,
        "bottlenecks": ["bottleneck1"],
        "optimizations": ["opt1", "opt2"]
    }},
    "suggestions": [
        "Actionable improvement suggestion 1",
        "Actionable improvement suggestion 2"
    ]
}}
"""
    
    def _create_optimization_prompt(self, analysis: Dict, metrics: Optional[Dict]) -> str:
        """Create prompt for optimization suggestions"""
        
        metrics_str = json.dumps(metrics, indent=2) if metrics else "No performance metrics available"
        
        return f"""
You are a DevOps optimization expert. Generate actionable optimization suggestions.

PROJECT ANALYSIS:
```json
{json.dumps(analysis, indent=2)}
```

PERFORMANCE METRICS:
```json
{metrics_str}
```

Generate optimization suggestions in this EXACT JSON format:
[
    {{
        "type": "performance|security|cost|reliability",
        "title": "Optimization Title",
        "description": "Detailed description",
        "priority": "low|medium|high|critical",
        "implementation": {{
            "steps": ["step1", "step2"],
            "code_changes": "Code snippets if applicable",
            "config_changes": "Configuration changes needed"
        }},
        "impact": "Expected impact description",
        "effort": "low|medium|high"
    }}
]

Focus on:
1. Build time optimization
2. Resource usage efficiency
3. Security hardening
4. Cost reduction
5. Reliability improvements
"""
    
    def _create_dockerfile_validation_prompt(
        self, 
        dockerfile: str, 
        stack: Dict, 
        security_reqs: List[str]
    ) -> str:
        """Create prompt for Dockerfile validation"""
        
        return f"""
You are a Docker security and optimization expert. Validate and enhance this Dockerfile.

DOCKERFILE CONTENT:
```dockerfile
{dockerfile}
```

TECHNOLOGY STACK:
```json
{json.dumps(stack, indent=2)}
```

SECURITY REQUIREMENTS:
{json.dumps(security_reqs, indent=2)}

Provide validation results in this EXACT JSON format:
{{
    "validated": true,
    "security_score": 85,
    "performance_score": 80,
    "best_practices_score": 90,
    "issues": [
        {{
            "type": "security|performance|best_practice",
            "severity": "low|medium|high|critical",
            "description": "Issue description",
            "fix": "How to fix this issue"
        }}
    ],
    "suggestions": [
        "Specific improvement suggestion 1",
        "Specific improvement suggestion 2"
    ],
    "enhanced_sections": {{
        "base_image": "Improved base image selection",
        "security": "Enhanced security configurations",
        "optimization": "Performance optimizations"
    }}
}}
"""
    
    async def _call_llm(self, prompt: str) -> Dict:
        """Make API call to Groq/Llama"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert DevOps engineer and software architect. Always respond with valid JSON as requested."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            response.raise_for_status()
            result = response.json()
            
            return result["choices"][0]["message"]["content"]
    
    def _parse_stack_detection_response(self, response: str, rule_result: Dict) -> LLMAnalysisResult:
        """Parse LLM response for stack detection"""
        try:
            parsed = json.loads(response)
            
            return LLMAnalysisResult(
                confidence=parsed.get("confidence", 0.8),
                reasoning=parsed.get("reasoning", "LLM analysis completed"),
                suggestions=parsed.get("suggestions", []),
                enhanced_detection=parsed.get("enhanced_detection", rule_result)
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return self._create_fallback_result(rule_result)
    
    def _parse_code_analysis_response(self, response: str) -> LLMAnalysisResult:
        """Parse LLM response for code analysis"""
        try:
            parsed = json.loads(response)
            
            return LLMAnalysisResult(
                confidence=parsed.get("confidence", 0.8),
                reasoning=parsed.get("reasoning", "Code analysis completed"),
                suggestions=parsed.get("suggestions", []),
                enhanced_detection=parsed
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse code analysis response: {e}")
            return self._create_fallback_result({})
    
    def _parse_optimization_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse LLM response for optimization suggestions"""
        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse optimization response: {e}")
            return self._create_fallball_suggestions()
    
    def _parse_dockerfile_validation_response(self, response: str, original: str) -> Dict[str, Any]:
        """Parse LLM response for Dockerfile validation"""
        try:
            parsed = json.loads(response)
            return {
                "validated": parsed.get("validated", True),
                "security_score": parsed.get("security_score", 80),
                "performance_score": parsed.get("performance_score", 80),
                "best_practices_score": parsed.get("best_practices_score", 80),
                "issues": parsed.get("issues", []),
                "suggestions": parsed.get("suggestions", []),
                "enhanced_content": original,  # For now, return original
                "enhanced_sections": parsed.get("enhanced_sections", {})
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Dockerfile validation response: {e}")
            return {"validated": True, "suggestions": [], "enhanced_content": original}
    
    def _create_fallback_result(self, rule_result: Dict) -> LLMAnalysisResult:
        """Create fallback result when LLM is unavailable"""
        return LLMAnalysisResult(
            confidence=0.7,  # Lower confidence for rule-based only
            reasoning="Using rule-based detection only (LLM unavailable)",
            suggestions=["Consider enabling LLM integration for enhanced analysis"],
            enhanced_detection=rule_result
        )
    
    def _create_fallback_suggestions(self) -> List[Dict[str, Any]]:
        """Create fallback optimization suggestions"""
        return [
            {
                "type": "performance",
                "title": "Enable LLM Integration",
                "description": "Configure Groq API key to unlock AI-powered optimization suggestions",
                "priority": "medium",
                "implementation": {
                    "steps": ["Set GROQ_API_KEY environment variable", "Restart AI service"],
                    "code_changes": "No code changes required",
                    "config_changes": "Add GROQ_API_KEY to environment"
                },
                "impact": "Unlock advanced AI-powered code analysis and optimization",
                "effort": "low"
            }
        ]
