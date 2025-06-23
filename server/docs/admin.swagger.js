/**
 * @swagger
 *
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (Admin)
 *     description: Admin endpoint to manage all users in the system
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - name: search
 *         in: query
 *         description: Search users by name, email, or ID
 *         schema:
 *           type: string
 *       - name: role
 *         in: query
 *         description: Filter by user role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *       - name: status
 *         in: query
 *         description: Filter by account status
 *         schema:
 *           type: string
 *           enum: [active, suspended, pending]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/User'
 *                           - type: object
 *                             properties:
 *                               projectCount:
 *                                 type: number
 *                               deploymentCount:
 *                                 type: number
 *                               lastLoginAt:
 *                                 type: string
 *                                 format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/v1/admin/users/{id}/suspend:
 *   post:
 *     summary: Suspend user account
 *     description: Suspend user account and disable access
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID to suspend
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for suspension
 *               duration:
 *                 type: string
 *                 description: Suspension duration (e.g., "7d", "30d", "permanent")
 *           example:
 *             reason: "Terms of service violation"
 *             duration: "30d"
 *     responses:
 *       200:
 *         description: User suspended successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/admin/users/{id}/unsuspend:
 *   post:
 *     summary: Unsuspend user account
 *     description: Restore suspended user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID to unsuspend
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unsuspended successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/admin/projects:
 *   get:
 *     summary: Get all projects (Admin)
 *     description: Admin endpoint to view all projects in the system
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - name: search
 *         in: query
 *         description: Search projects by name or owner
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         description: Filter by project status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deploying, failed]
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Project'
 *                           - type: object
 *                             properties:
 *                               owner:
 *                                 $ref: '#/components/schemas/User'
 *                               deploymentCount:
 *                                 type: number
 *                               lastDeploymentAt:
 *                                 type: string
 *                                 format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/v1/admin/deployments:
 *   get:
 *     summary: Get all deployments (Admin)
 *     description: Admin endpoint to view all deployments in the system
 *     tags: [Admin]
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
 *       - name: userId
 *         in: query
 *         description: Filter by user ID
 *         schema:
 *           type: string
 *       - name: projectId
 *         in: query
 *         description: Filter by project ID
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
 *                         allOf:
 *                           - $ref: '#/components/schemas/Deployment'
 *                           - type: object
 *                             properties:
 *                               project:
 *                                 $ref: '#/components/schemas/Project'
 *                               user:
 *                                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/v1/admin/analytics:
 *   get:
 *     summary: Get system analytics
 *     description: Get comprehensive system analytics and metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         description: Analytics period
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d, 1y]
 *           default: 30d
 *       - name: metrics
 *         in: query
 *         description: Specific metrics to include
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [users, projects, deployments, traffic, errors, performance]
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         overview:
 *                           type: object
 *                           properties:
 *                             totalUsers:
 *                               type: number
 *                             activeUsers:
 *                               type: number
 *                             totalProjects:
 *                               type: number
 *                             totalDeployments:
 *                               type: number
 *                             successRate:
 *                               type: number
 *                               description: Deployment success rate (0-1)
 *                         trends:
 *                           type: object
 *                           properties:
 *                             userGrowth:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   date:
 *                                     type: string
 *                                     format: date
 *                                   count:
 *                                     type: number
 *                             deploymentVolume:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   date:
 *                                     type: string
 *                                     format: date
 *                                   successful:
 *                                     type: number
 *                                   failed:
 *                                     type: number
 *                         performance:
 *                           type: object
 *                           properties:
 *                             averageBuildTime:
 *                               type: number
 *                               description: Average build time in seconds
 *                             averageDeployTime:
 *                               type: number
 *                               description: Average deploy time in seconds
 *                             errorRate:
 *                               type: number
 *                               description: Error rate (0-1)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/v1/admin/system/health:
 *   get:
 *     summary: Get system health status
 *     description: Get detailed system health and status information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, degraded, unhealthy]
 *                         services:
 *                           type: object
 *                           properties:
 *                             database:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: string
 *                                   enum: [up, down, degraded]
 *                                 responseTime:
 *                                   type: number
 *                                 connections:
 *                                   type: number
 *                             redis:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: string
 *                                   enum: [up, down, degraded]
 *                                 memory:
 *                                   type: object
 *                                   properties:
 *                                     used:
 *                                       type: number
 *                                     total:
 *                                       type: number
 *                             storage:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: string
 *                                   enum: [up, down, degraded]
 *                                 usage:
 *                                   type: object
 *                                   properties:
 *                                     used:
 *                                       type: number
 *                                     total:
 *                                       type: number
 *                         uptime:
 *                           type: number
 *                           description: System uptime in seconds
 *                         version:
 *                           type: string
 *                         environment:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/v1/admin/system/logs:
 *   get:
 *     summary: Get system logs
 *     description: Retrieve system logs for debugging and monitoring
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: level
 *         in: query
 *         description: Log level filter
 *         schema:
 *           type: string
 *           enum: [debug, info, warn, error]
 *       - name: service
 *         in: query
 *         description: Service filter
 *         schema:
 *           type: string
 *           enum: [api, auth, deployment, ai]
 *       - name: limit
 *         in: query
 *         description: Number of log entries to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *       - name: since
 *         in: query
 *         description: Get logs since this timestamp
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: System logs retrieved successfully
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
 *                                 enum: [debug, info, warn, error]
 *                               service:
 *                                 type: string
 *                               message:
 *                                 type: string
 *                               metadata:
 *                                 type: object
 *                         hasMore:
 *                           type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
