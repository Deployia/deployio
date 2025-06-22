"""
Enhanced prompt templates for LLM enhancement with detailed reasoning
"""

from typing import Dict, Any


class PromptTemplates:
    """Centralized management of enhanced LLM prompts with reasoning"""

    @staticmethod
    def get_enhanced_technology_detection_prompt(context: Dict[str, Any]) -> str:
        """
        Enhanced prompt for technology detection with detailed reasoning

        Args:
            context: Analysis context with current results and file contents

        Returns:
            Formatted prompt for enhanced technology detection
        """
        current_analysis = context.get("current_analysis", {})
        key_files = context.get("key_files", {})

        # Build file content section
        file_content = ""
        for filename, content in key_files.items():
            file_content += f"\n--- {filename} ---\n{content[:1500]}\n"

        prompt = f"""
You are an expert software architect with deep knowledge of technology stacks, frameworks, and development patterns. 

CONTEXT:
Repository URL: {context.get('repository_url', 'unknown')}

Current Rule-Based Analysis:
- Language: {current_analysis.get('language', 'unknown')}
- Framework: {current_analysis.get('framework', 'unknown')}
- Confidence: {current_analysis.get('confidence', 0):.2f}
- Detected Technologies: {current_analysis.get('detected_technologies', [])}

Repository Files Analysis:
{file_content}

TASK:
Analyze the repository comprehensively and provide enhanced technology detection with detailed reasoning.

ANALYSIS REQUIREMENTS:
1. **Primary Technology Stack**: Identify the main language, framework, and architecture
2. **Secondary Technologies**: Detect supporting tools, libraries, and services
3. **Architecture Pattern**: Determine the architectural approach (MVC, microservices, serverless, etc.)
4. **Deployment Strategy**: Identify containerization, cloud services, and deployment tools
5. **Confidence Assessment**: Rate confidence based on evidence strength
6. **Missing Information**: Explain why certain fields might be null or uncertain

RESPONSE FORMAT:
Respond with ONLY valid JSON in this exact format:
{{
    "technology_detection": {{
        "language": "primary_language",
        "framework": "main_framework",
        "database": "database_type_or_null",
        "architecture_pattern": "detected_pattern",
        "deployment_strategy": "deployment_approach",
        "additional_technologies": ["tech1", "tech2", "tech3"],
        "confidence": 0.85,
        "detection_method": "llm_enhanced"
    }},
    "reasoning": {{
        "language_reasoning": "Why this language was identified",
        "framework_reasoning": "Evidence for framework detection",
        "architecture_reasoning": "Architectural pattern justification",
        "confidence_reasoning": "Why this confidence level",
        "null_field_explanations": {{
            "database": "Why database field is null if applicable",
            "deployment_strategy": "Why deployment strategy is unclear if applicable"
        }}
    }},
    "evidence": {{
        "strong_indicators": ["file1.ext: specific evidence", "pattern: evidence"],
        "weak_indicators": ["possible evidence"],
        "contradictory_evidence": ["conflicting signs if any"]
    }},
    "insights": [
        {{
            "category": "detection",
            "title": "Primary Framework Detection",
            "description": "Detected React.js based on package.json dependencies",
            "reasoning": "package.json contains react dependencies and jsx files present",
            "confidence": 0.9,
            "evidence": ["package.json: react dependency", "src/*.jsx files"]
        }}
    ]
}}

GUIDELINES:
- Base confidence on actual evidence from files
- Explain any null or uncertain fields
- Provide specific file evidence for each detection
- Consider version patterns and compatibility
- Account for monorepo or multi-service architectures
"""
        return prompt.strip()

    @staticmethod
    def get_optimization_prompt(context: Dict[str, Any]) -> str:
        """
        Build prompt for optimization and insights phase

        Args:
            context: Enhanced context with technology detection results

        Returns:
            Formatted prompt for optimization recommendations
        """
        tech_data = context.get("technology_data", {})
        original_analysis = context.get("original_analysis", {})

        prompt = f"""
You are an expert DevOps engineer providing optimization recommendations for a software project.

Detected Technology Stack:
- Language: {tech_data.get('language', 'unknown')}
- Framework: {tech_data.get('framework', 'unknown')}
- Database: {tech_data.get('database', 'none')}
- Architecture: {tech_data.get('architecture_pattern', 'unknown')}
- Additional Technologies: {tech_data.get('additional_technologies', [])}

Current Confidence: {original_analysis.get('confidence', 0)}

Your task is to provide optimization recommendations and insights:
1. Best practices for the detected technology stack
2. Performance optimization suggestions
3. Security recommendations
4. Deployment strategy recommendations
5. Additional tools and technologies that would benefit this project

Respond with ONLY valid JSON in this exact format:
{{
    "recommendations": [
        {{
            "type": "performance|security|deployment|monitoring|testing",
            "priority": "high|medium|low", 
            "suggestion": "Specific actionable recommendation",
            "reason": "Why this is important"
        }}
    ],
    "additional_insights": [
        "Insight 1 about the codebase",
        "Insight 2 about architecture"
    ],
    "confidence_boost": 0.15,
    "reasoning": "Explanation of analysis and confidence boost",
    "deployment_strategy": "recommended_deployment_approach",
    "best_practices": ["practice1", "practice2"]
}}

Confidence boost should be 0.0-0.3 based on how much the analysis adds clarity.
Focus on actionable, technology-specific recommendations.
"""
        return prompt.strip()

    @staticmethod
    def get_comprehensive_analysis_prompt(context: Dict[str, Any]) -> str:
        """
        Build prompt for comprehensive analysis (combines detection + optimization)

        Args:
            context: Full analysis context

        Returns:
            Formatted prompt for comprehensive analysis
        """
        current_analysis = context.get("current_analysis", {})
        key_files = context.get("key_files", {})

        # Build file content section
        file_content = ""
        for filename, content in key_files.items():
            file_content += f"\n--- {filename} ---\n{content[:800]}\n"

        prompt = f"""
You are an expert software architect and DevOps engineer analyzing a repository.

Current Analysis:
- Language: {current_analysis.get('language', 'unknown')}
- Framework: {current_analysis.get('framework', 'unknown')} 
- Confidence: {current_analysis.get('confidence', 0)}

Repository Files:
{file_content}

Perform comprehensive analysis:
1. Technology Stack Detection - verify and enhance detected technologies
2. Architecture Analysis - identify patterns and structure
3. Optimization Recommendations - provide actionable improvements

Respond with ONLY valid JSON in this exact format:
{{
    "technology_stack": {{
        "language": "detected_language",
        "framework": "primary_framework",
        "database": "database_type_or_null", 
        "additional_technologies": ["tech1", "tech2"],
        "architecture_pattern": "pattern_or_null"
    }},
    "confidence": 0.85,
    "recommendations": [
        {{
            "type": "performance|security|deployment|monitoring",
            "priority": "high|medium|low",
            "suggestion": "Specific recommendation",
            "reason": "Justification"
        }}
    ],
    "additional_insights": ["insight1", "insight2"],
    "reasoning": "Analysis explanation",
    "confidence_boost": 0.15
}}

Be accurate, evidence-based, and provide actionable recommendations.
"""
        return prompt.strip()

    @staticmethod
    def get_code_quality_prompt(context: Dict[str, Any]) -> str:
        """
        Build prompt for code quality analysis

        Args:
            context: Code analysis context

        Returns:
            Formatted prompt for code quality assessment
        """
        code_files = context.get("code_files", {})

        # Build code samples
        code_content = ""
        for filename, content in code_files.items():
            code_content += f"\n--- {filename} ---\n{content[:1200]}\n"

        prompt = f"""
You are a senior software engineer reviewing code quality.

Code Samples:
{code_content}

Analyze the code quality focusing on:
1. Code structure and organization
2. Best practices adherence
3. Potential issues or anti-patterns
4. Maintainability and readability
5. Performance considerations

Respond with ONLY valid JSON in this exact format:
{{
    "quality_score": 0.75,
    "maintainability": "high|medium|low",
    "issues": [
        {{
            "type": "structure|performance|security|style",
            "severity": "high|medium|low",
            "description": "Issue description",
            "suggestion": "How to fix it"
        }}
    ],
    "strengths": ["strength1", "strength2"],
    "recommendations": ["improvement1", "improvement2"],
    "complexity_assessment": "low|medium|high"
}}

Focus on constructive feedback and actionable improvements.
"""
        return prompt.strip()

    @staticmethod
    def get_security_analysis_prompt(context: Dict[str, Any]) -> str:
        """
        Build prompt for security analysis

        Args:
            context: Security analysis context

        Returns:
            Formatted prompt for security assessment
        """
        tech_stack = context.get("technology_stack", {})
        config_files = context.get("config_files", {})

        # Build config content
        config_content = ""
        for filename, content in config_files.items():
            config_content += f"\n--- {filename} ---\n{content[:800]}\n"

        prompt = f"""
You are a cybersecurity expert analyzing application security.

Technology Stack:
- Language: {tech_stack.get('language', 'unknown')}
- Framework: {tech_stack.get('framework', 'unknown')}
- Database: {tech_stack.get('database', 'unknown')}

Configuration Files:
{config_content}

Analyze security aspects:
1. Common vulnerabilities for this tech stack
2. Configuration security issues
3. Best practices compliance
4. Recommended security measures

Respond with ONLY valid JSON in this exact format:
{{
    "security_score": 0.80,
    "vulnerabilities": [
        {{
            "type": "authentication|authorization|injection|xss|csrf|other",
            "severity": "critical|high|medium|low",
            "description": "Vulnerability description", 
            "mitigation": "How to address it"
        }}
    ],
    "recommendations": [
        {{
            "category": "authentication|encryption|monitoring|configuration",
            "priority": "high|medium|low",
            "action": "Specific security action",
            "rationale": "Why this is important"
        }}
    ],
    "compliance_notes": ["note1", "note2"],
    "security_tools": ["tool1", "tool2"]
}}

Focus on practical, implementable security improvements.
"""
        return prompt.strip()

    @staticmethod
    def validate_prompt_context(context: Dict[str, Any], required_keys: list) -> bool:
        """
        Validate that context has required keys for prompt generation

        Args:
            context: Context dictionary
            required_keys: List of required keys

        Returns:
            True if context is valid, False otherwise
        """
        try:
            return all(key in context for key in required_keys)
        except Exception:
            return False
