const projectCreationService = require('../../services/project/projectCreationService');
const { validationResult } = require('express-validator');
const logger = require('@config/logger');

class ProjectCreationController {
  // Create new session
  async createSession(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { userAgent, ipAddress } = req.body;
      const userId = req.user.id;

      const session = await projectCreationService.createSession(userId, {
        userAgent,
        ipAddress,
      });

      const statusCode = session.createdAt < new Date(Date.now() - 1000) ? 200 : 201;
      const message = statusCode === 200 ? 'Existing session found' : 'Project creation session created successfully';

      res.status(statusCode).json({
        success: true,
        message,
        data: {
          session,
        },
      });
    } catch (error) {
      logger.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create session',
        error: error.message,
      });
    }
  }

  // Get session by ID
  async getSession(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { sessionId } = req.params;
      const userId = req.user.id;

      const session = await projectCreationService.getSession(sessionId, userId);

      res.status(200).json({
        success: true,
        data: {
          session,
          progress: session.getProgress(),
          timeSpent: session.getTimeSpent(),
        },
      });
    } catch (error) {
      logger.error('Error getting session:', error);
      
      if (error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }
      
      if (error.message === 'Session has expired') {
        return res.status(410).json({
          success: false,
          message: 'Session has expired',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get session',
        error: error.message,
      });
    }
  }

  // Update session step
  async updateStep(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { sessionId } = req.params;
      const { step, stepData } = req.body;
      const userId = req.user.id;

      const session = await projectCreationService.updateStep(sessionId, userId, step, stepData);

      res.status(200).json({
        success: true,
        message: 'Session step updated successfully',
        data: {
          session,
          progress: session.getProgress(),
        },
      });
    } catch (error) {
      logger.error('Error updating session step:', error);
      
      if (error.message === 'Session not found' || error.message === 'Session has expired') {
        const statusCode = error.message === 'Session not found' ? 404 : 410;
        return res.status(statusCode).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update session step',
        error: error.message,
      });
    }
  }

  // Complete session and create project
  async completeSession(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { sessionId } = req.params;
      const userId = req.user.id;

      const result = await projectCreationService.completeSession(sessionId, userId);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error completing session:', error);
      
      if (error.message === 'Session not found' || error.message === 'Session has expired') {
        const statusCode = error.message === 'Session not found' ? 404 : 410;
        return res.status(statusCode).json({
          success: false,
          message: error.message,
        });
      }
      
      if (error.message.includes('not ready for completion')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to complete session',
        error: error.message,
      });
    }
  }

  // Get user sessions
  async getUserSessions(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 10,
        page: parseInt(req.query.page) || 1,
      };

      const result = await projectCreationService.getUserSessions(userId, filters);

      res.status(200).json({
        success: true,
        data: {
          sessions: result.sessions,
          pagination: {
            total: result.totalCount,
            page: result.currentPage,
            limit: filters.limit,
            pages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user sessions',
        error: error.message,
      });
    }
  }

  // Delete/abandon session
  async deleteSession(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { sessionId } = req.params;
      const userId = req.user.id;

      await projectCreationService.deleteSession(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Session abandoned successfully',
      });
    } catch (error) {
      logger.error('Error deleting session:', error);
      
      if (error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete session',
        error: error.message,
      });
    }
  }

  // Analyze repository for session
  async analyzeRepository(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { sessionId } = req.params;
      const { repositoryUrl, branch, provider } = req.body;
      const userId = req.user.id;

      const result = await projectCreationService.analyzeRepository(sessionId, userId, {
        repositoryUrl,
        branch,
        provider,
      });

      res.status(200).json({
        success: true,
        message: 'Repository analysis completed successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error analyzing repository:', error);
      
      if (error.message === 'Session not found' || error.message === 'Session has expired') {
        const statusCode = error.message === 'Session not found' ? 404 : 410;
        return res.status(statusCode).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to analyze repository',
        error: error.message,
      });
    }
  }
}

module.exports = new ProjectCreationController();
