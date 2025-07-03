"""
Base Analyzer - Abstract base class for all analyzers
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from dataclasses import dataclass, field
from models.common_models import InsightModel


@dataclass
class AnalyzerResult:
    """Base result from any analyzer"""

    insights: list[InsightModel] = field(default_factory=list)
    confidence: float = 0.0
    processing_time: float = 0.0
    error_message: str = ""


class BaseAnalyzer(ABC):
    """
    Abstract base class for all analyzers

    All analyzers should be pure rule-based - no LLM calls
    Each analyzer focuses on a single responsibility
    """

    def __init__(self):
        self.analyzer_name = self.__class__.__name__

    @abstractmethod
    async def analyze(self, repository_data: Dict[str, Any]) -> AnalyzerResult:
        """
        Perform analysis on repository data

        Args:
            repository_data: Repository data from server

        Returns:
            AnalyzerResult: Analysis results specific to this analyzer
        """
        pass

    def _extract_file_content(
        self, repository_data: Dict[str, Any], file_path: str
    ) -> str:
        """Extract content of a specific file from repository data"""
        key_files = repository_data.get("key_files", {})

        # Direct match
        if file_path in key_files:
            file_data = key_files[file_path]
            if isinstance(file_data, dict):
                return file_data.get("content", "")
            return str(file_data)

        # Find by filename (for nested files)
        for existing_path, file_data in key_files.items():
            if (
                existing_path.endswith(file_path)
                or existing_path.split("/")[-1] == file_path
            ):
                if isinstance(file_data, dict):
                    return file_data.get("content", "")
                return str(file_data)

        return ""

    def _get_file_list(self, repository_data: Dict[str, Any]) -> list[str]:
        """Get list of all files in repository"""
        file_tree = repository_data.get("file_tree", [])

        files = []
        for item in file_tree:
            if isinstance(item, dict):
                if item.get("type") == "blob":
                    files.append(item.get("path", ""))
            else:
                files.append(str(item))

        return files

    def _check_file_exists(
        self, repository_data: Dict[str, Any], file_path: str
    ) -> bool:
        """Check if a file exists in the repository and has content"""
        # First check if file exists in key_files (has content)
        key_files = repository_data.get("key_files", {})
        if file_path in key_files:
            return True

        # Check for file with content in key_files (case-insensitive and path-aware)
        for existing_path in key_files.keys():
            if (
                existing_path.endswith(file_path)
                or existing_path.split("/")[-1] == file_path
            ):
                return True

        # Fallback: check file tree
        files = self._get_file_list(repository_data)
        return file_path in files or any(f.endswith(file_path) for f in files)

    def _find_files_by_pattern(
        self, repository_data: Dict[str, Any], pattern: str
    ) -> list[str]:
        """Find files matching a pattern"""
        files = self._get_file_list(repository_data)
        matching_files = []

        for file_path in files:
            if pattern in file_path or file_path.endswith(pattern):
                matching_files.append(file_path)

        return matching_files

    def _add_insight(
        self,
        insights: list[InsightModel],
        category: str,
        title: str,
        description: str,
        confidence: float,
        evidence: list[str] = None,
        impact: str = "medium",
    ):
        """Helper to add insights"""
        insights.append(
            InsightModel(
                category=category,
                title=title,
                description=description,
                confidence=confidence,
                evidence=evidence or [],
                impact=impact,
            )
        )
