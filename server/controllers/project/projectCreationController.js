const projectCreationService = require("../../services/project/projectCreationService");
const NotificationHelpers = require("../../services/notification/notificationHelpers");
const { validationResult } = require("express-validator");
const logger = require("@config/logger");

class ProjectCreationController {
  // Complete project creation with full client payload
  async completeWithPayload(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const payload = req.body;
      const userId = req.user.id;

      const result = await projectCreationService.completeWithPayload(
        payload,
        userId,
      );

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error completing project with payload:", error);

      if (error.message === "Validation failed") {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.status(500).json({
        success: false,
        message: "Failed to complete project",
        error: error.message,
      });
    }
  }

  async discoverDockerfiles(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { repositoryUrl, branch, provider } = req.body;
      const result = await projectCreationService.discoverDockerfiles(
        {
          repositoryUrl,
          branch,
          provider,
        },
        req.user.id,
      );

      res.status(200).json({
        success: true,
        message: "Dockerfiles discovered",
        data: result,
      });
    } catch (error) {
      logger.error("Error discovering Dockerfiles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to discover Dockerfiles",
        error: error.message,
      });
    }
  }

  // Analyze repository without a session (client-first flow)
  async analyzeRepositoryStandalone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { repositoryUrl, branch, provider, dockerfilePath } = req.body;
      const userId = req.user.id;

      const result = await projectCreationService.analyzeRepositoryStandalone(
        {
          repositoryUrl,
          branch,
          provider,
          dockerfilePath,
        },
        userId,
      );

      const projectName =
        result?.analysis?.results?.dockerfile?.suggestedName ||
        repositoryUrl?.split("/").filter(Boolean).pop()?.replace(/\.git$/, "") ||
        "Repository";
      const analysisStatus = result?.analysis?.status;
      const isComplete = analysisStatus === "completed";

      const notifyPromise = isComplete
        ? NotificationHelpers.projectAnalysisComplete(userId, {
            projectName,
            projectId: null,
            analysisResults: result.analysis?.results,
          })
        : NotificationHelpers.projectAnalysisFailed(userId, {
            projectName,
            projectId: null,
            error:
              result?.analysis?.results?.reason ||
              "Repository analysis did not complete successfully",
          });

      notifyPromise.catch((error) => {
        logger.error("Failed to send repository analysis notification", {
          userId,
          repositoryUrl,
          error: error.message,
        });
      });

      res.status(200).json({
        success: true,
        message: "Repository analysis completed successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error analyzing repository without session:", error);

      res.status(500).json({
        success: false,
        message: "Failed to analyze repository",
        error: error.message,
      });
    }
  }
}

module.exports = new ProjectCreationController();
