# Webhooks

Configure webhooks for real-time notifications about deployments, builds, and other events.

## Overview

Webhooks allow your applications to receive real-time notifications when events occur in your Deployio projects. Instead of continuously polling the API, webhooks push notifications to your specified endpoints immediately when events happen.

## Webhook Events

### Deployment Events

- **deployment.started**: A new deployment has been initiated
- **deployment.completed**: A deployment has finished successfully
- **deployment.failed**: A deployment has failed
- **deployment.cancelled**: A deployment has been cancelled
- **deployment.rollback_started**: A rollback deployment has been initiated
- **deployment.rollback_completed**: A rollback deployment has finished

### Build Events

- **build.started**: A build process has started
- **build.completed**: A build has finished successfully
- **build.failed**: A build has failed
- **build.cache_hit**: Build used cached dependencies
- **build.cache_miss**: Build rebuilt dependencies

### Project Events

- **project.created**: A new project has been created
- **project.updated**: Project settings have been modified
- **project.deleted**: A project has been deleted
- **project.environment_added**: A new environment has been added
- **project.environment_removed**: An environment has been removed

### Security Events

- **security.vulnerability_detected**: Security vulnerability found in dependencies
- **security.scan_completed**: Security scan has finished
- **security.compliance_violation**: Compliance policy violation detected

## Managing Webhooks

### Create Webhook

**POST** `/projects/{project_id}/webhooks`

#### Request Body

```json
{
  "url": "https://your-app.com/webhooks/deployio",
  "events": ["deployment.started", "deployment.completed", "deployment.failed"],
  "secret": "your_webhook_secret_key",
  "active": true,
  "description": "Main application webhook"
}
```

#### Example Request

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://your-app.com/webhooks/deployio",
       "events": ["deployment.completed", "deployment.failed"],
       "secret": "my_secure_secret"
     }' \
     "https://api.deployio.dev/v1/projects/proj_123/webhooks"
```

#### Example Response

```json
{
  "id": "webhook_abc123",
  "project_id": "proj_123",
  "url": "https://your-app.com/webhooks/deployio",
  "events": ["deployment.completed", "deployment.failed"],
  "secret": "my_secure_secret",
  "active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "description": null,
  "last_delivery": null,
  "delivery_stats": {
    "total_deliveries": 0,
    "successful_deliveries": 0,
    "failed_deliveries": 0,
    "last_success": null,
    "last_failure": null
  }
}
```

### List Webhooks

**GET** `/projects/{project_id}/webhooks`

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/projects/proj_123/webhooks"
```

#### Example Response

```json
{
  "data": [
    {
      "id": "webhook_abc123",
      "url": "https://your-app.com/webhooks/deployio",
      "events": ["deployment.completed", "deployment.failed"],
      "active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "delivery_stats": {
        "total_deliveries": 25,
        "successful_deliveries": 24,
        "failed_deliveries": 1,
        "success_rate": 0.96
      }
    }
  ],
  "total": 1
}
```

### Update Webhook

**PUT** `/projects/{project_id}/webhooks/{webhook_id}`

#### Request Body

```json
{
  "url": "https://new-url.com/webhooks/deployio",
  "events": [
    "deployment.started",
    "deployment.completed",
    "deployment.failed",
    "build.failed"
  ],
  "active": true
}
```

### Delete Webhook

**DELETE** `/projects/{project_id}/webhooks/{webhook_id}`

#### Example Request

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/projects/proj_123/webhooks/webhook_abc123"
```

## Webhook Payload Format

### Headers

All webhook requests include the following headers:

- `Content-Type: application/json`
- `User-Agent: Deployio-Webhooks/1.0`
- `X-Deployio-Event: {event_type}`
- `X-Deployio-Delivery: {unique_delivery_id}`
- `X-Deployio-Signature: {hmac_signature}`

### Payload Structure

```json
{
  "event": "deployment.completed",
  "timestamp": "2024-01-15T10:32:30Z",
  "delivery_id": "delivery_xyz789",
  "project": {
    "id": "proj_123",
    "name": "My Web App",
    "slug": "my-web-app"
  },
  "data": {
    // Event-specific data
  }
}
```

## Event Payloads

### Deployment Events

#### deployment.started

```json
{
  "event": "deployment.started",
  "timestamp": "2024-01-15T10:30:00Z",
  "delivery_id": "delivery_001",
  "project": {
    "id": "proj_123",
    "name": "My Web App",
    "slug": "my-web-app"
  },
  "data": {
    "deployment": {
      "id": "dep_abc123",
      "environment": "production",
      "branch": "main",
      "commit_sha": "a1b2c3d4e5f6",
      "commit_message": "Fix authentication bug",
      "deployed_by": {
        "id": "user_456",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "started_at": "2024-01-15T10:30:00Z",
      "estimated_duration": 180
    }
  }
}
```

#### deployment.completed

```json
{
  "event": "deployment.completed",
  "timestamp": "2024-01-15T10:32:30Z",
  "delivery_id": "delivery_002",
  "project": {
    "id": "proj_123",
    "name": "My Web App",
    "slug": "my-web-app"
  },
  "data": {
    "deployment": {
      "id": "dep_abc123",
      "environment": "production",
      "branch": "main",
      "commit_sha": "a1b2c3d4e5f6",
      "started_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:32:30Z",
      "duration": 150,
      "status": "success",
      "deployment_url": "https://prod-app.example.com",
      "metrics": {
        "build_time": 120,
        "deploy_time": 30,
        "bundle_size": "2.5MB"
      }
    }
  }
}
```

#### deployment.failed

```json
{
  "event": "deployment.failed",
  "timestamp": "2024-01-15T10:35:00Z",
  "delivery_id": "delivery_003",
  "project": {
    "id": "proj_123",
    "name": "My Web App",
    "slug": "my-web-app"
  },
  "data": {
    "deployment": {
      "id": "dep_xyz789",
      "environment": "production",
      "branch": "main",
      "commit_sha": "b2c3d4e5f6a1",
      "started_at": "2024-01-15T10:33:00Z",
      "failed_at": "2024-01-15T10:35:00Z",
      "duration": 120,
      "status": "failed",
      "error": {
        "code": "BUILD_FAILED",
        "message": "Build failed during dependency installation",
        "stage": "build",
        "details": "npm ERR! peer dep missing: react@^17.0.0"
      }
    }
  }
}
```

### Build Events

#### build.completed

```json
{
  "event": "build.completed",
  "timestamp": "2024-01-15T10:31:45Z",
  "delivery_id": "delivery_004",
  "project": {
    "id": "proj_123",
    "name": "My Web App",
    "slug": "my-web-app"
  },
  "data": {
    "build": {
      "id": "build_def456",
      "deployment_id": "dep_abc123",
      "commit_sha": "a1b2c3d4e5f6",
      "started_at": "2024-01-15T10:30:05Z",
      "completed_at": "2024-01-15T10:31:45Z",
      "duration": 100,
      "status": "success",
      "cache_hit": true,
      "artifacts": {
        "size": 2621440,
        "count": 45,
        "build_logs": "https://api.deployio.dev/v1/builds/build_def456/logs"
      }
    }
  }
}
```

### Security Events

#### security.vulnerability_detected

```json
{
  "event": "security.vulnerability_detected",
  "timestamp": "2024-01-15T10:40:00Z",
  "delivery_id": "delivery_005",
  "project": {
    "id": "proj_123",
    "name": "My Web App",
    "slug": "my-web-app"
  },
  "data": {
    "vulnerability": {
      "id": "vuln_ghi789",
      "severity": "high",
      "package": "lodash",
      "version": "4.17.15",
      "cve": "CVE-2021-23337",
      "description": "Prototype pollution vulnerability",
      "recommended_action": "Update to version 4.17.21 or higher",
      "scan_id": "scan_jkl012"
    }
  }
}
```

## Security

### Webhook Signatures

Deployio signs all webhook payloads with HMAC SHA-256 using your webhook secret. Verify the signature to ensure the webhook came from Deployio.

#### Signature Header

```
X-Deployio-Signature: sha256=a1b2c3d4e5f6...
```

#### Verification Examples

**Node.js**

```javascript
const crypto = require("crypto");

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const receivedSignature = signature.replace("sha256=", "");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(receivedSignature, "hex")
  );
}

// Express.js middleware
app.use("/webhooks/deployio", express.raw({ type: "application/json" }));

app.post("/webhooks/deployio", (req, res) => {
  const signature = req.get("X-Deployio-Signature");
  const payload = req.body;
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(payload);
  console.log("Received webhook:", event.event);

  res.status(200).send("OK");
});
```

**Python**

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    received_signature = signature.replace('sha256=', '')

    return hmac.compare_digest(expected_signature, received_signature)

# Flask example
from flask import Flask, request

@app.route('/webhooks/deployio', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Deployio-Signature')
    payload = request.get_data(as_text=True)
    secret = os.environ.get('WEBHOOK_SECRET')

    if not verify_webhook_signature(payload, signature, secret):
        return 'Invalid signature', 401

    event = json.loads(payload)
    print(f"Received webhook: {event['event']}")

    return 'OK', 200
```

**PHP**

```php
function verifyWebhookSignature($payload, $signature, $secret) {
    $expectedSignature = hash_hmac('sha256', $payload, $secret);
    $receivedSignature = str_replace('sha256=', '', $signature);

    return hash_equals($expectedSignature, $receivedSignature);
}

// Handle webhook
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_DEPLOYIO_SIGNATURE'];
$secret = $_ENV['WEBHOOK_SECRET'];

if (!verifyWebhookSignature($payload, $signature, $secret)) {
    http_response_code(401);
    exit('Invalid signature');
}

$event = json_decode($payload, true);
error_log("Received webhook: " . $event['event']);

http_response_code(200);
echo 'OK';
```

## Webhook Delivery

### Delivery Behavior

- **Timeout**: 10 seconds
- **Retries**: Up to 5 attempts with exponential backoff
- **Retry Schedule**: 1s, 4s, 16s, 64s, 256s
- **Success Codes**: 200-299 HTTP status codes
- **User Agent**: `Deployio-Webhooks/1.0`

### Monitoring Deliveries

#### Get Webhook Deliveries

**GET** `/projects/{project_id}/webhooks/{webhook_id}/deliveries`

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/projects/proj_123/webhooks/webhook_abc123/deliveries"
```

#### Response

```json
{
  "data": [
    {
      "id": "delivery_001",
      "event": "deployment.completed",
      "status": "success",
      "response_code": 200,
      "attempts": 1,
      "delivered_at": "2024-01-15T10:32:35Z",
      "duration": 145
    },
    {
      "id": "delivery_002",
      "event": "deployment.failed",
      "status": "failed",
      "response_code": 500,
      "attempts": 5,
      "last_attempt_at": "2024-01-15T10:45:30Z",
      "error": "Connection timeout"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0
  }
}
```

#### Redeliver Webhook

**POST** `/projects/{project_id}/webhooks/{webhook_id}/deliveries/{delivery_id}/redeliver`

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/projects/proj_123/webhooks/webhook_abc123/deliveries/delivery_002/redeliver"
```

## Testing Webhooks

### Webhook Testing Tool

Use our webhook testing tool to validate your endpoint:

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://your-app.com/webhooks/test",
       "event": "deployment.completed"
     }' \
     "https://api.deployio.dev/v1/webhooks/test"
```

### Local Development

For local testing, use tools like ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose local port
ngrok http 3000

# Use the generated URL for webhook endpoint
# https://abc123.ngrok.io/webhooks/deployio
```

## Best Practices

### Endpoint Design

- **Idempotency**: Handle duplicate deliveries gracefully
- **Fast Response**: Respond quickly (< 2 seconds) to avoid timeouts
- **Error Handling**: Return appropriate HTTP status codes
- **Logging**: Log all webhook events for debugging

### Security Considerations

- **Always Verify Signatures**: Never trust unsigned webhooks
- **Use HTTPS**: Only accept webhooks over secure connections
- **Validate Event Types**: Only process expected event types
- **Rate Limiting**: Implement rate limiting on your webhook endpoints

### Example Implementation

```javascript
const express = require("express");
const app = express();

// Webhook endpoint
app.post(
  "/webhooks/deployio",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // Verify signature
      const signature = req.get("X-Deployio-Signature");
      if (!verifySignature(req.body, signature)) {
        return res.status(401).send("Invalid signature");
      }

      // Parse event
      const event = JSON.parse(req.body);
      const { event: eventType, data } = event;

      // Process event asynchronously
      setImmediate(() => processWebhookEvent(eventType, data));

      // Respond quickly
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Internal server error");
    }
  }
);

async function processWebhookEvent(eventType, data) {
  switch (eventType) {
    case "deployment.completed":
      await handleDeploymentCompleted(data.deployment);
      break;
    case "deployment.failed":
      await handleDeploymentFailed(data.deployment);
      break;
    default:
      console.log(`Unhandled event type: ${eventType}`);
  }
}
```

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Events

- Verify the webhook URL is accessible from the internet
- Check that your server is running and responding to HTTP requests
- Ensure the webhook is active and configured for the correct events
- Check your firewall and security group settings

#### Signature Verification Failing

- Ensure you're using the correct webhook secret
- Verify you're calculating the HMAC with the raw request body
- Check that the signature header is being read correctly
- Make sure you're comparing signatures securely

#### High Failure Rate

- Check your server logs for errors
- Verify your endpoint responds within 10 seconds
- Ensure you're returning 2xx status codes for successful processing
- Check for network connectivity issues

### Debug Webhook Issues

```bash
# Test webhook endpoint manually
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Deployio-Signature: sha256=test" \
     -d '{"event": "test", "data": {}}' \
     https://your-app.com/webhooks/deployio

# Check webhook delivery logs
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/projects/proj_123/webhooks/webhook_abc123/deliveries?limit=10"
```

---

_For advanced webhook configurations and enterprise support, contact our support team._
