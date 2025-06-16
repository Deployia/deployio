# CLI Tool

The Deployio Command Line Interface (CLI) is your gateway to powerful deployment automation. Built for developers who love the terminal, our CLI provides comprehensive functionality for managing projects, deployments, and infrastructure from the command line.

## Installation

### Quick Install

```bash
# Using npm (recommended)
npm install -g @deployio/cli

# Using pip
pip install deployio-cli

# Using curl (Linux/macOS)
curl -fsSL https://cli.deployio.com/install.sh | sh

# Using PowerShell (Windows)
iwr https://cli.deployio.com/install.ps1 | iex
```

### Package Managers

```bash
# Homebrew (macOS/Linux)
brew install deployio/tap/deployio

# Chocolatey (Windows)
choco install deployio-cli

# Snap (Linux)
sudo snap install deployio --classic

# APT (Debian/Ubuntu)
curl -fsSL https://cli.deployio.com/key.gpg | sudo apt-key add -
echo "deb https://cli.deployio.com/apt stable main" | sudo tee /etc/apt/sources.list.d/deployio.list
sudo apt update && sudo apt install deployio-cli

# YUM (RHEL/CentOS/Fedora)
sudo rpm --import https://cli.deployio.com/key.gpg
echo -e "[deployio]\nname=Deployio CLI\nbaseurl=https://cli.deployio.com/yum\nenabled=1\ngpgcheck=1" | sudo tee /etc/yum.repos.d/deployio.repo
sudo yum install deployio-cli
```

### Docker

```bash
# Run CLI in Docker container
docker run --rm -it deployio/cli:latest

# Create alias for convenience
alias deployio='docker run --rm -it -v $(pwd):/workspace deployio/cli:latest'
```

### Verification

```bash
# Verify installation
deployio --version

# Check CLI health
deployio doctor

# View available commands
deployio --help
```

## Getting Started

### Authentication

```bash
# Login with your Deployio account
deployio auth login

# Login with API token
deployio auth login --token YOUR_API_TOKEN

# Login with SSO
deployio auth login --sso

# Check authentication status
deployio auth status

# Logout
deployio auth logout
```

### Project Initialization

```bash
# Initialize new project
deployio init

# Initialize with template
deployio init --template react-app

# Initialize with custom configuration
deployio init --config custom-deployio.yml

# List available templates
deployio templates list
```

## Core Commands

### Project Management

```bash
# List all projects
deployio projects list

# Create new project
deployio projects create my-new-app

# Get project details
deployio projects get my-app

# Update project settings
deployio projects update my-app --description "Updated description"

# Delete project
deployio projects delete my-app --confirm

# Clone project configuration
deployio projects clone source-app target-app
```

### Deployment Operations

```bash
# Deploy current project
deployio deploy

# Deploy specific branch
deployio deploy --branch feature/new-feature

# Deploy with custom environment
deployio deploy --env production

# Deploy with build override
deployio deploy --build-command "npm run build:prod"

# Dry run deployment
deployio deploy --dry-run

# Deploy with confirmation prompts disabled
deployio deploy --yes

# Deploy and follow logs
deployio deploy --follow
```

### Environment Management

```bash
# List environments
deployio env list

# Create new environment
deployio env create staging

# Set environment variables
deployio env set NODE_ENV=production
deployio env set --env staging DEBUG=true

# Get environment variable
deployio env get DATABASE_URL

# Import environment from file
deployio env import --file .env.production

# Export environment to file
deployio env export --file backup.env

# Copy environment between projects
deployio env copy --from staging --to production
```

### Secrets Management

```bash
# Set secrets
deployio secrets set DATABASE_PASSWORD=secure-password

# List secret names (values hidden)
deployio secrets list

# Get secret value (requires authentication)
deployio secrets get API_KEY

# Import secrets from file
deployio secrets import --file secrets.env

# Generate random secret
deployio secrets generate JWT_SECRET --length 32

# Rotate secret
deployio secrets rotate DATABASE_PASSWORD

# Delete secret
deployio secrets delete OLD_API_KEY
```

### Monitoring and Logs

```bash
# View application logs
deployio logs

# Follow logs in real-time
deployio logs --follow

# Filter logs by level
deployio logs --level error

# Search logs
deployio logs --search "database error"

# Get logs from specific timeframe
deployio logs --since 1h --until 30m

# Get logs from specific deployment
deployio logs --deployment d-abc123

# Export logs
deployio logs --export --format json > logs.json
```

### Status and Health

```bash
# Check deployment status
deployio status

# Detailed status information
deployio status --detailed

# Health check
deployio health

# Performance metrics
deployio metrics

# Resource usage
deployio usage

# Check for issues
deployio troubleshoot
```

## Advanced Features

### Rollback Operations

```bash
# List deployment history
deployio rollback list

# Rollback to previous deployment
deployio rollback

# Rollback to specific deployment
deployio rollback --to d-abc123

# Rollback with confirmation
deployio rollback --to d-abc123 --confirm

# Preview rollback changes
deployio rollback --to d-abc123 --dry-run
```

### Scaling Operations

```bash
# Scale application
deployio scale --replicas 5

# Auto-scale configuration
deployio scale auto --min 2 --max 10 --cpu 70

# Scale with custom resources
deployio scale --memory 1Gi --cpu 500m

# Get current scale
deployio scale status

# Scale down to zero
deployio scale down --replicas 0
```

### Database Operations

```bash
# Run database migrations
deployio db migrate

# Seed database
deployio db seed

# Backup database
deployio db backup

# Restore database
deployio db restore --file backup-2024-01-15.sql

# Connect to database
deployio db connect

# Execute database query
deployio db exec "SELECT COUNT(*) FROM users"
```

### File and Data Management

```bash
# Upload files
deployio files upload local-file.txt remote-path/

# Download files
deployio files download remote-path/file.txt

# List files
deployio files list

# Sync directories
deployio files sync ./local-dir remote-dir/

# Set file permissions
deployio files chmod 644 remote-file.txt
```

## Configuration Management

### Global Configuration

```bash
# Set global defaults
deployio config set default-region us-east-1
deployio config set default-env production

# View current configuration
deployio config list

# Edit configuration file
deployio config edit

# Reset to defaults
deployio config reset

# Import configuration
deployio config import --file deployio-config.json
```

### Project Configuration

```bash
# Validate project configuration
deployio config validate

# Generate configuration template
deployio config generate --template nodejs

# Compare configurations
deployio config diff staging production

# Lint configuration
deployio config lint

# Update configuration
deployio config update --key build.command --value "npm run build:prod"
```

## Automation and Scripting

### Batch Operations

```bash
# Deploy multiple projects
deployio batch deploy --projects app1,app2,app3

# Update multiple environments
deployio batch env set NODE_ENV=production --projects app1,app2

# Bulk secret rotation
deployio batch secrets rotate --pattern "*_PASSWORD"

# Mass configuration update
deployio batch config update --key timeout --value 300
```

### Hooks and Scripts

```bash
# List available hooks
deployio hooks list

# Create custom hook
deployio hooks create post-deploy --script "./scripts/notify.sh"

# Run hook manually
deployio hooks run post-deploy

# Disable hook
deployio hooks disable pre-deploy

# View hook logs
deployio hooks logs post-deploy
```

### Pipeline Integration

```bash
# Generate CI/CD configuration
deployio pipeline generate --platform github-actions

# Validate pipeline configuration
deployio pipeline validate

# Trigger pipeline manually
deployio pipeline trigger --branch main

# Monitor pipeline status
deployio pipeline status --run 12345
```

## Debugging and Troubleshooting

### Debug Mode

```bash
# Enable debug mode
deployio --debug deploy

# Verbose output
deployio --verbose status

# Save debug information
deployio debug dump --output debug-info.zip

# Check system requirements
deployio doctor

# Test connectivity
deployio ping
```

### Performance Analysis

```bash
# Analyze deployment performance
deployio analyze performance

# Profile CLI performance
deployio --profile deploy

# Network diagnostics
deployio diagnose network

# Resource usage analysis
deployio analyze resources
```

### Error Reporting

```bash
# Report bug
deployio bug report

# View error logs
deployio errors list

# Get error details
deployio errors get error-id-123

# Clear error cache
deployio errors clear
```

## Customization and Extensions

### Plugins

```bash
# List available plugins
deployio plugins list

# Install plugin
deployio plugins install @deployio/terraform-plugin

# Update plugins
deployio plugins update

# Create custom plugin
deployio plugins create my-custom-plugin

# Plugin configuration
deployio plugins config my-plugin --key api-key --value secret
```

### Aliases and Shortcuts

```bash
# Create command alias
deployio alias create dp "deploy --env production"

# List aliases
deployio alias list

# Use alias
deployio dp

# Remove alias
deployio alias remove dp

# Export aliases for sharing
deployio alias export > aliases.json
```

### Custom Commands

```bash
# Create custom command
deployio custom create backup "db backup && files sync"

# List custom commands
deployio custom list

# Execute custom command
deployio custom backup

# Edit custom command
deployio custom edit backup
```

## Integration Examples

### GitHub Actions

```yaml
name: Deploy with Deployio CLI

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Deployio CLI
        run: npm install -g @deployio/cli

      - name: Authenticate
        run: deployio auth login --token ${{ secrets.DEPLOYIO_TOKEN }}

      - name: Deploy
        run: deployio deploy --env production
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  image: node:18
  before_script:
    - npm install -g @deployio/cli
    - deployio auth login --token $DEPLOYIO_TOKEN
  script:
    - deployio deploy --env production
  only:
    - main
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
                sh 'npm install -g @deployio/cli'
                sh 'deployio auth login --token $DEPLOYIO_TOKEN'
                sh 'deployio deploy --env production'
            }
        }
    }
}
```

### Docker Integration

```dockerfile
# Multi-stage build with CLI
FROM node:18 AS builder
RUN npm install -g @deployio/cli
COPY . .
RUN deployio build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

## CLI Reference

### Global Flags

```bash
--config, -c        Specify config file path
--debug, -d         Enable debug mode
--verbose, -v       Verbose output
--quiet, -q         Suppress output
--yes, -y           Auto-confirm prompts
--format, -f        Output format (json, yaml, table)
--profile           Profile performance
--timeout           Set operation timeout
```

### Environment Variables

```bash
DEPLOYIO_API_TOKEN     # API authentication token
DEPLOYIO_CONFIG_FILE   # Custom config file path
DEPLOYIO_DEFAULT_ENV   # Default environment
DEPLOYIO_REGION        # Default region
DEPLOYIO_DEBUG         # Enable debug mode
DEPLOYIO_TIMEOUT       # Default timeout
```

### Exit Codes

```bash
0   # Success
1   # General error
2   # Authentication error
3   # Configuration error
4   # Network error
5   # Permission error
10  # Deployment failed
11  # Rollback required
```

## Performance Tips

### Speed Optimization

```bash
# Use parallel operations
deployio deploy --parallel

# Cache dependencies
deployio config set cache.enabled true

# Reduce output verbosity
deployio --quiet deploy

# Use incremental deployments
deployio deploy --incremental
```

### Resource Management

```bash
# Limit memory usage
deployio --memory-limit 512MB deploy

# Set concurrency limits
deployio config set concurrency.max 5

# Enable compression
deployio config set compression.enabled true
```

## Best Practices

1. **Version Pinning**: Pin CLI version in CI/CD
2. **Token Security**: Use environment variables for tokens
3. **Error Handling**: Always check exit codes in scripts
4. **Configuration Management**: Keep configurations in version control
5. **Regular Updates**: Keep CLI updated for latest features
6. **Automation**: Use CLI in automated workflows
7. **Monitoring**: Monitor CLI usage and performance

## Troubleshooting

### Common Issues

1. **Authentication Failures**

   ```bash
   # Clear auth cache
   deployio auth clear

   # Re-authenticate
   deployio auth login
   ```

2. **Network Connectivity**

   ```bash
   # Test connectivity
   deployio ping

   # Check proxy settings
   deployio config get proxy
   ```

3. **Permission Errors**

   ```bash
   # Check user permissions
   deployio auth whoami

   # Verify project access
   deployio projects access
   ```

## Support and Resources

- **Documentation**: [cli.deployio.com](https://cli.deployio.com)
- **GitHub**: [github.com/deployio/cli](https://github.com/deployio/cli)
- **Issues**: Report bugs and feature requests
- **Discord**: Join our developer community
- **Support**: cli-support@deployio.com

## Next Steps

- [Explore the SDK](./sdk.md)
- [Download Desktop App](./desktop-app.md)
- [Learn about API integration](../api/authentication.md)
- [Set up CI/CD automation](../guides/ci-cd-setup.md)

Master your deployment workflow with the powerful Deployio CLI! 🚀
