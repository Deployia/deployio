# DeployIO Agent

The DeployIO Agent is a FastAPI-based microservice responsible for container deployment management. It runs on the target EC2 instance and handles:

- Container deployment and management
- Traefik routing configuration
- MongoDB data storage
- Subdomain wildcard routing
- AWS ECR integration

## Architecture

The agent follows a modular FastAPI structure similar to the AI service:

```
deployio-agent/
├── config/           # App configuration and settings
├── middleware/       # Authentication and error handling
├── routes/          # API endpoints and wildcard routing
├── services/        # Business logic (future)
├── models/          # Data models (future)
├── main.py          # FastAPI application entry point
├── requirements.txt # Python dependencies
├── Dockerfile       # Container build instructions
└── docker-compose.yml # Multi-service orchestration
```

## Features

### Authentication

- Header-based authentication with `X-Agent-Secret`
- Public health endpoint for monitoring
- Protected API endpoints for platform communication

### Endpoints

#### Public Endpoints

- `GET /health` - Public health check (no auth required)
- `GET /` - DeployIO themed homepage
- `GET /{path:path}` - Wildcard subdomain routing for deployed apps

#### Protected API Endpoints (require authentication)

- `GET /agent/v1/health` - Detailed health status
- `GET /agent/v1/status` - Agent and services status
- `POST /agent/v1/deployments` - Create deployment
- `GET /agent/v1/deployments` - List deployments
- `GET /agent/v1/deployments/{id}` - Get deployment details
- `DELETE /agent/v1/deployments/{id}` - Delete deployment

## Setup & Development

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- MongoDB (via container)
- Traefik (via container)

### Installation

1. **Clone and navigate to agent directory:**

   ```bash
   cd deployio-agent
   ```

2. **Create environment file:**

   ```bash
   # For local development
   cp .env.example .env
   # Edit .env with your local configuration

   # For production deployment
   cp .env.example .env.production
   # Edit .env.production with your production configuration
   ```

3. **Install Python dependencies (for local development):**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run with Docker Compose:**

   ```bash
   # For local development (uses .env)
   docker-compose up -d

   # For production (uses .env.production)
   docker-compose -f docker-compose.yml up -d
   ```

5. **Or run locally for development:**
   ```bash
   python main.py
   ```

## Configuration

Key environment variables:

### Required

- `AGENT_SECRET` - Secret key for authentication between platform and agent
- `BASE_DOMAIN` - Base domain for subdomain routing (e.g., deployio.dev)

### Optional

- `DEBUG` - Enable debug mode (default: false)
- `MONGODB_URL` - MongoDB connection string
- `AWS_REGION` - AWS region for ECR (default: us-east-1)
- `MAX_CONCURRENT_DEPLOYMENTS` - Deployment concurrency limit (default: 5)

## Services

The agent orchestrates three main services:

### 1. MongoDB

- Stores deployment metadata
- Stores application configurations
- Stores routing information

### 2. Traefik

- Reverse proxy and load balancer
- Automatic SSL certificate management
- Wildcard subdomain routing
- Health checks and service discovery

### 3. DeployIO Agent

- FastAPI application
- Container management via Docker API
- Deployment orchestration
- Platform integration

## Network Architecture

```
Internet
    ↓
Traefik (Port 80/443)
    ↓
┌─────────────────┬─────────────────┐
│  Subdomain      │   Target        │
├─────────────────┼─────────────────┤
│ *.deployio.dev  → DeployIO Agent  │
│ app1.deployio.dev → App Container │
│ app2.deployio.dev → App Container │
└─────────────────┴─────────────────┘
```

## Deployment Workflow

1. Platform sends deployment request to agent via authenticated API
2. Agent pulls code from GitHub repository
3. Agent builds Docker container
4. Agent pushes container to ECR (if configured)
5. Agent deploys container with Traefik labels
6. Traefik automatically configures routing
7. Agent updates deployment status in MongoDB

## Health Monitoring

The agent provides comprehensive health checks:

- **Public health endpoint** (`/health`) - Basic service status
- **Detailed health endpoint** (`/agent/v1/health`) - Service connectivity
- **Docker health checks** - Container-level monitoring
- **Traefik health checks** - Proxy service monitoring

## Security

- Header-based authentication for platform communication
- Non-root container execution
- Read-only Docker socket access
- Network isolation via Docker networks
- Environment-based secret management

## Future Enhancements

- MongoDB service connection and health checks
- Docker service integration and container management
- Traefik dynamic configuration management
- AWS ECR integration for container registry
- Real-time deployment status streaming
- Resource usage monitoring and alerting
- Automated scaling and load balancing
