"""
Generation Service - Business logic for configuration generation
Handles generation of Docker configs, CI/CD pipelines, and deployment configurations
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable

from engines.generators.dockerfile_generator import DockerfileGenerator
from engines.generators.config_generator import ConfigGenerator
from engines.generators.pipeline_generator import PipelineGenerator
from exceptions import (
    AnalysisException,
)

# Configure logger
logger = logging.getLogger(__name__)


class GenerationService:
    """
    Main generation service handling all configuration generation operations

    This service encapsulates:
    - Docker configuration generation (Dockerfile, docker-compose.yml)
    - CI/CD pipeline generation
    - Deployment configuration generation
    - Progress tracking integration
    """

    def __init__(self):
        self.dockerfile_generator = DockerfileGenerator()
        self.config_generator = ConfigGenerator()
        self.pipeline_generator = PipelineGenerator()
        logger.info("Generation service initialized")

    async def generate_configurations(
        self,
        analysis_result: Dict[str, Any],
        session_id: str,
        config_types: Optional[List[str]] = None,
        user_preferences: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """
        Generate deployment configurations based on analysis results

        Args:
            analysis_result: Results from repository analysis
            session_id: WebSocket session ID for tracking
            config_types: Types of configs to generate (dockerfile, docker_compose, ci_cd)
            user_preferences: User-specified preferences and overrides
            progress_callback: Async callback for progress updates

        Returns:
            Generated configurations with metadata
        """
        logger.info(f"Starting configuration generation for session: {session_id}")

        try:
            # Default config types if not specified
            if config_types is None:
                config_types = ["dockerfile", "docker_compose"]

            # Initialize result structure
            generation_result = {
                "session_id": session_id,
                "generated_at": datetime.utcnow().isoformat(),
                "config_types": config_types,
                "configurations": {},
                "metadata": {
                    "analysis_summary": self._extract_analysis_summary(analysis_result),
                    "user_preferences": user_preferences or {},
                    "generation_details": {},
                },
            }

            # Progress tracking
            total_steps = len(config_types)
            current_step = 0

            # Generate each requested configuration type
            for config_type in config_types:
                current_step += 1
                progress = int((current_step / total_steps) * 80) + 10  # 10-90% range

                if progress_callback:
                    await progress_callback(progress, f"Generating {config_type}...")

                config_result = await self._generate_config_by_type(
                    config_type=config_type,
                    analysis_result=analysis_result,
                    user_preferences=user_preferences,
                    session_id=session_id,
                )

                generation_result["configurations"][config_type] = config_result
                generation_result["metadata"]["generation_details"][config_type] = {
                    "generated_at": datetime.utcnow().isoformat(),
                    "confidence": config_result.get("confidence", 0.85),
                    "customizations_applied": (
                        len(user_preferences.get(config_type, {}))
                        if user_preferences
                        else 0
                    ),
                }

                logger.info(
                    f"Generated {config_type} configuration for session: {session_id}"
                )

            # Final validation and optimization
            if progress_callback:
                await progress_callback(
                    95, "Validating and optimizing configurations..."
                )

            # Cross-validate configurations for compatibility
            validation_result = await self._validate_configurations(
                generation_result["configurations"]
            )
            generation_result["metadata"]["validation"] = validation_result

            # Final progress update
            if progress_callback:
                await progress_callback(100, "Configuration generation completed!")

            logger.info(
                f"Configuration generation completed successfully for session: {session_id}"
            )
            return generation_result

        except Exception as e:
            logger.error(
                f"Configuration generation failed for session {session_id}: {str(e)}",
                exc_info=True,
            )
            if progress_callback:
                await progress_callback(-1, f"Generation failed: {str(e)}")
            raise AnalysisException(f"Configuration generation failed: {str(e)}", 500)

    async def _generate_config_by_type(
        self,
        config_type: str,
        analysis_result: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]],
        session_id: str,
    ) -> Dict[str, Any]:
        """Generate a specific type of configuration"""

        config_preferences = (
            user_preferences.get(config_type, {}) if user_preferences else {}
        )

        if config_type == "dockerfile":
            return await self.dockerfile_generator.generate_dockerfile(
                analysis_result=analysis_result,
                preferences=config_preferences,
                session_id=session_id,
            )
        elif config_type == "docker_compose":
            return await self.config_generator.generate_docker_compose(
                analysis_result=analysis_result,
                preferences=config_preferences,
                session_id=session_id,
            )
        elif config_type == "ci_cd":
            return await self.pipeline_generator.generate_pipeline(
                analysis_result=analysis_result,
                preferences=config_preferences,
                session_id=session_id,
            )
        elif config_type == "k8s":
            return await self.config_generator.generate_kubernetes_configs(
                analysis_result=analysis_result,
                preferences=config_preferences,
                session_id=session_id,
            )
        else:
            raise ValueError(f"Unsupported configuration type: {config_type}")

    def _extract_analysis_summary(
        self, analysis_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract key information from analysis result for generation context"""
        return {
            "tech_stack": analysis_result.get("technology_stack", {}),
            "dependencies": analysis_result.get("dependencies", {}),
            "file_structure": analysis_result.get("file_structure", {}),
            "recommendations": analysis_result.get("recommendations", []),
            "confidence_score": analysis_result.get("confidence_score", 0.0),
        }

    async def _validate_configurations(
        self, configurations: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Cross-validate generated configurations for compatibility"""
        validation_result = {
            "valid": True,
            "warnings": [],
            "errors": [],
            "suggestions": [],
        }

        # Check if Dockerfile and docker-compose are compatible
        if "dockerfile" in configurations and "docker_compose" in configurations:
            dockerfile_config = configurations["dockerfile"]
            compose_config = configurations["docker_compose"]

            # Validate port mappings
            dockerfile_ports = dockerfile_config.get("metadata", {}).get(
                "exposed_ports", []
            )
            compose_ports = compose_config.get("metadata", {}).get("port_mappings", [])

            if dockerfile_ports and compose_ports:
                dockerfile_port_nums = [
                    int(p.split("/")[0]) for p in dockerfile_ports if "/" in p
                ]
                compose_port_nums = [
                    int(p.split(":")[1]) for p in compose_ports if ":" in p
                ]

                if dockerfile_port_nums and compose_port_nums:
                    if not any(
                        port in compose_port_nums for port in dockerfile_port_nums
                    ):
                        validation_result["warnings"].append(
                            "Dockerfile exposes ports that are not mapped in docker-compose.yml"
                        )

        # Add more validation rules as needed

        return validation_result

    async def get_generation_status(self, session_id: str) -> Dict[str, Any]:
        """Get generation status for a session"""
        # This would typically check a session store or database
        # For now, return a basic status structure
        return {
            "session_id": session_id,
            "status": "completed",  # or "in_progress", "failed"
            "progress": 100,
            "message": "Generation completed",
        }


# Create singleton instance
generation_service = GenerationService()
