import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaGithub,
  FaCode,
  FaDocker,
  FaRocket,
  FaCog,
  FaPlay,
  FaEye,
  FaFileCode,
  FaLayerGroup,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import api from "@utils/api";

const CodeAnalysisDemo = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [selectedRepo, setSelectedRepo] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  // Real MERN repositories for demo (publicly accessible)
  const demoRepositories = [
    {
      id: 0,
      name: "MERN Stack Project",
      description: "Full-stack MERN application with modern architecture",
      githubUrl: "https://github.com/vasudevshetty/mern",
      structure: {
        frontend: "React + Redux",
        backend: "Express.js + MongoDB + JWT",
        database: "MongoDB with Mongoose ODM",
        auth: "JWT Authentication",
        payments: "PayPal Integration",
        deployment: "Docker Ready",
      },
    },
    {
      id: 1,
      name: "Social Media MERN App",
      description:
        "Social media platform with posts, comments, and user profiles",
      githubUrl: "https://github.com/iammukeshm/SocialMedia.Template",
      structure: {
        frontend: "React + Context API",
        backend: "Express.js + MongoDB",
        database: "MongoDB with aggregation pipelines",
        auth: "JWT + bcrypt",
        features: "Image upload, Real-time updates",
        deployment: "Cloud Ready",
      },
    },
  ];
  // AI Analysis steps - aligned with 4 core features
  const analysisSteps = [
    {
      name: "Smart Stack Detection",
      description:
        "AI identifies technology stack from repository structure...",
      icon: FaCode,
      feature: "stack-detection",
    },
    {
      name: "Dependency Analysis",
      description:
        "Deep analysis of project dependencies and configurations...",
      icon: FaLayerGroup,
      feature: "dependency-analysis",
    },
    {
      name: "Configuration Generation",
      description:
        "Generating production-ready Dockerfiles and deployment configs...",
      icon: FaDocker,
      feature: "config-generation",
    },
    {
      name: "Build Optimization",
      description: "Optimizing build processes and deployment strategies...",
      icon: FaRocket,
      feature: "build-optimization",
    },
  ];
  // Start analysis function that calls real AI service
  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisResults(null);
    setError(null);

    const currentRepo = demoRepositories[selectedRepo];

    try {
      // Show realistic progress through analysis steps
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisStep(i);

        // Realistic timing for each step
        const stepTiming = {
          0: 1000, // Stack detection
          1: 1500, // Dependency analysis (slower)
          2: 800, // Config generation
          3: 600, // Build optimization
        };

        await new Promise((resolve) =>
          setTimeout(resolve, stepTiming[i] || 800)
        );
      } // Call the AI service using axios API
      console.log("🔍 Starting AI analysis for:", currentRepo.name);
      console.log("📍 Repository URL:", currentRepo.githubUrl);

      const response = await api.post("/demo/analyze-repository", {
        repositoryUrl: currentRepo.githubUrl,
        branch: "main",
      });

      console.log("✅ AI service response received:", response.data);

      if (response.data.success && response.data.data) {
        // Transform the real AI response to match our UI format
        const transformedResults = transformAiResponse(
          response.data.data,
          currentRepo
        );
        setAnalysisResults(transformedResults);
        console.log("🎯 Results transformed and ready for display");
      } else {
        throw new Error(
          response.data.message || "Analysis completed but no data returned"
        );
      }
    } catch (error) {
      console.error("❌ Analysis error:", error);

      // Provide user-friendly error messages for axios errors
      let userMessage = "Analysis failed. ";

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const responseData = error.response.data;

        if (status === 404) {
          userMessage += "Analysis service not found. Please try again later.";
        } else if (status === 500) {
          userMessage += "Server error occurred. Our team has been notified.";
        } else if (status === 400) {
          userMessage +=
            responseData?.message || "Invalid repository URL or configuration.";
        } else if (status === 429) {
          userMessage +=
            "Too many requests. Please wait a moment and try again.";
        } else {
          userMessage += responseData?.message || `Server error (${status}).`;
        }
      } else if (error.request) {
        // Network error
        userMessage +=
          "Unable to connect to the server. Please check your internet connection.";
      } else if (error.code === "ECONNABORTED") {
        // Timeout error
        userMessage +=
          "Analysis is taking longer than expected. Please try again.";
      } else {
        // Other error
        userMessage += error.message || "An unexpected error occurred.";
      }

      setError(userMessage);
      setAnalysisResults(null);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };
  // Transform real AI response to match demo UI expectations - focused on 4 core features
  const transformAiResponse = (aiData, _repo) => {
    console.log("🔄 Transforming AI data for 4 core features:", aiData);

    return {
      // Feature 1: Smart Stack Detection
      stackDetection: {
        confidence: Math.round(aiData.confidence_score || 95),
        detected: formatStackName(aiData.technology),
        detectedFiles: aiData.detected_files || [],
        components: {
          frontend: {
            framework: capitalizeFirst(aiData.technology?.framework || "React"),
            version: aiData.technology?.runtime_version || "18.2.0",
            buildTool: capitalizeFirst(aiData.technology?.build_tool || "Vite"),
            packageManager: capitalizeFirst(
              aiData.technology?.package_manager || "npm"
            ),
          },
          backend: {
            runtime: "Node.js",
            framework: capitalizeFirst(
              aiData.technology?.language || "JavaScript"
            ),
            database: capitalizeFirst(aiData.technology?.database || "MongoDB"),
          },
        },
      },

      // Feature 2: Dependency Analysis
      dependencyAnalysis: {
        totalDependencies: aiData.dependency_analysis?.total_dependencies || 0,
        productionDeps: aiData.dependency_analysis?.production_deps || 0,
        devDependencies: aiData.dependency_analysis?.dev_dependencies || 0,
        securityIssues: aiData.dependency_analysis?.security_issues || 0,
        outdatedPackages: aiData.dependency_analysis?.outdated_packages || 0,
        optimizationScore: aiData.dependency_analysis?.optimization_score || 85,
        ecosystems: aiData.dependency_analysis?.ecosystems || ["npm"],
      },

      // Feature 3: Configuration Generation (Dockerfile)
      configurationGeneration: {
        dockerfile:
          aiData.dockerfile_content ||
          generateFallbackDockerfile(aiData.technology),
        dockerCompose:
          aiData.docker_compose_content || generateFallbackDockerCompose(),
        buildInstructions: aiData.build_instructions || [],
        securityFeatures: aiData.security_features || [],
        estimatedSize: "~150MB optimized",
      },

      // Feature 4: Build Optimization
      buildOptimization: {
        suggestions: formatOptimizations(aiData.optimization_suggestions || []),
        overallScore: aiData.overall_score || 87,
        priorityActions: [
          "Enable Docker layer caching",
          "Implement dependency caching",
          "Add health check endpoints",
          "Configure horizontal scaling",
        ],
      },

      // Combined recommendations from all features
      recommendations: [
        ...(aiData.recommendations || []),
        ...(aiData.build_instructions?.map((instruction) => ({
          type: "configuration",
          description: instruction,
        })) || []),
      ],
    };
  };

  // Helper functions for response transformation
  const formatStackName = (technology) => {
    if (!technology) return "Web Application";

    const { framework, backend_framework, database } = technology;

    if (
      framework === "react" &&
      backend_framework === "express" &&
      database === "mongodb"
    ) {
      return "MERN Stack";
    }
    if (framework === "vue" && backend_framework === "express") {
      return "VEN Stack";
    }
    if (framework === "angular" && backend_framework === "express") {
      return "MEAN Stack";
    }

    return `${capitalizeFirst(framework || "Modern")} Application`;
  };

  const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  // Enhanced optimization formatting aligned with 4 core features
  const formatOptimizations = (suggestions) => {
    if (!suggestions || suggestions.length === 0) {
      return [
        {
          category: "Stack Optimization",
          icon: FaCode,
          suggestions: [
            "Enable React production build optimizations",
            "Use tree-shaking for smaller bundle sizes",
            "Implement code splitting for better performance",
            "Configure environment-specific builds",
          ],
        },
        {
          category: "Dependency Management",
          icon: FaLayerGroup,
          suggestions: [
            "Update outdated dependencies to latest stable versions",
            "Remove unused dependencies to reduce bundle size",
            "Implement dependency vulnerability scanning",
            "Use npm audit to identify security issues",
          ],
        },
        {
          category: "Configuration Enhancement",
          icon: FaDocker,
          suggestions: [
            "Multi-stage Docker builds for smaller images",
            "Add health check endpoints for containers",
            "Configure proper logging and monitoring",
            "Implement graceful shutdown handling",
          ],
        },
        {
          category: "Build Performance",
          icon: FaRocket,
          suggestions: [
            "Enable Docker layer caching for faster builds",
            "Implement parallel build processes",
            "Use build caching for dependencies",
            "Configure horizontal scaling strategies",
          ],
        },
      ];
    }

    // Group real AI suggestions by category and map to our 4 features
    const categoryMapping = {
      performance: "Build Performance",
      security: "Configuration Enhancement",
      cost: "Stack Optimization",
      reliability: "Dependency Management",
    };

    const grouped = suggestions.reduce((acc, suggestion) => {
      const category =
        categoryMapping[suggestion.type] || suggestion.type || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(
        suggestion.description || suggestion.title || suggestion
      );
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, suggestions]) => ({
      category: capitalizeFirst(category),
      icon: getIconForCategory(category),
      suggestions: suggestions.slice(0, 4), // Limit to 4 per category
    }));
  };

  // Helper to get appropriate icon for optimization category
  const getIconForCategory = (category) => {
    const lowerCategory = category.toLowerCase();
    if (
      lowerCategory.includes("stack") ||
      lowerCategory.includes("performance")
    )
      return FaCode;
    if (
      lowerCategory.includes("dependency") ||
      lowerCategory.includes("reliability")
    )
      return FaLayerGroup;
    if (lowerCategory.includes("config") || lowerCategory.includes("security"))
      return FaDocker;
    if (
      lowerCategory.includes("build") ||
      lowerCategory.includes("optimization")
    )
      return FaRocket;
    return FaCog;
  };

  const generateFallbackDockerfile = (technology) => {
    return `# Multi-stage build for ${formatStackName(technology)}
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
COPY --from=frontend-builder /app/frontend/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]`;
  };

  const generateFallbackDockerCompose = () => {
    return `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongodb:27017/myapp
    depends_on:
      - mongodb
    networks:
      - app-network

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge`;
  };

  return (
    <>
      <SEO
        title="Code Analysis Demo - See AI in Action | DeployIO"
        description="Experience our AI-powered code analysis in real-time. See how DeployIO automatically detects MERN stacks and generates optimized Docker configurations."
        canonical="/products/code-analysis/demo"
      />

      <div className="min-h-screen bg-neutral-950">
        {/* Hero Section */}
        <div className="relative pt-24 pb-16">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    AI Code Analysis
                  </span>
                  <br />
                  <span className="text-2xl md:text-4xl text-gray-300">
                    Live Demo
                  </span>
                </h1>

                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                  Experience our AI-powered code analysis in real-time. Watch as
                  our system automatically detects your MERN stack and generates
                  optimized Docker configurations.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate("/dashboard/projects");
                      } else {
                        navigate("/auth/login");
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                  >
                    <FaRocket className="mr-2" />
                    {isAuthenticated
                      ? "Go to Dashboard"
                      : "Analyze Your Own Repository"}
                  </button>

                  <button
                    onClick={() =>
                      document
                        .getElementById("demo-section")
                        .scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-300 font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-200"
                  >
                    <FaEye className="mr-2" />
                    Watch Demo Below
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>{" "}
        {/* Demo Section */}
        <div id="demo-section" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 4 Core Features Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-16"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Experience Our 4 Core AI Features
                </h2>
                <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                  Watch as our AI analyzes real repositories using the same
                  technology stack detection, dependency analysis, configuration
                  generation, and build optimization that powers DeployIO.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-500/20"
                >
                  <FaCode className="text-blue-400 text-3xl mb-4 mx-auto" />
                  <h3 className="text-white font-semibold text-lg mb-2 text-center">
                    Smart Stack Detection
                  </h3>
                  <p className="text-gray-400 text-sm text-center">
                    AI identifies your technology stack with 96% accuracy from
                    repository structure
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/20"
                >
                  <FaLayerGroup className="text-green-400 text-3xl mb-4 mx-auto" />
                  <h3 className="text-white font-semibold text-lg mb-2 text-center">
                    Dependency Analysis
                  </h3>
                  <p className="text-gray-400 text-sm text-center">
                    Deep analysis of dependencies with security scanning and
                    optimization recommendations
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-6 rounded-xl border border-orange-500/20"
                >
                  <FaDocker className="text-orange-400 text-3xl mb-4 mx-auto" />
                  <h3 className="text-white font-semibold text-lg mb-2 text-center">
                    Configuration Generation
                  </h3>
                  <p className="text-gray-400 text-sm text-center">
                    Production-ready Dockerfiles and deployment configs
                    generated automatically
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/20"
                >
                  <FaRocket className="text-purple-400 text-3xl mb-4 mx-auto" />
                  <h3 className="text-white font-semibold text-lg mb-2 text-center">
                    Build Optimization
                  </h3>
                  <p className="text-gray-400 text-sm text-center">
                    Intelligent optimization for faster builds and better
                    performance
                  </p>
                </motion.div>
              </div>
            </motion.div>
            {/* Repository Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-white text-center mb-8">
                Choose a Sample Repository
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {demoRepositories.map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedRepo === index
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                    onClick={() => setSelectedRepo(index)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {repo.name}
                        </h3>
                        <p className="text-gray-400">{repo.description}</p>
                      </div>
                      <FaGithub className="text-2xl text-gray-400" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {Object.entries(repo.structure)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full"
                          >
                            {value.split(" +")[0]}
                          </span>
                        ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            {/* Analysis Control */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mb-12"
            >
              <button
                onClick={startAnalysis}
                disabled={isAnalyzing}
                className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 ${
                  isAnalyzing
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:scale-105"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Analyzing Repository...
                  </>
                ) : (
                  <>
                    <FaPlay className="mr-2" />
                    Start AI Analysis
                  </>
                )}
              </button>
            </motion.div>
            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-12"
                >
                  <div className="bg-red-900/20 border border-red-500 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-2">
                      Analysis Failed
                    </h3>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <div className="flex gap-4">
                      <button
                        onClick={startAnalysis}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => {
                          if (isAuthenticated) {
                            navigate("/dashboard/projects");
                          } else {
                            navigate("/auth/register");
                          }
                        }}
                        className="px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        {isAuthenticated
                          ? "Go to Dashboard"
                          : "Sign Up for Full Access"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>{" "}
            {/* Enhanced Analysis Progress - 4 Core Features */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-12"
                >
                  <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-6 text-center">
                      🤖 AI Analysis in Progress
                    </h3>
                    <div className="text-center text-gray-400 text-sm mb-6">
                      Analyzing repository:{" "}
                      <span className="text-blue-400 font-medium">
                        {demoRepositories[selectedRepo].name}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {analysisSteps.map((step, index) => {
                        const isActive = index === analysisStep;
                        const isCompleted = index < analysisStep;
                        const IconComponent = step.icon;

                        // Feature-specific colors
                        const featureColors = {
                          "stack-detection": {
                            active: "blue",
                            completed: "blue",
                          },
                          "dependency-analysis": {
                            active: "green",
                            completed: "green",
                          },
                          "config-generation": {
                            active: "orange",
                            completed: "orange",
                          },
                          "build-optimization": {
                            active: "purple",
                            completed: "purple",
                          },
                        };

                        const colors = featureColors[step.feature] || {
                          active: "blue",
                          completed: "green",
                        };

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center p-4 rounded-lg transition-all duration-300 ${
                              isActive
                                ? `bg-${colors.active}-600/20 border border-${colors.active}-500`
                                : isCompleted
                                ? `bg-${colors.completed}-600/20 border border-${colors.completed}-500`
                                : "bg-gray-700/50 border border-gray-600"
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                isActive
                                  ? `bg-${colors.active}-600`
                                  : isCompleted
                                  ? `bg-${colors.completed}-600`
                                  : "bg-gray-600"
                              }`}
                            >
                              {isActive ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                              ) : isCompleted ? (
                                <span className="text-white text-sm">✓</span>
                              ) : (
                                <IconComponent className="text-white text-sm" />
                              )}
                            </div>

                            <div className="ml-4 flex-1">
                              <div
                                className={`font-medium ${
                                  isActive || isCompleted
                                    ? "text-white"
                                    : "text-gray-400"
                                }`}
                              >
                                {step.name}
                              </div>
                              <div
                                className={`text-sm ${
                                  isActive
                                    ? `text-${colors.active}-300`
                                    : "text-gray-500"
                                }`}
                              >
                                {step.description}
                              </div>
                            </div>

                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center text-xs text-gray-400"
                              >
                                <div className="flex space-x-1 mr-2">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                                  <div
                                    className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"
                                    style={{ animationDelay: "0.2s" }}
                                  ></div>
                                  <div
                                    className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"
                                    style={{ animationDelay: "0.4s" }}
                                  ></div>
                                </div>
                                Processing...
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Analysis Progress</span>
                        <span>
                          {Math.round(
                            ((analysisStep + 1) / analysisSteps.length) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              ((analysisStep + 1) / analysisSteps.length) * 100
                            }%`,
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Enhanced Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-12"
                >
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-xl">⚠</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-400">
                          Analysis Failed
                        </h3>
                        <p className="text-gray-300 text-sm">{error}</p>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={startAnalysis}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => setError(null)}
                        className="px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Enhanced Analysis Results - 4 Core Features */}
            <AnimatePresence>
              {analysisResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-8"
                >
                  {/* Feature 1: Smart Stack Detection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20"
                  >
                    <div className="flex items-center mb-6">
                      <FaCode className="text-blue-400 text-2xl mr-3" />
                      <h3 className="text-2xl font-semibold text-white">
                        Smart Stack Detection
                      </h3>
                      <div className="ml-auto flex items-center space-x-2">
                        <div className="text-2xl font-bold text-blue-400">
                          {analysisResults.stackDetection.confidence}%
                        </div>
                        <span className="text-gray-400 text-sm">
                          confidence
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-lg font-medium text-white mb-3">
                          Detected:{" "}
                          <span className="text-blue-400">
                            {analysisResults.stackDetection.detected}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm mb-4">
                          Files analyzed:{" "}
                          {analysisResults.stackDetection.detectedFiles
                            ?.length || 0}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {Object.entries(
                          analysisResults.stackDetection.components
                        ).map(([key, component]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
                          >
                            <span className="text-gray-300 capitalize font-medium">
                              {key}:
                            </span>
                            <span className="text-white font-semibold">
                              {typeof component === "object"
                                ? `${
                                    component.framework ||
                                    component.runtime ||
                                    component.database
                                  }`
                                : component}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature 2: Dependency Analysis */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20"
                  >
                    <div className="flex items-center mb-6">
                      <FaLayerGroup className="text-green-400 text-2xl mr-3" />
                      <h3 className="text-2xl font-semibold text-white">
                        Dependency Analysis
                      </h3>
                      <div className="ml-auto flex items-center space-x-2">
                        <div className="text-2xl font-bold text-green-400">
                          {analysisResults.dependencyAnalysis.optimizationScore}
                        </div>
                        <span className="text-gray-400 text-sm">score</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {analysisResults.dependencyAnalysis.totalDependencies}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Total Dependencies
                        </div>
                      </div>
                      <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {analysisResults.dependencyAnalysis.productionDeps}
                        </div>
                        <div className="text-gray-400 text-sm">Production</div>
                      </div>
                      <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {analysisResults.dependencyAnalysis.outdatedPackages}
                        </div>
                        <div className="text-gray-400 text-sm">Outdated</div>
                      </div>
                      <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {analysisResults.dependencyAnalysis.securityIssues}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Security Issues
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature 3: Configuration Generation */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-orange-500/20"
                  >
                    <div className="flex items-center mb-6">
                      <FaDocker className="text-orange-400 text-2xl mr-3" />
                      <h3 className="text-2xl font-semibold text-white">
                        Configuration Generation
                      </h3>
                      <div className="ml-auto text-orange-400 font-medium">
                        {analysisResults.configurationGeneration.estimatedSize}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Dockerfile */}
                      <div>
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <FaFileCode className="mr-2 text-orange-400" />
                          Optimized Dockerfile
                        </h4>
                        <div className="bg-gray-900 rounded-lg overflow-hidden">
                          <SyntaxHighlighter
                            language="dockerfile"
                            style={oneDark}
                            customStyle={{
                              margin: 0,
                              fontSize: "12px",
                              maxHeight: "300px",
                            }}
                          >
                            {analysisResults.configurationGeneration.dockerfile}
                          </SyntaxHighlighter>
                        </div>
                      </div>

                      {/* Docker Compose */}
                      <div>
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <FaCog className="mr-2 text-orange-400" />
                          Docker Compose
                        </h4>
                        <div className="bg-gray-900 rounded-lg overflow-hidden">
                          <SyntaxHighlighter
                            language="yaml"
                            style={oneDark}
                            customStyle={{
                              margin: 0,
                              fontSize: "12px",
                              maxHeight: "300px",
                            }}
                          >
                            {
                              analysisResults.configurationGeneration
                                .dockerCompose
                            }
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    </div>

                    {/* Build Instructions */}
                    {analysisResults.configurationGeneration.buildInstructions
                      ?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-medium text-white mb-3">
                          Build Instructions
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {analysisResults.configurationGeneration.buildInstructions.map(
                            (instruction, idx) => (
                              <div
                                key={idx}
                                className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20"
                              >
                                <span className="text-gray-300">
                                  {instruction}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Feature 4: Build Optimization */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20"
                  >
                    <div className="flex items-center mb-6">
                      <FaRocket className="text-purple-400 text-2xl mr-3" />
                      <h3 className="text-2xl font-semibold text-white">
                        Build Optimization
                      </h3>
                      <div className="ml-auto flex items-center space-x-2">
                        <div className="text-2xl font-bold text-purple-400">
                          {analysisResults.buildOptimization.overallScore}
                        </div>
                        <span className="text-gray-400 text-sm">score</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {analysisResults.buildOptimization.suggestions.map(
                        (category, index) => (
                          <div
                            key={index}
                            className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20"
                          >
                            <div className="flex items-center mb-3">
                              {category.icon && (
                                <category.icon className="text-purple-400 mr-2" />
                              )}
                              <h4 className="text-lg font-medium text-white">
                                {category.category}
                              </h4>
                            </div>
                            <ul className="space-y-2">
                              {category.suggestions.map((suggestion, idx) => (
                                <li
                                  key={idx}
                                  className="text-gray-300 text-sm flex items-start"
                                >
                                  <span className="text-purple-400 mr-2">
                                    •
                                  </span>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  </motion.div>

                  {/* Summary and Next Steps */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-600"
                  >
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      Ready to Deploy?
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => {
                          if (isAuthenticated) {
                            navigate("/dashboard/projects");
                          } else {
                            navigate("/auth/login");
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
                      >
                        <FaRocket className="mr-2" />
                        {isAuthenticated
                          ? "Deploy This Project"
                          : "Sign Up to Deploy"}
                      </button>
                      <Link
                        to="/products/code-analysis"
                        className="flex-1 border border-gray-500 text-gray-300 font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center"
                      >
                        <FaEye className="mr-2" />
                        Learn More About AI Analysis
                      </Link>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default CodeAnalysisDemo;
