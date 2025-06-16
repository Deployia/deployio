# Docker Guide

Complete guide to using Docker with Deployio for containerized deployments.

## Quick Start

```bash
# Build and deploy Docker image
deployio deploy --dockerfile Dockerfile

# Multi-stage builds
deployio build --stage production
```

## Configuration

```yaml
# deployio.yml
build:
  dockerfile: Dockerfile
  context: .
  target: production

deploy:
  type: container
  port: 3000
```

## Best Practices

- Use multi-stage builds
- Optimize image size
- Security scanning
- Health checks
