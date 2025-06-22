"""
Stack Analyzer - High-accuracy technology stack detection
Combines file structure, package analysis, and LLM enhancement
"""

import json
import re
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from engines.core.models import StackDetectionResult, TechnologyStack, ConfidenceLevel
from engines.utils.github_client import GitHubClient

logger = logging.getLogger(__name__)


@dataclass
class AnalysisContext:
    """Context for stack analysis"""

    repository_data: Dict[str, Any]
    file_tree: List[Dict]
    key_files: Dict[str, str]
    structure_analysis: Dict[str, Any]


class StackAnalyzer:
    """
    High-accuracy technology stack analyzer

    Detection Strategy:
    1. File structure analysis (directory patterns, extensions)
    2. Package file analysis (dependencies, config files)
    3. Content analysis (imports, patterns)
    4. LLM enhancement (for low confidence cases)    Target Accuracy: 96%+
    """

    def __init__(self):
        self.github_client = GitHubClient()
        self._init_detection_patterns()
        # Add simple caching for repeated pattern matches
        self._pattern_cache = {}
        self._structure_cache = {}

    def _cache_key(self, file_list: List[str], cache_type: str) -> str:
        """Generate cache key for file patterns"""
        sorted_files = sorted(file_list)
        return f"{cache_type}:{hash(str(sorted_files))}"

    def _init_detection_patterns(self):
        """Initialize detection patterns for different technologies"""

        # Framework directory patterns
        self.framework_patterns = {
            "react": {
                "directories": ["src/", "public/", "components/", "pages/", "hooks/"],
                "files": [
                    "package.json",
                    "public/index.html",
                    "src/index.js",
                    "src/App.js",
                ],
                "indicators": ["src/App.js", "src/index.js", "public/favicon.ico"],
                "confidence_boost": 0.15,
            },
            "vue": {
                "directories": ["src/", "public/", "components/", "views/", "router/"],
                "files": [
                    "package.json",
                    "vue.config.js",
                    "src/main.js",
                    "src/App.vue",
                ],
                "indicators": ["src/main.js", "src/App.vue", "vue.config.js"],
                "confidence_boost": 0.15,
            },
            "angular": {
                "directories": ["src/", "src/app/", "src/assets/", "e2e/"],
                "files": ["angular.json", "package.json", "src/main.ts"],
                "indicators": ["angular.json", "src/main.ts", "src/app/app.module.ts"],
                "confidence_boost": 0.20,
            },
            "next": {
                "directories": ["pages/", "public/", "components/", "styles/"],
                "files": ["next.config.js", "package.json", "pages/index.js"],
                "indicators": ["next.config.js", "pages/", "pages/_app.js"],
                "confidence_boost": 0.18,
            },
            "django": {
                "directories": ["templates/", "static/", "migrations/", "media/"],
                "files": ["manage.py", "requirements.txt", "settings.py", "urls.py"],
                "indicators": ["manage.py", "*/settings.py", "*/wsgi.py"],
                "confidence_boost": 0.20,
            },
            "flask": {
                "directories": ["templates/", "static/", "instance/"],
                "files": ["app.py", "requirements.txt", "run.py", "wsgi.py"],
                "indicators": ["app.py", "run.py", "*/app.py"],
                "confidence_boost": 0.18,
            },
            "fastapi": {
                "directories": ["app/", "api/", "models/", "routers/"],
                "files": ["main.py", "requirements.txt", "app.py"],
                "indicators": ["main.py", "app/main.py", "*/main.py"],
                "confidence_boost": 0.18,
            },
            "express": {
                "directories": ["routes/", "controllers/", "middleware/", "models/"],
                "files": ["server.js", "app.js", "package.json", "index.js"],
                "indicators": ["server.js", "app.js", "*/server.js"],
                "confidence_boost": 0.16,
            },
        }

        # Language file extensions
        self.language_extensions = {
            "javascript": [".js", ".jsx", ".mjs", ".cjs"],
            "typescript": [".ts", ".tsx", ".d.ts"],
            "python": [".py", ".pyw", ".pyi", ".pyx"],
            "java": [".java", ".jar", ".war"],
            "php": [".php", ".phtml", ".phar"],
            "go": [".go"],
            "rust": [".rs"],
            "ruby": [".rb", ".gem"],
            "csharp": [".cs", ".csx"],
            "cpp": [".cpp", ".cc", ".cxx", ".c", ".h", ".hpp"],
        }

        # Package file analyzers
        self.package_analyzers = {
            "package.json": self._analyze_package_json,
            "requirements.txt": self._analyze_requirements_txt,
            "pyproject.toml": self._analyze_pyproject_toml,
            "pom.xml": self._analyze_pom_xml,
            "build.gradle": self._analyze_gradle,
            "composer.json": self._analyze_composer_json,
            "cargo.toml": self._analyze_cargo_toml,
            "go.mod": self._analyze_go_mod,
            "gemfile": self._analyze_gemfile,
        }

        # Content analysis patterns
        self.content_patterns = {
            "react": [
                r"import.*React.*from ['\"]react['\"]",
                r"import.*\{.*Component.*\}.*from ['\"]react['\"]",
                r"React\.createElement",
                r"useState|useEffect|useContext|useReducer",
                r"ReactDOM\.render",
            ],
            "vue": [
                r"<template>.*</template>",
                r"import.*Vue.*from ['\"]vue['\"]",
                r"Vue\.component",
                r"defineComponent|ref|reactive|computed",
                r"<script setup>",
            ],
            "angular": [
                r"import.*\{.*Component.*\}.*from ['\"]@angular/core['\"]",
                r"@Component\(",
                r"@Injectable\(",
                r"@NgModule\(",
                r"import.*\{.*NgModule.*\}",
            ],
            "django": [
                r"from django",
                r"import django",
                r"Django",
                r"models\.Model",
                r"HttpResponse|JsonResponse",
            ],
            "flask": [
                r"from flask import",
                r"Flask\(__name__\)",
                r"@app\.route",
                r"render_template",
                r"request\.method",
            ],
            "fastapi": [
                r"from fastapi import",
                r"FastAPI\(",
                r"@app\.get|@app\.post|@app\.put|@app\.delete",
                r"async def",
                r"Depends\(",
            ],
            "express": [
                r"const express = require\(['\"]express['\"]\)",
                r"import express from ['\"]express['\"]",
                r"app\.get|app\.post|app\.put|app\.delete",
                r"express\.Router\(",
                r"app\.listen",
            ],
        }

    async def analyze(self, repo_data: Dict) -> Dict:
        """
        Analyze repository data for stack detection

        Args:
            repo_data: Repository data from GitHub client

        Returns:
            Dict with analysis results
        """
        try:
            context = AnalysisContext(
                repository_data=repo_data,
                file_tree=repo_data["file_tree"],
                key_files=repo_data["key_files"],
                structure_analysis=repo_data["structure_analysis"],
            )

            # Multi-phase analysis
            structure_results = await self._analyze_file_structure(context)
            package_results = await self._analyze_package_files(context)
            content_results = await self._analyze_file_content(context)

            # Combine results and calculate confidence
            combined_results = self._combine_analysis_results(
                structure_results, package_results, content_results
            )

            # Determine primary stack
            primary_stack = self._determine_primary_stack(combined_results)

            # Prepare result dictionary
            result = {
                "detected_technologies": combined_results,
                "confidence": primary_stack.confidence if primary_stack else 0.0,
                "detected_files": list(repo_data["key_files"].keys()),
                "recommendations": self._generate_recommendations(combined_results),
                "suggestions": self._generate_suggestions(combined_results),
            }

            # Add primary stack information
            if primary_stack:
                result.update(
                    {
                        "language": primary_stack.language,
                        "framework": (
                            primary_stack.name
                            if primary_stack.type == "framework"
                            else None
                        ),
                        "build_tool": (
                            primary_stack.name
                            if primary_stack.type == "build_tool"
                            else None
                        ),
                        "package_manager": self._extract_package_manager(
                            combined_results
                        ),
                        "runtime_version": primary_stack.version,
                        "additional_technologies": [
                            tech.name for tech in combined_results[1:5]
                        ],  # Top 5
                        "architecture_pattern": self._detect_architecture_pattern(
                            context
                        ),
                        "deployment_strategy": self._suggest_deployment_strategy(
                            combined_results
                        ),
                    }
                )

            return result

        except Exception as e:
            logger.error(f"Stack analysis failed: {e}")
            return {"error": str(e)}

    async def analyze_stack(
        self, repository_url: str, branch: str = "main"
    ) -> StackDetectionResult:
        """
        Perform comprehensive stack analysis

        Args:
            repository_url: GitHub repository URL
            branch: Branch to analyze

        Returns:
            StackDetectionResult with detected technologies
        """
        try:
            logger.info(f"Starting stack analysis for {repository_url}")

            # Step 1: Fetch repository data
            repo_data = await self.github_client.fetch_repository_data(
                repository_url, branch
            )

            context = AnalysisContext(
                repository_data=repo_data,
                file_tree=repo_data["file_tree"],
                key_files=repo_data["key_files"],
                structure_analysis=repo_data["structure_analysis"],
            )

            # Step 2: Multi-phase analysis
            structure_results = await self._analyze_file_structure(context)
            package_results = await self._analyze_package_files(context)
            content_results = await self._analyze_file_content(context)

            # Step 3: Combine results and calculate confidence
            combined_results = self._combine_analysis_results(
                structure_results, package_results, content_results
            )

            # Step 4: Determine if LLM enhancement is needed
            needs_llm_enhancement = any(
                result.confidence < ConfidenceLevel.HIGH.value
                for result in combined_results
            )

            if needs_llm_enhancement:
                logger.info("Low confidence detected, triggering LLM enhancement")
                enhanced_results = await self._enhance_with_llm(
                    context, combined_results
                )
                combined_results = enhanced_results

            # Step 5: Create final result
            primary_stack = self._determine_primary_stack(combined_results)

            return StackDetectionResult(
                repository_url=repository_url,
                primary_stack=primary_stack,
                detected_technologies=combined_results,
                analysis_metadata={
                    "total_files_analyzed": len(context.file_tree),
                    "key_files_analyzed": len(context.key_files),
                    "llm_enhancement_used": needs_llm_enhancement,
                    "analysis_duration": "calculated_separately",
                    "confidence_distribution": self._get_confidence_distribution(
                        combined_results
                    ),
                },
            )

        except Exception as e:
            logger.error(f"Stack analysis failed: {e}")
            raise

    async def _analyze_file_structure(
        self, context: AnalysisContext
    ) -> List[TechnologyStack]:
        """Analyze file structure for framework detection"""
        results = []

        # Get directory structure
        directories = set(context.structure_analysis.get("directories", []))
        file_paths = [f["path"] for f in context.file_tree]

        # Check each framework pattern
        for framework, pattern in self.framework_patterns.items():
            confidence = 0.0
            matches = 0
            total_checks = 0

            # Check directory patterns
            for required_dir in pattern["directories"]:
                total_checks += 1
                if any(required_dir in d for d in directories):
                    matches += 1
                    confidence += 0.2

            # Check required files
            for required_file in pattern["files"]:
                total_checks += 1
                if any(required_file in path for path in file_paths):
                    matches += 1
                    confidence += 0.25

            # Check indicators (bonus points)
            for indicator in pattern["indicators"]:
                if any(indicator in path for path in file_paths):
                    confidence += pattern["confidence_boost"]

            # Calculate final confidence
            if matches > 0:
                base_confidence = matches / total_checks if total_checks > 0 else 0
                final_confidence = min(base_confidence + confidence, 1.0)

                if final_confidence > 0.3:  # Minimum threshold
                    # Determine language based on framework
                    language = self._get_framework_language(framework)

                    results.append(
                        TechnologyStack(
                            name=framework,
                            type="framework",
                            language=language,
                            version="unknown",
                            confidence=final_confidence,
                            detection_method="file_structure",
                        )
                    )

        # Analyze file extensions for languages
        extension_results = self._analyze_file_extensions(context)
        results.extend(extension_results)

        return results

    def _analyze_file_extensions(
        self, context: AnalysisContext
    ) -> List[TechnologyStack]:
        """Analyze file extensions to detect programming languages"""
        results = []
        file_types = context.structure_analysis.get("file_types", {})
        total_files = sum(file_types.values())

        if total_files == 0:
            return results

        for language, extensions in self.language_extensions.items():
            file_count = sum(file_types.get(ext, 0) for ext in extensions)

            if file_count > 0:
                # Calculate confidence based on file count ratio
                confidence = min(file_count / total_files * 2, 1.0)  # Cap at 1.0

                # Boost confidence for significant presence
                if file_count >= 5:
                    confidence += 0.1
                if file_count >= 10:
                    confidence += 0.1

                if confidence > 0.1:  # Minimum threshold
                    results.append(
                        TechnologyStack(
                            name=language,
                            type="language",
                            language=language,
                            version="unknown",
                            confidence=min(confidence, 1.0),
                            detection_method="file_extensions",
                        )
                    )

        return results

    async def _analyze_package_files(
        self, context: AnalysisContext
    ) -> List[TechnologyStack]:
        """Analyze package files for technology detection"""
        results = []

        for file_path, content in context.key_files.items():
            filename = file_path.split("/")[-1].lower()

            if filename in self.package_analyzers:
                try:
                    analyzer = self.package_analyzers[filename]
                    analysis_result = await analyzer(content)
                    if analysis_result:
                        results.extend(analysis_result)
                except Exception as e:
                    logger.debug(f"Failed to analyze {file_path}: {e}")
                    continue

        return results

    async def _analyze_package_json(self, content: str) -> List[TechnologyStack]:
        """Analyze package.json for Node.js ecosystem detection"""
        try:
            package_data = json.loads(content)
            results = []

            # Get all dependencies
            dependencies = {
                **package_data.get("dependencies", {}),
                **package_data.get("devDependencies", {}),
            }

            # Framework detection
            framework_packages = {
                "react": ["react", "react-dom"],
                "vue": ["vue", "@vue/cli"],
                "angular": ["@angular/core", "@angular/cli"],
                "next": ["next"],
                "nuxt": ["nuxt"],
                "gatsby": ["gatsby"],
                "svelte": ["svelte"],
                "express": ["express"],
                "fastify": ["fastify"],
                "koa": ["koa"],
                "nest": ["@nestjs/core", "@nestjs/common"],
            }

            for framework, packages in framework_packages.items():
                matches = sum(1 for pkg in packages if pkg in dependencies)
                if matches > 0:
                    confidence = min(matches / len(packages) + 0.3, 1.0)

                    # Get version if available
                    version = next(
                        (dependencies[pkg] for pkg in packages if pkg in dependencies),
                        "unknown",
                    )

                    results.append(
                        TechnologyStack(
                            name=framework,
                            type="framework",
                            language="javascript",
                            version=version,
                            confidence=confidence,
                            detection_method="package_analysis",
                        )
                    )

            # Build tool detection
            build_tools = {
                "vite": "vite",
                "webpack": "webpack",
                "parcel": "parcel",
                "rollup": "rollup",
                "esbuild": "esbuild",
            }

            for tool, package in build_tools.items():
                if package in dependencies:
                    results.append(
                        TechnologyStack(
                            name=tool,
                            type="build_tool",
                            language="javascript",
                            version=dependencies[package],
                            confidence=0.9,
                            detection_method="package_analysis",
                        )
                    )

            # TypeScript detection
            if "typescript" in dependencies or "@types/" in str(dependencies):
                results.append(
                    TechnologyStack(
                        name="typescript",
                        type="language",
                        language="typescript",
                        version=dependencies.get("typescript", "unknown"),
                        confidence=0.95,
                        detection_method="package_analysis",
                    )
                )

            return results

        except json.JSONDecodeError:
            logger.debug("Invalid JSON in package.json")
            return []

    async def _analyze_requirements_txt(self, content: str) -> List[TechnologyStack]:
        """Analyze requirements.txt for Python ecosystem detection"""
        lines = [
            line.strip()
            for line in content.split("\n")
            if line.strip() and not line.startswith("#")
        ]

        packages = []
        for line in lines:
            # Parse package name from various formats
            package_name = re.split(r"[><=!]", line)[0].strip()
            packages.append(package_name.lower())

        results = []

        # Framework detection
        python_frameworks = {
            "django": ["django"],
            "flask": ["flask"],
            "fastapi": ["fastapi"],
            "tornado": ["tornado"],
            "pyramid": ["pyramid"],
            "sanic": ["sanic"],
            "aiohttp": ["aiohttp"],
        }

        for framework, framework_packages in python_frameworks.items():
            if any(pkg in packages for pkg in framework_packages):
                confidence = 0.9  # High confidence for direct package detection

                results.append(
                    TechnologyStack(
                        name=framework,
                        type="framework",
                        language="python",
                        version="unknown",  # Would need to parse version from line
                        confidence=confidence,
                        detection_method="package_analysis",
                    )
                )

        # Always add Python as detected language
        results.append(
            TechnologyStack(
                name="python",
                type="language",
                language="python",
                version="unknown",
                confidence=0.95,
                detection_method="package_analysis",
            )
        )

        return results

    async def _analyze_pyproject_toml(self, content: str) -> List[TechnologyStack]:
        """Analyze pyproject.toml for modern Python projects"""
        # This would require toml parsing - simplified for now
        results = []

        # Check for common frameworks in content
        if "django" in content.lower():
            results.append(
                TechnologyStack(
                    name="django",
                    type="framework",
                    language="python",
                    version="unknown",
                    confidence=0.8,
                    detection_method="package_analysis",
                )
            )

        if "fastapi" in content.lower():
            results.append(
                TechnologyStack(
                    name="fastapi",
                    type="framework",
                    language="python",
                    version="unknown",
                    confidence=0.8,
                    detection_method="package_analysis",
                )
            )

        # Always add Python
        results.append(
            TechnologyStack(
                name="python",
                type="language",
                language="python",
                version="unknown",
                confidence=0.9,
                detection_method="package_analysis",
            )
        )

        return results

    async def _analyze_pom_xml(self, content: str) -> List[TechnologyStack]:
        """Analyze pom.xml for Java/Maven projects"""
        results = []

        # Java is definitely present
        results.append(
            TechnologyStack(
                name="java",
                type="language",
                language="java",
                version="unknown",
                confidence=1.0,
                detection_method="package_analysis",
            )
        )

        # Maven build tool
        results.append(
            TechnologyStack(
                name="maven",
                type="build_tool",
                language="java",
                version="unknown",
                confidence=1.0,
                detection_method="package_analysis",
            )
        )

        # Check for Spring framework
        if "spring" in content.lower():
            results.append(
                TechnologyStack(
                    name="spring",
                    type="framework",
                    language="java",
                    version="unknown",
                    confidence=0.9,
                    detection_method="package_analysis",
                )
            )

        return results

    async def _analyze_gradle(self, content: str) -> List[TechnologyStack]:
        """Analyze build.gradle for Java/Gradle projects"""
        results = []

        # Java/Kotlin is present
        if "kotlin" in content.lower():
            results.append(
                TechnologyStack(
                    name="kotlin",
                    type="language",
                    language="kotlin",
                    version="unknown",
                    confidence=0.9,
                    detection_method="package_analysis",
                )
            )
        else:
            results.append(
                TechnologyStack(
                    name="java",
                    type="language",
                    language="java",
                    version="unknown",
                    confidence=0.9,
                    detection_method="package_analysis",
                )
            )

        # Gradle build tool
        results.append(
            TechnologyStack(
                name="gradle",
                type="build_tool",
                language="java",
                version="unknown",
                confidence=1.0,
                detection_method="package_analysis",
            )
        )

        return results

    async def _analyze_composer_json(self, content: str) -> List[TechnologyStack]:
        """Analyze composer.json for PHP projects"""
        results = []

        results.append(
            TechnologyStack(
                name="php",
                type="language",
                language="php",
                version="unknown",
                confidence=1.0,
                detection_method="package_analysis",
            )
        )

        # Check for Laravel
        if "laravel" in content.lower():
            results.append(
                TechnologyStack(
                    name="laravel",
                    type="framework",
                    language="php",
                    version="unknown",
                    confidence=0.9,
                    detection_method="package_analysis",
                )
            )

        return results

    async def _analyze_cargo_toml(self, content: str) -> List[TechnologyStack]:
        """Analyze Cargo.toml for Rust projects"""
        return [
            TechnologyStack(
                name="rust",
                type="language",
                language="rust",
                version="unknown",
                confidence=1.0,
                detection_method="package_analysis",
            )
        ]

    async def _analyze_go_mod(self, content: str) -> List[TechnologyStack]:
        """Analyze go.mod for Go projects"""
        return [
            TechnologyStack(
                name="go",
                type="language",
                language="go",
                version="unknown",
                confidence=1.0,
                detection_method="package_analysis",
            )
        ]

    async def _analyze_gemfile(self, content: str) -> List[TechnologyStack]:
        """Analyze Gemfile for Ruby projects"""
        results = []

        results.append(
            TechnologyStack(
                name="ruby",
                type="language",
                language="ruby",
                version="unknown",
                confidence=1.0,
                detection_method="package_analysis",
            )
        )

        # Check for Rails
        if "rails" in content.lower():
            results.append(
                TechnologyStack(
                    name="rails",
                    type="framework",
                    language="ruby",
                    version="unknown",
                    confidence=0.9,
                    detection_method="package_analysis",
                )
            )

        return results

    async def _analyze_file_content(
        self, context: AnalysisContext
    ) -> List[TechnologyStack]:
        """Analyze file content for framework-specific patterns"""
        results = []

        for file_path, content in context.key_files.items():
            # Only analyze code files
            if not self._is_code_file(file_path):
                continue

            for framework, patterns in self.content_patterns.items():
                matches = 0
                for pattern in patterns:
                    if re.search(pattern, content, re.MULTILINE | re.IGNORECASE):
                        matches += 1

                if matches > 0:
                    confidence = min(matches / len(patterns) + 0.2, 1.0)

                    # Avoid duplicates - check if framework already detected
                    if not any(r.name == framework for r in results):
                        language = self._get_framework_language(framework)

                        results.append(
                            TechnologyStack(
                                name=framework,
                                type="framework",
                                language=language,
                                version="unknown",
                                confidence=confidence,
                                detection_method="content_analysis",
                            )
                        )

        return results

    def _combine_analysis_results(
        self,
        structure_results: List[TechnologyStack],
        package_results: List[TechnologyStack],
        content_results: List[TechnologyStack],
    ) -> List[TechnologyStack]:
        """Combine and deduplicate analysis results"""

        # Group results by technology name
        technology_groups = {}

        for result_list in [structure_results, package_results, content_results]:
            for result in result_list:
                if result.name not in technology_groups:
                    technology_groups[result.name] = []
                technology_groups[result.name].append(result)

        # Combine grouped results
        combined_results = []

        for tech_name, tech_results in technology_groups.items():
            if len(tech_results) == 1:
                # Single detection - use as is
                combined_results.append(tech_results[0])
            else:
                # Multiple detections - combine with weighted average
                combined_result = self._merge_technology_detections(tech_results)
                combined_results.append(combined_result)

        # Sort by confidence
        combined_results.sort(key=lambda x: x.confidence, reverse=True)

        return combined_results

    def _merge_technology_detections(
        self, detections: List[TechnologyStack]
    ) -> TechnologyStack:
        """Merge multiple detections of the same technology"""

        # Weights for different detection methods
        method_weights = {
            "package_analysis": 0.5,
            "content_analysis": 0.3,
            "file_structure": 0.2,
        }

        # Calculate weighted average confidence
        total_weighted_confidence = 0.0
        total_weight = 0.0

        for detection in detections:
            weight = method_weights.get(detection.detection_method, 0.1)
            total_weighted_confidence += detection.confidence * weight
            total_weight += weight

        final_confidence = (
            total_weighted_confidence / total_weight if total_weight > 0 else 0.0
        )

        # Use the detection with highest confidence as base
        base_detection = max(detections, key=lambda x: x.confidence)

        # Combine detection methods
        detection_methods = [d.detection_method for d in detections]
        combined_method = "+".join(set(detection_methods))

        return TechnologyStack(
            name=base_detection.name,
            type=base_detection.type,
            language=base_detection.language,
            version=base_detection.version,
            confidence=min(
                final_confidence + 0.1, 1.0
            ),  # Boost for multiple confirmations
            detection_method=combined_method,
        )

    async def _enhance_with_llm(
        self, context: AnalysisContext, current_results: List[TechnologyStack]
    ) -> List[TechnologyStack]:
        """Enhance detection results using LLM for low confidence cases"""
        try:
            logger.info(
                "Attempting LLM enhancement for stack detection"
            )  # Import LLM enhancer
            from ..enhancers.llm_enhancer import ModularLLMEnhancer

            # Create mock analysis result for LLM enhancer
            from ..core.models import AnalysisResult, AnalysisType

            mock_result = AnalysisResult(
                repository_url=context.repository_data.get("url", "unknown"),
                branch="main",
                analysis_type=AnalysisType.STACK_DETECTION,
                technology_stack=(
                    current_results[0] if current_results else TechnologyStack()
                ),
                confidence_score=(
                    current_results[0].confidence if current_results else 0.0
                ),
                confidence_level=self._calculate_confidence_level(
                    current_results[0].confidence if current_results else 0.0
                ),
                recommendations=[],
                suggestions=[],
                processing_time=0.0,
                llm_used=False,
            )  # Use LLM enhancer
            llm_enhancer = ModularLLMEnhancer()
            enhancement = await llm_enhancer.enhance_analysis(
                mock_result, context.key_files
            )

            # Convert enhanced stack back to our format
            enhanced_stack = enhancement.enhanced_stack
            if enhanced_stack and enhanced_stack.language:
                enhanced_result = TechnologyStack(
                    name=enhanced_stack.framework or enhanced_stack.language,
                    type="framework" if enhanced_stack.framework else "language",
                    language=enhanced_stack.language,
                    version="unknown",
                    confidence=(
                        min(
                            current_results[0].confidence
                            + enhancement.confidence_boost,
                            1.0,
                        )
                        if current_results
                        else enhancement.confidence_boost
                    ),
                    detection_method="llm_enhancement",
                )

                logger.info(
                    f"LLM enhancement successful - confidence boost: {enhancement.confidence_boost}"
                )

                # Merge with existing results
                enhanced_results = (
                    [enhanced_result] + current_results[1:]
                    if current_results
                    else [enhanced_result]
                )
                return enhanced_results
            else:
                logger.warning("LLM enhancement returned no useful data")
                logger.error(
                    f"FALLBACK TRIGGERED: LLM enhancement returned empty stack for {context.repository_data.get('url', 'unknown')}"
                )
                return current_results

        except Exception as e:
            logger.error(f"LLM enhancement failed: {e}")
            logger.error(
                f"FALLBACK TRIGGERED: Stack analyzer LLM enhancement failed for {context.repository_data.get('url', 'unknown')} - {str(e)}"
            )
            return current_results

    def _calculate_confidence_level(self, confidence: float):
        """Calculate confidence level enum from float value"""
        from ..core.models import ConfidenceLevel

        if confidence >= 0.95:
            return ConfidenceLevel.VERY_HIGH
        elif confidence >= 0.80:
            return ConfidenceLevel.HIGH
        elif confidence >= 0.60:
            return ConfidenceLevel.MEDIUM
        elif confidence >= 0.40:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.VERY_LOW

    def _determine_primary_stack(
        self, results: List[TechnologyStack]
    ) -> TechnologyStack:
        """Determine the primary technology stack"""

        # Find the highest confidence framework
        frameworks = [r for r in results if r.type == "framework"]
        if frameworks:
            return max(frameworks, key=lambda x: x.confidence)

        # If no frameworks, find highest confidence language
        languages = [r for r in results if r.type == "language"]
        if languages:
            return max(languages, key=lambda x: x.confidence)

        # Fallback to highest confidence overall
        return max(results, key=lambda x: x.confidence) if results else None

    def _get_confidence_distribution(
        self, results: List[TechnologyStack]
    ) -> Dict[str, int]:
        """Get distribution of confidence levels"""
        distribution = {"high": 0, "medium": 0, "low": 0}

        for result in results:
            if result.confidence >= ConfidenceLevel.HIGH.value:
                distribution["high"] += 1
            elif result.confidence >= ConfidenceLevel.MEDIUM.value:
                distribution["medium"] += 1
            else:
                distribution["low"] += 1

        return distribution

    def _get_framework_language(self, framework: str) -> str:
        """Get the primary language for a framework"""
        framework_languages = {
            "react": "javascript",
            "vue": "javascript",
            "angular": "typescript",
            "next": "javascript",
            "nuxt": "javascript",
            "gatsby": "javascript",
            "svelte": "javascript",
            "django": "python",
            "flask": "python",
            "fastapi": "python",
            "tornado": "python",
            "pyramid": "python",
            "express": "javascript",
            "fastify": "javascript",
            "koa": "javascript",
            "nest": "typescript",
            "spring": "java",
            "laravel": "php",
            "rails": "ruby",
        }

        return framework_languages.get(framework, "unknown")

    def _is_code_file(self, file_path: str) -> bool:
        """Check if file is a code file suitable for content analysis"""
        code_extensions = {
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".py",
            ".java",
            ".php",
            ".rb",
            ".go",
            ".rs",
            ".cs",
            ".cpp",
            ".c",
            ".h",
        }

        ext = "." + file_path.split(".")[-1].lower() if "." in file_path else ""
        return ext in code_extensions

    def _generate_recommendations(self, results: List[TechnologyStack]) -> List[dict]:
        """Generate recommendations based on detected technologies"""
        recommendations = []
        # Framework-specific recommendations
        frameworks = [r for r in results if r.type == "framework"]
        if frameworks:
            main_framework = frameworks[0]
            if main_framework.name == "react":
                recommendations.extend(
                    [
                        {
                            "suggestion": "Consider using TypeScript for better type safety"
                        },
                        {
                            "suggestion": "Use React Testing Library for component testing"
                        },
                        {"suggestion": "Consider Next.js for production deployment"},
                    ]
                )
            elif main_framework.name == "vue":
                recommendations.extend(
                    [
                        {
                            "suggestion": "Use Vue 3 Composition API for better code organization"
                        },
                        {"suggestion": "Consider Nuxt.js for SSR capabilities"},
                    ]
                )
            elif main_framework.name == "django":
                recommendations.extend(
                    [
                        {"suggestion": "Use Django REST Framework for API development"},
                        {"suggestion": "Consider Redis for caching"},
                        {"suggestion": "Use Celery for background tasks"},
                    ]
                )
            elif main_framework.name == "flask":
                recommendations.extend(
                    [
                        {"suggestion": "Consider Flask-RESTful for API development"},
                        {"suggestion": "Use SQLAlchemy for database operations"},
                        {
                            "suggestion": "Consider migrating to FastAPI for async support"
                        },
                    ]
                )
        # Language-specific recommendations
        languages = [r for r in results if r.type == "language"]
        if languages:
            main_language = languages[0]
            if main_language.name == "python":
                recommendations.extend(
                    [
                        {
                            "suggestion": "Use virtual environments for dependency isolation"
                        },
                        {
                            "suggestion": "Consider using type hints for better code quality"
                        },
                        {"suggestion": "Use pytest for testing"},
                    ]
                )
            elif main_language.name == "javascript":
                recommendations.extend(
                    [
                        {
                            "suggestion": "Consider using TypeScript for better type safety"
                        },
                        {"suggestion": "Use ESLint and Prettier for code quality"},
                        {"suggestion": "Consider using a modern bundler like Vite"},
                    ]
                )
        return recommendations[:10]  # Limit to 10 recommendations

    def _generate_suggestions(self, results: List[TechnologyStack]) -> List[str]:
        """Generate suggestions for improvement"""
        suggestions = []

        # Low confidence suggestions
        low_confidence = [r for r in results if r.confidence < 0.7]
        if low_confidence:
            suggestions.append(
                f"Consider adding more specific configuration files for {len(low_confidence)} technologies"
            )

        # Missing build tools
        has_build_tool = any(r.type == "build_tool" for r in results)
        if not has_build_tool:
            suggestions.append(
                "Consider adding a build tool for better dependency management"
            )

        # Modern alternatives
        for result in results:
            if result.name == "jquery":
                suggestions.append(
                    "Consider migrating from jQuery to modern JavaScript frameworks"
                )
            elif result.name == "bower":
                suggestions.append("Consider migrating from Bower to npm/yarn")

        return suggestions[:5]  # Limit to 5 suggestions

    def _extract_package_manager(self, results: List[TechnologyStack]) -> Optional[str]:
        """Extract package manager from detection results"""
        # Check detection methods for package manager info
        for result in results:
            if "package_analysis" in result.detection_method:
                if result.language == "javascript":
                    return "npm"  # Default for JavaScript
                elif result.language == "python":
                    return "pip"  # Default for Python
                elif result.language == "java":
                    return "maven"  # Default for Java

        return None

    def _detect_architecture_pattern(self, context: AnalysisContext) -> Optional[str]:
        """Detect architecture pattern from directory structure"""
        directories = set(context.structure_analysis.get("directories", []))

        # Check for common patterns
        if (
            any("controller" in d.lower() for d in directories)
            and any("model" in d.lower() for d in directories)
            and any("view" in d.lower() for d in directories)
        ):
            return "mvc"

        if any("service" in d.lower() for d in directories) and any(
            "repository" in d.lower() for d in directories
        ):
            return "layered"

        if any("component" in d.lower() for d in directories):
            return "component_based"

        return None

    def _suggest_deployment_strategy(
        self, results: List[TechnologyStack]
    ) -> Optional[str]:
        """Suggest deployment strategy based on detected technologies"""
        languages = [r.language for r in results]
        frameworks = [r.name for r in results if r.type == "framework"]

        if "javascript" in languages:
            if "next" in frameworks or "nuxt" in frameworks:
                return "vercel_or_netlify"
            elif "react" in frameworks or "vue" in frameworks:
                return "static_hosting"
            else:
                return "nodejs_hosting"

        elif "python" in languages:
            if "django" in frameworks or "flask" in frameworks:
                return "python_web_hosting"
            else:
                return "python_cloud_functions"

        elif "java" in languages:
            return "java_application_server"

        return "containerized_deployment"

    async def get_supported_languages(self) -> List[str]:
        """Get list of supported programming languages"""
        return list(self.language_extensions.keys())

    async def get_supported_frameworks(self) -> List[str]:
        """Get list of supported frameworks"""
        return list(self.framework_patterns.keys())

    async def get_supported_databases(self) -> List[str]:
        """Get list of supported databases"""
        return [
            "mysql",
            "postgresql",
            "mongodb",
            "redis",
            "sqlite",
            "mariadb",
            "elasticsearch",
            "cassandra",
            "dynamodb",
        ]

    async def get_supported_build_tools(self) -> List[str]:
        """Get list of supported build tools"""
        return [
            "webpack",
            "vite",
            "rollup",
            "parcel",
            "esbuild",
            "maven",
            "gradle",
            "npm",
            "yarn",
            "pip",
            "cargo",
        ]
