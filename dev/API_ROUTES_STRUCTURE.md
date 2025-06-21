# API Routes Structure - Complete Documentation

This document outlines the complete API routes structure for the Deployio backend. Routes marked as "IMPLEMENTED" have working controllers, while others are planned for future implementation.

## Authentication Routes - `/api/v1/auth`

### IMPLEMENTED

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile

### PLANNED

- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/resend-verification` - Resend verification email
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `POST /api/v1/auth/2fa/setup` - Setup 2FA
- `POST /api/v1/auth/2fa/verify` - Verify 2FA token
- `DELETE /api/v1/auth/2fa/disable` - Disable 2FA

## User Management Routes - `/api/v1/users`

### IMPLEMENTED

- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `DELETE /api/v1/users/profile` - Delete user account

### PLANNED

- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/:userId` - Get specific user (admin only)
- `PUT /api/v1/users/:userId` - Update user (admin only)
- `DELETE /api/v1/users/:userId` - Delete user (admin only)
- `POST /api/v1/users/:userId/suspend` - Suspend user (admin only)
- `POST /api/v1/users/:userId/unsuspend` - Unsuspend user (admin only)

## Project Management Routes - `/api/v1/projects`

### IMPLEMENTED

- `GET /api/v1/projects` - Get user projects
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/:projectId` - Get project details
- `PUT /api/v1/projects/:projectId` - Update project
- `DELETE /api/v1/projects/:projectId` - Delete project

### PLANNED

- `POST /api/v1/projects/:projectId/clone` - Clone project
- `POST /api/v1/projects/:projectId/fork` - Fork project
- `GET /api/v1/projects/:projectId/collaborators` - Get project collaborators
- `POST /api/v1/projects/:projectId/collaborators` - Add collaborator
- `DELETE /api/v1/projects/:projectId/collaborators/:userId` - Remove collaborator
- `PUT /api/v1/projects/:projectId/collaborators/:userId` - Update collaborator permissions

## Repository Integration Routes - `/api/v1/projects/:projectId/repository`

### IMPLEMENTED

- `POST /api/v1/projects/:projectId/repository/connect` - Connect repository
- `GET /api/v1/projects/:projectId/repository/status` - Get repository status
- `POST /api/v1/projects/:projectId/repository/sync` - Sync repository

### PLANNED

- `GET /api/v1/projects/:projectId/repository/branches` - Get repository branches
- `GET /api/v1/projects/:projectId/repository/commits` - Get recent commits
- `GET /api/v1/projects/:projectId/repository/files` - Browse repository files
- `GET /api/v1/projects/:projectId/repository/webhooks` - Get webhooks
- `POST /api/v1/projects/:projectId/repository/webhooks` - Create webhook
- `DELETE /api/v1/projects/:projectId/repository/webhooks/:webhookId` - Delete webhook

## AI Analysis Routes - `/api/v1/ai/analysis`

### IMPLEMENTED

- `POST /api/v1/ai/analysis/repository` - Analyze repository (demo)
- `POST /api/v1/ai/analysis/stack` - Analyze technology stack
- `POST /api/v1/ai/analysis/full` - Run full analysis
- `GET /api/v1/ai/analysis/technologies` - Get supported technologies
- `GET /api/v1/ai/analysis/health` - Check AI service health

### PLANNED

- `POST /api/v1/ai/analysis/code-quality` - Analyze code quality
- `POST /api/v1/ai/analysis/security` - Security analysis
- `POST /api/v1/ai/analysis/performance` - Performance analysis
- `GET /api/v1/ai/analysis/repository/:projectId` - Get repository analysis results
- `GET /api/v1/ai/analysis/stack/:projectId` - Get stack analysis results
- `GET /api/v1/ai/analysis/code-quality/:projectId` - Get code quality results
- `GET /api/v1/ai/analysis/security/:projectId` - Get security analysis results

## AI Generation Routes - `/api/v1/ai/generation`

### IMPLEMENTED

- `POST /api/v1/ai/generation/dockerfile` - Generate Dockerfile
- `POST /api/v1/ai/generation/compose` - Generate Docker Compose
- `POST /api/v1/ai/generation/pipeline` - Generate CI/CD Pipeline
- `POST /api/v1/ai/generation/kubernetes` - Generate Kubernetes manifests
- `POST /api/v1/ai/generation/environment` - Generate environment config

### PLANNED

- `GET /api/v1/ai/generation/dockerfile/:projectId` - Get generated Dockerfile
- `GET /api/v1/ai/generation/compose/:projectId` - Get generated Compose file
- `GET /api/v1/ai/generation/pipeline/:projectId` - Get generated pipeline
- `GET /api/v1/ai/generation/kubernetes/:projectId` - Get generated K8s manifests
- `POST /api/v1/ai/generation/nginx` - Generate Nginx configuration
- `POST /api/v1/ai/generation/monitoring` - Generate monitoring config

## AI Optimization Routes - `/api/v1/ai/optimization`

### IMPLEMENTED

- `POST /api/v1/ai/optimization/performance` - Optimize performance
- `POST /api/v1/ai/optimization/security` - Optimize security
- `POST /api/v1/ai/optimization/costs` - Optimize costs

### PLANNED

- `POST /api/v1/ai/optimization/recommendations` - Generate recommendations
- `GET /api/v1/ai/optimization/performance/:projectId` - Get performance optimization
- `GET /api/v1/ai/optimization/security/:projectId` - Get security optimization
- `GET /api/v1/ai/optimization/costs/:projectId` - Get cost optimization
- `GET /api/v1/ai/optimization/recommendations/:projectId` - Get recommendations

## Deployment Routes - `/api/v1/deployments`

### IMPLEMENTED

- `GET /api/v1/deployments` - Get user deployments
- `POST /api/v1/deployments` - Create new deployment
- `GET /api/v1/deployments/:deploymentId` - Get deployment details
- `DELETE /api/v1/deployments/:deploymentId` - Delete deployment

### PLANNED

- `POST /api/v1/deployments/:deploymentId/deploy` - Deploy project
- `POST /api/v1/deployments/:deploymentId/stop` - Stop deployment
- `POST /api/v1/deployments/:deploymentId/restart` - Restart deployment
- `GET /api/v1/deployments/:deploymentId/status` - Get deployment status
- `GET /api/v1/deployments/:deploymentId/logs` - Get deployment logs
- `POST /api/v1/deployments/:deploymentId/rollback` - Rollback deployment
- `GET /api/v1/deployments/:deploymentId/history` - Get deployment history

## Container Management Routes - `/api/v1/containers`

### IMPLEMENTED

- `GET /api/v1/containers` - Get user containers
- `GET /api/v1/containers/:containerId/status` - Get container status
- `GET /api/v1/containers/:containerId/logs` - Get container logs
- `POST /api/v1/containers/:containerId/start` - Start container
- `POST /api/v1/containers/:containerId/stop` - Stop container
- `POST /api/v1/containers/:containerId/restart` - Restart container
- `PUT /api/v1/containers/:containerId` - Update container
- `GET /api/v1/containers/:containerId/metrics` - Get container metrics

### PLANNED

- `POST /api/v1/containers` - Create new container
- `DELETE /api/v1/containers/:containerId` - Delete container
- `POST /api/v1/containers/:containerId/exec` - Execute command in container
- `GET /api/v1/containers/:containerId/files` - Browse container files
- `POST /api/v1/containers/:containerId/backup` - Backup container

## Logs Management Routes - `/api/v1/logs`

### IMPLEMENTED

- `GET /api/v1/logs/deployment/:deploymentId` - Get deployment logs
- `GET /api/v1/logs/build/:buildId` - Get build logs

### PLANNED

- `GET /api/v1/logs/application/:projectId` - Get application logs
- `GET /api/v1/logs/system` - Get system logs (admin only)
- `POST /api/v1/logs/search` - Search logs
- `GET /api/v1/logs/export/:type/:id` - Export logs
- `DELETE /api/v1/logs/:logId` - Delete specific log

## External Services Routes - `/api/v1/external`

### IMPLEMENTED

- `GET /api/v1/external/docs` - Get documentation
- `GET /api/v1/external/blogs` - Get blog posts

### PLANNED

- `GET /api/v1/external/integrations` - Get available integrations
- `POST /api/v1/external/integrations/:service/connect` - Connect external service
- `DELETE /api/v1/external/integrations/:service` - Disconnect service
- `GET /api/v1/external/monitoring/status` - Get monitoring status
- `POST /api/v1/external/notifications/test` - Test notifications

## Admin Routes - `/api/v1/admin`

### PLANNED

- `GET /api/v1/admin/stats` - Get system statistics
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/projects` - Get all projects
- `GET /api/v1/admin/deployments` - Get all deployments
- `POST /api/v1/admin/maintenance` - Enable maintenance mode
- `GET /api/v1/admin/logs` - Get system logs
- `POST /api/v1/admin/backup` - Create system backup
- `GET /api/v1/admin/health` - System health check

## Public Routes - `/api/v1/public`

### PLANNED

- `GET /api/v1/public/status` - API status
- `GET /api/v1/public/version` - API version
- `GET /api/v1/public/docs` - API documentation
- `GET /api/v1/public/health` - Health check endpoint

## Notes

1. All routes except public routes require authentication
2. Admin routes require admin privileges
3. Routes marked as IMPLEMENTED have working controllers
4. Routes marked as PLANNED need to be implemented
5. Some routes may require additional middleware for rate limiting, validation, etc.
6. WebSocket endpoints for real-time features are not included in this REST API structure

## Implementation Priority

### Phase 1 (Critical - Current Focus)

- Fix circular dependencies
- Ensure all IMPLEMENTED routes work correctly
- Complete basic CRUD operations

### Phase 2 (High Priority)

- AI analysis result retrieval routes
- Deployment management (deploy, stop, restart)
- Container management completion

### Phase 3 (Medium Priority)

- Repository integration features
- Collaboration features
- Advanced AI optimization

### Phase 4 (Future)

- Admin panel features
- Advanced monitoring
- External integrations
