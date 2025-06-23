"""
Code Analyzer - Analyze source code for patterns, complexity, and insights
Supports multiple programming languages and frameworks
"""

import re
import ast
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from engines.core.models import CodeAnalysis, CodeMetrics, QualityIssue
from .base_analyzer import BaseAnalyzer

logger = logging.getLogger(__name__)


@dataclass
class FileAnalysis:
    """Analysis results for a single file"""

    file_path: str
    language: str
    lines_of_code: int
    complexity_score: int
    quality_issues: List[QualityIssue]
    patterns_detected: List[str]
    imports_found: List[str]
    functions_count: int
    classes_count: int


class CodeAnalyzer(BaseAnalyzer):
    """
    Multi-language code analyzer

    Features:
    - Language detection and parsing
    - Complexity analysis
    - Pattern recognition
    - Code quality assessment
    - Framework-specific analysis
    - Architecture insights
    """

    def __init__(self):
        self.language_analyzers = {
            "python": self._analyze_python_code,
            "javascript": self._analyze_javascript_code,
            "typescript": self._analyze_typescript_code,
            "java": self._analyze_java_code,
            "php": self._analyze_php_code,
            "go": self._analyze_go_code,
            "rust": self._analyze_rust_code,
            "ruby": self._analyze_ruby_code,
            "csharp": self._analyze_csharp_code,
        }

        # Initialize pattern matchers
        self._init_patterns()

    def _init_patterns(self):
        """Initialize code patterns for different frameworks and languages"""

        # Framework patterns
        self.framework_patterns = {
            "react": {
                "patterns": [
                    r"React\.Component",
                    r"useState\s*\(",
                    r"useEffect\s*\(",
                    r"ReactDOM\.render",
                    r"JSX\.Element",
                    r"<\w+.*>.*</\w+>",  # JSX tags
                    r"className=",
                    r"onClick=",
                    r"props\.\w+",
                ],
                "imports": [
                    r"import.*React.*from ['\"]react['\"]",
                    r"import.*\{.*\}.*from ['\"]react['\"]",
                ],
            },
            "vue": {
                "patterns": [
                    r"<template>",
                    r"<script>",
                    r"<style>",
                    r"defineComponent",
                    r"ref\s*\(",
                    r"reactive\s*\(",
                    r"computed\s*\(",
                    r"watch\s*\(",
                    r"@\w+=",  # Vue event handlers
                ],
                "imports": [
                    r"import.*Vue.*from ['\"]vue['\"]",
                    r"import.*defineComponent.*from ['\"]vue['\"]",
                ],
            },
            "django": {
                "patterns": [
                    r"class.*\(.*Model.*\)",
                    r"models\..*Field",
                    r"@login_required",
                    r"render\s*\(",
                    r"HttpResponse",
                    r"request\.(GET|POST|PUT|DELETE)",
                    r"url\s*\(",
                    r"path\s*\(",
                ],
                "imports": [r"from django", r"import django"],
            },
            "flask": {
                "patterns": [
                    r"@app\.route",
                    r"Flask\s*\(",
                    r"render_template",
                    r"request\.(form|args|json)",
                    r"flash\s*\(",
                    r"redirect\s*\(",
                    r"url_for\s*\(",
                ],
                "imports": [r"from flask import"],
            },
            "express": {
                "patterns": [
                    r"app\.(get|post|put|delete)",
                    r"req\.(body|params|query)",
                    r"res\.(send|json|status)",
                    r"express\.Router",
                    r"app\.use\s*\(",
                    r"middleware",
                ],
                "imports": [
                    r"require\s*\(\s*['\"]express['\"]",
                    r"import.*express.*from ['\"]express['\"]",
                ],
            },
            "spring": {
                "patterns": [
                    r"@RestController",
                    r"@RequestMapping",
                    r"@GetMapping",
                    r"@PostMapping",
                    r"@Autowired",
                    r"@Service",
                    r"@Repository",
                    r"@Entity",
                ],
                "imports": [r"import.*springframework"],
            },
        }

        # Code quality patterns
        self.quality_patterns = {
            "long_function": r"def\s+\w+.*?(?=def|\Z)",  # Python function detection
            "complex_condition": r"if.*?(?:and|or).*?(?:and|or)",
            "magic_numbers": r"\b\d{2,}\b",
            "todo_fixme": r"(TODO|FIXME|HACK|XXX)",
            "empty_catch": r"except.*?:\s*pass",
            "deep_nesting": r"(\s{12,})",  # Deep indentation
            "long_line": r".{100,}",  # Lines over 100 chars
            "duplicate_code": r"(.{20,})\n.*\1",  # Repeated code blocks
        }

        # Architecture patterns
        self.architecture_patterns = {
            "mvc": ["models", "views", "controllers"],
            "mvp": ["models", "views", "presenters"],
            "mvvm": ["models", "views", "viewmodels"],
            "layered": ["controllers", "services", "repositories", "models"],
            "microservices": ["services", "gateway", "registry"],
            "hexagonal": ["ports", "adapters", "domain"],
            "clean": ["entities", "usecases", "interfaces", "frameworks"],
        }

    async def analyze_code(
        self, key_files: Dict[str, str], file_tree: List[Dict]
    ) -> CodeAnalysis:
        """
        Perform comprehensive code analysis

        Args:
            key_files: Dictionary of file paths and their content
            file_tree: List of all files in the repository

        Returns:
            CodeAnalysis with detailed insights
        """
        file_analyses = []
        total_lines = 0
        total_complexity = 0
        all_quality_issues = []
        language_distribution = {}
        framework_usage = {}

        # Analyze each code file
        for file_path, content in key_files.items():
            if self._is_code_file(file_path):
                language = self._detect_language(file_path, content)

                if language in self.language_analyzers:
                    try:
                        analysis = await self.language_analyzers[language](
                            file_path, content
                        )

                        if analysis:
                            file_analyses.append(analysis)
                            total_lines += analysis.lines_of_code
                            total_complexity += analysis.complexity_score
                            all_quality_issues.extend(analysis.quality_issues)

                            # Track language distribution
                            language_distribution[language] = (
                                language_distribution.get(language, 0) + 1
                            )

                            # Track framework patterns
                            for pattern in analysis.patterns_detected:
                                framework_usage[pattern] = (
                                    framework_usage.get(pattern, 0) + 1
                                )

                    except Exception as e:
                        logger.debug(f"Failed to analyze {file_path}: {e}")
                        continue

        # Analyze overall architecture
        architecture_analysis = self._analyze_architecture(file_tree)

        # Calculate metrics
        metrics = self._calculate_code_metrics(
            file_analyses, total_lines, total_complexity
        )

        # Detect code patterns and frameworks
        patterns_summary = self._summarize_patterns(framework_usage)

        return CodeAnalysis(
            total_files_analyzed=len(file_analyses),
            total_lines_of_code=total_lines,
            language_distribution=language_distribution,
            framework_patterns=patterns_summary,
            architecture_insights=architecture_analysis,
            code_metrics=metrics,
            quality_issues=all_quality_issues[:50],  # Limit to top 50 issues
            file_analyses=file_analyses[:20],  # Limit detailed analyses
        )

    async def _analyze_python_code(self, file_path: str, content: str) -> FileAnalysis:
        """Analyze Python code"""
        lines_of_code = len(
            [
                line
                for line in content.split("\n")
                if line.strip() and not line.strip().startswith("#")
            ]
        )

        patterns_detected = []
        imports_found = []
        functions_count = 0
        classes_count = 0
        quality_issues = []

        try:
            # Parse AST for accurate analysis
            tree = ast.parse(content)

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    functions_count += 1
                    # Check function length
                    func_lines = (
                        node.end_lineno - node.lineno
                        if hasattr(node, "end_lineno")
                        else 0
                    )
                    if func_lines > 50:
                        quality_issues.append(
                            QualityIssue(
                                type="long_function",
                                severity="medium",
                                description=f"Function '{node.name}' is too long ({func_lines} lines)",
                                line_number=node.lineno,
                                file_path=file_path,
                            )
                        )

                elif isinstance(node, ast.ClassDef):
                    classes_count += 1

                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        imports_found.append(alias.name)

                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports_found.append(node.module)

        except SyntaxError as e:
            quality_issues.append(
                QualityIssue(
                    type="syntax_error",
                    severity="high",
                    description=f"Syntax error: {e}",
                    line_number=e.lineno if hasattr(e, "lineno") else 0,
                    file_path=file_path,
                )
            )

        # Detect framework patterns
        for framework, config in self.framework_patterns.items():
            pattern_matches = 0
            for pattern in config["patterns"]:
                if re.search(pattern, content, re.MULTILINE):
                    pattern_matches += 1

            if pattern_matches > 0:
                patterns_detected.append(f"{framework}:{pattern_matches}")

        # Check for quality issues
        quality_issues.extend(self._check_quality_issues(content, file_path))

        # Calculate complexity (simplified)
        complexity_score = self._calculate_complexity(content, "python")

        return FileAnalysis(
            file_path=file_path,
            language="python",
            lines_of_code=lines_of_code,
            complexity_score=complexity_score,
            quality_issues=quality_issues,
            patterns_detected=patterns_detected,
            imports_found=imports_found,
            functions_count=functions_count,
            classes_count=classes_count,
        )

    async def _analyze_javascript_code(
        self, file_path: str, content: str
    ) -> FileAnalysis:
        """Analyze JavaScript code"""
        lines_of_code = len(
            [
                line
                for line in content.split("\n")
                if line.strip() and not line.strip().startswith("//")
            ]
        )

        patterns_detected = []
        imports_found = []
        functions_count = 0
        classes_count = 0
        quality_issues = []

        # Count functions and classes with regex
        functions_count = len(
            re.findall(r"function\s+\w+|=>\s*{|const\s+\w+\s*=\s*\(", content)
        )
        classes_count = len(re.findall(r"class\s+\w+", content))

        # Extract imports
        import_matches = re.findall(
            r'import.*?from\s+[\'"]([^\'"]+)[\'"]|require\s*\(\s*[\'"]([^\'"]+)[\'"]',
            content,
        )
        for match in import_matches:
            imports_found.append(match[0] or match[1])

        # Detect framework patterns
        for framework, config in self.framework_patterns.items():
            if framework in ["react", "vue", "express"]:
                pattern_matches = 0
                for pattern in config["patterns"]:
                    if re.search(pattern, content, re.MULTILINE):
                        pattern_matches += 1

                if pattern_matches > 0:
                    patterns_detected.append(f"{framework}:{pattern_matches}")

        # Check for quality issues
        quality_issues.extend(self._check_quality_issues(content, file_path))

        # Calculate complexity
        complexity_score = self._calculate_complexity(content, "javascript")

        return FileAnalysis(
            file_path=file_path,
            language="javascript",
            lines_of_code=lines_of_code,
            complexity_score=complexity_score,
            quality_issues=quality_issues,
            patterns_detected=patterns_detected,
            imports_found=imports_found,
            functions_count=functions_count,
            classes_count=classes_count,
        )

    async def _analyze_typescript_code(
        self, file_path: str, content: str
    ) -> FileAnalysis:
        """Analyze TypeScript code (similar to JavaScript with types)"""
        # Reuse JavaScript analyzer with TypeScript-specific additions
        analysis = await self._analyze_javascript_code(file_path, content)
        analysis.language = "typescript"

        # TypeScript-specific patterns
        interface_count = len(re.findall(r"interface\s+\w+", content))
        type_count = len(re.findall(r"type\s+\w+\s*=", content))

        if interface_count > 0:
            analysis.patterns_detected.append(f"interfaces:{interface_count}")
        if type_count > 0:
            analysis.patterns_detected.append(f"types:{type_count}")

        return analysis

    async def _analyze_java_code(self, file_path: str, content: str) -> FileAnalysis:
        """Analyze Java code"""
        lines_of_code = len(
            [
                line
                for line in content.split("\n")
                if line.strip() and not line.strip().startswith("//")
            ]
        )

        patterns_detected = []
        imports_found = []
        functions_count = 0
        classes_count = 0
        quality_issues = []

        # Count classes and methods
        classes_count = len(re.findall(r"class\s+\w+", content))
        functions_count = len(
            re.findall(r"public\s+\w+.*?\(|private\s+\w+.*?\(", content)
        )

        # Extract imports
        import_matches = re.findall(r"import\s+([\w.]+)", content)
        imports_found = import_matches

        # Detect Spring framework patterns
        for framework, config in self.framework_patterns.items():
            if framework == "spring":
                pattern_matches = 0
                for pattern in config["patterns"]:
                    if re.search(pattern, content, re.MULTILINE):
                        pattern_matches += 1

                if pattern_matches > 0:
                    patterns_detected.append(f"{framework}:{pattern_matches}")

        # Check for quality issues
        quality_issues.extend(self._check_quality_issues(content, file_path))

        # Calculate complexity
        complexity_score = self._calculate_complexity(content, "java")

        return FileAnalysis(
            file_path=file_path,
            language="java",
            lines_of_code=lines_of_code,
            complexity_score=complexity_score,
            quality_issues=quality_issues,
            patterns_detected=patterns_detected,
            imports_found=imports_found,
            functions_count=functions_count,
            classes_count=classes_count,
        )

    async def _analyze_php_code(self, file_path: str, content: str) -> FileAnalysis:
        """Analyze PHP code"""
        lines_of_code = len(
            [
                line
                for line in content.split("\n")
                if line.strip() and not line.strip().startswith("//")
            ]
        )

        patterns_detected = []
        imports_found = []
        functions_count = len(re.findall(r"function\s+\w+", content))
        classes_count = len(re.findall(r"class\s+\w+", content))
        quality_issues = []

        # Extract includes/requires
        include_matches = re.findall(
            r'(?:include|require)(?:_once)?\s*\(\s*[\'"]([^\'"]+)', content
        )
        imports_found = include_matches

        # Check for quality issues
        quality_issues.extend(self._check_quality_issues(content, file_path))

        # Calculate complexity
        complexity_score = self._calculate_complexity(content, "php")

        return FileAnalysis(
            file_path=file_path,
            language="php",
            lines_of_code=lines_of_code,
            complexity_score=complexity_score,
            quality_issues=quality_issues,
            patterns_detected=patterns_detected,
            imports_found=imports_found,
            functions_count=functions_count,
            classes_count=classes_count,
        )

    async def _analyze_go_code(self, file_path: str, content: str) -> FileAnalysis:
        """Analyze Go code"""
        lines_of_code = len(
            [
                line
                for line in content.split("\n")
                if line.strip() and not line.strip().startswith("//")
            ]
        )

        patterns_detected = []
        imports_found = []
        functions_count = len(re.findall(r"func\s+\w+", content))
        classes_count = len(
            re.findall(r"type\s+\w+\s+struct", content)
        )  # Structs in Go
        quality_issues = []

        # Extract imports
        import_matches = re.findall(r'import\s+(?:\(\s*)?[\'"]([^\'"]+)[\'"]', content)
        imports_found = import_matches

        # Check for quality issues
        quality_issues.extend(self._check_quality_issues(content, file_path))

        # Calculate complexity
        complexity_score = self._calculate_complexity(content, "go")

        return FileAnalysis(
            file_path=file_path,
            language="go",
            lines_of_code=lines_of_code,
            complexity_score=complexity_score,
            quality_issues=quality_issues,
            patterns_detected=patterns_detected,
            imports_found=imports_found,
            functions_count=functions_count,
            classes_count=classes_count,
        )

    async def _analyze_rust_code(self, file_path: str, content: str) -> FileAnalysis:
        """Analyze Rust code"""
        lines_of_code = len(
            [
                line
                for line in content.split("\n")
                if line.strip() and not line.strip().startswith("//")
            ]
        )

        patterns_detected = []
        imports_found = []
        functions_count = len(re.findall(r"fn\s+\w+", content))
        classes_count = len(re.findall(r"struct\s+\w+|enum\s+\w+", content))
        quality_issues = []

        # Extract uses
        use_matches = re.findall(r"use\s+([\w::]+)", content)
        imports_found = use_matches

        # Check for quality issues
        quality_issues.extend(self._check_quality_issues(content, file_path))

        # Calculate complexity
        complexity_score = self._calculate_complexity(content, "rust")

        return FileAnalysis(
            file_path=file_path,
            language="rust",
            lines_of_code=lines_of_code,
            complexity_score=complexity_score,
            quality_issues=quality_issues,
            patterns_detected=patterns_detected,
            imports_found=imports_found,
            functions_count=functions_count,
            classes_count=classes_count,
        )

    async def _analyze_ruby_code(self, file_path: str, content: str) -> FileAnalysis:
        """Analyze Ruby code"""
        lines_of_code = len(
            [
                line
                for line in content.split("\n")
                if line.strip() and not line.strip().startswith("#")
            ]
        )

        patterns_detected = []
        imports_found = []
        functions_count = len(re.findall(r"def\s+\w+", content))
        classes_count = len(re.findall(r"class\s+\w+", content))
        quality_issues = []

        # Extract requires
        require_matches = re.findall(r'require\s+[\'"]([^\'"]+)', content)
        imports_found = require_matches

        # Check for quality issues
        quality_issues.extend(self._check_quality_issues(content, file_path))

        # Calculate complexity
        complexity_score = self._calculate_complexity(content, "ruby")

        return FileAnalysis(
            file_path=file_path,
            language="ruby",
            lines_of_code=lines_of_code,
            complexity_score=complexity_score,
            quality_issues=quality_issues,
            patterns_detected=patterns_detected,
            imports_found=imports_found,
            functions_count=functions_count,
            classes_count=classes_count,
        )

    async def _analyze_csharp_code(self, file_path: str, content: str) -> FileAnalysis:
        """Analyze C# code"""
        lines_of_code = len(
            [
                line
                for line in content.split("\n")
                if line.strip() and not line.strip().startswith("//")
            ]
        )

        patterns_detected = []
        imports_found = []
        functions_count = len(
            re.findall(r"public\s+\w+.*?\(|private\s+\w+.*?\(", content)
        )
        classes_count = len(re.findall(r"class\s+\w+", content))
        quality_issues = []

        # Extract using statements
        using_matches = re.findall(r"using\s+([\w.]+)", content)
        imports_found = using_matches

        # Check for quality issues
        quality_issues.extend(self._check_quality_issues(content, file_path))

        # Calculate complexity
        complexity_score = self._calculate_complexity(content, "csharp")

        return FileAnalysis(
            file_path=file_path,
            language="csharp",
            lines_of_code=lines_of_code,
            complexity_score=complexity_score,
            quality_issues=quality_issues,
            patterns_detected=patterns_detected,
            imports_found=imports_found,
            functions_count=functions_count,
            classes_count=classes_count,
        )

    def _check_quality_issues(self, content: str, file_path: str) -> List[QualityIssue]:
        """Check for common code quality issues"""
        issues = []
        lines = content.split("\n")

        for i, line in enumerate(lines, 1):
            # Long lines
            if len(line) > 120:
                issues.append(
                    QualityIssue(
                        type="long_line",
                        severity="low",
                        description=f"Line too long ({len(line)} characters)",
                        line_number=i,
                        file_path=file_path,
                    )
                )

            # TODO/FIXME comments
            if re.search(r"(TODO|FIXME|HACK|XXX)", line, re.IGNORECASE):
                issues.append(
                    QualityIssue(
                        type="todo_comment",
                        severity="low",
                        description="TODO/FIXME comment found",
                        line_number=i,
                        file_path=file_path,
                    )
                )

            # Deep nesting (simplified check)
            if len(line) - len(line.lstrip()) > 16:  # More than 4 levels of indentation
                issues.append(
                    QualityIssue(
                        type="deep_nesting",
                        severity="medium",
                        description="Deep nesting detected",
                        line_number=i,
                        file_path=file_path,
                    )
                )

        # Magic numbers
        magic_numbers = re.findall(r"\b(?!0|1)\d{2,}\b", content)
        if len(magic_numbers) > 5:
            issues.append(
                QualityIssue(
                    type="magic_numbers",
                    severity="medium",
                    description=f"Multiple magic numbers found ({len(magic_numbers)})",
                    line_number=0,
                    file_path=file_path,
                )
            )

        return issues[:10]  # Limit to 10 issues per file

    def _calculate_complexity(self, content: str, language: str) -> int:
        """Calculate complexity score for code"""
        complexity = 0

        # Count control structures
        control_patterns = [
            r"\bif\b",
            r"\belse\b",
            r"\belif\b",
            r"\bfor\b",
            r"\bwhile\b",
            r"\btry\b",
            r"\bcatch\b",
            r"\bswitch\b",
            r"\bcase\b",
        ]

        for pattern in control_patterns:
            complexity += len(re.findall(pattern, content, re.IGNORECASE))

        # Count logical operators
        logical_patterns = [r"\&\&", r"\|\|", r"\band\b", r"\bor\b"]
        for pattern in logical_patterns:
            complexity += len(re.findall(pattern, content, re.IGNORECASE))

        # Count functions/methods
        if language == "python":
            complexity += len(re.findall(r"def\s+\w+", content))
        elif language in ["javascript", "typescript"]:
            complexity += len(re.findall(r"function\s+\w+|=>\s*{", content))
        elif language == "java":
            complexity += len(re.findall(r"public\s+\w+.*?\(", content))

        return min(complexity, 100)  # Cap at 100

    def _analyze_architecture(self, file_tree: List[Dict]) -> Dict[str, Any]:
        """Analyze overall architecture patterns"""
        directories = set()
        for file_info in file_tree:
            path = file_info["path"]
            if "/" in path:
                dirs = path.split("/")[:-1]  # Exclude filename
                for i in range(len(dirs)):
                    directories.add("/".join(dirs[: i + 1]))

        # Check for architecture patterns
        detected_patterns = []
        for pattern_name, required_dirs in self.architecture_patterns.items():
            matches = sum(
                1
                for req_dir in required_dirs
                if any(req_dir in dir_path for dir_path in directories)
            )

            if matches >= len(required_dirs) * 0.6:  # 60% match threshold
                detected_patterns.append(
                    {
                        "pattern": pattern_name,
                        "confidence": matches / len(required_dirs),
                        "matched_components": [
                            req_dir
                            for req_dir in required_dirs
                            if any(req_dir in dir_path for dir_path in directories)
                        ],
                    }
                )

        return {
            "detected_patterns": detected_patterns,
            "directory_structure": list(directories)[:20],  # Limit to 20 directories
            "project_size": (
                "small"
                if len(file_tree) < 50
                else "medium" if len(file_tree) < 200 else "large"
            ),
        }

    def _calculate_code_metrics(
        self, file_analyses: List[FileAnalysis], total_lines: int, total_complexity: int
    ) -> CodeMetrics:
        """Calculate overall code metrics"""
        if not file_analyses:
            return CodeMetrics(
                lines_of_code=0,
                cyclomatic_complexity=0,
                maintainability_index=0,
                code_duplication=0,
                test_coverage=0,
                technical_debt_ratio=0,
            )

        avg_complexity = total_complexity / len(file_analyses)

        # Count quality issues by severity
        high_severity_issues = sum(
            len(
                [issue for issue in analysis.quality_issues if issue.severity == "high"]
            )
            for analysis in file_analyses
        )

        medium_severity_issues = sum(
            len(
                [
                    issue
                    for issue in analysis.quality_issues
                    if issue.severity == "medium"
                ]
            )
            for analysis in file_analyses
        )

        # Calculate maintainability index (simplified)
        maintainability = max(
            0,
            100
            - avg_complexity
            - (high_severity_issues * 5)
            - (medium_severity_issues * 2),
        )

        # Calculate technical debt ratio
        total_issues = high_severity_issues + medium_severity_issues
        technical_debt = (
            min(total_issues / total_lines * 100, 100) if total_lines > 0 else 0
        )

        return CodeMetrics(
            lines_of_code=total_lines,
            cyclomatic_complexity=int(avg_complexity),
            maintainability_index=int(maintainability),
            code_duplication=0,  # Would require more complex analysis
            test_coverage=0,  # Would require test execution
            technical_debt_ratio=technical_debt,
        )

    def _summarize_patterns(self, framework_usage: Dict[str, int]) -> Dict[str, Any]:
        """Summarize detected patterns and frameworks"""
        if not framework_usage:
            return {}

        # Sort by usage frequency
        sorted_patterns = sorted(
            framework_usage.items(), key=lambda x: x[1], reverse=True
        )

        return {
            "most_used_patterns": sorted_patterns[:10],
            "total_pattern_matches": sum(framework_usage.values()),
            "unique_patterns": len(framework_usage),
        }

    def _detect_language(self, file_path: str, content: str) -> str:
        """Detect programming language from file extension and content"""
        # Map file extensions to languages
        extension_map = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".java": "java",
            ".php": "php",
            ".go": "go",
            ".rs": "rust",
            ".rb": "ruby",
            ".cs": "csharp",
            ".cpp": "cpp",
            ".c": "cpp",
            ".h": "cpp",
        }

        # Get extension
        ext = "." + file_path.split(".")[-1].lower() if "." in file_path else ""

        if ext in extension_map:
            return extension_map[ext]

        # Content-based detection for files without clear extensions
        if "def " in content and "import " in content:
            return "python"
        elif "function " in content or "const " in content:
            return "javascript"
        elif "public class " in content:
            return "java"
        elif "<?php" in content:
            return "php"

        return "unknown"

    def _is_code_file(self, file_path: str) -> bool:
        """Check if file is a source code file"""
        code_extensions = {
            ".py",
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".java",
            ".php",
            ".go",
            ".rs",
            ".rb",
            ".cs",
            ".cpp",
            ".c",
            ".h",
            ".hpp",
            ".kt",
            ".scala",
        }

        ext = "." + file_path.split(".")[-1].lower() if "." in file_path else ""
        return ext in code_extensions

    async def analyze(self, repo_data: Dict) -> Dict:
        """Analyze repository data for code quality with stack and dependency context"""
        try:
            # Extract contexts for better analysis
            stack_context = repo_data.get("stack_context")
            dependency_context = repo_data.get("dependency_context")

            if stack_context:
                logger.info(
                    f"Using stack context for code analysis: {stack_context.get('language', 'unknown')} / {stack_context.get('framework', 'none')}"
                )
            if dependency_context:
                logger.info(
                    f"Using dependency context: {dependency_context.get('total_dependencies', 0)} dependencies"
                )

            # Perform enhanced code analysis with contexts
            analysis = await self.analyze_code_with_context(
                repo_data["key_files"],
                repo_data["file_tree"],
                stack_context,
                dependency_context,
            )

            # Calculate better confidence based on analysis results
            base_confidence = 0.6 if analysis.total_files_analyzed > 0 else 0.1

            # Boost confidence based on analysis quality
            if analysis.total_files_analyzed > 5:
                base_confidence += 0.2
            if analysis.total_lines_of_code > 100:
                base_confidence += 0.1
            if analysis.language_distribution:
                base_confidence += 0.1

            confidence = min(base_confidence, 0.95)

            return {
                "total_files": analysis.total_files_analyzed,
                "total_lines": analysis.total_lines_of_code,
                "language_distribution": analysis.language_distribution,
                "confidence": confidence,
                "metrics": {
                    "complexity": (
                        analysis.code_metrics.cyclomatic_complexity
                        if analysis.code_metrics
                        else 0
                    ),
                    "maintainability": (
                        analysis.code_metrics.maintainability_index
                        if analysis.code_metrics
                        else 50  # Default maintainability score
                    ),
                    "overall_score": max(
                        50,
                        (
                            100 - (analysis.code_metrics.cyclomatic_complexity * 5)
                            if analysis.code_metrics
                            else 75
                        ),
                    ),
                    "test_coverage": 0,  # Placeholder
                    "code_duplication": 0,  # Placeholder
                    "technical_debt": len(analysis.quality_issues)
                    * 10,  # Estimate based on issues
                },
                "quality_issues": [
                    {"type": issue.type, "severity": issue.severity}
                    for issue in analysis.quality_issues[:10]
                ],
                "recommendations": [
                    {
                        "type": "quality",
                        "description": "Improve code quality based on detected issues",
                    },
                    {"type": "testing", "description": "Add comprehensive unit tests"},
                    {
                        "type": "documentation",
                        "description": "Improve code documentation and comments",
                    },
                ],
                "suggestions": [
                    "Consider adding automated testing",
                    "Implement code linting and formatting",
                    "Add CI/CD pipeline for quality checks",
                ],
                "detected_files": list(repo_data["key_files"].keys())[
                    :20
                ],  # Limit for response size
            }
        except Exception as e:
            logger.error(f"Code analysis failed: {e}")
            return {
                "error": str(e),
                "confidence": 0.0,
                "metrics": {"complexity": 0, "maintainability": 0},
                "recommendations": [],
                "suggestions": ["Analysis failed - check repository accessibility"],
                "detected_files": [],
            }

    async def analyze_code_with_context(
        self,
        key_files: Dict[str, str],
        file_tree: List[Dict],
        stack_context: Optional[Dict] = None,
        dependency_context: Optional[Dict] = None,
    ) -> CodeAnalysis:
        """
        Enhanced code analysis using stack and dependency context for better accuracy
        """
        # Use existing analyze_code method as base
        base_analysis = await self.analyze_code(key_files, file_tree)

        # Enhance analysis with context
        if stack_context:
            base_analysis = self._enhance_with_stack_context(
                base_analysis, stack_context
            )

        if dependency_context:
            base_analysis = self._enhance_with_dependency_context(
                base_analysis, dependency_context
            )

        return base_analysis

    def _enhance_with_stack_context(
        self, analysis: CodeAnalysis, stack_context: Dict
    ) -> CodeAnalysis:
        """Enhance analysis using stack detection context"""
        language = stack_context.get("language", "").lower()
        framework = stack_context.get("framework", "").lower()

        # Adjust complexity scoring based on framework patterns
        if framework in ["react", "vue", "angular"]:
            # Frontend frameworks often have higher file counts but lower complexity per file
            analysis.code_metrics.complexity *= 0.9
        elif framework in ["django", "flask", "fastapi"]:
            # Backend frameworks might have higher complexity
            analysis.code_metrics.complexity *= 1.1

        logger.info(f"Enhanced code analysis with {language}/{framework} context")
        return analysis

    def _enhance_with_dependency_context(
        self, analysis: CodeAnalysis, dependency_context: Dict
    ) -> CodeAnalysis:
        """Enhance analysis using dependency context"""
        total_deps = dependency_context.get("total_dependencies", 0)

        # Adjust maintainability based on dependency count
        if total_deps > 50:
            analysis.code_metrics.maintainability *= (
                0.95  # Slightly reduce maintainability for high dependency count
            )
        elif total_deps < 10:
            analysis.code_metrics.maintainability *= (
                1.05  # Boost maintainability for minimal dependencies
            )

        logger.info(f"Enhanced code analysis with {total_deps} dependencies context")
        return analysis
