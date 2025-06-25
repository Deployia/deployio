import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
} from "@components/products";

const CodeAnalysis = () => {
  const navigate = useNavigate();

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
      onClick: () => {
        navigate("/dashboard/projects");
      },
    },
    secondaryCTA: {
      text: "Try Interactive Demo",
      icon: FaEye,
      onClick: () => {
        navigate("/products/code-analysis/live-demo");
      },
    },
    gradient: "from-blue-400 via-purple-400 to-indigo-400",
    visual: (
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-4 sm:p-6 md:p-8">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center text-blue-400 text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-2 sm:mr-3 animate-pulse"></div>
            <span className="hidden sm:inline">
              Code Analysis Engine Active
            </span>
            <span className="sm:hidden">Analysis Active</span>
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
          ].map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
              className={`flex items-center justify-between p-3 sm:p-4 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-lg`}
            >
              <div className="flex items-center min-w-0 flex-1">
                <step.icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-${step.color}-400 mr-2 sm:mr-3 flex-shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium text-sm sm:text-base truncate">
                    {step.title}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm truncate">
                    {step.desc}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                <div
                  className={`text-${step.color}-400 font-bold text-xs sm:text-sm`}
                >
                  {step.confidence}
                </div>
                <div
                  className={`text-${step.color}-400 font-bold text-sm sm:text-base`}
                >
                  ✓
                </div>
              </div>
            </motion.div>
          ))}

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700/50">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  87
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">
                  Optimization Score
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                  2.3s
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">
                  Build Time
                </div>
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
      onClick: () => navigate("/dashboard/projects"),
    },
    secondaryButton: {
      text: "Try Live Demo",
      onClick: () => navigate("/products/code-analysis/live-demo"),
    },
    gradientClasses: "from-blue-600 to-purple-600",
  };
  return (
    <>
      <SEO page="codeAnalysis" />
      <div className="min-h-screen">
        <ProductHero {...heroProps} />

        <StickyFeaturesSection {...featuresProps} />

        <ProductStats {...statsProps} />

        <ProductCTA {...ctaProps} />
      </div>
    </>
  );
};

export default CodeAnalysis;
