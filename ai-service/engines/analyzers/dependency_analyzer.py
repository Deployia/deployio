"""
Dependency Analyzer - Pure rule-based dependency analysis
Analyzes project dependencies for security, health, and optimization
"""

import logging
import json
import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

from .base_analyzer import BaseAnalyzer, AnalyzerResult
from models.analysis_models import DependencyAnalysis, DependencyInfo
from models.common_models import InsightModel

logger = logging.getLogger(__name__)


@dataclass
class DependencyAnalyzerResult(AnalyzerResult):
    """Result from dependency analyzer"""

    dependency_analysis: DependencyAnalysis = field(default_factory=DependencyAnalysis)


class DependencyAnalyzer(BaseAnalyzer):
    """
    Rule-based dependency analyzer

    Analyzes:
    1. Package files (package.json, requirements.txt, etc.)
    2. Dependency counts and types
    3. Version analysis
    4. Security patterns (basic rule-based)
    5. Health scoring
    """

    def __init__(self):
        super().__init__()
        self._init_dependency_patterns()
        logger.info("DependencyAnalyzer initialized")

    def _init_dependency_patterns(self):
        """Initialize dependency analysis patterns"""

        # Package file parsers
        self.package_parsers = {
            "package.json": self._parse_package_json,
            "requirements.txt": self._parse_requirements_txt,
            "Pipfile": self._parse_pipfile,
            "pyproject.toml": self._parse_pyproject_toml,
            "pom.xml": self._parse_pom_xml,
            "build.gradle": self._parse_build_gradle,
            "composer.json": self._parse_composer_json,
            "Gemfile": self._parse_gemfile,
            "Cargo.toml": self._parse_cargo_toml,
            "go.mod": self._parse_go_mod,
        }

        # Known vulnerable patterns (basic rule-based security)
        self.vulnerable_patterns = {
            "javascript": {
                "lodash": {"versions": ["<4.17.11"], "severity": "high"},
                "moment": {"versions": ["<2.29.2"], "severity": "medium"},
                "handlebars": {"versions": ["<4.7.7"], "severity": "high"},
                "jquery": {"versions": ["<3.5.0"], "severity": "medium"},
            },
            "python": {
                "flask": {"versions": ["<1.1.4"], "severity": "medium"},
                "django": {"versions": ["<3.2.13"], "severity": "high"},
                "requests": {"versions": ["<2.26.0"], "severity": "medium"},
                "pyyaml": {"versions": ["<5.4"], "severity": "high"},
            },
            "java": {
                "spring-core": {"versions": ["<5.3.21"], "severity": "high"},
                "log4j-core": {"versions": ["<2.17.0"], "severity": "critical"},
                "jackson-databind": {"versions": ["<2.13.2"], "severity": "high"},
            },
        }

        # Development dependency patterns
        self.dev_dependency_patterns = {
            "javascript": [
                "jest",
                "mocha",
                "chai",
                "eslint",
                "prettier",
                "webpack",
                "babel",
            ],
            "python": ["pytest", "black", "flake8", "mypy", "sphinx"],
            "java": ["junit", "mockito", "checkstyle"],
        }

    async def analyze(
        self, repository_data: Dict[str, Any]
    ) -> DependencyAnalyzerResult:
        """Analyze project dependencies (multi-folder aware)"""

        result = DependencyAnalyzerResult()

        try:
            # Log available files for debugging
            files = (
                repository_data.get("files") or repository_data.get("key_files") or {}
            )
            file_tree = repository_data.get("file_tree", [])
            logger.info(
                f"Dependency analyzer: Found {len(files)} key files and {len(file_tree)} in file tree"
            )

            # Find all files matching each supported dependency filename (e.g. any **/package.json)
            dependency_files = []
            for dep_filename in self.package_parsers.keys():
                for file_path in files.keys():
                    if (
                        file_path.endswith(f"/{dep_filename}")
                        or file_path == dep_filename
                    ):
                        has_content = bool(files[file_path])
                        dependency_files.append(
                            f"{file_path}{'(with content)' if has_content else '(no content)'}"
                        )
            logger.info(f"Dependency files found: {dependency_files}")

            # --- CLEANED: Only log a summary of file counts and empty files if any ---
            file_count = len(files)
            empty_files = [k for k, v in files.items() if not v]
            logger.info(
                f"Dependency analyzer: Received {file_count} key files for analysis"
            )
            if empty_files:
                logger.warning(
                    f"Dependency analyzer: {len(empty_files)} key files have empty content: {empty_files}"
                )
            # ------------------------------------------------

            # Parse all found dependency files
            dependencies = []
            package_managers = []
            for dep_filename, parser in self.package_parsers.items():
                for file_path in files.keys():
                    if (
                        file_path.endswith(f"/{dep_filename}")
                        or file_path == dep_filename
                    ):
                        file_content = files[file_path]
                        if file_content:
                            parsed_deps, manager = parser(file_content)
                            dependencies.extend(parsed_deps)
                            if manager not in package_managers:
                                package_managers.append(manager)

            # Analyze dependencies
            analysis = self._analyze_dependencies(dependencies)
            result.dependency_analysis = analysis
            # Generate insights
            insights = self._generate_dependency_insights(analysis, dependencies)

            # Calculate confidence
            confidence = self._calculate_dependency_confidence(
                analysis, package_managers
            )

            result.dependency_analysis = analysis
            result.insights = insights
            result.confidence = confidence

            logger.info(
                f"Dependency analysis completed: {analysis.total_dependencies} dependencies found"
            )

        except Exception as e:
            logger.error(f"Dependency analysis failed: {str(e)}", exc_info=True)
            result.error_message = str(e)

        return result

    def _parse_package_json(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse package.json dependencies"""
        dependencies = []

        try:
            data = json.loads(content)

            # Production dependencies
            prod_deps = data.get("dependencies", {})
            for name, version in prod_deps.items():
                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="production",
                        manager="npm",
                    )
                )

            # Development dependencies
            dev_deps = data.get("devDependencies", {})
            for name, version in dev_deps.items():
                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="development",
                        manager="npm",
                    )
                )

        except json.JSONDecodeError:
            logger.warning("Failed to parse package.json")

        return dependencies, "npm"

    def _parse_requirements_txt(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse requirements.txt dependencies"""
        dependencies = []

        for line in content.split("\n"):
            line = line.strip()
            if line and not line.startswith("#"):
                # Parse package==version or package>=version format
                match = re.match(r"^([a-zA-Z0-9_-]+)([>=<~!]+)?([0-9\.]+.*)?", line)
                if match:
                    name = match.group(1)
                    version = match.group(3) if match.group(3) else None

                    dependencies.append(
                        DependencyInfo(
                            name=name, version=version, type="production", manager="pip"
                        )
                    )

        return dependencies, "pip"

    def _parse_pipfile(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse Pipfile dependencies"""
        dependencies = []

        # Basic TOML-like parsing for Pipfile
        lines = content.split("\n")
        current_section = None

        for line in lines:
            line = line.strip()
            if line.startswith("["):
                current_section = line.strip("[]")
            elif "=" in line and current_section in ["packages", "dev-packages"]:
                parts = line.split("=", 1)
                if len(parts) == 2:
                    name = parts[0].strip().strip('"')
                    version_info = parts[1].strip().strip('"')

                    # Extract version from various formats
                    version = self._extract_version_from_pipfile_value(version_info)

                    dep_type = (
                        "production" if current_section == "packages" else "development"
                    )

                    dependencies.append(
                        DependencyInfo(
                            name=name, version=version, type=dep_type, manager="pip"
                        )
                    )

        return dependencies, "pip"

    def _parse_pyproject_toml(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse pyproject.toml dependencies (basic parsing)"""
        dependencies = []

        # Look for dependencies in [tool.poetry.dependencies] section
        lines = content.split("\n")
        in_dependencies = False

        for line in lines:
            line = line.strip()

            if "[tool.poetry.dependencies]" in line:
                in_dependencies = True
                continue
            elif line.startswith("[") and in_dependencies:
                in_dependencies = False
                continue

            if in_dependencies and "=" in line:
                parts = line.split("=", 1)
                if len(parts) == 2:
                    name = parts[0].strip()
                    version = parts[1].strip().strip('"').strip("'")

                    if name != "python":  # Skip python version requirement
                        dependencies.append(
                            DependencyInfo(
                                name=name,
                                version=version,
                                type="production",
                                manager="poetry",
                            )
                        )

        return dependencies, "poetry"

    def _parse_pom_xml(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse pom.xml dependencies (basic XML parsing)"""
        dependencies = []

        # Extract dependencies using regex (basic approach)
        dependency_pattern = r"<dependency>.*?<groupId>(.*?)</groupId>.*?<artifactId>(.*?)</artifactId>.*?<version>(.*?)</version>.*?</dependency>"

        matches = re.findall(dependency_pattern, content, re.DOTALL)
        for match in matches:
            group_id, artifact_id, version = match
            name = f"{group_id}:{artifact_id}"

            dependencies.append(
                DependencyInfo(
                    name=name,
                    version=version.strip(),
                    type="production",
                    manager="maven",
                )
            )

        return dependencies, "maven"

    def _parse_build_gradle(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse build.gradle dependencies"""
        dependencies = []

        # Look for implementation, compile, testImplementation patterns
        dependency_patterns = [
            r"implementation ['\"]([^'\"]+)['\"]",
            r"compile ['\"]([^'\"]+)['\"]",
            r"testImplementation ['\"]([^'\"]+)['\"]",
            r"api ['\"]([^'\"]+)['\"]",
        ]

        for pattern in dependency_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                # Parse group:artifact:version format
                parts = match.split(":")
                if len(parts) >= 2:
                    name = f"{parts[0]}:{parts[1]}"
                    version = parts[2] if len(parts) > 2 else None

                    dep_type = (
                        "development" if "test" in pattern.lower() else "production"
                    )

                    dependencies.append(
                        DependencyInfo(
                            name=name, version=version, type=dep_type, manager="gradle"
                        )
                    )

        return dependencies, "gradle"

    def _parse_composer_json(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse composer.json dependencies"""
        dependencies = []

        try:
            data = json.loads(content)

            # Production dependencies
            require = data.get("require", {})
            for name, version in require.items():
                if name != "php":  # Skip php version requirement
                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=self._clean_version(version),
                            type="production",
                            manager="composer",
                        )
                    )

            # Development dependencies
            require_dev = data.get("require-dev", {})
            for name, version in require_dev.items():
                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="development",
                        manager="composer",
                    )
                )

        except json.JSONDecodeError:
            logger.warning("Failed to parse composer.json")

        return dependencies, "composer"

    def _parse_gemfile(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse Gemfile dependencies"""
        dependencies = []

        for line in content.split("\n"):
            line = line.strip()

            # Look for gem 'name', 'version' patterns
            gem_match = re.match(
                r"gem ['\"]([^'\"]+)['\"](?:,\s*['\"]([^'\"]+)['\"])?", line
            )
            if gem_match:
                name = gem_match.group(1)
                version = gem_match.group(2) if gem_match.group(2) else None

                dependencies.append(
                    DependencyInfo(
                        name=name, version=version, type="production", manager="bundler"
                    )
                )

        return dependencies, "bundler"

    def _parse_cargo_toml(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse Cargo.toml dependencies"""
        dependencies = []

        lines = content.split("\n")
        in_dependencies = False

        for line in lines:
            line = line.strip()

            if line == "[dependencies]":
                in_dependencies = True
                continue
            elif line.startswith("[") and in_dependencies:
                in_dependencies = False
                continue

            if in_dependencies and "=" in line:
                parts = line.split("=", 1)
                if len(parts) == 2:
                    name = parts[0].strip()
                    version = parts[1].strip().strip('"').strip("'")

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=version,
                            type="production",
                            manager="cargo",
                        )
                    )

        return dependencies, "cargo"

    def _parse_go_mod(self, content: str) -> tuple[List[DependencyInfo], str]:
        """Parse go.mod dependencies"""
        dependencies = []

        # Look for require blocks and individual requires
        require_pattern = r"require\s+([^\s]+)\s+([^\s]+)"

        matches = re.findall(require_pattern, content)
        for match in matches:
            name, version = match

            dependencies.append(
                DependencyInfo(
                    name=name, version=version, type="production", manager="go-modules"
                )
            )

        return dependencies, "go-modules"

    def _clean_version(self, version: str) -> str:
        """Clean version string from prefixes like ^, ~, >="""
        if not version:
            return ""

        # Remove common prefixes
        version = re.sub(r"^[\^~>=<]+", "", version)
        return version.strip()

    def _extract_version_from_pipfile_value(self, value: str) -> Optional[str]:
        """Extract version from Pipfile dependency value"""
        # Handle different formats: "1.0.0", "*", {"version": "1.0.0"}
        if value == "*":
            return None
        elif value.startswith("{"):
            # Try to extract version from dict-like string
            version_match = re.search(r'"version":\s*"([^"]+)"', value)
            if version_match:
                return version_match.group(1)
        else:
            return self._clean_version(value)

        return None

    def _analyze_dependencies(
        self, dependencies: List[DependencyInfo]
    ) -> DependencyAnalysis:
        """Analyze dependencies for security and health"""

        analysis = DependencyAnalysis()

        # Basic counts
        analysis.total_dependencies = len(dependencies)
        analysis.production_dependencies = sum(
            1 for dep in dependencies if dep.type == "production"
        )
        analysis.development_dependencies = sum(
            1 for dep in dependencies if dep.type == "development"
        )

        # Security analysis (rule-based)
        vulnerable_deps = self._check_for_vulnerabilities(dependencies)
        analysis.vulnerable_count = len(vulnerable_deps)

        # Count by severity
        for dep in vulnerable_deps:
            if dep.vulnerability_level == "critical":
                analysis.critical_vulnerabilities += 1
            elif dep.vulnerability_level == "high":
                analysis.high_vulnerabilities += 1
            elif dep.vulnerability_level == "medium":
                analysis.medium_vulnerabilities += 1
            elif dep.vulnerability_level == "low":
                analysis.low_vulnerabilities += 1

        # Health scoring
        analysis.health_score = self._calculate_health_score(
            dependencies, vulnerable_deps
        )

        # Generate recommendations
        analysis.security_recommendations = self._generate_security_recommendations(
            vulnerable_deps
        )
        analysis.optimization_suggestions = self._generate_optimization_suggestions(
            dependencies
        )

        analysis.dependencies = dependencies

        return analysis

    def _check_for_vulnerabilities(
        self, dependencies: List[DependencyInfo]
    ) -> List[DependencyInfo]:
        """Check dependencies for known vulnerabilities (rule-based)"""

        vulnerable_deps = []

        for dep in dependencies:
            # Check against known vulnerable patterns
            manager_lang_map = {
                "npm": "javascript",
                "pip": "python",
                "poetry": "python",
                "maven": "java",
                "gradle": "java",
            }

            language = manager_lang_map.get(dep.manager)
            if not language or language not in self.vulnerable_patterns:
                continue

            vuln_patterns = self.vulnerable_patterns[language]
            if dep.name in vuln_patterns:
                vuln_info = vuln_patterns[dep.name]

                # Simple version checking (basic implementation)
                if self._is_vulnerable_version(dep.version, vuln_info["versions"]):
                    dep.is_vulnerable = True
                    dep.vulnerability_level = vuln_info["severity"]
                    vulnerable_deps.append(dep)

        return vulnerable_deps

    def _is_vulnerable_version(
        self, version: str, vulnerable_versions: List[str]
    ) -> bool:
        """Check if version matches vulnerable patterns (simplified)"""
        if not version:
            return False

        for vuln_pattern in vulnerable_versions:
            if vuln_pattern.startswith("<"):
                # Simple less-than check (would need proper version comparison in production)
                vuln_version = vuln_pattern[1:]
                if version < vuln_version:  # Simplified comparison
                    return True

        return False

    def _calculate_health_score(
        self, dependencies: List[DependencyInfo], vulnerable_deps: List[DependencyInfo]
    ) -> float:
        """Calculate overall dependency health score"""

        if not dependencies:
            return 1.0

        base_score = 1.0

        # Penalize vulnerabilities
        vuln_ratio = len(vulnerable_deps) / len(dependencies)
        base_score -= vuln_ratio * 0.5

        # Penalize too many dependencies
        if len(dependencies) > 100:
            base_score -= 0.1
        elif len(dependencies) > 50:
            base_score -= 0.05

        # Boost for having some dependencies (shows active project)
        if 10 <= len(dependencies) <= 30:
            base_score += 0.1

        return max(0.0, min(1.0, base_score))

    def _generate_security_recommendations(
        self, vulnerable_deps: List[DependencyInfo]
    ) -> List[str]:
        """Generate security recommendations"""

        recommendations = []

        if vulnerable_deps:
            critical_count = sum(
                1 for dep in vulnerable_deps if dep.vulnerability_level == "critical"
            )
            high_count = sum(
                1 for dep in vulnerable_deps if dep.vulnerability_level == "high"
            )

            if critical_count > 0:
                recommendations.append(
                    f"URGENT: Update {critical_count} critical vulnerability(ies)"
                )

            if high_count > 0:
                recommendations.append(
                    f"Update {high_count} high severity vulnerability(ies)"
                )

            # Specific recommendations
            for dep in vulnerable_deps[:3]:  # Top 3 vulnerable dependencies
                recommendations.append(f"Update {dep.name} to latest secure version")

        if not recommendations:
            recommendations.append("No known security vulnerabilities detected")

        return recommendations

    def _generate_optimization_suggestions(
        self, dependencies: List[DependencyInfo]
    ) -> List[str]:
        """Generate optimization suggestions"""

        suggestions = []

        # Check for too many dependencies
        if len(dependencies) > 100:
            suggestions.append(
                "Consider reducing number of dependencies to improve build times"
            )

        # Check for development dependencies in production
        dev_deps = [dep for dep in dependencies if dep.type == "development"]
        if len(dev_deps) > len(dependencies) * 0.5:
            suggestions.append(
                "Large number of dev dependencies - ensure they're not included in production builds"
            )

        # Check for missing lock files (would need file existence check)
        suggestions.append("Ensure lock files are committed for reproducible builds")

        return suggestions

    def _calculate_dependency_confidence(
        self, analysis: DependencyAnalysis, package_managers: List[str]
    ) -> float:
        """Calculate confidence in dependency analysis"""

        confidence = 0.0

        # Base confidence from having package managers
        if package_managers:
            confidence += 0.5

        # Boost for having dependencies
        if analysis.total_dependencies > 0:
            confidence += 0.3

        # Boost for successful parsing
        if analysis.total_dependencies > 0 and package_managers:
            confidence += 0.2

        return min(1.0, confidence)

    def _generate_dependency_insights(
        self, analysis: DependencyAnalysis, dependencies: List[DependencyInfo]
    ) -> List[InsightModel]:
        """Generate insights from dependency analysis"""

        insights = []

        # Total dependencies insight
        if analysis.total_dependencies > 0:
            self._add_insight(
                insights,
                "dependencies",
                f"{analysis.total_dependencies} Dependencies Found",
                f"Project has {analysis.production_dependencies} production and {analysis.development_dependencies} development dependencies",
                0.9,
                [f"Using {', '.join(analysis.package_managers)} package manager(s)"],
                "medium",
            )

        # Security insights
        if analysis.vulnerable_count > 0:
            severity = (
                "critical"
                if analysis.critical_vulnerabilities > 0
                else "high" if analysis.high_vulnerabilities > 0 else "medium"
            )
            self._add_insight(
                insights,
                "security",
                f"{analysis.vulnerable_count} Security Issues",
                f"Found {analysis.vulnerable_count} dependencies with known vulnerabilities",
                0.95,
                [
                    f"{analysis.critical_vulnerabilities} critical, {analysis.high_vulnerabilities} high severity"
                ],
                severity,
            )
        else:
            self._add_insight(
                insights,
                "security",
                "No Known Vulnerabilities",
                "No known security vulnerabilities found in dependencies",
                0.8,
                ["Rule-based security analysis completed"],
                "low",
            )

        # Health insights
        health_status = (
            "excellent"
            if analysis.health_score > 0.8
            else "good" if analysis.health_score > 0.6 else "needs attention"
        )
        self._add_insight(
            insights,
            "health",
            f"Dependency Health: {health_status.title()}",
            f"Overall dependency health score: {analysis.health_score:.1%}",
            analysis.health_score,
            ["Health score based on security and optimization factors"],
            "medium",
        )

        return insights
