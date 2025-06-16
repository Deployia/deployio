# Authentication

Learn how to authenticate with the Deployio API and manage access tokens securely. This guide covers all authentication methods, security best practices, and integration patterns.

## Overview

Deployio API uses token-based authentication with support for multiple authentication flows. All API requests must include a valid authentication token to ensure secure access to your resources.

## Authentication Methods

### API Tokens

Personal access tokens provide secure, long-lived authentication for automated systems and CLI usage.

#### Creating API Tokens

```bash
# Using CLI
deployio auth create-token --name "CI/CD Pipeline" --expires 90d

# Using Web Interface
# 1. Go to Settings > API Tokens
# 2. Click "Generate New Token"
# 3. Set name, expiration, and permissions
# 4. Copy token securely
```

#### Token Types

```json
{
  "tokenTypes": {
    "personal": {
      "description": "Personal access tokens for individual users",
      "maxExpiry": "1 year",
      "permissions": "user-level"
    },
    "service": {
      "description": "Service tokens for automated systems",
      "maxExpiry": "unlimited",
      "permissions": "configurable"
    },
    "project": {
      "description": "Project-scoped tokens with limited access",
      "maxExpiry": "6 months",
      "permissions": "project-specific"
    }
  }
}
```

### OAuth 2.0

OAuth 2.0 flow for third-party applications and integrations.

#### Authorization Code Flow

```bash
# Step 1: Redirect user to authorization URL
https://auth.deployio.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  scope=projects:read deployments:write&
  state=random-state-value&
  redirect_uri=https://your-app.com/callback
```

```javascript
// Step 2: Exchange authorization code for access token
const response = await fetch("https://auth.deployio.com/oauth/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: "YOUR_CLIENT_ID",
    client_secret: "YOUR_CLIENT_SECRET",
    code: "AUTHORIZATION_CODE",
    redirect_uri: "https://your-app.com/callback",
  }),
});

const { access_token, refresh_token, expires_in } = await response.json();
```

#### Client Credentials Flow

For server-to-server authentication:

```javascript
const response = await fetch("https://auth.deployio.com/oauth/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: "YOUR_CLIENT_ID",
    client_secret: "YOUR_CLIENT_SECRET",
    scope: "projects:read deployments:write",
  }),
});
```

### SSO Integration

Single Sign-On integration with enterprise identity providers.

#### SAML 2.0

```xml
<!-- SAML Configuration Example -->
<saml:Assertion>
  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>user@company.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="groups">
      <saml:AttributeValue>deployio-users</saml:AttributeValue>
      <saml:AttributeValue>admin</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

#### OpenID Connect

```javascript
// OIDC Configuration
const oidcConfig = {
  issuer: "https://your-company.auth0.com/",
  clientId: "YOUR_OIDC_CLIENT_ID",
  redirectUri: "https://app.deployio.com/auth/callback",
  scopes: ["openid", "profile", "email"],
};
```

## Making Authenticated Requests

### Using Authorization Header

```bash
# Using Bearer token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.deployio.com/v1/projects
```

```javascript
// JavaScript/Node.js
const response = await fetch("https://api.deployio.com/v1/projects", {
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "Content-Type": "application/json",
  },
});
```

```python
# Python
import requests

headers = {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.deployio.com/v1/projects', headers=headers)
```

### Using API Key Header

```bash
# Alternative API key method
curl -H "X-API-Key: YOUR_API_KEY" \
     https://api.deployio.com/v1/projects
```

## Token Management

### Token Permissions

```json
{
  "permissions": {
    "projects": {
      "actions": ["read", "write", "delete"],
      "scopes": ["own", "team", "organization"]
    },
    "deployments": {
      "actions": ["read", "write", "trigger", "rollback"],
      "scopes": ["own", "project"]
    },
    "users": {
      "actions": ["read", "invite"],
      "scopes": ["team", "organization"]
    },
    "billing": {
      "actions": ["read", "write"],
      "scopes": ["organization"]
    }
  }
}
```

### Creating Scoped Tokens

```bash
# Project-specific token
deployio auth create-token \
  --name "Project CI Token" \
  --project my-web-app \
  --permissions projects:read,deployments:write

# Read-only token
deployio auth create-token \
  --name "Monitoring Token" \
  --permissions projects:read,deployments:read \
  --expires 30d

# Admin token
deployio auth create-token \
  --name "Admin Operations" \
  --permissions "*" \
  --expires 7d
```

### Token Rotation

```bash
# List active tokens
deployio auth list-tokens

# Rotate token
deployio auth rotate-token --token-id abc123

# Revoke token
deployio auth revoke-token --token-id abc123

# Bulk token operations
deployio auth bulk-revoke --created-before 30d
```

## Security Best Practices

### Token Security

```bash
# Generate secure tokens
deployio auth create-token \
  --name "Production API" \
  --entropy high \
  --prefix prod_ \
  --expires 90d

# Token validation
deployio auth validate-token --token YOUR_TOKEN
```

### Environment-Specific Tokens

```yaml
# CI/CD Configuration
environments:
  development:
    api_token: ${DEV_API_TOKEN}
    permissions: ["projects:read", "deployments:write"]

  staging:
    api_token: ${STAGING_API_TOKEN}
    permissions: ["projects:read", "deployments:write"]

  production:
    api_token: ${PROD_API_TOKEN}
    permissions: ["projects:read", "deployments:write", "monitoring:read"]
```

### IP Allowlisting

```bash
# Restrict token usage by IP
deployio auth create-token \
  --name "Office Access" \
  --ip-allowlist "203.0.113.0/24,198.51.100.5"

# Update IP restrictions
deployio auth update-token --token-id abc123 \
  --ip-allowlist "203.0.113.0/24"
```

## Error Handling

### Authentication Errors

```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or expired token",
    "details": {
      "reason": "token_expired",
      "expires_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Common Error Codes

```javascript
const authErrors = {
  INVALID_TOKEN: "Token is malformed or invalid",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_REVOKED: "Token has been revoked",
  INSUFFICIENT_PERMISSIONS: "Token lacks required permissions",
  RATE_LIMITED: "Too many authentication attempts",
  IP_RESTRICTED: "Request from unauthorized IP address",
};
```

### Error Handling Examples

```javascript
// JavaScript error handling
async function apiCall(endpoint, token) {
  try {
    const response = await fetch(`https://api.deployio.com/v1/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error("Authentication failed - token may be expired");
    }

    if (response.status === 403) {
      throw new Error("Insufficient permissions for this operation");
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error.message);
    throw error;
  }
}
```

```python
# Python error handling
import requests
from requests.exceptions import HTTPError

def make_api_request(endpoint, token):
    headers = {'Authorization': f'Bearer {token}'}

    try:
        response = requests.get(f'https://api.deployio.com/v1/{endpoint}', headers=headers)
        response.raise_for_status()
        return response.json()

    except HTTPError as e:
        if e.response.status_code == 401:
            raise Exception('Authentication failed - check your token')
        elif e.response.status_code == 403:
            raise Exception('Insufficient permissions')
        else:
            raise Exception(f'API request failed: {e}')
```

## Rate Limiting

### Rate Limit Headers

```bash
# Response headers
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Rate Limit Handling

```javascript
async function apiCallWithRetry(endpoint, token, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(`https://api.deployio.com/v1/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 429) {
      const resetTime = response.headers.get("X-RateLimit-Reset");
      const waitTime = resetTime * 1000 - Date.now();

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
    }

    return response;
  }
}
```

## Integration Examples

### GitHub Actions

```yaml
name: Deploy Application
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Deployio
        env:
          DEPLOYIO_TOKEN: ${{ secrets.DEPLOYIO_TOKEN }}
        run: |
          curl -H "Authorization: Bearer $DEPLOYIO_TOKEN" \
               -X POST \
               https://api.deployio.com/v1/deployments
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - |
      curl -H "Authorization: Bearer $DEPLOYIO_TOKEN" \
           -X POST \
           https://api.deployio.com/v1/deployments
  variables:
    DEPLOYIO_TOKEN: $DEPLOYIO_API_TOKEN
```

### Jenkins

```groovy
pipeline {
    agent any

    environment {
        DEPLOYIO_TOKEN = credentials('deployio-token')
    }

    stages {
        stage('Deploy') {
            steps {
                sh '''
                    curl -H "Authorization: Bearer $DEPLOYIO_TOKEN" \
                         -X POST \
                         https://api.deployio.com/v1/deployments
                '''
            }
        }
    }
}
```

### Terraform

```hcl
# Configure Deployio provider
provider "deployio" {
  token = var.deployio_token
  # token can also be set via DEPLOYIO_TOKEN environment variable
}

# Create project
resource "deployio_project" "web_app" {
  name        = "my-web-app"
  description = "My web application"

  environment {
    name = "production"
    variables = {
      NODE_ENV = "production"
    }
  }
}
```

## Webhook Authentication

### Webhook Signatures

```javascript
// Verify webhook signature
const crypto = require("crypto");

function verifyWebhookSignature(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const expectedSignature = `sha256=${computedSignature}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js webhook handler
app.post("/webhook", (req, res) => {
  const signature = req.headers["x-deployio-signature"];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid signature");
  }

  // Process webhook
  console.log("Webhook received:", req.body);
  res.status(200).send("OK");
});
```

## Troubleshooting

### Debug Authentication

```bash
# Test token validity
curl -I -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.deployio.com/v1/auth/verify

# Get token information
deployio auth inspect --token YOUR_TOKEN

# Test permissions
deployio auth test-permissions --action projects:read
```

### Common Issues

1. **Token Expired**

   ```bash
   # Check token expiration
   deployio auth inspect --token YOUR_TOKEN

   # Refresh token
   deployio auth refresh-token --token YOUR_TOKEN
   ```

2. **Invalid Permissions**

   ```bash
   # Check required permissions
   deployio auth check --action deployments:write --resource project-123

   # Request additional permissions
   deployio auth request-permissions --permissions "deployments:write"
   ```

3. **Rate Limiting**

   ```bash
   # Check rate limit status
   curl -I https://api.deployio.com/v1/auth/rate-limit

   # Monitor usage
   deployio auth usage --period 1h
   ```

## Best Practices

1. **Token Lifecycle**: Implement proper token rotation
2. **Least Privilege**: Grant minimal required permissions
3. **Secure Storage**: Never commit tokens to version control
4. **Environment Separation**: Use different tokens per environment
5. **Monitoring**: Monitor token usage and authentication events
6. **Expiration**: Set appropriate token expiration times
7. **Revocation**: Implement token revocation procedures

## Next Steps

- [Explore Projects API](./projects-api.md)
- [Learn about Deployments API](./deployments-api.md)
- [Set up webhooks](./webhooks.md)
- [Configure rate limiting](./rate-limiting.md)

Secure your API access with robust authentication! 🔐
