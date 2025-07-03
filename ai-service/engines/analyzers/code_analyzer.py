"""
Code Analyzer - Pure rule-based code quality and structure analysis
Analyzes code complexity, patterns, and architecture
"""

import logging
import re
from typing import Dict, Any, List
from dataclasses import dataclass, field

from .base_analyzer import BaseAnalyzer, AnalyzerResult
from models.analysis_models import CodeAnalysis
from models.common_models import InsightModel

logger = logging.getLogger(__name__)


@dataclass
class CodeAnalyzerResult(AnalyzerResult):
    """Result from code analyzer"""

    code_analysis: CodeAnalysis = field(default_factory=CodeAnalysis)


class CodeAnalyzer(BaseAnalyzer):
    """
    Rule-based code quality analyzer

    Analyzes:
    1. Code complexity metrics
    2. Code smells and patterns
    3. Architecture patterns
    4. Quality scoring
    """

    def __init__(self):
        super().__init__()
        self._init_analysis_patterns()
        logger.info("CodeAnalyzer initialized")

    def _init_analysis_patterns(self):
        """Initialize code analysis patterns"""

        # Code smell patterns
        self.code_smell_patterns = {
            "long_function": {
                "pattern": r"(def|function|class|method)\s+\w+.*?(?=\n\s*(def|function|class|$))",
                "threshold": 50,  # lines
                "severity": "medium",
            },
            "complex_condition": {
                "pattern": r"if.*?(?:and|or|\&\&|\|\|).*?(?:and|or|\&\&|\|\|)",
                "threshold": 1,
                "severity": "medium",
            },
            "magic_numbers": {
                "pattern": r"\b(?<![\.\w])\d{2,}\b(?![\.\w])",
                "threshold": 5,
                "severity": "low",
            },
            "todo_fixme": {
                "pattern": r"(TODO|FIXME|HACK|XXX|BUG)",
                "threshold": 1,
                "severity": "low",
            },
            "empty_catch": {
                "pattern": r"(except|catch).*?:\s*(pass|;|\{\s*\})",
                "threshold": 1,
                "severity": "high",
            },
            "deep_nesting": {
                "pattern": r"(\s{12,})",  # 12+ spaces = 3+ levels of indentation
                "threshold": 3,
                "severity": "medium",
            },
            "long_line": {
                "pattern": r".{120,}",  # Lines over 120 characters
                "threshold": 10,
                "severity": "low",
            },
        }

        # Architecture patterns
        self.architecture_patterns = {
            "mvc": {
                "indicators": [
                    "models/",
                    "views/",
                    "controllers/",
                    "Model",
                    "View",
                    "Controller",
                ],
                "confidence_boost": 0.3,
            },
            "microservices": {
                "indicators": ["services/", "microservice", "api/", "endpoints/"],
                "confidence_boost": 0.2,
            },
            "layered": {
                "indicators": [
                    "layers/",
                    "presentation/",
                    "business/",
                    "data/",
                    "dal/",
                ],
                "confidence_boost": 0.2,
            },
            "component_based": {
                "indicators": ["components/", "widgets/", "modules/"],
                "confidence_boost": 0.2,
            },
            "repository_pattern": {
                "indicators": ["repository", "Repository", "repositories/"],
                "confidence_boost": 0.15,
            },
        }

        # Design patterns
        self.design_patterns = {
            "singleton": {
                "patterns": [r"class.*Singleton", r"def __new__", r"getInstance"],
                "language": ["python", "java", "javascript"],
            },
            "factory": {
                "patterns": [r"class.*Factory", r"createInstance", r"factory"],
                "language": ["python", "java", "javascript"],
            },
            "observer": {
                "patterns": [
                    r"addEventListener",
                    r"observer",
                    r"Observable",
                    r"subscribe",
                ],
                "language": ["python", "java", "javascript"],
            },
            "decorator": {
                "patterns": [r"@\w+", r"decorator", r"@decorator"],
                "language": ["python", "javascript"],
            },
            "strategy": {
                "patterns": [r"Strategy", r"algorithm", r"strategy"],
                "language": ["python", "java", "javascript"],
            },
        }

        # File type patterns for analysis
        self.analyzable_extensions = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".java": "java",
            ".php": "php",
            ".rb": "ruby",
            ".go": "go",
            ".rs": "rust",
            ".cpp": "cpp",
            ".c": "c",
            ".cs": "csharp",
        }

    async def analyze(self, repository_data: Dict[str, Any]) -> CodeAnalyzerResult:
        """Analyze code quality and structure"""

        result = CodeAnalyzerResult()

        try:
            # Get analyzable files
            code_files = self._get_code_files(repository_data)

            # --- CLEANED: Only log a summary of file counts and empty files if any ---
            files = (
                repository_data.get("files") or repository_data.get("key_files") or {}
            )
            file_count = len(files)
            empty_files = [k for k, v in files.items() if not v]
            logger.info(f"Code analyzer: Received {file_count} key files for analysis")
            if empty_files:
                logger.warning(
                    f"Code analyzer: {len(empty_files)} key files have empty content: {empty_files}"
                )
            # ------------------------------------------------

            if not code_files:
                logger.info("No code files found for analysis")
                result.code_analysis = CodeAnalysis()
                return result

            # Analyze code metrics
            total_lines = 0
            complexity_scores = []
            code_smells = []

            for file_path in code_files:
                file_content = self._extract_file_content(repository_data, file_path)
                if file_content:
                    # Basic metrics
                    lines = len(file_content.split("\n"))
                    total_lines += lines

                    # Complexity analysis
                    complexity = self._calculate_file_complexity(
                        file_content, file_path
                    )
                    complexity_scores.append(complexity)

                    # Code smell detection
                    smells = self._detect_code_smells(file_content, file_path)
                    code_smells.extend(smells)

            # Architecture pattern detection
            architecture_patterns = self._detect_architecture_patterns(repository_data)
            design_patterns = self._detect_design_patterns(repository_data, code_files)

            # Calculate quality scores
            avg_complexity = (
                sum(complexity_scores) / len(complexity_scores)
                if complexity_scores
                else 0
            )
            quality_score = self._calculate_quality_score(
                avg_complexity, code_smells, total_lines
            )
            maintainability_score = self._calculate_maintainability_score(
                quality_score, architecture_patterns
            )

            # Build analysis result
            analysis = CodeAnalysis(
                total_files=len(code_files),
                total_lines=total_lines,
                complexity_score=avg_complexity,
                maintainability_score=maintainability_score,
                quality_score=quality_score,
                code_smells=code_smells,
                patterns_detected=design_patterns,
                architecture_patterns=architecture_patterns,
            )

            # Generate insights
            insights = self._generate_code_insights(analysis, code_files)

            # Calculate confidence
            confidence = self._calculate_code_confidence(analysis, code_files)

            result.code_analysis = analysis
            result.insights = insights
            result.confidence = confidence

            logger.info(
                f"Code analysis completed: {len(code_files)} files, quality score: {quality_score:.2f}"
            )

        except Exception as e:
            logger.error(f"Code analysis failed: {str(e)}", exc_info=True)
            result.error_message = str(e)

        return result

    def _get_code_files(self, repository_data: Dict[str, Any]) -> List[str]:
        """Get list of code files for analysis"""

        files = self._get_file_list(repository_data)
        code_files = []

        for file_path in files:
            # Check if file is analyzable
            for ext, lang in self.analyzable_extensions.items():
                if file_path.endswith(ext):
                    # Skip certain directories/files
                    if not self._should_skip_file(file_path):
                        code_files.append(file_path)
                    break

        return code_files

    def _should_skip_file(self, file_path: str) -> bool:
        """Check if file should be skipped from analysis"""

        skip_patterns = [
            "node_modules/",
            ".git/",
            "vendor/",
            "build/",
            "dist/",
            "target/",
            "__pycache__/",
            ".pytest_cache/",
            "coverage/",
            "test/",
            "tests/",
            "spec/",
            ".min.",
            ".bundle.",
        ]

        for pattern in skip_patterns:
            if pattern in file_path:
                return True

        return False

    def _calculate_file_complexity(self, content: str, file_path: str) -> float:
        """Calculate complexity score for a file"""

        lines = content.split("\n")
        complexity_score = 0.0

        # Basic complexity indicators
        for line in lines:
            line = line.strip()

            # Control flow statements increase complexity
            if re.search(r"\b(if|for|while|switch|case|try|catch|except)\b", line):
                complexity_score += 1

            # Nested structures increase complexity more
            indent_level = len(line) - len(line.lstrip())
            if indent_level > 8:  # Deep nesting
                complexity_score += 0.5

            # Function definitions
            if re.search(r"\b(def|function|class)\s+\w+", line):
                complexity_score += 0.5

        # Normalize by file size
        if lines:
            complexity_score = complexity_score / len(lines)

        return min(10.0, complexity_score)  # Cap at 10

    def _detect_code_smells(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Detect code smells in file content"""

        smells = []
        lines = content.split("\n")

        for smell_name, smell_config in self.code_smell_patterns.items():
            pattern = smell_config["pattern"]
            threshold = smell_config["threshold"]
            severity = smell_config["severity"]

            if smell_name == "long_function":
                # Special handling for long functions
                function_matches = re.finditer(
                    pattern, content, re.DOTALL | re.MULTILINE
                )
                for match in function_matches:
                    function_lines = match.group().count("\n")
                    if function_lines > threshold:
                        smells.append(
                            {
                                "type": smell_name,
                                "file": file_path,
                                "severity": severity,
                                "description": f"Function has {function_lines} lines (threshold: {threshold})",
                                "line": content[: match.start()].count("\n") + 1,
                            }
                        )

            elif smell_name == "deep_nesting":
                # Check for deep nesting
                for i, line in enumerate(lines):
                    if re.search(pattern, line):
                        indent_level = (
                            len(line) - len(line.lstrip())
                        ) // 4  # Assuming 4-space indentation
                        if indent_level >= threshold:
                            smells.append(
                                {
                                    "type": smell_name,
                                    "file": file_path,
                                    "severity": severity,
                                    "description": f"Deep nesting level {indent_level}",
                                    "line": i + 1,
                                }
                            )

            else:
                # General pattern matching
                matches = re.findall(pattern, content, re.IGNORECASE)
                if len(matches) >= threshold:
                    smells.append(
                        {
                            "type": smell_name,
                            "file": file_path,
                            "severity": severity,
                            "description": f"Found {len(matches)} occurrences",
                            "count": len(matches),
                        }
                    )

        return smells

    def _detect_architecture_patterns(
        self, repository_data: Dict[str, Any]
    ) -> List[str]:
        """Detect architecture patterns from file structure"""

        files = self._get_file_list(repository_data)
        detected_patterns = []

        for pattern_name, pattern_config in self.architecture_patterns.items():
            indicators = pattern_config["indicators"]

            # Check if files/directories match pattern indicators
            matches = 0
            for indicator in indicators:
                for file_path in files:
                    if indicator.lower() in file_path.lower():
                        matches += 1
                        break

            # If we found enough indicators, consider pattern detected
            if matches >= len(indicators) * 0.6:  # 60% threshold
                detected_patterns.append(pattern_name)

        return detected_patterns

    def _detect_design_patterns(
        self, repository_data: Dict[str, Any], code_files: List[str]
    ) -> List[str]:
        """Detect design patterns from code content"""

        detected_patterns = []

        for pattern_name, pattern_config in self.design_patterns.items():
            patterns = pattern_config["patterns"]

            # Check patterns in code content
            pattern_found = False
            for file_path in code_files[:10]:  # Check first 10 files for performance
                content = self._extract_file_content(repository_data, file_path)
                if content:
                    for pattern in patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            pattern_found = True
                            break

                if pattern_found:
                    break

            if pattern_found:
                detected_patterns.append(pattern_name)

        return detected_patterns

    def _calculate_quality_score(
        self, complexity: float, code_smells: List[Dict], total_lines: int
    ) -> float:
        """Calculate overall quality score"""

        base_score = 1.0

        # Penalize high complexity
        if complexity > 5:
            base_score -= 0.3
        elif complexity > 3:
            base_score -= 0.1

        # Penalize code smells
        smell_penalty = 0
        for smell in code_smells:
            if smell["severity"] == "high":
                smell_penalty += 0.1
            elif smell["severity"] == "medium":
                smell_penalty += 0.05
            elif smell["severity"] == "low":
                smell_penalty += 0.02

        base_score -= min(0.5, smell_penalty)  # Cap penalty at 0.5

        # Boost for reasonable size
        if 100 <= total_lines <= 10000:
            base_score += 0.1

        return max(0.0, min(1.0, base_score))

    def _calculate_maintainability_score(
        self, quality_score: float, architecture_patterns: List[str]
    ) -> float:
        """Calculate maintainability score"""

        maintainability = quality_score

        # Boost for good architecture patterns
        if architecture_patterns:
            maintainability += len(architecture_patterns) * 0.1

        return min(1.0, maintainability)

    def _calculate_code_confidence(
        self, analysis: CodeAnalysis, code_files: List[str]
    ) -> float:
        """Calculate confidence in code analysis"""

        confidence = 0.0

        # Base confidence from having files to analyze
        if code_files:
            confidence += 0.6

        # Boost for having enough files
        if len(code_files) >= 5:
            confidence += 0.2
        elif len(code_files) >= 2:
            confidence += 0.1

        # Boost for having meaningful analysis
        if analysis.total_lines > 100:
            confidence += 0.2

        return min(1.0, confidence)

    def _generate_code_insights(
        self, analysis: CodeAnalysis, code_files: List[str]
    ) -> List[InsightModel]:
        """Generate insights from code analysis"""

        insights = []

        # File count insight
        if analysis.total_files > 0:
            self._add_insight(
                insights,
                "code_structure",
                f"{analysis.total_files} Code Files Analyzed",
                f"Analyzed {analysis.total_files} code files totaling {analysis.total_lines:,} lines",
                0.9,
                [
                    f"Files: {', '.join(code_files[:5])}{'...' if len(code_files) > 5 else ''}"
                ],
                "medium",
            )

        # Quality insight
        quality_level = (
            "excellent"
            if analysis.quality_score > 0.8
            else "good" if analysis.quality_score > 0.6 else "needs improvement"
        )
        quality_impact = (
            "low"
            if analysis.quality_score > 0.7
            else "medium" if analysis.quality_score > 0.5 else "high"
        )

        self._add_insight(
            insights,
            "code_quality",
            f"Code Quality: {quality_level.title()}",
            f"Overall code quality score: {analysis.quality_score:.1%}",
            analysis.quality_score,
            ["Based on complexity and code smell analysis"],
            quality_impact,
        )

        # Complexity insight
        if analysis.complexity_score > 0:
            complexity_level = (
                "high"
                if analysis.complexity_score > 5
                else "moderate" if analysis.complexity_score > 2 else "low"
            )
            self._add_insight(
                insights,
                "complexity",
                f"Code Complexity: {complexity_level.title()}",
                f"Average complexity score: {analysis.complexity_score:.1f}/10",
                0.8,
                ["Complexity measured by control flow and nesting"],
                "medium" if analysis.complexity_score > 3 else "low",
            )

        # Code smells insight
        if analysis.code_smells:
            smell_count = len(analysis.code_smells)
            high_severity_smells = sum(
                1 for smell in analysis.code_smells if smell.get("severity") == "high"
            )

            impact = "high" if high_severity_smells > 0 else "medium"

            self._add_insight(
                insights,
                "code_smells",
                f"{smell_count} Code Issues Found",
                f"Detected {smell_count} code smells that may affect maintainability",
                0.8,
                [
                    (
                        f"{high_severity_smells} high severity issues"
                        if high_severity_smells
                        else "No high severity issues"
                    )
                ],
                impact,
            )

        # Architecture insights
        if analysis.architecture_patterns:
            self._add_insight(
                insights,
                "architecture",
                f"Architecture Patterns: {', '.join(analysis.architecture_patterns).title()}",
                f"Detected {len(analysis.architecture_patterns)} architecture patterns",
                0.7,
                analysis.architecture_patterns,
                "low",
            )

        # Design patterns insight
        if analysis.patterns_detected:
            self._add_insight(
                insights,
                "design_patterns",
                f"Design Patterns: {', '.join(analysis.patterns_detected).title()}",
                f"Found {len(analysis.patterns_detected)} design patterns in code",
                0.6,
                analysis.patterns_detected,
                "low",
            )

        return insights
