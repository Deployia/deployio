/**
 * @swagger
 *
 * /api/v1/projects:
 *   get:
 *     summary: Get user projects
 *     description: Retrieve paginated list of user's projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - name: status
 *         in: query
 *         description: Filter by project status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deploying, failed]
 *       - name: search
 *         in: query
 *         description: Search projects by name or description
 *         schema:
 *           type: string
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
 *                         $ref: '#/components/schemas/Project'
 *             example:
 *               success: true
 *               message: "Projects retrieved successfully"
 *               data:
 *                 - _id: "60d5ecb54b24a627f8b7c789"
 *                   name: "My Portfolio"
 *                   description: "Personal portfolio website"
 *                   status: "active"
 *                   repository: "https://github.com/user/portfolio"
 *                   domain: "portfolio.example.com"
 *                   createdAt: "2021-06-25T10:30:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 5
 *                 pages: 1
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     summary: Create new project
 *     description: Create a new deployment project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, repository]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Project name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Project description
 *               repository:
 *                 type: string
 *                 format: uri
 *                 description: Git repository URL
 *               branch:
 *                 type: string
 *                 default: main
 *                 description: Default branch to deploy
 *               buildCommand:
 *                 type: string
 *                 description: Build command
 *               outputDirectory:
 *                 type: string
 *                 description: Output directory for built files
 *               environmentVariables:
 *                 type: object
 *                 description: Environment variables
 *           example:
 *             name: "My Portfolio"
 *             description: "Personal portfolio website"
 *             repository: "https://github.com/user/portfolio"
 *             branch: "main"
 *             buildCommand: "npm run build"
 *             outputDirectory: "dist"
 *             environmentVariables:
 *               NODE_ENV: "production"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve specific project details
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Project'
 *                         - type: object
 *                           properties:
 *                             deployments:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Deployment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update project
 *     description: Update project settings
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               branch:
 *                 type: string
 *               buildCommand:
 *                 type: string
 *               outputDirectory:
 *                 type: string
 *               environmentVariables:
 *                 type: object
 *           example:
 *             name: "Updated Portfolio"
 *             description: "Updated personal portfolio website"
 *             branch: "production"
 *             buildCommand: "npm run build:prod"
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete project
 *     description: Delete project and all associated deployments
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Project deleted successfully"
 *               data: {}
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/projects/{id}/deploy:
 *   post:
 *     summary: Deploy project
 *     description: Create new deployment for project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch:
 *                 type: string
 *                 description: Branch to deploy (override default)
 *               commit:
 *                 type: string
 *                 description: Specific commit to deploy
 *               environmentVariables:
 *                 type: object
 *                 description: Override environment variables
 *           example:
 *             branch: "feature/new-ui"
 *             environmentVariables:
 *               DEBUG: "true"
 *     responses:
 *       201:
 *         description: Deployment started successfully
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
 * /api/v1/projects/{id}/settings:
 *   get:
 *     summary: Get project settings
 *     description: Retrieve detailed project configuration
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project settings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         basic:
 *                           $ref: '#/components/schemas/Project'
 *                         deployment:
 *                           type: object
 *                           properties:
 *                             autoDeployBranches:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             notifications:
 *                               type: object
 *                               properties:
 *                                 email:
 *                                   type: boolean
 *                                 slack:
 *                                   type: boolean
 *                         domain:
 *                           type: object
 *                           properties:
 *                             custom:
 *                               type: string
 *                             ssl:
 *                               type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/projects/{id}/analytics:
 *   get:
 *     summary: Get project analytics
 *     description: Retrieve deployment statistics and metrics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *       - name: period
 *         in: query
 *         description: Analytics period
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
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
 *                         deployments:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                             successful:
 *                               type: number
 *                             failed:
 *                               type: number
 *                             averageDuration:
 *                               type: number
 *                               description: Average deployment time in seconds
 *                         traffic:
 *                           type: object
 *                           properties:
 *                             pageViews:
 *                               type: number
 *                             uniqueVisitors:
 *                               type: number
 *                             bandwidth:
 *                               type: number
 *                               description: Bandwidth usage in bytes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
