"""
DevOps Pipeline Generator Engine

This module provides AI-powered CI/CD pipeline generation with intelligent
automation, multi-platform support, and production-ready configurations.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict


@dataclass
class PipelineStage:
    """Represents a single pipeline stage"""

    name: str
    description: str
    steps: List[str]
    parallel: bool = False
    environment: Optional[str] = None
    depends_on: List[str] = None
    timeout: int = 30  # minutes
    retry_count: int = 2


@dataclass
class QualityGate:
    """Represents a quality gate with thresholds"""

    name: str
    type: str  # coverage, security, performance, etc.
    threshold: float
    blocking: bool = True
    timeout: int = 10


@dataclass
class EnvironmentConfig:
    """Environment-specific configuration"""

    name: str
    type: str  # development, staging, production
    url: Optional[str] = None
    approval_required: bool = False
    auto_deploy: bool = True
    health_check_url: Optional[str] = None


@dataclass
class PipelineConfig:
    """Complete pipeline configuration"""

    name: str
    platform: str  # github-actions, gitlab-ci, jenkins, etc.
    triggers: List[str]
    stages: List[PipelineStage]
    quality_gates: List[QualityGate]
    environments: List[EnvironmentConfig]
    notifications: Dict[str, Any]
    security_scans: List[str]
    build_optimization: Dict[str, Any]


class PipelineGenerator:
    """AI-powered CI/CD pipeline generator"""

    def __init__(self):
        self.supported_platforms = {
            "github-actions": self._generate_github_actions,
            "gitlab-ci": self._generate_gitlab_ci,
            "jenkins": self._generate_jenkins,
            "azure-devops": self._generate_azure_devops,
            "circleci": self._generate_circleci,
            "bitbucket-pipelines": self._generate_bitbucket_pipelines,
        }

        self.language_configs = {
            "javascript": self._get_js_config,
            "python": self._get_python_config,
            "java": self._get_java_config,
            "go": self._get_go_config,
            "rust": self._get_rust_config,
            "php": self._get_php_config,
            "ruby": self._get_ruby_config,
            "csharp": self._get_csharp_config,
        }

    async def generate_pipeline(
        self,
        stack_info: Dict[str, Any],
        platform: str = "github-actions",
        environments: List[str] = None,
        optimization_level: str = "balanced",
    ) -> Dict[str, Any]:
        """
        Generate a complete CI/CD pipeline configuration

        Args:
            stack_info: Technology stack information
            platform: Target CI/CD platform
            environments: List of environments (dev, staging, prod)
            optimization_level: build optimization level

        Returns:
            Complete pipeline configuration with files and metadata
        """
        try:
            # Extract languages and frameworks
            languages = stack_info.get("languages", ["javascript"])
            frameworks = stack_info.get("frameworks", [])
            databases = stack_info.get("databases", [])
            primary_language = languages[0] if languages else "javascript"

            # Set default environments
            if not environments:
                environments = ["development", "staging", "production"]

            # Generate pipeline configuration
            config = await self._create_pipeline_config(
                primary_language,
                frameworks,
                databases,
                platform,
                environments,
                optimization_level,
            )

            # Generate platform-specific files
            pipeline_files = await self._generate_pipeline_files(config, platform)

            # Calculate pipeline metrics
            metrics = self._calculate_pipeline_metrics(config)

            # Generate deployment strategy
            deployment_strategy = self._generate_deployment_strategy(
                primary_language, frameworks, environments
            )

            return {
                "success": True,
                "pipeline_config": asdict(config),
                "pipeline_files": pipeline_files,
                "metrics": metrics,
                "deployment_strategy": deployment_strategy,
                "platform": platform,
                "optimization_level": optimization_level,
                "estimated_build_time": f"{metrics['estimated_build_time']}m",
                "quality_gates_count": len(config.quality_gates),
                "security_scans_count": len(config.security_scans),
                "environments_count": len(config.environments),
                "recommendations": self._generate_recommendations(config, stack_info),
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Pipeline generation failed: {str(e)}",
                "fallback_config": self._get_basic_pipeline_config(platform),
            }

    async def _create_pipeline_config(
        self,
        language: str,
        frameworks: List[str],
        databases: List[str],
        platform: str,
        environments: List[str],
        optimization_level: str,
    ) -> PipelineConfig:
        """Create comprehensive pipeline configuration"""
        # Get language-specific configuration for future use
        # lang_config = self.language_configs.get(language, self._get_js_config)()

        # Generate stages
        stages = await self._generate_stages(language, frameworks, optimization_level)

        # Generate quality gates
        quality_gates = self._generate_quality_gates(language, frameworks)

        # Generate environment configurations
        env_configs = self._generate_environment_configs(environments)

        # Generate security scans
        security_scans = self._generate_security_scans(language, frameworks)

        # Generate build optimization
        build_optimization = self._generate_build_optimization(
            language, frameworks, optimization_level
        )

        return PipelineConfig(
            name=f"{language}-{platform}-pipeline",
            platform=platform,
            triggers=["push:main", "push:develop", "pull_request"],
            stages=stages,
            quality_gates=quality_gates,
            environments=env_configs,
            notifications={
                "slack": {"enabled": True, "channel": "#deployments"},
                "email": {"enabled": True, "recipients": ["team@company.com"]},
                "github": {"enabled": True, "pr_comments": True},
            },
            security_scans=security_scans,
            build_optimization=build_optimization,
        )

    async def _generate_stages(
        self, language: str, frameworks: List[str], optimization_level: str
    ) -> List[PipelineStage]:
        """Generate pipeline stages based on technology stack"""

        stages = []

        # Code Quality & Linting Stage
        stages.append(
            PipelineStage(
                name="code_quality",
                description="Code quality checks and linting",
                steps=self._get_quality_steps(language, frameworks),
                parallel=True,
                timeout=15,
            )
        )

        # Security Scanning Stage
        stages.append(
            PipelineStage(
                name="security_scan",
                description="Security vulnerability scanning",
                steps=self._get_security_steps(language, frameworks),
                parallel=True,
                depends_on=["code_quality"],
                timeout=20,
            )
        )

        # Build Stage
        stages.append(
            PipelineStage(
                name="build",
                description="Build application and dependencies",
                steps=self._get_build_steps(language, frameworks, optimization_level),
                parallel=False,
                depends_on=["security_scan"],
                timeout=25,
            )
        )

        # Test Stage
        stages.append(
            PipelineStage(
                name="test",
                description="Run comprehensive test suite",
                steps=self._get_test_steps(language, frameworks),
                parallel=True,
                depends_on=["build"],
                timeout=30,
            )
        )

        # Package Stage
        stages.append(
            PipelineStage(
                name="package",
                description="Create deployment packages",
                steps=self._get_package_steps(language, frameworks),
                parallel=False,
                depends_on=["test"],
                timeout=15,
            )
        )

        # Deploy Stage
        stages.append(
            PipelineStage(
                name="deploy",
                description="Deploy to target environments",
                steps=self._get_deploy_steps(language, frameworks),
                parallel=False,
                depends_on=["package"],
                timeout=20,
            )
        )

        return stages

    def _get_quality_steps(self, language: str, frameworks: List[str]) -> List[str]:
        """Generate code quality check steps"""
        steps = ["checkout_code", "setup_environment"]

        if language == "javascript":
            steps.extend(
                ["npm_install", "eslint_check", "prettier_check", "dependency_audit"]
            )
        elif language == "python":
            steps.extend(
                [
                    "install_dependencies",
                    "black_formatting_check",
                    "pylint_analysis",
                    "safety_security_check",
                ]
            )
        elif language == "java":
            steps.extend(
                [
                    "maven_validate",
                    "checkstyle_analysis",
                    "spotbugs_analysis",
                    "dependency_check",
                ]
            )

        return steps

    def _get_security_steps(self, language: str, frameworks: List[str]) -> List[str]:
        """Generate security scanning steps"""
        steps = ["security_baseline_check"]

        if language == "javascript":
            steps.extend(
                ["npm_audit_security", "snyk_vulnerability_scan", "semgrep_sast_scan"]
            )
        elif language == "python":
            steps.extend(
                [
                    "bandit_security_scan",
                    "safety_vulnerability_check",
                    "semgrep_python_scan",
                ]
            )
        elif language == "java":
            steps.extend(
                [
                    "owasp_dependency_check",
                    "spotbugs_security_scan",
                    "sonar_security_analysis",
                ]
            )

        steps.append("container_image_scan")
        return steps

    def _get_build_steps(
        self, language: str, frameworks: List[str], optimization: str
    ) -> List[str]:
        """Generate build steps with optimization"""
        steps = ["setup_build_environment"]

        if optimization == "performance":
            steps.append("enable_build_cache")
            steps.append("configure_parallel_builds")

        if language == "javascript":
            steps.extend(
                [
                    "npm_clean_install",
                    (
                        "webpack_build_production"
                        if optimization == "performance"
                        else "npm_run_build"
                    ),
                    "optimize_assets",
                    "generate_source_maps",
                ]
            )
        elif language == "python":
            steps.extend(
                [
                    "install_build_dependencies",
                    "compile_python_modules",
                    "create_wheel_package",
                    "optimize_bytecode",
                ]
            )
        elif language == "java":
            steps.extend(
                [
                    "maven_clean_compile",
                    "run_unit_tests",
                    "maven_package",
                    "optimize_jar_size",
                ]
            )

        if optimization in ["performance", "balanced"]:
            steps.append("build_docker_image_optimized")
        else:
            steps.append("build_docker_image")

        return steps

    def _get_test_steps(self, language: str, frameworks: List[str]) -> List[str]:
        """Generate comprehensive testing steps"""
        steps = ["prepare_test_environment"]

        if language == "javascript":
            steps.extend(
                [
                    "run_unit_tests_jest",
                    "run_integration_tests",
                    "generate_coverage_report",
                    "run_e2e_tests_cypress",
                ]
            )
        elif language == "python":
            steps.extend(
                [
                    "run_unit_tests_pytest",
                    "run_integration_tests",
                    "generate_coverage_report",
                    "run_api_tests",
                ]
            )
        elif language == "java":
            steps.extend(
                [
                    "run_unit_tests_junit",
                    "run_integration_tests",
                    "generate_jacoco_report",
                    "run_performance_tests",
                ]
            )

        # Add framework-specific tests
        if "react" in frameworks:
            steps.append("run_react_component_tests")
        if "spring" in frameworks:
            steps.append("run_spring_boot_tests")

        steps.extend(["validate_test_coverage", "publish_test_results"])

        return steps

    def _get_package_steps(self, language: str, frameworks: List[str]) -> List[str]:
        """Generate packaging steps"""
        steps = ["prepare_packaging"]

        if language == "javascript":
            steps.extend(
                [
                    "create_production_bundle",
                    "optimize_bundle_size",
                    "create_docker_image",
                    "push_to_registry",
                ]
            )
        elif language == "python":
            steps.extend(
                [
                    "create_python_package",
                    "create_docker_image",
                    "scan_image_vulnerabilities",
                    "push_to_registry",
                ]
            )
        elif language == "java":
            steps.extend(
                [
                    "create_jar_package",
                    "create_docker_image",
                    "optimize_image_layers",
                    "push_to_registry",
                ]
            )

        steps.extend(["sign_artifacts", "create_deployment_manifest"])

        return steps

    def _get_deploy_steps(self, language: str, frameworks: List[str]) -> List[str]:
        """Generate deployment steps"""
        return [
            "prepare_deployment",
            "backup_current_deployment",
            "deploy_to_staging",
            "run_smoke_tests",
            "validate_staging_deployment",
            "deploy_to_production",
            "run_health_checks",
            "validate_production_deployment",
            "notify_deployment_success",
        ]

    def _generate_quality_gates(
        self, language: str, frameworks: List[str]
    ) -> List[QualityGate]:
        """Generate quality gates based on technology stack"""
        gates = [
            QualityGate(
                name="code_coverage",
                type="coverage",
                threshold=80.0,
                blocking=True,
                timeout=10,
            ),
            QualityGate(
                name="security_vulnerabilities",
                type="security",
                threshold=0.0,  # No high/critical vulnerabilities
                blocking=True,
                timeout=15,
            ),
            QualityGate(
                name="code_quality_score",
                type="quality",
                threshold=7.0,  # Out of 10
                blocking=True,
                timeout=10,
            ),
            QualityGate(
                name="performance_benchmark",
                type="performance",
                threshold=500.0,  # Max response time in ms
                blocking=False,
                timeout=20,
            ),
        ]

        # Add language-specific gates
        if language == "javascript":
            gates.append(
                QualityGate(
                    name="bundle_size",
                    type="performance",
                    threshold=2.0,  # Max 2MB
                    blocking=False,
                    timeout=5,
                )
            )

        return gates

    def _generate_environment_configs(
        self, environments: List[str]
    ) -> List[EnvironmentConfig]:
        """Generate environment configurations"""
        configs = []

        for env in environments:
            if env == "development":
                configs.append(
                    EnvironmentConfig(
                        name="development",
                        type="development",
                        url="https://dev.app.com",
                        approval_required=False,
                        auto_deploy=True,
                        health_check_url="https://dev.app.com/health",
                    )
                )
            elif env == "staging":
                configs.append(
                    EnvironmentConfig(
                        name="staging",
                        type="staging",
                        url="https://staging.app.com",
                        approval_required=False,
                        auto_deploy=True,
                        health_check_url="https://staging.app.com/health",
                    )
                )
            elif env == "production":
                configs.append(
                    EnvironmentConfig(
                        name="production",
                        type="production",
                        url="https://app.com",
                        approval_required=True,
                        auto_deploy=False,
                        health_check_url="https://app.com/health",
                    )
                )

        return configs

    def _generate_security_scans(
        self, language: str, frameworks: List[str]
    ) -> List[str]:
        """Generate security scan list"""
        scans = [
            "dependency_vulnerabilities",
            "container_security",
            "secrets_detection",
        ]

        if language == "javascript":
            scans.extend(["npm_audit", "snyk_scan"])
        elif language == "python":
            scans.extend(["bandit_scan", "safety_check"])
        elif language == "java":
            scans.extend(["owasp_check", "spotbugs_security"])

        return scans

    def _generate_build_optimization(
        self, language: str, frameworks: List[str], optimization_level: str
    ) -> Dict[str, Any]:
        """Generate build optimization configuration"""

        base_config = {
            "caching": {"enabled": True, "strategy": "layer_based", "cache_paths": []},
            "parallel_builds": optimization_level in ["performance", "balanced"],
            "incremental_builds": True,
            "compression": True,
        }

        if language == "javascript":
            base_config["caching"]["cache_paths"] = ["node_modules", ".npm", "dist"]
            base_config["webpack_optimization"] = {
                "tree_shaking": True,
                "code_splitting": True,
                "minification": True,
            }
        elif language == "python":
            base_config["caching"]["cache_paths"] = [
                ".pip",
                "__pycache__",
                ".pytest_cache",
            ]
        elif language == "java":
            base_config["caching"]["cache_paths"] = [".m2/repository", "target"]
            base_config["maven_optimization"] = {
                "parallel_builds": True,
                "offline_mode": True,
            }

        if optimization_level == "performance":
            base_config["build_time_optimization"] = {
                "parallel_jobs": 4,
                "memory_allocation": "4GB",
                "cpu_optimization": True,
            }

        return base_config

    async def _generate_pipeline_files(
        self, config: PipelineConfig, platform: str
    ) -> Dict[str, str]:
        """Generate platform-specific pipeline files"""

        if platform not in self.supported_platforms:
            raise ValueError(f"Unsupported platform: {platform}")

        generator_func = self.supported_platforms[platform]
        return await generator_func(config)

    async def _generate_github_actions(self, config: PipelineConfig) -> Dict[str, str]:
        """Generate GitHub Actions workflow files"""

        # Main workflow file
        main_workflow = f"""name: {config.name}

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'

jobs:
  code_quality:
    name: Code Quality & Linting
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup environment
        uses: actions/setup-node@v4
        with:
          node-version: ${{{{ env.NODE_VERSION }}}}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ESLint
        run: npm run lint
        
      - name: Check code formatting
        run: npm run format:check
        
      - name: Security audit
        run: npm audit --audit-level moderate

  security_scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: code_quality
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run security scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: security-results.sarif
          
      - name: Container security scan
        run: |
          docker build -t temp-image .
          trivy image temp-image

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [code_quality, security_scan]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup build cache
        uses: actions/cache@v3
        with:
          path: |
            node_modules
            .npm
          key: ${{{{ runner.os }}}}-build-${{{{ hashFiles('**/package-lock.json') }}}}
          
      - name: Build application
        run: |
          npm ci
          npm run build
          
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: build
    strategy:
      matrix:
        test-type: [unit, integration, e2e]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
          
      - name: Run tests
        run: npm run test:${{{{ matrix.test-type }}}}
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{{{ secrets.CODECOV_TOKEN }}}}

  package:
    name: Package & Registry
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Build Docker image
        run: |
          docker build -t ${{{{ github.repository }}}}:${{{{ github.sha }}}} .
          docker tag ${{{{ github.repository }}}}:${{{{ github.sha }}}} ${{{{ github.repository }}}}:latest
          
      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{{{ secrets.DOCKER_PASSWORD }}}} | docker login -u ${{{{ secrets.DOCKER_USERNAME }}}} --password-stdin
          docker push ${{{{ github.repository }}}}:${{{{ github.sha }}}}
          docker push ${{{{ github.repository }}}}:latest

  deploy_staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: package
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          echo "Deploying to staging..."
          
      - name: Run smoke tests
        run: |
          # Run smoke tests
          curl -f https://staging.app.com/health

  deploy_production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy_staging
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # Deploy to production environment
          echo "Deploying to production..."
          
      - name: Run health checks
        run: |
          # Run comprehensive health checks
          curl -f https://app.com/health
          
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{{{ job.status }}}}
          channel: '#deployments'
          webhook_url: ${{{{ secrets.SLACK_WEBHOOK }}}}
"""

        return {
            ".github/workflows/main.yml": main_workflow,
            ".github/workflows/security.yml": self._generate_security_workflow(),
            ".github/workflows/pr-check.yml": self._generate_pr_workflow(),
        }

    def _generate_security_workflow(self) -> str:
        """Generate dedicated security workflow"""
        return """name: Security Scan

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
  workflow_dispatch:

jobs:
  security:
    name: Security Analysis
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: javascript, python
          
      - name: Run dependency scan
        run: |
          npm audit --audit-level high
          
      - name: Container security scan
        run: |
          docker build -t security-scan .
          trivy image --severity HIGH,CRITICAL security-scan
"""

    def _generate_pr_workflow(self) -> str:
        """Generate pull request validation workflow"""
        return """name: PR Validation

on:
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    name: Validate Changes
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup environment
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
      - name: Check build
        run: npm run build
"""

    async def _generate_gitlab_ci(self, config: PipelineConfig) -> Dict[str, str]:
        """Generate GitLab CI configuration"""

        gitlab_ci = f"""# GitLab CI Pipeline for {config.name}
stages:
  - quality
  - security
  - build
  - test
  - package
  - deploy

variables:
  NODE_VERSION: "18"
  DOCKER_DRIVER: overlay2

# Cache configuration
cache:
  paths:
    - node_modules/
    - .npm/

code_quality:
  stage: quality
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run lint
    - npm run format:check
    - npm audit --audit-level moderate
  artifacts:
    reports:
      codequality: gl-code-quality-report.json

security_scan:
  stage: security
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t temp-image .
    - trivy image temp-image
  dependencies:
    - code_quality

build_app:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  dependencies:
    - security_scan

test_unit:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run test:unit
  coverage: '/Coverage: \\d+\\.\\d+%/'
  artifacts:
    reports:
      junit: test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  dependencies:
    - build_app

package_docker:
  stage: package
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  dependencies:
    - test_unit
  only:
    - main

deploy_staging:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to staging..."
  environment:
    name: staging
    url: https://staging.app.com
  dependencies:
    - package_docker
  only:
    - main

deploy_production:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to production..."
  environment:
    name: production
    url: https://app.com
  when: manual
  dependencies:
    - deploy_staging
  only:
    - main
"""

        return {".gitlab-ci.yml": gitlab_ci}

    async def _generate_jenkins(self, config: PipelineConfig) -> Dict[str, str]:
        """Generate Jenkins pipeline configuration"""

        jenkinsfile = f"""// Jenkins Pipeline for {config.name}
pipeline {{
    agent any
    
    environment {{
        NODE_VERSION = '18'
        DOCKER_REGISTRY = 'your-registry.com'
    }}
    
    stages {{
        stage('Code Quality') {{
            parallel {{
                stage('Linting') {{
                    steps {{
                        script {{
                            sh 'npm ci'
                            sh 'npm run lint'
                        }}
                    }}
                }}
                stage('Format Check') {{
                    steps {{
                        sh 'npm run format:check'
                    }}
                }}
                stage('Security Audit') {{
                    steps {{
                        sh 'npm audit --audit-level moderate'
                    }}
                }}
            }}
        }}
        
        stage('Security Scan') {{
            steps {{
                script {{
                    sh 'docker build -t temp-image .'
                    sh 'trivy image temp-image'
                }}
            }}
        }}
        
        stage('Build') {{
            steps {{
                sh 'npm ci'
                sh 'npm run build'
                archiveArtifacts artifacts: 'dist/**', fingerprint: true
            }}
        }}
        
        stage('Test') {{
            parallel {{
                stage('Unit Tests') {{
                    steps {{
                        sh 'npm run test:unit'
                        publishTestResults testResultsPattern: 'test-results.xml'
                    }}
                }}
                stage('Integration Tests') {{
                    steps {{
                        sh 'npm run test:integration'
                    }}
                }}
            }}
        }}
        
        stage('Package') {{
            when {{
                branch 'main'
            }}
            steps {{
                script {{
                    def image = docker.build("${{DOCKER_REGISTRY}}/app:${{env.BUILD_NUMBER}}")
                    docker.withRegistry('https://${{DOCKER_REGISTRY}}', 'docker-registry-credentials') {{
                        image.push()
                        image.push("latest")
                    }}
                }}
            }}
        }}
        
        stage('Deploy to Staging') {{
            when {{
                branch 'main'
            }}
            steps {{
                echo 'Deploying to staging...'
                // Add deployment logic here
            }}
        }}
        
        stage('Deploy to Production') {{
            when {{
                branch 'main'
            }}
            input {{
                message "Deploy to production?"
                ok "Deploy"
            }}
            steps {{
                echo 'Deploying to production...'
                // Add deployment logic here
            }}
        }}
    }}
    
    post {{
        always {{
            cleanWs()
        }}
        success {{
            slackSend channel: '#deployments',
                     color: 'good',
                     message: "Pipeline succeeded: ${{env.JOB_NAME}} - ${{env.BUILD_NUMBER}}"
        }}
        failure {{
            slackSend channel: '#deployments',
                     color: 'danger',
                     message: "Pipeline failed: ${{env.JOB_NAME}} - ${{env.BUILD_NUMBER}}"
        }}
    }}
}}"""

        return {"Jenkinsfile": jenkinsfile}

    async def _generate_azure_devops(self, config: PipelineConfig) -> Dict[str, str]:
        """Generate Azure DevOps pipeline configuration"""

        azure_pipeline = f"""# Azure DevOps Pipeline for {config.name}
trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18'
  buildConfiguration: 'Release'

stages:
- stage: Quality
  displayName: 'Code Quality'
  jobs:
  - job: CodeQuality
    displayName: 'Code Quality & Linting'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
      displayName: 'Install Node.js'
      
    - script: |
        npm ci
        npm run lint
        npm run format:check
        npm audit --audit-level moderate
      displayName: 'Quality Checks'

- stage: Security
  displayName: 'Security Scanning'
  dependsOn: Quality
  jobs:
  - job: SecurityScan
    displayName: 'Security Analysis'
    steps:
    - script: |
        docker build -t temp-image .
        trivy image temp-image
      displayName: 'Container Security Scan'

- stage: Build
  displayName: 'Build Application'
  dependsOn: Security
  jobs:
  - job: BuildApp
    displayName: 'Build'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
        
    - script: |
        npm ci
        npm run build
      displayName: 'Build Application'
      
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'dist'
        artifactName: 'build-artifacts'

- stage: Test
  displayName: 'Test Suite'
  dependsOn: Build
  jobs:
  - job: TestApp
    displayName: 'Run Tests'
    steps:
    - task: DownloadBuildArtifacts@0
      inputs:
        artifactName: 'build-artifacts'
        downloadPath: '$(System.ArtifactsDirectory)'
        
    - script: |
        npm ci
        npm run test
      displayName: 'Run Tests'
      
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'test-results.xml'

- stage: Deploy
  displayName: 'Deploy Application'
  dependsOn: Test
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployToStaging
    displayName: 'Deploy to Staging'
    environment: 'staging'
    strategy:
      runOnce:
        deploy:
          steps:
          - script: echo "Deploying to staging..."
            displayName: 'Deploy to Staging'
            
  - deployment: DeployToProduction
    displayName: 'Deploy to Production'
    dependsOn: DeployToStaging
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - script: echo "Deploying to production..."
            displayName: 'Deploy to Production'
"""

        return {"azure-pipelines.yml": azure_pipeline}

    async def _generate_circleci(self, config: PipelineConfig) -> Dict[str, str]:
        """Generate CircleCI configuration"""

        circleci_config = f"""# CircleCI Pipeline for {config.name}
version: 2.1

executors:
  node-executor:
    docker:
      - image: circleci/node:18
    working_directory: ~/app

jobs:
  code_quality:
    executor: node-executor
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{{{ checksum "package-lock.json" }}}}
      - run: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{{{ checksum "package-lock.json" }}}}
      - run:
          name: Run linting
          command: npm run lint
      - run:
          name: Check formatting
          command: npm run format:check
      - run:
          name: Security audit
          command: npm audit --audit-level moderate

  security_scan:
    executor: node-executor
    steps:
      - checkout
      - setup_remote_docker
      - run:
          name: Build and scan image
          command: |
            docker build -t temp-image .
            trivy image temp-image

  build:
    executor: node-executor
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{{{ checksum "package-lock.json" }}}}
      - run: npm ci
      - run:
          name: Build application
          command: npm run build
      - persist_to_workspace:
          root: .
          paths:
            - dist

  test:
    executor: node-executor
    steps:
      - checkout
      - attach_workspace:
          at: .
      - restore_cache:
          keys:
            - v1-dependencies-{{{{ checksum "package-lock.json" }}}}
      - run: npm ci
      - run:
          name: Run tests
          command: npm test
      - store_test_results:
          path: test-results
      - store_artifacts:
          path: coverage

  deploy_staging:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Deploy to staging
          command: echo "Deploying to staging..."

  deploy_production:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Deploy to production
          command: echo "Deploying to production..."

workflows:
  version: 2
  build_and_deploy:
    jobs:
      - code_quality
      - security_scan:
          requires:
            - code_quality
      - build:
          requires:
            - security_scan
      - test:
          requires:
            - build
      - deploy_staging:
          requires:
            - test
          filters:
            branches:
              only: main
      - deploy_production:
          requires:
            - deploy_staging
          filters:
            branches:
              only: main
"""

        return {".circleci/config.yml": circleci_config}

    async def _generate_bitbucket_pipelines(
        self, config: PipelineConfig
    ) -> Dict[str, str]:
        """Generate Bitbucket Pipelines configuration"""

        bitbucket_config = f"""# Bitbucket Pipeline for {config.name}
image: node:18

definitions:
  caches:
    nodemodules: node_modules

pipelines:
  default:
    - step:
        name: Code Quality
        caches:
          - nodemodules
        script:
          - npm ci
          - npm run lint
          - npm run format:check
          - npm audit --audit-level moderate

  branches:
    main:
      - step:
          name: Code Quality
          caches:
            - nodemodules
          script:
            - npm ci
            - npm run lint
            - npm run format:check
            - npm audit --audit-level moderate
      - step:
          name: Security Scan
          services:
            - docker
          script:
            - docker build -t temp-image .
            - trivy image temp-image
      - step:
          name: Build
          caches:
            - nodemodules
          script:
            - npm ci
            - npm run build
          artifacts:
            - dist/**
      - step:
          name: Test
          script:
            - npm ci
            - npm test
      - step:
          name: Deploy to Staging
          deployment: staging
          script:
            - echo "Deploying to staging..."
      - step:
          name: Deploy to Production
          deployment: production
          trigger: manual
          script:
            - echo "Deploying to production..."

  pull-requests:
    '**':
      - step:
          name: PR Validation
          caches:
            - nodemodules
          script:
            - npm ci
            - npm run lint
            - npm test
            - npm run build
"""

        return {"bitbucket-pipelines.yml": bitbucket_config}

    def _calculate_pipeline_metrics(self, config: PipelineConfig) -> Dict[str, Any]:
        """Calculate pipeline performance metrics"""

        # Estimate build times based on stages
        stage_times = {
            "code_quality": 3,
            "security_scan": 5,
            "build": 8,
            "test": 12,
            "package": 6,
            "deploy": 10,
        }

        total_time = 0
        parallel_time = 0

        for stage in config.stages:
            stage_time = stage_times.get(stage.name, 5)
            if stage.parallel:
                parallel_time = max(parallel_time, stage_time)
            else:
                total_time += stage_time

        estimated_build_time = total_time + parallel_time

        return {
            "estimated_build_time": estimated_build_time,
            "total_stages": len(config.stages),
            "parallel_stages": len([s for s in config.stages if s.parallel]),
            "quality_gates": len(config.quality_gates),
            "security_scans": len(config.security_scans),
            "environments": len(config.environments),
            "optimization_score": self._calculate_optimization_score(config),
            "reliability_score": self._calculate_reliability_score(config),
        }

    def _calculate_optimization_score(self, config: PipelineConfig) -> float:
        """Calculate pipeline optimization score (0-10)"""
        score = 5.0  # Base score

        # Caching enabled
        if config.build_optimization.get("caching", {}).get("enabled", False):
            score += 1.0

        # Parallel builds
        if config.build_optimization.get("parallel_builds", False):
            score += 1.0

        # Has parallel stages
        parallel_stages = len([s for s in config.stages if s.parallel])
        if parallel_stages > 0:
            score += min(parallel_stages * 0.5, 2.0)

        # Quality gates
        if len(config.quality_gates) >= 3:
            score += 1.0

        return min(score, 10.0)

    def _calculate_reliability_score(self, config: PipelineConfig) -> float:
        """Calculate pipeline reliability score (0-10)"""
        score = 5.0  # Base score

        # Security scans
        if len(config.security_scans) >= 3:
            score += 1.5

        # Multiple environments
        if len(config.environments) >= 2:
            score += 1.0

        # Quality gates with blocking
        blocking_gates = len([g for g in config.quality_gates if g.blocking])
        if blocking_gates >= 2:
            score += 1.5

        # Comprehensive testing
        test_stages = [s for s in config.stages if "test" in s.name.lower()]
        if len(test_stages) >= 1:
            score += 1.0

        return min(score, 10.0)

    def _generate_deployment_strategy(
        self, language: str, frameworks: List[str], environments: List[str]
    ) -> Dict[str, Any]:
        """Generate deployment strategy recommendations"""

        strategy = {
            "type": "blue_green",
            "rollback_strategy": "automatic",
            "health_checks": True,
            "canary_percentage": 10,
            "monitoring": {
                "metrics": ["response_time", "error_rate", "throughput"],
                "alerts": ["high_error_rate", "slow_response", "deployment_failure"],
            },
            "approval_gates": [],
        }

        # Add environment-specific strategies
        for env in environments:
            if env == "production":
                strategy["approval_gates"].append(
                    {
                        "environment": "production",
                        "required_approvers": 2,
                        "manual_approval": True,
                    }
                )

        # Framework-specific recommendations
        if "react" in frameworks or "vue" in frameworks:
            strategy["static_optimization"] = {
                "cdn_deployment": True,
                "asset_optimization": True,
                "caching_strategy": "aggressive",
            }

        if "docker" in frameworks:
            strategy["container_strategy"] = {
                "rolling_update": True,
                "health_check_grace_period": 30,
                "max_unavailable": "25%",
            }

        return strategy

    def _generate_recommendations(
        self, config: PipelineConfig, stack_info: Dict[str, Any]
    ) -> List[str]:
        """Generate pipeline improvement recommendations"""

        recommendations = []

        # Performance recommendations
        if not config.build_optimization.get("parallel_builds", False):
            recommendations.append(
                "Enable parallel builds to reduce pipeline execution time by up to 40%"
            )

        if not config.build_optimization.get("caching", {}).get("enabled", False):
            recommendations.append(
                "Enable build caching to speed up subsequent builds by up to 60%"
            )

        # Security recommendations
        if len(config.security_scans) < 3:
            recommendations.append(
                "Add more security scans (SAST, dependency check, container scan) for better security coverage"
            )

        # Quality recommendations
        blocking_gates = len([g for g in config.quality_gates if g.blocking])
        if blocking_gates < 2:
            recommendations.append(
                "Add blocking quality gates for code coverage and security to prevent issues in production"
            )

        # Environment recommendations
        if len(config.environments) < 3:
            recommendations.append(
                "Consider adding more environments (dev, staging, prod) for better deployment safety"
            )

        # Framework-specific recommendations
        languages = stack_info.get("languages", [])
        if "javascript" in languages:
            recommendations.append(
                "Consider adding bundle size analysis and performance budgets for frontend optimization"
            )

        if "python" in languages:
            recommendations.append(
                "Add dependency scanning with Safety and code quality checks with Pylint"
            )

        return recommendations

    def _get_basic_pipeline_config(self, platform: str) -> Dict[str, Any]:
        """Get basic fallback pipeline configuration"""
        return {
            "platform": platform,
            "stages": ["build", "test", "deploy"],
            "estimated_time": "15m",
            "quality_gates": 2,
            "environments": 2,
        }

    # Language-specific configuration methods
    def _get_js_config(self) -> Dict[str, Any]:
        """JavaScript/Node.js specific configuration"""
        return {
            "package_manager": "npm",
            "build_command": "npm run build",
            "test_command": "npm test",
            "lint_command": "npm run lint",
            "security_audit": "npm audit",
        }

    def _get_python_config(self) -> Dict[str, Any]:
        """Python specific configuration"""
        return {
            "package_manager": "pip",
            "build_command": "python -m build",
            "test_command": "pytest",
            "lint_command": "pylint",
            "security_audit": "safety check",
        }

    def _get_java_config(self) -> Dict[str, Any]:
        """Java specific configuration"""
        return {
            "package_manager": "maven",
            "build_command": "mvn clean package",
            "test_command": "mvn test",
            "lint_command": "mvn checkstyle:check",
            "security_audit": "mvn dependency-check:check",
        }

    def _get_go_config(self) -> Dict[str, Any]:
        """Go specific configuration"""
        return {
            "package_manager": "go mod",
            "build_command": "go build",
            "test_command": "go test",
            "lint_command": "golangci-lint run",
            "security_audit": "gosec ./...",
        }

    def _get_rust_config(self) -> Dict[str, Any]:
        """Rust specific configuration"""
        return {
            "package_manager": "cargo",
            "build_command": "cargo build --release",
            "test_command": "cargo test",
            "lint_command": "cargo clippy",
            "security_audit": "cargo audit",
        }

    def _get_php_config(self) -> Dict[str, Any]:
        """PHP specific configuration"""
        return {
            "package_manager": "composer",
            "build_command": "composer install --no-dev",
            "test_command": "phpunit",
            "lint_command": "phpcs",
            "security_audit": "composer audit",
        }

    def _get_ruby_config(self) -> Dict[str, Any]:
        """Ruby specific configuration"""
        return {
            "package_manager": "bundler",
            "build_command": "bundle install",
            "test_command": "rspec",
            "lint_command": "rubocop",
            "security_audit": "bundler-audit",
        }

    def _get_csharp_config(self) -> Dict[str, Any]:
        """C# specific configuration"""
        return {
            "package_manager": "nuget",
            "build_command": "dotnet build",
            "test_command": "dotnet test",
            "lint_command": "dotnet format --verify-no-changes",
            "security_audit": "dotnet list package --vulnerable",
        }

    async def get_supported_platforms(self) -> List[str]:
        """Get list of supported CI/CD platforms"""
        return list(self.supported_platforms.keys())

    async def get_pipeline_templates(self) -> Dict[str, Any]:
        """Get available pipeline templates"""
        return {
            "basic": "Simple build-test-deploy pipeline",
            "advanced": "Multi-stage pipeline with quality gates",
            "microservices": "Microservices deployment pipeline",
            "mobile": "Mobile app deployment pipeline",
            "machine_learning": "ML model deployment pipeline",
        }
