/**
 * @swagger
 *
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Simple health check endpoint for load balancers and monitoring
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *             example:
 *               status: "ok"
 *               timestamp: "2021-06-25T10:30:00.000Z"
 *               uptime: 3600
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 error:
 *                   type: string
 *
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Comprehensive health check with service dependencies
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [up, down, degraded]
 *                         responseTime:
 *                           type: number
 *                           description: Response time in milliseconds
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [up, down, degraded]
 *                         responseTime:
 *                           type: number
 *                     external_apis:
 *                       type: object
 *                       properties:
 *                         ai_service:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [up, down, degraded]
 *                             responseTime:
 *                               type: number
 *             example:
 *               status: "healthy"
 *               timestamp: "2021-06-25T10:30:00.000Z"
 *               uptime: 3600
 *               version: "1.0.0"
 *               environment: "production"
 *               services:
 *                 database:
 *                   status: "up"
 *                   responseTime: 15
 *                 redis:
 *                   status: "up"
 *                   responseTime: 2
 *                 external_apis:
 *                   ai_service:
 *                     status: "up"
 *                     responseTime: 120
 *
 * /api/v1/health:
 *   get:
 *     summary: API health check
 *     description: Health check specifically for the API service
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         version:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         message:
 *                           type: string
 *             example:
 *               success: true
 *               message: "DeployIO API v1 is running"
 *               data:
 *                 version: "v1"
 *                 timestamp: "2021-06-25T10:30:00.000Z"
 *
 * /api/v1/external/github/webhook:
 *   post:
 *     summary: GitHub webhook handler
 *     description: Handle GitHub webhook events for automatic deployments
 *     tags: [External]
 *     security: []
 *     parameters:
 *       - name: X-GitHub-Event
 *         in: header
 *         required: true
 *         description: GitHub event type
 *         schema:
 *           type: string
 *           enum: [push, pull_request, release]
 *       - name: X-GitHub-Delivery
 *         in: header
 *         description: Unique delivery ID
 *         schema:
 *           type: string
 *       - name: X-Hub-Signature-256
 *         in: header
 *         description: HMAC signature for payload verification
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: GitHub webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid payload or signature
 *       404:
 *         description: Repository not found
 *
 * /api/v1/external/gitlab/webhook:
 *   post:
 *     summary: GitLab webhook handler
 *     description: Handle GitLab webhook events for automatic deployments
 *     tags: [External]
 *     security: []
 *     parameters:
 *       - name: X-GitLab-Event
 *         in: header
 *         required: true
 *         description: GitLab event type
 *         schema:
 *           type: string
 *           enum: [Push Hook, Merge Request Hook, Tag Push Hook]
 *       - name: X-GitLab-Token
 *         in: header
 *         description: GitLab webhook token
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: GitLab webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid payload or token
 *       404:
 *         description: Repository not found
 *
 * /api/v1/external/stripe/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     description: Handle Stripe webhook events for payment processing
 *     tags: [External]
 *     security: []
 *     parameters:
 *       - name: Stripe-Signature
 *         in: header
 *         required: true
 *         description: Stripe webhook signature
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid signature or payload
 *
 * /api/v1/external/docker/registry/webhook:
 *   post:
 *     summary: Docker registry webhook
 *     description: Handle Docker registry push events
 *     tags: [External]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Docker registry webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid payload
 */
