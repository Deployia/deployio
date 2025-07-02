"""
Analysis Prompt Templates

Specialized prompts for repository analysis enhancement.
Provides structured prompts for technology detection, dependency analysis, and code quality assessment.
"""

from typing import Dict, Any, List
from .base_prompts import BasePrompts


class AnalysisPrompts(BasePrompts):
    """
    Prompt templates for analysis enhancement tasks.
    """
    
    @classmethod
    def technology_stack_enhancement(
        cls,
        analysis_result: Any,
        repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generate prompts for technology stack enhancement.
        
        Args:
            analysis_result: Current analysis results
            repository_data: Repository data with files and metadata
            
        Returns:
            Dictionary with system and user prompts
        """
        system_prompt = cls.create_system_prompt(
            role="Senior Software Architect and Technology Expert",
            expertise=[
                "Multi-language technology stack identification",
                "Framework and library analysis",
                "Build tool and package manager detection",
                "Architecture pattern recognition",
                "Technology compatibility and best practices"
            ],
            guidelines=[
                "Analyze file contents and dependencies to identify technologies",
                "Consider both explicit and implicit technology indicators",
                "Evaluate technology choices for appropriateness and modernity",
                "Identify missing or additional technologies not detected by rules",
                "Provide confidence scores for all identifications"
            ]
        )
        
        repository_context = cls.format_repository_context(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        file_contents = cls.format_file_contents(
            repository_data.get('key_files', {}),
            max_files=12
        )
        
        user_prompt = f"""
{repository_context}

{analysis_summary}

REPOSITORY FILES:
{file_contents}

ENHANCEMENT TASK:
Enhance the technology stack analysis by:

1. **Technology Validation**: Verify detected technologies and identify any missed
2. **Framework Details**: Add specific framework versions and configurations
3. **Architecture Insights**: Identify architectural patterns and design approaches
4. **Technology Recommendations**: Suggest improvements or missing technologies
5. **Build Configuration**: Identify build tools, scripts, and deployment patterns

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "enhanced_technologies": {{
        "languages": ["language1", "language2"],
        "frameworks": ["framework1", "framework2"],
        "databases": ["db1", "db2"],
        "additional_tools": ["tool1", "tool2"]
    }},
    "technology_insights": [
        {{
            "technology": "technology_name",
            "confidence": 0.95,
            "reasoning": "Why this technology was identified",
            "usage_context": "How it's used in the project"
        }}
    ],
    "architecture_patterns": ["pattern1", "pattern2"],
    "build_configuration": {{
        "build_tools": ["tool1", "tool2"],
        "scripts": ["script1", "script2"],
        "entry_points": ["file1", "file2"],
        "deployment_ready": true
    }},
    "recommendations": [
        {{
            "type": "enhancement",
            "title": "Recommendation title",
            "description": "Detailed recommendation",
            "priority": "high|medium|low"
        }}
    ]
}}
"""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
    
    @classmethod
    def dependency_enhancement(
        cls,
        analysis_result: Any,
        repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate prompts for dependency analysis enhancement."""
        
        system_prompt = cls.create_system_prompt(
            role="Security Expert and Dependency Analyst",
            expertise=[
                "Dependency security analysis",
                "Package vulnerability assessment", 
                "Dependency optimization strategies",
                "License compliance analysis",
                "Supply chain security best practices"
            ],
            guidelines=[
                "Analyze dependencies for security vulnerabilities",
                "Assess dependency health and maintenance status",
                "Identify outdated or deprecated packages",
                "Recommend security improvements and alternatives",
                "Consider dependency tree complexity and optimization"
            ]
        )
        
        repository_context = cls.format_repository_context(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        
        # Focus on dependency-related files
        dep_files = {}
        key_files = repository_data.get('key_files', {})
        dep_file_patterns = [
            'package.json', 'package-lock.json', 'yarn.lock',
            'requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile',
            'pom.xml', 'build.gradle', 'composer.json', 'Gemfile', 'Cargo.toml', 'go.mod'
        ]
        
        for filename, content in key_files.items():
            if any(pattern in filename for pattern in dep_file_patterns):
                dep_files[filename] = content
        
        file_contents = cls.format_file_contents(dep_files, max_files=8)
        
        user_prompt = f"""
{repository_context}

{analysis_summary}

DEPENDENCY FILES:
{file_contents}

ENHANCEMENT TASK:
Enhance the dependency analysis by:

1. **Security Assessment**: Identify potential security vulnerabilities
2. **Dependency Health**: Evaluate maintenance status and update needs
3. **Optimization Opportunities**: Find redundant or unnecessary dependencies
4. **Alternative Recommendations**: Suggest better or more secure alternatives
5. **License Compliance**: Identify license conflicts or compliance issues

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "security_analysis": {{
        "risk_score": 85,
        "vulnerabilities": [
            {{
                "dependency": "package_name",
                "severity": "high|medium|low",
                "description": "Vulnerability description",
                "recommendation": "How to fix"
            }}
        ],
        "security_recommendations": ["rec1", "rec2"]
    }},
    "dependency_health": {{
        "outdated_packages": ["pkg1", "pkg2"],
        "deprecated_packages": ["pkg1", "pkg2"],
        "maintenance_score": 78,
        "update_recommendations": [
            {{
                "package": "package_name",
                "current_version": "1.0.0",
                "recommended_version": "2.0.0",
                "reasoning": "Why update is recommended"
            }}
        ]
    }},
    "optimization": {{
        "redundant_dependencies": ["pkg1", "pkg2"],
        "bundle_size_impact": "Analysis of bundle size",
        "alternatives": [
            {{
                "current": "current_package",
                "alternative": "better_package",
                "benefits": "Why alternative is better"
            }}
        ]
    }},
    "recommendations": [
        {{
            "type": "security|optimization|maintenance",
            "title": "Recommendation title",
            "description": "Detailed recommendation",
            "priority": "high|medium|low"
        }}
    ]
}}
"""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
    
    @classmethod
    def code_quality_enhancement(
        cls,
        analysis_result: Any,
        repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate prompts for code quality analysis enhancement."""
        
        system_prompt = cls.create_system_prompt(
            role="Senior Code Architect and Quality Expert",
            expertise=[
                "Code quality assessment and metrics",
                "Design pattern recognition", 
                "Architecture evaluation",
                "Maintainability analysis",
                "Code smell detection and refactoring strategies"
            ],
            guidelines=[
                "Analyze code structure and patterns for quality indicators",
                "Identify architectural strengths and weaknesses",
                "Recommend specific improvements for maintainability",
                "Assess code complexity and suggest simplifications",
                "Evaluate testing patterns and coverage adequacy"
            ]
        )
        
        repository_context = cls.format_repository_context(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        
        # Focus on source code files
        source_files = {}
        key_files = repository_data.get('key_files', {})
        source_extensions = ['.js', '.ts', '.py', '.java', '.go', '.rs', '.php', '.rb']
        config_files = ['tsconfig.json', 'eslint', 'babel', 'webpack', 'vite']
        
        for filename, content in key_files.items():
            if (any(filename.endswith(ext) for ext in source_extensions) or
                any(config in filename for config in config_files)):
                source_files[filename] = content
        
        file_contents = cls.format_file_contents(source_files, max_files=10, max_length=1200)
        
        user_prompt = f"""
{repository_context}

{analysis_summary}

SOURCE CODE FILES:
{file_contents}

ENHANCEMENT TASK:
Enhance the code quality analysis by:

1. **Architecture Assessment**: Evaluate overall code organization and patterns
2. **Quality Metrics**: Assess maintainability, readability, and complexity
3. **Design Patterns**: Identify used patterns and suggest improvements
4. **Code Smells**: Detect anti-patterns and problematic code structures
5. **Best Practices**: Evaluate adherence to language/framework best practices

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "architecture_assessment": {{
        "overall_score": 82,
        "architecture_patterns": ["MVC", "Repository"],
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "modularity_score": 75
    }},
    "quality_metrics": {{
        "maintainability_score": 80,
        "readability_score": 85,
        "complexity_assessment": "Analysis of code complexity",
        "test_coverage_analysis": "Assessment of testing patterns"
    }},
    "code_smells": [
        {{
            "type": "code_smell_type",
            "description": "Description of the issue",
            "files_affected": ["file1.js", "file2.py"],
            "severity": "high|medium|low",
            "fix_suggestion": "How to address this issue"
        }}
    ],
    "design_patterns": [
        {{
            "pattern": "pattern_name",
            "usage": "How it's used",
            "effectiveness": "Assessment of implementation"
        }}
    ],
    "recommendations": [
        {{
            "category": "architecture|quality|testing|performance",
            "title": "Recommendation title",
            "description": "Detailed recommendation",
            "effort": "low|medium|high",
            "impact": "low|medium|high"
        }}
    ]
}}
"""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
    
    @classmethod
    def comprehensive_insights(
        cls,
        analysis_result: Any,
        repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate prompts for comprehensive project insights."""
        
        system_prompt = cls.create_system_prompt(
            role="Senior Technical Consultant and Project Analyst",
            expertise=[
                "Full-stack project assessment",
                "Technology strategy and roadmapping",
                "Development workflow optimization",
                "Deployment and DevOps best practices",
                "Project scalability and performance analysis"
            ],
            guidelines=[
                "Provide holistic assessment of the entire project",
                "Consider scalability, maintainability, and performance",
                "Evaluate development and deployment workflows",
                "Identify strategic technology decisions and their implications",
                "Recommend actionable improvements with clear priorities"
            ]
        )
        
        repository_context = cls.format_repository_context(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        
        # Get overview of all files
        file_contents = cls.format_file_contents(
            repository_data.get('key_files', {}),
            max_files=15,
            max_length=1000
        )
        
        user_prompt = f"""
{repository_context}

{analysis_summary}

REPOSITORY OVERVIEW:
{file_contents}

COMPREHENSIVE ANALYSIS TASK:
Provide strategic insights covering:

1. **Project Assessment**: Overall project health and maturity
2. **Technology Strategy**: Evaluation of technology choices and alignment
3. **Scalability Analysis**: Current and future scalability considerations
4. **Development Workflow**: Assessment of development practices and tooling
5. **Deployment Readiness**: Evaluation of deployment and DevOps practices
6. **Strategic Recommendations**: High-level recommendations for improvement

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "project_assessment": {{
        "maturity_level": "early|developing|mature|legacy",
        "health_score": 85,
        "key_strengths": ["strength1", "strength2"],
        "critical_areas": ["area1", "area2"],
        "overall_assessment": "Comprehensive project evaluation"
    }},
    "technology_strategy": {{
        "technology_alignment": "Assessment of tech choices",
        "modernization_needs": ["need1", "need2"],
        "future_considerations": ["consideration1", "consideration2"]
    }},
    "scalability_analysis": {{
        "current_scalability": "Assessment of current scaling capability",
        "bottlenecks": ["bottleneck1", "bottleneck2"],
        "scaling_recommendations": ["rec1", "rec2"]
    }},
    "development_workflow": {{
        "workflow_score": 78,
        "tooling_assessment": "Evaluation of development tools",
        "process_improvements": ["improvement1", "improvement2"]
    }},
    "deployment_readiness": {{
        "containerization_status": "Assessment of Docker/container readiness",
        "ci_cd_assessment": "Evaluation of CI/CD setup",
        "infrastructure_needs": ["need1", "need2"]
    }},
    "strategic_recommendations": [
        {{
            "category": "technology|architecture|process|deployment",
            "title": "Strategic recommendation",
            "description": "Detailed strategic guidance",
            "timeline": "short|medium|long term",
            "business_impact": "Expected business impact"
        }}
    ]
}}
"""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
