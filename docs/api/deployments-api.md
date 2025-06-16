# Deployments API

Deploy and manage applications programmatically using the Deployio Deployments API.

## Overview

The Deployments API provides comprehensive endpoints for managing application deployments, from initiating new deployments to monitoring their progress and managing rollbacks. This API is designed for automation and integration with your existing CI/CD pipelines.

## Authentication

All API requests require authentication using API keys or OAuth 2.0 tokens. Include your authentication token in the `Authorization` header.

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     https://api.deployio.dev/v1/deployments
```

## Base URL

```
https://api.deployio.dev/v1
```

## Endpoints

### List Deployments

Get a list of all deployments for your account or a specific project.

**GET** `/deployments`

#### Query Parameters

- `project_id` (string, optional): Filter by project ID
- `environment` (string, optional): Filter by environment (dev, staging, production)
- `status` (string, optional): Filter by status (pending, running, success, failed)
- `limit` (integer, optional): Number of results per page (default: 20, max: 100)
- `offset` (integer, optional): Pagination offset (default: 0)
- `sort` (string, optional): Sort field and direction (e.g., "created_at:desc")

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/deployments?project_id=proj_123&environment=production&limit=10"
```

#### Example Response

```json
{
  "data": [
    {
      "id": "dep_abc123",
      "project_id": "proj_123",
      "environment": "production",
      "status": "success",
      "commit_sha": "a1b2c3d4e5f6",
      "branch": "main",
      "created_at": "2024-01-15T10:30:00Z",
      "started_at": "2024-01-15T10:30:05Z",
      "completed_at": "2024-01-15T10:32:30Z",
      "duration": 145,
      "deployed_by": {
        "id": "user_456",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "artifacts": {
        "build_logs": "https://api.deployio.dev/v1/deployments/dep_abc123/logs",
        "deployment_url": "https://prod-app.example.com"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

### Get Deployment Details

Retrieve detailed information about a specific deployment.

**GET** `/deployments/{deployment_id}`

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/deployments/dep_abc123"
```

#### Example Response

```json
{
  "id": "dep_abc123",
  "project_id": "proj_123",
  "environment": "production",
  "status": "success",
  "commit_sha": "a1b2c3d4e5f6",
  "commit_message": "Fix user authentication bug",
  "branch": "main",
  "tag": "v1.2.3",
  "created_at": "2024-01-15T10:30:00Z",
  "started_at": "2024-01-15T10:30:05Z",
  "completed_at": "2024-01-15T10:32:30Z",
  "duration": 145,
  "deployed_by": {
    "id": "user_456",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "configuration": {
    "build_command": "npm run build",
    "install_command": "npm ci",
    "environment_variables": {
      "NODE_ENV": "production",
      "API_URL": "https://api.example.com"
    }
  },
  "artifacts": {
    "build_logs": "https://api.deployio.dev/v1/deployments/dep_abc123/logs",
    "deployment_url": "https://prod-app.example.com",
    "preview_url": null
  },
  "metrics": {
    "build_time": 120,
    "deploy_time": 25,
    "bundle_size": "2.5MB",
    "assets_count": 45
  }
}
```

### Create Deployment

Initiate a new deployment for a project.

**POST** `/deployments`

#### Request Body

```json
{
  "project_id": "proj_123",
  "environment": "production",
  "branch": "main",
  "commit_sha": "a1b2c3d4e5f6",
  "configuration": {
    "build_command": "npm run build",
    "install_command": "npm ci",
    "environment_variables": {
      "NODE_ENV": "production",
      "API_URL": "https://api.example.com"
    }
  },
  "options": {
    "force_rebuild": false,
    "skip_cache": false,
    "run_tests": true,
    "notify_on_completion": true
  }
}
```

#### Example Request

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "project_id": "proj_123",
       "environment": "production",
       "branch": "main",
       "commit_sha": "a1b2c3d4e5f6"
     }' \
     "https://api.deployio.dev/v1/deployments"
```

#### Example Response

```json
{
  "id": "dep_xyz789",
  "project_id": "proj_123",
  "environment": "production",
  "status": "pending",
  "commit_sha": "a1b2c3d4e5f6",
  "branch": "main",
  "created_at": "2024-01-15T14:20:00Z",
  "estimated_duration": 180,
  "queue_position": 0,
  "webhook_url": "https://api.deployio.dev/v1/deployments/dep_xyz789/webhook"
}
```

### Cancel Deployment

Cancel a deployment that is currently pending or running.

**POST** `/deployments/{deployment_id}/cancel`

#### Example Request

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/deployments/dep_xyz789/cancel"
```

#### Example Response

```json
{
  "id": "dep_xyz789",
  "status": "cancelled",
  "cancelled_at": "2024-01-15T14:25:00Z",
  "message": "Deployment cancelled by user request"
}
```

### Rollback Deployment

Rollback to a previous successful deployment.

**POST** `/deployments/{deployment_id}/rollback`

#### Request Body

```json
{
  "target_deployment_id": "dep_abc123",
  "reason": "Critical bug in current version"
}
```

#### Example Request

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "target_deployment_id": "dep_abc123",
       "reason": "Critical bug in current version"
     }' \
     "https://api.deployio.dev/v1/deployments/dep_xyz789/rollback"
```

#### Example Response

```json
{
  "rollback_deployment": {
    "id": "dep_rollback_001",
    "original_deployment_id": "dep_xyz789",
    "target_deployment_id": "dep_abc123",
    "status": "pending",
    "created_at": "2024-01-15T15:00:00Z"
  }
}
```

### Get Deployment Logs

Retrieve build and deployment logs for a specific deployment.

**GET** `/deployments/{deployment_id}/logs`

#### Query Parameters

- `type` (string, optional): Log type (build, deploy, runtime) - default: all
- `follow` (boolean, optional): Stream logs for ongoing deployments
- `since` (string, optional): ISO 8601 timestamp to filter logs from

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/deployments/dep_abc123/logs?type=build"
```

#### Example Response

```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:10Z",
      "level": "info",
      "type": "build",
      "message": "Starting build process...",
      "source": "builder"
    },
    {
      "timestamp": "2024-01-15T10:30:15Z",
      "level": "info",
      "type": "build",
      "message": "Installing dependencies...",
      "source": "npm"
    },
    {
      "timestamp": "2024-01-15T10:31:45Z",
      "level": "info",
      "type": "build",
      "message": "Build completed successfully",
      "source": "builder"
    }
  ],
  "has_more": false,
  "total_lines": 156
}
```

### Get Deployment Metrics

Retrieve performance metrics for a deployment.

**GET** `/deployments/{deployment_id}/metrics`

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/deployments/dep_abc123/metrics"
```

#### Example Response

```json
{
  "deployment_id": "dep_abc123",
  "metrics": {
    "build": {
      "duration": 120,
      "cache_hit_rate": 0.85,
      "bundle_size": 2621440,
      "dependency_count": 45
    },
    "deploy": {
      "duration": 25,
      "transfer_size": 2621440,
      "health_check_time": 5
    },
    "performance": {
      "first_response_time": 150,
      "average_response_time": 75,
      "error_rate": 0.001
    }
  },
  "generated_at": "2024-01-15T10:32:30Z"
}
```

## Batch Operations

### Bulk Deploy

Deploy multiple projects or environments simultaneously.

**POST** `/deployments/bulk`

#### Request Body

```json
{
  "deployments": [
    {
      "project_id": "proj_123",
      "environment": "staging",
      "branch": "develop"
    },
    {
      "project_id": "proj_456",
      "environment": "production",
      "branch": "main",
      "tag": "v2.0.0"
    }
  ],
  "options": {
    "parallel": true,
    "max_concurrent": 3,
    "fail_fast": false
  }
}
```

### Bulk Status Check

Check the status of multiple deployments.

**POST** `/deployments/status`

#### Request Body

```json
{
  "deployment_ids": ["dep_abc123", "dep_xyz789", "dep_def456"]
}
```

## Webhooks

### Configure Deployment Webhooks

Set up webhooks to receive real-time deployment notifications.

**POST** `/projects/{project_id}/webhooks`

#### Request Body

```json
{
  "url": "https://your-app.com/webhooks/deployments",
  "events": [
    "deployment.started",
    "deployment.completed",
    "deployment.failed",
    "deployment.cancelled"
  ],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload Example

```json
{
  "event": "deployment.completed",
  "timestamp": "2024-01-15T10:32:30Z",
  "data": {
    "deployment": {
      "id": "dep_abc123",
      "project_id": "proj_123",
      "environment": "production",
      "status": "success",
      "commit_sha": "a1b2c3d4e5f6",
      "duration": 145,
      "deployment_url": "https://prod-app.example.com"
    }
  }
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid project_id format",
    "details": {
      "field": "project_id",
      "expected": "string starting with 'proj_'"
    }
  }
}
```

#### 404 Not Found

```json
{
  "error": {
    "code": "DEPLOYMENT_NOT_FOUND",
    "message": "Deployment with ID 'dep_invalid' not found"
  }
}
```

#### 409 Conflict

```json
{
  "error": {
    "code": "DEPLOYMENT_IN_PROGRESS",
    "message": "A deployment is already in progress for this environment",
    "details": {
      "active_deployment_id": "dep_xyz789"
    }
  }
}
```

#### 429 Rate Limit Exceeded

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 100,
      "window": 3600,
      "retry_after": 60
    }
  }
}
```

## Rate Limits

- **Standard**: 100 requests per hour per API key
- **Professional**: 500 requests per hour per API key
- **Enterprise**: 2000 requests per hour per API key

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## SDKs and Libraries

### Node.js

```bash
npm install @deployio/api-client
```

```javascript
const DeployioAPI = require("@deployio/api-client");
const client = new DeployioAPI({ apiKey: "your_api_key" });

// Create deployment
const deployment = await client.deployments.create({
  project_id: "proj_123",
  environment: "production",
  branch: "main",
});
```

### Python

```bash
pip install deployio-api
```

```python
from deployio_api import DeployioClient

client = DeployioClient(api_key='your_api_key')

# List deployments
deployments = client.deployments.list(project_id='proj_123')
```

### Go

```bash
go get github.com/deployio/go-client
```

```go
import "github.com/deployio/go-client"

client := deployio.NewClient("your_api_key")
deployment, err := client.Deployments.Create(&deployio.CreateDeploymentRequest{
    ProjectID:   "proj_123",
    Environment: "production",
    Branch:      "main",
})
```

## Examples and Use Cases

### CI/CD Integration

#### GitHub Actions

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy with Deployio
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.DEPLOYIO_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "project_id": "proj_123",
              "environment": "production",
              "commit_sha": "${{ github.sha }}"
            }' \
            https://api.deployio.dev/v1/deployments
```

#### GitLab CI

```yaml
deploy_production:
  stage: deploy
  script:
    - |
      curl -X POST \
        -H "Authorization: Bearer $DEPLOYIO_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
          \"project_id\": \"proj_123\",
          \"environment\": \"production\",
          \"commit_sha\": \"$CI_COMMIT_SHA\"
        }" \
        https://api.deployio.dev/v1/deployments
  only:
    - main
```

### Monitoring Integration

```javascript
// Monitor deployment status
async function monitorDeployment(deploymentId) {
  let status = "pending";

  while (["pending", "running"].includes(status)) {
    const response = await fetch(
      `https://api.deployio.dev/v1/deployments/${deploymentId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const deployment = await response.json();
    status = deployment.status;

    console.log(`Deployment ${deploymentId} status: ${status}`);

    if (status === "success") {
      console.log(
        `✅ Deployment completed: ${deployment.artifacts.deployment_url}`
      );
      break;
    } else if (status === "failed") {
      console.error(`❌ Deployment failed`);
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
```

---

_For more advanced deployment automation and enterprise features, check out our [DevOps Automation](../products/devops-automation.md) product._
