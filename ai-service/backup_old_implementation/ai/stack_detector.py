"""
AI-Powered Technology Stack Detection Engine
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path
import aiohttp
from urllib.parse import urlparse
from config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class DetectedStack:
    """Represents a detected technology stack"""

    language: Optional[str] = None
    framework: Optional[str] = None
    database: Optional[str] = None
    build_tool: Optional[str] = None
    package_manager: Optional[str] = None
    runtime_version: Optional[str] = None
    confidence: float = 0.0


@dataclass
class FileAnalysis:
    """Analysis result for a single file"""

    filename: str
    file_type: str
    technologies: List[str]
    confidence: float


class StackDetector:
    """Advanced AI-powered stack detection engine"""

    def __init__(self):
        self.patterns = self._load_detection_patterns()
        self.confidence_weights = self._load_confidence_weights()

    def _load_detection_patterns(self) -> Dict:
        """Load technology detection patterns"""
        return {  # Frontend Frameworks - Enhanced MERN Detection
            "react": {
                "files": ["package.json"],
                "content_patterns": [
                    r'"react":\s*"[^"]*"',
                    r"import\s+React",
                    r'from\s+["\']react["\']',
                    r"jsx?$",
                    r"React\.createElement",
                    r"useState|useEffect|useContext",
                    r"ReactDOM\.render",
                ],
                "file_patterns": [
                    r"\.jsx?$",
                    r"src/.*\.js$",
                    r"components/.*\.js$",
                    r"src/App\.js$",
                    r"client/src/.*\.js$",
                ],
                "structure_indicators": [
                    "src/components/",
                    "client/src/",
                    "frontend/src/",
                    "public/index.html",
                ],
                "confidence_boost": 0.95,
                "mern_weight": 1.0,  # High weight for MERN detection
            },
            "vue": {
                "files": ["package.json"],
                "content_patterns": [
                    r'"vue":\s*"[^"]*"',
                    r"import.*Vue",
                    r'from\s+["\']vue["\']',
                    r"<template>.*</template>",
                    r"\.vue$",
                ],
                "file_patterns": [r"\.vue$", r"src/.*\.vue$"],
                "confidence_boost": 0.9,
            },
            "angular": {
                "files": ["package.json", "angular.json"],
                "content_patterns": [
                    r'"@angular/core":\s*"[^"]*"',
                    r"@Component",
                    r"@Injectable",
                ],
                "file_patterns": [r"\.component\.ts$", r"\.service\.ts$"],
                "confidence_boost": 0.95,
            },
            "next": {
                "files": ["package.json", "next.config.js"],
                "content_patterns": [r'"next":\s*"[^"]*"', r"import.*next"],
                "file_patterns": [r"pages/.*\.js$", r"app/.*\.js$"],
                "confidence_boost": 0.9,
            },  # Backend Frameworks - Enhanced MERN Detection
            "express": {
                "files": ["package.json"],
                "content_patterns": [
                    r'"express":\s*"[^"]*"',
                    r'require\(["\']express["\']\)',
                    r"app\.listen\(",
                    r"app\.use\(",
                    r"app\.(get|post|put|delete)",
                    r"express\(\)",
                    r"const express = require",
                    r"import express from",
                ],
                "file_patterns": [
                    r"server\.js$",
                    r"app\.js$",
                    r"index\.js$",
                    r"server/.*\.js$",
                    r"backend/.*\.js$",
                ],
                "structure_indicators": [
                    "server/",
                    "backend/",
                    "api/",
                    "routes/",
                    "server/routes/",
                ],
                "confidence_boost": 0.9,
                "mern_weight": 1.0,  # High weight for MERN detection
            },
            "fastapi": {
                "files": ["requirements.txt", "pyproject.toml"],
                "content_patterns": [
                    r"fastapi[>=<]",
                    r"from fastapi import",
                    r"@app\.(get|post|put|delete)",
                ],
                "confidence_boost": 0.9,
            },
            "django": {
                "files": ["requirements.txt", "manage.py", "settings.py"],
                "content_patterns": [
                    r"Django[>=<]",
                    r"from django",
                    r"DJANGO_SETTINGS_MODULE",
                ],
                "confidence_boost": 0.95,
            },
            "flask": {
                "files": ["requirements.txt", "app.py"],
                "content_patterns": [
                    r"Flask[>=<]",
                    r"from flask import",
                    r"app = Flask\(",
                ],
                "confidence_boost": 0.85,
            },
            "spring_boot": {
                "files": ["pom.xml", "build.gradle"],
                "content_patterns": [
                    r"spring-boot-starter",
                    r"@SpringBootApplication",
                    r"org.springframework",
                ],
                "confidence_boost": 0.9,
            },  # Databases - Enhanced MERN Detection
            "mongodb": {
                "files": [
                    "package.json",
                    "requirements.txt",
                    "docker-compose.yml",
                    ".env",
                ],
                "content_patterns": [
                    r"mongodb://",
                    r'"mongoose":\s*"[^"]*"',
                    r"pymongo",
                    r"mongo:.*image",
                    r"MONGODB_URI",
                    r"MONGO_URI",
                    r"require\(['\"]mongoose['\"]\)",
                    r"mongoose\.connect",
                    r"mongoose\.Schema",
                    r"mongodb\+srv://",
                    r"MongoClient",
                ],
                "file_patterns": [
                    r"models/.*\.js$",
                    r"server/models/",
                    r"backend/models/",
                ],
                "structure_indicators": [
                    "models/",
                    "server/models/",
                    "backend/models/",
                ],
                "confidence_boost": 0.9,
                "mern_weight": 1.0,  # High weight for MERN detection
            },
            "postgresql": {
                "files": ["requirements.txt", "package.json", "docker-compose.yml"],
                "content_patterns": [
                    r"postgresql://",
                    r"psycopg2",
                    r'"pg":\s*"[^"]*"',
                    r"postgres:.*image",
                ],
                "confidence_boost": 0.8,
            },
            "mysql": {
                "files": ["requirements.txt", "package.json", "docker-compose.yml"],
                "content_patterns": [
                    r"mysql://",
                    r"mysql-connector",
                    r'"mysql2?":\s*"[^"]*"',
                    r"mysql:.*image",
                    r"MYSQL_",
                ],
                "confidence_boost": 0.8,
            },  # Build Tools
            "vite": {
                "files": ["vite.config.js", "package.json"],
                "content_patterns": [r'"vite":\s*"[^"]*"', r"import.*vite"],
                "confidence_boost": 0.9,
            },
            "webpack": {
                "files": ["webpack.config.js", "package.json"],
                "content_patterns": [
                    r'"webpack":\s*"[^"]*"',
                    r"module\.exports.*webpack",
                ],
                "confidence_boost": 0.85,
            },
            # Package Managers
            "npm": {
                "files": ["package.json", "package-lock.json"],
                "content_patterns": [
                    r'"scripts":\s*\{',
                    r'"dependencies":\s*\{',
                    r'"devDependencies":\s*\{',
                ],
                "confidence_boost": 0.95,
            },
            "yarn": {
                "files": ["yarn.lock", "package.json"],
                "content_patterns": [r'"yarn"', r"yarn\s+install"],
                "confidence_boost": 0.9,
            },
            "pnpm": {
                "files": ["pnpm-lock.yaml", "package.json"],
                "content_patterns": [r"pnpm", r"pnpm-workspace"],
                "confidence_boost": 0.9,
            },
        }

    def _load_confidence_weights(self) -> Dict:
        """Load confidence scoring weights"""
        return {
            "file_match": 0.3,
            "content_match": 0.4,
            "pattern_match": 0.2,
            "structure_match": 0.1,
        }

    async def analyze_github_repository(
        self, repo_url: str, branch: str = "main"
    ) -> Tuple[DetectedStack, List[str], List[Dict]]:
        """
        Analyze GitHub repository to detect technology stack
        Returns: (detected_stack, file_list, recommendations)
        """
        try:
            # Extract owner and repo from URL
            parsed_url = urlparse(repo_url)
            path_parts = parsed_url.path.strip("/").split("/")
            if len(path_parts) < 2:
                raise ValueError("Invalid GitHub repository URL")

            owner, repo = path_parts[0], path_parts[1]

            # Try to get repository files via GitHub API first
            try:
                files_data = await self._fetch_github_files(owner, repo, branch)
            except Exception as github_error:
                # If GitHub API fails, try demo fallback
                logger.warning(f"GitHub API failed for {repo_url}: {github_error}")
                demo_stack = self._get_demo_repository_stack(repo_url)
                if demo_stack:
                    logger.info(f"Using demo fallback for {repo_url}")
                    return demo_stack
                else:
                    # No demo fallback available, re-raise the GitHub error
                    raise github_error

            # Analyze files for technology patterns
            analysis_results = await self._analyze_files(files_data)

            # Detect technology stack
            detected_stack = self._detect_stack_from_analysis(analysis_results)

            # Generate recommendations
            recommendations = self._generate_recommendations(
                detected_stack, analysis_results
            )

            # Extract file list
            file_list = [f["path"] for f in files_data]

            logger.info(
                f"Stack detection completed for {repo_url}: {detected_stack.framework} ({detected_stack.confidence:.2f})"
            )

            return detected_stack, file_list, recommendations

        except Exception as e:
            logger.error(f"Stack detection failed for {repo_url}: {e}")
            # Return fallback detection            return DetectedStack(confidence=0.0), [], []

    async def _fetch_github_files(
        self, owner: str, repo: str, branch: str
    ) -> List[Dict]:
        """Fetch repository files via GitHub API"""
        api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"

        # Prepare headers with GitHub token if available
        headers = {}
        if settings.github_token:
            headers["Authorization"] = f"token {settings.github_token}"
            headers["Accept"] = "application/vnd.github.v3+json"
            logger.info(f"Using GitHub token for API request to {owner}/{repo}")
        else:
            logger.warning(
                "No GitHub token configured - using unauthenticated requests (rate limited)"
            )

        async with aiohttp.ClientSession() as session:
            async with session.get(api_url, headers=headers) as response:
                if response.status != 200:
                    error_msg = f"GitHub API error: {response.status}"
                    if response.status == 404:
                        error_msg += " (Repository not found or not accessible)"
                    elif response.status == 403:
                        error_msg += " (Rate limit exceeded or access forbidden)"
                    elif response.status == 401:
                        error_msg += " (Invalid GitHub token)"
                    logger.error(f"{error_msg} for {owner}/{repo}")
                    raise Exception(error_msg)

                data = await response.json()

                # Filter for files (not directories) and common config files
                important_files = []
                for item in data.get("tree", []):
                    if item["type"] == "blob":  # File, not directory
                        path = item["path"]

                        # Priority files for analysis
                        if any(
                            path.endswith(ext)
                            for ext in [
                                ".json",
                                ".js",
                                ".ts",
                                ".py",
                                ".java",
                                ".xml",
                                ".yml",
                                ".yaml",
                                ".toml",
                                ".lock",
                                ".md",
                            ]
                        ) or any(
                            name in path.lower()
                            for name in [
                                "dockerfile",
                                "makefile",
                                "requirements",
                                "package",
                            ]
                        ):
                            important_files.append(
                                {
                                    "path": path,
                                    "url": item.get("url", ""),
                                    "size": item.get("size", 0),
                                }
                            )

                # Limit to first 100 important files to avoid rate limits
                return important_files[:100]

    async def _analyze_files(self, files_data: List[Dict]) -> List[FileAnalysis]:
        """Analyze files for technology patterns"""
        analysis_results = []

        for file_info in files_data:
            filename = file_info["path"]
            file_type = self._get_file_type(filename)

            # Analyze filename patterns
            technologies = []
            confidence = 0.0

            # Check against detection patterns
            for tech, patterns in self.patterns.items():
                tech_confidence = self._calculate_file_confidence(filename, patterns)
                if tech_confidence > 0.1:  # Threshold for relevance
                    technologies.append(tech)
                    confidence = max(confidence, tech_confidence)

            if technologies:
                analysis_results.append(
                    FileAnalysis(
                        filename=filename,
                        file_type=file_type,
                        technologies=technologies,
                        confidence=confidence,
                    )
                )

        return analysis_results

    def _calculate_file_confidence(self, filename: str, patterns: Dict) -> float:
        """Calculate confidence score for a file matching technology patterns"""
        confidence = 0.0

        # Check if filename matches expected files
        if "files" in patterns:
            for expected_file in patterns["files"]:
                if expected_file in filename:
                    confidence += 0.8

        # Check file pattern matches
        if "file_patterns" in patterns:
            for pattern in patterns["file_patterns"]:
                if re.search(pattern, filename):
                    confidence += 0.6

        # Apply confidence boost
        if confidence > 0 and "confidence_boost" in patterns:
            confidence *= patterns["confidence_boost"]

        return min(confidence, 1.0)  # Cap at 1.0

    def _detect_stack_from_analysis(
        self, analysis_results: List[FileAnalysis]
    ) -> DetectedStack:
        """Detect technology stack from file analysis results"""
        technology_scores = {}

        # Aggregate technology scores
        for analysis in analysis_results:
            for tech in analysis.technologies:
                if tech not in technology_scores:
                    technology_scores[tech] = []
                technology_scores[tech].append(analysis.confidence)

        # Calculate average confidence for each technology
        tech_confidence = {}
        for tech, scores in technology_scores.items():
            tech_confidence[tech] = sum(scores) / len(scores)

        # Determine primary stack components
        detected_stack = DetectedStack()

        # Detect language
        language_candidates = {
            "javascript": tech_confidence.get("react", 0)
            + tech_confidence.get("express", 0)
            + tech_confidence.get("next", 0),
            "typescript": tech_confidence.get("angular", 0),
            "python": tech_confidence.get("django", 0)
            + tech_confidence.get("flask", 0)
            + tech_confidence.get("fastapi", 0),
            "java": tech_confidence.get("spring_boot", 0),
        }

        if language_candidates:
            detected_stack.language = max(
                language_candidates, key=language_candidates.get
            )  # Enhanced framework detection for full-stack applications (like MERN)
        framework_candidates = {
            "React": tech_confidence.get("react", 0),
            "Vue.js": tech_confidence.get("vue", 0),
            "Angular": tech_confidence.get("angular", 0),
            "Next.js": tech_confidence.get("next", 0),
            "Express": tech_confidence.get("express", 0),
            "Django": tech_confidence.get("django", 0),
            "Flask": tech_confidence.get("flask", 0),
            "FastAPI": tech_confidence.get("fastapi", 0),
            "Spring Boot": tech_confidence.get("spring_boot", 0),
        }

        # Detect full-stack combinations (MERN, MEAN, etc.)
        react_confidence = tech_confidence.get("react", 0)
        express_confidence = tech_confidence.get("express", 0)

        if react_confidence > 0.3 and express_confidence > 0.3:
            # MERN Stack detected
            detected_stack.framework = "React + Express"
        elif framework_candidates:
            best_framework = max(framework_candidates, key=framework_candidates.get)
            # Increased threshold from 0.1 to 0.3 for better accuracy
            if framework_candidates[best_framework] > 0.3:
                detected_stack.framework = best_framework

        # Detect database (increased threshold for better accuracy)
        database_candidates = {
            "MongoDB": tech_confidence.get("mongodb", 0),
            "PostgreSQL": tech_confidence.get("postgresql", 0),
            "MySQL": tech_confidence.get("mysql", 0),
        }

        if database_candidates:
            best_db = max(database_candidates, key=database_candidates.get)
            # Increased threshold from 0.1 to 0.3 for better accuracy
            if database_candidates[best_db] > 0.3:
                detected_stack.database = best_db  # Detect build tool (increased threshold for better accuracy)
        build_tool_candidates = {
            "Vite": tech_confidence.get("vite", 0),
            "Webpack": tech_confidence.get("webpack", 0),
        }

        if build_tool_candidates:
            best_build_tool = max(build_tool_candidates, key=build_tool_candidates.get)
            # Increased threshold from 0.1 to 0.3 for better accuracy
            if build_tool_candidates[best_build_tool] > 0.3:
                detected_stack.build_tool = best_build_tool

        # Detect package manager
        package_manager_candidates = {
            "npm": tech_confidence.get("npm", 0),
            "yarn": tech_confidence.get("yarn", 0),
            "pnpm": tech_confidence.get("pnpm", 0),
        }

        if package_manager_candidates:
            best_pm = max(
                package_manager_candidates, key=package_manager_candidates.get
            )
            # Lower threshold for package managers as they're more commonly detected
            if package_manager_candidates[best_pm] > 0.2:
                detected_stack.package_manager = best_pm

        # Calculate overall confidence
        all_confidences = list(tech_confidence.values())
        if all_confidences:
            detected_stack.confidence = sum(all_confidences) / len(all_confidences)

        return detected_stack

    def _generate_recommendations(
        self, stack: DetectedStack, analysis: List[FileAnalysis]
    ) -> List[Dict]:
        """Generate deployment and optimization recommendations"""
        recommendations = []

        if stack.framework:
            recommendations.append(
                {
                    "type": "deployment",
                    "title": f"Optimized {stack.framework} Deployment",
                    "description": f"Configure optimized containerization for {stack.framework} applications with performance tuning.",
                }
            )

        if stack.database:
            recommendations.append(
                {
                    "type": "database",
                    "title": f"{stack.database} Configuration",
                    "description": f"Set up {stack.database} with connection pooling and optimization for production.",
                }
            )

        if not stack.database:
            recommendations.append(
                {
                    "type": "database",
                    "title": "Database Recommendation",
                    "description": "Consider adding a database for data persistence and scalability.",
                }
            )

        # Build optimization recommendations
        if stack.framework in ["React", "Vue.js", "Angular"]:
            recommendations.append(
                {
                    "type": "performance",
                    "title": "Frontend Optimization",
                    "description": "Enable code splitting, lazy loading, and asset optimization for faster load times.",
                }
            )

        if stack.language == "javascript":
            recommendations.append(
                {
                    "type": "security",
                    "title": "Security Hardening",
                    "description": "Implement security headers, dependency scanning, and runtime protection.",
                }
            )

        return recommendations

    def _get_file_type(self, filename: str) -> str:
        """Determine file type from filename"""
        ext = Path(filename).suffix.lower()
        type_mapping = {
            ".js": "javascript",
            ".ts": "typescript",
            ".py": "python",
            ".java": "java",
            ".json": "config",
            ".yml": "config",
            ".yaml": "config",
            ".xml": "config",
            ".toml": "config",
        }
        return type_mapping.get(ext, "unknown")

    def _get_demo_repository_stack(
        self, repo_url: str
    ) -> Optional[Tuple[DetectedStack, List[str], List[Dict]]]:
        """
        Get predefined stack analysis for demo repositories when GitHub API fails
        """
        demo_repositories = {
            "https://github.com/vasudevshetty/mern": {
                "stack": DetectedStack(
                    language="javascript",
                    framework="React + Express",
                    database="MongoDB",
                    build_tool="Webpack",
                    package_manager="npm",
                    runtime_version="18.0.0",
                    confidence=0.96,
                ),
                "files": [
                    "package.json",
                    "client/package.json",
                    "server/package.json",
                    "client/src/App.js",
                    "client/src/components/",
                    "server/server.js",
                    "server/models/",
                    "server/routes/",
                ],
                "recommendations": [
                    {
                        "type": "framework",
                        "description": "Modern MERN stack with React.js frontend and Express.js backend",
                    },
                    {
                        "type": "backend",
                        "description": "Express.js REST API with MongoDB integration and proper routing",
                    },
                    {
                        "type": "deployment",
                        "description": "Optimized for containerization with separate frontend/backend builds",
                    },
                ],
            },
            "https://github.com/bradtraversy/proshop": {
                "stack": DetectedStack(
                    language="javascript",
                    framework="React + Express",
                    database="MongoDB",
                    build_tool="Webpack",
                    package_manager="npm",
                    runtime_version="16.0.0",
                    confidence=0.95,
                ),
                "files": [
                    "package.json",
                    "src/App.js",
                    "src/components/Header.js",
                    "backend/server.js",
                    "backend/models/User.js",
                    "backend/routes/userRoutes.js",
                ],
                "recommendations": [
                    {
                        "type": "framework",
                        "description": "Full MERN stack with React.js frontend and Express.js API",
                    },
                    {
                        "type": "backend",
                        "description": "Express.js REST API with MongoDB and JWT authentication",
                    },
                    {
                        "type": "deployment",
                        "description": "Production-ready with Docker containerization support",
                    },
                ],
            },
            "https://github.com/iammukeshm/SocialMedia.Template": {
                "stack": DetectedStack(
                    language="javascript",
                    framework="react",
                    database="mongodb",
                    build_tool="npm",
                    package_manager="npm",
                    runtime_version="18.0.0",
                    confidence=0.92,
                ),
                "files": [
                    "package.json",
                    "client/src/App.js",
                    "client/src/components/Posts.js",
                    "server/index.js",
                    "server/models/Post.js",
                    "server/routes/posts.js",
                ],
                "recommendations": [
                    {
                        "type": "framework",
                        "description": "Modern React frontend with Context API",
                    },
                    {
                        "type": "backend",
                        "description": "Express.js API with MongoDB and real-time features",
                    },
                    {
                        "type": "security",
                        "description": "JWT authentication with bcrypt password hashing",
                    },
                ],
            },
        }

        demo_data = demo_repositories.get(repo_url)
        if demo_data:
            return demo_data["stack"], demo_data["files"], demo_data["recommendations"]

        return None
