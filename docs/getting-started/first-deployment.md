# First Deployment

Learn how to deploy your first application with Deployio step by step. This comprehensive guide covers everything from initial setup to monitoring your live application.

## Overview

Your first deployment is an exciting milestone! Deployio makes it simple with intelligent automation, but understanding the process helps you make the most of our platform.

## Before You Begin

Ensure you have completed:

- ✅ [Quick Start Guide](./quick-start.md)
- ✅ [Installation](./installation.md)
- ✅ Your project is properly configured

## Deployment Process

### 1. Project Analysis

When you run `deployio deploy`, our AI analyzes your project:

```bash
deployio deploy --analyze
```

This will:

- Detect your application framework
- Analyze dependencies and build requirements
- Suggest optimal deployment configuration
- Identify potential issues before deployment

### 2. Build Phase

Deployio builds your application in a secure, isolated environment:

```bash
# Build logs show real-time progress
deployio deploy --verbose
```

**Common Build Commands by Framework:**

- **React/Vue/Angular**: `npm run build`
- **Next.js**: `next build`
- **Python**: `pip install -r requirements.txt`
- **Go**: `go build`
- **Docker**: Uses your Dockerfile

### 3. Infrastructure Provisioning

Our platform automatically provisions:

- **Compute resources** (containers, serverless functions)
- **Networking** (load balancers, CDN)
- **Storage** (databases, file storage)
- **Security** (SSL certificates, firewalls)

### 4. Deployment Execution

```bash
deployio deploy --environment production
```

The deployment process includes:

1. **Code upload** to secure deployment environment
2. **Dependency installation** and build execution
3. **Infrastructure setup** with auto-scaling configuration
4. **Health checks** to ensure successful deployment
5. **DNS configuration** for your custom domain

## Monitoring Your Deployment

### Real-time Status

```bash
# Check deployment status
deployio status

# View detailed information
deployio status --detailed
```

### Application Logs

```bash
# Stream live logs
deployio logs --follow

# Filter by severity
deployio logs --level error

# Search logs
deployio logs --search "database"
```

### Performance Metrics

Access metrics through:

- **Web Dashboard**: Visit your project dashboard
- **CLI**: `deployio metrics`
- **API**: Programmatic access to metrics

## Deployment Strategies

### Blue-Green Deployment (Recommended)

```yaml
# deployio.yml
deployment:
  strategy: blue-green
  healthCheck:
    path: /health
    timeout: 30s
```

Benefits:

- Zero downtime deployments
- Instant rollback capability
- Safe production updates

### Rolling Updates

```yaml
deployment:
  strategy: rolling
  maxUnavailable: 25%
  maxSurge: 25%
```

### Canary Deployments

```yaml
deployment:
  strategy: canary
  canaryPercentage: 10
  promotionCriteria:
    errorRate: < 1%
    responseTime: < 500ms
```

## Environment Configuration

### Environment Variables

```bash
# Set environment variables
deployio env set NODE_ENV=production
deployio env set DATABASE_URL=your-database-url

# View current environment
deployio env list
```

### Secrets Management

```bash
# Store sensitive data securely
deployio secrets set API_KEY=your-secret-key
deployio secrets set DATABASE_PASSWORD=your-password
```

## Custom Domains

### Adding Your Domain

1. **Configure DNS**:

   ```bash
   deployio domains add yourdomain.com
   ```

2. **Update DNS records** as instructed by the CLI

3. **Verify domain**:
   ```bash
   deployio domains verify yourdomain.com
   ```

### SSL Certificates

Deployio automatically provisions and manages SSL certificates:

- **Automatic renewal** before expiration
- **Multiple domain support** (subdomains, wildcards)
- **HTTP to HTTPS redirect** for security

## Troubleshooting Common Issues

### Build Failures

```bash
# Debug build issues
deployio build --debug

# Check build logs
deployio logs --build-only
```

**Common Solutions:**

- Verify `package.json` scripts
- Check environment variable requirements
- Ensure all dependencies are listed

### Deployment Timeouts

```bash
# Increase timeout for large applications
deployio deploy --timeout 600
```

### Memory Issues

```yaml
# deployio.yml - Increase memory allocation
resources:
  memory: 1024Mi
  cpu: 500m
```

### Database Connection Issues

```bash
# Test database connectivity
deployio test db-connection

# Check firewall rules
deployio network status
```

## Best Practices

### 1. Use Version Tags

```bash
# Tag your deployments
deployio deploy --tag v1.0.0
```

### 2. Health Checks

```yaml
healthCheck:
  path: /api/health
  initialDelaySeconds: 30
  periodSeconds: 10
```

### 3. Resource Limits

```yaml
resources:
  requests:
    memory: 256Mi
    cpu: 100m
  limits:
    memory: 512Mi
    cpu: 200m
```

### 4. Backup Strategy

```bash
# Enable automatic backups
deployio backup enable --schedule daily
```

## Scaling Your Application

### Auto-scaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilization: 70
```

### Manual Scaling

```bash
# Scale horizontally
deployio scale --replicas 5

# Scale vertically
deployio scale --memory 1Gi --cpu 500m
```

## Security Considerations

### Network Security

- All traffic encrypted with TLS 1.3
- Private networking between services
- DDoS protection enabled by default

### Application Security

- Container image scanning
- Vulnerability assessments
- Security headers configured

### Access Control

```bash
# Manage team access
deployio team add user@company.com --role developer
deployio team permissions list
```

## Cost Optimization

### Resource Monitoring

```bash
# View resource usage and costs
deployio usage --current-month
deployio costs breakdown
```

### Optimization Tips

1. **Right-size resources** based on actual usage
2. **Use auto-scaling** to handle traffic spikes efficiently
3. **Enable hibernation** for development environments
4. **Optimize build times** with caching strategies

## Next Steps

Congratulations on your first deployment! Here's what to explore next:

1. **[Set up CI/CD pipelines](../guides/ci-cd-setup.md)** for automated deployments
2. **[Configure monitoring and alerts](../guides/monitoring.md)** for production readiness
3. **[Implement security best practices](../security/best-practices.md)** for enterprise compliance
4. **[Explore advanced features](../products/ai-deployment.md)** like AI-powered optimization

## Getting Help

- **Documentation**: Comprehensive guides and references
- **Support**: 24/7 support for production issues
- **Community**: Join thousands of developers on Discord
- **Expert Consulting**: For complex deployment scenarios

Remember: Every expert was once a beginner. You've taken the most important step by deploying your first application. Welcome to the Deployio community! 🎉
