/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User profile and account management
 *
 * /api/v1/user/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile information with optional image upload
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *               bio:
 *                 type: string
 *                 description: User's biography
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input data"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/v1/user/update-password:
 *   put:
 *     summary: Update user password
 *     description: Update the user's password with current password verification
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 description: New password (minimum 8 characters)
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *       400:
 *         description: Bad request - Invalid password or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Current password is incorrect"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/v1/user/notification-preferences:
 *   get:
 *     summary: Get notification preferences
 *     description: Retrieve user's notification preferences
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     deployments:
 *                       type: boolean
 *                       description: Deployment notifications
 *                       example: true
 *                     security:
 *                       type: boolean
 *                       description: Security alert notifications
 *                       example: true
 *                     marketing:
 *                       type: boolean
 *                       description: Marketing and promotional notifications
 *                       example: false
 *                     updates:
 *                       type: boolean
 *                       description: Platform update notifications
 *                       example: true
 *                     email:
 *                       type: boolean
 *                       description: Email notifications enabled
 *                       example: true
 *                     inApp:
 *                       type: boolean
 *                       description: In-app notifications enabled
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update notification preferences
 *     description: Update user's notification preferences
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deployments:
 *                 type: boolean
 *                 description: Enable deployment notifications
 *               security:
 *                 type: boolean
 *                 description: Enable security alert notifications
 *               marketing:
 *                 type: boolean
 *                 description: Enable marketing notifications
 *               updates:
 *                 type: boolean
 *                 description: Enable platform update notifications
 *               email:
 *                 type: boolean
 *                 description: Enable email notifications
 *               inApp:
 *                 type: boolean
 *                 description: Enable in-app notifications
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification preferences updated successfully"
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     deployments:
 *                       type: boolean
 *                       example: true
 *                     security:
 *                       type: boolean
 *                       example: true
 *                     marketing:
 *                       type: boolean
 *                       example: false
 *                     updates:
 *                       type: boolean
 *                       example: true
 *                     email:
 *                       type: boolean
 *                       example: true
 *                     inApp:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - Invalid preference values
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid notification preference values"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         bio:
 *           type: string
 *           description: User's biography
 *         profileImage:
 *           type: string
 *           description: URL to user's profile image
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether user's email is verified
 *         twoFactorEnabled:
 *           type: boolean
 *           description: Whether 2FA is enabled
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
