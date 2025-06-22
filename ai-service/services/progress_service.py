"""
Universal Progress Tracking Service
Reusable across all DeployIO services (analysis, optimization, generators, etc.)
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass

from engines.core.models import ProgressStatus


@dataclass
class ProgressStep:
    """Individual progress step definition"""

    step_id: str
    name: str
    description: str
    weight: float = 1.0  # Relative weight for progress calculation


@dataclass
class ProgressUpdate:
    """Progress update information"""

    operation_id: str
    step_id: str
    step_name: str
    step_number: int
    total_steps: int
    percentage: float
    status: ProgressStatus
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


class ProgressTracker:
    """Tracks progress for a single operation"""

    def __init__(
        self,
        operation_id: str,
        operation_type: str,
        steps: List[ProgressStep],
        callback: Optional[Callable] = None,
    ):
        self.operation_id = operation_id
        self.operation_type = operation_type
        self.steps = steps
        self.callback = callback
        self.current_step_index = 0
        self.start_time = datetime.now()
        self.status = ProgressStatus.PENDING
        self.total_weight = sum(step.weight for step in steps)

    async def start(self, message: str = "Operation started"):
        """Start the operation"""
        self.status = ProgressStatus.RUNNING
        await self._send_update(message)

    async def next_step(self, message: str = ""):
        """Move to the next step"""
        if self.current_step_index < len(self.steps):
            step = self.steps[self.current_step_index]
            await self._send_update(message or f"Starting {step.name}")
            self.current_step_index += 1

    async def update_current_step(self, message: str, details: Optional[Dict] = None):
        """Update current step with new message"""
        await self._send_update(message, details)

    async def complete(self, message: str = "Operation completed successfully"):
        """Mark operation as completed"""
        self.status = ProgressStatus.COMPLETED
        await self._send_update(message, percentage=100.0)

    async def fail(self, message: str, error: Optional[Exception] = None):
        """Mark operation as failed"""
        self.status = ProgressStatus.FAILED
        details = {"error": str(error)} if error else None
        await self._send_update(message, details)

    async def _send_update(
        self,
        message: str,
        details: Optional[Dict] = None,
        percentage: Optional[float] = None,
    ):
        """Send progress update"""
        # Calculate percentage if not provided
        if percentage is None:
            completed_weight = sum(
                self.steps[i].weight
                for i in range(min(self.current_step_index, len(self.steps)))
            )
            percentage = (completed_weight / self.total_weight) * 100

        current_step = self.steps[min(self.current_step_index, len(self.steps) - 1)]

        update = ProgressUpdate(
            operation_id=self.operation_id,
            step_id=current_step.step_id,
            step_name=current_step.name,
            step_number=self.current_step_index + 1,
            total_steps=len(self.steps),
            percentage=percentage,
            status=self.status,
            message=message,
            details=details,
        )

        if self.callback:
            await self.callback(update)


class ProgressService:
    """Universal progress tracking service"""

    def __init__(self):
        self.active_operations: Dict[str, ProgressTracker] = {}
        self.operation_history: Dict[str, List[ProgressUpdate]] = {}

    def create_operation(
        self,
        operation_type: str,
        steps: List[ProgressStep],
        callback: Optional[Callable] = None,
    ) -> str:
        """Create a new tracked operation"""
        operation_id = str(uuid.uuid4())

        tracker = ProgressTracker(
            operation_id=operation_id,
            operation_type=operation_type,
            steps=steps,
            callback=callback,
        )

        self.active_operations[operation_id] = tracker
        self.operation_history[operation_id] = []

        return operation_id

    def get_tracker(self, operation_id: str) -> Optional[ProgressTracker]:
        """Get tracker for an operation"""
        return self.active_operations.get(operation_id)

    def get_progress(self, operation_id: str) -> Optional[ProgressUpdate]:
        """Get current progress for an operation"""
        history = self.operation_history.get(operation_id, [])
        return history[-1] if history else None

    def get_history(self, operation_id: str) -> List[ProgressUpdate]:
        """Get full progress history for an operation"""
        return self.operation_history.get(operation_id, [])

    def cleanup_operation(self, operation_id: str):
        """Clean up completed operation"""
        if operation_id in self.active_operations:
            del self.active_operations[operation_id]
        # Keep history for a while for debugging

    def get_active_operations(self) -> Dict[str, str]:
        """Get list of active operations"""
        return {
            op_id: tracker.operation_type
            for op_id, tracker in self.active_operations.items()
        }

    def get_health_status(self) -> dict:
        """Return health status for progress service."""
        return {
            "service": "progress_service",
            "status": "healthy",
            "active_operations": len(self.active_operations),
        }


# Predefined step templates for common operations
class OperationSteps:
    """Predefined step templates for different operation types"""

    @staticmethod
    def analysis_steps() -> List[ProgressStep]:
        """Steps for repository analysis"""
        return [
            ProgressStep("init", "Initialization", "Setting up analysis environment"),
            ProgressStep("fetch", "Repository Fetch", "Fetching repository contents"),
            ProgressStep("stack", "Stack Detection", "Analyzing technology stack"),
            ProgressStep(
                "dependencies", "Dependency Analysis", "Analyzing dependencies"
            ),
            ProgressStep("code", "Code Analysis", "Analyzing code quality"),
            ProgressStep(
                "insights",
                "Insight Generation",
                "Generating insights and recommendations",
            ),
            ProgressStep("finalize", "Finalization", "Finalizing analysis results"),
        ]

    @staticmethod
    def optimization_steps() -> List[ProgressStep]:
        """Steps for optimization operations"""
        return [
            ProgressStep("analyze", "Analysis", "Analyzing current state"),
            ProgressStep(
                "identify", "Identification", "Identifying optimization opportunities"
            ),
            ProgressStep("plan", "Planning", "Creating optimization plan"),
            ProgressStep("implement", "Implementation", "Implementing optimizations"),
            ProgressStep("validate", "Validation", "Validating optimization results"),
        ]

    @staticmethod
    def generation_steps() -> List[ProgressStep]:
        """Steps for generation operations"""
        return [
            ProgressStep("prepare", "Preparation", "Preparing generation context"),
            ProgressStep("generate", "Generation", "Generating content"),
            ProgressStep("refine", "Refinement", "Refining generated content"),
            ProgressStep("validate", "Validation", "Validating generated content"),
        ]


# Global progress service instance
progress_service = ProgressService()
