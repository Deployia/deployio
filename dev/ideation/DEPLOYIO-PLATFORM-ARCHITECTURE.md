# DeployIO Platform - Final Architecture Documentation

## System Overview

A MERN stack deployment platform that automatically analyzes GitHub repositories, generates deployment configurations, and deploys applications on isolated subdomains - all within AWS Free Tier constraints.

## Architecture Components

### EC2-1: DeployIO Platform (AWS Account 1)

**Instance**: t2.micro (1 vCPU, 1GB RAM)  
**Domain**: `deployio.tech`

```
Services Stack:
├── React Frontend (Vite) - Port 3000
├── Express.js Backend - Port 5000
├── AI Service (FastAPI) - Port 8000
├── Redis (job queue) - Port 6379
└── Traefik (reverse proxy) - Port 80/443
```

**Database**: MongoDB Atlas (Shared Cluster)

- **Platform Database**: `deployio_platform_metadata`
- **Connectivity**: Via connection string from backend.

**Responsibilities:**

- User authentication via GitHub OAuth
- Repository analysis and code structure recognition
- AI-powered Dockerfile/docker-compose generation
- Trigger GitHub Actions for image building
- Webhook handling for auto-redeployment
- Send deployment requests to Agent

### EC2-2: DeployIO Agent (AWS Account 2)

**Instance**: t2.micro (1 vCPU, 1GB RAM)  
**Domain**: `agent.deployio.tech` + `*.deployio.tech`

```
Services Stack:
├── FastAPI Agent Server - Port 8000
├── Traefik (with wildcard SSL) - Port 80/443
└── Docker Engine
```

**Database**: MongoDB Atlas (Shared Cluster)

- **Multi-Tenant Strategy**: Dynamically provisioned databases and users per deployment.
- **Provisioning**: Managed by the DeployIO Platform via MongoDB Atlas Admin API.
- **Connectivity**: Agent receives credentials for each deployment.

**Responsibilities:**

- Receive deployment callbacks from Platform
- Pull user app images from ECR (Account 2)
- Deploy MERN apps on isolated subdomains
- Manage app lifecycle (start/stop/restart/delete)
- Provide persistent MongoDB instances via Atlas
- Auto-scaling within resource limits

## Deployment Flow

### Phase 1: Repository Analysis

```
1. User authenticates via GitHub OAuth
2. User provides GitHub repo URL
3. Platform clones repo to ephemeral storage
4. AI service analyzes project structure:
   ├── Detect MERN components (package.json, src/, routes/, models/)
   ├── Identify dependencies (react, express, mongoose)
   ├── Check for existing Dockerfile
   └── Analyze folder structure patterns
5. Generate optimized Dockerfile + docker-compose.yml
6. Store analysis results in Platform MongoDB Atlas Database
```

### Phase 2: Image Building (GitHub Actions)

```
1. Platform auto-commits generated files to new branch in user's repo
2. Triggers GitHub Actions workflow via repository dispatch
3. GitHub Actions workflow:
   ├── Checkout user repo + generated files
   ├── Build React frontend (npm run build)
   ├── Build Express backend container
   ├── Create MongoDB init scripts (DEPRECATED)
   └── Push all images to ECR (Account 2)
4. GitHub webhook notifies Platform of completion
5. Platform updates deployment status
```

### Phase 3: Deployment & Database Provisioning

```
1. Platform sends deployment request to Agent API:
   {
     "projectId": "uuid",
     "subdomain": "user-app-name",
     "images": {
       "frontend": "ecr-url/user-app:frontend",
       "backend": "ecr-url/user-app:backend"
     },
     "environment": {...},
     "atlas_credentials": {
        "connection_string": "...",
        "db_user": "...",
        "db_password": "..."
     }
   }
2. **Atlas Provisioning (Platform Side)**:
   - Before calling the agent, the Platform backend uses the MongoDB Atlas Admin API.
   - It creates a new database user with limited permissions.
   - It creates a new database (e.g., `project_id_db`).
   - It grants the new user access to only that database.
3. Agent receives deployment request with Atlas credentials.
4. Agent injects the Atlas connection string into the backend container's environment variables.
5. Agent starts the `docker-compose` stack.
6. Platform updates deployment status and stores the Atlas credentials securely.
```

## Data Management

### Platform MongoDB (EC2-1)

```
Collections:
├── users: {
    githubId, username, email, accessToken,
    createdAt, lastLogin
  }
├── projects: {
    projectId, userId, repoUrl, repoName,
    analysis: { structure, dependencies, dockerfile },
    status, createdAt, updatedAt
  }
├── deployments: {
    deploymentId, projectId, subdomain, status,
    imageUrls, environment, mongoDatabase,
    deployedAt, lastAccessed, logs
  }
└── build_logs: {
    projectId, buildId, status, logs,
    githubActionUrl, duration, createdAt
  }
```

### Agent MongoDB Strategy (EC2-2)

```
Shared MongoDB Approach:
├── One MongoDB container per 5-10 user apps
├── Isolated databases per application
├── Database naming: userapp_{projectId}
├── Automatic cleanup of unused databases (30+ days)
├── Resource monitoring and limits per database
```

## Resource Allocation

### Per User Deployment Limits

- **Memory**: 256MB (frontend) + 256MB (backend) = 512MB total
- **CPU**: 0.25 cores max per application
- **Storage**: 1GB per application (containers + data)
- **MongoDB**: Shared instance, 100MB per app database
- **Network**: Rate limiting per subdomain

### Free Tier Optimization

- **EC2**: t2.micro instances (750 hours/month each)
- **ECR**: 500MB storage (Account 2 only)
- **Data Transfer**: 15GB/month combined
- **GitHub Actions**: 2000 minutes/month
- **Load Balancing**: Traefik (no AWS ALB costs)

## GitHub Integration

### OAuth Scopes Required

```
├── user:email - User identification
├── repo - Repository access (public/private)
├── workflow - Trigger GitHub Actions
└── admin:repo_hook - Webhook management
```

### Webhook Events

```
├── workflow_run - Build completion status
├── push - Auto-redeployment triggers (main branch)
└── repository - Repository changes/deletion
```

### GitHub Actions Template

```yaml
name: DeployIO MERN Build
on:
  repository_dispatch:
    types: [deployio-build]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3
        with:
          ref: deployio-generated

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Build and Push Images
        run: |
          # Build frontend image
          docker build -f Dockerfile.frontend -t $ECR_REGISTRY/deployio-agent:${{ github.event.client_payload.project_id }}-frontend .
          docker push $ECR_REGISTRY/deployio-agent:${{ github.event.client_payload.project_id }}-frontend

          # Build backend image  
          docker build -f Dockerfile.backend -t $ECR_REGISTRY/deployio-agent:${{ github.event.client_payload.project_id }}-backend .
          docker push $ECR_REGISTRY/deployio-agent:${{ github.event.client_payload.project_id }}-backend

      - name: Notify DeployIO Platform
        run: |
          curl -X POST ${{ secrets.DEPLOYIO_WEBHOOK_URL }}/build-complete \
            -H "Content-Type: application/json" \
            -d '{
              "projectId": "${{ github.event.client_payload.project_id }}",
              "status": "success",
              "images": {
                "frontend": "'$ECR_REGISTRY'/deployio-agent:${{ github.event.client_payload.project_id }}-frontend",
                "backend": "'$ECR_REGISTRY'/deployio-agent:${{ github.event.client_payload.project_id }}-backend"
              }
            }'
```

## MERN Structure Detection

### Auto-Detection Criteria

```
Valid MERN Application Requirements:
├── package.json (root or frontend folder)
│   ├── Dependencies: react, react-dom
│   └── Scripts: build, start
├── Backend Structure:
│   ├── package.json with express, mongoose
│   ├── Folders: routes/, models/, controllers/
│   └── Entry point: server.js, app.js, index.js
├── Frontend Structure:
│   ├── src/ folder with components
│   ├── public/ folder with index.html
│   └── React component patterns
└── MongoDB Usage:
    ├── mongoose in dependencies
    └── Model definitions in models/
```

### Fallback Strategy

```
If auto-detection fails:
├── Show detected structure to user
├── Provide manual configuration options
├── Offer common MERN templates
└── Allow custom Dockerfile upload
```

## Security & Isolation

### Network Security

```
├── Docker networks per deployment
├── No inter-app communication
├── Traefik SSL termination (Let's Encrypt)
├── GitHub tokens encrypted in database
└── Environment variables encrypted
```

### Resource Isolation

```
├── Memory limits per container (256MB)
├── CPU quotas enforcement (0.25 cores)
├── Disk space monitoring (1GB max)
├── Process count limits
└── Network rate limiting
```

## Monitoring & Lifecycle

### Health Checks

```
Application Monitoring:
├── HTTP endpoint health checks (/health)
├── Container status monitoring
├── Resource usage tracking (CPU, Memory)
├── Failed deployment cleanup (1 hour timeout)
└── Automatic restart policies
```

### Lifecycle Management

```
Deployment States:
├── pending - Initial request received
├── analyzing - Code analysis in progress
├── building - GitHub Actions running
├── deploying - Container deployment
├── running - Successfully deployed
├── stopped - Manually stopped
├── failed - Deployment/build failed
└── deleted - Cleaned up

Available Actions:
├── start - Start stopped deployment
├── stop - Stop running deployment
├── restart - Restart containers
├── redeploy - Trigger new build
├── delete - Remove completely
└── logs - View application logs
```

### Auto-Cleanup Rules

```
├── Failed builds: Remove after 1 hour
├── Inactive apps: Stop after 7 days no traffic
├── Deleted projects: Cleanup after 24 hours
└── Build artifacts: Keep last 3 builds only
```

## DNS & SSL Configuration

### DNS Records Setup

```
Domain: deployio.tech
├── @ A → EC2-1 IP (Platform)
├── agent A → EC2-2 IP (Agent API)
└── * A → EC2-2 IP (User applications)
```

### Traefik Configuration

```
Platform Traefik (EC2-1):
├── deployio.tech → React Frontend
├── api.deployio.tech → Express Backend
└── ai.deployio.tech → FastAPI Service

Agent Traefik (EC2-2):
├── agent.deployio.tech → Agent API
├── *.deployio.tech → User Applications
├── Automatic SSL via Let's Encrypt
└── Dynamic routing rules
```

## Environment Variables Management

### Platform Environment Variables

```
Required for Platform:
├── GITHUB_CLIENT_ID
├── GITHUB_CLIENT_SECRET
├── MONGODB_URI
├── REDIS_URL
├── AWS_ACCESS_KEY_ID (ECR access)
├── AWS_SECRET_ACCESS_KEY
├── JWT_SECRET
└── AGENT_API_URL
```

### User Application Environment Variables

```
Managed via Platform UI:
├── Custom variables per deployment
├── Database connection strings (auto-generated)
├── API endpoints and secrets
├── Third-party service credentials
└── Feature flags
```

## Implementation Scale

### Initial Testing Phase

```
Limitations:
├── Maximum 4-5 concurrent deployments
├── MERN stack applications only
├── Main branch deployments only
├── Basic monitoring and logging
└── Manual environment variable management

Success Metrics:
├── Successful GitHub OAuth integration
├── Automated MERN detection (80% accuracy)
├── End-to-end deployment (< 10 minutes)
├── Stable subdomain access with SSL
└── Basic lifecycle management
```

## Future Enhancements

### Phase 2 Features

```
├── Preview deployments (PR-based)
├── Custom domain support
├── Advanced monitoring and alerting
├── Horizontal scaling
├── Database seeding support
├── Multi-framework support (Django, Laravel)
└── Team collaboration features
```

### Scaling Considerations

```
├── Kubernetes migration for better orchestration
├── Multi-region deployment
├── CDN integration for static assets
├── Database clustering
├── Load balancing across multiple agents
└── Cost optimization and billing
```

---

## Technical Architecture Summary

This architecture provides a cost-effective, scalable foundation for automated MERN stack deployments while staying within AWS Free Tier limits. The separation of concerns between the Platform (analysis/building) and Agent (deployment/hosting) allows for independent scaling and maintenance.

**Key Benefits:**

- Zero infrastructure costs during development
- Automated end-to-end deployment pipeline
- Isolated user applications with persistent data
- GitHub-native workflow integration
- SSL-enabled subdomains for each deployment
- Resource monitoring and lifecycle management

**Next Steps:** Implementation phases and detailed task breakdown in separate documentation.
