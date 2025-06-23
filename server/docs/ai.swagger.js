/**
 * @swagger
 *
 * /api/v1/ai/chat:
 *   post:
 *     summary: AI Chat Assistant
 *     description: Get AI-powered deployment assistance and recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: User message or question
 *               context:
 *                 type: object
 *                 properties:
 *                   projectId:
 *                     type: string
 *                     description: Current project context
 *                   deploymentId:
 *                     type: string
 *                     description: Current deployment context
 *               conversationId:
 *                 type: string
 *                 description: Continue existing conversation
 *           example:
 *             message: "My deployment is failing during the build step. Can you help?"
 *             context:
 *               projectId: "60d5ecb54b24a627f8b7c789"
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         response:
 *                           type: string
 *                           description: AI-generated response
 *                         suggestions:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 enum: [command, link, action]
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               payload:
 *                                 type: object
 *                         conversationId:
 *                           type: string
 *                         tokensUsed:
 *                           type: number
 *             example:
 *               success: true
 *               message: "AI response generated"
 *               data:
 *                 response: "I can help you debug this build failure. Let me analyze your project logs..."
 *                 suggestions:
 *                   - type: "action"
 *                     title: "View Build Logs"
 *                     description: "Check the detailed build logs for errors"
 *                     payload:
 *                       action: "view_logs"
 *                       deploymentId: "60d5ecb54b24a627f8b7c999"
 *                 conversationId: "conv_abc123"
 *                 tokensUsed: 150
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: AI service rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "AI service rate limit exceeded. Please try again later."
 *
 * /api/v1/ai/analyze:
 *   post:
 *     summary: Analyze project or deployment
 *     description: Get AI analysis of project configuration or deployment issues
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, targetId]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [project, deployment, logs]
 *                 description: What to analyze
 *               targetId:
 *                 type: string
 *                 description: ID of project or deployment to analyze
 *               analysisType:
 *                 type: string
 *                 enum: [performance, security, optimization, troubleshooting]
 *                 default: troubleshooting
 *           example:
 *             type: "deployment"
 *             targetId: "60d5ecb54b24a627f8b7c999"
 *             analysisType: "troubleshooting"
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         analysis:
 *                           type: object
 *                           properties:
 *                             summary:
 *                               type: string
 *                               description: Analysis summary
 *                             issues:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   severity:
 *                                     type: string
 *                                     enum: [low, medium, high, critical]
 *                                   title:
 *                                     type: string
 *                                   description:
 *                                     type: string
 *                                   solution:
 *                                     type: string
 *                             recommendations:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   category:
 *                                     type: string
 *                                   title:
 *                                     type: string
 *                                   description:
 *                                     type: string
 *                                   impact:
 *                                     type: string
 *                                     enum: [low, medium, high]
 *                         confidence:
 *                           type: number
 *                           minimum: 0
 *                           maximum: 1
 *                           description: Analysis confidence score
 *             example:
 *               success: true
 *               message: "Analysis completed"
 *               data:
 *                 analysis:
 *                   summary: "Deployment failed due to Node.js version mismatch"
 *                   issues:
 *                     - severity: "high"
 *                       title: "Node.js Version Mismatch"
 *                       description: "Project requires Node.js 18+ but build environment uses 16"
 *                       solution: "Update your build configuration to use Node.js 18"
 *                   recommendations:
 *                     - category: "performance"
 *                       title: "Enable Build Caching"
 *                       description: "Add caching to reduce build times"
 *                       impact: "medium"
 *                 confidence: 0.95
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/ai/suggest:
 *   post:
 *     summary: Get AI suggestions
 *     description: Get AI-powered suggestions for deployment optimization
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId]
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: Project ID to get suggestions for
 *               category:
 *                 type: string
 *                 enum: [performance, security, cost, reliability]
 *                 description: Type of suggestions to focus on
 *           example:
 *             projectId: "60d5ecb54b24a627f8b7c789"
 *             category: "performance"
 *     responses:
 *       200:
 *         description: Suggestions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         suggestions:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               category:
 *                                 type: string
 *                               priority:
 *                                 type: string
 *                                 enum: [low, medium, high]
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               implementation:
 *                                 type: object
 *                                 properties:
 *                                   steps:
 *                                     type: array
 *                                     items:
 *                                       type: string
 *                                   estimatedTime:
 *                                     type: string
 *                                   difficulty:
 *                                     type: string
 *                                     enum: [easy, medium, hard]
 *                               benefits:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *             example:
 *               success: true
 *               message: "Suggestions generated"
 *               data:
 *                 suggestions:
 *                   - id: "sug_001"
 *                     category: "performance"
 *                     priority: "high"
 *                     title: "Enable Gzip Compression"
 *                     description: "Configure your server to enable gzip compression for better performance"
 *                     implementation:
 *                       steps:
 *                         - "Add compression middleware to your Express app"
 *                         - "Configure gzip level and threshold"
 *                       estimatedTime: "15 minutes"
 *                       difficulty: "easy"
 *                     benefits:
 *                       - "Reduce bandwidth usage by 60-80%"
 *                       - "Improve page load times"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/ai/conversations:
 *   get:
 *     summary: Get chat history
 *     description: Retrieve user's AI chat conversation history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           lastMessage:
 *                             type: string
 *                           messageCount:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/ai/conversations/{id}:
 *   get:
 *     summary: Get conversation details
 *     description: Retrieve specific conversation with full message history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Conversation ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               role:
 *                                 type: string
 *                                 enum: [user, assistant]
 *                               content:
 *                                 type: string
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete conversation
 *     description: Delete AI conversation history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Conversation ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
