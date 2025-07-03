"""
Stack Analyzer - Pure rule-based technology stack detection
Detects programming languages, frameworks, databases, and build tools
"""

import logging
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field

from .base_analyzer import BaseAnalyzer, AnalyzerResult
from models.analysis_models import (
    TechnologyStack,
    BuildConfiguration,
    DeploymentConfiguration,
)
from models.common_models import InsightModel

logger = logging.getLogger(__name__)


@dataclass
class StackAnalyzerResult(AnalyzerResult):
    """Result from stack analyzer"""

    technology_stack: TechnologyStack = field(default_factory=TechnologyStack)
    build_configuration: BuildConfiguration = field(default_factory=BuildConfiguration)
    deployment_configuration: DeploymentConfiguration = field(
        default_factory=DeploymentConfiguration
    )


class StackAnalyzer(BaseAnalyzer):
    """
    Rule-based technology stack analyzer

    Detection methods:
    1. Package file analysis (package.json, requirements.txt, etc.)
    2. File structure patterns
    3. Content pattern matching
    4. Build tool detection
    """

    def __init__(self):
        super().__init__()
        self._init_detection_patterns()
        logger.info("StackAnalyzer initialized")

    def _init_detection_patterns(self):
        """Initialize detection patterns for different technologies"""

        # Language patterns by file extensions
        self.language_patterns = {
            "javascript": [".js", ".jsx", ".mjs", ".cjs"],
            "typescript": [".ts", ".tsx"],
            "python": [".py", ".pyw", ".py3"],
            "java": [".java", ".class", ".jar"],
            "php": [".php", ".phtml", ".php3", ".php4", ".php5"],
            "go": [".go"],
            "rust": [".rs"],
            "c": [".c", ".h"],
            "cpp": [".cpp", ".cc", ".cxx", ".hpp"],
            "csharp": [".cs"],
            "ruby": [".rb", ".rbx"],
            "kotlin": [".kt", ".kts"],
            "swift": [".swift"],
            "dart": [".dart"],
        }

        # Framework patterns by file structure and content
        self.framework_patterns = {
            "react": {
                "files": ["package.json"],
                "content_patterns": [
                    r'"react":',
                    r"import.*react",
                    r'from [\'"]react[\'"]',
                ],
                "file_patterns": [".jsx", ".tsx"],
            },
            "vue": {
                "files": ["package.json"],
                "content_patterns": [r'"vue":', r"import.*vue", r"\.vue$"],
                "file_patterns": [".vue"],
            },
            "angular": {
                "files": ["angular.json", "package.json"],
                "content_patterns": [r'"@angular/', r"import.*@angular"],
                "file_patterns": ["angular.json"],
            },
            "express": {
                "files": ["package.json"],
                "content_patterns": [
                    r'"express":',
                    r'require\([\'"]express[\'"]',
                    r"app\.listen",
                ],
            },
            "fastapi": {
                "files": ["requirements.txt", "pyproject.toml"],
                "content_patterns": [r"fastapi", r"from fastapi import", r"@app\."],
            },
            "django": {
                "files": ["requirements.txt", "manage.py", "settings.py"],
                "content_patterns": [
                    r"django",
                    r"from django import",
                    r"DJANGO_SETTINGS_MODULE",
                ],
            },
            "flask": {
                "files": ["requirements.txt"],
                "content_patterns": [r"flask", r"from flask import", r"app = Flask"],
            },
            "spring": {
                "files": ["pom.xml", "build.gradle"],
                "content_patterns": [
                    r"spring-boot",
                    r"@SpringBootApplication",
                    r"@RestController",
                ],
            },
            "laravel": {
                "files": ["composer.json", "artisan"],
                "content_patterns": [r"laravel/framework", r"Illuminate\\"],
            },
            "rails": {
                "files": ["Gemfile", "config/application.rb"],
                "content_patterns": [r"rails", r"class.*< Rails::Application"],
            },
            "nextjs": {
                "files": ["package.json", "next.config.js"],
                "content_patterns": [r'"next":', r"import.*next", r"next/"],
            },
            "nuxtjs": {
                "files": ["package.json", "nuxt.config.js"],
                "content_patterns": [r'"nuxt":', r"export default.*nuxt"],
            },
        }

        # Package manager patterns
        self.package_managers = {
            "npm": ["package.json", "package-lock.json"],
            "yarn": ["yarn.lock", "package.json"],
            "pnpm": ["pnpm-lock.yaml", "package.json"],
            "pip": ["requirements.txt", "Pipfile", "pyproject.toml"],
            "poetry": ["pyproject.toml", "poetry.lock"],
            "maven": ["pom.xml"],
            "gradle": ["build.gradle", "build.gradle.kts"],
            "composer": ["composer.json", "composer.lock"],
            "bundler": ["Gemfile", "Gemfile.lock"],
            "cargo": ["Cargo.toml", "Cargo.lock"],
            "go-modules": ["go.mod", "go.sum"],
        }

        # Database patterns
        self.database_patterns = {
            "postgresql": [r"postgresql", r"psycopg2", r"pg_", r"postgres://"],
            "mysql": [r"mysql", r"pymysql", r"mysql2", r"mysql://"],
            "mongodb": [r"mongodb", r"mongoose", r"pymongo", r"mongodb://"],
            "redis": [r"redis", r"ioredis", r"redis-py", r"redis://"],
            "sqlite": [r"sqlite", r"sqlite3", r"\.db$", r"\.sqlite$"],
            "cassandra": [r"cassandra", r"cqlsh"],
            "dynamodb": [r"dynamodb", r"boto3.*dynamodb"],
            "elasticsearch": [r"elasticsearch", r"elastic"],
        }

        # Build tool patterns
        self.build_tools = {
            "webpack": ["webpack.config.js", "webpack.config.ts"],
            "vite": ["vite.config.js", "vite.config.ts"],
            "rollup": ["rollup.config.js"],
            "parcel": ["package.json"],  # Detected by content
            "babel": [".babelrc", "babel.config.js"],
            "typescript": ["tsconfig.json"],
            "eslint": [".eslintrc.js", ".eslintrc.json"],
            "prettier": [".prettierrc", "prettier.config.js"],
            "docker": ["Dockerfile", "docker-compose.yml"],
            "kubernetes": ["k8s/", "kubernetes/"],
        }

    async def analyze(self, repository_data: Dict[str, Any]) -> StackAnalyzerResult:
        """Analyze technology stack using rule-based detection"""

        result = StackAnalyzerResult()

        try:
            # Step 1: Detect primary language
            language, lang_confidence = self._detect_language(repository_data)

            # Step 2: Detect framework
            framework, framework_confidence = self._detect_framework(
                repository_data, language
            )

            # Step 3: Detect database
            database = self._detect_database(repository_data)

            # Step 4: Detect package manager and build tools
            package_manager = self._detect_package_manager(repository_data)
            build_tool = self._detect_build_tool(repository_data)

            # Step 5: Extract build configuration
            build_config = self._extract_build_configuration(
                repository_data, language, framework
            )

            # Step 6: Extract deployment configuration
            deploy_config = self._extract_deployment_configuration(
                repository_data, framework
            )

            # Step 7: Calculate overall confidence
            overall_confidence = self._calculate_confidence(
                lang_confidence, framework_confidence
            )

            # Step 8: Build technology stack
            tech_stack = TechnologyStack(
                language=language,
                framework=framework,
                database=database,
                confidence=overall_confidence,
                detection_method="rule_based",
                package_manager=package_manager,
                build_tool=build_tool,
                main_entry_point=(
                    build_config.main_entry_points[0]
                    if build_config.main_entry_points
                    else None
                ),
                build_command=(
                    list(build_config.build_commands.values())[0]
                    if build_config.build_commands
                    else None
                ),
                start_command=(
                    list(build_config.start_commands.values())[0]
                    if build_config.start_commands
                    else None
                ),
                install_command=(
                    list(build_config.install_commands.values())[0]
                    if build_config.install_commands
                    else None
                ),
            )

            # Step 9: Generate insights
            insights = self._generate_insights(
                tech_stack, build_config, repository_data
            )

            # Build result
            result.technology_stack = tech_stack
            result.build_configuration = build_config
            result.deployment_configuration = deploy_config
            result.insights = insights
            result.confidence = overall_confidence

            logger.info(
                f"Stack analysis completed: {language}/{framework} (confidence: {overall_confidence:.2f})"
            )

        except Exception as e:
            logger.error(f"Stack analysis failed: {str(e)}", exc_info=True)
            result.error_message = str(e)

        return result

    def _detect_language(
        self, repository_data: Dict[str, Any]
    ) -> Tuple[Optional[str], float]:
        """Detect primary programming language"""

        files = self._get_file_list(repository_data)
        language_counts = {}

        # Count files by language
        for file_path in files:
            for language, extensions in self.language_patterns.items():
                if any(file_path.endswith(ext) for ext in extensions):
                    language_counts[language] = language_counts.get(language, 0) + 1

        if not language_counts:
            return None, 0.0

        # Get primary language
        primary_language = max(language_counts, key=language_counts.get)
        total_files = sum(language_counts.values())
        confidence = language_counts[primary_language] / total_files

        # Boost confidence for package files
        package_file_boost = self._check_package_file_language(
            repository_data, primary_language
        )
        confidence = min(1.0, confidence + package_file_boost)

        return primary_language, confidence

    def _check_package_file_language(
        self, repository_data: Dict[str, Any], language: str
    ) -> float:
        """Check package files to boost language confidence (multi-folder aware)"""

        boost = 0.0

        if language == "javascript" or language == "typescript":
            if self._check_file_exists(repository_data, "package.json"):
                boost += 0.3
        elif language == "python":
            if self._check_file_exists(
                repository_data, "requirements.txt"
            ) or self._check_file_exists(repository_data, "pyproject.toml"):
                boost += 0.3
        elif language == "java":
            if self._check_file_exists(
                repository_data, "pom.xml"
            ) or self._check_file_exists(repository_data, "build.gradle"):
                boost += 0.3
        elif language == "php":
            if self._check_file_exists(repository_data, "composer.json"):
                boost += 0.3
        elif language == "ruby":
            if self._check_file_exists(repository_data, "Gemfile"):
                boost += 0.3
        elif language == "go":
            if self._check_file_exists(repository_data, "go.mod"):
                boost += 0.3
        elif language == "rust":
            if self._check_file_exists(repository_data, "Cargo.toml"):
                boost += 0.3

        return boost

    def _detect_framework(
        self, repository_data: Dict[str, Any], language: Optional[str]
    ) -> Tuple[Optional[str], float]:
        """Detect framework based on language and patterns (multi-folder aware)"""

        if not language:
            return None, 0.0

        framework_scores = {}

        for framework, patterns in self.framework_patterns.items():
            score = 0.0

            # Check required files (multi-folder aware)
            for required_file in patterns.get("files", []):
                if self._check_file_exists(repository_data, required_file):
                    score += 0.4

            # Check content patterns
            content_patterns = patterns.get("content_patterns", [])
            for pattern in content_patterns:
                if self._check_content_pattern(repository_data, pattern):
                    score += 0.3

            # Check file patterns
            file_patterns = patterns.get("file_patterns", [])
            for pattern in file_patterns:
                if self._find_files_by_pattern(repository_data, pattern):
                    score += 0.3

            if score > 0:
                framework_scores[framework] = min(1.0, score)

        if not framework_scores:
            return None, 0.0

        # Get highest scoring framework
        best_framework = max(framework_scores, key=framework_scores.get)
        confidence = framework_scores[best_framework]

        return best_framework, confidence

    def _check_content_pattern(
        self, repository_data: Dict[str, Any], pattern: str
    ) -> bool:
        """Check if pattern exists in any file content"""

        key_files = repository_data.get("key_files", {})

        for file_path, file_data in key_files.items():
            content = ""
            if isinstance(file_data, dict):
                content = file_data.get("content", "")
            else:
                content = str(file_data)

            if re.search(pattern, content, re.IGNORECASE):
                return True

        return False

    def _detect_database(self, repository_data: Dict[str, Any]) -> Optional[str]:
        """Detect database from content patterns"""

        for database, patterns in self.database_patterns.items():
            for pattern in patterns:
                if self._check_content_pattern(repository_data, pattern):
                    return database

        return None

    def _detect_package_manager(self, repository_data: Dict[str, Any]) -> Optional[str]:
        """Detect package manager from files"""

        for manager, files in self.package_managers.items():
            for file_name in files:
                if self._check_file_exists(repository_data, file_name):
                    return manager

        return None

    def _detect_build_tool(self, repository_data: Dict[str, Any]) -> Optional[str]:
        """Detect build tool from configuration files"""

        for tool, files in self.build_tools.items():
            for file_name in files:
                if self._check_file_exists(repository_data, file_name):
                    return tool

        return None

    def _extract_build_configuration(
        self,
        repository_data: Dict[str, Any],
        language: Optional[str],
        framework: Optional[str],
    ) -> BuildConfiguration:
        """Extract build configuration data"""

        config = BuildConfiguration()

        # Extract based on language/framework
        if language == "javascript" or language == "typescript":
            self._extract_node_build_config(repository_data, config)
        elif language == "python":
            self._extract_python_build_config(repository_data, config)
        elif language == "java":
            self._extract_java_build_config(repository_data, config)
        elif language == "go":
            self._extract_go_build_config(repository_data, config)
        elif language == "rust":
            self._extract_rust_build_config(repository_data, config)

        # Extract environment variables
        self._extract_environment_variables(repository_data, config)

        # Extract ports
        self._extract_exposed_ports(repository_data, config)

        return config

    def _extract_node_build_config(
        self, repository_data: Dict[str, Any], config: BuildConfiguration
    ):
        """Extract Node.js build configuration"""

        package_json_content = self._extract_file_content(
            repository_data, "package.json"
        )

        if package_json_content:
            try:
                package_data = json.loads(package_json_content)
                scripts = package_data.get("scripts", {})

                # Extract commands
                if "build" in scripts:
                    config.build_commands["build"] = scripts["build"]
                if "start" in scripts:
                    config.start_commands["start"] = scripts["start"]
                if "dev" in scripts:
                    config.start_commands["dev"] = scripts["dev"]
                if "test" in scripts:
                    config.test_commands["test"] = scripts["test"]

                # Install command
                config.install_commands["install"] = "npm install"

                # Main entry point
                if "main" in package_data:
                    config.main_entry_points.append(package_data["main"])

            except json.JSONDecodeError:
                pass

        # Common Node.js entry points
        common_entries = [
            "src/index.js",
            "src/index.ts",
            "index.js",
            "app.js",
            "server.js",
        ]
        for entry in common_entries:
            if self._check_file_exists(repository_data, entry):
                config.main_entry_points.append(entry)

        # Config files
        config.config_files.extend(["package.json", "package-lock.json"])

    def _extract_python_build_config(
        self, repository_data: Dict[str, Any], config: BuildConfiguration
    ):
        """Extract Python build configuration"""

        # Common Python commands
        config.install_commands["install"] = "pip install -r requirements.txt"

        # Look for common entry points
        common_entries = ["main.py", "app.py", "server.py", "manage.py"]
        for entry in common_entries:
            if self._check_file_exists(repository_data, entry):
                config.main_entry_points.append(entry)

        # Look for FastAPI/Flask patterns
        if self._check_content_pattern(repository_data, r"fastapi"):
            config.start_commands["start"] = (
                "uvicorn main:app --host 0.0.0.0 --port 8000"
            )
        elif self._check_content_pattern(repository_data, r"flask"):
            config.start_commands["start"] = "python app.py"
        elif self._check_content_pattern(repository_data, r"django"):
            config.start_commands["start"] = "python manage.py runserver 0.0.0.0:8000"

        # Config files
        if self._check_file_exists(repository_data, "requirements.txt"):
            config.config_files.append("requirements.txt")
        if self._check_file_exists(repository_data, "pyproject.toml"):
            config.config_files.append("pyproject.toml")

    def _extract_java_build_config(
        self, repository_data: Dict[str, Any], config: BuildConfiguration
    ):
        """Extract Java build configuration"""

        if self._check_file_exists(repository_data, "pom.xml"):
            config.build_commands["build"] = "mvn clean package"
            config.install_commands["install"] = "mvn clean install"
            config.test_commands["test"] = "mvn test"
            config.config_files.append("pom.xml")
        elif self._check_file_exists(repository_data, "build.gradle"):
            config.build_commands["build"] = "./gradlew build"
            config.install_commands["install"] = "./gradlew dependencies"
            config.test_commands["test"] = "./gradlew test"
            config.config_files.append("build.gradle")

        # Look for Spring Boot
        if self._check_content_pattern(repository_data, r"@SpringBootApplication"):
            config.start_commands["start"] = "java -jar target/*.jar"

    def _extract_go_build_config(
        self, repository_data: Dict[str, Any], config: BuildConfiguration
    ):
        """Extract Go build configuration"""

        config.build_commands["build"] = "go build"
        config.install_commands["install"] = "go mod download"
        config.test_commands["test"] = "go test ./..."
        config.start_commands["start"] = "./main"

        # Look for main.go
        if self._check_file_exists(repository_data, "main.go"):
            config.main_entry_points.append("main.go")
        if self._check_file_exists(repository_data, "cmd/main.go"):
            config.main_entry_points.append("cmd/main.go")

        config.config_files.append("go.mod")

    def _extract_rust_build_config(
        self, repository_data: Dict[str, Any], config: BuildConfiguration
    ):
        """Extract Rust build configuration"""

        config.build_commands["build"] = "cargo build --release"
        config.install_commands["install"] = "cargo build"
        config.test_commands["test"] = "cargo test"
        config.start_commands["start"] = "./target/release/main"

        config.main_entry_points.append("src/main.rs")
        config.config_files.append("Cargo.toml")

    def _extract_environment_variables(
        self, repository_data: Dict[str, Any], config: BuildConfiguration
    ):
        """Extract environment variables from .env files"""

        env_content = self._extract_file_content(repository_data, ".env.example")
        if not env_content:
            env_content = self._extract_file_content(repository_data, ".env")

        if env_content:
            for line in env_content.split("\n"):
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    config.environment_variables[key.strip()] = value.strip()

    def _extract_exposed_ports(
        self, repository_data: Dict[str, Any], config: BuildConfiguration
    ):
        """Extract exposed ports from code and configuration"""

        # Check common port patterns in code
        port_patterns = [
            r"port[:\s]*(\d+)",
            r'listen\([\'"]?(\d+)[\'"]?\)',
            r"PORT[:\s]*=?[:\s]*(\d+)",
            r'app\.listen\([\'"]?(\d+)[\'"]?\)',
        ]

        key_files = repository_data.get("key_files", {})
        for file_path, file_data in key_files.items():
            content = ""
            if isinstance(file_data, dict):
                content = file_data.get("content", "")
            else:
                content = str(file_data)

            for pattern in port_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for match in matches:
                    try:
                        port = int(match)
                        if 1000 <= port <= 65535:  # Valid port range
                            config.exposed_ports.append(port)
                    except ValueError:
                        continue

        # Remove duplicates and sort
        config.exposed_ports = sorted(list(set(config.exposed_ports)))

        # Default ports if none found
        if not config.exposed_ports:
            # Add common default ports based on detected technology
            if self._check_content_pattern(repository_data, r"express|nodejs"):
                config.exposed_ports.append(3000)
            elif self._check_content_pattern(repository_data, r"fastapi|flask"):
                config.exposed_ports.append(8000)
            elif self._check_content_pattern(repository_data, r"django"):
                config.exposed_ports.append(8000)
            elif self._check_content_pattern(repository_data, r"spring"):
                config.exposed_ports.append(8080)

    def _extract_deployment_configuration(
        self, repository_data: Dict[str, Any], framework: Optional[str]
    ) -> DeploymentConfiguration:
        """Extract deployment configuration"""

        config = DeploymentConfiguration()

        # Set service name from repository
        repo_name = repository_data.get("repository", {}).get("name", "")
        if repo_name:
            config.service_name = repo_name.lower().replace("_", "-")

        # Determine service type
        if framework in ["express", "fastapi", "flask", "django", "spring"]:
            config.service_type = "api"
        elif framework in ["react", "vue", "angular", "nextjs", "nuxtjs"]:
            config.service_type = "web"
        else:
            config.service_type = "web"

        # Set health check paths
        if framework in ["fastapi"]:
            config.health_check_path = "/health"
            config.readiness_probe_path = "/health"
        elif framework in ["spring"]:
            config.health_check_path = "/actuator/health"
            config.readiness_probe_path = "/actuator/health"
        elif framework in ["express", "flask", "django"]:
            config.health_check_path = "/health"

        return config

    def _calculate_confidence(
        self, lang_confidence: float, framework_confidence: float
    ) -> float:
        """Calculate overall confidence score"""

        # Weight language detection more heavily
        if lang_confidence > 0 and framework_confidence > 0:
            return (lang_confidence * 0.6) + (framework_confidence * 0.4)
        elif lang_confidence > 0:
            return lang_confidence * 0.8  # Penalize missing framework
        elif framework_confidence > 0:
            return framework_confidence * 0.5  # Penalize missing language
        else:
            return 0.0

    def _generate_insights(
        self,
        tech_stack: TechnologyStack,
        build_config: BuildConfiguration,
        repository_data: Dict[str, Any],
    ) -> List[InsightModel]:
        """Generate insights from stack analysis"""

        insights = []

        # Language insights
        if tech_stack.language:
            self._add_insight(
                insights,
                "technology",
                f"{tech_stack.language.title()} Project Detected",
                f"Primary language is {tech_stack.language} with {tech_stack.confidence:.1%} confidence",
                tech_stack.confidence,
                [f"File analysis shows {tech_stack.language} files"],
                "high" if tech_stack.confidence > 0.8 else "medium",
            )

        # Framework insights
        if tech_stack.framework:
            self._add_insight(
                insights,
                "framework",
                f"{tech_stack.framework.title()} Framework",
                f"Using {tech_stack.framework} framework for development",
                tech_stack.confidence,
                [f"Framework patterns detected for {tech_stack.framework}"],
                "high",
            )

        # Build configuration insights
        if build_config.build_commands:
            self._add_insight(
                insights,
                "build",
                "Build Commands Available",
                f"Found {len(build_config.build_commands)} build commands",
                0.9,
                list(build_config.build_commands.values()),
                "medium",
            )

        # Port configuration insights
        if build_config.exposed_ports:
            self._add_insight(
                insights,
                "deployment",
                "Port Configuration",
                f"Application exposes {len(build_config.exposed_ports)} ports",
                0.8,
                [f"Port {port}" for port in build_config.exposed_ports],
                "medium",
            )

        # Database insights
        if tech_stack.database:
            self._add_insight(
                insights,
                "database",
                f"{tech_stack.database.title()} Database",
                f"Using {tech_stack.database} for data storage",
                0.7,
                [f"Database patterns detected for {tech_stack.database}"],
                "medium",
            )

        return insights
