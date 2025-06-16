# Environment Variables

Learn how to securely manage environment variables and secrets in your Deployio applications. This guide covers best practices for configuration management across different environments.

## Overview

Environment variables are key-value pairs that configure your application's behavior without changing code. Deployio provides secure, scalable environment variable management with built-in secrets encryption.

## Types of Configuration

### Environment Variables

Non-sensitive configuration that can be safely logged:

- `NODE_ENV=production`
- `PORT=3000`
- `LOG_LEVEL=info`

### Secrets

Sensitive data that requires encryption:

- Database passwords
- API keys
- JWT signing keys
- Third-party service credentials

## Setting Environment Variables

### Using the CLI

```bash
# Set environment variables
deployio env set NODE_ENV=production
deployio env set PORT=3000
deployio env set LOG_LEVEL=info

# Set for specific environment
deployio env set --env staging DEBUG=true
deployio env set --env production CACHE_TTL=3600

# List current variables
deployio env list
deployio env list --env production

# Remove variables
deployio env unset DEBUG
```

### Using Configuration Files

```yaml
# deployio.yml
environment:
  NODE_ENV: production
  PORT: 3000
  LOG_LEVEL: info
  FEATURE_FLAGS: '{"newUI": true, "betaAPI": false}'

# Environment-specific overrides
environments:
  development:
    environment:
      NODE_ENV: development
      DEBUG: true
      LOG_LEVEL: debug

  staging:
    environment:
      NODE_ENV: staging
      DEBUG: false
      LOG_LEVEL: info

  production:
    environment:
      NODE_ENV: production
      DEBUG: false
      LOG_LEVEL: warn
```

## Managing Secrets

### Setting Secrets

```bash
# Set secrets securely
deployio secrets set DATABASE_PASSWORD=your-secure-password
deployio secrets set JWT_SECRET=your-jwt-secret-key
deployio secrets set STRIPE_SECRET_KEY=sk_live_...

# Set for specific environment
deployio secrets set --env production API_KEY=prod-api-key
deployio secrets set --env staging API_KEY=staging-api-key

# Import secrets from file
deployio secrets import --file .env.production
```

### Viewing Secrets

```bash
# List secret names (values are hidden)
deployio secrets list
deployio secrets list --env production

# Get a specific secret value (requires authentication)
deployio secrets get DATABASE_PASSWORD
```

### Secret File Format

```bash
# .env.production (for import)
DATABASE_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG.abc123...
```

## Environment-Specific Configuration

### Development Environment

```yaml
# .deployio/environments/development.yml
environment:
  NODE_ENV: development
  DEBUG: true
  LOG_LEVEL: debug
  DATABASE_URL: postgres://localhost:5432/myapp_dev
  REDIS_URL: redis://localhost:6379

# Local development secrets
secrets:
  JWT_SECRET: dev-secret-key
  STRIPE_SECRET_KEY: sk_test_...
```

### Staging Environment

```yaml
# .deployio/environments/staging.yml
environment:
  NODE_ENV: staging
  DEBUG: false
  LOG_LEVEL: info
  FEATURE_FLAGS: '{"betaFeatures": true}'

# Reference secrets (set via CLI)
secrets:
  DATABASE_URL: ${DATABASE_URL}
  JWT_SECRET: ${JWT_SECRET}
  STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
```

### Production Environment

```yaml
# .deployio/environments/production.yml
environment:
  NODE_ENV: production
  DEBUG: false
  LOG_LEVEL: warn
  CACHE_TTL: 3600
  SESSION_TIMEOUT: 1800

# All secrets referenced from secure store
secrets:
  DATABASE_URL: ${DATABASE_URL}
  JWT_SECRET: ${JWT_SECRET}
  STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
  SENDGRID_API_KEY: ${SENDGRID_API_KEY}
```

## Framework-Specific Examples

### Node.js Applications

```javascript
// Using environment variables in Node.js
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },
};

module.exports = config;
```

### Python Applications

```python
# config.py
import os
from typing import Optional

class Config:
    # Environment variables
    DEBUG: bool = os.getenv('DEBUG', 'false').lower() == 'true'
    PORT: int = int(os.getenv('PORT', '8000'))
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'info')

    # Database configuration
    DATABASE_URL: str = os.getenv('DATABASE_URL')
    DB_MAX_CONNECTIONS: int = int(os.getenv('DB_MAX_CONNECTIONS', '10'))

    # Security
    SECRET_KEY: str = os.getenv('SECRET_KEY')
    JWT_SECRET: str = os.getenv('JWT_SECRET')

    # Third-party services
    STRIPE_SECRET_KEY: str = os.getenv('STRIPE_SECRET_KEY')
    SENDGRID_API_KEY: str = os.getenv('SENDGRID_API_KEY')

    @classmethod
    def validate(cls):
        required_vars = ['DATABASE_URL', 'SECRET_KEY', 'JWT_SECRET']
        missing = [var for var in required_vars if not getattr(cls, var)]
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")

# Load and validate configuration
config = Config()
config.validate()
```

### React Applications

```javascript
// For client-side React apps, use REACT_APP_ prefix
// .env.production
REACT_APP_API_URL=https://api.myapp.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_ANALYTICS_ID=GA-123456789
REACT_APP_FEATURE_FLAGS={"newUI":true}

// config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  stripe: {
    publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  },
  analytics: {
    id: process.env.REACT_APP_ANALYTICS_ID
  },
  featureFlags: JSON.parse(process.env.REACT_APP_FEATURE_FLAGS || '{}')
};

export default config;
```

## Database Configuration

### PostgreSQL

```bash
# Set database connection details
deployio secrets set DATABASE_URL=postgres://user:password@host:5432/dbname
deployio env set DB_MAX_CONNECTIONS=20
deployio env set DB_TIMEOUT=30000
```

### MongoDB

```bash
# MongoDB connection
deployio secrets set MONGODB_URI=mongodb://user:password@host:27017/dbname
deployio env set MONGODB_MAX_POOL_SIZE=10
```

### Redis

```bash
# Redis configuration
deployio secrets set REDIS_URL=redis://user:password@host:6379
deployio env set REDIS_MAX_RETRIES=3
deployio env set REDIS_TIMEOUT=5000
```

## Third-Party Service Integration

### Payment Processing

```bash
# Stripe
deployio secrets set STRIPE_SECRET_KEY=sk_live_...
deployio env set STRIPE_PUBLISHABLE_KEY=pk_live_...

# PayPal
deployio secrets set PAYPAL_CLIENT_ID=your-client-id
deployio secrets set PAYPAL_CLIENT_SECRET=your-client-secret
```

### Email Services

```bash
# SendGrid
deployio secrets set SENDGRID_API_KEY=SG.abc123...
deployio env set FROM_EMAIL=noreply@myapp.com

# AWS SES
deployio secrets set AWS_ACCESS_KEY_ID=AKIA...
deployio secrets set AWS_SECRET_ACCESS_KEY=...
deployio env set AWS_REGION=us-east-1
```

### Cloud Storage

```bash
# AWS S3
deployio secrets set AWS_S3_ACCESS_KEY=...
deployio secrets set AWS_S3_SECRET_KEY=...
deployio env set AWS_S3_BUCKET=my-app-assets
deployio env set AWS_S3_REGION=us-east-1

# Google Cloud Storage
deployio secrets set GCS_SERVICE_ACCOUNT_KEY='{"type":"service_account"...}'
deployio env set GCS_BUCKET_NAME=my-app-storage
```

## Security Best Practices

### Secret Rotation

```bash
# Regular secret rotation
deployio secrets rotate JWT_SECRET
deployio secrets rotate DATABASE_PASSWORD

# Scheduled rotation (enterprise feature)
deployio secrets schedule-rotation JWT_SECRET --interval 90d
```

### Access Control

```bash
# Role-based access to secrets
deployio secrets access add user@company.com --role reader
deployio secrets access add deploy-bot --role writer --env production

# Audit secret access
deployio secrets audit --env production
```

### Encryption

```yaml
# deployio.yml - encryption configuration
security:
  secrets:
    encryption: AES-256-GCM
    keyRotation: 30d
    auditLog: enabled
```

## Environment Variable Validation

### Validation Rules

```yaml
# deployio.yml
validation:
  environment:
    NODE_ENV:
      required: true
      values: [development, staging, production]

    PORT:
      required: true
      type: integer
      min: 1024
      max: 65535

    LOG_LEVEL:
      required: false
      values: [debug, info, warn, error]
      default: info

    DATABASE_URL:
      required: true
      pattern: "^postgres://.+"

    JWT_SECRET:
      required: true
      minLength: 32
```

### Custom Validation Scripts

```bash
# scripts/validate-env.sh
#!/bin/bash

# Check required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "STRIPE_SECRET_KEY")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

# Validate specific formats
if [[ ! $DATABASE_URL =~ ^postgres:// ]]; then
  echo "Error: DATABASE_URL must be a PostgreSQL connection string"
  exit 1
fi

echo "Environment validation passed"
```

## Debugging Environment Issues

### Common Problems

1. **Variable Not Found**

   ```bash
   # Check if variable is set
   deployio env get NODE_ENV

   # List all variables
   deployio env list
   ```

2. **Wrong Environment**

   ```bash
   # Verify current environment
   deployio env current

   # Switch environment
   deployio env use production
   ```

3. **Permission Issues**

   ```bash
   # Check access permissions
   deployio secrets access list

   # Request access
   deployio secrets access request --env production
   ```

### Troubleshooting Commands

```bash
# Test environment configuration
deployio env test

# Validate against schema
deployio env validate

# Compare environments
deployio env diff staging production

# Export environment for debugging
deployio env export --format json > env-debug.json
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
- name: Set Environment Variables
  run: |
    deployio env set --env production BUILD_NUMBER=${{ github.run_number }}
    deployio env set --env production COMMIT_SHA=${{ github.sha }}
```

### Environment Promotion

```bash
# Promote configuration from staging to production
deployio env promote --from staging --to production

# Copy specific variables
deployio env copy DATABASE_URL --from staging --to production
```

## Monitoring and Alerts

### Configuration Drift Detection

```yaml
# deployio.yml
monitoring:
  configDrift:
    enabled: true
    alerts:
      - type: email
        recipients: [devops@company.com]
      - type: slack
        webhook: ${SLACK_WEBHOOK_URL}
```

### Environment Variable Changes

```bash
# Track changes
deployio env history
deployio secrets audit --since 7d

# Set up alerts
deployio alerts create env-change --type environment-variable-changed
```

## Best Practices Summary

1. **Separation**: Keep environment variables separate from secrets
2. **Least Privilege**: Grant minimal access needed for each role
3. **Rotation**: Regularly rotate sensitive credentials
4. **Validation**: Validate environment configuration before deployment
5. **Documentation**: Document all environment variables and their purposes
6. **Audit**: Regularly audit access and usage
7. **Backup**: Maintain secure backups of critical configuration
8. **Testing**: Test environment configuration in staging before production

## Next Steps

- [Configure your first deployment](./first-deployment.md)
- [Learn about project structure](./project-setup.md)
- [Explore security best practices](../security/best-practices.md)
- [Set up monitoring and alerts](../guides/monitoring.md)

Need help with environment configuration? Check our [troubleshooting guide](../guides/troubleshooting.md) or contact support.
