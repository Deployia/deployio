# Scaling Strategies

Learn how to scale your applications effectively with Deployio's auto-scaling and load balancing features.

## Auto-scaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 20
  targetCPU: 70%
  targetMemory: 80%
```

## Manual Scaling

```bash
# Scale horizontally
deployio scale --replicas 10

# Scale vertically
deployio scale --cpu 2 --memory 4Gi
```

## Load Balancing

```yaml
loadBalancer:
  type: application
  healthCheck:
    path: /health
    interval: 30s

  rules:
    - path: /api/*
      backend: api-service
    - path: /*
      backend: web-service
```

## Performance Optimization

- Resource optimization
- Caching strategies
- CDN configuration
- Database scaling
