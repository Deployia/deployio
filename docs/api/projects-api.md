# Projects API

Manage your deployment projects programmatically with the Projects API. Create, configure, and manage projects, environments, and deployment settings through our comprehensive REST API.

## Base URL

```
https://api.deployio.com/v1/projects
```

## Authentication

All API requests require authentication. See [Authentication](./authentication.md) for details.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.deployio.com/v1/projects
```

## Projects

### List Projects

Get a list of all projects you have access to.

```http
GET /v1/projects
```

#### Parameters

| Parameter | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| `page`    | integer | Page number (default: 1)                       |
| `limit`   | integer | Items per page (default: 50, max: 100)         |
| `search`  | string  | Search projects by name or description         |
| `status`  | string  | Filter by status: `active`, `archived`         |
| `sort`    | string  | Sort field: `name`, `created_at`, `updated_at` |
| `order`   | string  | Sort order: `asc`, `desc`                      |

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.deployio.com/v1/projects?limit=20&sort=name&order=asc"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj_abc123",
        "name": "my-web-app",
        "description": "My awesome web application",
        "status": "active",
        "repository": {
          "url": "https://github.com/company/web-app",
          "provider": "github",
          "branch": "main"
        },
        "environments": ["development", "staging", "production"],
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-20T14:45:00Z",
        "owner": {
          "id": "user_xyz789",
          "name": "John Doe",
          "email": "john@company.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get Project

Retrieve details for a specific project.

```http
GET /v1/projects/{projectId}
```

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.deployio.com/v1/projects/proj_abc123
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "proj_abc123",
    "name": "my-web-app",
    "description": "My awesome web application",
    "status": "active",
    "repository": {
      "url": "https://github.com/company/web-app",
      "provider": "github",
      "branch": "main",
      "auto_deploy": true
    },
    "build": {
      "command": "npm run build",
      "output_dir": "dist",
      "node_version": "18",
      "cache_enabled": true
    },
    "environments": [
      {
        "name": "development",
        "url": "https://dev.my-web-app.deployio.app",
        "status": "active",
        "auto_deploy": true,
        "branch": "develop"
      },
      {
        "name": "staging",
        "url": "https://staging.my-web-app.deployio.app",
        "status": "active",
        "auto_deploy": true,
        "branch": "main"
      },
      {
        "name": "production",
        "url": "https://my-web-app.com",
        "status": "active",
        "auto_deploy": false,
        "branch": "main"
      }
    ],
    "team": [
      {
        "user_id": "user_xyz789",
        "role": "owner",
        "permissions": ["admin"]
      },
      {
        "user_id": "user_def456",
        "role": "developer",
        "permissions": ["deploy", "logs"]
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
  }
}
```

### Create Project

Create a new project.

```http
POST /v1/projects
```

#### Request Body

```json
{
  "name": "my-new-app",
  "description": "My new application",
  "repository": {
    "url": "https://github.com/company/new-app",
    "provider": "github",
    "branch": "main"
  },
  "build": {
    "command": "npm run build",
    "output_dir": "dist",
    "node_version": "18"
  },
  "environments": [
    {
      "name": "development",
      "auto_deploy": true,
      "branch": "develop"
    },
    {
      "name": "production",
      "auto_deploy": false,
      "branch": "main"
    }
  ]
}
```

#### Example Request

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "my-new-app",
       "description": "My new application",
       "repository": {
         "url": "https://github.com/company/new-app",
         "provider": "github",
         "branch": "main"
       }
     }' \
     https://api.deployio.com/v1/projects
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "proj_def456",
    "name": "my-new-app",
    "description": "My new application",
    "status": "active",
    "repository": {
      "url": "https://github.com/company/new-app",
      "provider": "github",
      "branch": "main",
      "auto_deploy": false
    },
    "environments": [],
    "created_at": "2024-01-21T09:15:00Z",
    "updated_at": "2024-01-21T09:15:00Z"
  }
}
```

### Update Project

Update an existing project.

```http
PUT /v1/projects/{projectId}
```

#### Request Body

```json
{
  "name": "updated-app-name",
  "description": "Updated description",
  "build": {
    "command": "npm run build:prod",
    "output_dir": "build",
    "node_version": "20"
  }
}
```

#### Example Request

```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Updated description"
     }' \
     https://api.deployio.com/v1/projects/proj_abc123
```

### Delete Project

Delete a project and all its deployments.

```http
DELETE /v1/projects/{projectId}
```

#### Example Request

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.deployio.com/v1/projects/proj_abc123
```

#### Example Response

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

## Environments

### List Environments

Get environments for a project.

```http
GET /v1/projects/{projectId}/environments
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "environments": [
      {
        "id": "env_abc123",
        "name": "production",
        "url": "https://my-web-app.com",
        "status": "active",
        "auto_deploy": false,
        "branch": "main",
        "variables": {
          "NODE_ENV": "production",
          "PORT": "3000"
        },
        "secrets": ["DATABASE_URL", "JWT_SECRET"],
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Create Environment

Add a new environment to a project.

```http
POST /v1/projects/{projectId}/environments
```

#### Request Body

```json
{
  "name": "staging",
  "auto_deploy": true,
  "branch": "develop",
  "variables": {
    "NODE_ENV": "staging",
    "DEBUG": "true"
  }
}
```

### Update Environment

Update environment configuration.

```http
PUT /v1/projects/{projectId}/environments/{environmentId}
```

### Delete Environment

Remove an environment from a project.

```http
DELETE /v1/projects/{projectId}/environments/{environmentId}
```

## Environment Variables

### List Variables

Get environment variables for an environment.

```http
GET /v1/projects/{projectId}/environments/{environmentId}/variables
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "variables": {
      "NODE_ENV": "production",
      "PORT": "3000",
      "LOG_LEVEL": "info"
    }
  }
}
```

### Set Variable

Set an environment variable.

```http
PUT /v1/projects/{projectId}/environments/{environmentId}/variables/{key}
```

#### Request Body

```json
{
  "value": "new-value"
}
```

#### Example Request

```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"value": "production"}' \
     https://api.deployio.com/v1/projects/proj_abc123/environments/env_abc123/variables/NODE_ENV
```

### Delete Variable

Remove an environment variable.

```http
DELETE /v1/projects/{projectId}/environments/{environmentId}/variables/{key}
```

## Secrets

### List Secrets

Get secret names (values are hidden).

```http
GET /v1/projects/{projectId}/environments/{environmentId}/secrets
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "secrets": [
      {
        "key": "DATABASE_URL",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-20T14:45:00Z"
      },
      {
        "key": "JWT_SECRET",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Set Secret

Set a secret value.

```http
PUT /v1/projects/{projectId}/environments/{environmentId}/secrets/{key}
```

#### Request Body

```json
{
  "value": "secret-value"
}
```

### Delete Secret

Remove a secret.

```http
DELETE /v1/projects/{projectId}/environments/{environmentId}/secrets/{key}
```

## Team Management

### List Team Members

Get team members for a project.

```http
GET /v1/projects/{projectId}/team
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "user_id": "user_xyz789",
        "email": "john@company.com",
        "name": "John Doe",
        "role": "owner",
        "permissions": ["admin"],
        "added_at": "2024-01-15T10:30:00Z"
      },
      {
        "user_id": "user_def456",
        "email": "jane@company.com",
        "name": "Jane Smith",
        "role": "developer",
        "permissions": ["deploy", "logs"],
        "added_at": "2024-01-18T15:20:00Z"
      }
    ]
  }
}
```

### Add Team Member

Add a user to the project team.

```http
POST /v1/projects/{projectId}/team
```

#### Request Body

```json
{
  "email": "new-member@company.com",
  "role": "developer",
  "permissions": ["deploy", "logs"]
}
```

### Update Team Member

Update team member permissions.

```http
PUT /v1/projects/{projectId}/team/{userId}
```

### Remove Team Member

Remove a user from the project team.

```http
DELETE /v1/projects/{projectId}/team/{userId}
```

## Project Statistics

### Get Project Stats

Get project statistics and metrics.

```http
GET /v1/projects/{projectId}/stats
```

#### Parameters

| Parameter | Type   | Description                           |
| --------- | ------ | ------------------------------------- |
| `period`  | string | Time period: `1d`, `7d`, `30d`, `90d` |
| `metrics` | string | Comma-separated metrics to include    |

#### Example Response

```json
{
  "success": true,
  "data": {
    "deployments": {
      "total": 156,
      "successful": 148,
      "failed": 8,
      "success_rate": 94.9
    },
    "performance": {
      "avg_build_time": 120,
      "avg_deploy_time": 45,
      "uptime": 99.8
    },
    "activity": {
      "commits_deployed": 78,
      "active_environments": 3,
      "team_members": 5
    }
  }
}
```

## Webhooks

### List Project Webhooks

Get webhooks configured for a project.

```http
GET /v1/projects/{projectId}/webhooks
```

### Create Webhook

Add a webhook to a project.

```http
POST /v1/projects/{projectId}/webhooks
```

#### Request Body

```json
{
  "url": "https://your-app.com/webhooks/deployio",
  "events": ["deployment.started", "deployment.completed", "deployment.failed"],
  "secret": "webhook-secret-key"
}
```

## Error Responses

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

### Common Error Codes

| Code                | Description               |
| ------------------- | ------------------------- |
| `VALIDATION_ERROR`  | Request validation failed |
| `PROJECT_NOT_FOUND` | Project does not exist    |
| `PERMISSION_DENIED` | Insufficient permissions  |
| `RATE_LIMITED`      | Too many requests         |
| `SERVER_ERROR`      | Internal server error     |

## Rate Limiting

The Projects API is rate limited to 1000 requests per hour per API key.

Rate limit headers:

- `X-RateLimit-Limit`: Request limit per hour
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## SDKs and Examples

### JavaScript/Node.js

```javascript
const { DeployioClient } = require("@deployio/sdk");

const client = new DeployioClient({
  apiKey: process.env.DEPLOYIO_API_KEY,
});

// Create project
const project = await client.projects.create({
  name: "my-app",
  repository: {
    url: "https://github.com/company/app",
    provider: "github",
  },
});

// List projects
const projects = await client.projects.list({
  limit: 50,
  sort: "name",
});
```

### Python

```python
from deployio import DeployioClient

client = DeployioClient(api_key='your-api-key')

# Create project
project = client.projects.create(
    name='my-app',
    repository={
        'url': 'https://github.com/company/app',
        'provider': 'github'
    }
)

# List projects
projects = client.projects.list(limit=50, sort='name')
```

### cURL Examples

```bash
# Create project
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "repository": {
      "url": "https://github.com/company/app"
    }
  }' \
  https://api.deployio.com/v1/projects

# List projects
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.deployio.com/v1/projects?limit=20&sort=name"

# Get project
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.deployio.com/v1/projects/proj_abc123
```

## Next Steps

- [Explore Deployments API](./deployments-api.md)
- [Set up webhooks](./webhooks.md)
- [Learn about authentication](./authentication.md)
- [Check rate limiting](./rate-limiting.md)

Manage your projects efficiently with the Projects API! 🚀
