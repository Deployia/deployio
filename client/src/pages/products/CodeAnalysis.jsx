import React, { useState } from "react";
import {
  FaSearchPlus,
  FaLayerGroup,
  FaDocker,
  FaCog,
  FaCode,
  FaBrain,
  FaRocket,
  FaGithub,
  FaEye,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  ProductHero,
  StickyFeaturesSection,
  ProductStats,
  ProductCTA,
  ProductDemo,
} from "@components/products";

const CodeAnalysis = () => {
  const [demoData, setDemoData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    {
      icon: FaSearchPlus,
      title: "Smart Stack Detection",
      description:
        "AI automatically identifies your technology stack from repository structure and dependencies",
      details:
        "Our AI analyzes package.json, requirements.txt, Gemfile, pom.xml and other config files to accurately detect your tech stack with 96% accuracy. We support over 50+ different technology stacks and frameworks.",
      platforms: [
        "MERN",
        "Django",
        "Flask",
        "Spring Boot",
        "Laravel",
        "Ruby on Rails",
        "Next.js",
        "Vue.js",
      ],
    },
    {
      icon: FaLayerGroup,
      title: "Dependency Analysis",
      description:
        "Deep analysis of your project dependencies and their optimal configurations",
      details:
        "Comprehensive dependency mapping with version compatibility checks, security vulnerability scanning, and optimization recommendations. Get insights into your entire dependency tree.",
      platforms: [
        "Node.js",
        "Python",
        "Java",
        "PHP",
        "Ruby",
        "Go",
        "Maven",
        "Gradle",
      ],
    },
    {
      icon: FaDocker,
      title: "Configuration Generation",
      description:
        "Generate production-ready Dockerfiles and deployment configurations automatically",
      details:
        "AI creates optimized multi-stage Dockerfiles with security best practices, environment-specific configurations, and performance optimizations tailored to your stack.",
      platforms: [
        "Docker",
        "Kubernetes",
        "Docker Compose",
        "CI/CD",
        "Multi-stage Builds",
        "Security Scanning",
      ],
    },
    {
      icon: FaCog,
      title: "Build Optimization",
      description:
        "Optimize build processes and deployment strategies for your specific stack",
      details:
        "Intelligent build optimization with caching strategies, parallel processing, and minimal image sizes for faster deployments. Reduce build times by up to 70%.",
      platforms: [
        "Webpack",
        "Vite",
        "Maven",
        "Gradle",
        "npm",
        "pip",
        "Caching",
        "Parallel Builds",
      ],
    },
  ];

  const stats = [
    { label: "Stacks Detected", value: "50+", icon: FaCode },
    { label: "Detection Accuracy", value: "96%", icon: FaBrain },
    { label: "Configuration Success", value: "99.2%", icon: FaCog },
    { label: "Time Saved", value: "85%", icon: FaRocket },
  ];

  const demoStackAnalysis = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setDemoData({
        detectedStack: "MERN Stack",
        confidence: 96,
        dependencies: 24,
        devDependencies: 12,
        securityIssues: 0,
        optimizationScore: 87,
        buildTime: "2.3s",
        recommendations: 5,
      });
    } catch (error) {
      console.error("Demo error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const heroProps = {
    badge: {
      icon: FaBrain,
      text: "AI-Powered Stack Detection",
    },
    title: "Analyze Code,",
    subtitle: "Deploy Smarter",
    description:
      "Let AI understand your codebase automatically. Our intelligent analysis detects technology stacks, analyzes dependencies, and generates optimal deployment configurations.",
    primaryCTA: {
      text: "Analyze Repository",
      icon: FaGithub,
      onClick: () => console.log("Analyze repository"),
    },
    secondaryCTA: {
      text: "Try Demo",
      icon: FaEye,
      onClick: demoStackAnalysis,
      loading: isLoading,
      loadingText: "Analyzing...",
    },
    gradient: "from-blue-400 via-purple-400 to-indigo-400",
    visual: (
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8">
        <div className="space-y-4">
          <div className="flex items-center text-blue-400 text-sm font-semibold mb-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Code Analysis Engine Active
          </div>

          {[
            {
              icon: FaGithub,
              title: "Repository Scan",
              desc: "Analyzing project structure...",
              color: "blue",
              confidence: "98%",
            },
            {
              icon: FaSearchPlus,
              title: "Stack Detection",
              desc: "MERN Stack identified",
              color: "green",
              confidence: "96%",
            },
            {
              icon: FaLayerGroup,
              title: "Dependency Map",
              desc: "24 dependencies analyzed",
              color: "purple",
              confidence: "94%",
            },
            {
              icon: FaDocker,
              title: "Config Generation",
              desc: "Dockerfile & CI/CD ready",
              color: "orange",
              confidence: "92%",
            },
          ].map((step) => (
            <div
              key={step.title}
              className={`flex items-center justify-between p-4 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-lg`}
            >
              <div className="flex items-center">
                <step.icon className={`w-5 h-5 text-${step.color}-400 mr-3`} />
                <div>
                  <div className="text-white font-medium">{step.title}</div>
                  <div className="text-gray-400 text-sm">{step.desc}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`text-${step.color}-400 font-bold text-sm`}>
                  {step.confidence}
                </div>
                <div className={`text-${step.color}-400 font-bold`}>✓</div>
              </div>
            </div>
          ))}

          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white mb-1">87</div>
                <div className="text-gray-400 text-sm">Optimization Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">2.3s</div>
                <div className="text-gray-400 text-sm">Build Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  const featuresProps = {
    title: "Intelligent Code Analysis & Stack Detection",
    subtitle:
      "Our AI engine analyzes your codebase to understand your technology stack, dependencies, and optimal deployment strategies",
    features,
    gradient: "from-blue-500 to-purple-500",
  };

  const statsProps = {
    stats,
    title: "Code Analysis Performance",
    description:
      "Advanced AI algorithms deliver accurate stack detection and optimization recommendations",
    gradientClasses: "bg-gradient-to-r from-blue-600/10 to-purple-600/10",
  };

  const ctaProps = {
    title: "Ready to Analyze Your Code?",
    description:
      "Get instant insights into your codebase and optimize your deployment strategy with AI",
    primaryButton: {
      text: "Start Analysis",
      onClick: () => console.log("Start analysis"),
    },
    secondaryButton: {
      text: "View Examples",
      onClick: () => console.log("View examples"),
    },
    gradientClasses: "from-blue-600 to-purple-600",
  };
  const resetDemo = () => {
    setDemoData(null);
  };

  const demoProps = {
    isVisible: !!demoData,
    title: "Stack Analysis Complete",
    successMessage: `✓ ${demoData?.detectedStack} Detected (${demoData?.confidence}% confidence)`,
    data: demoData
      ? {
          dependencies: `${demoData.dependencies} deps`,
          devDependencies: `${demoData.devDependencies} devDeps`,
          securityIssues: `${demoData.securityIssues} issues`,
          optimizationScore: `${demoData.optimizationScore}/100`,
          buildTime: demoData.buildTime,
          recommendations: `${demoData.recommendations} tips`,
        }
      : {},
    columns: 3,
    onClose: resetDemo,
    onReset: demoStackAnalysis,
    demoType: "Stack Analysis",
  };

  return (
    <>
      <SEO
        title="Smart Stack Detection - AI-Powered Code Analysis | Deployio"
        description="Deployio's AI automatically detects your technology stack, analyzes dependencies, and generates optimal deployment configurations for any codebase."
        keywords="stack detection, code analysis, AI deployment, dependency analysis, configuration generation, DevOps automation"
      />

      <div className="min-h-screen">
        <ProductHero {...heroProps} />

        <ProductDemo {...demoProps} />

        <StickyFeaturesSection {...featuresProps} />

        <ProductStats {...statsProps} />

        <ProductCTA {...ctaProps} />
      </div>
    </>
  );
};

export default CodeAnalysis;
