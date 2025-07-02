"""
LLM Enhancement Engine

Centralized enhancement system that takes rule-based analysis results and
enhances them with AI-generated insights, explanations, and recommendations.
"""

import os
import asyncio
import logging
from typing import Dict, List, Optional, Any
from openai import AsyncOpenAI

from models.analysis_models import (
    AnalysisResult, TechnologyStack, DependencyAnalysis, CodeAnalysis,
    BuildConfiguration, DeploymentConfiguration
)
from models.common_models import InsightModel, ConfidenceLevel

logger = logging.getLogger(__name__)


class LLMEnhancer:
    """
    Centralized LLM enhancement system that enriches rule-based analysis
    with AI-generated insights, explanations, and recommendations.
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = "gpt-4o-mini"
        
    async def enhance_analysis(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Main enhancement method that orchestrates all enhancement tasks.
        
        Args:
            analysis_result: Rule-based analysis results
            repository_data: Repository file contents and metadata
            
        Returns:
            Enhanced analysis result with AI-generated insights
        """
        try:
            logger.info("Starting LLM enhancement process")
            
            # Create enhancement tasks
            tasks = []
            
            # Only enhance if confidence is medium or lower
            if analysis_result.confidence != ConfidenceLevel.HIGH:
                tasks.extend([
                    self._enhance_technology_stack(
                        analysis_result.technology_stack,
                        repository_data
                    ),
                    self._enhance_dependencies(
                        analysis_result.dependency_analysis,
                        repository_data
                    ),
                    self._enhance_code_analysis(
                        analysis_result.code_analysis,
                        repository_data
                    ),
                    self._enhance_build_config(
                        analysis_result.build_configuration,
                        repository_data
                    ),
                    self._generate_deployment_insights(
                        analysis_result,
                        repository_data
                    )
                ])
            
            # Generate overall insights and recommendations
            tasks.append(
                self._generate_overall_insights(analysis_result, repository_data)
            )
            
            # Execute all enhancement tasks concurrently
            if tasks:
                enhanced_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results and handle exceptions
                for i, result in enumerate(enhanced_results):
                    if isinstance(result, Exception):
                        logger.error(f"Enhancement task {i} failed: {result}")
                        continue
                        
                    # Apply enhancements to analysis result
                    if i < len(tasks) - 1:  # Individual component enhancements
                        await self._apply_enhancement_result(analysis_result, result, i)
                    else:  # Overall insights
                        analysis_result.insights = result
            
            # Update confidence level if we made significant enhancements
            if analysis_result.confidence == ConfidenceLevel.LOW:
                analysis_result.confidence = ConfidenceLevel.MEDIUM
                
            logger.info("LLM enhancement completed successfully")
            return analysis_result
            
        except Exception as e:
            logger.error(f"LLM enhancement failed: {e}")
            # Return original result if enhancement fails
            return analysis_result
    
    async def _enhance_technology_stack(
        self,
        tech_stack: TechnologyStack,
        repository_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhance technology stack with missing details and explanations."""
        try:
            # Prepare context for LLM
            context = self._prepare_tech_context(tech_stack, repository_data)
            
            prompt = f"""
            Analyze this repository's technology stack and enhance the analysis:

            Current Analysis:
            {context}

            Repository Files:
            {self._get_relevant_files_summary(repository_data, ['package.json', 'requirements.txt', 'pom.xml', 'README.md'])}

            Please provide:
            1. Missing technologies that weren't detected
            2. Version information if available
            3. Brief explanations for detected technologies
            4. Architecture insights
            5. Any missing build or deployment configurations

            Respond in JSON format with the enhanced data.
            """
            
            response = await self._call_llm(prompt)
            return self._parse_enhancement_response(response)
            
        except Exception as e:
            logger.error(f"Technology stack enhancement failed: {e}")
            return {}
    
    async def _enhance_dependencies(
        self,
        dep_analysis: DependencyAnalysis,
        repository_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhance dependency analysis with security insights and recommendations."""
        try:
            context = {
                "total_dependencies": dep_analysis.total_dependencies,
                "production_count": dep_analysis.production_dependencies,
                "dev_count": dep_analysis.dev_dependencies,
                "security_score": dep_analysis.security_score,
                "vulnerabilities": len(dep_analysis.vulnerabilities)
            }
            
            prompt = f"""
            Analyze this repository's dependencies and provide security insights:

            Current Analysis:
            {context}

            Dependencies:
            {self._get_relevant_files_summary(repository_data, ['package.json', 'requirements.txt', 'pom.xml', 'build.gradle'])}

            Please provide:
            1. Security recommendations
            2. Dependency optimization suggestions
            3. Alternative package suggestions if applicable
            4. Update strategies
            5. Risk assessment

            Focus on actionable insights for developers.
            """
            
            response = await self._call_llm(prompt)
            return self._parse_enhancement_response(response)
            
        except Exception as e:
            logger.error(f"Dependency enhancement failed: {e}")
            return {}
    
    async def _enhance_code_analysis(
        self,
        code_analysis: CodeAnalysis,
        repository_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhance code analysis with architectural insights and recommendations."""
        try:
            context = {
                "quality_score": code_analysis.quality_score,
                "complexity_score": code_analysis.complexity_score,
                "maintainability_score": code_analysis.maintainability_score,
                "patterns_detected": code_analysis.patterns_detected,
                "code_smells": len(code_analysis.code_smells)
            }
            
            prompt = f"""
            Analyze this repository's code quality and architecture:

            Current Analysis:
            {context}

            Code Structure:
            {self._get_code_structure_summary(repository_data)}

            Please provide:
            1. Architectural improvement suggestions
            2. Code quality enhancement recommendations
            3. Design pattern optimization advice
            4. Refactoring priorities
            5. Best practices alignment

            Focus on practical, implementable improvements.
            """
            
            response = await self._call_llm(prompt)
            return self._parse_enhancement_response(response)
            
        except Exception as e:
            logger.error(f"Code analysis enhancement failed: {e}")
            return {}
    
    async def _enhance_build_config(
        self,
        build_config: BuildConfiguration,
        repository_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhance build configuration with missing commands and optimizations."""
        try:
            context = {
                "build_commands": build_config.build_commands,
                "start_commands": build_config.start_commands,
                "test_commands": build_config.test_commands,
                "entry_points": build_config.entry_points,
                "ports": build_config.ports
            }
            
            prompt = f"""
            Analyze this repository's build configuration and suggest improvements:

            Current Configuration:
            {context}

            Build Files:
            {self._get_relevant_files_summary(repository_data, ['package.json', 'Makefile', 'docker-compose.yml', 'Dockerfile'])}

            Please provide:
            1. Missing build commands
            2. Optimization suggestions
            3. Additional scripts that could be beneficial
            4. Build performance improvements
            5. Environment-specific configurations

            Focus on practical build and deployment improvements.
            """
            
            response = await self._call_llm(prompt)
            return self._parse_enhancement_response(response)
            
        except Exception as e:
            logger.error(f"Build config enhancement failed: {e}")
            return {}
    
    async def _generate_deployment_insights(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate deployment-specific insights and recommendations."""
        try:
            context = {
                "technologies": analysis_result.technology_stack.languages + 
                             analysis_result.technology_stack.frameworks,
                "databases": analysis_result.technology_stack.databases,
                "ports": analysis_result.build_configuration.ports,
                "environment_vars": analysis_result.build_configuration.environment_variables
            }
            
            prompt = f"""
            Analyze this repository for deployment insights:

            Technology Stack:
            {context}

            Docker/Deployment Files:
            {self._get_relevant_files_summary(repository_data, ['Dockerfile', 'docker-compose.yml', '.env', 'deploy.yml'])}

            Please provide deployment insights including:
            1. Recommended deployment strategies
            2. Containerization recommendations
            3. Environment configuration suggestions
            4. Scaling considerations
            5. Monitoring and health check recommendations

            Focus on practical deployment guidance.
            """
            
            response = await self._call_llm(prompt)
            return self._parse_enhancement_response(response)
            
        except Exception as e:
            logger.error(f"Deployment insights generation failed: {e}")
            return {}
    
    async def _generate_overall_insights(
        self,
        analysis_result: AnalysisResult,
        repository_data: Dict[str, Any]
    ) -> List[InsightModel]:
        """Generate overall insights and recommendations for the repository."""
        try:
            # Prepare comprehensive context
            context = {
                "technology_stack": {
                    "languages": analysis_result.technology_stack.languages,
                    "frameworks": analysis_result.technology_stack.frameworks,
                    "databases": analysis_result.technology_stack.databases
                },
                "quality_metrics": {
                    "code_quality": analysis_result.code_analysis.quality_score,
                    "security_score": analysis_result.dependency_analysis.security_score,
                    "complexity": analysis_result.code_analysis.complexity_score
                },
                "architecture": analysis_result.code_analysis.patterns_detected
            }
            
            prompt = f"""
            Provide comprehensive insights for this repository:

            Analysis Summary:
            {context}

            README Content:
            {self._get_readme_summary(repository_data)}

            Generate 3-5 key insights covering:
            1. Overall project assessment
            2. Technology choices evaluation
            3. Security and quality recommendations
            4. Development workflow suggestions
            5. Future improvement roadmap

            Each insight should be actionable and specific to this project.
            Return as a JSON array of insights with title, description, type, and priority.
            """
            
            response = await self._call_llm(prompt)
            insights_data = self._parse_enhancement_response(response)
            
            # Convert to InsightModel objects
            insights = []
            if isinstance(insights_data, list):
                for insight_data in insights_data:
                    try:
                        insight = InsightModel(
                            title=insight_data.get('title', 'General Insight'),
                            description=insight_data.get('description', ''),
                            type=insight_data.get('type', 'recommendation'),
                            priority=insight_data.get('priority', 'medium'),
                            confidence=0.8  # LLM-generated insights have medium-high confidence
                        )
                        insights.append(insight)
                    except Exception as e:
                        logger.warning(f"Failed to create insight model: {e}")
                        continue
            
            return insights
            
        except Exception as e:
            logger.error(f"Overall insights generation failed: {e}")
            return []
    
    async def _call_llm(self, prompt: str) -> str:
        """Make an LLM API call with proper error handling."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert software architect and DevOps engineer. Provide accurate, actionable insights for software projects. Always respond in valid JSON format when requested."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"LLM API call failed: {e}")
            raise
    
    def _parse_enhancement_response(self, response: str) -> Dict[str, Any]:
        """Parse LLM response and extract enhancement data."""
        try:
            import json
            # Try to extract JSON from the response
            if response.startswith('```json'):
                response = response.replace('```json', '').replace('```', '').strip()
            elif response.startswith('```'):
                response = response.replace('```', '').strip()
                
            return json.loads(response)
            
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM response as JSON: {e}")
            # Return empty dict if parsing fails
            return {}
    
    def _prepare_tech_context(self, tech_stack: TechnologyStack, repository_data: Dict[str, Any]) -> str:
        """Prepare technology stack context for LLM."""
        return f"""
        Languages: {', '.join(tech_stack.languages)}
        Frameworks: {', '.join(tech_stack.frameworks)}
        Databases: {', '.join(tech_stack.databases)}
        Package Managers: {', '.join(tech_stack.package_managers)}
        Build Tools: {', '.join(tech_stack.build_tools)}
        """
    
    def _get_relevant_files_summary(self, repository_data: Dict[str, Any], filenames: List[str]) -> str:
        """Extract relevant file contents for LLM context."""
        summary = []
        files = repository_data.get('files', {})
        
        for filename in filenames:
            for file_path, content in files.items():
                if filename in file_path.lower():
                    # Truncate large files
                    truncated_content = content[:1000] + "..." if len(content) > 1000 else content
                    summary.append(f"\n{file_path}:\n{truncated_content}")
                    break
        
        return '\n'.join(summary) if summary else "No relevant files found"
    
    def _get_code_structure_summary(self, repository_data: Dict[str, Any]) -> str:
        """Generate a summary of the code structure."""
        files = repository_data.get('files', {})
        structure = []
        
        # Count files by type
        file_types = {}
        for file_path in files.keys():
            ext = file_path.split('.')[-1] if '.' in file_path else 'no_ext'
            file_types[ext] = file_types.get(ext, 0) + 1
        
        structure.append(f"File types: {dict(sorted(file_types.items()))}")
        
        # Sample directory structure
        directories = set()
        for file_path in files.keys():
            parts = file_path.split('/')
            for i in range(1, len(parts)):
                directories.add('/'.join(parts[:i]))
        
        structure.append(f"Directory structure depth: {len(directories)} directories")
        
        return '\n'.join(structure)
    
    def _get_readme_summary(self, repository_data: Dict[str, Any]) -> str:
        """Extract README content for context."""
        files = repository_data.get('files', {})
        
        for file_path, content in files.items():
            if 'readme' in file_path.lower():
                # Return first 500 characters of README
                return content[:500] + "..." if len(content) > 500 else content
        
        return "No README found"
    
    async def _apply_enhancement_result(
        self,
        analysis_result: AnalysisResult,
        enhancement_data: Dict[str, Any],
        task_index: int
    ):
        """Apply enhancement results to the analysis result object."""
        try:
            # Map task index to component enhancement
            if task_index == 0:  # Technology stack
                await self._apply_tech_enhancements(analysis_result.technology_stack, enhancement_data)
            elif task_index == 1:  # Dependencies
                await self._apply_dependency_enhancements(analysis_result.dependency_analysis, enhancement_data)
            elif task_index == 2:  # Code analysis
                await self._apply_code_enhancements(analysis_result.code_analysis, enhancement_data)
            elif task_index == 3:  # Build config
                await self._apply_build_enhancements(analysis_result.build_configuration, enhancement_data)
            elif task_index == 4:  # Deployment insights
                await self._apply_deployment_enhancements(analysis_result.deployment_configuration, enhancement_data)
                
        except Exception as e:
            logger.warning(f"Failed to apply enhancement result for task {task_index}: {e}")
    
    async def _apply_tech_enhancements(self, tech_stack: TechnologyStack, data: Dict[str, Any]):
        """Apply technology stack enhancements."""
        if 'missing_technologies' in data:
            # Add missing technologies detected by LLM
            missing = data['missing_technologies']
            tech_stack.languages.extend(missing.get('languages', []))
            tech_stack.frameworks.extend(missing.get('frameworks', []))
            tech_stack.databases.extend(missing.get('databases', []))
    
    async def _apply_dependency_enhancements(self, dep_analysis: DependencyAnalysis, data: Dict[str, Any]):
        """Apply dependency analysis enhancements."""
        if 'recommendations' in data:
            # Add LLM-generated recommendations to insights
            recommendations = data['recommendations']
            for rec in recommendations:
                if isinstance(rec, str):
                    dep_analysis.recommendations.append(rec)
    
    async def _apply_code_enhancements(self, code_analysis: CodeAnalysis, data: Dict[str, Any]):
        """Apply code analysis enhancements."""
        if 'architectural_suggestions' in data:
            # Add architectural suggestions
            suggestions = data['architectural_suggestions']
            for suggestion in suggestions:
                if isinstance(suggestion, str):
                    code_analysis.recommendations.append(suggestion)
    
    async def _apply_build_enhancements(self, build_config: BuildConfiguration, data: Dict[str, Any]):
        """Apply build configuration enhancements."""
        if 'missing_commands' in data:
            missing = data['missing_commands']
            build_config.build_commands.extend(missing.get('build', []))
            build_config.start_commands.extend(missing.get('start', []))
            build_config.test_commands.extend(missing.get('test', []))
    
    async def _apply_deployment_enhancements(self, deploy_config: DeploymentConfiguration, data: Dict[str, Any]):
        """Apply deployment configuration enhancements."""
        if 'deployment_strategies' in data:
            strategies = data['deployment_strategies']
            if isinstance(strategies, list):
                deploy_config.deployment_strategies.extend(strategies)
