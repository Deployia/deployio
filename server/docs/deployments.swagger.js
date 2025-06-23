/**
 * @swagger
 *
 * /api/v1/deployments:
 *   get:
 *     summary: Get user deployments
 *     description: Retrieve paginated list of user's deployments across all projects
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - name: status
 *         in: query
 *         description: Filter by deployment status
 *         schema:
 *           type: string
 *           enum: [pending, building, deploying, success, failed]
 *       - name: projectId
 *         in: query
 *         description: Filter by project ID
 *         schema:
 *           type: string
 *       - name: branch
 *         in: query
 *         description: Filter by branch name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deployments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Deployment'
 *             example:
 *               success: true
 *               message: "Deployments retrieved successfully"
 *               data:
 *                 - _id: "60d5ecb54b24a627f8b7c999"
 *                   projectId: "60d5ecb54b24a627f8b7c789"
 *                   status: "success"
 *                   url: "https://portfolio-abc123.deployio.dev"
 *                   branch: "main"
 *                   commit: "a1b2c3d4"
 *                   createdAt: "2021-06-25T10:30:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 15
 *                 pages: 2
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/deployments/{id}:
 *   get:
 *     summary: Get deployment by ID
 *     description: Retrieve specific deployment details and logs
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deployment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Deployment'
 *                         - type: object
 *                           properties:
 *                             project:
 *                               $ref: '#/components/schemas/Project'
 *                             buildDuration:
 *                               type: number
 *                               description: Build duration in seconds
 *                             deployDuration:
 *                               type: number
 *                               description: Deploy duration in seconds
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Cancel deployment
 *     description: Cancel running deployment or delete deployment record
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deployment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Deployment cancelled successfully"
 *               data: {}
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/deployments/{id}/logs:
 *   get:
 *     summary: Get deployment logs
 *     description: Retrieve real-time deployment logs
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID
 *         schema:
 *           type: string
 *       - name: follow
 *         in: query
 *         description: Follow logs in real-time (SSE)
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: lines
 *         in: query
 *         description: Number of log lines to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *     responses:
 *       200:
 *         description: Deployment logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         logs:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               level:
 *                                 type: string
 *                                 enum: [info, warn, error, debug]
 *                               message:
 *                                 type: string
 *                               source:
 *                                 type: string
 *                                 enum: [build, deploy, system]
 *                         hasMore:
 *                           type: boolean
 *             example:
 *               success: true
 *               message: "Deployment logs retrieved"
 *               data:
 *                 logs:
 *                   - timestamp: "2021-06-25T10:30:00.000Z"
 *                     level: "info"
 *                     message: "Starting build process..."
 *                     source: "build"
 *                   - timestamp: "2021-06-25T10:30:15.000Z"
 *                     level: "info"
 *                     message: "Installing dependencies..."
 *                     source: "build"
 *                 hasMore: false
 *           text/plain:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream when follow=true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/deployments/{id}/rollback:
 *   post:
 *     summary: Rollback deployment
 *     description: Rollback to this specific deployment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID to rollback to
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Rollback initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Deployment'
 *       400:
 *         description: Cannot rollback to failed deployment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Cannot rollback to failed deployment"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/deployments/{id}/promote:
 *   post:
 *     summary: Promote deployment
 *     description: Promote deployment to production environment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID to promote
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               environment:
 *                 type: string
 *                 enum: [staging, production]
 *                 default: production
 *               customDomain:
 *                 type: string
 *                 description: Custom domain for production
 *           example:
 *             environment: "production"
 *             customDomain: "myapp.com"
 *     responses:
 *       201:
 *         description: Deployment promoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Deployment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/deployments/webhook/{projectId}:
 *   post:
 *     summary: Deploy via webhook
 *     description: Trigger deployment via GitHub/GitLab webhook
 *     tags: [Deployments]
 *     security: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *       - name: X-GitHub-Event
 *         in: header
 *         description: GitHub event type
 *         schema:
 *           type: string
 *       - name: X-GitLab-Event
 *         in: header
 *         description: GitLab event type
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Webhook payload from Git provider
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deployment:
 *                           $ref: '#/components/schemas/Deployment'
 *                         triggered:
 *                           type: boolean
 *       400:
 *         description: Invalid webhook payload
 *       401:
 *         description: Invalid webhook signature
 *       404:
 *         description: Project not found
 */
