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
    def format_repository_summary(repository_data: Dict[str, Any]) -> str:
        """Format a concise repository summary instead of full context."""
        repo_info = repository_data.get('repository', {})
        metadata = repository_data.get('metadata', {})
        
        # Get basic file structure info
        files = repository_data.get('key_files', {})
        important_files = [f for f in files.keys() if any(pattern in f for pattern in 
            ['package.json', 'requirements.txt', 'pom.xml', 'Dockerfile', 'go.mod', 'Cargo.toml'])]
        
        summary = f"""
REPOSITORY SUMMARY:
- Name: {repo_info.get('full_name', 'unknown')}
- Language: {repo_info.get('language', 'unknown')}
- Key Files: {', '.join(important_files[:5])}
- Total Files Analyzed: {metadata.get('analyzed_files', 0)}
"""
        return summary.strip()
    
    @staticmethod
    def extract_key_technology_indicators(repository_data: Dict[str, Any]) -> str:
        """Extract key technology indicators from repository data."""
        files = repository_data.get('key_files', {})
        indicators = []
        
        # Package managers and config files
        if 'package.json' in files:
            indicators.append("Node.js project (package.json present)")
        if 'requirements.txt' in files or 'pyproject.toml' in files:
            indicators.append("Python project (requirements/pyproject detected)")
        if 'pom.xml' in files:
            indicators.append("Java/Maven project")
        if 'Cargo.toml' in files:
            indicators.append("Rust project")
        if 'go.mod' in files:
            indicators.append("Go project")
        if 'Dockerfile' in files:
            indicators.append("Docker configuration present")
        
        # Framework indicators from file extensions and names
        for filename in files.keys():
            if filename.endswith('.vue'):
                indicators.append("Vue.js files detected")
            elif filename.endswith('.jsx') or filename.endswith('.tsx'):
                indicators.append("React/JSX files detected")
            elif 'angular.json' in filename:
                indicators.append("Angular configuration detected")
            elif 'django' in filename.lower() or 'settings.py' in filename:
                indicators.append("Django framework indicators")
        
        return '\n'.join(f"- {indicator}" for indicator in indicators[:8]) if indicators else "No clear technology indicators found"
    
    @staticmethod
    def extract_dependency_summary(repository_data: Dict[str, Any]) -> str:
        """Extract key dependency information without full file contents."""
        files = repository_data.get('key_files', {})
        summary_parts = []
        
        # Check for package.json
        if 'package.json' in files:
            try:
                import json
                pkg_data = json.loads(files['package.json'])
                deps = pkg_data.get('dependencies', {})
                dev_deps = pkg_data.get('devDependencies', {})
                summary_parts.append(f"Node.js: {len(deps)} dependencies, {len(dev_deps)} dev dependencies")
                
                # Key frameworks and libraries
                all_deps = {**deps, **dev_deps}
                frameworks = [name for name in all_deps.keys() if name in [
                    'react', 'vue', 'angular', 'express', 'next', 'nuxt', 'svelte',
                    'gatsby', 'remix', 'fastify', 'koa', 'nestjs'
                ]]
                ui_libs = [name for name in all_deps.keys() if name in [
                    'leaflet', 'react-leaflet', 'react-icons', 'chart.js', 'react-chartjs-2',
                    'd3', 'three', '@material-ui/core', '@mui/material', 'antd', 
                    'bootstrap', 'tailwindcss', 'styled-components', 'framer-motion'
                ]]
                state_mgmt = [name for name in all_deps.keys() if name in [
                    'redux', 'react-redux', 'zustand', 'recoil', 'mobx', 'jotai'
                ]]
                testing = [name for name in all_deps.keys() if name in [
                    'jest', 'cypress', 'playwright', 'vitest', '@testing-library/react'
                ]]
                build_tools = [name for name in all_deps.keys() if name in [
                    'webpack', 'vite', 'rollup', 'esbuild', 'parcel'
                ]]
                
                if frameworks:
                    summary_parts.append(f"Frameworks: {', '.join(frameworks)}")
                if ui_libs:
                    summary_parts.append(f"UI Libraries: {', '.join(ui_libs)}")
                if state_mgmt:
                    summary_parts.append(f"State Management: {', '.join(state_mgmt)}")
                if testing:
                    summary_parts.append(f"Testing: {', '.join(testing)}")
                if build_tools:
                    summary_parts.append(f"Build Tools: {', '.join(build_tools)}")
                    
                # Sample of other notable dependencies
                other_deps = [name for name in all_deps.keys() if name not in 
                    frameworks + ui_libs + state_mgmt + testing + build_tools]
                if other_deps and len(other_deps) > 0:
                    sample = other_deps[:8]  # Show first 8 other deps
                    summary_parts.append(f"Other dependencies: {', '.join(sample)}")
                    if len(other_deps) > 8:
                        summary_parts.append(f"... and {len(other_deps) - 8} more dependencies")
            except:
                summary_parts.append("Node.js: package.json present but unreadable")
        
        # Check for Python dependencies
        if 'requirements.txt' in files:
            req_lines = files['requirements.txt'].split('\n')
            packages = [line.strip().split('==')[0].split('>=')[0].split('<=')[0] 
                       for line in req_lines if line.strip() and not line.strip().startswith('#')]
            summary_parts.append(f"Python: {len(packages)} packages in requirements.txt")
            
            # Categorize Python packages
            web_frameworks = [pkg for pkg in packages if pkg.lower() in [
                'django', 'flask', 'fastapi', 'tornado', 'bottle', 'pyramid'
            ]]
            data_science = [pkg for pkg in packages if pkg.lower() in [
                'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly',
                'scikit-learn', 'tensorflow', 'pytorch', 'keras'
            ]]
            databases = [pkg for pkg in packages if pkg.lower() in [
                'psycopg2', 'pymongo', 'sqlalchemy', 'django-orm', 'peewee',
                'redis', 'elasticsearch'
            ]]
            async_tools = [pkg for pkg in packages if pkg.lower() in [
                'asyncio', 'aiohttp', 'celery', 'dramatiq', 'rq'
            ]]
            
            if web_frameworks:
                summary_parts.append(f"Web Frameworks: {', '.join(web_frameworks)}")
            if data_science:
                summary_parts.append(f"Data Science: {', '.join(data_science)}")
            if databases:
                summary_parts.append(f"Databases: {', '.join(databases)}")
            if async_tools:
                summary_parts.append(f"Async/Queue: {', '.join(async_tools)}")
                
            # Sample other packages
            other_packages = [pkg for pkg in packages if pkg.lower() not in 
                [p.lower() for p in web_frameworks + data_science + databases + async_tools]]
            if other_packages and len(other_packages) > 0:
                sample = other_packages[:6]
                summary_parts.append(f"Other packages: {', '.join(sample)}")
                if len(other_packages) > 6:
                    summary_parts.append(f"... and {len(other_packages) - 6} more packages")
        
        if 'pyproject.toml' in files:
            summary_parts.append("Python: pyproject.toml configuration present")
        
        # Check for other package managers
        if 'pom.xml' in files:
            summary_parts.append("Java: Maven dependencies in pom.xml")
        if 'Cargo.toml' in files:
            summary_parts.append("Rust: Cargo dependencies")
        if 'go.mod' in files:
            summary_parts.append("Go: Module dependencies")
        
        return '\n'.join(summary_parts) if summary_parts else "No clear dependency files found"
    
    @staticmethod
    def extract_code_structure_summary(repository_data: Dict[str, Any]) -> str:
        """Extract code structure summary without sending full file contents."""
        files = repository_data.get('key_files', {})
        structure_info = []
        
        # Directory structure indicators
        has_src = any('src/' in filename for filename in files.keys())
        has_components = any('components/' in filename for filename in files.keys())
        has_tests = any('test' in filename.lower() or 'spec' in filename.lower() for filename in files.keys())
        
        if has_src:
            structure_info.append("Organized source structure (src/ directory)")
        if has_components:
            structure_info.append("Component-based architecture")
        if has_tests:
            structure_info.append("Test files present")
        
        # File type analysis
        file_types = {}
        for filename in files.keys():
            ext = filename.split('.')[-1] if '.' in filename else 'other'
            file_types[ext] = file_types.get(ext, 0) + 1
        
        # Most common file types
        common_types = sorted(file_types.items(), key=lambda x: x[1], reverse=True)[:5]
        if common_types:
            type_summary = ', '.join([f"{ext}: {count}" for ext, count in common_types])
            structure_info.append(f"File types: {type_summary}")
        
        # Configuration files
        config_files = [f for f in files.keys() if any(cfg in f for cfg in 
            ['eslint', 'prettier', 'babel', 'webpack', 'vite', 'tsconfig'])]
        if config_files:
            structure_info.append(f"Config files: {', '.join(config_files[:3])}")
        
        return '\n'.join(f"- {info}" for info in structure_info) if structure_info else "Basic file structure"
    
    @staticmethod
    def extract_project_overview(repository_data: Dict[str, Any]) -> str:
        """Extract high-level project overview."""
        repo_info = repository_data.get('repository', {})
        files = repository_data.get('key_files', {})
        
        overview_parts = []
        
        # Basic project info
        overview_parts.append(f"Language: {repo_info.get('language', 'Mixed/Unknown')}")
        
        # Project scale indicators
        total_files = len(files)
        if total_files > 50:
            overview_parts.append("Large codebase (50+ files)")
        elif total_files > 20:
            overview_parts.append("Medium codebase (20-50 files)")
        else:
            overview_parts.append("Small codebase (<20 files)")
        
        # Documentation
        has_readme = any('readme' in f.lower() for f in files.keys())
        has_docs = any('doc' in f.lower() for f in files.keys())
        if has_readme and has_docs:
            overview_parts.append("Well documented (README + docs)")
        elif has_readme:
            overview_parts.append("Basic documentation (README)")
        
        # Development indicators
        has_ci = any('github' in f or 'gitlab' in f or 'jenkins' in f for f in files.keys())
        has_docker = 'Dockerfile' in files or 'docker-compose' in str(files.keys())
        
        if has_ci:
            overview_parts.append("CI/CD configuration present")
        if has_docker:
            overview_parts.append("Containerization ready")
        
        return '\n'.join(f"- {part}" for part in overview_parts)
    
    @staticmethod
    def extract_code_structure_summary(repository_data: Dict[str, Any]) -> str:
        """Extract code structure summary for quality analysis."""
        files = repository_data.get('key_files', {})
        structure_info = []
        
        # Count file types
        source_files = [f for f in files.keys() if any(f.endswith(ext) for ext in ['.js', '.ts', '.py', '.java', '.go', '.rs', '.php', '.rb'])]
        config_files = [f for f in files.keys() if any(pattern in f for pattern in ['config', 'eslint', 'babel', 'webpack', 'tsconfig'])]
        test_files = [f for f in files.keys() if any(pattern in f for pattern in ['test', 'spec', '__test__'])]
        
        if source_files:
            structure_info.append(f"Source files: {len(source_files)} files")
            # Get primary language from extensions
            extensions = [f.split('.')[-1] for f in source_files if '.' in f]
            if extensions:
                from collections import Counter
                common_ext = Counter(extensions).most_common(1)[0]
                structure_info.append(f"Primary language: {common_ext[0]} ({common_ext[1]} files)")
        
        if config_files:
            structure_info.append(f"Configuration files: {len(config_files)}")
        
        if test_files:
            structure_info.append(f"Test files: {len(test_files)}")
        else:
            structure_info.append("No test files detected")
        
        # Check for common patterns
        has_src_dir = any('src/' in f for f in files.keys())
        has_components = any('component' in f.lower() for f in files.keys())
        has_api = any('api' in f.lower() for f in files.keys())
        
        if has_src_dir:
            structure_info.append("Organized source structure (src/ directory)")
        if has_components:
            structure_info.append("Component-based architecture detected")
        if has_api:
            structure_info.append("API layer detected")
        
        return '\n'.join(f"- {info}" for info in structure_info) if structure_info else "Basic file structure"

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
