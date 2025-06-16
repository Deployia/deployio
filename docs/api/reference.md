# API Reference

The Deployio API is a RESTful API that allows you to programmatically manage your deployments, projects, and infrastructure.

## Base URL

```
https://api.deployio.tech/v1
```

## Authentication

All API requests require authentication using an API key or OAuth token.

### API Key Authentication

Include your API key in the Authorization header:

```bash
curl -H "Authorization: Bearer your-api-key" \
     https://api.deployio.tech/v1/projects
```

### OAuth 2.0

For applications that need to access user data, use OAuth 2.0 flow:

```bash
# Get authorization code
https://auth.deployio.tech/oauth/authorize?client_id=your-client-id&response_type=code

# Exchange for access token
curl -X POST https://auth.deployio.tech/oauth/token \
     -d "grant_type=authorization_code&code=your-code&client_id=your-client-id&client_secret=your-secret"
```

## Rate Limiting

API requests are rate limited:

- **Free tier**: 100 requests/hour
- **Pro tier**: 1,000 requests/hour
- **Enterprise**: Custom limits

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Projects API

### List Projects

```http
GET /projects
```

Query parameters:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (`active`, `paused`, `archived`)

Response:

```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "My App",
      "status": "active",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

### Create Project

```http
POST /projects
```

Request body:

```json
{
  "name": "My New App",
  "repository": {
    "url": "https://github.com/user/repo",
    "branch": "main"
  },
  "environment": {
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://..."
  }
}
```

### Get Project

```http
GET /projects/{project_id}
```

### Update Project

```http
PUT /projects/{project_id}
```

### Delete Project

```http
DELETE /projects/{project_id}
```

## Deployments API

### List Deployments

```http
GET /projects/{project_id}/deployments
```

### Create Deployment

```http
POST /projects/{project_id}/deployments
```

Request body:

```json
{
  "ref": "main",
  "environment": "production",
  "auto_promote": true
}
```

### Get Deployment

```http
GET /deployments/{deployment_id}
```

### Cancel Deployment

```http
POST /deployments/{deployment_id}/cancel
```

## Webhooks

Configure webhooks to receive real-time notifications about deployment events.

### Create Webhook

```http
POST /webhooks
```

Request body:

```json
{
  "url": "https://your-app.com/webhooks/deployio",
  "events": ["deployment.started", "deployment.completed", "deployment.failed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

- `deployment.started`
- `deployment.completed`
- `deployment.failed`
- `deployment.cancelled`
- `project.created`
- `project.updated`
- `project.deleted`

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

Error response format:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The request is missing required parameters",
    "details": {
      "missing_fields": ["name", "repository"]
    }
  }
}
```

## SDKs and Libraries

Official SDKs available for:

- [Node.js](https://www.npmjs.com/package/@deployio/node)
- [Python](https://pypi.org/project/deployio/)
- [Go](https://github.com/deployio/go-sdk)
- [Ruby](https://rubygems.org/gems/deployio)

## Examples

### Deploy from GitHub

```javascript
const { Deployio } = require("@deployio/node");

const client = new Deployio({ apiKey: "your-api-key" });

async function deploy() {
  const project = await client.projects.create({
    name: "My App",
    repository: {
      url: "https://github.com/user/repo",
      branch: "main",
    },
  });

  const deployment = await client.deployments.create(project.id, {
    ref: "main",
    environment: "production",
  });

  console.log(`Deployment started: ${deployment.id}`);
}
```

### Get Deployment Status

```python
import deployio

client = deployio.Client(api_key='your-api-key')

deployment = client.deployments.get('deploy_123')
print(f"Status: {deployment.status}")
```
