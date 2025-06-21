# DeployIO Express Backend Server

The Express backend server for DeployIO platform, implementing a modular architecture with comprehensive API endpoints for project management, deployment coordination, and AI service integration.

## 🏗️ Architecture Overview

This server follows a clean modular architecture pattern:

```
server/
├── config/                 # Configuration management
│   ├── cors.js            # CORS configuration
│   ├── database.js        # MongoDB connection
│   ├── redis.js          # Redis client
│   └── logger.js         # Winston logging
├── controllers/           # API controllers (modular)
│   ├── ai/               # AI service controllers
│   ├── deployment/       # Deployment controllers
│   ├── project/          # Project controllers
│   ├── authController.js # Authentication (legacy)
│   ├── userController.js # User management (legacy)
│   └── adminController.js # Admin operations (legacy)
├── middleware/           # Express middleware
│   ├── authMiddleware.js # JWT authentication
│   ├── rateLimiter.js   # Rate limiting
│   └── errorHandler.js  # Error handling
├── models/              # Mongoose database models
│   ├── User.js         # User model
│   ├── Project.js      # Project model
│   └── Deployment.js   # Deployment model
├── routes/             # API routing (versioned)
│   ├── api/v1/        # Version 1 API routes
│   ├── webhooks/      # Webhook handlers
│   ├── health/        # Health monitoring
│   └── index.js       # Main router
├── services/          # Business logic services
│   ├── ai/           # AI service integration
│   ├── deployment/   # Deployment services
│   ├── project/      # Project services
│   └── user/         # User services
└── utils/            # Utility functions
```

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/deployio
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_URL=http://localhost:9000
```

### Docker

```bash
# Build server image
docker build -t deployio-server .

# Run server container
docker run -p 3000:3000 --env-file .env deployio-server
```

## 🔗 API Endpoints

### API v1 Routes

All new endpoints are versioned under `/api/v1/`:

```
GET    /api/v1/health                    # Health check
POST   /api/v1/ai/analysis/repository    # Analyze repository
POST   /api/v1/ai/generation/dockerfile  # Generate Dockerfile
GET    /api/v1/projects                  # List projects
POST   /api/v1/deployments               # Create deployment
GET    /api/v1/users/profile             # User profile
```

### Legacy Routes (maintained for compatibility)

```
POST   /auth/login                       # User login
GET    /user/profile                     # User profile
GET    /admin/dashboard                  # Admin dashboard
POST   /projects                         # Create project
```

### Webhook Routes

```
POST   /webhooks/github                  # GitHub webhooks
POST   /webhooks/deployment              # Deployment status updates
```

### Health & Monitoring

```
GET    /health                           # Basic health check
GET    /health/metrics                   # Application metrics
GET    /health/metrics/prometheus        # Prometheus metrics
```

## 🔒 Authentication

The server supports multiple authentication methods:

- **JWT Tokens**: Primary authentication method
- **OAuth**: GitHub and Google OAuth integration
- **2FA**: Two-factor authentication with TOTP
- **Internal Service Auth**: For service-to-service communication

## 🛠️ Services Architecture

### AI Service Integration

The server integrates with the AI service for:

- Repository analysis and stack detection
- Configuration file generation (Dockerfile, docker-compose.yml)
- Performance and security optimization recommendations

### Deployment Service

Coordinates with the deployment agent for:

- Container deployment and management
- Log streaming and monitoring
- Health checks and auto-scaling

### Project Management

Handles:

- GitHub repository integration
- Project configuration and settings
- Environment variable management
- Collaboration and sharing

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple transports
- **Health Checks**: Comprehensive health monitoring endpoints
- **Metrics**: Application performance metrics
- **Error Tracking**: Centralized error handling and reporting

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run prod
```

### Docker Production

```bash
# Build production image
docker build -t deployio-server:prod .

# Run with production configuration
docker run -p 3000:3000 --env-file .env.production deployio-server:prod
```

## 🔧 Configuration

The server uses environment-based configuration:

- **Development**: `.env`
- **Production**: `.env.production`
- **Docker**: Environment variables in containers

Key configuration areas:

- Database connections (MongoDB, Redis)
- External service URLs (AI service, deployment agent)
- Authentication secrets and tokens
- Rate limiting and security settings

## 🤝 Contributing

1. Follow the modular architecture pattern
2. Add new endpoints under `/api/v1/`
3. Implement proper error handling
4. Add comprehensive logging
5. Write tests for new functionality
6. Update documentation

## 📚 API Documentation

Full API documentation is available at `/api/docs` when running the server.

## 🔗 Related

- [AI Service Documentation](../ai-service/README.md)
- [Deployment Agent Documentation](../agent/README.md)
- [Frontend Documentation](../client/README.md)
- [Platform Documentation](../README.md)
