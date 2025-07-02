"""
Base Prompt Templates

Foundational prompt templates and utilities used across all prompt types.
Provides common patterns, formatting, and helper functions.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


class BasePrompts:
    """
    Base class for all prompt templates.
    Provides common formatting and utility methods.
    """
    
    @staticmethod
    def format_repository_context(repository_data: Dict[str, Any]) -> str:
        """Format repository context for prompts."""
        repo_info = repository_data.get('repository', {})
        metadata = repository_data.get('metadata', {})
        
        context = f"""
REPOSITORY CONTEXT:
- Name: {repo_info.get('full_name', 'unknown')}
- Description: {repo_info.get('description', 'No description')}
- Primary Language: {repo_info.get('language', 'unknown')}
- Default Branch: {repo_info.get('default_branch', 'main')}
- Stars: {repo_info.get('stars', 0)}
- Forks: {repo_info.get('forks', 0)}
- Private: {repo_info.get('private', False)}
- Topics: {', '.join(repo_info.get('topics', []))}
- Created: {repo_info.get('created_at', 'unknown')}
- Last Updated: {repo_info.get('updated_at', 'unknown')}

ANALYSIS METADATA:
- Branch: {metadata.get('branch', 'main')}
- Total Files: {metadata.get('total_files', 0)}
- Analyzed Files: {metadata.get('analyzed_files', 0)}
- Provider: {metadata.get('provider', 'unknown')}
"""
        return context.strip()
    
    @staticmethod
    def format_file_contents(files: Dict[str, str], max_files: int = 15, max_length: int = 1500) -> str:
        """Format file contents for prompts."""
        if not files:
            return "No file contents available."
        
        formatted_files = []
        file_count = 0
        
        # Prioritize important files
        important_files = [
            'package.json', 'requirements.txt', 'pom.xml', 'Dockerfile',
            'README.md', 'setup.py', 'go.mod', 'Cargo.toml'
        ]
        
        # Process important files first
        for filename in important_files:
            if filename in files and file_count < max_files:
                content = files[filename]
                if isinstance(content, str):
                    truncated_content = content[:max_length]
                    if len(content) > max_length:
                        truncated_content += "... [truncated]"
                    
                    formatted_files.append(f"""
--- {filename} ---
{truncated_content}
""")
                    file_count += 1
        
        # Process remaining files
        for filename, content in files.items():
            if filename not in important_files and file_count < max_files:
                if isinstance(content, str):
                    truncated_content = content[:max_length]
                    if len(content) > max_length:
                        truncated_content += "... [truncated]"
                    
                    formatted_files.append(f"""
--- {filename} ---
{truncated_content}
""")
                    file_count += 1
        
        if file_count < len(files):
            formatted_files.append(f"\n... and {len(files) - file_count} more files")
        
        return "\n".join(formatted_files)
    
    @staticmethod
    def format_analysis_summary(analysis_result: Any) -> str:
        """Format current analysis results for context."""
        try:
            # Extract key information from analysis result
            tech_stack = getattr(analysis_result, 'technology_stack', None)
            dep_analysis = getattr(analysis_result, 'dependency_analysis', None)
            code_analysis = getattr(analysis_result, 'code_analysis', None)
            confidence = getattr(analysis_result, 'confidence', 'unknown')
            
            summary = f"""
CURRENT ANALYSIS SUMMARY:
- Overall Confidence: {confidence}

TECHNOLOGY STACK:
"""
            
            if tech_stack:
                summary += f"""- Languages: {', '.join(getattr(tech_stack, 'languages', []))}
- Frameworks: {', '.join(getattr(tech_stack, 'frameworks', []))}
- Databases: {', '.join(getattr(tech_stack, 'databases', []))}
- Package Managers: {', '.join(getattr(tech_stack, 'package_managers', []))}
- Build Tools: {', '.join(getattr(tech_stack, 'build_tools', []))}
"""
            else:
                summary += "- Technology stack analysis not available\n"
            
            if dep_analysis:
                summary += f"""
DEPENDENCIES:
- Total Dependencies: {getattr(dep_analysis, 'total_dependencies', 0)}
- Production Dependencies: {getattr(dep_analysis, 'production_dependencies', 0)}
- Development Dependencies: {getattr(dep_analysis, 'dev_dependencies', 0)}
- Security Score: {getattr(dep_analysis, 'security_score', 0)}/100
- Vulnerabilities: {len(getattr(dep_analysis, 'vulnerabilities', []))}
"""
            
            if code_analysis:
                summary += f"""
CODE QUALITY:
- Quality Score: {getattr(code_analysis, 'quality_score', 0)}/100
- Complexity Score: {getattr(code_analysis, 'complexity_score', 0)}/100
- Maintainability Score: {getattr(code_analysis, 'maintainability_score', 0)}/100
- Code Smells: {len(getattr(code_analysis, 'code_smells', []))}
- Patterns Detected: {', '.join(getattr(code_analysis, 'patterns_detected', []))}
"""
            
            return summary.strip()
            
        except Exception as e:
            return f"Error formatting analysis summary: {str(e)}"
    
    @staticmethod
    def create_system_prompt(role: str, expertise: List[str], guidelines: List[str]) -> str:
        """Create a standardized system prompt."""
        system_prompt = f"You are a {role} with deep expertise in:"
        
        for area in expertise:
            system_prompt += f"\n- {area}"
        
        system_prompt += "\n\nGuidelines for your analysis:"
        
        for guideline in guidelines:
            system_prompt += f"\n- {guideline}"
        
        system_prompt += "\n\nAlways provide detailed, actionable insights based on your expertise."
        
        return system_prompt
    
    @staticmethod
    def format_json_response_instruction() -> str:
        """Standard instruction for JSON responses."""
        return """
RESPONSE FORMAT:
Respond with valid JSON only. No additional text or markdown formatting.
Structure your response according to the specified schema.
Ensure all fields are properly filled with meaningful data.
"""
    
    @staticmethod
    def format_confidence_instruction() -> str:
        """Standard instruction for confidence scoring."""
        return """
CONFIDENCE SCORING:
- HIGH (0.8-1.0): Very confident based on clear evidence
- MEDIUM (0.5-0.79): Moderately confident with some uncertainty
- LOW (0.0-0.49): Low confidence, limited evidence
"""
    
    @staticmethod
    def format_timestamp() -> str:
        """Get formatted timestamp for prompts."""
        return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
