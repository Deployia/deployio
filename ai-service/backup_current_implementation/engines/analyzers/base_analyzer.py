from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAnalyzer(ABC):
    """
    Abstract base class for all analyzers.
    Enforces a standard interface for analysis modules.
    """

    @abstractmethod
    async def analyze(self, repository_data: Dict[str, Any], **kwargs) -> Any:
        """
        Perform analysis on the provided repository data.
        Args:
            repository_data: Dictionary of repository files and metadata.
            kwargs: Additional arguments for specific analyzers.
        Returns:
            Analysis result (type depends on analyzer).
        """
        pass
