# Troubleshooting

Common issues and solutions for Deployio deployments.

## Common Issues

### Deployment Failures

```bash
# Check deployment status
deployio status --detailed

# View error logs
deployio logs --level error --since 1h

# Rollback if needed
deployio rollback
```

### Performance Issues

```bash
# Monitor resource usage
deployio metrics --resource cpu,memory

# Check for bottlenecks
deployio analyze performance

# Scale if needed
deployio scale --replicas 5
```

### Network Issues

```bash
# Test connectivity
deployio ping

# Check DNS resolution
deployio diagnose dns

# Verify load balancer
deployio lb status
```

## Debug Commands

```bash
# Enable debug mode
deployio --debug deploy

# Run diagnostics
deployio doctor

# Export debug info
deployio debug export
```

## Getting Help

- Check logs first
- Use debug mode
- Contact support
- Community forums
