const ProjectCreationSession = require("../../models/ProjectCreationSession");
const Project = require("../../models/Project");
const ruleBasedAnalyzer = require("../analysis/ruleBasedAnalyzer");
const logger = require("@config/logger");
const GitProviderFactory = require("../gitProviders/ProviderFactory");
const axios = require("axios");
const path = require("path");

class ProjectCreationService {
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
      const session = await ProjectCreationSession.findOne({
        _id: sessionId,
        user: userId,
      });

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

      // Update step data
      session.stepData[`step${step}`] = stepData;
      session.currentStep = Math.max(session.currentStep, step);
      session.lastActivity = new Date();

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
      if (session.currentStep < 6) {
        throw new Error(
          "Session is not ready for completion. All steps must be completed.",
        );
      }

      // Extract project data from session
      const projectData = this.extractProjectDataFromSession(session);

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
   * Delete/abandon session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId, userId) {
    try {
      const session = await ProjectCreationSession.findOneAndUpdate(
        { _id: sessionId, user: userId },
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
   * @param {ProjectCreationSession} session - Session object
   * @returns {object} Project data
   */
  extractProjectDataFromSession(session) {
    const { stepData } = session;

    // Step 1: Provider selection
    const provider = stepData.selectedProvider || "github";

    // Step 2: Repository selection
    const repository = stepData.repository || {};

    // Step 3: Branch selection
    const branch = stepData.branch?.name || "main";

    // Step 4: Analysis results (rule-based)
    const analysis = stepData.analysis || {};

    // Step 5: Project configuration
    const config = stepData.projectConfig || {};

    // Step 6: Final review (if any)
    const review = stepData.review || {};

    // Extract environment variables from project config
    const deploymentEnvVars = {
      development: config.environmentVariables?.development || [],
      staging: config.environmentVariables?.staging || [],
      production: config.environmentVariables?.production || [],
    };

    return {
      name: config.name || repository.name,
      description: config.description || repository.description || "",
      repository: {
        provider,
        url: repository.url,
        owner: repository.owner,
        name: repository.name,
        branch,
        private: repository.isPrivate || false,
      },
      stack: {
        detected: {
          primary: analysis.results?.stack || "unknown",
        },
      },
      deployment: {
        dockerfile: stepData.dockerfile || "",
        buildConfig: {
          buildCommand:
            config.buildCommand ||
            analysis.results?.detectedConfig?.buildCommand,
          startCommand:
            config.startCommand ||
            analysis.results?.detectedConfig?.startCommand,
          installCommand:
            config.installCommand ||
            analysis.results?.detectedConfig?.installCommand,
          port: config.port || analysis.results?.detectedConfig?.port || 3000,
        },
        environment: deploymentEnvVars,
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
