# 🚀 CI/CD Pipeline - Complete Guide

## Overview

DeployIO uses a comprehensive 5-stage CI/CD pipeline that automatically tests, builds, and deploys your application to EC2 using Traefik reverse proxy.

## 🔄 Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Code Quality  │ -> │ Security Scan   │ -> │     Testing     │
│   & Linting     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                |
┌─────────────────┐    ┌─────────────────┐
│   Deployment    │ <- │ Docker Building │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
```

## 📋 Pipeline Stages

### **Stage 1: Code Quality & Linting**

- **JavaScript/React**: ESLint validation
- **Python**: Pylint and Black formatting
- **Dependencies**: Audit and security check

### **Stage 2: Security Scanning**

- **Frontend/Backend**: npm audit (moderate+ vulnerabilities)
- **FastAPI**: Bandit security scanner
- **Docker**: Image vulnerability scanning

### **Stage 3: Testing Suite**

- **Backend**: Express API tests with MongoDB
- **FastAPI**: pytest with coverage reporting
- **Frontend**: React component tests

### **Stage 4: Docker Building**

- **Multi-stage builds** for optimization
- **GitHub Actions cache** for faster builds
- **Images**: frontend, backend, fastapi

### **Stage 5: Production Deployment**

- **Target**: EC2 instance via SSH
- **Process**:
  1. Backup current deployment
  2. Pull latest code
  3. Deploy with docker-compose
  4. Health check verification
  5. Automatic rollback on failure

## ⚙️ Setup Requirements

### **GitHub Secrets**

Add to your repository: `Settings > Secrets and variables > Actions`

```bash
SSH_PRIVATE_KEY    # Your EC2 private key (complete key including headers)
```

### **EC2 Prerequisites**

- Docker and Docker Compose installed
- Your repository cloned to `/opt/deployio`
- Traefik configured for ports 80/443
- Domain pointing to your EC2 instance

## 🚀 Deployment Process

### **Automatic Deployment**

```bash
git add .
git commit -m "Deploy updates"
git push origin main  # Triggers full pipeline
```

### **Manual Deployment**

```bash
# Use the deployment script
./scripts/deploy-production.sh

# Or deploy manually
npm run deploy
```

## 📊 Health Monitoring

### **Endpoints Monitored**

- **Backend API**: `http://localhost:3000/api/v1/health`
- **FastAPI**: `http://localhost:8000/health`
- **Frontend**: Available via Traefik on port 80/443

### **Health Dashboard**

- **Public URL**: `https://deployio.tech/health`
- **Monitors**: All services, database, API response times

## 🛠️ Workflow Files

### **Main Pipeline**

`.github/workflows/deploy.yml` - Complete CI/CD pipeline

### **Security Scanning**

`.github/workflows/security.yml` - Automated vulnerability scanning

### **Pull Request Checks**

`.github/workflows/pr-check.yml` - PR validation and testing

## 🔧 Available Scripts

### **Development**

```bash
npm run dev          # Start all services locally
npm run health       # Check health endpoints
npm run health:full  # Complete verification
```

### **Production Management**

```bash
./scripts/deploy-production.sh    # Deploy to production
./scripts/backup-production.sh    # Backup data
./scripts/verify-cicd.sh          # Verify setup
./scripts/security-check.sh       # Security scan
```

## 🛡️ Security Features

- **Automated vulnerability scanning** in CI/CD
- **Docker security** best practices
- **HTTPS/SSL** via Traefik + Let's Encrypt
- **Rate limiting** and security headers
- **Secret management** via GitHub secrets

## 📈 Monitoring & Alerts

### **Pipeline Status**

- **GitHub Actions** dashboard shows real-time status
- **Badges** in README show current pipeline state
- **Email notifications** on deployment success/failure

### **Application Monitoring**

- **Health checks** after every deployment
- **Automatic rollback** if health checks fail
- **Performance monitoring** via health endpoints

## 🆘 Troubleshooting

### **Common Issues**

| Problem              | Solution                                  |
| -------------------- | ----------------------------------------- |
| SSH connection fails | Verify `SSH_PRIVATE_KEY` secret format    |
| Health checks fail   | Check service logs: `docker-compose logs` |
| Pipeline fails       | Review GitHub Actions logs for details    |
| Deployment timeout   | Increase timeout in workflow file         |

### **Debug Commands**

```bash
# On EC2 instance
cd /opt/deployio
docker-compose ps                    # Check services
docker-compose logs backend         # Backend logs
docker-compose logs fastapi         # FastAPI logs
docker-compose logs traefik         # Proxy logs

# Local verification
./scripts/verify-cicd.sh            # Complete setup check
./scripts/test-deployment.sh        # Deployment readiness
```

## 🎯 Best Practices

### **Development Workflow**

1. **Feature branches** for new development
2. **Pull requests** trigger automated testing
3. **Main branch** triggers production deployment
4. **Tag releases** for version tracking

### **Security**

- **Never commit secrets** to the repository
- **Use environment variables** for configuration
- **Regular dependency updates** via automated scanning
- **Security patches** applied automatically

### **Performance**

- **Docker layer caching** for faster builds
- **Optimized images** with multi-stage builds
- **Health checks** ensure reliable deployments
- **Automatic rollback** prevents downtime

---

## 🎉 Ready to Deploy!

Your CI/CD pipeline is production-ready. Simply push to main branch and watch your application deploy automatically with full testing, security scanning, and health verification.

**Next Steps:**

1. Add `SSH_PRIVATE_KEY` to GitHub secrets
2. Push to main branch
3. Monitor deployment in GitHub Actions
4. Verify at https://deployio.tech
