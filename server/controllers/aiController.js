const projectService = require("../services/projectService");
const aiService = require("../services/aiService");
const logger = require("../config/logger");

/**
 * @desc Analyze project technology stack using AI
 * @route POST /api/v1/projects/:id/analyze
 * @access Private
 */
const analyzeProjectStack = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const result = await projectService.analyzeProjectWithAI(id, userId);

    logger.info(`AI stack analysis completed for project ${id}`, {
      framework: result.analysis.technology.framework,
      language: result.analysis.technology.language,
      confidence: result.analysis.confidence_score,
    });

    res.status(200).json({
      success: true,
      message: "Project analyzed successfully",
      data: {
        project: result.project,
        analysis: result.analysis,
      },
    });
  } catch (error) {
    logger.error("Error analyzing project stack:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error analyzing project",
      error: error.message,
    });
  }
};

/**
 * @desc Generate Dockerfile for project using AI
 * @route POST /api/v1/projects/:id/dockerfile
 * @access Private
 */
const generateDockerfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { buildCommand, startCommand, port } = req.body;
    const userId = req.user._id;

    const buildConfig = { buildCommand, startCommand, port };
    const dockerfileConfig = await projectService.generateProjectDockerfile(
      id,
      userId,
      buildConfig
    );

    logger.info(`Dockerfile generated for project ${id}`);

    res.status(200).json({
      success: true,
      message: "Dockerfile generated successfully",
      data: dockerfileConfig,
    });
  } catch (error) {
    logger.error("Error generating Dockerfile:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error generating Dockerfile",
      error: error.message,
    });
  }
};

/**
 * @desc Get optimization suggestions for project
 * @route GET /api/v1/projects/:id/optimize
 * @access Private
 */
const getOptimizations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const optimizations = await projectService.getProjectOptimizations(
      id,
      userId
    );

    logger.info(`Optimization analysis completed for project ${id}`, {
      suggestions_count: optimizations.suggestions.length,
      overall_score: optimizations.overall_score,
    });

    res.status(200).json({
      success: true,
      message: "Optimization analysis completed",
      data: optimizations,
    });
  } catch (error) {
    logger.error("Error getting optimizations:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error analyzing optimizations",
      error: error.message,
    });
  }
};

/**
 * @desc Mark optimization suggestion as implemented
 * @route PATCH /api/v1/projects/:id/optimize/:suggestionIndex/implement
 * @access Private
 */
const markOptimizationImplemented = async (req, res) => {
  try {
    const { id, suggestionIndex } = req.params;
    const userId = req.user._id;

    const project = await projectService.markOptimizationImplemented(
      id,
      userId,
      parseInt(suggestionIndex)
    );

    logger.info(
      `Optimization suggestion marked as implemented for project ${id}`
    );

    res.status(200).json({
      success: true,
      message: "Optimization marked as implemented",
      data: project,
    });
  } catch (error) {
    logger.error("Error marking optimization as implemented:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating optimization status",
      error: error.message,
    });
  }
};

/**
 * @desc Get supported technologies from AI service
 * @route GET /api/v1/ai/technologies
 * @access Private
 */
const getSupportedTechnologies = async (req, res) => {
  try {
    const technologies = await aiService.getSupportedTechnologies();

    res.status(200).json({
      success: true,
      message: "Supported technologies retrieved",
      data: technologies,
    });
  } catch (error) {
    logger.error("Error getting supported technologies:", error);

    res.status(500).json({
      success: false,
      message: "Error retrieving supported technologies",
      error: error.message,
    });
  }
};

/**
 * @desc Check AI service health status
 * @route GET /api/v1/ai/health
 * @access Private
 */
const checkAiServiceHealth = async (req, res) => {
  try {
    const healthStatus = await aiService.checkAiServiceHealth();

    res.status(200).json({
      success: true,
      message: "AI service health status retrieved",
      data: healthStatus,
    });
  } catch (error) {
    logger.error("Error checking AI service health:", error);

    res.status(500).json({
      success: false,
      message: "Error checking AI service health",
      error: error.message,
    });
  }
};

/**
 * @desc Trigger full AI analysis for project (analyze + dockerfile + optimize)
 * @route POST /api/v1/projects/:id/ai-analysis
 * @access Private
 */
const runFullAiAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Run stack analysis
    logger.info(`Starting full AI analysis for project ${id}`);
    const analysisResult = await projectService.analyzeProjectWithAI(
      id,
      userId
    );

    // Generate Dockerfile
    const dockerfileConfig = await projectService.generateProjectDockerfile(
      id,
      userId
    );

    // Get optimization suggestions
    const optimizations = await projectService.getProjectOptimizations(
      id,
      userId
    );

    logger.info(`Full AI analysis completed for project ${id}`);

    res.status(200).json({
      success: true,
      message: "Full AI analysis completed successfully",
      data: {
        stack_analysis: analysisResult.analysis,
        dockerfile: dockerfileConfig,
        optimizations: optimizations,
        project: analysisResult.project,
      },
    });
  } catch (error) {
    logger.error("Error running full AI analysis:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error running AI analysis",
      error: error.message,
    });
  }
};

/**
 * @desc Generate CI/CD pipeline configuration using AI
 * @route POST /api/v1/projects/:id/pipeline
 * @access Private
 */
const generatePipeline = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      repositoryUrl,
      targetPlatforms,
      deploymentTargets,
      qualityGates,
      ciFeatures,
      cdFeatures,
    } = req.body;
    const userId = req.user._id;

    const pipelineConfig = {
      repositoryUrl,
      targetPlatforms: targetPlatforms || ["github"],
      deploymentTargets: deploymentTargets || ["docker"],
      qualityGates: qualityGates || ["testing", "security"],
      ciFeatures: ciFeatures || [
        "auto_testing",
        "security_scanning",
        "caching",
      ],
      cdFeatures: cdFeatures || [
        "auto_deployment",
        "rollback",
        "notifications",
      ],
    };

    const pipelineResult = await aiService.generatePipeline(
      id,
      pipelineConfig,
      req.user
    );

    logger.info(`AI pipeline generation completed for project ${id}`, {
      platforms: targetPlatforms,
      targets: deploymentTargets,
      fallback: pipelineResult.fallback,
    });

    res.status(200).json({
      success: true,
      message: "CI/CD pipeline configuration generated successfully",
      data: pipelineResult,
    });
  } catch (error) {
    logger.error("Error generating pipeline:", error);

    res.status(500).json({
      success: false,
      message: "Error generating CI/CD pipeline",
      error: error.message,
    });
  }
};

/**
 * @desc Generate environment configuration using AI
 * @route POST /api/v1/projects/:id/environment
 * @access Private
 */
const generateEnvironmentConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      environments,
      cloudProvider,
      deploymentStrategy,
      infrastructureType,
      monitoringEnabled,
      autoScaling,
    } = req.body;
    const userId = req.user._id;

    const environmentConfig = {
      environments: environments || ["development", "staging", "production"],
      cloudProvider: cloudProvider || "aws",
      deploymentStrategy: deploymentStrategy || "rolling",
      infrastructureType: infrastructureType || "kubernetes",
      monitoringEnabled: monitoringEnabled !== false,
      autoScaling: autoScaling !== false,
    };

    const environmentResult = await aiService.generateEnvironmentConfig(
      id,
      environmentConfig,
      req.user
    );

    logger.info(`AI environment configuration completed for project ${id}`, {
      environments: environments,
      cloudProvider: cloudProvider,
      infrastructureType: infrastructureType,
      fallback: environmentResult.fallback,
    });

    res.status(200).json({
      success: true,
      message: "Environment configuration generated successfully",
      data: environmentResult,
    });
  } catch (error) {
    logger.error("Error generating environment configuration:", error);

    res.status(500).json({
      success: false,
      message: "Error generating environment configuration",
      error: error.message,
    });
  }
};

/**
 * @desc Generate build optimization using AI
 * @route POST /api/v1/projects/:id/build-optimization
 * @access Private
 */
const generateBuildOptimization = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      optimizationLevel,
      targetPlatform,
      buildFrequency,
      currentBuildTime,
    } = req.body;
    const userId = req.user._id;

    // Get project technology stack first
    const project = await projectService.getProjectById(id, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const technologyStack = project.aiAnalysis?.technology || {
      language: "javascript",
      framework: null,
      database: null,
      build_tool: "npm",
      package_manager: "npm",
    };

    const optimizationConfig = {
      optimizationLevel: optimizationLevel || "balanced",
      targetPlatform: targetPlatform || "cloud",
      buildFrequency: buildFrequency || "moderate",
      currentBuildTime: currentBuildTime,
    };

    const optimizationResult = await aiService.generateBuildOptimization(
      id,
      technologyStack,
      optimizationConfig,
      req.user
    );

    logger.info(`AI build optimization completed for project ${id}`, {
      optimizationLevel: optimizationLevel,
      targetPlatform: targetPlatform,
      fallback: optimizationResult.fallback,
    });

    res.status(200).json({
      success: true,
      message: "Build optimization generated successfully",
      data: optimizationResult,
    });
  } catch (error) {
    logger.error("Error generating build optimization:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error generating build optimization",
      error: error.message,
    });
  }
};

/**
 * @desc Demo repository analysis (public endpoint - no auth)
 * @route POST /api/v1/demo/analyze
 * @access Public
 */
const demoAnalyzeRepository = async (req, res) => {
  try {
    logger.info("Demo AI analysis request received", { body: req.body });

    // Create demo user to bypass auth
    const demoUser = { 
      _id: "demo_user", 
      email: "demo@deployio.tech", 
      username: "demo_user" 
    };

    // Extract repository URL from request
    const { repositoryUrl, branch = "main" } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required"
      });
    }

    const projectId = `demo_${Date.now()}`;

    // 1. Stack analysis
    const stackAnalysis = await aiService.analyzeProjectStack(
      projectId,
      repositoryUrl,
      branch,
      demoUser
    );

    // 2. Generate Dockerfile if we have technology stack info
    let dockerfileResult = null;
    if (stackAnalysis.technology && stackAnalysis.technology.framework) {
      try {
        dockerfileResult = await aiService.generateDockerfile(
          projectId,
          stackAnalysis.technology,
          { port: 3000 }, // default build config
          demoUser
        );
      } catch (error) {
        logger.warn("Dockerfile generation failed for demo:", error.message);
      }
    }

    // 3. Get optimization suggestions
    let optimizationResult = null;
    try {
      optimizationResult = await aiService.analyzeOptimization(
        projectId,
        { technology: stackAnalysis.technology },
        null,
        demoUser
      );
    } catch (error) {
      logger.warn("Optimization analysis failed for demo:", error.message);
    }

    // Combine all results
    const combinedResult = {
      // Stack detection data
      technology: stackAnalysis.technology,
      confidence_score: stackAnalysis.confidence_score,
      detected_files: stackAnalysis.detected_files,
      dependency_analysis: stackAnalysis.dependency_analysis,
      
      // Dockerfile data
      dockerfile_content: dockerfileResult?.dockerfile_content || null,
      docker_compose_content: dockerfileResult?.docker_compose_content || null,
      build_instructions: dockerfileResult?.build_instructions || [],
      
      // Optimization data
      optimization_suggestions: optimizationResult?.suggestions || [],
      overall_score: optimizationResult?.overall_score || null,
      
      // Combined recommendations
      recommendations: [
        ...(stackAnalysis.recommendations || []),
        ...(dockerfileResult?.optimization_notes?.map(note => ({
          type: "dockerfile",
          description: note
        })) || [])
      ]
    };

    logger.info("Demo AI analysis completed", { 
      success: true,
      hasStackAnalysis: !!stackAnalysis,
      hasDockerfile: !!dockerfileResult,
      hasOptimizations: !!optimizationResult
    });

    res.status(200).json({
      success: true,
      message: "Demo analysis completed successfully",
      data: combinedResult,
      meta: {
        demoMode: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("Demo analysis error:", error);

    res.status(500).json({
      success: false,
      message: "Demo analysis failed",
      error: error.message
    });
  }
};

module.exports = {
  analyzeProjectStack,
  generateDockerfile,
  getOptimizations,
  markOptimizationImplemented,
  getSupportedTechnologies,
  checkAiServiceHealth,
  runFullAiAnalysis,
  generatePipeline,
  generateEnvironmentConfig,
  generateBuildOptimization,
  demoAnalyzeRepository,
};
