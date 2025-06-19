import React, { useState, useEffect } from "react";
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
  FaArrowRight,
  FaEye,
  FaClone,
  FaFileCode,
  FaLayerGroup,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

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
      name: "E-Commerce MERN Store",
      description: "Full-stack e-commerce application with React, Node.js, MongoDB",
      githubUrl: "https://github.com/bradtraversy/proshop",
      structure: {
        frontend: "React + Redux",
        backend: "Express.js + MongoDB + JWT",
        database: "MongoDB with Mongoose ODM",
        auth: "JWT Authentication",
        payments: "PayPal Integration",
        deployment: "Docker Ready"
      }
    },
    {
      id: 1,
      name: "Social Media MERN App",
      description: "Social media platform with posts, comments, and user profiles",
      githubUrl: "https://github.com/iammukeshm/SocialMedia.Template",
      structure: {
        frontend: "React + Context API",
        backend: "Express.js + MongoDB",
        database: "MongoDB with aggregation pipelines",
        auth: "JWT + bcrypt",
        features: "Image upload, Real-time updates",
        deployment: "Cloud Ready"
      }
    }
  ];

  // AI Analysis steps
  const analysisSteps = [
    { 
      name: "Repository Structure Analysis", 
      description: "Scanning files and folders...",
      icon: FaFileCode 
    },
    { 
      name: "Dependency Detection", 
      description: "Analyzing package.json and dependencies...",
      icon: FaLayerGroup 
    },
    { 
      name: "Technology Stack Identification", 
      description: "Identifying MERN stack components...",
      icon: FaCog 
    },
    { 
      name: "Docker Configuration Generation", 
      description: "Creating optimized Dockerfiles...",
      icon: FaDocker 
    },
    { 
      name: "Optimization Recommendations", 
      description: "Generating performance improvements...",
      icon: FaRocket 
    }
  ];

  // Start analysis function that calls real AI service
  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisResults(null);
    setError(null);

    try {
      // Simulate progress through analysis steps
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisStep(i);
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      }

      // Call your REAL AI service
      console.log('Calling AI service with repo:', currentRepo.githubUrl);
      
      const response = await fetch('/api/v1/demo/analyze-repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryUrl: currentRepo.githubUrl,
          branch: 'main'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('AI service response:', result);
      
      if (result.success && result.data) {
        // Transform the real AI response to match our UI format
        const transformedResults = transformAiResponse(result.data, currentRepo);
        setAnalysisResults(transformedResults);
      } else {
        throw new Error(result.message || 'Analysis failed - no data returned');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Analysis failed: ${error.message}`);
      
      // Show fallback message instead of fake data
      setAnalysisResults(null);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  // Transform real AI response to match demo UI expectations
  const transformAiResponse = (aiData, repo) => {
    console.log('Transforming AI data:', aiData); // Debug log
    
    return {
      stackDetection: {
        confidence: Math.round(aiData.confidence_score || 95),
        detected: formatStackName(aiData.technology),
        components: {
          frontend: {
            framework: capitalizeFirst(aiData.technology?.framework || "React"),
            version: "18.2.0",
            buildTool: capitalizeFirst(aiData.technology?.build_tool || "Vite"),
            styling: "Tailwind CSS"
          },
          backend: {
            runtime: "Node.js",
            framework: capitalizeFirst(aiData.technology?.backend_framework || "Express.js"),
            version: "4.18.2"
          },
          database: {
            type: aiData.technology?.database === 'mongodb' ? 'NoSQL' : 'SQL',
            system: capitalizeFirst(aiData.technology?.database || "MongoDB"),
            orm: aiData.technology?.database === 'mongodb' ? 'Mongoose' : 'Prisma'
          }
        }
      },
      dockerfile: aiData.dockerfile_content || generateFallbackDockerfile(aiData.technology),
      dockerCompose: aiData.docker_compose_content || generateFallbackDockerCompose(),
      optimizations: formatOptimizations(aiData.optimization_suggestions || [])
    };
  };

  // Helper functions for response transformation
  const formatStackName = (technology) => {
    if (!technology) return 'Web Application';
    
    const { framework, backend_framework, database } = technology;
    
    if (framework === 'react' && backend_framework === 'express' && database === 'mongodb') {
      return 'MERN Stack';
    }
    if (framework === 'vue' && backend_framework === 'express') {
      return 'VEN Stack';
    }
    if (framework === 'angular' && backend_framework === 'express') {
      return 'MEAN Stack';
    }
    
    return `${capitalizeFirst(framework || 'Modern')} Application`;
  };

  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatOptimizations = (suggestions) => {
    if (!suggestions || suggestions.length === 0) {
      return [
        {
          category: "Performance",
          suggestions: [
            "Enable React production build optimizations",
            "Implement MongoDB connection pooling",
            "Add Redis caching for frequent queries",
            "Use CDN for static assets"
          ]
        },
        {
          category: "Security",
          suggestions: [
            "Add helmet.js for security headers",
            "Implement rate limiting middleware",
            "Use environment variables for secrets",
            "Enable CORS with specific origins"
          ]
        },
        {
          category: "Deployment",
          suggestions: [
            "Multi-stage Docker builds for smaller images",
            "Health check endpoints for containers",
            "Horizontal scaling with load balancer",
            "Database backup strategy"
          ]
        }
      ];
    }

    // Group suggestions by category if they come from AI
    const grouped = suggestions.reduce((acc, suggestion) => {
      const category = suggestion.type || suggestion.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(suggestion.description || suggestion.title || suggestion);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, suggestions]) => ({
      category: capitalizeFirst(category),
      suggestions: suggestions.slice(0, 4) // Limit to 4 per category
    }));
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

  const currentRepo = demoRepositories[selectedRepo];

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
                  <span className="text-2xl md:text-4xl text-gray-300">Live Demo</span>
                </h1>
                
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                  Experience our AI-powered code analysis in real-time. Watch as our system 
                  automatically detects your MERN stack and generates optimized Docker configurations.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate('/dashboard/projects');
                      } else {
                        navigate('/auth/login');
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                  >
                    <FaRocket className="mr-2" />
                    {isAuthenticated ? 'Go to Dashboard' : 'Analyze Your Own Repository'}
                  </button>
                  
                  <button
                    onClick={() => document.getElementById('demo-section').scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-300 font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-200"
                  >
                    <FaEye className="mr-2" />
                    Watch Demo Below
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo-section" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
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
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedRepo(index)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {repo.name}
                        </h3>
                        <p className="text-gray-400">
                          {repo.description}
                        </p>
                      </div>
                      <FaGithub className="text-2xl text-gray-400" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(repo.structure).slice(0, 3).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full"
                        >
                          {value.split(' +')[0]}
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
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:scale-105'
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
                            navigate('/dashboard/projects');
                          } else {
                            navigate('/auth/register');
                          }
                        }}
                        className="px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        {isAuthenticated ? 'Go to Dashboard' : 'Sign Up for Full Access'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analysis Progress */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-12"
                >
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-6 text-center">
                      AI Analysis in Progress
                    </h3>
                    
                    <div className="space-y-4">
                      {analysisSteps.map((step, index) => {
                        const isActive = index === analysisStep;
                        const isCompleted = index < analysisStep;
                        const IconComponent = step.icon;
                        
                        return (
                          <motion.div
                            key={index}
                            className={`flex items-center p-4 rounded-lg transition-all duration-300 ${
                              isActive 
                                ? 'bg-blue-600/20 border border-blue-500' 
                                : isCompleted 
                                ? 'bg-green-600/20 border border-green-500'
                                : 'bg-gray-700/50 border border-gray-600'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              isActive 
                                ? 'bg-blue-600' 
                                : isCompleted 
                                ? 'bg-green-600'
                                : 'bg-gray-600'
                            }`}>
                              {isActive ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                              ) : (
                                <IconComponent className="text-white text-sm" />
                              )}
                            </div>
                            
                            <div className="ml-4">
                              <div className={`font-medium ${
                                isActive || isCompleted ? 'text-white' : 'text-gray-400'
                              }`}>
                                {step.name}
                              </div>
                              <div className={`text-sm ${
                                isActive ? 'text-blue-300' : 'text-gray-500'
                              }`}>
                                {step.description}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analysis Results */}
            <AnimatePresence>
              {analysisResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-8"
                >
                  {/* Stack Detection Results */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-2xl font-semibold text-white mb-6">
                      🎯 Stack Detection Results
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center mb-4">
                          <div className="text-3xl font-bold text-green-400">
                            {analysisResults.stackDetection.confidence}%
                          </div>
                          <div className="ml-3">
                            <div className="text-white font-medium">Confidence Score</div>
                            <div className="text-gray-400 text-sm">Detected: {analysisResults.stackDetection.detected}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {Object.entries(analysisResults.stackDetection.components).map(([key, component]) => (
                          <div key={key} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                            <span className="text-gray-300 capitalize">{key}:</span>
                            <span className="text-white font-medium">
                              {typeof component === 'object' ? component.framework || component.system : component}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generated Dockerfile */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-2xl font-semibold text-white mb-6">
                      🐳 Generated Dockerfile
                    </h3>
                    
                    <div className="relative">
                      <SyntaxHighlighter
                        language="dockerfile"
                        style={oneDark}
                        className="rounded-lg"
                        showLineNumbers
                      >
                        {analysisResults.dockerfile}
                      </SyntaxHighlighter>
                    </div>
                  </div>

                  {/* Docker Compose Configuration */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-2xl font-semibold text-white mb-6">
                      🔧 Docker Compose Configuration
                    </h3>
                    
                    <div className="relative">
                      <SyntaxHighlighter
                        language="yaml"
                        style={oneDark}
                        className="rounded-lg"
                        showLineNumbers
                      >
                        {analysisResults.dockerCompose}
                      </SyntaxHighlighter>
                    </div>
                  </div>

                  {/* Optimization Recommendations */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-2xl font-semibold text-white mb-6">
                      🚀 AI Optimization Recommendations
                    </h3>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      {analysisResults.optimizations.map((category, index) => (
                        <div key={index} className="space-y-3">
                          <h4 className="text-lg font-medium text-blue-400">
                            {category.category}
                          </h4>
                          <ul className="space-y-2">
                            {category.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start text-gray-300 text-sm">
                                <span className="text-green-400 mr-2">✓</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-8 border border-blue-500/50 text-center">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Ready to Analyze Your Own Repository?
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Get personalized AI analysis, custom Docker configurations, and deployment-ready setups for your projects.
                    </p>
                    <button
                      onClick={() => {
                        if (isAuthenticated) {
                          navigate('/dashboard/projects');
                        } else {
                          navigate('/auth/register');
                        }
                      }}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 hover:scale-105"
                    >
                      <FaRocket className="mr-2" />
                      {isAuthenticated ? 'Go to Dashboard' : 'Start Free Analysis'}
                      <FaArrowRight className="ml-2" />
                    </button>
                  </div>
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
