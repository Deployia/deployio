# Project Setup

Learn how to structure and configure your projects for optimal deployment with Deployio. This guide covers best practices for project organization, configuration management, and environment setup.

## Project Structure

### Recommended Directory Layout

```
my-application/
├── deployio.yml           # Deployio configuration
├── .deployio/             # Deployio-specific files
│   ├── environments/      # Environment-specific configs
│   ├── scripts/          # Custom deployment scripts
│   └── templates/        # Infrastructure templates
├── src/                  # Application source code
├── tests/               # Test files
├── docs/                # Project documentation
├── scripts/             # Build and utility scripts
├── .gitignore
├── README.md
└── package.json         # Dependencies (Node.js)
```

## Deployio Configuration

### Basic Configuration (`deployio.yml`)

```yaml
# Project Information
name: my-application
version: 1.2.0
description: "My awesome web application"

# Build Configuration
build:
  command: npm run build
  output: dist
  cache:
    enabled: true
    paths:
      - node_modules
      - .next/cache

# Deployment Configuration
deploy:
  target: aws
  region: us-east-1
  strategy: blue-green

# Environment Variables
environment:
  NODE_ENV: production
  API_VERSION: v1

# Resource Allocation
resources:
  memory: 512Mi
  cpu: 250m

# Health Checks
healthCheck:
  path: /health
  port: 3000
  initialDelaySeconds: 30
```

### Advanced Configuration

```yaml
# Multi-environment setup
environments:
  development:
    replicas: 1
    resources:
      memory: 256Mi
    environment:
      NODE_ENV: development
      DEBUG: true

  staging:
    replicas: 2
    resources:
      memory: 512Mi
    environment:
      NODE_ENV: staging

  production:
    replicas: 3
    resources:
      memory: 1Gi
      cpu: 500m
    environment:
      NODE_ENV: production
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 10

# Custom Scripts
scripts:
  preBuild: "./scripts/prepare.sh"
  postBuild: "./scripts/optimize.sh"
  preDeploy: "./scripts/migrations.sh"
  postDeploy: "./scripts/notify.sh"

# Dependencies and Services
services:
  database:
    type: postgresql
    version: "13"
    storage: 20Gi

  redis:
    type: redis
    version: "6"
    memory: 256Mi

  storage:
    type: s3
    bucket: my-app-assets
```

## Framework-Specific Setup

### React/Vue/Angular Applications

```yaml
# deployio.yml for SPA
build:
  command: npm run build
  output: build # or dist

deploy:
  type: static-site
  spa: true # Enable SPA routing

cdn:
  enabled: true
  caching:
    static: 31536000 # 1 year
    html: 0
```

### Next.js Applications

```yaml
# deployio.yml for Next.js
build:
  command: npm run build
  output: .next

deploy:
  type: nextjs
  runtime: nodejs18

features:
  ssr: true
  api-routes: true
  image-optimization: true
```

### Node.js API Servers

```yaml
# deployio.yml for Node.js API
build:
  command: npm install

deploy:
  type: nodejs
  runtime: nodejs18

healthCheck:
  path: /api/health

autoscaling:
  enabled: true
  metrics:
    - type: cpu
      target: 70
    - type: memory
      target: 80
```

### Python Applications

```yaml
# deployio.yml for Python
build:
  command: pip install -r requirements.txt

deploy:
  type: python
  runtime: python3.9
  wsgi: app:application # For Flask/Django

environment:
  PYTHONPATH: /app
  DJANGO_SETTINGS_MODULE: myapp.settings.production
```

### Docker Applications

```yaml
# deployio.yml for Docker
build:
  dockerfile: Dockerfile
  context: .
  args:
    NODE_ENV: production

deploy:
  type: container
  port: 3000

resources:
  memory: 1Gi
  cpu: 500m
```

## Environment Management

### Environment Files

Create environment-specific configurations:

```bash
# .deployio/environments/development.yml
environment:
  DEBUG: true
  LOG_LEVEL: debug
  DATABASE_URL: postgres://localhost/myapp_dev

# .deployio/environments/production.yml
environment:
  LOG_LEVEL: info
  DATABASE_URL: ${DATABASE_URL}  # From secrets
  REDIS_URL: ${REDIS_URL}
```

### Secrets Management

```bash
# Set secrets for each environment
deployio secrets set --env production DATABASE_URL=postgres://...
deployio secrets set --env production JWT_SECRET=your-secret-key
deployio secrets set --env production STRIPE_SECRET_KEY=sk_live_...

# View secrets (values hidden)
deployio secrets list --env production
```

### Environment Variables

```bash
# Set non-sensitive environment variables
deployio env set --env production NODE_ENV=production
deployio env set --env production API_VERSION=v2
deployio env set --env staging FEATURE_FLAGS='{"newUI":true}'
```

## Build Optimization

### Caching Strategies

```yaml
build:
  cache:
    enabled: true
    paths:
      - node_modules
      - .next/cache
      - target/ # For Rust/Java
      - ~/.cargo/ # Rust dependencies
    key: "v1-{{ checksum 'package-lock.json' }}"
```

### Multi-stage Builds (Docker)

```dockerfile
# Dockerfile with multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Build Performance

```yaml
build:
  # Parallel builds
  parallel: true

  # Build timeout
  timeout: 600

  # Custom build environment
  environment:
    NODE_OPTIONS: "--max-old-space-size=4096"
    MAKEFLAGS: "-j4"
```

## Database Setup

### Database Migrations

```yaml
scripts:
  preDeploy: |
    npm run db:migrate
    npm run db:seed
```

### Database Configuration

```yaml
services:
  database:
    type: postgresql
    version: "13"
    storage: 100Gi
    backups:
      enabled: true
      schedule: "0 2 * * *" # Daily at 2 AM
      retention: 30 # days

    # Connection pooling
    maxConnections: 100

    # Performance tuning
    configuration:
      shared_buffers: "256MB"
      work_mem: "4MB"
```

## Monitoring and Logging

### Application Metrics

```yaml
monitoring:
  metrics:
    enabled: true
    path: /metrics

  logging:
    level: info
    format: json

  tracing:
    enabled: true
    sampler: 0.1 # 10% sampling
```

### Custom Dashboards

```yaml
dashboards:
  - name: "Application Performance"
    widgets:
      - type: response-time
      - type: error-rate
      - type: throughput

  - name: "Infrastructure"
    widgets:
      - type: cpu-usage
      - type: memory-usage
      - type: disk-usage
```

## Security Configuration

### Network Security

```yaml
security:
  network:
    # Private networking
    vpc:
      enabled: true

    # Firewall rules
    ingress:
      - port: 443
        protocol: https
        sources: ["0.0.0.0/0"]
      - port: 80
        protocol: http
        redirect: https

    # WAF protection
    waf:
      enabled: true
      rules:
        - sql-injection
        - xss-protection
        - rate-limiting
```

### Container Security

```yaml
security:
  container:
    # Run as non-root user
    runAsUser: 1000
    runAsGroup: 1000

    # Read-only filesystem
    readOnlyRootFilesystem: true

    # Security context
    allowPrivilegeEscalation: false
    capabilities:
      drop:
        - ALL
```

## Testing Integration

### Pre-deployment Testing

```yaml
scripts:
  preDeploy: |
    npm run test:unit
    npm run test:integration
    npm run security:scan
    npm run performance:test
```

### Test Configuration

```yaml
testing:
  unit:
    command: npm test
    coverage: 80

  integration:
    command: npm run test:e2e
    environment: staging

  security:
    enabled: true
    scanners:
      - dependency-check
      - container-scan
      - code-analysis
```

## Performance Optimization

### Resource Optimization

```yaml
resources:
  # Right-size your containers
  requests:
    memory: 256Mi
    cpu: 100m
  limits:
    memory: 512Mi
    cpu: 250m

# Auto-scaling based on usage
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 20
  targetCPUUtilization: 70
  targetMemoryUtilization: 80
```

### CDN Configuration

```yaml
cdn:
  enabled: true
  regions:
    - us-east-1
    - eu-west-1
    - ap-southeast-1

  caching:
    # Static assets
    "*.css": 31536000 # 1 year
    "*.js": 31536000
    "*.png": 2592000 # 30 days

    # Dynamic content
    "/api/*": 0 # No caching
    "/*.html": 300 # 5 minutes
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Deployio

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: deployio/setup-cli@v1
        with:
          api-key: ${{ secrets.DEPLOYIO_API_KEY }}
      - run: deployio deploy --env production
```

### GitLab CI

```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  image: deployio/cli:latest
  script:
    - deployio deploy --env production
  only:
    - main
```

## Troubleshooting

### Common Configuration Issues

1. **Build Failures**

   ```bash
   # Debug build process
   deployio build --debug --verbose
   ```

2. **Memory Issues**

   ```yaml
   # Increase memory allocation
   resources:
     memory: 1Gi
   ```

3. **Slow Builds**
   ```yaml
   # Enable build caching
   build:
     cache:
       enabled: true
   ```

### Configuration Validation

```bash
# Validate your configuration
deployio config validate

# Dry run deployment
deployio deploy --dry-run

# Check configuration differences
deployio config diff --env staging production
```

## Best Practices

1. **Version Control**: Always commit `deployio.yml` to version control
2. **Environment Parity**: Keep development and production as similar as possible
3. **Secret Management**: Never commit secrets to version control
4. **Documentation**: Document your configuration decisions
5. **Testing**: Test configuration changes in staging first
6. **Monitoring**: Set up alerts for configuration drift
7. **Backup**: Regular backups of configuration and data
8. **Security**: Regular security reviews and updates

## Next Steps

- [Configure environment variables](./environment-variables.md)
- [Set up your first deployment](./first-deployment.md)
- [Explore advanced deployment strategies](../guides/deployment-strategies.md)
- [Learn about security best practices](../security/best-practices.md)

Need help with your specific setup? Check our [troubleshooting guide](../guides/troubleshooting.md) or contact our support team.
