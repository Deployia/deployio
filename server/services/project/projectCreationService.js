const ProjectCreationSession = require("../../models/ProjectCreationSession");
const Project = require("../../models/Project");
const ruleBasedAnalyzer = require("../analysis/ruleBasedAnalyzer");
const logger = require("@config/logger");
const GitProviderFactory = require("../gitProviders/ProviderFactory");
const axios = require("axios");
const path = require("path");
const mongoose = require("mongoose");

class ProjectCreationService {
  /**
   * Build a safe session lookup filter for legacy and current session identifiers
   * @private
   */
  _buildSessionLookupFilter(sessionId, userId) {
    const filter = { user: userId };

    if (sessionId) {
      filter.$or = [{ sessionId }];

      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        filter.$or.push({ _id: sessionId });
      }
    }

    return filter;
  }

  /**
   * Create a new project creation session
   * @param {string} userId - User ID
   * @param {object} options - Session options
   * @returns {Promise<ProjectCreationSession>}
   */
  async createSession(userId, options = {}) {
    try {
      // Check for existing active sessions
      const existingSession = await ProjectCreationSession.findOne({
        user: userId,
        status: "active",
      });

      if (existingSession && !existingSession.isExpired()) {
        logger.info(`Returning existing active session for user ${userId}`);
        return existingSession;
      }

      // Create new session
      const session = await ProjectCreationSession.createSession(
        userId,
        options,
      );

      logger.info(`Created new project creation session for user ${userId}`, {
        sessionId: session._id,
        userAgent: options.userAgent,
      });

      return session;
    } catch (error) {
      logger.error("Error creating project creation session:", error);
      throw error;
    }
  }

  /**
   * Get session by ID and user
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Promise<ProjectCreationSession>}
   */
  async getSession(sessionId, userId) {
    try {
      const session = await ProjectCreationSession.findOne(
        this._buildSessionLookupFilter(sessionId, userId),
      );

      if (!session) {
        throw new Error("Session not found");
      }

      if (session.isExpired()) {
        await this.expireSession(sessionId);
        throw new Error("Session has expired");
      }

      return session;
    } catch (error) {
      logger.error("Error getting session:", error);
      throw error;
    }
  }

  /**
   * Update session step data
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {number} step - Step number
   * @param {object} stepData - Step data
   * @returns {Promise<ProjectCreationSession>}
   */
  async updateStep(sessionId, userId, step, stepData) {
    try {
      const session = await this.getSession(sessionId, userId);

      // Safely merge incoming step data into the top-level stepData object
      // Avoid overwriting existing nested objects with undefined values
      session.stepData = session.stepData || {};
      const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

      for (const [key, value] of Object.entries(stepData || {})) {
        if (value === undefined) {
          continue; // skip undefined fields coming from client
        }

        if (isObject(value) && isObject(session.stepData[key])) {
          // shallow merge nested objects
          session.stepData[key] = { ...session.stepData[key], ...value };
        } else {
          // replace primitive or array
          session.stepData[key] = value;
        }
      }

      // Keep progression monotonic
      session.currentStep = Math.max(session.currentStep || 1, step);

      // Mark step as completed if not already
      session.completedSteps = session.completedSteps || [];
      if (!session.completedSteps.includes(step)) {
        session.completedSteps.push(step);
      }

      // Update metadata and navigation history
      session.metadata = session.metadata || {};
      session.metadata.lastActivityAt = new Date();
      session.metadata.stepsNavigated = session.metadata.stepsNavigated || [];
      session.metadata.stepsNavigated.push({
        step,
        timestamp: new Date(),
        action: "completed",
      });

      await session.save();

      logger.info(`Updated session step ${step} for user ${userId}`, {
        sessionId,
        step,
        currentStep: session.currentStep,
      });

      return session;
    } catch (error) {
      logger.error("Error updating session step:", error);
      throw error;
    }
  }

  /**
   * Get user's project creation sessions
   * @param {string} userId - User ID
   * @param {object} filters - Query filters
   * @returns {Promise<object>}
   */
  async getUserSessions(userId, filters = {}) {
    try {
      const {
        status,
        limit = 10,
        page = 1,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      const query = { user: userId };
      if (status) {
        query.status = status;
      }

      const sessions = await ProjectCreationSession.find(query)
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await ProjectCreationSession.countDocuments(query);

      return {
        sessions,
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      logger.error("Error getting user sessions:", error);
      throw error;
    }
  }

  /**
   * Analyze repository for project creation using rule-based approach
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {object} repositoryData - Repository information { repositoryUrl, branch, provider }
   * @returns {Promise<object>}
   */
  async analyzeRepository(sessionId, userId, repositoryData) {
    try {
      const session = await this.getSession(sessionId, userId);

      const {
        repositoryUrl,
        branch = "main",
        provider = "github",
      } = repositoryData;

      logger.info(
        `Starting rule-based analysis for ${repositoryUrl} (branch: ${branch})`,
      );

      // Extract owner/repo from URL
      const repoMatch = repositoryUrl.match(
        /github\.com\/([^\/]+)\/([^\/\.]+)/i,
      );
      if (!repoMatch) {
        throw new Error(
          "Invalid repository URL. Currently only GitHub URLs are supported.",
        );
      }

      const [, owner, repo] = repoMatch;

      // Fetch key files from GitHub API to analyze
      const fileContents = await this._fetchRepositoryFiles(
        owner,
        repo,
        branch,
      );

      // Run rule-based analyzer with fetched file contents
      const analysisResult = await ruleBasedAnalyzer.analyzeRepositoryContent({
        packageJson: fileContents.packageJson,
        requirementsTxt: fileContents.requirementsTxt,
        dockerfileContent: fileContents.dockerfile,
        envExample: fileContents.envExample,
        dockerCompose: fileContents.dockerCompose,
      });

      // Generate or fetch Dockerfile
      const dockerfileResult = await this._getDockerfile(
        owner,
        repo,
        branch,
        analysisResult.stack,
        fileContents.dockerfile,
      );

      // Update session with analysis results
      session.stepData.analysis = {
        status: "completed",
        completedAt: new Date(),
        results: {
          deployable: analysisResult.deployable,
          stack: analysisResult.stack,
          confidence: analysisResult.confidence,
          reason: analysisResult.reason,
          detectedConfig: analysisResult.detectedConfig,
          // Complete AI-like analysis schema
          technologyStack: analysisResult.technologyStack,
          buildConfiguration: analysisResult.buildConfiguration,
          deploymentConfiguration: analysisResult.deploymentConfiguration,
          insights: analysisResult.insights,
        },
      };

      session.stepData.dockerfile = dockerfileResult.content;

      session.currentStep = Math.max(session.currentStep, 4);
      session.lastActivity = new Date();

      await session.save();

      logger.info(`Repository analysis completed for session ${sessionId}`, {
        repositoryUrl,
        deployable: analysisResult.deployable,
        stack: analysisResult.stack,
        confidence: analysisResult.confidence,
      });

      return {
        session,
        analysis: analysisResult,
        dockerfile: dockerfileResult,
      };
    } catch (error) {
      logger.error("Error analyzing repository:", error);
      throw error;
    }
  }

  /**
   * Analyze repository without mutating or requiring a server session.
   * This is the client-first path used by the wizard.
   * @param {object} repositoryData
   * @returns {Promise<object>}
   */
  async analyzeRepositoryStandalone(repositoryData) {
    const {
      repositoryUrl,
      branch = "main",
      provider = "github",
    } = repositoryData;

    logger.info(
      `Starting standalone rule-based analysis for ${repositoryUrl} (branch: ${branch})`,
    );

    const repoMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/i);
    if (!repoMatch) {
      throw new Error(
        "Invalid repository URL. Currently only GitHub URLs are supported.",
      );
    }

    const [, owner, repo] = repoMatch;
    const fileContents = await this._fetchRepositoryFiles(owner, repo, branch);

    const analysisResult = await ruleBasedAnalyzer.analyzeRepositoryContent({
      packageJson: fileContents.packageJson,
      requirementsTxt: fileContents.requirementsTxt,
      dockerfileContent: fileContents.dockerfile,
      envExample: fileContents.envExample,
      dockerCompose: fileContents.dockerCompose,
    });

    const dockerfileResult = await this._getDockerfile(
      owner,
      repo,
      branch,
      analysisResult.stack,
      fileContents.dockerfile,
    );

    return {
      analysis: {
        status: "completed",
        progress: 100,
        results: {
          deployable: analysisResult.deployable,
          stack: analysisResult.stack,
          confidence: analysisResult.confidence,
          reason: analysisResult.reason,
          detectedConfig: analysisResult.detectedConfig,
          technologyStack: analysisResult.technologyStack,
          buildConfiguration: analysisResult.buildConfiguration,
          deploymentConfiguration: analysisResult.deploymentConfiguration,
          insights: analysisResult.insights,
        },
      },
      dockerfile: dockerfileResult,
      provider,
    };
  }

  /**
   * Fetch key files from repository for analysis
   * @private
   */
  async _fetchRepositoryFiles(owner, repo, branch) {
    const files = {
      packageJson: null,
      requirementsTxt: null,
      dockerfile: null,
      envExample: null,
      dockerCompose: null,
    };

    // Try to fetch each file using GitHub raw URL
    const filePaths = {
      packageJson: "package.json",
      requirementsTxt: "requirements.txt",
      dockerfile: "Dockerfile",
      envExample: ".env.example",
      dockerCompose: "docker-compose.yml",
    };

    for (const [key, filePath] of Object.entries(filePaths)) {
      try {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        const response = await axios.get(url, { timeout: 5000 });
        files[key] = response.data;
        logger.info(`Fetched ${filePath}`);
      } catch (error) {
        logger.debug(`Could not fetch ${filePath}: ${error.message}`);
      }
    }

    return files;
  }

  /**
   * Get Dockerfile content (existing or generate)
   * @private
   */
  async _getDockerfile(owner, repo, branch, stack, existingDockerfile) {
    if (existingDockerfile) {
      return {
        content: existingDockerfile,
        isGenerated: false,
        source: "repository",
      };
    }

    // Generate Dockerfile based on stack
    const dockerfile = this._generateDockerfile(stack);

    return {
      content: dockerfile,
      isGenerated: true,
      source: "generated",
    };
  }

  /**
   * Generate Dockerfile for detected stack
   * @private
   */
  _generateDockerfile(stack) {
    const templates = {
      express: `FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]`,

      mern: `FROM node:18-alpine AS client-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build || echo "No build script"

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
COPY --from=client-build /app/dist ./dist 2>/dev/null || true
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]`,

      fastapi: `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \\
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/docs')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`,
    };

    return templates[stack] || templates.express;
  }

  /**
   * Complete session and create project
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Promise<object>}
   */
  async completeSession(sessionId, userId) {
    try {
      const session = await this.getSession(sessionId, userId);

      // Validate session completion requirements
      // At minimum, need to reach step 5 (project configuration) with analysis results
      if (session.currentStep < 5) {
        throw new Error(
          "Session is not ready for completion. Please complete the project configuration.",
        );
      }

      // Verify we have the essential data collected
      // Accept either flattened stepData or nested stepN objects (legacy clients)
      let mergedStepData = { ...(session.stepData || {}) };
      for (let i = 1; i <= 6; i++) {
        const key = `step${i}`;
        if (session.stepData && session.stepData[key]) {
          mergedStepData = { ...mergedStepData, ...session.stepData[key] };
        }
      }

      // Debug: emit resolved/merged stepData to help trace why validation may fail
      try {
        logger.debug("Resolved mergedStepData for session completion:", {
          sessionId,
          mergedStepData,
        });
      } catch (e) {
        // ignore logging errors
      }

      const selectedProvider =
        mergedStepData.selectedProvider || mergedStepData.provider || null;
      const repository =
        mergedStepData.repository ||
        mergedStepData.repo ||
        mergedStepData.repositorySelection ||
        null;
      const analysisResults =
        mergedStepData.analysis?.results ||
        mergedStepData.stepAnalysis?.results ||
        mergedStepData.analysisResults ||
        null;

      if (!selectedProvider || !repository || !analysisResults) {
        throw new Error(
          "Session is missing required data. Please complete all wizard steps.",
        );
      }

      // Extract project data from session
      // Use mergedStepData for extraction to support both shapes
      const projectData = this.extractProjectDataFromSession(
        session,
        mergedStepData,
      );

      // Create the project
      const project = new Project({
        ...projectData,
        owner: userId,
        status: "configured",
        createdBy: userId,
      });

      await project.save();

      // Mark session as completed
      session.status = "completed";
      session.completedAt = new Date();
      session.createdProject = project._id;
      await session.save();

      logger.info(`Project creation completed for session ${sessionId}`, {
        projectId: project._id,
        projectName: project.name,
      });

      return {
        project,
        session,
      };
    } catch (error) {
      logger.error("Error completing session:", error);
      throw error;
    }
  }

  /**
   * Complete project creation using a full client-provided payload
   * @param {object} payload - Full assembled project payload from client
   * @param {string} userId - User ID
   * @returns {Promise<object>} Created project and metadata
   */
  async completeWithPayload(payload, userId) {
    try {
      // Basic server-side validation
      if (!payload || typeof payload !== "object") {
        throw new Error("Validation failed");
      }

      const repository = payload.repository || payload.repo || null;
      const analysis =
        payload.analysis ||
        payload.analysisResults ||
        payload.analysisResult ||
        null;
      const provider = payload.provider || repository?.provider || "github";

      if (!repository || !repository.url || !analysis || !analysis.results) {
        throw new Error("Validation failed");
      }

      // Reuse extractor by passing payload as resolved stepData
      const projectData = this.extractProjectDataFromSession(null, payload);

      const project = new Project({
        ...projectData,
        owner: userId,
        status: "configured",
        createdBy: userId,
      });

      await project.save();

      // Optional: persist a lightweight audit record or map to existing session framework

      logger.info("Project created via client payload", {
        projectId: project._id,
        owner: userId,
      });

      return { project };
    } catch (error) {
      logger.error("Error completing with payload:", error);
      throw error;
    }
  }

  /**
   * Delete/abandon session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId, userId) {
    try {
      const session = await ProjectCreationSession.findOneAndUpdate(
        this._buildSessionLookupFilter(sessionId, userId),
        {
          status: "abandoned",
          abandonedAt: new Date(),
        },
        { new: true },
      );

      if (!session) {
        throw new Error("Session not found");
      }

      logger.info(`Session abandoned by user ${userId}`, { sessionId });
    } catch (error) {
      logger.error("Error deleting session:", error);
      throw error;
    }
  }

  /**
   * Expire session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async expireSession(sessionId) {
    try {
      await ProjectCreationSession.findByIdAndUpdate(sessionId, {
        status: "expired",
        expiredAt: new Date(),
      });

      logger.info(`Session expired: ${sessionId}`);
    } catch (error) {
      logger.error("Error expiring session:", error);
      throw error;
    }
  }

  /**
   * Extract project data from session steps
   * Maps all form data from SmartProjectForm into Project model structure
   * @param {ProjectCreationSession} session - Session object
   * @returns {object} Project data
   */
  extractProjectDataFromSession(session) {
    // Allow passing a resolved stepData as second arg for compatibility
    const resolved = arguments[1] || session.stepData || {};
    const stepData = resolved;

    // Step 1: Provider selection
    const provider = stepData.selectedProvider || stepData.provider || "github";

    // Step 2: Repository selection
    const repository =
      stepData.repository || stepData.repo || stepData.repository || {};

    // Step 3: Branch selection
    const branch =
      (stepData.branch && (stepData.branch.name || stepData.branch)) ||
      stepData.selectedBranch ||
      "main";

    // Step 4: Analysis results (rule-based)
    const analysis = stepData.analysis || stepData.analysisResults || {};

    // Step 5: Project configuration (formData from SmartProjectForm)
    const config =
      stepData.projectConfig ||
      stepData.projectConfigData ||
      stepData.config ||
      {};

    // Step 6: Final review (if any)
    const review = stepData.review || {};

    // Map build configuration from formData
    const buildCommands = {
      install:
        config.build?.commands?.install ||
        analysis.results?.detectedConfig?.installCommand ||
        "npm install",
      build:
        config.build?.commands?.build ||
        analysis.results?.detectedConfig?.buildCommand ||
        "npm run build",
      start:
        config.build?.commands?.start ||
        analysis.results?.detectedConfig?.startCommand ||
        "npm start",
      test: config.build?.commands?.test || "",
    };

    // Map runtime configuration from formData
    const runtimeConfig = {
      platform: "linux/amd64",
      memory:
        config.runtime?.memory ||
        (analysis.results?.stack === "fastapi" ? "512MB" : "512MB"),
      cpu:
        config.runtime?.cpu ||
        (analysis.results?.stack === "fastapi" ? "0.5" : "0.25"),
      instances: config.runtime?.instances || 1,
      healthCheck: {
        enabled: true,
        path: config.runtime?.healthCheck?.path || "/health",
        interval: config.runtime?.healthCheck?.interval || 30,
        timeout: config.runtime?.healthCheck?.timeout || 10,
        retries: config.runtime?.healthCheck?.retries || 3,
      },
    };

    // Extract environment variables organized by environment
    const envVariables = config.environmentVariables || [];
    const deploymentEnvVars = {
      development: envVariables.filter(
        (env) => env.environment === "development",
      ),
      staging: envVariables.filter((env) => env.environment === "staging"),
      production: envVariables.filter(
        (env) => env.environment === "production",
      ),
      // If no environment specified, add to all for backward compatibility
      ...(!envVariables.some((env) => env.environment)
        ? {
            development: envVariables,
            staging: envVariables,
            production: envVariables,
          }
        : {}),
    };

    // Ensure all envs exist
    if (!deploymentEnvVars.development?.length) {
      deploymentEnvVars.development = [];
    }
    if (!deploymentEnvVars.staging?.length) {
      deploymentEnvVars.staging = [];
    }
    if (!deploymentEnvVars.production?.length) {
      deploymentEnvVars.production = [];
    }

    // Normalize repository owner to string (owner.login when object)
    const repoOwnerString =
      typeof repository.owner === "string"
        ? repository.owner
        : repository.owner?.login || repository.owner?.name || null;

    // Normalize analysis confidence to 0-1 if provided as percentage (>1)
    if (
      analysis.results &&
      typeof analysis.results.confidence === "number" &&
      analysis.results.confidence > 1
    ) {
      analysis.results.confidence = Math.min(
        analysis.results.confidence / 100,
        1,
      );
    }

    // Generate a slug from project name or repository name for schema requirements
    const rawName = config.projectName || repository.name || "project";
    const slugify = (s) =>
      String(s)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const generatedSlug = slugify(rawName) || `project-${Date.now()}`;

    return {
      // Core info
      name: config.projectName || repository.name,
      slug: generatedSlug,
      description: config.projectDescription || repository.description || "",

      // Repository
      repository: {
        provider,
        url: repository.url,
        owner: repoOwnerString,
        name: repository.name,
        branch,
        private: repository.isPrivate || false,
      },

      // Complete analysis schema mapping
      analysis: {
        technologyStack: analysis.results?.technologyStack || {},
        detectedConfig: analysis.results?.detectedConfig || {},
        buildConfiguration: analysis.results?.buildConfiguration || {},
        deploymentConfiguration:
          analysis.results?.deploymentConfiguration || {},
        insights: analysis.results?.insights || [],
        confidence: analysis.results?.confidence || 0,
      },

      // Build configuration - comprehensive
      build: {
        commands: buildCommands,
        outputDir:
          config.build?.outputDir ||
          (analysis.results?.stack === "mern"
            ? "dist"
            : analysis.results?.stack === "nextjs"
              ? ".next"
              : "dist"),
        nodeVersion: config.build?.nodeVersion || "18",
        buildTimeout: config.build?.buildTimeout || 600,
      },

      // Deployment configuration - comprehensive
      deployment: {
        dockerfile: stepData.dockerfile || "",
        port: config.port || analysis.results?.detectedConfig?.port || 3000,
        buildConfig: {
          buildCommand: buildCommands.build,
          startCommand: buildCommands.start,
          installCommand: buildCommands.install,
          port: config.port || analysis.results?.detectedConfig?.port || 3000,
        },
        environment: deploymentEnvVars,
        runtime: runtimeConfig,
      },

      status: "configured",
    };
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of cleaned up sessions
   */
  async cleanupExpiredSessions() {
    try {
      const expiredSessions = await ProjectCreationSession.find({
        status: "active",
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours ago
      });

      let cleanedCount = 0;
      for (const session of expiredSessions) {
        await this.expireSession(session._id);
        cleanedCount++;
      }

      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;
    } catch (error) {
      logger.error("Error cleaning up expired sessions:", error);
      throw error;
    }
  }
}

module.exports = new ProjectCreationService();
