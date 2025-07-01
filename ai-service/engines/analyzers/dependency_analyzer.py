"""
Dependency Analyzer - Extract and analyze project dependencies
Handles multiple package managers and dependency formats
"""

import json
import re
import logging
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from engines.core.models import DependencyAnalysis, DependencyInfo
from .base_analyzer import BaseAnalyzer

logger = logging.getLogger(__name__)


@dataclass
class PackageInfo:
    """Package information extracted from dependency files"""

    name: str
    version: str
    dev_dependency: bool = False
    optional: bool = False
    scope: Optional[str] = None


class DependencyAnalyzer(BaseAnalyzer):
    """
    Multi-format dependency analyzer

    Supported formats:
    - package.json (Node.js)
    - requirements.txt (Python)
    - pyproject.toml (Python)
    - pom.xml (Java/Maven)
    - build.gradle (Java/Gradle)
    - composer.json (PHP)
    - Cargo.toml (Rust)
    - go.mod (Go)
    - Gemfile (Ruby)
    """

    def __init__(self):
        self.analyzers = {
            "package.json": self._analyze_package_json,
            "requirements.txt": self._analyze_requirements_txt,
            "pyproject.toml": self._analyze_pyproject_toml,
            "pom.xml": self._analyze_pom_xml,
            "build.gradle": self._analyze_gradle,
            "build.gradle.kts": self._analyze_gradle_kts,
            "composer.json": self._analyze_composer_json,
            "cargo.toml": self._analyze_cargo_toml,
            "go.mod": self._analyze_go_mod,
            "gemfile": self._analyze_gemfile,
            "yarn.lock": self._analyze_yarn_lock,
            "package-lock.json": self._analyze_package_lock,
            "pipfile": self._analyze_pipfile,
        }

    async def analyze_repository(
        self,
        repository_data: Dict[str, Any],
        analysis_types: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze repository dependencies using server-provided repository data

        Args:
            repository_data: Complete repository data from server
            analysis_types: Optional list of specific analysis types to run

        Returns:
            Dict with dependency analysis results for detector consumption
        """
        try:
            logger.info("Starting repository dependency analysis with server data")

            # Extract key files from repository data
            key_files = repository_data.get("key_files", {})

            # Debug logging to understand the data structure
            logger.debug(f"Repository data keys: {list(repository_data.keys())}")
            logger.debug(f"Key files for dependency analysis: {list(key_files.keys())}")
            logger.debug(f"Key files count: {len(key_files)}")

            # Extract stack context if available
            stack_context = repository_data.get("stack_analysis", None)

            # Use existing analyze_dependencies method
            dependency_analysis = await self.analyze_dependencies(
                key_files, stack_context
            )

            # Convert to dictionary format for detector
            return {
                "repository_name": repository_data.get("metadata", {}).get(
                    "full_name", "unknown"
                ),
                "dependencies": {
                    "total_dependencies": dependency_analysis.total_dependencies,
                    "direct_dependencies": dependency_analysis.direct_dependencies,
                    "transitive_dependencies": dependency_analysis.transitive_dependencies,
                    "package_managers": dependency_analysis.package_managers,
                    "vulnerable_packages": [
                        {
                            "name": dep.name,
                            "version": dep.version,
                            "vulnerabilities": getattr(dep, "vulnerabilities", []),
                            "severity": getattr(dep, "severity", "unknown"),
                        }
                        for dep in dependency_analysis.dependencies
                        if getattr(dep, "vulnerabilities", None)
                    ],
                    "outdated_packages": [
                        {
                            "name": dep.name,
                            "current_version": dep.version,
                            "latest_version": getattr(dep, "latest_version", "unknown"),
                        }
                        for dep in dependency_analysis.dependencies
                        if getattr(dep, "is_outdated", False)
                    ],
                },
                "confidence_score": dependency_analysis.confidence_score,
                "confidence_level": self._get_confidence_level(
                    dependency_analysis.confidence_score
                ),
                "dependency_health_score": dependency_analysis.health_score,
                "security_recommendations": self._generate_security_recommendations(
                    dependency_analysis
                ),
                "optimization_suggestions": self._generate_optimization_suggestions(
                    dependency_analysis
                ),
                "analysis_metadata": {
                    "package_files_analyzed": len(
                        [f for f in key_files.keys() if self._is_package_file(f)]
                    ),
                    "data_source": "server_provided",
                },
            }

        except Exception as e:
            logger.error(f"Repository dependency analysis failed: {e}")
            from exceptions import AnalysisException

            raise AnalysisException(f"Dependency analysis failed: {str(e)}")

    def _get_confidence_level(self, confidence: float) -> str:
        """Convert numeric confidence to level string"""
        if confidence >= 0.8:
            return "high"
        elif confidence >= 0.6:
            return "medium"
        else:
            return "low"

    def _generate_security_recommendations(self, analysis) -> List[str]:
        """Generate security recommendations based on analysis"""
        recommendations = []

        vulnerable_count = len(
            [d for d in analysis.dependencies if getattr(d, "vulnerabilities", None)]
        )
        if vulnerable_count > 0:
            recommendations.append(
                f"Update {vulnerable_count} vulnerable packages to latest secure versions"
            )

        if analysis.health_score < 0.7:
            recommendations.append(
                "Review dependency health - consider reducing dependency count"
            )

        return recommendations

    def _generate_optimization_suggestions(self, analysis) -> List[str]:
        """Generate optimization suggestions based on analysis"""
        suggestions = []

        if analysis.total_dependencies > 100:
            suggestions.append(
                "Consider dependency pruning - high dependency count detected"
            )

        outdated_count = len(
            [d for d in analysis.dependencies if getattr(d, "is_outdated", False)]
        )
        if outdated_count > 10:
            suggestions.append(
                f"Update {outdated_count} outdated packages for better performance and security"
            )

        return suggestions

    def _is_package_file(self, filename: str) -> bool:
        """Check if file is a package/dependency file"""
        package_files = [
            "package.json",
            "requirements.txt",
            "pyproject.toml",
            "pom.xml",
            "build.gradle",
            "composer.json",
            "cargo.toml",
            "go.mod",
            "gemfile",
        ]
        return any(pf in filename.lower() for pf in package_files)

    async def analyze_dependencies(
        self, key_files: Dict[str, str], stack_context: Optional[Dict] = None
    ) -> DependencyAnalysis:
        """
        Analyze dependencies from project files with optional stack context

        Args:
            key_files: Dictionary of file paths and their content
            stack_context: Optional stack detection results for better context

        Returns:
            DependencyAnalysis with extracted dependencies
        """
        all_dependencies = []
        package_managers = set()
        vulnerability_count = 0

        # Use stack context to prioritize which files to analyze first
        prioritized_files = self._prioritize_files_by_stack(key_files, stack_context)
        logger.info(
            f"Analyzing {len(prioritized_files)} dependency files with stack context"
        )

        # Analyze each dependency file in priority order
        for file_path, file_data in prioritized_files.items():
            # Handle both string content and object format from server
            if isinstance(file_data, dict):
                content = file_data.get("content", "")
            else:
                content = file_data

            if not content:
                continue

            filename = file_path.split("/")[-1].lower()

            if filename in self.analyzers:
                try:
                    analyzer = self.analyzers[filename]
                    result = await analyzer(content, file_path)

                    if result:
                        all_dependencies.extend(result["dependencies"])
                        package_managers.add(result["package_manager"])
                        vulnerability_count += result.get(
                            "potential_vulnerabilities", 0
                        )

                except Exception as e:
                    logger.debug(f"Failed to analyze {file_path}: {e}")
                    continue

        # Deduplicate dependencies
        unique_dependencies = self._deduplicate_dependencies(all_dependencies)

        # Categorize dependencies
        categorization = self._categorize_dependencies(unique_dependencies)

        # Calculate metrics
        metrics = self._calculate_metrics(unique_dependencies)

        return DependencyAnalysis(
            total_dependencies=len(unique_dependencies),
            direct_dependencies=len(
                [d for d in unique_dependencies if not d.transitive]
            ),
            transitive_dependencies=len(
                [d for d in unique_dependencies if d.transitive]
            ),
            dev_dependencies=len([d for d in unique_dependencies if d.dev_dependency]),
            package_managers=list(package_managers),
            dependencies=unique_dependencies,
            security_vulnerabilities=vulnerability_count,
            outdated_dependencies=0,  # Would require API calls to check
            dependency_categories=categorization,
            metrics=metrics,
            # Add missing required parameters
            total_vulnerabilities=vulnerability_count,
            critical_vulnerabilities=len(
                [v for v in unique_dependencies if v.vulnerability_level == "critical"]
            ),
            high_vulnerabilities=len(
                [v for v in unique_dependencies if v.vulnerability_level == "high"]
            ),
            medium_vulnerabilities=len(
                [v for v in unique_dependencies if v.vulnerability_level == "medium"]
            ),
            low_vulnerabilities=len(
                [v for v in unique_dependencies if v.vulnerability_level == "low"]
            ),
            major_updates_available=0,  # Would require API calls to package registries
            license_issues=0,  # Placeholder, would require license analysis
            incompatible_licenses=[],  # Placeholder, would need license compatibility matrix
            optimization_score=self._calculate_optimization_score(unique_dependencies),
        )

    async def _analyze_package_json(self, content: str, file_path: str) -> Dict:
        """Analyze package.json dependencies"""
        try:
            data = json.loads(content)
            dependencies = []

            # Production dependencies
            for name, version in data.get("dependencies", {}).items():
                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="runtime",
                        dev_dependency=False,
                        package_manager="npm",
                        file_source=file_path,
                    )
                )

            # Development dependencies
            for name, version in data.get("devDependencies", {}).items():
                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="development",
                        dev_dependency=True,
                        package_manager="npm",
                        file_source=file_path,
                    )
                )

            # Peer dependencies
            for name, version in data.get("peerDependencies", {}).items():
                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="peer",
                        dev_dependency=False,
                        package_manager="npm",
                        file_source=file_path,
                    )
                )

            # Optional dependencies
            for name, version in data.get("optionalDependencies", {}).items():
                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="optional",
                        dev_dependency=False,
                        package_manager="npm",
                        file_source=file_path,
                        optional=True,
                    )
                )

            return {
                "dependencies": dependencies,
                "package_manager": "npm",
                "potential_vulnerabilities": self._check_known_vulnerabilities(
                    dependencies
                ),
            }

        except json.JSONDecodeError:
            logger.debug(f"Invalid JSON in {file_path}")
            return None

    async def _analyze_requirements_txt(self, content: str, file_path: str) -> Dict:
        """Analyze requirements.txt dependencies"""
        dependencies = []
        lines = [
            line.strip()
            for line in content.split("\n")
            if line.strip() and not line.startswith("#")
        ]

        for line in lines:
            # Skip -e editable installs and -r includes for now
            if line.startswith(("-e", "-r", "--")):
                continue

            # Parse package name and version
            match = re.match(r"^([a-zA-Z0-9\-_.]+)([><=!]+.*)?", line)
            if match:
                name = match.group(1)
                version_spec = match.group(2) or ""

                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version_spec),
                        type="runtime",
                        dev_dependency=False,
                        package_manager="pip",
                        file_source=file_path,
                    )
                )

        return {
            "dependencies": dependencies,
            "package_manager": "pip",
            "potential_vulnerabilities": self._check_known_vulnerabilities(
                dependencies
            ),
        }

    async def _analyze_pyproject_toml(self, content: str, file_path: str) -> Dict:
        """Analyze pyproject.toml dependencies"""
        dependencies = []

        # Simple regex parsing for dependencies (would be better with toml library)
        dep_pattern = r"dependencies\s*=\s*\[(.*?)\]"

        # Find main dependencies
        dep_match = re.search(dep_pattern, content, re.DOTALL)
        if dep_match:
            deps_str = dep_match.group(1)
            for line in deps_str.split(","):
                line = line.strip().strip("\"'")
                if line:
                    match = re.match(r"^([a-zA-Z0-9\-_.]+)([><=!]+.*)?", line)
                    if match:
                        name = match.group(1)
                        version_spec = match.group(2) or ""

                        dependencies.append(
                            DependencyInfo(
                                name=name,
                                version=self._clean_version(version_spec),
                                type="runtime",
                                dev_dependency=False,
                                package_manager="pip",
                                file_source=file_path,
                            )
                        )

        return {
            "dependencies": dependencies,
            "package_manager": "pip" if "poetry" not in content else "poetry",
            "potential_vulnerabilities": self._check_known_vulnerabilities(
                dependencies
            ),
        }

    async def _analyze_pom_xml(self, content: str, file_path: str) -> Dict:
        """Analyze pom.xml dependencies"""
        dependencies = []

        try:
            root = ET.fromstring(content)
            namespace = {"maven": "http://maven.apache.org/POM/4.0.0"}

            # Find dependencies
            deps = root.findall(".//maven:dependency", namespace) or root.findall(
                ".//dependency"
            )

            for dep in deps:
                group_id = dep.find(".//maven:groupId", namespace) or dep.find(
                    ".//groupId"
                )
                artifact_id = dep.find(".//maven:artifactId", namespace) or dep.find(
                    ".//artifactId"
                )
                version = dep.find(".//maven:version", namespace) or dep.find(
                    ".//version"
                )
                scope = dep.find(".//maven:scope", namespace) or dep.find(".//scope")

                if group_id is not None and artifact_id is not None:
                    name = f"{group_id.text}:{artifact_id.text}"
                    version_text = version.text if version is not None else "unknown"
                    scope_text = scope.text if scope is not None else "compile"

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=version_text,
                            type=scope_text,
                            dev_dependency=scope_text in ["test", "provided"],
                            package_manager="maven",
                            file_source=file_path,
                        )
                    )

            return {
                "dependencies": dependencies,
                "package_manager": "maven",
                "potential_vulnerabilities": self._check_known_vulnerabilities(
                    dependencies
                ),
            }

        except ET.ParseError:
            logger.debug(f"Invalid XML in {file_path}")
            return None

    async def _analyze_gradle(self, content: str, file_path: str) -> Dict:
        """Analyze build.gradle dependencies"""
        dependencies = []

        # Regex to find dependency declarations
        dep_patterns = [
            r"implementation\s+['\"]([^'\"]+)['\"]",
            r"compile\s+['\"]([^'\"]+)['\"]",
            r"testImplementation\s+['\"]([^'\"]+)['\"]",
            r"runtimeOnly\s+['\"]([^'\"]+)['\"]",
            r"api\s+['\"]([^'\"]+)['\"]",
        ]

        for pattern in dep_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                # Parse group:artifact:version format
                parts = match.split(":")
                if len(parts) >= 2:
                    name = f"{parts[0]}:{parts[1]}"
                    version = parts[2] if len(parts) > 2 else "unknown"

                    dep_type = "runtime"
                    is_dev = "test" in pattern.lower()

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=version,
                            type=dep_type,
                            dev_dependency=is_dev,
                            package_manager="gradle",
                            file_source=file_path,
                        )
                    )

        return {
            "dependencies": dependencies,
            "package_manager": "gradle",
            "potential_vulnerabilities": self._check_known_vulnerabilities(
                dependencies
            ),
        }

    async def _analyze_gradle_kts(self, content: str, file_path: str) -> Dict:
        """Analyze build.gradle.kts (Kotlin DSL) dependencies"""
        # Similar to Gradle but with Kotlin syntax
        return await self._analyze_gradle(content, file_path)

    async def _analyze_composer_json(self, content: str, file_path: str) -> Dict:
        """Analyze composer.json dependencies"""
        try:
            data = json.loads(content)
            dependencies = []

            # Production dependencies
            for name, version in data.get("require", {}).items():
                # Skip PHP version requirement
                if name == "php":
                    continue

                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="runtime",
                        dev_dependency=False,
                        package_manager="composer",
                        file_source=file_path,
                    )
                )

            # Development dependencies
            for name, version in data.get("require-dev", {}).items():
                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="development",
                        dev_dependency=True,
                        package_manager="composer",
                        file_source=file_path,
                    )
                )

            return {
                "dependencies": dependencies,
                "package_manager": "composer",
                "potential_vulnerabilities": self._check_known_vulnerabilities(
                    dependencies
                ),
            }

        except json.JSONDecodeError:
            logger.debug(f"Invalid JSON in {file_path}")
            return None

    async def _analyze_cargo_toml(self, content: str, file_path: str) -> Dict:
        """Analyze Cargo.toml dependencies"""
        dependencies = []

        # Simple regex parsing for [dependencies] section
        deps_section = re.search(r"\[dependencies\](.*?)(?=\[|\Z)", content, re.DOTALL)
        if deps_section:
            for line in deps_section.group(1).split("\n"):
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    name = parts[0].strip()
                    version_info = parts[1].strip().strip("\"'")

                    # Handle version specifications
                    if version_info.startswith("{"):
                        # Complex version spec like { version = "1.0", features = [...] }
                        version_match = re.search(
                            r'version\s*=\s*["\']([^"\']+)["\']', version_info
                        )
                        version = version_match.group(1) if version_match else "unknown"
                    else:
                        # Simple version like "1.0"
                        version = version_info

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=version,
                            type="runtime",
                            dev_dependency=False,
                            package_manager="cargo",
                            file_source=file_path,
                        )
                    )

        # Check for dev-dependencies
        dev_deps_section = re.search(
            r"\[dev-dependencies\](.*?)(?=\[|\Z)", content, re.DOTALL
        )
        if dev_deps_section:
            for line in dev_deps_section.group(1).split("\n"):
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    name = parts[0].strip()
                    version = parts[1].strip().strip("\"'")

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=version,
                            type="development",
                            dev_dependency=True,
                            package_manager="cargo",
                            file_source=file_path,
                        )
                    )

        return {
            "dependencies": dependencies,
            "package_manager": "cargo",
            "potential_vulnerabilities": self._check_known_vulnerabilities(
                dependencies
            ),
        }

    async def _analyze_go_mod(self, content: str, file_path: str) -> Dict:
        """Analyze go.mod dependencies"""
        dependencies = []

        lines = content.split("\n")
        in_require_block = False

        for line in lines:
            line = line.strip()

            if line.startswith("require ("):
                in_require_block = True
                continue
            elif line == ")" and in_require_block:
                in_require_block = False
                continue
            elif line.startswith("require ") and not in_require_block:
                # Single require line
                parts = line.split()[1:]  # Skip 'require'
                if len(parts) >= 2:
                    name = parts[0]
                    version = parts[1]

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=version,
                            type="runtime",
                            dev_dependency=False,
                            package_manager="go",
                            file_source=file_path,
                        )
                    )
            elif in_require_block and line and not line.startswith("//"):
                # Inside require block
                parts = line.split()
                if len(parts) >= 2:
                    name = parts[0]
                    version = parts[1]

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=version,
                            type="runtime",
                            dev_dependency=False,
                            package_manager="go",
                            file_source=file_path,
                        )
                    )

        return {
            "dependencies": dependencies,
            "package_manager": "go",
            "potential_vulnerabilities": self._check_known_vulnerabilities(
                dependencies
            ),
        }

    async def _analyze_gemfile(self, content: str, file_path: str) -> Dict:
        """Analyze Gemfile dependencies"""
        dependencies = []

        lines = content.split("\n")
        current_group = None

        for line in lines:
            line = line.strip()

            # Skip comments and empty lines
            if not line or line.startswith("#"):
                continue

            # Handle gem declarations
            gem_match = re.match(
                r"gem\s+['\"]([^'\"]+)['\"](?:,\s*['\"]([^'\"]+)['\"])?", line
            )
            if gem_match:
                name = gem_match.group(1)
                version = gem_match.group(2) or "unknown"

                # Check if in development group
                is_dev = current_group in ["development", "test"]

                dependencies.append(
                    DependencyInfo(
                        name=name,
                        version=self._clean_version(version),
                        type="runtime" if not is_dev else "development",
                        dev_dependency=is_dev,
                        package_manager="bundler",
                        file_source=file_path,
                    )
                )

            # Track groups
            group_match = re.match(r"group\s+:(\w+)", line)
            if group_match:
                current_group = group_match.group(1)
            elif line == "end":
                current_group = None

        return {
            "dependencies": dependencies,
            "package_manager": "bundler",
            "potential_vulnerabilities": self._check_known_vulnerabilities(
                dependencies
            ),
        }

    async def _analyze_yarn_lock(self, content: str, file_path: str) -> Dict:
        """Analyze yarn.lock for lockfile information"""
        # For now, just detect yarn as package manager
        return {
            "dependencies": [],
            "package_manager": "yarn",
            "potential_vulnerabilities": 0,
        }

    async def _analyze_package_lock(self, content: str, file_path: str) -> Dict:
        """Analyze package-lock.json for lockfile information"""
        # For now, just detect npm as package manager
        return {
            "dependencies": [],
            "package_manager": "npm",
            "potential_vulnerabilities": 0,
        }

    async def _analyze_pipfile(self, content: str, file_path: str) -> Dict:
        """Analyze Pipfile dependencies"""
        dependencies = []

        # Simple parsing for [packages] and [dev-packages] sections
        packages_section = re.search(r"\[packages\](.*?)(?=\[|\Z)", content, re.DOTALL)
        if packages_section:
            for line in packages_section.group(1).split("\n"):
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    name = line.split("=")[0].strip()
                    version_info = line.split("=")[1].strip().strip("\"'")

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=self._clean_version(version_info),
                            type="runtime",
                            dev_dependency=False,
                            package_manager="pipenv",
                            file_source=file_path,
                        )
                    )

        # Dev packages
        dev_packages_section = re.search(
            r"\[dev-packages\](.*?)(?=\[|\Z)", content, re.DOTALL
        )
        if dev_packages_section:
            for line in dev_packages_section.group(1).split("\n"):
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    name = line.split("=")[0].strip()
                    version_info = line.split("=")[1].strip().strip("\"'")

                    dependencies.append(
                        DependencyInfo(
                            name=name,
                            version=self._clean_version(version_info),
                            type="development",
                            dev_dependency=True,
                            package_manager="pipenv",
                            file_source=file_path,
                        )
                    )

        return {
            "dependencies": dependencies,
            "package_manager": "pipenv",
            "potential_vulnerabilities": self._check_known_vulnerabilities(
                dependencies
            ),
        }

    async def analyze(self, repository_data: dict, **kwargs):
        """Standard interface for orchestrator. Calls main dependency analysis logic."""
        # Extract key_files from repository_data for dependency analysis
        key_files = repository_data.get("key_files", {})

        # Extract stack context for better analysis
        stack_context = repository_data.get("stack_context")
        if stack_context:
            logger.info(
                f"Using stack context for dependency analysis: {stack_context.get('language', 'unknown')} / {stack_context.get('framework', 'none')}"
            )

        # Perform dependency analysis with stack context
        analysis_result = await self.analyze_dependencies(key_files, stack_context)

        # Convert to dict format for orchestrator compatibility
        if hasattr(analysis_result, "__dict__"):
            result_dict = analysis_result.__dict__
        else:
            result_dict = analysis_result

        # Add confidence score
        confidence = self._calculate_confidence(analysis_result)
        result_dict["confidence"] = confidence

        # Add detected files for orchestrator
        result_dict["detected_files"] = list(key_files.keys())

        # DO NOT add recommendations and suggestions - only LLM should generate them
        # Removed hardcoded recommendations/suggestions to avoid repetitive outputs

        return result_dict

    async def get_supported_ecosystems(self) -> List[str]:
        """Get list of supported package manager ecosystems"""
        return [
            "npm",
            "yarn",
            "pip",
            "pipenv",
            "poetry",
            "maven",
            "gradle",
            "composer",
            "cargo",
            "go",
            "bundler",
            "nuget",
        ]

    def _calculate_confidence(self, analysis_result: DependencyAnalysis) -> float:
        """Calculate confidence score for dependency analysis"""
        if analysis_result.total_dependencies == 0:
            return 0.0

        confidence = 0.5  # Base confidence

        # Boost for having multiple package managers detected
        if len(analysis_result.package_managers) > 0:
            confidence += 0.3  # Boost for having version information
        if analysis_result.metrics.get("version_specification_quality", 0) > 0.7:
            confidence += 0.2

        return min(confidence, 1.0)

    # REMOVED: _generate_recommendations and _generate_suggestions methods
    # Only LLM enhancer should generate recommendations and suggestions
    # This prevents hardcoded, repetitive outputs

    def _clean_version(self, version: str) -> str:
        """Clean version string by removing operators and whitespace"""
        if not version:
            return "unknown"

        # Remove common version operators
        cleaned = re.sub(r"^[><=!~^]*\s*", "", version)
        cleaned = cleaned.strip().strip("\"'")

        return cleaned if cleaned else "unknown"

    def _deduplicate_dependencies(
        self, dependencies: List[DependencyInfo]
    ) -> List[DependencyInfo]:
        """Remove duplicate dependencies, keeping the one with most information"""
        unique_deps = {}

        for dep in dependencies:
            key = f"{dep.name}:{dep.package_manager}"

            if key not in unique_deps:
                unique_deps[key] = dep
            else:
                # Keep the one with more specific version or additional info
                existing = unique_deps[key]
                if (dep.version != "unknown" and existing.version == "unknown") or (
                    len(dep.version) > len(existing.version)
                ):
                    unique_deps[key] = dep

        return list(unique_deps.values())

    def _categorize_dependencies(
        self, dependencies: List[DependencyInfo]
    ) -> Dict[str, List[str]]:
        """Categorize dependencies by type/purpose"""
        categories = {
            "frameworks": [],
            "databases": [],
            "testing": [],
            "build_tools": [],
            "ui_libraries": [],
            "utilities": [],
            "other": [],
        }

        # Known package categories
        framework_packages = {
            "react",
            "vue",
            "angular",
            "next",
            "nuxt",
            "gatsby",
            "svelte",
            "django",
            "flask",
            "fastapi",
            "express",
            "koa",
            "nest",
            "spring",
            "laravel",
            "rails",
            "sinatra",
        }

        database_packages = {
            "mysql",
            "postgresql",
            "mongodb",
            "redis",
            "sqlite",
            "psycopg2",
            "pymongo",
            "mysql-connector",
            "sequelize",
            "hibernate",
            "doctrine",
            "activerecord",
        }

        testing_packages = {
            "jest",
            "mocha",
            "chai",
            "cypress",
            "playwright",
            "selenium",
            "pytest",
            "unittest",
            "nose",
            "junit",
            "testng",
            "phpunit",
            "rspec",
            "minitest",
        }

        build_packages = {
            "webpack",
            "vite",
            "rollup",
            "parcel",
            "esbuild",
            "babel",
            "typescript",
            "sass",
            "less",
            "postcss",
        }

        ui_packages = {
            "bootstrap",
            "tailwindcss",
            "material-ui",
            "ant-design",
            "chakra-ui",
            "semantic-ui",
            "bulma",
            "foundation",
        }

        for dep in dependencies:
            name_lower = dep.name.lower()

            if any(fw in name_lower for fw in framework_packages):
                categories["frameworks"].append(dep.name)
            elif any(db in name_lower for db in database_packages):
                categories["databases"].append(dep.name)
            elif any(test in name_lower for test in testing_packages):
                categories["testing"].append(dep.name)
            elif any(build in name_lower for build in build_packages):
                categories["build_tools"].append(dep.name)
            elif any(ui in name_lower for ui in ui_packages):
                categories["ui_libraries"].append(dep.name)
            elif len(name_lower) > 20 or "util" in name_lower or "helper" in name_lower:
                categories["utilities"].append(dep.name)
            else:
                categories["other"].append(dep.name)

        return categories

    def _calculate_metrics(self, dependencies: List[DependencyInfo]) -> Dict[str, Any]:
        """Calculate dependency metrics"""
        total = len(dependencies)

        if total == 0:
            return {}

        dev_deps = len([d for d in dependencies if d.dev_dependency])
        runtime_deps = total - dev_deps

        # Package manager distribution
        pm_counts = {}
        for dep in dependencies:
            pm_counts[dep.package_manager] = pm_counts.get(dep.package_manager, 0) + 1

        # Version specification quality
        versioned_deps = len([d for d in dependencies if d.version != "unknown"])
        version_quality = versioned_deps / total if total > 0 else 0

        return {
            "total_dependencies": total,
            "runtime_dependencies": runtime_deps,
            "dev_dependencies": dev_deps,
            "dev_ratio": dev_deps / total,
            "package_manager_distribution": pm_counts,
            "version_specification_quality": version_quality,
            "average_name_length": sum(len(d.name) for d in dependencies) / total,
        }

    def _check_known_vulnerabilities(self, dependencies: List[DependencyInfo]) -> int:
        """Check for known vulnerable packages (simplified)"""
        # This is a simplified check - in production would use vulnerability databases
        known_vulnerable = {
            "lodash": "high",
            "moment": "medium",
            "jquery": "medium",
            "handlebars": "high",
            "marked": "low",
            "debug": "low",
            "ms": "low",
            "mime": "medium",
            "send": "high",
            "serve-static": "high",
        }

        vulnerable_count = 0
        for dep in dependencies:
            for vuln, level in known_vulnerable.items():
                if vuln in dep.name.lower():
                    dep.vulnerability_level = level
                    vulnerable_count += 1

        return vulnerable_count

    def _calculate_optimization_score(
        self, dependencies: List[DependencyInfo]
    ) -> float:
        """
        Calculate an optimization score for dependencies (0.0-1.0)
        Higher score means more optimized dependencies

        Logic:
        - Direct dependencies should be minimal (fewer is better)
        - Dev dependencies should be properly separated
        - Dependencies with vulnerabilities reduce score
        - Dependencies with proper version pinning increase score
        """
        if not dependencies:
            return 1.0  # No dependencies means perfect optimization

        # Base score
        score = 0.75

        # Adjust based on number of direct dependencies (penalize > 25 deps)
        direct_deps = len([d for d in dependencies if not d.transitive])
        if direct_deps > 25:
            score -= min(0.2, (direct_deps - 25) * 0.01)

        # Penalize for vulnerabilities
        vuln_count = len([d for d in dependencies if d.vulnerability_level])
        if vuln_count > 0:
            score -= min(0.3, vuln_count * 0.05)

        # Reward for proper dev dependency separation
        dev_deps = len([d for d in dependencies if d.dev_dependency])
        if dev_deps > 0 and direct_deps > 0:
            score += min(0.1, dev_deps / direct_deps * 0.1)

        # Clamp to valid range
        return max(0.0, min(1.0, score))

    def _prioritize_files_by_stack(
        self, key_files: Dict[str, str], stack_context: Optional[Dict] = None
    ) -> Dict[str, str]:
        """Prioritize dependency files based on detected stack"""
        if not stack_context:
            return key_files

        language = stack_context.get("language", "").lower()
        framework = stack_context.get("framework", "").lower()

        # Define priority order based on stack
        priority_files = []

        # JavaScript/TypeScript ecosystem
        if language in ["javascript", "typescript"]:
            priority_files = ["package.json", "yarn.lock", "package-lock.json"]
        # Python ecosystem
        elif language == "python":
            if framework == "django":
                priority_files = ["requirements.txt", "pyproject.toml", "pipfile"]
            else:
                priority_files = ["pyproject.toml", "requirements.txt", "pipfile"]
        # Java ecosystem
        elif language in ["java", "kotlin"]:
            priority_files = ["pom.xml", "build.gradle", "build.gradle.kts"]
        # Other languages
        elif language == "php":
            priority_files = ["composer.json"]
        elif language == "rust":
            priority_files = ["cargo.toml"]
        elif language == "go":
            priority_files = ["go.mod"]
        elif language == "ruby":
            priority_files = ["gemfile"]

        # Reorder files by priority
        prioritized = {}

        # Add high-priority files first
        for priority_file in priority_files:
            for file_path, content in key_files.items():
                if priority_file in file_path.lower():
                    prioritized[file_path] = content

        # Add remaining files
        for file_path, content in key_files.items():
            if file_path not in prioritized:
                prioritized[file_path] = content

        logger.info(f"Prioritized {len(prioritized)} files for {language} stack")
        return prioritized
