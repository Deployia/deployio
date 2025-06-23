#!/usr/bin/env python3
"""
Test script to verify the fixes for the analysis system
"""

import asyncio
import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.analysis_service import AnalysisService


async def test_dependency_analysis():
    """Test dependency analysis specifically"""
    service = AnalysisService()

    try:
        print("Testing dependency analysis...")
        result = await service.analyze_dependencies(
            repository_url="https://github.com/vasudevshetty/mern",
            branch="main",
            include_reasoning=True,
            explain_null_fields=True,
        )

        print("✅ Dependency analysis completed successfully!")
        print(f"Keys in result: {list(result.keys())}")

        # Check for null fields
        null_fields = []
        for key, value in result.items():
            if value is None:
                null_fields.append(key)
            elif isinstance(value, dict) and not value:
                null_fields.append(f"{key} (empty dict)")
            elif isinstance(value, list) and not value:
                null_fields.append(f"{key} (empty list)")

        if null_fields:
            print(f"⚠️  Found null/empty fields: {null_fields}")
        else:
            print("✅ No null fields detected!")

        return True

    except Exception as e:
        print(f"❌ Dependency analysis failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_full_analysis():
    """Test full repository analysis"""
    service = AnalysisService()

    try:
        print("\nTesting full repository analysis...")
        result = await service.analyze_repository(
            repository_url="https://github.com/vasudevshetty/mern",
            branch="main",
            include_reasoning=True,
            include_recommendations=True,
            include_insights=True,
            explain_null_fields=True,
        )

        print("✅ Full analysis completed successfully!")
        print(f"Analysis confidence: {result.get('confidence_score', 'unknown')}")
        print(f"Analysis approach: {result.get('analysis_approach', 'unknown')}")

        # Check technology stack
        tech_stack = result.get("technology_stack", {})
        if tech_stack and any(tech_stack.values()):
            print(f"✅ Technology stack detected: {tech_stack}")
        else:
            print("⚠️  No technology stack detected")

        # Check dependency analysis
        dep_analysis = result.get("dependency_analysis", {})
        if dep_analysis:
            total_deps = dep_analysis.get("total_dependencies", 0)
            print(f"✅ Dependencies found: {total_deps}")
        else:
            print("⚠️  No dependency analysis data")

        return True

    except Exception as e:
        print(f"❌ Full analysis failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("🔍 Testing Analysis System Fixes")
    print("=" * 50)

    # Test dependency analysis
    dep_success = await test_dependency_analysis()

    # Test full analysis
    full_success = await test_full_analysis()

    print("\n" + "=" * 50)
    if dep_success and full_success:
        print("🎉 All tests passed!")
    else:
        print("❌ Some tests failed")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
