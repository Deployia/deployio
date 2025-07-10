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
        cls, analysis_result: Any, repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generate prompts for technology stack enhancement.
        Uses rule-based analysis as foundation and sends only summary data to LLM.
        """
        system_prompt = cls.create_system_prompt(
            role="Senior Software Architect and Technology Expert",
            expertise=[
                "Technology stack validation and enhancement",
                "Framework detection refinement", 
                "Architecture pattern recognition",
                "Missing technology identification",
            ],
            guidelines=[
                "Enhance and validate the rule-based analysis provided",
                "Focus on missing technologies or incorrect detections",
                "Provide concise insights based on the repository summary",
                "Fill gaps in the rule-based analysis rather than re-analyzing everything",
                "Be conservative - only suggest changes with high confidence",
            ],
        )

        repository_summary = cls.format_repository_summary(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        key_indicators = cls.extract_key_technology_indicators(repository_data)

        user_prompt = f"""
{repository_summary}

RULE-BASED ANALYSIS RESULTS:
{analysis_summary}

KEY TECHNOLOGY INDICATORS:
{key_indicators}

ENHANCEMENT TASK:
Based on the rule-based analysis above, identify any missing technologies, validate current detections, or suggest improvements. Focus on enhancing the existing analysis rather than re-doing it completely.

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "enhancements": {{
        "additional_technologies": ["tech1", "tech2"],
        "corrected_technologies": {{"old": "new"}},
        "confidence_improvements": {{"technology": "confidence_reason"}},
        "missing_frameworks": ["framework1", "framework2"]
    }},
    "architecture_insights": [
        {{
            "pattern": "pattern_name",
            "confidence": 0.95,
            "evidence": "Why this pattern was identified"
        }}
    ],
    "recommendations": [
        {{
            "type": "enhancement",
            "title": "Recommendation title", 
            "description": "Brief recommendation",
            "priority": "high|medium|low"
        }}
    ]
}}
"""

        return {"system": system_prompt, "user": user_prompt}

    @classmethod
    def dependency_enhancement(
        cls, analysis_result: Any, repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate prompts for dependency analysis enhancement using summaries."""

        system_prompt = cls.create_system_prompt(
            role="Security Expert and Dependency Analyst",
            expertise=[
                "Dependency security analysis",
                "Package vulnerability assessment", 
                "Dependency optimization strategies",
                "License compliance analysis",
            ],
            guidelines=[
                "Enhance the rule-based dependency analysis provided",
                "Focus on security vulnerabilities and optimization opportunities",
                "Provide insights based on dependency summary rather than full file contents",
                "Be concise and actionable in recommendations",
                "Validate and enhance existing findings",
            ],
        )

        repository_summary = cls.format_repository_summary(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        dependency_summary = cls.extract_dependency_summary(repository_data)

        user_prompt = f"""
{repository_summary}

RULE-BASED DEPENDENCY ANALYSIS:
{analysis_summary}

DEPENDENCY SUMMARY:
{dependency_summary}

ENHANCEMENT TASK:
Based on the rule-based dependency analysis, identify security concerns, optimization opportunities, and validation of current findings.

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "security_enhancements": {{
        "critical_issues": ["issue1", "issue2"],
        "recommendations": ["rec1", "rec2"],
        "risk_assessment": "overall risk evaluation"
    }},
    "optimization_suggestions": {{
        "redundant_packages": ["pkg1", "pkg2"], 
        "alternatives": ["suggestion1", "suggestion2"],
        "bundle_optimization": "optimization insights"
    }},
    "validation_results": {{
        "confirmed_vulnerabilities": ["vuln1", "vuln2"],
        "false_positives": ["fp1", "fp2"],
        "additional_concerns": ["concern1", "concern2"]
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
    ],
    "null_field_explanations": {{
        "field_name": "Explanation for why this field is null or filled from fallback"
    }}
}}
"""

        return {"system": system_prompt, "user": user_prompt}

    @classmethod
    def dependency_analysis_enhancement(
        cls, analysis_result: Any, repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Alias for dependency_enhancement method for backward compatibility."""
        return cls.dependency_enhancement(analysis_result, repository_data)

    @classmethod
    def code_quality_enhancement(
        cls, analysis_result: Any, repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate prompts for code quality analysis enhancement using summaries."""

        system_prompt = cls.create_system_prompt(
            role="Senior Code Architect and Quality Expert",
            expertise=[
                "Code quality assessment and metrics",
                "Design pattern recognition", 
                "Architecture evaluation",
                "Code smell detection",
            ],
            guidelines=[
                "Enhance the rule-based code analysis provided",
                "Focus on architectural insights and quality improvements",
                "Provide actionable recommendations based on code structure summary",
                "Validate and enhance existing quality metrics",
                "Be concise and focus on high-impact improvements",
            ],
        )

        repository_summary = cls.format_repository_summary(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        code_structure = cls.extract_code_structure_summary(repository_data)

        user_prompt = f"""
{repository_summary}

RULE-BASED CODE ANALYSIS:
{analysis_summary}

CODE STRUCTURE SUMMARY:
{code_structure}

ENHANCEMENT TASK:
Based on the rule-based code analysis, provide architectural insights and quality improvements.

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "architecture_insights": {{
        "patterns_detected": ["pattern1", "pattern2"],
        "architecture_score": 85,
        "structural_strengths": ["strength1", "strength2"],
        "improvement_areas": ["area1", "area2"]
    }},
    "quality_enhancements": {{
        "maintainability_suggestions": ["suggestion1", "suggestion2"],
        "complexity_concerns": ["concern1", "concern2"],
        "refactoring_opportunities": ["opportunity1", "opportunity2"]
    }},
    "recommendations": [
        {{
            "category": "architecture|quality|testing|performance",
            "title": "Recommendation title",
            "description": "Brief recommendation",
            "impact": "high|medium|low"
        }}
    ]
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
    ],
    "null_field_explanations": {{
        "field_name": "Explanation for why this field is null or filled from fallback"
    }}
}}
"""

        return {"system": system_prompt, "user": user_prompt}

    @classmethod
    def comprehensive_insights(
        cls, analysis_result: Any, repository_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate prompts for comprehensive project insights using summaries."""

        system_prompt = cls.create_system_prompt(
            role="Senior Technical Consultant and Project Analyst",
            expertise=[
                "Project assessment and strategy",
                "Technology roadmapping",
                "Development workflow optimization",
                "Deployment best practices",
            ],
            guidelines=[
                "Provide high-level insights based on the rule-based analysis",
                "Focus on strategic recommendations and project assessment",
                "Use repository summary rather than detailed file analysis",
                "Be concise and actionable in recommendations",
                "Identify key opportunities and risks",
            ],
        )

        repository_summary = cls.format_repository_summary(repository_data)
        analysis_summary = cls.format_analysis_summary(analysis_result)
        project_overview = cls.extract_project_overview(repository_data)

        user_prompt = f"""
{repository_summary}

COMPREHENSIVE ANALYSIS RESULTS:
{analysis_summary}

PROJECT OVERVIEW:
{project_overview}

INSIGHTS TASK:
Provide strategic insights and high-level recommendations based on the analysis results.

{cls.format_json_response_instruction()}

Expected JSON structure:
{{
    "project_assessment": {{
        "maturity_level": "early|developing|mature|legacy",
        "health_score": 85,
        "key_strengths": ["strength1", "strength2"],
        "improvement_opportunities": ["opp1", "opp2"]
    }},
    "strategic_insights": {{
        "technology_alignment": "brief assessment",
        "scaling_considerations": ["consideration1", "consideration2"],
        "deployment_readiness": "readiness assessment"
    }},
    "recommendations": [
        {{
            "type": "enhancement|optimization|security|deployment",
            "priority": "high|medium|low",
            "title": "Strategic recommendation",
            "description": "Brief strategic guidance",
            "reasoning": "Why this recommendation is important",
            "implementation": "Optional implementation guidance"
        }}
    ]
}}
"""

        return {"system": system_prompt, "user": user_prompt}
