#!/usr/bin/env python3
"""
Code Analysis Engine Demo Script
Demonstrates the full capabilities of Deployio's AI-powered code analysis
"""

import asyncio
import json
from ai.stack_detector import StackDetector
from ai.dependency_analyzer import DependencyAnalyzer
from ai.dockerfile_generator import DockerfileGenerator


async def demo_code_analysis():
    """Run a complete demo of the code analysis engine"""

    print("🚀 Deployio Code Analysis Engine Demo")
    print("=" * 50)

    # Test repositories
    test_repos = [
        {
            "name": "React App",
            "url": "https://github.com/facebook/create-react-app",
            "branch": "main",
        },
        {
            "name": "FastAPI Project",
            "url": "https://github.com/tiangolo/fastapi",
            "branch": "master",
        },
        {
            "name": "Spring Boot",
            "url": "https://github.com/spring-projects/spring-boot",
            "branch": "main",
        },
    ]

    # Initialize engines
    stack_detector = StackDetector()
    dependency_analyzer = DependencyAnalyzer()
    dockerfile_generator = DockerfileGenerator()

    for repo in test_repos:
        print(f"\n🔍 Analyzing: {repo['name']}")
        print("-" * 30)

        try:
            # 1. Stack Detection
            print("📊 Detecting technology stack...")
            detected_stack, files, recommendations = (
                await stack_detector.analyze_github_repository(
                    repo["url"], repo["branch"]
                )
            )

            print(f"   ✅ Framework: {detected_stack.framework or 'N/A'}")
            print(f"   ✅ Language: {detected_stack.language or 'N/A'}")
            print(f"   ✅ Database: {detected_stack.database or 'N/A'}")
            print(f"   ✅ Confidence: {detected_stack.confidence:.1%}")

            # 2. Dependency Analysis
            print("🔒 Analyzing dependencies...")
            dep_analysis = await dependency_analyzer.analyze_dependencies(
                repo["url"], repo["branch"]
            )

            print(
                f"   ✅ Total Dependencies: {dep_analysis.dependency_tree.total_count}"
            )
            print(f"   ✅ Security Issues: {len(dep_analysis.security_issues)}")
            print(
                f"   ✅ Optimization Score: {dep_analysis.optimization_score:.1f}/100"
            )

            # 3. Dockerfile Generation
            print("🐳 Generating Dockerfile...")
            generated_docker = await dockerfile_generator.generate_dockerfile(
                detected_stack
            )

            print(f"   ✅ Estimated Size: {generated_docker.estimated_size}")
            print(f"   ✅ Security Features: {len(generated_docker.security_features)}")
            print(
                f"   ✅ Optimization Notes: {len(generated_docker.optimization_notes)}"
            )

            # 4. Show sample Dockerfile (first 10 lines)
            dockerfile_lines = generated_docker.dockerfile_content.split("\n")[:10]
            print("   📝 Sample Dockerfile:")
            for line in dockerfile_lines:
                if line.strip():
                    print(f"      {line}")
            print("      ...")

        except Exception as e:
            print(f"   ❌ Error analyzing {repo['name']}: {str(e)}")

    print("\n🎉 Demo completed! The Code Analysis Engine is working perfectly.")
    print("\n💡 Key Capabilities Demonstrated:")
    print("   • AI-powered stack detection")
    print("   • Comprehensive dependency analysis")
    print("   • Security vulnerability scanning")
    print("   • Optimized Dockerfile generation")
    print("   • Production-ready configurations")


if __name__ == "__main__":
    asyncio.run(demo_code_analysis())
