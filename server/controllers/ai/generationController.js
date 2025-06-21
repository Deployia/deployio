const project = require("@services/project");
const ai = require("@services/ai");
const logger = require("@config/logger");

/**
 * @desc Generate Dockerfile configuration using AI
 * @route POST /api/v1/ai/generation/dockerfile/:projectId
 * @access Private
 */
const generateDockerfile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { buildConfig } = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Ensure we have technology stack information
    if (!project.technologyStack) {
      return res.status(400).json({
        success: false,
        message: "Project must be analyzed first to generate Dockerfile",
      });
    }

    const result = await ai.generateDockerfile(
      projectId,
      project.technologyStack,
      buildConfig || project.buildConfig || {},
      req.user
    );

    // Update project with generated Dockerfile
    await project.project.updateProject(projectId, {
      dockerfileConfig: result,
      lastDockerfileGenerated: new Date(),
    });

    logger.info(`Dockerfile generated successfully for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Dockerfile generated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error generating Dockerfile:", error);
    res.status(500).json({
      success: false,
      message: "Error generating Dockerfile",
      error: error.message,
    });
  }
};

/**
 * @desc Generate CI/CD Pipeline configuration
 * @route POST /api/v1/ai/generation/pipeline/:projectId
 * @access Private
 */
const generatePipeline = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const pipelineConfig = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Prepare pipeline configuration
    const config = {
      repositoryUrl: project.repositoryUrl,
      targetPlatforms: pipelineConfig.targetPlatforms || ["github"],
      deploymentTargets: pipelineConfig.deploymentTargets || ["docker"],
      qualityGates: pipelineConfig.qualityGates || ["testing", "security"],
      ciFeatures: pipelineConfig.ciFeatures || [
        "auto_testing",
        "security_scanning",
        "caching",
      ],
      cdFeatures: pipelineConfig.cdFeatures || [
        "auto_deployment",
        "rollback",
        "notifications",
      ],
      ...pipelineConfig,
    };

    const result = await ai.generatePipeline(projectId, config, req.user);

    // Update project with generated pipeline
    await project.project.updateProject(projectId, {
      pipelineConfig: result,
      lastPipelineGenerated: new Date(),
    });

    logger.info(`Pipeline generated successfully for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "CI/CD Pipeline generated successfully",
      data: result,
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
 * @desc Generate environment configuration
 * @route POST /api/v1/ai/generation/environment/:projectId
 * @access Private
 */
const generateEnvironmentConfig = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const environmentConfig = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const result = await ai.generateEnvironmentConfig(
      projectId,
      environmentConfig,
      req.user
    );

    // Update project with generated environment config
    await project.project.updateProject(projectId, {
      environmentConfig: result,
      lastEnvironmentConfigGenerated: new Date(),
    });

    logger.info(
      `Environment config generated successfully for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message: "Environment configuration generated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error generating environment config:", error);
    res.status(500).json({
      success: false,
      message: "Error generating environment configuration",
      error: error.message,
    });
  }
};

/**
 * @desc Generate Kubernetes manifests
 * @route POST /api/v1/ai/generation/kubernetes/:projectId
 * @access Private
 */
const generateKubernetes = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const k8sConfig = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // For now, we'll use the environment config generation as a placeholder
    // This will be extended when the AI service supports K8s manifest generation
    const result = await ai.generateEnvironmentConfig(
      projectId,
      {
        infrastructureType: "kubernetes",
        ...k8sConfig,
      },
      req.user
    );

    logger.info(
      `Kubernetes manifests generated successfully for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message: "Kubernetes manifests generated successfully",
      data: result.kubernetes_manifests || result,
    });
  } catch (error) {
    logger.error("Error generating Kubernetes manifests:", error);
    res.status(500).json({
      success: false,
      message: "Error generating Kubernetes manifests",
      error: error.message,
    });
  }
};

/**
 * @desc Generate Docker Compose configuration
 * @route POST /api/v1/ai/generation/compose/:projectId
 * @access Private
 */
const generateCompose = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const composeConfig = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Use the dockerfile generation which includes docker-compose
    const result = await ai.generateDockerfile(
      projectId,
      project.technologyStack,
      composeConfig,
      req.user
    );

    logger.info(
      `Docker Compose generated successfully for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message: "Docker Compose configuration generated successfully",
      data: {
        docker_compose_content: result.docker_compose_content,
        build_instructions: result.build_instructions,
        optimization_notes: result.optimization_notes,
      },
    });
  } catch (error) {
    logger.error("Error generating Docker Compose:", error);
    res.status(500).json({
      success: false,
      message: "Error generating Docker Compose configuration",
      error: error.message,
    });
  }
};

module.exports = {
  generateDockerfile,
  generatePipeline,
  generateEnvironmentConfig,
  generateKubernetes,
  generateCompose,
};
