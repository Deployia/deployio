# Error Handling

API error codes and troubleshooting guide for the Deployio API.

## Overview

The Deployio API uses conventional HTTP response codes to indicate the success or failure of an API request. In general, codes in the 2xx range indicate success, codes in the 4xx range indicate an error that failed given the information provided, and codes in the 5xx range indicate an error with Deployio's servers.

## HTTP Status Codes

### Success Codes (2xx)

- **200 OK**: The request was successful
- **201 Created**: The resource was successfully created
- **202 Accepted**: The request was accepted for processing
- **204 No Content**: The request was successful but no content to return

### Client Error Codes (4xx)

- **400 Bad Request**: The request was invalid or cannot be served
- **401 Unauthorized**: Authentication is required and has failed
- **403 Forbidden**: The request is valid but the user doesn't have permission
- **404 Not Found**: The requested resource was not found
- **409 Conflict**: The request conflicts with the current state
- **422 Unprocessable Entity**: The request was well-formed but contains semantic errors
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes (5xx)

- **500 Internal Server Error**: Something went wrong on Deployio's end
- **502 Bad Gateway**: Invalid response from an upstream server
- **503 Service Unavailable**: The service is temporarily unavailable
- **504 Gateway Timeout**: Timeout occurred when connecting to upstream server

## Error Response Format

All error responses follow a consistent JSON format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field",
      "additional_info": "value"
    },
    "request_id": "req_abc123xyz"
  }
}
```

### Error Object Fields

- **code**: Machine-readable error code
- **message**: Human-readable error description
- **details**: Additional context about the error (optional)
- **request_id**: Unique identifier for the request (for support)

## Common Error Codes

### Authentication Errors

#### INVALID_API_KEY

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or has been revoked",
    "request_id": "req_auth_001"
  }
}
```

#### EXPIRED_TOKEN

```json
{
  "error": {
    "code": "EXPIRED_TOKEN",
    "message": "The authentication token has expired",
    "details": {
      "expired_at": "2024-01-15T10:00:00Z"
    },
    "request_id": "req_auth_002"
  }
}
```

#### INSUFFICIENT_PERMISSIONS

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to perform this action",
    "details": {
      "required_permission": "deployments:create",
      "resource": "proj_123"
    },
    "request_id": "req_auth_003"
  }
}
```

### Validation Errors

#### INVALID_REQUEST_FORMAT

```json
{
  "error": {
    "code": "INVALID_REQUEST_FORMAT",
    "message": "The request body is not valid JSON",
    "details": {
      "line": 5,
      "column": 12,
      "error": "Unexpected token '}'"
    },
    "request_id": "req_val_001"
  }
}
```

#### MISSING_REQUIRED_FIELD

```json
{
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "Required field is missing",
    "details": {
      "field": "project_id",
      "location": "body"
    },
    "request_id": "req_val_002"
  }
}
```

#### INVALID_FIELD_VALUE

```json
{
  "error": {
    "code": "INVALID_FIELD_VALUE",
    "message": "The field value is invalid",
    "details": {
      "field": "environment",
      "value": "invalid_env",
      "allowed_values": ["development", "staging", "production"]
    },
    "request_id": "req_val_003"
  }
}
```

### Resource Errors

#### RESOURCE_NOT_FOUND

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "resource_type": "project",
      "resource_id": "proj_nonexistent"
    },
    "request_id": "req_res_001"
  }
}
```

#### RESOURCE_ALREADY_EXISTS

```json
{
  "error": {
    "code": "RESOURCE_ALREADY_EXISTS",
    "message": "A resource with this identifier already exists",
    "details": {
      "resource_type": "project",
      "field": "slug",
      "value": "my-project"
    },
    "request_id": "req_res_002"
  }
}
```

#### RESOURCE_LIMIT_EXCEEDED

```json
{
  "error": {
    "code": "RESOURCE_LIMIT_EXCEEDED",
    "message": "You have reached the maximum number of allowed resources",
    "details": {
      "resource_type": "projects",
      "limit": 5,
      "current_count": 5
    },
    "request_id": "req_res_003"
  }
}
```

### Deployment Errors

#### DEPLOYMENT_IN_PROGRESS

```json
{
  "error": {
    "code": "DEPLOYMENT_IN_PROGRESS",
    "message": "A deployment is already in progress for this environment",
    "details": {
      "project_id": "proj_123",
      "environment": "production",
      "active_deployment_id": "dep_xyz789"
    },
    "request_id": "req_dep_001"
  }
}
```

#### BUILD_FAILED

```json
{
  "error": {
    "code": "BUILD_FAILED",
    "message": "The build process failed",
    "details": {
      "deployment_id": "dep_abc123",
      "stage": "build",
      "exit_code": 1,
      "logs_url": "https://api.deployio.dev/v1/deployments/dep_abc123/logs"
    },
    "request_id": "req_dep_002"
  }
}
```

#### INVALID_CONFIGURATION

```json
{
  "error": {
    "code": "INVALID_CONFIGURATION",
    "message": "The deployment configuration is invalid",
    "details": {
      "config_file": "deployio.yml",
      "validation_errors": [
        {
          "field": "build.command",
          "message": "Build command cannot be empty"
        }
      ]
    },
    "request_id": "req_dep_003"
  }
}
```

### Rate Limiting Errors

#### RATE_LIMIT_EXCEEDED

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "details": {
      "limit": 1000,
      "window": 3600,
      "retry_after": 1800,
      "reset_time": "2024-01-15T12:00:00Z"
    },
    "request_id": "req_rate_001"
  }
}
```

### Server Errors

#### INTERNAL_SERVER_ERROR

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "incident_id": "inc_server_001"
    },
    "request_id": "req_server_001"
  }
}
```

#### SERVICE_UNAVAILABLE

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "The service is temporarily unavailable",
    "details": {
      "maintenance_window": "2024-01-15T02:00:00Z to 2024-01-15T04:00:00Z",
      "estimated_recovery": "2024-01-15T04:00:00Z"
    },
    "request_id": "req_server_002"
  }
}
```

## Error Handling Best Practices

### 1. Check HTTP Status Codes

Always check the HTTP status code before processing the response:

```javascript
async function makeAPIRequest(url, options) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(response.status, errorData);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

class APIError extends Error {
  constructor(status, errorData) {
    super(errorData.error.message);
    this.status = status;
    this.code = errorData.error.code;
    this.details = errorData.error.details;
    this.requestId = errorData.error.request_id;
  }
}
```

### 2. Handle Different Error Types

Implement specific handling for different error categories:

```javascript
async function handleAPIError(error) {
  switch (error.code) {
    case "INVALID_API_KEY":
    case "EXPIRED_TOKEN":
      // Redirect to authentication
      redirectToLogin();
      break;

    case "RATE_LIMIT_EXCEEDED":
      // Implement exponential backoff
      const retryAfter = error.details.retry_after;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      // Retry the request
      break;

    case "DEPLOYMENT_IN_PROGRESS":
      // Wait for current deployment to finish
      await waitForDeploymentCompletion(error.details.active_deployment_id);
      // Retry the deployment
      break;

    case "RESOURCE_NOT_FOUND":
      // Handle missing resource
      showNotFoundError();
      break;

    default:
      // Generic error handling
      showGenericError(error.message);
  }
}
```

### 3. Implement Retry Logic

Add retry logic for transient errors:

```javascript
async function retryableRequest(requestFn, maxRetries = 3) {
  const retryableErrors = [
    "INTERNAL_SERVER_ERROR",
    "SERVICE_UNAVAILABLE",
    "RATE_LIMIT_EXCEEDED",
  ];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries || !retryableErrors.includes(error.code)) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

### 4. Log Errors for Debugging

Include request IDs in your logs for easier debugging:

```javascript
function logAPIError(error, context) {
  console.error("API Error:", {
    message: error.message,
    code: error.code,
    status: error.status,
    requestId: error.requestId,
    context: context,
    timestamp: new Date().toISOString(),
  });

  // Send to error tracking service
  errorTracker.captureException(error, {
    tags: {
      api_error: true,
      error_code: error.code,
    },
    extra: {
      request_id: error.requestId,
      context: context,
    },
  });
}
```

## SDK Error Handling

### Node.js SDK

```javascript
const DeployioAPI = require("@deployio/api-client");

const client = new DeployioAPI({
  apiKey: "your_api_key",
  errorHandler: (error) => {
    console.error(`API Error [${error.code}]:`, error.message);
    return error; // Return error to continue throwing
  },
});

try {
  const deployment = await client.deployments.create(deploymentData);
} catch (error) {
  if (error instanceof DeployioAPI.APIError) {
    // Handle API-specific errors
    console.log("Request ID:", error.requestId);
  } else {
    // Handle network or other errors
    console.error("Network error:", error);
  }
}
```

### Python SDK

```python
from deployio_api import DeployioClient
from deployio_api.exceptions import (
    APIError,
    AuthenticationError,
    RateLimitError,
    ValidationError
)

client = DeployioClient(api_key='your_api_key')

try:
    deployment = client.deployments.create(deployment_data)
except AuthenticationError as e:
    print(f"Authentication failed: {e.message}")
except RateLimitError as e:
    print(f"Rate limit exceeded. Retry after: {e.retry_after} seconds")
except ValidationError as e:
    print(f"Validation error: {e.message}")
    print(f"Field errors: {e.field_errors}")
except APIError as e:
    print(f"API error [{e.code}]: {e.message}")
    print(f"Request ID: {e.request_id}")
```

## Error Monitoring and Alerting

### Setting Up Error Monitoring

```javascript
// Example with Sentry
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your_sentry_dsn",
});

function handleAPIError(error) {
  Sentry.withScope((scope) => {
    scope.setTag("error_type", "api_error");
    scope.setTag("api_error_code", error.code);
    scope.setContext("api_error", {
      status: error.status,
      code: error.code,
      request_id: error.requestId,
      details: error.details,
    });
    Sentry.captureException(error);
  });
}
```

### Custom Error Tracking

```javascript
class ErrorTracker {
  constructor(options = {}) {
    this.errors = [];
    this.maxErrors = options.maxErrors || 1000;
    this.alertThreshold = options.alertThreshold || 10;
  }

  track(error) {
    this.errors.push({
      timestamp: Date.now(),
      code: error.code,
      message: error.message,
      requestId: error.requestId,
    });

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Check for alert conditions
    this.checkAlerts();
  }

  checkAlerts() {
    const recentErrors = this.errors.filter(
      (error) => Date.now() - error.timestamp < 60000 // Last minute
    );

    if (recentErrors.length >= this.alertThreshold) {
      this.sendAlert(recentErrors);
    }
  }

  sendAlert(errors) {
    console.warn(
      `High error rate detected: ${errors.length} errors in the last minute`
    );
    // Send alert to monitoring system
  }
}
```

## Troubleshooting Common Issues

### Authentication Problems

```bash
# Test API key validity
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.deployio.dev/v1/account"

# Check token expiration
curl -I -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.deployio.dev/v1/projects"
```

### Deployment Issues

```bash
# Check deployment status
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.deployio.dev/v1/deployments/dep_abc123"

# Get deployment logs
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.deployio.dev/v1/deployments/dep_abc123/logs"
```

### Rate Limit Issues

```bash
# Check current usage
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.deployio.dev/v1/account/usage"

# Monitor rate limit headers
curl -I -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.deployio.dev/v1/projects" | grep X-RateLimit
```

## Getting Help

### Support Channels

- **Documentation**: [docs.deployio.dev](https://docs.deployio.dev)
- **Community Forum**: [community.deployio.dev](https://community.deployio.dev)
- **Support Email**: [support@deployio.dev](mailto:support@deployio.dev)
- **Status Page**: [status.deployio.dev](https://status.deployio.dev)

### When Contacting Support

Include the following information:

- Request ID from the error response
- Complete error message and code
- Steps to reproduce the issue
- Your API usage patterns
- Timestamp of when the error occurred

### Emergency Contact

For critical production issues:

- **Phone**: +1-800-DEPLOYIO
- **Slack**: Enterprise customers can use dedicated Slack channels
- **Priority Email**: [urgent@deployio.dev](mailto:urgent@deployio.dev)

---

_For enterprise support and dedicated assistance, contact our sales team._
