# DeployIO Agent - Subdomain Management System

Complete MERN stack deployment automation with dynamic subdomain routing and beautiful landing pages.

## 🎯 Features

- **Dynamic Subdomain Routing** - Automatic subdomain management with Traefik
- **Beautiful Landing Pages** - Professional "coming soon" pages for unassigned subdomains
- **Container Management** - Full MERN app lifecycle management
- **SSL Automation** - Automatic SSL certificates via Let's Encrypt
- **Resource Management** - Container limits and monitoring
- **MongoDB Atlas Integration** - Cloud database for scalable app deployments

## 🏗️ Architecture

```
*.deployio.tech
├── agent.deployio.tech     → DeployIO Agent API
├── app.deployio.tech       → App Management Interface
├── traefik.deployio.tech   → Traefik Dashboard
└── [user-app].deployio.tech → User Applications or Landing Page
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Clone and navigate to agent directory
cd deployio-agent

# Run setup script
./setup.sh

# Edit environment configuration
cp .env.example .env
nano .env  # Configure your settings
```

### 2. Configure Environment Variables

Key variables in `.env`:

```bash
# Domain Configuration
BASE_DOMAIN=deployio.tech
WILDCARD_SSL_ENABLED=true

# Security
AGENT_SECRET=your-secure-secret-here

# Database (MongoDB Atlas)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/deployio_agent?retryWrites=true&w=majority
MONGODB_DATABASE=deployio_agent

# ECR Configuration
AWS_REGION=us-east-1
ECR_REGISTRY_URL=your-account.dkr.ecr.us-east-1.amazonaws.com

# Platform Communication
PLATFORM_URL=https://deployio.tech
PLATFORM_API_KEY=your-platform-api-key
```

### 3. Setup MongoDB Atlas

1. **Create MongoDB Atlas Account**

   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster (free tier available)

2. **Configure Database Access**

   - Create a database user with read/write permissions
   - Add your IP address to the IP whitelist (or use 0.0.0.0/0 for development)

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string and update your `.env` file

```bash
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/deployio_agent?retryWrites=true&w=majority
```

### 4. Deploy the System

#### Local Development:

```bash
# Build and start locally
./deploy.sh

# Or manually:
docker-compose up --build -d
```

#### Production Deployment:

```bash
# 1. Build and push to ECR
./build-push-ecr.sh

# 2. Deploy from ECR
export ECR_IMAGE=your-account.dkr.ecr.region.amazonaws.com/deployio-agent:latest
./deploy.sh

# Or on EC2:
ECR_IMAGE=your-ecr-image docker-compose up -d
```

# Check status

docker-compose ps

# View logs

docker-compose logs -f

```

## 🌐 Subdomain System

### Reserved Subdomains

- `agent.deployio.tech` - Agent API endpoints
- `app.deployio.tech` - App management interface
- `traefik.deployio.tech` - Traefik dashboard

### Dynamic User Subdomains

- **Unassigned**: Shows beautiful landing page with redirect to platform
- **Deployed Apps**: Routes to user's MERN application containers
- **SSL**: Automatic HTTPS certificates for all subdomains

## 📡 API Endpoints

### Health Check

```

GET /agent/v1/health

```

### Deployment Management

```

POST /agent/v1/deployments # Create deployment
GET /agent/v1/deployments # List deployments
GET /agent/v1/deployments/{id} # Get deployment
POST /agent/v1/deployments/{id}/start # Start deployment
POST /agent/v1/deployments/{id}/stop # Stop deployment
POST /agent/v1/deployments/{id}/restart # Restart deployment
DELETE /agent/v1/deployments/{id} # Delete deployment
GET /agent/v1/deployments/{id}/logs # Get logs
GET /agent/v1/deployments/{id}/status # Get status

```

### Subdomain Management

```

GET /agent/v1/deployments/subdomains/available/{subdomain}
GET /agent/v1/deployments/subdomains/routes

````

## 🎨 Landing Page Features

The default landing page includes:

- **Responsive Design** - Works on all devices
- **Neural Network Animation** - Interactive background
- **Typing Animation** - Dynamic status messages
- **DeployIO Branding** - Consistent with platform design
- **Call-to-Action** - Directs users to main platform

## 🔧 Configuration Files

### Traefik Configuration

- `traefik/traefik.yml` - Main Traefik configuration
- `traefik/dynamic.yml` - Dynamic routing rules

### Docker Configuration

- `docker-compose.yml` - Complete service orchestration
- `Dockerfile` - Agent container image
- `landing-page/Dockerfile` - Landing page container

## 🚦 Deployment Flow

1. **Platform Request** - Main platform sends deployment request
2. **Image Pull** - Agent pulls containers from ECR
3. **Container Deploy** - Creates isolated containers with resource limits
4. **Database Setup** - Provisions MongoDB database for app
5. **Route Creation** - Updates Traefik routing to new subdomain
6. **SSL Certificate** - Automatic HTTPS certificate generation
7. **Health Check** - Monitors application health

## 📊 Monitoring

### Container Health

- Automatic health checks for all containers
- Resource usage monitoring
- Log aggregation and storage

### Deployment Statistics

- Success/failure rates
- Resource utilization
- Performance metrics

## 🔒 Security

- **Container Isolation** - Each app runs in isolated containers
- **Resource Limits** - CPU/memory limits enforced
- **SSL Encryption** - All traffic encrypted via HTTPS
- **Authentication** - API key protection for agent endpoints

## 🛠️ Development

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Start services
uvicorn main:app --reload --host 0.0.0.0 --port 8000
````

### Testing

```bash
# Test deployment endpoint
curl -X POST https://agent.deployio.tech/agent/v1/deployments \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret: your-secret" \
  -d '{
    "project_id": "test-project",
    "subdomain": "my-test-app",
    "images": {
      "frontend": "your-ecr-url/frontend:latest",
      "backend": "your-ecr-url/backend:latest"
    }
  }'
```

## 📝 Logs

### Application Logs

```bash
# Agent logs
docker-compose logs deployio-agent

# Landing page logs
docker-compose logs landing-page

# Traefik logs
docker-compose logs traefik
```

### Deployment Logs

```bash
# Get logs for specific deployment
curl https://agent.deployio.tech/agent/v1/deployments/{deployment-id}/logs
```

## 🔄 Maintenance

### Cleanup Old Deployments

```bash
# Automated cleanup runs daily
# Manual cleanup via API
DELETE /agent/v1/deployments/{deployment-id}
```

### SSL Certificate Renewal

- Automatic renewal via Let's Encrypt
- Certificates stored in `letsencrypt/acme.json`

## 📋 Troubleshooting

### Common Issues

1. **Subdomain not resolving**

   - Check DNS configuration
   - Verify Traefik routing rules

2. **SSL certificate issues**

   - Check Let's Encrypt rate limits
   - Verify domain ownership

3. **Container deployment fails**
   - Check ECR permissions
   - Verify Docker network connectivity

### Debug Commands

```bash
# Check container status
docker ps -a

# Check network connectivity
docker network inspect deployio-network

# View Traefik configuration
curl http://traefik.deployio.tech:8080/api/rawdata
```

## 🏗️ MongoDB Atlas Migration

This system has been optimized to use **MongoDB Atlas** as the cloud database provider, removing the need for local MongoDB containers and improving scalability for EC2 deployments.

### Key Benefits

- **Cloud-native**: No local database containers to manage
- **Scalable**: Automatic scaling with MongoDB Atlas
- **Secure**: Built-in security features and encryption
- **Per-app databases**: Each deployed application gets its own database instance
- **EC2 optimized**: Reduced local resource usage

### Database Architecture

```
MongoDB Atlas Cluster
├── deployio_agent (Agent metadata)
├── app_user1_project1 (User app database)
├── app_user1_project2 (User app database)
└── app_user2_project1 (User app database)
```

### Connection Management

- **Agent Database**: Uses main `DATABASE_URL` for agent operations
- **App Databases**: Each deployment gets a unique database name
- **Automatic Provisioning**: Database names generated per user/project
- **Environment Injection**: Apps receive `DATABASE_URL` and `MONGODB_URI` environment variables

### Testing Atlas Integration

```bash
# Test the Atlas connection
./test-atlas.sh

# Check service health with database status
curl http://localhost:8000/agent/v1/health/detailed
```

## 📡 API Endpoints

### Health Check

```
GET /agent/v1/health
```

### Deployment Management

```
POST   /agent/v1/deployments              # Create deployment
GET    /agent/v1/deployments              # List deployments
GET    /agent/v1/deployments/{id}         # Get deployment
POST   /agent/v1/deployments/{id}/start   # Start deployment
POST   /agent/v1/deployments/{id}/stop    # Stop deployment
POST   /agent/v1/deployments/{id}/restart # Restart deployment
DELETE /agent/v1/deployments/{id}         # Delete deployment
GET    /agent/v1/deployments/{id}/logs    # Get logs
GET    /agent/v1/deployments/{id}/status  # Get status
```

### Subdomain Management

```
GET /agent/v1/deployments/subdomains/available/{subdomain}
GET /agent/v1/deployments/subdomains/routes
```

## 🎨 Landing Page Features

The default landing page includes:

- **Responsive Design** - Works on all devices
- **Neural Network Animation** - Interactive background
- **Typing Animation** - Dynamic status messages
- **DeployIO Branding** - Consistent with platform design
- **Call-to-Action** - Directs users to main platform

## 🔧 Configuration Files

### Traefik Configuration

- `traefik/traefik.yml` - Main Traefik configuration
- `traefik/dynamic.yml` - Dynamic routing rules

### Docker Configuration

- `docker-compose.yml` - Complete service orchestration
- `Dockerfile` - Agent container image
- `landing-page/Dockerfile` - Landing page container

## 🚦 Deployment Flow

1. **Platform Request** - Main platform sends deployment request
2. **Image Pull** - Agent pulls containers from ECR
3. **Container Deploy** - Creates isolated containers with resource limits
4. **Database Setup** - Provisions MongoDB database for app
5. **Route Creation** - Updates Traefik routing to new subdomain
6. **SSL Certificate** - Automatic HTTPS certificate generation
7. **Health Check** - Monitors application health

## 📊 Monitoring

### Container Health

- Automatic health checks for all containers
- Resource usage monitoring
- Log aggregation and storage

### Deployment Statistics

- Success/failure rates
- Resource utilization
- Performance metrics

## 🔒 Security

- **Container Isolation** - Each app runs in isolated containers
- **Resource Limits** - CPU/memory limits enforced
- **SSL Encryption** - All traffic encrypted via HTTPS
- **Authentication** - API key protection for agent endpoints

## 🛠️ Development

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Start services
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing

```bash
# Test deployment endpoint
curl -X POST https://agent.deployio.tech/agent/v1/deployments \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret: your-secret" \
  -d '{
    "project_id": "test-project",
    "subdomain": "my-test-app",
    "images": {
      "frontend": "your-ecr-url/frontend:latest",
      "backend": "your-ecr-url/backend:latest"
    }
  }'
```

## 📝 Logs

### Application Logs

```bash
# Agent logs
docker-compose logs deployio-agent

# Landing page logs
docker-compose logs landing-page

# Traefik logs
docker-compose logs traefik
```

### Deployment Logs

```bash
# Get logs for specific deployment
curl https://agent.deployio.tech/agent/v1/deployments/{deployment-id}/logs
```

## 🔄 Maintenance

### Cleanup Old Deployments

```bash
# Automated cleanup runs daily
# Manual cleanup via API
DELETE /agent/v1/deployments/{deployment-id}
```

### SSL Certificate Renewal

- Automatic renewal via Let's Encrypt
- Certificates stored in `letsencrypt/acme.json`

## 📋 Troubleshooting

### Common Issues

1. **Subdomain not resolving**

   - Check DNS configuration
   - Verify Traefik routing rules

2. **SSL certificate issues**

   - Check Let's Encrypt rate limits
   - Verify domain ownership

3. **Container deployment fails**
   - Check ECR permissions
   - Verify Docker network connectivity

### Debug Commands

```bash
# Check container status
docker ps -a

# Check network connectivity
docker network inspect deployio-network

# View Traefik configuration
curl http://traefik.deployio.tech:8080/api/rawdata
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the DeployIO Platform**
