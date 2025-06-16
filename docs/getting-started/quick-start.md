# Quick Start Guide

Welcome to Deployio! This guide will help you deploy your first application in just a few minutes.

## Prerequisites

- GitHub account
- A repository with your application code
- Basic understanding of your application's deployment requirements

## Step 1: Sign Up and Connect GitHub

1. Visit [Deployio.tech](https://deployio.tech) and create your account
2. Navigate to your dashboard
3. Click "Connect GitHub" to authorize Deployio to access your repositories
4. Select the repositories you want to deploy

## Step 2: Create Your First Project

### Using the Web Interface

1. Click "New Project" in your dashboard
2. Select your repository from the list
3. Choose your deployment target (AWS, GCP, Azure, or Docker)
4. Configure environment variables
5. Click "Deploy"

### Using the CLI (Optional)

```bash
# Install Deployio CLI
npm install -g @deployio/cli

# Login to your account
deployio login

# Create a new project
deployio create my-app --repo username/repository
```

## Step 3: Watch the Magic Happen

Deployio's AI will:

- Analyze your code structure
- Detect the framework and dependencies
- Generate optimized Dockerfile and CI/CD pipelines
- Set up monitoring and logging
- Deploy your application

## Step 4: Monitor Your Deployment

Once deployed, you can:

- View real-time logs
- Monitor application performance
- Set up alerts and notifications
- Scale your application as needed

## Next Steps

- [Configure Custom Domains](../guides/custom-domains.md)
- [Set Up Environment Variables](../guides/environment-variables.md)
- [Configure Monitoring](../guides/monitoring.md)
- [Learn about Scaling](../guides/scaling.md)

## Need Help?

- Check our [FAQ](../guides/faq.md)
- Join our [Discord Community](https://discord.gg/deployio)
- Contact support at support@deployio.tech
