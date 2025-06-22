"""
GitHub Client - Clean interface for GitHub API operations
Focused utility for repository data fetching
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urlparse
import aiohttp
import base64
from config.settings import settings

logger = logging.getLogger(__name__)


class GitHubClient:
    """
    Clean GitHub API client for repository analysis

    Features:
    - Efficient file fetching with size limits
    - Smart file filtering for analysis
    - Rate limit handling
    - Error recovery
    """

    def __init__(self):
        self.base_url = "https://api.github.com"
        self.session = None
        self.rate_limit_remaining = 5000
        self.rate_limit_reset = 0

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            headers=self._get_headers(), timeout=aiohttp.ClientTimeout(total=30)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for GitHub API requests"""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DeployIO-AI-Service/1.0",
        }

        if settings.github_token:
            headers["Authorization"] = f"token {settings.github_token}"

        return headers

    async def fetch_repository_data(
        self, repository_url: str, branch: str = "main"
    ) -> Dict[str, Any]:
        """
        Fetch comprehensive repository data for analysis

        Args:
            repository_url: GitHub repository URL
            branch: Branch to analyze

        Returns:
            Dict containing repository structure and key files
        """
        try:
            owner, repo = self._parse_repository_url(repository_url)

            async with self:
                # Get repository info
                repo_info = await self._get_repository_info(owner, repo)

                # Get file tree
                file_tree = await self._get_file_tree(owner, repo, branch)

                # Get key files content
                key_files = await self._get_key_files_content(
                    owner, repo, branch, file_tree
                )

                # Analyze file structure
                structure_analysis = self._analyze_file_structure(file_tree)

                return {
                    "repository_info": repo_info,
                    "file_tree": file_tree,
                    "key_files": key_files,
                    "structure_analysis": structure_analysis,
                    "total_files": len(file_tree),
                    "analyzed_files": len(key_files),
                    "file_types": structure_analysis["file_types"],
                    "directories": structure_analysis["directories"],
                }

        except Exception as e:
            logger.error(f"Failed to fetch repository data: {e}")
            raise

    async def _get_repository_info(self, owner: str, repo: str) -> Dict:
        """Get basic repository information"""
        url = f"{self.base_url}/repos/{owner}/{repo}"

        async with self.session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "name": data.get("name"),
                    "full_name": data.get("full_name"),
                    "description": data.get("description"),
                    "language": data.get("language"),
                    "size": data.get("size"),
                    "default_branch": data.get("default_branch"),
                    "topics": data.get("topics", []),
                    "license": (
                        data.get("license", {}).get("name")
                        if data.get("license")
                        else None
                    ),
                }
            else:
                logger.warning(f"Could not fetch repo info: {response.status}")
                return {}

    async def _get_file_tree(self, owner: str, repo: str, branch: str) -> List[Dict]:
        """Get repository file tree"""
        url = f"{self.base_url}/repos/{owner}/{repo}/git/trees/{branch}"
        params = {"recursive": "1"}

        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()

                # Filter out large files and binaries
                filtered_files = []
                for item in data.get("tree", []):
                    if (
                        item.get("type") == "blob"
                        and item.get("size", 0) < 100000  # Max 100KB
                        and self._is_text_file(item.get("path", ""))
                    ):
                        filtered_files.append(
                            {
                                "path": item["path"],
                                "size": item.get("size", 0),
                                "url": item.get("url", ""),
                            }
                        )

                # Sort by importance for analysis
                return sorted(
                    filtered_files, key=self._file_importance_score, reverse=True
                )
            else:
                logger.warning(f"Could not fetch file tree: {response.status}")
                return []

    async def _get_key_files_content(
        self, owner: str, repo: str, branch: str, file_tree: List[Dict]
    ) -> Dict[str, str]:
        """Get content of key files for analysis"""
        key_files = {}

        # Identify key files (config files, package files, etc.)
        important_files = [
            f
            for f in file_tree[:50]  # Limit to top 50 files
            if self._is_key_file(f["path"])
        ]

        # Fetch content for key files
        for file_info in important_files:
            try:
                content = await self._get_file_content(
                    owner, repo, branch, file_info["path"]
                )
                if content:
                    key_files[file_info["path"]] = content

                # Avoid rate limiting
                if len(key_files) >= 20:  # Limit to 20 key files
                    break

            except Exception as e:
                logger.debug(f"Could not fetch {file_info['path']}: {e}")
                continue

        return key_files

    async def _get_file_content(
        self, owner: str, repo: str, branch: str, file_path: str
    ) -> Optional[str]:
        """Get content of a specific file"""
        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{file_path}"
        params = {"ref": branch}

        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                if data.get("content"):
                    try:
                        content = base64.b64decode(data["content"]).decode("utf-8")
                        # Limit content size
                        return content[:10000] if len(content) > 10000 else content
                    except UnicodeDecodeError:
                        logger.debug(f"Could not decode {file_path} as UTF-8")
                        return None
            return None

    def _parse_repository_url(self, repository_url: str) -> Tuple[str, str]:
        """
        Parse GitHub repository URL to extract owner and repo

        Handles URLs in formats:
        - https://github.com/owner/repo
        - https://github.com/owner/repo.git
        - git@github.com:owner/repo.git
        - owner/repo
        """
        try:
            # Handle simple owner/repo format
            if (
                "/" in repository_url
                and not repository_url.startswith("http")
                and not repository_url.startswith("git@")
            ):
                path_parts = repository_url.strip("/").split("/")
                if len(path_parts) == 2:
                    return path_parts[0], self._clean_repo_name(path_parts[1])

            # Handle https:// URLs
            if repository_url.startswith("http"):
                parsed = urlparse(repository_url)
                path_parts = parsed.path.strip("/").split("/")

                if len(path_parts) >= 2:
                    owner = path_parts[0]
                    repo = self._clean_repo_name(path_parts[1])
                    return owner, repo

            # Handle git@ URLs
            if repository_url.startswith("git@"):
                # Format: git@github.com:owner/repo.git
                parts = repository_url.split(":")
                if len(parts) == 2:
                    path_parts = parts[1].strip("/").split("/")
                    if len(path_parts) >= 2:
                        owner = path_parts[0]
                        repo = self._clean_repo_name(path_parts[1])
                        return owner, repo

            raise ValueError(f"Could not parse GitHub URL: {repository_url}")
        except Exception as e:
            logger.error(f"Error parsing repository URL '{repository_url}': {e}")
            raise ValueError(f"Invalid repository URL format: {repository_url}")

    def _clean_repo_name(self, repo_name: str) -> str:
        """Remove .git suffix from repository name if present"""
        if repo_name.endswith(".git"):
            return repo_name[:-4]
        return repo_name

    def _is_text_file(self, file_path: str) -> bool:
        """Check if file is likely a text file suitable for analysis"""
        text_extensions = {
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".py",
            ".java",
            ".go",
            ".php",
            ".rb",
            ".rs",
            ".cpp",
            ".c",
            ".h",
            ".cs",
            ".kt",
            ".scala",
            ".json",
            ".yaml",
            ".yml",
            ".xml",
            ".toml",
            ".ini",
            ".cfg",
            ".md",
            ".txt",
            ".dockerfile",
            ".sql",
            ".sh",
            ".bat",
            ".ps1",
            ".html",
            ".css",
            ".scss",
            ".sass",
            ".less",
            ".vue",
            ".svelte",
        }

        # Check extension
        ext = "." + file_path.split(".")[-1].lower() if "." in file_path else ""
        if ext in text_extensions:
            return True

        # Check special files without extensions
        special_files = {
            "dockerfile",
            "makefile",
            "rakefile",
            "gemfile",
            "procfile",
            "license",
            "readme",
            "changelog",
            "contributing",
        }

        filename = file_path.split("/")[-1].lower()
        return filename in special_files

    def _is_key_file(self, file_path: str) -> bool:
        """Check if file is important for technology detection"""
        key_files = {
            # Package managers
            "package.json",
            "package-lock.json",
            "yarn.lock",
            "requirements.txt",
            "setup.py",
            "pyproject.toml",
            "pipfile",
            "pom.xml",
            "build.gradle",
            "build.gradle.kts",
            "composer.json",
            "gemfile",
            "cargo.toml",
            "go.mod",
            # Configuration files
            "dockerfile",
            "docker-compose.yml",
            "docker-compose.yaml",
            ".gitignore",
            ".env",
            ".env.example",
            "makefile",
            "rakefile",
            "gulpfile.js",
            "webpack.config.js",
            "vite.config.js",
            "rollup.config.js",
            "tsconfig.json",
            # Framework-specific
            "next.config.js",
            "nuxt.config.js",
            "vue.config.js",
            "angular.json",
            "ember-cli-build.js",
            "django/settings.py",
            "manage.py",
            "wsgi.py",
            "app.py",
            "main.py",
            "server.js",
            "index.js",
            # Documentation
            "readme.md",
            "readme.txt",
            "changelog.md",
        }

        filename = file_path.lower()
        return any(key in filename for key in key_files)

    def _file_importance_score(self, file_info: Dict) -> int:
        """Calculate importance score for file ordering"""
        path = file_info["path"].lower()
        score = 0

        # High priority files
        high_priority = ["package.json", "requirements.txt", "dockerfile", "pom.xml"]
        if any(priority in path for priority in high_priority):
            score += 100

        # Medium priority files
        medium_priority = ["makefile", "docker-compose", "tsconfig.json"]
        if any(priority in path for priority in medium_priority):
            score += 50

        # Framework files
        framework_files = ["next.config", "vue.config", "angular.json"]
        if any(framework in path for framework in framework_files):
            score += 30

        # Boost for root level files
        if "/" not in path:
            score += 20

        return score

    def _analyze_file_structure(self, file_tree: List[Dict]) -> Dict:
        """Analyze repository file structure"""
        file_types = {}
        directories = set()

        for file_info in file_tree:
            path = file_info["path"]

            # Count file types
            ext = "." + path.split(".")[-1].lower() if "." in path else "no_extension"
            file_types[ext] = file_types.get(ext, 0) + 1

            # Track directories
            if "/" in path:
                dir_parts = path.split("/")[:-1]
                for i in range(len(dir_parts)):
                    directories.add("/".join(dir_parts[: i + 1]))

        return {
            "file_types": file_types,
            "directories": list(directories),
            "total_files": len(file_tree),
            "directory_count": len(directories),
        }

    async def test_connection(self) -> bool:
        """Test GitHub API connection"""
        try:
            async with self:
                url = f"{self.base_url}/rate_limit"
                async with self.session.get(url) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"GitHub connection test failed: {e}")
            return False
