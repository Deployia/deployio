# Deployio AI Coding Agent Instructions

## Architecture Overview

Deployio is an AI-powered DevOps automation platform with a microservices architecture:

- **Express Backend** (`/server`): Modular API with versioned routes (`/api/v1/`), WebSocket services, and AI integration
- **React Frontend** (`/client`): Vite-based dashboard with Tailwind CSS and Redux state management
- **AI Service** (`/ai-service`): FastAPI service for stack detection, Dockerfile generation, and CI/CD automation
- **Deployment Agent** (`/agent`): Container orchestration and deployment execution

## Key Development Patterns

### Backend Architecture (Express)

- **Modular Controllers**: Split by feature (`/controllers/ai/`, `/controllers/deployment/`, `/controllers/project/`)
- **Service Layer**: Business logic in `/services/` directories matching controller structure
- **Module Aliases**: Use `@middleware`, `@models`, `@services` imports via `module-alias`
- **WebSocket Namespaces**: Centralized in `/websockets/` with feature-based namespaces (notifications, logs, metrics)
- **Authentication**: JWT-based with OAuth2 support, middleware in `/middleware/authMiddleware.js`

### API Conventions

- All API routes under `/api/v1/` for versioning
- RESTful patterns with consistent error responses
- WebSocket events follow `namespace:action` pattern (e.g., `notifications:new`, `logs:stream`)
- Health checks at `/api/v1/health`

### Frontend Patterns (React)

- **Vite Build System**: HMR for development, optimized production builds
- **Redux Toolkit**: Centralized state management with feature-based slices
- **Component Structure**: Atomic design with reusable components in `/src/components/`
- **Service Layer**: API calls abstracted to `/src/services/` with axios interceptors
- **Environment Variables**: Prefixed with `VITE_` for client-side access

### Design Theming (Client)

- **Dark Neutral Palette**: Consistent use of `bg-neutral-900/50`, `bg-neutral-800/50`, `border-neutral-800/50` for cards and containers
- **Glass Morphism**: `backdrop-blur-md` combined with transparency for modern UI depth
- **Text Hierarchy**: `text-white` for primary content, `text-gray-400` for secondary, `text-neutral-300` for interactive elements
- **Interactive States**: Hover effects with `hover:bg-neutral-700/50`, `hover:border-neutral-700/50` transitions
- **React Icons**: Extensive use of `react-icons/fa` for consistent iconography across dashboard, profile, and resource components
- **Framer Motion**: Smooth animations with staggered delays for component mounting and interactions

### AI Service Integration

- **FastAPI Backend**: High-performance Python service for ML workloads
- **Async Processing**: WebSocket progress updates for long-running AI operations
- **Model Management**: Stack detection, Dockerfile generation, and CI/CD pipeline creation
- **Error Handling**: Structured error responses with detailed AI processing context

## Development Workflows

### Local Development

```bash
# Start all services
npm run dev:server   # Express on :3000
npm run dev:client   # React on :5173
npm run dev:ai       # FastAPI on :8000
```

**Note**: Server management (starting/stopping Vite, Express, AI service, Agent) is handled by the developer. Do not prompt to run these services through chat interactions.

### Docker Development

- **Production**: Docker Compose with Traefik reverse proxy and Let's Encrypt SSL
- **Development**: Individual Dockerfiles per service with volume mounts
- **Networking**: Services communicate via Docker network with health checks

### CI/CD Pipeline

- **GitHub Actions**: Multi-stage workflows in `.github/workflows/`
- **Security Scanning**: Automated vulnerability checks and dependency audits
- **Quality Gates**: ESLint, Prettier, and test coverage requirements
- **Deployment**: ECR-based container registry with AWS infrastructure

## Critical Integration Points

### WebSocket Communication

- **Server**: Centralized WebSocket registry with namespace-based routing
- **Client**: Real-time updates for deployment logs, notifications, and AI progress
- **Authentication**: JWT tokens passed via WebSocket connection params

### AI Service Communication

- **REST API**: Synchronous requests for quick operations
- **WebSocket Bridge**: Async communication for long-running AI processes
- **Progress Tracking**: Real-time updates on stack analysis and generation tasks

### Database Patterns

- **MongoDB**: Primary data store with Mongoose ODM
- **Redis**: Session management, caching, and WebSocket state
- **Models**: Comprehensive schemas in `/server/models/` with audit trails

## Project-Specific Conventions

### File Organization

- **Feature-based**: Group related files by business domain, not technical layer
- **Service Separation**: Clean boundaries between authentication, deployment, and AI services
- **Documentation**: Active development docs in `/dev/` with roadmap tracking

### Error Handling

- **Structured Responses**: Consistent error format across all services
- **WebSocket Errors**: Graceful degradation with fallback mechanisms
- **AI Service Errors**: Detailed context for debugging ML pipeline issues

### Security Patterns

- **JWT Authentication**: Centralized auth middleware with role-based access
- **CORS Configuration**: Service-specific CORS policies in `/config/cors.js`
- **Rate Limiting**: Feature-specific rate limits for API and WebSocket endpoints

## Development Priorities (Current State: 85% Complete)

1. **ECR Integration**: Container registry automation (90% complete)
2. **Agent Orchestration**: Full deployment pipeline automation
3. **Multi-Cloud Foundation**: AWS/GCP/Azure provider abstractions
4. **Enhanced AI**: Post-deployment optimization and predictive analytics

## Key Files for Context

- `/dev/CURRENT_STATE_AND_ROADMAP.md` - Complete platform status and priorities
- `/server/websockets/README.md` - WebSocket architecture and patterns
- `/server/routes/api/v1/` - API structure and versioning approach
- `/ai-service/main.py` - AI service entry point and ML pipeline integration

## GitHub Copilot Pro Optimization

### Chat Personas

Use these personas for specialized assistance:

- `@workspace /explain` - Architecture explanations with Deployio context
- `@workspace /fix` - Bug fixes following Deployio patterns
- `@workspace /new` - New feature development with proper structure
- `@workspace /tests` - Test generation for microservices
- `@workspace /docs` - Documentation following project standards

### Code Generation Patterns

- **Controllers**: Always include corresponding service layer
- **Components**: Follow atomic design with consistent theming
- **WebSocket Namespaces**: Use centralized registry pattern
- **API Endpoints**: Include proper error handling and validation
- **Tests**: Cover integration points between services

### Pull Request Automation

- Use `/github-pull-request_copilot-coding-agent` for complex features
- Automated code review focuses on architecture compliance
- Security scanning for JWT and authentication patterns
- Performance checks for WebSocket and AI service integrations

### Model Context Protocol (MCP)

Enhanced AI capabilities through custom tools:

- `analyze_deployio_architecture` - Deep architecture analysis
- `generate_deployio_component` - Pattern-compliant code generation
- `review_deployio_patterns` - Automated pattern compliance
- `suggest_deployio_optimization` - Context-aware optimizations
