# Rate Limiting

Understanding API rate limits and best practices for managing your API usage.

## Overview

Deployio implements rate limiting to ensure fair usage and maintain service quality for all users. Rate limits are applied per API key and are designed to accommodate typical usage patterns while preventing abuse.

## Rate Limit Tiers

### Free Plan

- **Requests**: 100 requests per hour
- **Concurrent Deployments**: 1
- **Burst Limit**: 10 requests per minute
- **Reset Period**: Hourly

### Professional Plan

- **Requests**: 1,000 requests per hour
- **Concurrent Deployments**: 3
- **Burst Limit**: 50 requests per minute
- **Reset Period**: Hourly

### Enterprise Plan

- **Requests**: 10,000 requests per hour
- **Concurrent Deployments**: 10
- **Burst Limit**: 200 requests per minute
- **Reset Period**: Hourly
- **Custom Limits**: Available upon request

## Rate Limit Headers

All API responses include rate limit information in the headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642248000
X-RateLimit-Used: 5
X-RateLimit-Window: 3600
Retry-After: 3600
```

### Header Descriptions

- **X-RateLimit-Limit**: Maximum requests allowed in the current window
- **X-RateLimit-Remaining**: Number of requests remaining in the current window
- **X-RateLimit-Reset**: Unix timestamp when the rate limit window resets
- **X-RateLimit-Used**: Number of requests used in the current window
- **X-RateLimit-Window**: Duration of the rate limit window in seconds
- **Retry-After**: Seconds to wait before making another request (present when rate limited)

## Rate Limit Scopes

### Global Rate Limits

Applied to all API endpoints for your account:

- General API operations
- Authentication requests
- Project and deployment queries

### Endpoint-Specific Limits

Some endpoints have additional specific limits:

#### Deployment Creation

- **Free**: 10 deployments per hour
- **Professional**: 100 deployments per hour
- **Enterprise**: 1,000 deployments per hour

#### Webhook Deliveries

- **All Plans**: 1,000 webhook deliveries per hour per webhook

#### Log Streaming

- **All Plans**: 5 concurrent log streams per project

## Rate Limit Responses

### 429 Too Many Requests

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "details": {
      "limit": 1000,
      "used": 1000,
      "window": 3600,
      "reset_time": "2024-01-15T12:00:00Z",
      "retry_after": 3600
    }
  }
}
```

### Rate Limit Warning

When you're approaching your rate limit (80% used), responses include a warning header:

```http
X-RateLimit-Warning: Approaching rate limit threshold
```

## Best Practices

### Efficient API Usage

#### 1. Cache Responses

Cache API responses locally to reduce redundant requests:

```javascript
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

async function getCachedProject(projectId) {
  const cacheKey = `project_${projectId}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const project = await deployioAPI.projects.get(projectId);
  cache.set(cacheKey, {
    data: project,
    timestamp: Date.now(),
  });

  return project;
}
```

#### 2. Batch Operations

Use batch endpoints when available:

```javascript
// Instead of multiple individual requests
const deployments = await Promise.all(
  deploymentIds.map((id) => deployioAPI.deployments.get(id))
);

// Use batch endpoint
const deployments = await deployioAPI.deployments.getBatch(deploymentIds);
```

#### 3. Pagination

Use pagination to limit response sizes:

```javascript
// Fetch projects with pagination
const projects = await deployioAPI.projects.list({
  limit: 20,
  offset: 0,
});
```

### Rate Limit Handling

#### 1. Check Headers

Always check rate limit headers in responses:

```javascript
function checkRateLimit(response) {
  const remaining = parseInt(response.headers["X-RateLimit-Remaining"]);
  const reset = parseInt(response.headers["X-RateLimit-Reset"]);

  if (remaining < 10) {
    const resetTime = new Date(reset * 1000);
    console.warn(
      `Rate limit low: ${remaining} requests remaining, resets at ${resetTime}`
    );
  }
}
```

#### 2. Implement Exponential Backoff

Handle rate limit errors with exponential backoff:

```javascript
async function apiRequestWithBackoff(requestFn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        const retryAfter =
          parseInt(error.headers["Retry-After"]) || Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${retryAfter} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

#### 3. Queue Requests

Implement request queuing to stay within limits:

```javascript
class RateLimitedQueue {
  constructor(requestsPerSecond = 1) {
    this.queue = [];
    this.processing = false;
    this.interval = 1000 / requestsPerSecond;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const { requestFn, resolve, reject } = this.queue.shift();

      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      await new Promise((resolve) => setTimeout(resolve, this.interval));
    }

    this.processing = false;
  }
}

const queue = new RateLimitedQueue(0.5); // 0.5 requests per second

// Use the queue
const deployment = await queue.add(() =>
  deployioAPI.deployments.create(deploymentData)
);
```

## Monitoring Usage

### Usage Dashboard

Monitor your API usage in the Deployio dashboard:

- Real-time rate limit status
- Historical usage patterns
- Peak usage times
- Rate limit violations

### API Usage Endpoint

Check your current usage programmatically:

**GET** `/account/usage`

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/account/usage"
```

#### Response

```json
{
  "current_period": {
    "start": "2024-01-15T00:00:00Z",
    "end": "2024-01-15T23:59:59Z",
    "requests": {
      "used": 750,
      "limit": 1000,
      "remaining": 250,
      "percentage": 75
    },
    "deployments": {
      "used": 25,
      "limit": 100,
      "remaining": 75,
      "percentage": 25
    }
  },
  "rate_limits": {
    "current_window": {
      "start": "2024-01-15T11:00:00Z",
      "end": "2024-01-15T12:00:00Z",
      "requests_used": 45,
      "requests_remaining": 955
    }
  },
  "plan": "professional"
}
```

### Usage Alerts

Set up alerts for high usage:

**POST** `/account/alerts`

```json
{
  "type": "rate_limit_usage",
  "threshold": 80,
  "notification_methods": ["email", "webhook"],
  "webhook_url": "https://your-app.com/webhooks/usage-alert"
}
```

## Rate Limit Strategies

### Spreading Requests

Distribute API requests throughout your rate limit window:

```javascript
class RequestScheduler {
  constructor(requestsPerHour) {
    this.requestsPerHour = requestsPerHour;
    this.intervalMs = (60 * 60 * 1000) / requestsPerHour;
    this.lastRequestTime = 0;
  }

  async scheduleRequest(requestFn) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.intervalMs) {
      const delay = this.intervalMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
    return await requestFn();
  }
}
```

### Priority Queuing

Implement priority for different types of requests:

```javascript
class PriorityQueue {
  constructor() {
    this.high = [];
    this.medium = [];
    this.low = [];
  }

  add(requestFn, priority = "medium") {
    this[priority].push(requestFn);
  }

  next() {
    if (this.high.length > 0) return this.high.shift();
    if (this.medium.length > 0) return this.medium.shift();
    if (this.low.length > 0) return this.low.shift();
    return null;
  }
}
```

### Circuit Breaker Pattern

Implement circuit breaker for rate limit protection:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async call(requestFn) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is OPEN");
      }
      this.state = "HALF_OPEN";
    }

    try {
      const result = await requestFn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

## Enterprise Rate Limits

### Custom Limits

Enterprise customers can request custom rate limits:

```json
{
  "custom_limits": {
    "api_requests": 50000,
    "deployments": 5000,
    "concurrent_builds": 25,
    "webhook_deliveries": 10000
  },
  "burst_allowance": {
    "multiplier": 2,
    "duration": 300
  }
}
```

### Dedicated Infrastructure

Enterprise plans include options for:

- Dedicated API endpoints
- Reserved capacity
- SLA guarantees
- Priority support

## SDK Rate Limit Handling

### Node.js SDK

```javascript
const DeployioAPI = require("@deployio/api-client");

const client = new DeployioAPI({
  apiKey: "your_api_key",
  rateLimitHandling: {
    enabled: true,
    maxRetries: 3,
    backoffStrategy: "exponential",
  },
});

// SDK automatically handles rate limiting
const deployment = await client.deployments.create(deploymentData);
```

### Python SDK

```python
from deployio_api import DeployioClient
from deployio_api.exceptions import RateLimitError

client = DeployioClient(
    api_key='your_api_key',
    auto_retry=True,
    max_retries=3
)

try:
    deployment = client.deployments.create(deployment_data)
except RateLimitError as e:
    print(f"Rate limit exceeded: {e.retry_after} seconds")
```

## Troubleshooting

### Common Issues

#### Unexpected Rate Limit Errors

- Check if multiple applications are using the same API key
- Verify you're not making unnecessary duplicate requests
- Review your caching strategy

#### High Usage Without Obvious Cause

- Audit all applications using your API key
- Check for polling loops or inefficient request patterns
- Review webhook delivery failures that might cause retries

#### Rate Limit Not Resetting

- Verify you're checking the correct rate limit window
- Rate limits reset at fixed intervals, not rolling windows
- Contact support if limits appear stuck

### Debug Commands

```bash
# Check current rate limit status
curl -I -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/projects"

# Monitor rate limit headers
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.deployio.dev/v1/account/usage" | jq .
```

---

_For custom rate limits or questions about enterprise plans, contact our sales team._
