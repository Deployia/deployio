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
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               bio:
 *                 type: string
 *                 description: User's biography
 *                 example: "Software developer with 5 years of experience"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG, max 5MB)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 *                 example: "currentPassword123"
 *               newPassword:
 *                 type: string
 *                 description: New password (minimum 8 characters)
 *                 minLength: 8
 *                 example: "newPassword123"
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
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/user/notification-preferences:
 *   get:
 *     summary: Get notification preferences
 *     description: Retrieve user's notification preferences including delivery methods, notification categories, and advanced settings
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
 *                   $ref: '#/components/schemas/NotificationPreferences'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: Update notification preferences
 *     description: Update user's notification preferences. All fields are optional - only provided fields will be updated
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationPreferencesUpdate'
 *           examples:
 *             basicUpdate:
 *               summary: Basic notification update
 *               value:
 *                 email: true
 *                 inApp: true
 *                 deploymentSuccess: true
 *                 deploymentFailure: true
 *             advancedUpdate:
 *               summary: Advanced settings update
 *               value:
 *                 email: true
 *                 inApp: true
 *                 push: false
 *                 deploymentSuccess: true
 *                 deploymentFailure: true
 *                 securityAlerts: true
 *                 quietHours:
 *                   enabled: true
 *                   startTime: "22:00"
 *                   endTime: "08:00"
 *                 digestSettings:
 *                   enabled: true
 *                   frequency: "weekly"
 *                   day: "monday"
 *                   time: "09:00"
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
 *                   $ref: '#/components/schemas/NotificationPreferences'
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
 *                   example: "Invalid notification preference: quietHours.startTime must be in HH:MM format"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *           example: "60f1b2b3b3b3b3b3b3b3b3b3"
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         bio:
 *           type: string
 *           description: User's biography
 *           example: "Software developer with 5 years of experience"
 *         profileImage:
 *           type: string
 *           description: URL to user's profile image
 *           example: "https://example.com/images/profile.jpg"
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role
 *           example: "user"
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether user's email is verified
 *           example: true
 *         twoFactorEnabled:
 *           type: boolean
 *           description: Whether 2FA is enabled
 *           example: false
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *           example: "2023-12-01T10:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *           example: "2023-01-15T08:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2023-12-01T10:30:00.000Z"
 *         notificationPreferences:
 *           $ref: '#/components/schemas/NotificationPreferences'
 *
 *     NotificationPreferences:
 *       type: object
 *       description: Complete notification preferences structure
 *       properties:
 *         # Delivery Methods
 *         email:
 *           type: boolean
 *           description: Enable email notifications
 *           example: true
 *         inApp:
 *           type: boolean
 *           description: Enable in-app notifications
 *           example: true
 *         push:
 *           type: boolean
 *           description: Enable push notifications
 *           example: false
 *         # Legacy Preferences (maintained for backward compatibility)
 *         deployments:
 *           type: boolean
 *           description: Enable deployment notifications (legacy - use granular deployment notifications)
 *           example: true
 *         security:
 *           type: boolean
 *           description: Enable security alert notifications (legacy - use granular security notifications)
 *           example: true
 *         marketing:
 *           type: boolean
 *           description: Enable marketing and promotional notifications (legacy)
 *           example: false
 *         updates:
 *           type: boolean
 *           description: Enable platform update notifications (legacy - use productUpdates)
 *           example: true
 *         # Granular Deployment Notifications
 *         deploymentSuccess:
 *           type: boolean
 *           description: Notify when deployments complete successfully
 *           example: true
 *         deploymentFailure:
 *           type: boolean
 *           description: Notify when deployments fail
 *           example: true
 *         deploymentStarted:
 *           type: boolean
 *           description: Notify when deployments start
 *           example: false
 *         # Granular Security Notifications
 *         securityAlerts:
 *           type: boolean
 *           description: Notify about security threats and vulnerabilities
 *           example: true
 *         accountChanges:
 *           type: boolean
 *           description: Notify about account profile changes
 *           example: true
 *         newDeviceLogin:
 *           type: boolean
 *           description: Notify about logins from new devices
 *           example: true
 *         # Communication Preferences
 *         productUpdates:
 *           type: boolean
 *           description: Notify about new features and platform updates
 *           example: true
 *         tips:
 *           type: boolean
 *           description: Receive tips and best practices
 *           example: false
 *         # Advanced Settings
 *         quietHours:
 *           $ref: '#/components/schemas/QuietHours'
 *         digestSettings:
 *           $ref: '#/components/schemas/DigestSettings'
 *       example:
 *         email: true
 *         inApp: true
 *         push: false
 *         deployments: true
 *         security: true
 *         marketing: false
 *         updates: true
 *         deploymentSuccess: true
 *         deploymentFailure: true
 *         deploymentStarted: false
 *         securityAlerts: true
 *         accountChanges: true
 *         newDeviceLogin: true
 *         productUpdates: true
 *         tips: false
 *         quietHours:
 *           enabled: false
 *           startTime: "22:00"
 *           endTime: "08:00"
 *         digestSettings:
 *           enabled: false
 *           frequency: "weekly"
 *           day: "monday"
 *           time: "09:00"
 *
 *     NotificationPreferencesUpdate:
 *       type: object
 *       description: Notification preferences update payload - all fields are optional
 *       properties:
 *         # Delivery Methods
 *         email:
 *           type: boolean
 *           description: Enable email notifications
 *         inApp:
 *           type: boolean
 *           description: Enable in-app notifications
 *         push:
 *           type: boolean
 *           description: Enable push notifications
 *         # Legacy Preferences
 *         deployments:
 *           type: boolean
 *           description: Enable deployment notifications (legacy)
 *         security:
 *           type: boolean
 *           description: Enable security alert notifications (legacy)
 *         marketing:
 *           type: boolean
 *           description: Enable marketing notifications (legacy)
 *         updates:
 *           type: boolean
 *           description: Enable platform update notifications (legacy)
 *         # Granular Deployment Notifications
 *         deploymentSuccess:
 *           type: boolean
 *           description: Enable successful deployment notifications
 *         deploymentFailure:
 *           type: boolean
 *           description: Enable failed deployment notifications
 *         deploymentStarted:
 *           type: boolean
 *           description: Enable deployment started notifications
 *         # Granular Security Notifications
 *         securityAlerts:
 *           type: boolean
 *           description: Enable security alert notifications
 *         accountChanges:
 *           type: boolean
 *           description: Enable account change notifications
 *         newDeviceLogin:
 *           type: boolean
 *           description: Enable new device login notifications
 *         # Communication Preferences
 *         productUpdates:
 *           type: boolean
 *           description: Enable product update notifications
 *         tips:
 *           type: boolean
 *           description: Enable tips and best practices notifications
 *         # Advanced Settings
 *         quietHours:
 *           $ref: '#/components/schemas/QuietHours'
 *         digestSettings:
 *           $ref: '#/components/schemas/DigestSettings'
 *
 *     QuietHours:
 *       type: object
 *       description: Do not disturb settings for notifications
 *       properties:
 *         enabled:
 *           type: boolean
 *           description: Enable quiet hours
 *           example: false
 *         startTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Start time in HH:MM format (24-hour)
 *           example: "22:00"
 *         endTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: End time in HH:MM format (24-hour)
 *           example: "08:00"
 *       example:
 *         enabled: true
 *         startTime: "22:00"
 *         endTime: "08:00"
 *
 *     DigestSettings:
 *       type: object
 *       description: Email digest notification settings
 *       properties:
 *         enabled:
 *           type: boolean
 *           description: Enable digest emails
 *           example: false
 *         frequency:
 *           type: string
 *           enum: ["daily", "weekly", "monthly"]
 *           description: How often to send digest emails
 *           example: "weekly"
 *         day:
 *           type: string
 *           enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
 *           description: Day of the week for weekly digests (only used when frequency is 'weekly')
 *           example: "monday"
 *         time:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Time to send digest in HH:MM format (24-hour)
 *           example: "09:00"
 *       example:
 *         enabled: true
 *         frequency: "weekly"
 *         day: "monday"
 *         time: "09:00"
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Profile updated successfully"
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "An error occurred"
 *         error:
 *           type: string
 *           description: Detailed error message (only in development mode)
 *
 *   responses:
 *     BadRequest:
 *       description: Bad request - Invalid input data or validation failed
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             validationError:
 *               summary: Validation error
 *               value:
 *                 success: false
 *                 message: "Validation failed: firstName is required"
 *             invalidData:
 *               summary: Invalid data format
 *               value:
 *                 success: false
 *                 message: "Invalid notification preference values"
 *
 *     Unauthorized:
 *       description: Authentication required or token invalid
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: "Access denied. No token provided."
 *
 *     InternalServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: "Internal server error"
 */
