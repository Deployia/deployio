# GitHub Actions Status Badges

Add these badges to your README.md to show pipeline status:

## Deployment Status

```markdown
[![CI/CD Pipeline](https://github.com/vasudevshetty/deployio/actions/workflows/deploy.yml/badge.svg)](https://github.com/vasudevshetty/deployio/actions/workflows/deploy.yml)
```

## Individual Workflow Status

```markdown
[![Deploy to Production](https://github.com/vasudevshetty/deployio/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/vasudevshetty/deployio/actions/workflows/deploy.yml)

[![Security Scan](https://github.com/vasudevshetty/deployio/actions/workflows/security.yml/badge.svg)](https://github.com/vasudevshetty/deployio/actions/workflows/security.yml)

[![PR Checks](https://github.com/vasudevshetty/deployio/actions/workflows/pr-check.yml/badge.svg)](https://github.com/vasudevshetty/deployio/actions/workflows/pr-check.yml)
```

## Example README Section

```markdown
# DeployIO

[![CI/CD Pipeline](https://github.com/vasudevshetty/deployio/actions/workflows/deploy.yml/badge.svg)](https://github.com/vasudevshetty/deployio/actions/workflows/deploy.yml)
[![Security Scan](https://github.com/vasudevshetty/deployio/actions/workflows/security.yml/badge.svg)](https://github.com/vasudevshetty/deployio/actions/workflows/security.yml)

> Automated Deployment Platform with CI/CD Pipeline

## 🚀 Quick Start

1. Clone and install dependencies
2. Configure environment variables
3. Push to main branch for automatic deployment

## 🏗️ Architecture

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **API Service**: FastAPI + Python
- **Database**: MongoDB
- **Proxy**: Traefik (SSL/TLS)
- **Deployment**: Docker Compose on EC2

## 📊 Status

- **Production**: https://deployio.tech
- **Health Dashboard**: https://deployio.tech/health
- **API Status**: https://deployio.tech/api/v1/health
```

Copy the badge markdown above and add it to your README.md file!
