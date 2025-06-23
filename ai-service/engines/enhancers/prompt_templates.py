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
        """  # Extract data from the correct context structure
        rule_based = context.get("rule_based_analysis", {})
        stack_detection = rule_based.get("stack_detection", {})
        dependency_analysis = rule_based.get("dependency_analysis", {})
        file_previews = context.get("file_previews", {})
        repository_info = context.get("repository_info", {})
        detected_files = context.get("detected_files", [])

        # Build file content section
        file_content = ""
        if file_previews:
            for filename, content in file_previews.items():
                file_content += f"\n--- {filename} ---\n{content[:1500]}\n"
        else:
            file_content = "No file previews available - analysis based on dependency and metadata detection."

        # Add detected files information for context
        detected_files_info = ""
        if detected_files:
            detected_files_info = f"""
DETECTED PROJECT FILES:
{detected_files[:15]}  # Show first 15 files
Total Files Detected: {len(detected_files)}
"""

        # Build dependency summary
        dependency_summary = ""
        if dependency_analysis:
            total_deps = dependency_analysis.get("total_dependencies", 0)
            package_managers = dependency_analysis.get("package_managers", [])
            dependencies = dependency_analysis.get("dependencies", [])

            dependency_summary = f"""
DEPENDENCY ANALYSIS DETECTED:
- Total Dependencies: {total_deps}
- Package Managers: {package_managers}
- Key Dependencies: {[dep.get('name', '') for dep in dependencies[:10] if isinstance(dep, dict)]}
- Dependency Categories: {dependency_analysis.get('dependency_categories', {})}
"""

        prompt = f"""
You are an expert software architect with deep knowledge of technology stacks, frameworks, and development patterns. 

CONTEXT:
Repository URL: {repository_info.get('url', 'unknown')}
Branch: {repository_info.get('branch', 'main')}

CURRENT RULE-BASED ANALYSIS:
- Language: {stack_detection.get('language', 'unknown')}
- Framework: {stack_detection.get('framework', 'unknown')}
- Package Manager: {stack_detection.get('package_manager', 'unknown')}
- Build Tool: {stack_detection.get('build_tool', 'unknown')}
- Confidence: {rule_based.get('confidence_score', 0):.2f}
- Additional Technologies: {stack_detection.get('additional_technologies', [])}

{dependency_summary}

{detected_files_info}

REPOSITORY FILES ANALYSIS:
{file_content}

IMPORTANT: Even if file content is limited, you have comprehensive dependency analysis data and file structure information above. Use this data to provide meaningful insights and reasoning.

ANALYSIS REQUIREMENTS:
1. **Primary Technology Stack**: Identify the main language, framework, and architecture
2. **Secondary Technologies**: Detect supporting tools, libraries, and services
3. **Architecture Pattern**: Determine the architectural approach (MVC, microservices, serverless, etc.)
4. **Deployment Strategy**: Identify containerization, cloud services, and deployment tools  
5. **Confidence Assessment**: Rate confidence based on evidence strength
6. **Meaningful Insights**: Generate insights based on detected dependencies and patterns - DO NOT say files are empty
7. **Actionable Recommendations**: Provide specific suggestions based on detected technologies

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
    }},    "insights": [
        {{
            "category": "detection",
            "title": "Primary Framework Detection",
            "description": "Detected React.js based on package.json dependencies",
            "reasoning": "package.json contains react dependencies and jsx files present",
            "confidence": 0.9,
            "evidence": ["package.json: react dependency", "src/*.jsx files"]
        }}
    ],
    "suggestions": [
        {{
            "type": "optimization",
            "priority": "medium",
            "suggestion": "Consider implementing React.memo for performance optimization",
            "reason": "Multiple React components detected without optimization patterns"
        }}
    ],
    "reasoning": "Comprehensive analysis based on file contents, dependency patterns, and architectural structure. Confidence level determined by strength of evidence across multiple indicators.",
    "null_field_explanations": {{
        "database": "No database configuration files or connection strings detected in repository",
        "testing_framework": "No testing dependencies or test files found in the codebase"
    }}
}}

GUIDELINES:
- Base confidence on actual evidence from files
- Explain any null or uncertain fields in null_field_explanations
- Provide specific file evidence for each detection
- Generate actionable insights and suggestions based on detected patterns
- Include comprehensive reasoning for analysis approach and confidence
- Consider version patterns and compatibility
- Account for monorepo or multi-service architectures
"""
        return prompt.strip() @ staticmethod

    def get_technology_detection_prompt(context: Dict[str, Any]) -> str:
        """Alias for get_enhanced_technology_detection_prompt for backward compatibility"""
        return PromptTemplates.get_enhanced_technology_detection_prompt(context)

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

        # Get detected dependencies and files for more context
        detected_files = original_analysis.get("detected_files", [])
        dependency_info = ""

        if tech_data.get("additional_technologies"):
            dependency_info = f"Additional Technologies Detected: {tech_data.get('additional_technologies', [])}"

        prompt = f"""
You are an expert DevOps engineer and software architect providing optimization recommendations for a software project.

DETECTED TECHNOLOGY STACK:
- Language: {tech_data.get('language', 'unknown')}
- Framework: {tech_data.get('framework', 'unknown')}
- Database: {tech_data.get('database', 'none')}
- Architecture: {tech_data.get('architecture_pattern', 'unknown')}
- Build Tool: {tech_data.get('build_tool', 'unknown')}
- Package Manager: {tech_data.get('package_manager', 'unknown')}
{dependency_info}

DETECTED PROJECT FILES:
{detected_files[:10]}

ANALYSIS CONTEXT:
- Current Confidence: {original_analysis.get('confidence', 0):.2f}
- Detection Method: {tech_data.get('detection_method', 'rule_based')}

TASK: Based on the detected technology stack and project structure, provide comprehensive optimization recommendations and actionable insights.

FOCUS AREAS:
1. Technology-specific best practices and optimizations
2. Performance improvements for the detected stack
3. Security recommendations based on the technologies used
4. Development workflow and tooling suggestions
5. Deployment and infrastructure recommendations
6. Code quality and maintainability improvements

IMPORTANT: Generate meaningful, actionable insights based on the ACTUAL detected technologies. Do not provide generic advice.

Respond with ONLY valid JSON in this exact format:
{{
    "recommendations": [
        {{
            "type": "performance|security|deployment|monitoring|testing|tooling",
            "priority": "high|medium|low", 
            "suggestion": "Specific actionable recommendation based on detected tech stack",
            "reason": "Why this is important for this specific technology combination"
        }}
    ],
    "insights": [
        {{
            "category": "architecture|performance|security|development|deployment",
            "title": "Specific insight title",
            "description": "Detailed insight based on detected technologies",
            "reasoning": "Why this insight is relevant to the detected stack",
            "confidence": 0.8,
            "evidence": ["Evidence from detected technologies"]
        }}
    ],
    "suggestions": [
        {{
            "type": "optimization|best_practice|tooling|architecture|security",
            "priority": "high|medium|low",
            "suggestion": "Specific improvement suggestion for this tech stack",
            "reason": "Benefits and justification based on detected technologies"
        }}
    ],
    "confidence_boost": 0.15,
    "reasoning": "Comprehensive analysis of the detected technology stack shows [specific analysis based on actual detected technologies]. Recommendations focus on [specific areas relevant to the stack].",
    "null_field_explanations": {{
        "database": "No database configuration detected - this appears to be a frontend-only or API-only project",
        "testing_framework": "No testing dependencies found - recommend adding testing infrastructure"
    }}
}}

GUIDELINES:
- Confidence boost should be 0.05-0.25 based on clarity added
- Focus on technology-specific, actionable recommendations
- Generate insights that leverage the detected technology combination
- Provide explanations for any missing or null fields
- Base all suggestions on the actual detected technologies, not generic advice
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
        # Support both 'key_files' and 'file_previews' for robustness
        key_files = context.get("key_files", {})
        if not key_files:
            key_files = context.get("file_previews", {})

        # Build file content section
        file_content = ""
        for filename, content in key_files.items():
            file_content += f"\n--- {filename} ---\n{content[:800]}\n"
        if not file_content:
            file_content = "No file content available."

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
    "insights": [
        {{
            "category": "detection|architecture|performance|security|development|deployment",
            "title": "Insight title",
            "description": "Detailed insight based on detected technologies",
            "reasoning": "Why this insight is relevant",
            "confidence": 0.8,
            "evidence": ["Evidence from files or patterns"]
        }}
    ],
    "suggestions": [
        {{
            "type": "optimization|best_practice|tooling|architecture|security",
            "priority": "high|medium|low",
            "suggestion": "Specific improvement suggestion",
            "reason": "Benefits and justification"
        }}
    ],
    "additional_insights": ["insight1", "insight2"],
    "reasoning": "Analysis explanation",
    "confidence_boost": 0.15
}}

GUIDELINES:
- Always include at least one entry in both 'insights' and 'suggestions' arrays, based on the repository files and detected stack.
- Be accurate, evidence-based, and provide actionable recommendations.
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
    "complexity_assessment": "low|medium|high",
    "insights": [{{
        "category": "quality|structure|performance|security|style",
        "title": "Insight title",
        "description": "Detailed insight based on code analysis",
        "reasoning": "Why this insight is relevant",
        "confidence": 0.8,
        "evidence": ["Evidence from code"]
    }}],
    "suggestions": [
        "Specific suggestion for code quality improvement 1",
        "Specific suggestion for code quality improvement 2"
    ],
    "null_field_explanations": {{
        "issues": "Explain if no issues found",
        "recommendations": "Explain if no recommendations",
        "insights": "Explain if no insights",
        "suggestions": "Explain if no suggestions"
    }}
}}

ALL FIELDS above must be present in the response, even if empty.

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

    @staticmethod
    def get_dependency_analysis_prompt(context: Dict[str, Any]) -> str:
        """
        Build prompt for dependency analysis

        Args:
            context: Dependency analysis context

        Returns:
            Formatted prompt for dependency analysis
        """
        dependencies = context.get("dependencies", [])
        package_managers = context.get("package_managers", [])
        file_content = context.get("file_content", "")

        prompt = f"""
You are a software dependency expert analyzing a project's dependencies and package management.

Detected Dependencies:
{dependencies[:10]}

Package Managers:
{package_managers}

File Content (truncated):
{file_content[:1200]}

Analyze the dependency structure, risks, and opportunities for improvement.

Respond with ONLY valid JSON in this exact format:
{{
    "dependency_score": 0.8,
    "package_managers": ["npm", "pip"],
    "dependencies": [{{
        "name": "dependency_name",
        "version": "x.y.z",
        "category": "runtime|dev|peer|optional",
        "risk": "low|medium|high",
        "reason": "Why this risk level"
    }}],
    "recommendations": ["recommendation1", "recommendation2"],
    "insights": [{{
        "category": "dependency|security|maintenance",
        "title": "Insight title",
        "description": "Detailed insight based on dependencies",
        "reasoning": "Why this insight is relevant",
        "confidence": 0.8,
        "evidence": ["Evidence from dependencies"]
    }}],
    "suggestions": [
        "Specific suggestion for dependency management 1",
        "Specific suggestion for dependency management 2"
    ],
    "null_field_explanations": {{
        "dependencies": "Explain if no dependencies found",
        "recommendations": "Explain if no recommendations",
        "insights": "Explain if no insights",
        "suggestions": "Explain if no suggestions"
    }}
}}

ALL FIELDS above must be present in the response, even if empty.

Focus on actionable, evidence-based dependency management improvements.
"""
        return prompt.strip()
