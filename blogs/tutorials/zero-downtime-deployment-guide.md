# Zero-Downtime Deployments: Complete Tutorial

_Published on December 19, 2024 by the Deployio Engineering Team_

Deploying applications without any downtime is critical for modern web services. Users expect 24/7 availability, and even a few minutes of downtime can result in lost revenue and damaged reputation. In this comprehensive tutorial, we'll explore proven strategies for achieving zero-downtime deployments.

## What is Zero-Downtime Deployment?

Zero-downtime deployment is the ability to deploy new versions of your application without any service interruption. Users continue to access your application seamlessly while the new version is being deployed in the background.

### Why Zero-Downtime Matters

- **Business Continuity**: No lost revenue during deployments
- **User Experience**: Seamless service for end users
- **Competitive Advantage**: Deploy features faster without risk
- **Peace of Mind**: Deploy confidently at any time

## Prerequisites

Before we dive into strategies, ensure you have:

- **Load Balancer**: Routes traffic between application instances
- **Health Checks**: Verify application readiness
- **Monitoring**: Track deployment progress and application health
- **Rollback Plan**: Quick recovery if issues arise

## Deployment Strategies

### 1. Blue-Green Deployment

Blue-green deployment maintains two identical production environments. At any time, one environment (e.g., "blue") serves production traffic while the other ("green") is idle or staging the next release.

#### How It Works

1. Deploy new version to the idle environment (green)
2. Test the new version thoroughly
3. Switch traffic from blue to green instantly
4. Keep blue environment as rollback option

```yaml
# Blue-Green Deployment Configuration
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
    version: blue # Switch to green for deployment
  ports:
    - port: 80
      targetPort: 8080

---
# Blue Environment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
        - name: myapp
          image: myapp:v1.0
          ports:
            - containerPort: 8080

---
# Green Environment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
        - name: myapp
          image: myapp:v2.0
          ports:
            - containerPort: 8080
```

#### Blue-Green Deployment Script

```bash
#!/bin/bash

# Blue-Green Deployment Script
set -e

CURRENT_VERSION=$(kubectl get service app-service -o jsonpath='{.spec.selector.version}')
NEW_VERSION="green"

if [ "$CURRENT_VERSION" = "green" ]; then
    NEW_VERSION="blue"
fi

echo "Current version: $CURRENT_VERSION"
echo "Deploying to: $NEW_VERSION"

# Deploy new version
kubectl set image deployment/myapp-$NEW_VERSION myapp=myapp:$1

# Wait for deployment to be ready
kubectl rollout status deployment/myapp-$NEW_VERSION --timeout=600s

# Run health checks
echo "Running health checks..."
for i in {1..30}; do
    if kubectl exec deployment/myapp-$NEW_VERSION -- curl -f http://localhost:8080/health; then
        echo "Health check passed"
        break
    fi
    sleep 10
done

# Switch traffic
kubectl patch service app-service -p '{"spec":{"selector":{"version":"'$NEW_VERSION'"}}}'

echo "Traffic switched to $NEW_VERSION"
echo "Old version ($CURRENT_VERSION) kept for rollback"
```

#### Pros and Cons

**Pros:**

- Instant traffic switch
- Easy rollback
- Full testing in production environment
- No resource sharing between versions

**Cons:**

- Requires double infrastructure
- Database migrations can be complex
- Higher resource costs

### 2. Rolling Deployment

Rolling deployment gradually replaces old instances with new ones, ensuring some instances are always available to serve traffic.

#### How It Works

1. Start deploying new version instances
2. Remove old instances one by one
3. Health checks ensure only healthy instances receive traffic
4. Process continues until all instances are updated

```yaml
# Rolling Deployment Configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2 # 2 extra pods during update
      maxUnavailable: 1 # 1 pod can be unavailable
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp:v2.0
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 10
```

#### Rolling Deployment Script

```bash
#!/bin/bash

# Rolling Deployment Script
set -e

NEW_IMAGE=$1
DEPLOYMENT_NAME="myapp"

echo "Starting rolling deployment of $NEW_IMAGE"

# Update the deployment
kubectl set image deployment/$DEPLOYMENT_NAME myapp=$NEW_IMAGE

# Monitor the rollout
kubectl rollout status deployment/$DEPLOYMENT_NAME --timeout=600s

# Verify deployment
echo "Verifying deployment..."
READY_REPLICAS=$(kubectl get deployment $DEPLOYMENT_NAME -o jsonpath='{.status.readyReplicas}')
DESIRED_REPLICAS=$(kubectl get deployment $DEPLOYMENT_NAME -o jsonpath='{.spec.replicas}')

if [ "$READY_REPLICAS" = "$DESIRED_REPLICAS" ]; then
    echo "Deployment successful: $READY_REPLICAS/$DESIRED_REPLICAS replicas ready"
else
    echo "Deployment failed: only $READY_REPLICAS/$DESIRED_REPLICAS replicas ready"
    exit 1
fi
```

#### Pros and Cons

**Pros:**

- Resource efficient
- Gradual deployment reduces risk
- No additional infrastructure needed
- Native Kubernetes support

**Cons:**

- Mixed versions during deployment
- Slower than blue-green
- Complex rollback process

### 3. Canary Deployment

Canary deployment releases the new version to a small subset of users first, gradually increasing the percentage as confidence grows.

#### How It Works

1. Deploy new version alongside old version
2. Route small percentage of traffic to new version
3. Monitor metrics and user feedback
4. Gradually increase traffic to new version
5. Complete deployment or rollback based on results

```yaml
# Canary Deployment with Istio
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp-vs
spec:
  http:
    - match:
        - headers:
            canary:
              exact: "true"
      route:
        - destination:
            host: myapp
            subset: v2
    - route:
        - destination:
            host: myapp
            subset: v1
          weight: 90
        - destination:
            host: myapp
            subset: v2
          weight: 10 # 10% canary traffic

---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: myapp-dr
spec:
  host: myapp
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

#### Canary Deployment Script

```bash
#!/bin/bash

# Canary Deployment Script
set -e

NEW_IMAGE=$1
CANARY_PERCENTAGE=10

echo "Starting canary deployment with $CANARY_PERCENTAGE% traffic"

# Deploy canary version
kubectl set image deployment/myapp-v2 myapp=$NEW_IMAGE

# Wait for canary to be ready
kubectl rollout status deployment/myapp-v2 --timeout=300s

# Update traffic split
kubectl patch virtualservice myapp-vs --type='json' -p='[
  {
    "op": "replace",
    "path": "/spec/http/1/route/1/weight",
    "value": '$CANARY_PERCENTAGE'
  },
  {
    "op": "replace",
    "path": "/spec/http/1/route/0/weight",
    "value": '$((100-CANARY_PERCENTAGE))'
  }
]'

echo "Canary deployment active with $CANARY_PERCENTAGE% traffic"
echo "Monitor metrics and run: ./promote-canary.sh to complete deployment"
```

#### Pros and Cons

**Pros:**

- Minimal risk exposure
- Real user feedback
- Gradual rollout
- Easy monitoring and metrics collection

**Cons:**

- Complex traffic management
- Longer deployment process
- Requires advanced routing capabilities

## Database Considerations

Zero-downtime deployments become more complex when database changes are involved.

### Backward-Compatible Migrations

Always ensure database changes are backward-compatible:

```sql
-- ❌ Bad: Breaking change
ALTER TABLE users DROP COLUMN old_field;

-- ✅ Good: Backward-compatible approach
-- Step 1: Add new field (optional)
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- Step 2: Deploy application code that uses both fields
-- Step 3: Migrate data from old to new field
UPDATE users SET new_field = old_field WHERE new_field IS NULL;

-- Step 4: Deploy code that only uses new field
-- Step 5: Remove old field in a future deployment
-- ALTER TABLE users DROP COLUMN old_field;
```

### Migration Strategies

```javascript
// Database migration with zero downtime
class ZeroDowntimeMigration {
  async migrate() {
    // Phase 1: Additive changes only
    await this.addColumns();
    await this.addIndexes();

    // Phase 2: Deploy application (backward compatible)
    console.log("Deploy application that handles both old and new schema");

    // Phase 3: Data migration
    await this.migrateData();

    // Phase 4: Deploy application using new schema only
    console.log("Deploy application using new schema");

    // Phase 5: Cleanup (in future deployment)
    // await this.removeOldColumns();
  }

  async addColumns() {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN verification_token VARCHAR(255)
    `);
  }

  async migrateData() {
    // Batch process to avoid long-running transactions
    const batchSize = 1000;
    let offset = 0;

    while (true) {
      const users = await db.query(`
        SELECT id, email_verified_old 
        FROM users 
        WHERE email_verified IS NULL
        LIMIT ${batchSize} OFFSET ${offset}
      `);

      if (users.length === 0) break;

      for (const user of users) {
        await db.query(
          `
          UPDATE users 
          SET email_verified = ? 
          WHERE id = ?
        `,
          [user.email_verified_old, user.id]
        );
      }

      offset += batchSize;
    }
  }
}
```

## Health Checks and Readiness

Proper health checks are crucial for zero-downtime deployments.

### Application Health Check

```javascript
const express = require("express");
const app = express();

// Simple health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Detailed readiness check
app.get("/ready", async (req, res) => {
  try {
    // Check database connection
    await database.ping();

    // Check external services
    await redisClient.ping();

    // Check critical dependencies
    const criticalChecks = await Promise.all([
      checkPaymentService(),
      checkEmailService(),
      checkAuthService(),
    ]);

    if (criticalChecks.every((check) => check.healthy)) {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: criticalChecks,
      });
    } else {
      res.status(503).json({
        status: "not ready",
        checks: criticalChecks,
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "error",
      error: error.message,
    });
  }
});

async function checkPaymentService() {
  try {
    const response = await fetch("https://payments.api/health", {
      timeout: 5000,
    });
    return { service: "payments", healthy: response.ok };
  } catch (error) {
    return { service: "payments", healthy: false, error: error.message };
  }
}
```

### Kubernetes Health Check Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:latest
          ports:
            - containerPort: 8080

          # Liveness probe - restart container if unhealthy
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 60 # Wait 60s before first check
            periodSeconds: 30 # Check every 30s
            timeoutSeconds: 5 # 5s timeout for each check
            failureThreshold: 3 # Restart after 3 failures
            successThreshold: 1 # 1 success = healthy

          # Readiness probe - remove from service if not ready
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 30 # Wait 30s before first check
            periodSeconds: 10 # Check every 10s
            timeoutSeconds: 3 # 3s timeout for each check
            failureThreshold: 3 # Remove after 3 failures
            successThreshold: 1 # 1 success = ready

          # Startup probe - give app time to start
          startupProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 30 # 30 * 5s = 150s to start
```

## Monitoring and Alerting

Comprehensive monitoring is essential for successful zero-downtime deployments.

### Key Metrics to Monitor

```javascript
// Deployment monitoring dashboard
const deploymentMetrics = {
  // Application metrics
  responseTime: "avg_response_time_ms",
  errorRate: "error_rate_percentage",
  throughput: "requests_per_second",

  // Infrastructure metrics
  cpuUsage: "cpu_usage_percentage",
  memoryUsage: "memory_usage_percentage",
  diskUsage: "disk_usage_percentage",

  // Business metrics
  conversionRate: "conversion_rate_percentage",
  revenue: "revenue_per_minute",
  activeUsers: "active_users_count",

  // Deployment metrics
  deploymentDuration: "deployment_duration_minutes",
  rollbackRate: "rollback_rate_percentage",
  successRate: "deployment_success_rate",
};
```

### Automated Rollback

```javascript
// Automated rollback based on metrics
class DeploymentMonitor {
  constructor(deployment, thresholds) {
    this.deployment = deployment;
    this.thresholds = thresholds;
    this.monitoringInterval = 30000; // 30 seconds
  }

  async startMonitoring() {
    const monitoringTimer = setInterval(async () => {
      const metrics = await this.collectMetrics();

      if (this.shouldRollback(metrics)) {
        clearInterval(monitoringTimer);
        await this.initiateRollback(metrics);
      }
    }, this.monitoringInterval);

    // Stop monitoring after 10 minutes (deployment stabilized)
    setTimeout(() => {
      clearInterval(monitoringTimer);
      console.log("Deployment monitoring completed successfully");
    }, 600000);
  }

  shouldRollback(metrics) {
    return (
      metrics.errorRate > this.thresholds.maxErrorRate ||
      metrics.responseTime > this.thresholds.maxResponseTime ||
      metrics.cpuUsage > this.thresholds.maxCpuUsage
    );
  }

  async initiateRollback(metrics) {
    console.log("Initiating automated rollback due to:", metrics);

    // Rollback deployment
    await this.deployment.rollback();

    // Send alerts
    await this.sendAlert({
      type: "rollback",
      reason: "Automated rollback triggered",
      metrics: metrics,
    });
  }
}
```

## Testing Zero-Downtime Deployments

### Load Testing During Deployment

```javascript
// Load test script for zero-downtime validation
const axios = require("axios");

class ZeroDowntimeTest {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.duration = config.duration || 300000; // 5 minutes
    this.concurrency = config.concurrency || 10;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errors: [],
    };
  }

  async runTest() {
    console.log(`Starting zero-downtime test for ${this.duration}ms`);

    const startTime = Date.now();
    const workers = [];

    // Start concurrent workers
    for (let i = 0; i < this.concurrency; i++) {
      workers.push(this.worker(startTime));
    }

    await Promise.all(workers);

    return this.generateReport();
  }

  async worker(startTime) {
    while (Date.now() - startTime < this.duration) {
      try {
        this.results.totalRequests++;

        const response = await axios.get(`${this.baseUrl}/health`, {
          timeout: 5000,
        });

        if (response.status === 200) {
          this.results.successfulRequests++;
        } else {
          this.results.failedRequests++;
          this.results.errors.push({
            timestamp: new Date(),
            status: response.status,
            message: "Non-200 response",
          });
        }
      } catch (error) {
        this.results.failedRequests++;
        this.results.errors.push({
          timestamp: new Date(),
          message: error.message,
        });
      }

      // Wait 100ms between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  generateReport() {
    const successRate =
      (this.results.successfulRequests / this.results.totalRequests) * 100;

    return {
      ...this.results,
      successRate: successRate.toFixed(2) + "%",
      zeroDowntime: this.results.failedRequests === 0,
    };
  }
}

// Usage
const test = new ZeroDowntimeTest({
  baseUrl: "https://myapp.example.com",
  duration: 300000, // 5 minutes
  concurrency: 20,
});

test.runTest().then((report) => {
  console.log("Zero-downtime test report:", report);

  if (report.zeroDowntime) {
    console.log("✅ Zero-downtime deployment successful!");
  } else {
    console.log("❌ Downtime detected during deployment");
  }
});
```

## Best Practices

### 1. Preparation

- **Test thoroughly** in staging environments
- **Automate everything** to reduce human error
- **Have a rollback plan** ready before deployment
- **Coordinate with stakeholders** about deployment windows

### 2. Deployment

- **Monitor actively** during deployment
- **Deploy during low-traffic periods** when possible
- **Use feature flags** to control new functionality
- **Validate each step** before proceeding

### 3. Post-Deployment

- **Monitor for extended period** after deployment
- **Verify business metrics** are not impacted
- **Document lessons learned** for future deployments
- **Clean up resources** from previous versions

## Troubleshooting Common Issues

### Issue 1: Health Checks Failing

```bash
# Debug health check failures
kubectl describe pod myapp-xyz
kubectl logs myapp-xyz

# Check if application is actually unhealthy
kubectl exec myapp-xyz -- curl http://localhost:8080/health
```

### Issue 2: Traffic Not Switching

```bash
# Verify service selector
kubectl get service myapp -o yaml

# Check endpoint availability
kubectl get endpoints myapp

# Verify load balancer configuration
kubectl describe service myapp
```

### Issue 3: Database Connection Issues

```javascript
// Implement connection pooling and retry logic
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections
  connectionTimeoutMillis: 2000,
});

async function queryWithRetry(sql, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.query(sql, params);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      console.log(`Database query failed (attempt ${attempt}), retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## Conclusion

Zero-downtime deployments are achievable with the right strategies, tools, and practices. Whether you choose blue-green, rolling, or canary deployments depends on your specific requirements, infrastructure, and risk tolerance.

Key takeaways:

- **Start with proper health checks and monitoring**
- **Choose the right strategy for your use case**
- **Automate deployment processes**
- **Test thoroughly in production-like environments**
- **Always have a rollback plan**

By implementing these practices, you can deploy confidently at any time without impacting your users.

## Next Steps

- Explore [CI/CD Pipeline Optimization](/blog/devops/cicd-pipeline-optimization)
- Learn about [Container Orchestration with Kubernetes](/blog/engineering/container-orchestration-kubernetes)
- Check out our [Deployment Security Checklist](/blog/security/deployment-security-checklist)

---

_Ready to implement zero-downtime deployments? [Try Deployio today](https://deployio.dev/signup) and experience seamless deployments with built-in zero-downtime strategies._
