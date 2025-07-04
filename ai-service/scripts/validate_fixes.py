#!/usr/bin/env python3
"""
AI Service Fix Validation Script

Quick test to validate that the main issues have been resolved:
1. LLMResponse has success attribute
2. LLMRequest uses correct message format
3. AnalysisPrompts has dependency_analysis_enhancement method
4. Confidence scores are appropriately low to trigger LLM enhancement
"""

import sys
import os

# Add the ai-service directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def test_llm_models():
    """Test LLM models have correct attributes"""
    try:
        from engines.llm.models import LLMResponse, LLMRequest, LLMProvider

        # Test LLMResponse has success attribute
        response = LLMResponse(
            content="test", provider=LLMProvider.GROQ, model="test-model", success=True
        )
        assert hasattr(response, "success"), "LLMResponse missing success attribute"
        assert response.success == True, "LLMResponse success not working"

        # Test LLMRequest with messages
        request = LLMRequest(messages=[{"role": "user", "content": "test"}])
        assert hasattr(request, "messages"), "LLMRequest missing messages attribute"

        print("✓ LLM Models: PASS")
        return True

    except Exception as e:
        print(f"✗ LLM Models: FAIL - {e}")
        return False


def test_analysis_prompts():
    """Test AnalysisPrompts has required methods"""
    try:
        from engines.prompts.analysis_prompts import AnalysisPrompts

        # Test dependency_analysis_enhancement method exists
        assert hasattr(
            AnalysisPrompts, "dependency_analysis_enhancement"
        ), "AnalysisPrompts missing dependency_analysis_enhancement method"

        assert hasattr(
            AnalysisPrompts, "dependency_enhancement"
        ), "AnalysisPrompts missing dependency_enhancement method"

        print("✓ Analysis Prompts: PASS")
        return True

    except Exception as e:
        print(f"✗ Analysis Prompts: FAIL - {e}")
        return False


def test_confidence_scores():
    """Test that analyzers return low confidence scores"""
    try:
        from engines.analyzers.stack_analyzer import StackAnalyzer
        from engines.analyzers.dependency_analyzer import DependencyAnalyzer
        from engines.analyzers.code_analyzer import CodeAnalyzer

        # Create mock data for testing
        mock_repo_data = {
            "key_files": {
                "package.json": '{"dependencies": {"react": "^18.0.0"}}',
                "app.js": 'import React from "react";',
            },
            "file_tree": ["package.json", "app.js"],
        }

        # Test stack analyzer confidence cap
        stack_analyzer = StackAnalyzer()
        # Test the confidence calculation directly
        confidence = stack_analyzer._calculate_confidence(0.9, 0.8)
        assert confidence <= 0.75, f"Stack analyzer confidence too high: {confidence}"

        print("✓ Confidence Scores: PASS")
        return True

    except Exception as e:
        print(f"✗ Confidence Scores: FAIL - {e}")
        return False


def test_import_structure():
    """Test that imports work correctly"""
    try:
        # Test core imports
        from engines.core.detector import UnifiedDetector
        from engines.core.generator import UnifiedGenerator
        from engines.enhancers.llm_enhancer import LLMEnhancer

        # Test that they can be instantiated
        detector = UnifiedDetector()
        generator = UnifiedGenerator()
        llm_enhancer = LLMEnhancer()

        print("✓ Import Structure: PASS")
        return True

    except Exception as e:
        print(f"✗ Import Structure: FAIL - {e}")
        return False


def main():
    """Run all validation tests"""
    print("=" * 50)
    print("AI Service Fix Validation")
    print("=" * 50)

    tests = [
        test_llm_models,
        test_analysis_prompts,
        test_confidence_scores,
        test_import_structure,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1

    print("=" * 50)
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All fixes validated successfully!")
        return 0
    else:
        print("❌ Some issues remain")
        return 1


if __name__ == "__main__":
    sys.exit(main())
