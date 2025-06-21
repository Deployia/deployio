# DeployIO Notification System - Usage Examples

## Overview

The DeployIO notification system is a comprehensive, multi-channel notification engine that supports in-app, email, and push notifications with advanced features like templates, queuing, and user preferences.

## Quick Start

### Basic Usage

```javascript
const notificationService = require("../services/notification");

// Create a simple notification
await notificationService.createNotification({
  userId: "user123",
  type: "deployment.success",
  title: "Deployment Successful!",
  message: "Your app has been deployed successfully.",
  priority: "normal",
});
```

### Using Helper Functions (Recommended)

```javascript
const { NotificationHelpers } = require("../services/notification");

// Deployment notifications
await NotificationHelpers.deploymentSuccess("user123", {
  projectName: "My Project",
  environment: "production",
  deploymentId: "deploy123",
  projectId: "project123",
  duration: "2m 30s",
  url: "https://myapp.com",
});

// Security notifications
await NotificationHelpers.securityNewDeviceLogin("user123", {
  deviceInfo: "Chrome on Windows",
  location: "San Francisco, CA",
  ipAddress: "192.168.1.1",
  loginTime: new Date(),
});

// System notifications (to all users)
await NotificationHelpers.systemMaintenance({
  startTime: new Date("2024-01-15T02:00:00Z"),
  endTime: new Date("2024-01-15T04:00:00Z"),
  duration: "2 hours",
  affectedServices: ["deployments", "project-analysis"],
});
```

## Integration Examples

### In Deployment Service

```javascript
// server/services/deployment/deploymentService.js
const { helpers: NotificationHelpers } = require("../notification");

class DeploymentService {
  async startDeployment(deploymentData) {
    try {
      // Start deployment logic...

      // Send notification
      await NotificationHelpers.deploymentStarted(deploymentData.userId, {
        projectName: deploymentData.projectName,
        environment: deploymentData.environment,
        deploymentId: deployment._id,
        projectId: deploymentData.projectId,
        url: deployment.url,
      });

      return deployment;
    } catch (error) {
      // Send failure notification
      await NotificationHelpers.deploymentFailed(deploymentData.userId, {
        projectName: deploymentData.projectName,
        environment: deploymentData.environment,
        deploymentId: deployment._id,
        projectId: deploymentData.projectId,
        error: error.message,
        logsUrl: `/deployments/${deployment._id}/logs`,
      });
      throw error;
    }
  }
}
```

### In Authentication Service

```javascript
// server/services/user/authService.js
const { helpers: NotificationHelpers } = require("../notification");

class AuthService {
  async login(loginData) {
    // Login logic...

    // Check if new device
    if (isNewDevice) {
      await NotificationHelpers.securityNewDeviceLogin(user._id, {
        deviceInfo: req.headers["user-agent"],
        location: getLocationFromIP(req.ip),
        ipAddress: req.ip,
        loginTime: new Date(),
      });
    }

    return { token, user };
  }

  async changePassword(userId) {
    // Password change logic...

    // Send confirmation notification
    await NotificationHelpers.securityPasswordChanged(userId);
  }
}
```

### In Project Service

```javascript
// server/services/project/projectService.js
const { helpers: NotificationHelpers } = require("../notification");

class ProjectService {
  async addCollaborator(projectId, collaboratorData) {
    // Add collaborator logic...

    // Notify existing collaborators
    const existingCollaborators = await this.getProjectCollaborators(projectId);

    for (const collaborator of existingCollaborators) {
      await NotificationHelpers.projectCollaboratorAdded(collaborator.userId, {
        projectName: project.name,
        projectId: project._id,
        collaboratorName: collaboratorData.name,
        collaboratorEmail: collaboratorData.email,
        role: collaboratorData.role,
      });
    }
  }

  async completeAnalysis(projectId, analysisResults) {
    // Analysis completion logic...

    // Notify project owner
    await NotificationHelpers.projectAnalysisComplete(project.owner, {
      projectName: project.name,
      projectId: project._id,
      analysisResults,
    });
  }
}
```

## Advanced Usage

### Custom Notifications with Templates

```javascript
const notificationService = require("../services/notification");

// Create notification with custom context and action
await notificationService.createNotification({
  userId: "user123",
  type: "deployment.failed",
  title: "Deployment Failed",
  message: "Your deployment encountered an error.",
  priority: "high",
  context: {
    project: { name: "My App", _id: "project123" },
    deployment: { _id: "deploy123", environmentName: "production" },
    error: "Build failed: missing dependency",
  },
  action: {
    label: "View Logs",
    url: "/deployments/deploy123/logs",
    type: "button",
  },
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});
```

### Bulk Notifications

```javascript
const { NotificationHelpers } = require("../services/notification");

// Send notifications to multiple users
const notifications = [
  {
    userId: "user1",
    type: "general.announcement",
    title: "New Feature Released",
    message: "Check out our new deployment analytics dashboard!",
    priority: "normal",
  },
  {
    userId: "user2",
    type: "system.quota_warning",
    title: "Quota Warning",
    message: "You have used 80% of your deployment quota.",
    priority: "normal",
  },
];

const results = await NotificationHelpers.sendBulkNotifications(notifications);
```

### Managing User Preferences

```javascript
const userService = require("../services/user/userService");

// Get user preferences
const preferences = await userService.getNotificationPreferences("user123");

// Update preferences
await userService.updateNotificationPreferences("user123", {
  email: true,
  push: false,
  deploymentSuccess: true,
  deploymentFailure: true,
  securityAlerts: true,
  quietHours: {
    enabled: true,
    start: "22:00",
    end: "08:00",
    timezone: "America/New_York",
  },
});
```

### Querying Notifications

```javascript
const notificationService = require("../services/notification");

// Get user notifications with filters
const result = await notificationService.getUserNotifications("user123", {
  status: "unread",
  type: "deployment.failed",
  priority: "high",
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
});

// Get notification statistics
const stats = await notificationService.getNotificationStats("user123");
// Returns: { total: 45, unread: 3, read: 40, archived: 2, priorityStats: {...} }
```

### Real-time Notifications (WebSocket)

```javascript
// In your WebSocket connection handler
const io = require("socket.io")(server);

io.on("connection", (socket) => {
  // Join user room for notifications
  socket.on("join-notifications", (userId) => {
    socket.join(`user_${userId}`);
  });
});

// The notification system automatically sends real-time updates to connected users
// via the InAppChannel when notifications are created
```

## API Endpoints

### User Notification Endpoints

```javascript
// Get notifications
GET /api/v1/notifications?status=unread&page=1&limit=20

// Mark notifications as read
PUT /api/v1/notifications/read
Body: { "notificationIds": ["id1", "id2"] }

// Mark all as read
PUT /api/v1/notifications/read-all

// Delete notifications
DELETE /api/v1/notifications
Body: { "notificationIds": ["id1", "id2"] }

// Get notification stats
GET /api/v1/notifications/stats

// Get preferences
GET /api/v1/notifications/preferences

// Update preferences
PUT /api/v1/notifications/preferences
Body: { "email": true, "push": false, "deploymentSuccess": true }
```

### Admin Endpoints

```javascript
// Send immediate notification (admin only)
POST /api/v1/notifications/send
Body: {
  "userId": "user123", // or "systemWide": true for all users
  "type": "general.announcement",
  "title": "Important Update",
  "message": "Please update your payment method.",
  "priority": "high"
}

// Create test notification (development only)
POST /api/v1/notifications/test
Body: {
  "type": "deployment.success",
  "title": "Test Notification",
  "message": "This is a test notification."
}
```

## Error Handling

```javascript
try {
  await NotificationHelpers.deploymentSuccess(userId, deploymentData);
} catch (error) {
  // Notification errors are logged but don't break the main flow
  console.error("Failed to send notification:", error.message);
  // Continue with your main logic...
}
```

## Environment Variables

```bash
# Email configuration (required for email notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@deployio.com

# Push notification configuration (optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Apple Push Notifications (optional)
APN_KEY_ID=your-key-id
APN_TEAM_ID=your-team-id
APN_PRIVATE_KEY=your-private-key
APN_BUNDLE_ID=com.yourapp.bundleid

# Frontend URL for links
FRONTEND_URL=https://your-app.com
SUPPORT_EMAIL=support@deployio.com
```

## Best Practices

1. **Use Helper Functions**: Always prefer `NotificationHelpers` over direct service calls
2. **Handle Errors Gracefully**: Notification failures shouldn't break your main business logic
3. **Respect User Preferences**: The system automatically checks user preferences before sending
4. **Use Appropriate Priority**: Use `urgent` sparingly, `high` for important alerts, `normal` for most notifications
5. **Provide Context**: Include relevant context data for better email templates and user experience
6. **Set Expiration**: Use `expiresAt` for time-sensitive notifications
7. **Test in Development**: Use the test endpoint to verify notification flow

## Monitoring and Analytics

```javascript
// Get queue statistics (for monitoring)
const queueStats = notificationService.queue.getQueueStats();
// Returns: { total: 10, ready: 5, scheduled: 5, byPriority: {...}, processing: false }

// Get notification statistics for analytics
const userStats = await notificationService.getNotificationStats("user123");
```

This notification system provides a robust foundation for all communication needs in the DeployIO platform, with built-in scalability, user preference management, and multi-channel delivery capabilities.
