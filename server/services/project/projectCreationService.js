const ProjectCreationSession = require('../../models/ProjectCreationSession');
const Project = require('../../models/Project');
const ai = require('../ai');
const logger = require('@config/logger');

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
        status: 'active',
      });

      if (existingSession && !existingSession.isExpired()) {
        logger.info(`Returning existing active session for user ${userId}`);
        return existingSession;
      }

      // Create new session
      const session = await ProjectCreationSession.createSession(userId, options);
      
      logger.info(`Created new project creation session for user ${userId}`, {
        sessionId: session._id,
        userAgent: options.userAgent,
      });

      return session;
    } catch (error) {
      logger.error('Error creating project creation session:', error);
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
        throw new Error('Session not found');
      }

      if (session.isExpired()) {
        await this.expireSession(sessionId);
        throw new Error('Session has expired');
      }

      return session;
    } catch (error) {
      logger.error('Error getting session:', error);
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
      logger.error('Error updating session step:', error);
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
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const query = { user: userId };
      if (status) {
        query.status = status;
      }

      const sessions = await ProjectCreationSession.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
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
      logger.error('Error getting user sessions:', error);
      throw error;
    }
  }

  /**
   * Analyze repository for project creation
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {object} repositoryData - Repository information
   * @returns {Promise<object>}
   */
  async analyzeRepository(sessionId, userId, repositoryData) {
    try {
      const session = await this.getSession(sessionId, userId);

      const { repositoryUrl, branch = 'main', provider } = repositoryData;

      // Call AI analysis service
      const analysisResult = await ai.analyzeRepository(repositoryUrl, {
        branch,
        user: { id: userId },
        analysisTypes: ['stack', 'dependencies', 'deployment'],
        includeRecommendations: true,
        includeInsights: true,
        trackProgress: true,
      });

      // Update session with analysis results
      session.stepData.step4 = {
        repositoryUrl,
        branch,
        provider,
        analysis: analysisResult,
        analyzedAt: new Date(),
      };
      session.currentStep = Math.max(session.currentStep, 4);
      session.lastActivity = new Date();

      await session.save();

      logger.info(`Repository analysis completed for session ${sessionId}`, {
        repositoryUrl,
        analysisApproach: analysisResult.analysis_approach,
        confidence: analysisResult.confidence_score,
      });

      return {
        session,
        analysis: analysisResult,
      };
    } catch (error) {
      logger.error('Error analyzing repository:', error);
      throw error;
    }
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
        throw new Error('Session is not ready for completion. All steps must be completed.');
      }

      // Extract project data from session
      const projectData = this.extractProjectDataFromSession(session);

      // Create the project
      const project = new Project({
        ...projectData,
        owner: userId,
        status: 'configured',
        createdBy: userId,
      });

      await project.save();

      // Mark session as completed
      session.status = 'completed';
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
      logger.error('Error completing session:', error);
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
          status: 'abandoned',
          abandonedAt: new Date(),
        },
        { new: true }
      );

      if (!session) {
        throw new Error('Session not found');
      }

      logger.info(`Session abandoned by user ${userId}`, { sessionId });
    } catch (error) {
      logger.error('Error deleting session:', error);
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
        status: 'expired',
        expiredAt: new Date(),
      });

      logger.info(`Session expired: ${sessionId}`);
    } catch (error) {
      logger.error('Error expiring session:', error);
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
    const provider = stepData.step1?.selectedProvider;

    // Step 2: Repository selection
    const repository = stepData.step2?.selectedRepository;

    // Step 3: Branch selection
    const branch = stepData.step3?.selectedBranch || 'main';

    // Step 4: AI Analysis
    const analysis = stepData.step4?.analysis;

    // Step 5: Project configuration
    const config = stepData.step5?.projectConfig;

    // Step 6: Final review
    const review = stepData.step6?.finalConfig;

    return {
      name: config?.name || repository?.name,
      description: config?.description || repository?.description || '',
      repository: {
        provider,
        url: repository?.url || repository?.clone_url || repository?.html_url,
        owner: repository?.owner?.login || repository?.owner,
        name: repository?.name,
        branch,
        private: repository?.private || false,
      },
      analysis: {
        analysisId: analysis?.analysis_id,
        confidence: analysis?.confidence_score,
        approach: analysis?.analysis_approach,
        technologyStack: analysis?.technology_stack,
        detectedConfig: analysis?.deployment_config,
        rawAnalysis: analysis,
      },
      deployment: {
        buildConfig: {
          buildCommand: config?.buildCommand || analysis?.deployment_config?.build_command,
          startCommand: config?.startCommand || analysis?.deployment_config?.start_command,
          installCommand: config?.installCommand || analysis?.deployment_config?.install_command,
        },
        runtime: {
          port: config?.port || analysis?.deployment_config?.port || 3000,
          environmentVariables: config?.environmentVariables || [],
        },
      },
    };
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of cleaned up sessions
   */
  async cleanupExpiredSessions() {
    try {
      const expiredSessions = await ProjectCreationSession.find({
        status: 'active',
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
      logger.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }
}

module.exports = new ProjectCreationService();
