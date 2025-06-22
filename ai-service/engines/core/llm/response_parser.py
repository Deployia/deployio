"""
LLM Response Parser - Handles parsing and cleaning of LLM responses
"""

import logging
import json
import re
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class LLMResponseParser:
    """Handles parsing and cleaning of LLM responses with robust error handling"""

    @staticmethod
    def clean_json_response(response_text: str) -> str:
        """
        Clean LLM response to extract valid JSON

        Handles common issues:
        - Markdown code blocks
        - Extra text before/after JSON
        - Malformed JSON syntax
        """
        if not response_text:
            logger.error("Empty response text provided")
            return "{}"

        try:
            # Remove markdown code blocks
            response_text = re.sub(r"```json\s*", "", response_text)
            response_text = re.sub(r"```\s*$", "", response_text)
            response_text = re.sub(r"```", "", response_text)

            # Find JSON-like content between { and }
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                logger.warning(
                    "No JSON structure found in response, trying to extract key-value pairs"
                )
                json_text = LLMResponseParser._extract_key_value_pairs(response_text)

            # Clean up common JSON issues
            json_text = LLMResponseParser._fix_json_syntax(json_text)

            # Validate JSON
            json.loads(json_text)  # This will raise an exception if invalid

            logger.debug(f"Successfully cleaned JSON: {json_text[:200]}...")
            return json_text

        except Exception as e:
            logger.error(f"Failed to clean JSON response: {e}")
            logger.error(f"Original response: {response_text[:500]}...")
            return LLMResponseParser._create_fallback_json(response_text)

    @staticmethod
    def _extract_key_value_pairs(text: str) -> str:
        """Extract key-value pairs from unstructured text"""
        try:
            # Look for key: value patterns
            pairs = {}

            # Common patterns to extract
            patterns = [
                r'"?language"?\s*:\s*"?([^",\n]+)"?',
                r'"?framework"?\s*:\s*"?([^",\n]+)"?',
                r'"?database"?\s*:\s*"?([^",\n]+)"?',
                r'"?confidence"?\s*:\s*([0-9.]+)',
                r'"?recommendations"?\s*:\s*\[(.*?)\]',
            ]

            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    key = pattern.split('"?')[1].split('"?')[0]
                    value = match.group(1).strip()
                    pairs[key] = value
            return json.dumps(pairs) if pairs else "{}"

        except Exception as e:
            logger.error(f"Failed to extract key-value pairs: {e}")
            return "{}"

    @staticmethod
    def _fix_json_syntax(json_text: str) -> str:
        """Fix common JSON syntax issues"""
        try:
            # Remove trailing commas
            json_text = re.sub(r",\s*}", "}", json_text)
            json_text = re.sub(r",\s*]", "]", json_text)

            # Fix unquoted keys (but be careful not to break quoted strings)
            # Only fix keys that are clearly unquoted identifiers
            json_text = re.sub(
                r"(\n\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:", r'\1"\2":', json_text
            )

            # Remove comments
            json_text = re.sub(r"//.*?\n", "\n", json_text)

            # Handle truncated responses by ensuring proper closure
            if json_text.count("{") > json_text.count("}"):
                json_text += "}"
            if json_text.count("[") > json_text.count("]"):
                json_text += "]"

            return json_text.strip()

        except Exception as e:
            logger.error(f"Failed to fix JSON syntax: {e}")
            return json_text

    @staticmethod
    def _create_fallback_json(original_text: str) -> str:
        """Create fallback JSON when parsing fails"""
        return json.dumps(
            {
                "error": "Failed to parse LLM response",
                "original_text": (
                    original_text[:200] + "..."
                    if len(original_text) > 200
                    else original_text
                ),
                "language": "unknown",
                "framework": "unknown",
                "confidence": 0.1,
                "recommendations": [],
            }
        )

    @staticmethod
    def parse_technology_detection(
        response_text: str, fallback_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Parse technology detection response from LLM

        Args:
            response_text: Raw LLM response
            fallback_data: Fallback data if parsing fails

        Returns:
            Parsed technology data with safety checks
        """
        try:
            # Clean and parse JSON
            clean_json = LLMResponseParser.clean_json_response(response_text)
            data = json.loads(clean_json)

            # Validate required fields with safety checks
            result = {
                "language": LLMResponseParser._safe_get(data, "language", "unknown"),
                "framework": LLMResponseParser._safe_get(data, "framework", "unknown"),
                "database": LLMResponseParser._safe_get(data, "database", None),
                "confidence": float(
                    LLMResponseParser._safe_get(data, "confidence", 0.5)
                ),
                "additional_technologies": LLMResponseParser._safe_get_list(
                    data, "additional_technologies"
                ),
                "reasoning": LLMResponseParser._safe_get(
                    data, "reasoning", "LLM technology detection"
                ),
                "architecture_pattern": LLMResponseParser._safe_get(
                    data, "architecture_pattern", None
                ),
            }

            # Validate confidence range
            result["confidence"] = max(0.0, min(1.0, result["confidence"]))

            logger.debug(f"Successfully parsed technology detection: {result}")
            return result

        except Exception as e:
            logger.error(f"Failed to parse technology detection: {e}")
            logger.error(
                f"FALLBACK TRIGGERED: Technology detection parsing failed - {str(e)}"
            )

            # Return fallback data or minimal structure
            return fallback_data or {
                "language": "unknown",
                "framework": "unknown",
                "database": None,
                "confidence": 0.1,
                "additional_technologies": [],
                "reasoning": "Failed to parse LLM response",
                "architecture_pattern": None,
            }

    @staticmethod
    def parse_optimization_response(
        response_text: str, fallback_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Parse optimization recommendations from LLM

        Args:
            response_text: Raw LLM response
            fallback_data: Fallback data if parsing fails

        Returns:
            Parsed optimization data with safety checks
        """
        try:
            # Clean and parse JSON
            clean_json = LLMResponseParser.clean_json_response(response_text)
            data = json.loads(clean_json)

            # Validate and extract optimization data
            result = {
                "recommendations": LLMResponseParser._safe_get_list(
                    data, "recommendations"
                ),
                "additional_insights": LLMResponseParser._safe_get_list(
                    data, "additional_insights"
                ),
                "confidence_boost": float(
                    LLMResponseParser._safe_get(data, "confidence_boost", 0.1)
                ),
                "reasoning": LLMResponseParser._safe_get(
                    data, "reasoning", "LLM optimization analysis"
                ),
                "deployment_strategy": LLMResponseParser._safe_get(
                    data, "deployment_strategy", None
                ),
                "best_practices": LLMResponseParser._safe_get_list(
                    data, "best_practices"
                ),
            }

            # Validate confidence boost range
            result["confidence_boost"] = max(0.0, min(0.5, result["confidence_boost"]))

            logger.debug(
                f"Successfully parsed optimization response: {len(result['recommendations'])} recommendations"
            )
            return result

        except Exception as e:
            logger.error(f"Failed to parse optimization response: {e}")
            logger.error(f"FALLBACK TRIGGERED: Optimization parsing failed - {str(e)}")

            # Return fallback data or minimal structure
            return fallback_data or {
                "recommendations": [],
                "additional_insights": [],
                "confidence_boost": 0.05,
                "reasoning": "Failed to parse LLM optimization response",
                "deployment_strategy": None,
                "best_practices": [],
            }

    @staticmethod
    def parse_comprehensive_response(
        response_text: str, fallback_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Parse comprehensive analysis response from LLM

        Args:
            response_text: Raw LLM response
            fallback_data: Fallback data if parsing fails

        Returns:
            Parsed comprehensive analysis data
        """
        try:
            # Clean and parse JSON
            clean_json = LLMResponseParser.clean_json_response(response_text)
            data = json.loads(clean_json)

            # Validate and extract comprehensive data
            result = {
                "technology_stack": {
                    "language": LLMResponseParser._safe_get(
                        data.get("technology_stack", {}), "language", "unknown"
                    ),
                    "framework": LLMResponseParser._safe_get(
                        data.get("technology_stack", {}), "framework", "unknown"
                    ),
                    "database": LLMResponseParser._safe_get(
                        data.get("technology_stack", {}), "database", None
                    ),
                    "additional_technologies": LLMResponseParser._safe_get_list(
                        data.get("technology_stack", {}), "additional_technologies"
                    ),
                    "architecture_pattern": LLMResponseParser._safe_get(
                        data.get("technology_stack", {}), "architecture_pattern", None
                    ),
                },
                "confidence": float(
                    LLMResponseParser._safe_get(data, "confidence", 0.5)
                ),
                "recommendations": LLMResponseParser._safe_get_list(
                    data, "recommendations"
                ),
                "additional_insights": LLMResponseParser._safe_get_list(
                    data, "additional_insights"
                ),
                "reasoning": LLMResponseParser._safe_get(
                    data, "reasoning", "Comprehensive LLM analysis"
                ),
                "confidence_boost": float(
                    LLMResponseParser._safe_get(data, "confidence_boost", 0.1)
                ),
            }

            # Validate confidence ranges
            result["confidence"] = max(0.0, min(1.0, result["confidence"]))
            result["confidence_boost"] = max(0.0, min(0.5, result["confidence_boost"]))

            logger.debug("Successfully parsed comprehensive response")
            return result

        except Exception as e:
            logger.error(f"Failed to parse comprehensive response: {e}")
            logger.error(f"FALLBACK TRIGGERED: Comprehensive parsing failed - {str(e)}")

            # Return fallback data or minimal structure
            return fallback_data or {
                "technology_stack": {
                    "language": "unknown",
                    "framework": "unknown",
                    "database": None,
                    "additional_technologies": [],
                    "architecture_pattern": None,
                },
                "confidence": 0.1,
                "recommendations": [],
                "additional_insights": [],
                "reasoning": "Failed to parse comprehensive LLM response",
                "confidence_boost": 0.05,
            }

    @staticmethod
    def _safe_get(data: Dict[str, Any], key: str, default: Any = None) -> Any:
        """Safely get value from dictionary with type checking"""
        try:
            value = data.get(key, default)
            return value if value is not None else default
        except Exception:
            return default

    @staticmethod
    def _safe_get_list(data: Dict[str, Any], key: str, default: List = None) -> List:
        """Safely get list value from dictionary with validation"""
        try:
            value = data.get(key, default or [])
            if isinstance(value, list):
                return value
            elif isinstance(value, str):
                # Try to parse as comma-separated values
                return [item.strip() for item in value.split(",") if item.strip()]
            else:
                return default or []
        except Exception:
            return default or []

    @staticmethod
    def validate_response_structure(
        data: Dict[str, Any], required_fields: List[str]
    ) -> bool:
        """Validate that response has required structure"""
        try:
            for field in required_fields:
                if field not in data:
                    logger.warning(f"Missing required field: {field}")
                    return False
            return True
        except Exception as e:
            logger.error(f"Failed to validate response structure: {e}")
            return False
