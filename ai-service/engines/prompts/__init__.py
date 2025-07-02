"""
Prompt Templates Package

Modular prompt templates for different analysis and generation tasks.
Provides structured, reusable prompts for various LLM enhancement scenarios.
"""

from .analysis_prompts import AnalysisPrompts
from .generator_prompts import GeneratorPrompts
from .base_prompts import BasePrompts

__all__ = ['AnalysisPrompts', 'GeneratorPrompts', 'BasePrompts']
