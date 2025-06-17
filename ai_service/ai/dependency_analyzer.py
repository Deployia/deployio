"""
AI-Powered Dependency Analysis Engine
"""

import re
import logging
import json
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field
import aiohttp
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


@dataclass
class Dependency:
    """Represents a project dependency"""

    name: str
    version: Optional[str] = None
    type: str = "production"  # production, development, optional
    ecosystem: str = "npm"  # npm, pip, maven, etc.
    source: str = ""  # file where dependency was found
    vulnerabilities: List[Dict] = field(default_factory=list)
    license: Optional[str] = None
    size: Optional[int] = None


@dataclass
class DependencyTree:
    """Represents the complete dependency tree"""

    direct_dependencies: List[Dependency] = field(default_factory=list)
    dev_dependencies: List[Dependency] = field(default_factory=list)
    peer_dependencies: List[Dependency] = field(default_factory=list)
    total_count: int = 0
    ecosystems: Set[str] = field(default_factory=set)


@dataclass
class SecurityIssue:
    """Represents a security vulnerability"""

    cve_id: Optional[str] = None
    severity: str = "unknown"  # low, medium, high, critical
    title: str = ""
    description: str = ""
    affected_dependency: str = ""
    fixed_version: Optional[str] = None


@dataclass
class DependencyAnalysis:
    """Complete dependency analysis result"""

    dependency_tree: DependencyTree
    security_issues: List[SecurityIssue] = field(default_factory=list)
    outdated_packages: List[Dict] = field(default_factory=list)
    license_issues: List[Dict] = field(default_factory=list)
    optimization_score: float = 0.0
    recommendations: List[Dict] = field(default_factory=list)


class DependencyAnalyzer:
    """Advanced dependency analysis engine"""

    def __init__(self):
        self.parsers = {
            "package.json": self._parse_package_json,
            "requirements.txt": self._parse_requirements_txt,
            "pyproject.toml": self._parse_pyproject_toml,
            "pom.xml": self._parse_pom_xml,
            "build.gradle": self._parse_build_gradle,
            "Gemfile": self._parse_gemfile,
            "go.mod": self._parse_go_mod,
            "Cargo.toml": self._parse_cargo_toml,
        }

        # Known vulnerability database (simplified - in production use external APIs)
        self.vulnerability_db = self._load_vulnerability_db()

    def _load_vulnerability_db(self) -> Dict:
        """Load simplified vulnerability database"""
        return {
            "lodash": {
                "4.17.15": {
                    "cve": "CVE-2020-8203",
                    "severity": "high",
                    "title": "Prototype Pollution",
                    "description": "Prototype pollution vulnerability in lodash",
                    "fixed_version": "4.17.21",
                }
            },
            "axios": {
                "0.19.0": {
                    "cve": "CVE-2021-3749",
                    "severity": "medium",
                    "title": "Server-Side Request Forgery",
                    "description": "SSRF vulnerability in axios",
                    "fixed_version": "0.21.2",
                }
            },
            "django": {
                "3.0.0": {
                    "cve": "CVE-2021-35042",
                    "severity": "critical",
                    "title": "SQL Injection",
                    "description": "SQL injection vulnerability in Django ORM",
                    "fixed_version": "3.2.13",
                }
            },
        }

    async def analyze_dependencies(
        self, repo_url: str, branch: str = "main"
    ) -> DependencyAnalysis:
        """
        Comprehensive dependency analysis for a repository
        """
        try:
            # Fetch dependency files from repository
            dependency_files = await self._fetch_dependency_files(repo_url, branch)

            # Parse all dependency files
            dependency_tree = await self._parse_all_dependencies(dependency_files)

            # Analyze security vulnerabilities
            security_issues = await self._analyze_security_vulnerabilities(
                dependency_tree
            )

            # Check for outdated packages
            outdated_packages = await self._check_outdated_packages(dependency_tree)

            # Analyze license compatibility
            license_issues = await self._analyze_license_compatibility(dependency_tree)

            # Calculate optimization score
            optimization_score = self._calculate_optimization_score(
                dependency_tree, security_issues, outdated_packages
            )

            # Generate recommendations
            recommendations = self._generate_dependency_recommendations(
                dependency_tree, security_issues, outdated_packages, license_issues
            )

            logger.info(
                f"Dependency analysis completed for {repo_url}: {dependency_tree.total_count} dependencies"
            )

            return DependencyAnalysis(
                dependency_tree=dependency_tree,
                security_issues=security_issues,
                outdated_packages=outdated_packages,
                license_issues=license_issues,
                optimization_score=optimization_score,
                recommendations=recommendations,
            )

        except Exception as e:
            logger.error(f"Dependency analysis failed for {repo_url}: {e}")
            return DependencyAnalysis(dependency_tree=DependencyTree())

    async def _fetch_dependency_files(
        self, repo_url: str, branch: str
    ) -> Dict[str, str]:
        """Fetch dependency configuration files from repository"""
        # Extract owner and repo from URL
        parsed_url = urlparse(repo_url)
        path_parts = parsed_url.path.strip("/").split("/")
        if len(path_parts) < 2:
            raise ValueError("Invalid GitHub repository URL")

        owner, repo = path_parts[0], path_parts[1]

        dependency_files = {}

        # List of dependency files to fetch
        files_to_fetch = [
            "package.json",
            "package-lock.json",
            "yarn.lock",
            "requirements.txt",
            "pyproject.toml",
            "Pipfile",
            "poetry.lock",
            "pom.xml",
            "build.gradle",
            "gradle.lockfile",
            "Gemfile",
            "Gemfile.lock",
            "go.mod",
            "go.sum",
            "Cargo.toml",
            "Cargo.lock",
        ]

        async with aiohttp.ClientSession() as session:
            for filename in files_to_fetch:
                try:
                    file_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{filename}"
                    async with session.get(file_url) as response:
                        if response.status == 200:
                            content = await response.text()
                            dependency_files[filename] = content
                            logger.debug(f"Fetched {filename} from {repo_url}")
                except Exception as e:
                    logger.debug(f"Could not fetch {filename}: {e}")
                    continue

        return dependency_files

    async def _parse_all_dependencies(
        self, dependency_files: Dict[str, str]
    ) -> DependencyTree:
        """Parse all dependency files and build dependency tree"""
        tree = DependencyTree()

        for filename, content in dependency_files.items():
            if filename in self.parsers:
                try:
                    parser = self.parsers[filename]
                    parsed_deps = await parser(content, filename)

                    # Merge dependencies into tree
                    if "production" in parsed_deps:
                        tree.direct_dependencies.extend(parsed_deps["production"])
                    if "development" in parsed_deps:
                        tree.dev_dependencies.extend(parsed_deps["development"])
                    if "peer" in parsed_deps:
                        tree.peer_dependencies.extend(parsed_deps["peer"])

                    # Track ecosystems
                    if parsed_deps.get("ecosystem"):
                        tree.ecosystems.add(parsed_deps["ecosystem"])

                except Exception as e:
                    logger.error(f"Failed to parse {filename}: {e}")

        # Calculate totals
        tree.total_count = (
            len(tree.direct_dependencies)
            + len(tree.dev_dependencies)
            + len(tree.peer_dependencies)
        )

        return tree

    async def _parse_package_json(self, content: str, source: str) -> Dict:
        """Parse package.json file"""
        try:
            data = json.loads(content)
            dependencies = []
            dev_dependencies = []
            peer_dependencies = []

            # Parse production dependencies
            if "dependencies" in data:
                for name, version in data["dependencies"].items():
                    dependencies.append(
                        Dependency(
                            name=name,
                            version=version,
                            type="production",
                            ecosystem="npm",
                            source=source,
                        )
                    )

            # Parse dev dependencies
            if "devDependencies" in data:
                for name, version in data["devDependencies"].items():
                    dev_dependencies.append(
                        Dependency(
                            name=name,
                            version=version,
                            type="development",
                            ecosystem="npm",
                            source=source,
                        )
                    )

            # Parse peer dependencies
            if "peerDependencies" in data:
                for name, version in data["peerDependencies"].items():
                    peer_dependencies.append(
                        Dependency(
                            name=name,
                            version=version,
                            type="peer",
                            ecosystem="npm",
                            source=source,
                        )
                    )

            return {
                "production": dependencies,
                "development": dev_dependencies,
                "peer": peer_dependencies,
                "ecosystem": "npm",
            }

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {source}: {e}")
            return {"production": [], "development": [], "peer": []}

    async def _parse_requirements_txt(self, content: str, source: str) -> Dict:
        """Parse requirements.txt file"""
        dependencies = []

        for line in content.split("\n"):
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Parse dependency specification
            match = re.match(r"^([a-zA-Z0-9\-_\.]+)([><=!]+)?([0-9\.\*]+)?", line)
            if match:
                name = match.group(1)
                version = match.group(3) if match.group(3) else None

                dependencies.append(
                    Dependency(
                        name=name,
                        version=version,
                        type="production",
                        ecosystem="pip",
                        source=source,
                    )
                )

        return {
            "production": dependencies,
            "development": [],
            "peer": [],
            "ecosystem": "pip",
        }

    async def _parse_pyproject_toml(self, content: str, source: str) -> Dict:
        """Parse pyproject.toml file (simplified TOML parsing)"""
        dependencies = []
        dev_dependencies = []

        lines = content.split("\n")
        current_section = None

        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Check for sections
            if line == "[tool.poetry.dependencies]":
                current_section = "dependencies"
                continue
            elif line == "[tool.poetry.dev-dependencies]":
                current_section = "dev-dependencies"
                continue
            elif line.startswith("["):
                current_section = None
                continue

            # Parse dependencies in current section
            if current_section and "=" in line:
                parts = line.split("=", 1)
                if len(parts) == 2:
                    name = parts[0].strip().strip('"')
                    version_part = parts[1].strip().strip('"')

                    # Extract version from various formats
                    version = None
                    if version_part.startswith("^") or version_part.startswith("~"):
                        version = version_part[1:]
                    elif re.match(r"^[0-9]", version_part):
                        version = version_part

                    dep = Dependency(
                        name=name,
                        version=version,
                        type=(
                            "production"
                            if current_section == "dependencies"
                            else "development"
                        ),
                        ecosystem="pip",
                        source=source,
                    )

                    if current_section == "dependencies":
                        dependencies.append(dep)
                    else:
                        dev_dependencies.append(dep)

        return {
            "production": dependencies,
            "development": dev_dependencies,
            "peer": [],
            "ecosystem": "pip",
        }

    async def _parse_pom_xml(self, content: str, source: str) -> Dict:
        """Parse Maven pom.xml file (simplified XML parsing)"""
        dependencies = []

        # Simple regex-based parsing (in production, use proper XML parser)
        dependency_pattern = r"<dependency>.*?<groupId>(.*?)</groupId>.*?<artifactId>(.*?)</artifactId>.*?<version>(.*?)</version>.*?</dependency>"

        matches = re.findall(dependency_pattern, content, re.DOTALL)

        for group_id, artifact_id, version in matches:
            dependencies.append(
                Dependency(
                    name=f"{group_id.strip()}:{artifact_id.strip()}",
                    version=version.strip(),
                    type="production",
                    ecosystem="maven",
                    source=source,
                )
            )

        return {
            "production": dependencies,
            "development": [],
            "peer": [],
            "ecosystem": "maven",
        }

    async def _parse_build_gradle(self, content: str, source: str) -> Dict:
        """Parse Gradle build.gradle file"""
        dependencies = []
        dev_dependencies = []

        # Parse implementation and testImplementation dependencies
        impl_pattern = r'implementation\s+["\']([^:]+):([^:]+):([^"\']+)["\']'
        test_pattern = r'testImplementation\s+["\']([^:]+):([^:]+):([^"\']+)["\']'

        # Production dependencies
        impl_matches = re.findall(impl_pattern, content)
        for group_id, artifact_id, version in impl_matches:
            dependencies.append(
                Dependency(
                    name=f"{group_id}:{artifact_id}",
                    version=version,
                    type="production",
                    ecosystem="gradle",
                    source=source,
                )
            )

        # Test dependencies
        test_matches = re.findall(test_pattern, content)
        for group_id, artifact_id, version in test_matches:
            dev_dependencies.append(
                Dependency(
                    name=f"{group_id}:{artifact_id}",
                    version=version,
                    type="development",
                    ecosystem="gradle",
                    source=source,
                )
            )

        return {
            "production": dependencies,
            "development": dev_dependencies,
            "peer": [],
            "ecosystem": "gradle",
        }

    async def _parse_gemfile(self, content: str, source: str) -> Dict:
        """Parse Ruby Gemfile"""
        dependencies = []
        dev_dependencies = []

        lines = content.split("\n")
        current_group = "production"

        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Check for group blocks
            if line.startswith("group"):
                if "development" in line or "test" in line:
                    current_group = "development"
                else:
                    current_group = "production"
                continue
            elif line == "end":
                current_group = "production"
                continue

            # Parse gem declarations
            gem_match = re.match(
                r'gem\s+["\']([^"\']+)["\'](?:\s*,\s*["\']([^"\']+)["\'])?', line
            )
            if gem_match:
                name = gem_match.group(1)
                version = gem_match.group(2) if gem_match.group(2) else None

                dep = Dependency(
                    name=name,
                    version=version,
                    type=current_group,
                    ecosystem="bundler",
                    source=source,
                )

                if current_group == "development":
                    dev_dependencies.append(dep)
                else:
                    dependencies.append(dep)

        return {
            "production": dependencies,
            "development": dev_dependencies,
            "peer": [],
            "ecosystem": "bundler",
        }

    async def _parse_go_mod(self, content: str, source: str) -> Dict:
        """Parse Go go.mod file"""
        dependencies = []

        lines = content.split("\n")
        in_require_block = False

        for line in lines:
            line = line.strip()
            if not line or line.startswith("//"):
                continue

            if line.startswith("require ("):
                in_require_block = True
                continue
            elif line == ")" and in_require_block:
                in_require_block = False
                continue

            # Parse require statements
            if in_require_block or line.startswith("require "):
                # Remove 'require ' prefix if present
                if line.startswith("require "):
                    line = line[8:].strip()

                parts = line.split()
                if len(parts) >= 2:
                    name = parts[0]
                    version = parts[1]

                    dependencies.append(
                        Dependency(
                            name=name,
                            version=version,
                            type="production",
                            ecosystem="go",
                            source=source,
                        )
                    )

        return {
            "production": dependencies,
            "development": [],
            "peer": [],
            "ecosystem": "go",
        }

    async def _parse_cargo_toml(self, content: str, source: str) -> Dict:
        """Parse Rust Cargo.toml file"""
        dependencies = []
        dev_dependencies = []

        lines = content.split("\n")
        current_section = None

        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Check for sections
            if line == "[dependencies]":
                current_section = "dependencies"
                continue
            elif line == "[dev-dependencies]":
                current_section = "dev-dependencies"
                continue
            elif line.startswith("["):
                current_section = None
                continue

            # Parse dependencies in current section
            if current_section and "=" in line:
                parts = line.split("=", 1)
                if len(parts) == 2:
                    name = parts[0].strip()
                    version_part = parts[1].strip().strip('"')

                    dep = Dependency(
                        name=name,
                        version=version_part,
                        type=(
                            "production"
                            if current_section == "dependencies"
                            else "development"
                        ),
                        ecosystem="cargo",
                        source=source,
                    )

                    if current_section == "dependencies":
                        dependencies.append(dep)
                    else:
                        dev_dependencies.append(dep)

        return {
            "production": dependencies,
            "development": dev_dependencies,
            "peer": [],
            "ecosystem": "cargo",
        }

    async def _analyze_security_vulnerabilities(
        self, tree: DependencyTree
    ) -> List[SecurityIssue]:
        """Analyze dependencies for security vulnerabilities"""
        security_issues = []

        all_deps = (
            tree.direct_dependencies + tree.dev_dependencies + tree.peer_dependencies
        )

        for dep in all_deps:
            if dep.name in self.vulnerability_db:
                vuln_data = self.vulnerability_db[dep.name]

                if dep.version and dep.version in vuln_data:
                    vuln_info = vuln_data[dep.version]

                    security_issues.append(
                        SecurityIssue(
                            cve_id=vuln_info.get("cve"),
                            severity=vuln_info.get("severity", "unknown"),
                            title=vuln_info.get("title", "Security vulnerability"),
                            description=vuln_info.get("description", ""),
                            affected_dependency=dep.name,
                            fixed_version=vuln_info.get("fixed_version"),
                        )
                    )

        return security_issues

    async def _check_outdated_packages(self, tree: DependencyTree) -> List[Dict]:
        """Check for outdated packages (simplified implementation)"""
        outdated_packages = []

        # In production, this would query package registries for latest versions
        # For now, we'll simulate some outdated packages
        outdated_patterns = {
            "react": {"current": "16.14.0", "latest": "18.2.0"},
            "lodash": {"current": "4.17.15", "latest": "4.17.21"},
            "axios": {"current": "0.19.0", "latest": "1.3.4"},
        }

        all_deps = tree.direct_dependencies + tree.dev_dependencies

        for dep in all_deps:
            if dep.name in outdated_patterns:
                pattern = outdated_patterns[dep.name]
                if dep.version == pattern["current"]:
                    outdated_packages.append(
                        {
                            "name": dep.name,
                            "current_version": dep.version,
                            "latest_version": pattern["latest"],
                            "type": dep.type,
                            "ecosystem": dep.ecosystem,
                        }
                    )

        return outdated_packages

    async def _analyze_license_compatibility(self, tree: DependencyTree) -> List[Dict]:
        """Analyze license compatibility issues"""
        license_issues = []

        # Simplified license compatibility check
        # In production, this would use a comprehensive license database
        all_deps = tree.direct_dependencies + tree.dev_dependencies

        for dep in all_deps:
            # Simulate license detection (in production, query package registries)
            if dep.name == "some-gpl-package":
                license_issues.append(
                    {
                        "dependency": dep.name,
                        "license": "GPL-3.0",
                        "issue": "GPL license may require source code disclosure",
                        "severity": "high",
                    }
                )

        return license_issues

    def _calculate_optimization_score(
        self,
        tree: DependencyTree,
        security_issues: List[SecurityIssue],
        outdated_packages: List[Dict],
    ) -> float:
        """Calculate overall dependency optimization score (0-100)"""
        score = 100.0

        # Penalize security issues
        critical_count = sum(
            1 for issue in security_issues if issue.severity == "critical"
        )
        high_count = sum(1 for issue in security_issues if issue.severity == "high")
        medium_count = sum(1 for issue in security_issues if issue.severity == "medium")

        score -= (critical_count * 25) + (high_count * 15) + (medium_count * 5)

        # Penalize outdated packages
        score -= len(outdated_packages) * 2

        # Penalize excessive dependencies
        if tree.total_count > 100:
            score -= (tree.total_count - 100) * 0.5

        return max(0.0, min(100.0, score))

    def _generate_dependency_recommendations(
        self,
        tree: DependencyTree,
        security_issues: List[SecurityIssue],
        outdated_packages: List[Dict],
        license_issues: List[Dict],
    ) -> List[Dict]:
        """Generate dependency optimization recommendations"""
        recommendations = []

        # Security recommendations
        if security_issues:
            critical_issues = [
                issue for issue in security_issues if issue.severity == "critical"
            ]
            if critical_issues:
                recommendations.append(
                    {
                        "type": "security",
                        "priority": "critical",
                        "title": "Critical Security Vulnerabilities",
                        "description": f"Fix {len(critical_issues)} critical security vulnerabilities immediately.",
                        "actions": [
                            f"Update {issue.affected_dependency} to {issue.fixed_version}"
                            for issue in critical_issues
                            if issue.fixed_version
                        ],
                    }
                )

        # Update recommendations
        if outdated_packages:
            recommendations.append(
                {
                    "type": "maintenance",
                    "priority": "medium",
                    "title": "Outdated Dependencies",
                    "description": f"Update {len(outdated_packages)} outdated packages for better security and performance.",
                    "actions": [
                        f"Update {pkg['name']} from {pkg['current_version']} to {pkg['latest_version']}"
                        for pkg in outdated_packages[:5]
                    ],
                }
            )

        # License recommendations
        if license_issues:
            recommendations.append(
                {
                    "type": "legal",
                    "priority": "high",
                    "title": "License Compatibility Issues",
                    "description": f"Review {len(license_issues)} dependencies with potential license conflicts.",
                    "actions": [
                        "Review license terms",
                        "Consider alternative packages",
                        "Consult legal team",
                    ],
                }
            )

        # Optimization recommendations
        if tree.total_count > 50:
            recommendations.append(
                {
                    "type": "optimization",
                    "priority": "medium",
                    "title": "Dependency Bloat",
                    "description": "Consider reducing the number of dependencies for better performance.",
                    "actions": [
                        "Audit unused dependencies",
                        "Replace heavy libraries with lighter alternatives",
                        "Use tree-shaking for frontend builds",
                    ],
                }
            )

        return recommendations
