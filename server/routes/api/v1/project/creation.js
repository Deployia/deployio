const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const projectCreationController = require('@controllers/project/projectCreationController');
const {protect } = require('@middleware/authMiddleware');

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const createSessionValidation = [
  body('userAgent').optional().isString().withMessage('User agent must be a string'),
  body('ipAddress').optional().isIP().withMessage('Invalid IP address'),
];

const updateStepValidation = [
  param('sessionId').isString().withMessage('Session ID is required'),
  body('step').isInt({ min: 1, max: 6 }).withMessage('Step must be between 1 and 6'),
  body('stepData').optional().isObject().withMessage('Step data must be an object'),
];

const sessionIdValidation = [
  param('sessionId').isString().withMessage('Session ID is required'),
];

const getUserSessionsValidation = [
  query('status').optional().isIn(['active', 'completed', 'abandoned', 'expired']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
];

// Validation for repository analysis
const analyzeRepositoryValidation = [
  param('sessionId').isString().withMessage('Session ID is required'),
  body('repositoryUrl').isURL().withMessage('Valid repository URL is required'),
  body('branch').optional().isString().withMessage('Branch must be a string'),
  body('provider').isIn(['github', 'gitlab', 'azure-devops']).withMessage('Invalid provider'),
];

/**
 * @route   POST /api/v1/projects/creation/session
 * @desc    Create a new project creation session
 * @access  Private
 */
router.post('/session', createSessionValidation, projectCreationController.createSession);

/**
 * @route   GET /api/v1/projects/creation/session/:sessionId
 * @desc    Get project creation session by ID
 * @access  Private
 */
router.get('/session/:sessionId', sessionIdValidation, projectCreationController.getSession);

/**
 * @route   PUT /api/v1/projects/creation/session/:sessionId/step
 * @desc    Update session step data
 * @access  Private
 */
router.put('/session/:sessionId/step', updateStepValidation, projectCreationController.updateStep);

/**
 * @route   POST /api/v1/projects/creation/session/:sessionId/complete
 * @desc    Complete session and create project
 * @access  Private
 */
router.post('/session/:sessionId/complete', sessionIdValidation, projectCreationController.completeSession);

/**
 * @route   GET /api/v1/projects/creation/sessions
 * @desc    Get user's project creation sessions
 * @access  Private
 */
router.get('/sessions', getUserSessionsValidation, projectCreationController.getUserSessions);

/**
 * @route   DELETE /api/v1/projects/creation/session/:sessionId
 * @desc    Delete/abandon project creation session
 * @access  Private
 */
router.delete('/session/:sessionId', sessionIdValidation, projectCreationController.deleteSession);

/**
 * @route   POST /api/v1/projects/creation/session/:sessionId/analyze
 * @desc    Analyze repository for project creation session
 * @access  Private
 */
router.post('/session/:sessionId/analyze', analyzeRepositoryValidation, projectCreationController.analyzeRepository);

module.exports = router;
