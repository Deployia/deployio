# Deployio Platform Deployment Guide

This guide covers the deployment and infrastructure setup for the Deployio platform itself, not for user applications deployed through the platform.

## 🚀 Platform Deployment Pipeline

### Automatic Deployment (Recommended)

The platform auto-deploys when you push to the `main` branch:

```bash
git add .
git commit -m "Deploy platform updates"
git push origin main
```

### GitHub Actions Pipeline

The platform runs a 5-stage deployment pipeline:

1. **✅ Code Quality & Linting**: ESLint, Prettier, Python formatting
2. **✅ Security Vulnerability Scanning**: npm audit, safety, bandit
3. **✅ Testing**: Frontend tests, Backend tests, AI service tests
4. **✅ Docker Image Building**: Multi-stage builds with caching
5. **✅ Production Deployment**: Zero-downtime deployment to EC2

## 🏗️ Infrastructure Architecture

### Production Setup

- **Load Balancer**: Traefik with automatic SSL certificates
- **Web Server**: React SPA served via Nginx
- **API Gateway**: Node.js/Express backend
- **AI Processing**: FastAPI Python service
- **Database**: MongoDB with replica set
- **Monitoring**: Health checks and metrics collection

### Container Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  AI Service     │
│   (React/Nginx) │    │   (Node.js)     │    │   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (MongoDB)     │
                    └─────────────────┘
```

## 🐳 Container Configuration

### Frontend Container (Nginx)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

### Backend Container (Node.js)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### AI Service Container (Python)

```dockerfile
FROM python:3.12-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Database
MONGO_URI=mongodb://localhost:27017/deployio
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_password

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email Service
EMAIL_USER=your_email@domain.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@deployio.tech

# AI Service
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000

# Platform Configuration
NODE_ENV=production
FRONTEND_URL=https://deployio.tech
BACKEND_URL=https://deployio.tech/api
FASTAPI_URL=https://deployio.tech/ai

# Security
CORS_ORIGIN=https://deployio.tech
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 🔧 Development Scripts

### Platform Management

```bash
# Development
npm run dev          # Start all services locally
npm run dev:frontend # Frontend only
npm run dev:backend  # Backend only
npm run dev:ai       # AI service only

# Testing
npm run test         # Run all tests
npm run test:frontend # Frontend tests
npm run test:backend # Backend tests
npm run test:ai      # AI service tests

# Production
npm run build        # Build all services
npm run start        # Start production build
npm run health       # Check all service health
```

### Deployment Scripts

```bash
# Manual deployment
./scripts/deploy-production.sh

# Backup before deployment
./scripts/backup-production.sh

# Security scanning
./scripts/security-check.sh

# Deployment verification
./scripts/test-deployment.sh

# Complete setup verification
./scripts/verify-cicd.sh
```

## 🛡️ Security Configuration

### SSL/TLS Setup

- Automatic certificate generation via Let's Encrypt
- HTTPS redirect for all traffic
- HSTS headers enabled
- Secure cookie configuration

### Container Security

- Non-root user execution
- Read-only root filesystem
- Minimal base images (Alpine Linux)
- Security scanning in CI/CD

### Network Security

- Private container networking
- Firewall rules (ports 80, 443 only)
- Rate limiting on API endpoints
- CORS configuration

## 📊 Monitoring & Health Checks

### Health Endpoints

- **Platform Health**: `/health`
- **Backend API**: `/api/v1/health`
- **AI Service**: `/ai/health`
- **Database**: Included in backend health check

### Monitoring Stack

- **Application Logs**: Centralized logging
- **Performance Metrics**: Response times, resource usage
- **Error Tracking**: Comprehensive error logging
- **Uptime Monitoring**: External health checks

### Health Check Script

```bash
#!/bin/bash
# Platform health verification

echo "Checking Deployio Platform Health..."

# Backend API
if curl -f https://deployio.tech/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend API: Healthy"
else
    echo "❌ Backend API: Unhealthy"
fi

# AI Service
if curl -f https://deployio.tech/ai/health > /dev/null 2>&1; then
    echo "✅ AI Service: Healthy"
else
    echo "❌ AI Service: Unhealthy"
fi

# Frontend
if curl -f https://deployio.tech > /dev/null 2>&1; then
    echo "✅ Frontend: Healthy"
else
    echo "❌ Frontend: Unhealthy"
fi
```

## 🚨 Troubleshooting

### Common Deployment Issues

| Problem                   | Solution                                 |
| ------------------------- | ---------------------------------------- |
| Container build fails     | Check Dockerfile syntax and dependencies |
| Database connection error | Verify MongoDB credentials and network   |
| SSL certificate issues    | Check domain DNS and Let's Encrypt logs  |
| AI service timeout        | Verify OpenAI API key and rate limits    |
| High memory usage         | Scale containers or optimize queries     |

### Debugging Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs fastapi

# Check resource usage
docker stats

# Restart specific service
docker-compose restart backend

# Full platform restart
docker-compose down && docker-compose up -d
```

## 📈 Performance Optimization

### Database Optimization

- Connection pooling
- Index optimization
- Query performance monitoring
- Regular backup and maintenance

### Application Optimization

- Docker image layer caching
- Static asset optimization
- API response caching
- Connection keep-alive

### Scaling Considerations

- Horizontal pod autoscaling
- Load balancer configuration
- Database replica sets
- CDN for static assets

---

For user deployment guides (how users deploy their apps through Deployio), see the main README and user documentation.
