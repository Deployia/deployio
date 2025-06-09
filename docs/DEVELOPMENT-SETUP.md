# Development Setup Guide

## Prerequisites

- **Node.js**: 20+ (Latest LTS recommended)
- **Python**: 3.12+
- **Docker**: Latest version with Docker Compose
- **MongoDB**: Local installation or MongoDB Atlas
- **Git**: For version control

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/vasudevshetty/deployio.git
cd deployio

# Install Node.js dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install Python dependencies for AI service
cd fastapi_service && pip install -r requirements.txt && cd ..
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or your preferred editor
```

### 3. Required Environment Variables

```bash
# Database Configuration
MONGO_URI=mongodb://localhost:27017/deployio
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
AI_SERVICE_URL=http://localhost:8000
AI_MODEL_VERSION=gpt-4

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email Service
EMAIL_USER=your_email@domain.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@deployio.tech

# Cloud Providers (for deployment features)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

GCP_PROJECT_ID=your_gcp_project_id
GCP_SERVICE_ACCOUNT_KEY=path_to_service_account.json

AZURE_SUBSCRIPTION_ID=your_azure_subscription_id
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret

# Development Settings
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
```

## Development Workflow

### Starting All Services

```bash
# Start all services concurrently
npm run dev

# Individual services
npm run server     # Backend API only (port 3000)
npm run client     # Frontend dashboard only (port 5173)
npm run fastapi    # AI service only (port 8000)
```

### Database Setup

#### Local MongoDB

```bash
# Install MongoDB Community Edition
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Start MongoDB
mongod --dbpath /path/to/your/db
```

#### MongoDB Atlas (Recommended for development)

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and add to `MONGO_URI`

### Available Scripts

```bash
# Development
npm run dev          # Start all services
npm run server       # Backend only
npm run client       # Frontend only
npm run fastapi      # AI service only

# Testing
npm run test         # Run all tests
npm run test:server  # Backend tests
npm run test:client  # Frontend tests
npm run test:ai      # AI service tests

# Quality & Security
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run security     # Security vulnerability scan
npm run audit        # Dependency audit

# Platform Management
npm run health       # Check all services health
npm run build        # Build all services for production
npm run clean        # Clean build artifacts
```

## Development Tools

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-vscode.vscode-eslint"
  ]
}
```

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "python.defaultInterpreterPath": "./fastapi_service/.venv/bin/python",
  "eslint.workingDirectories": ["client"]
}
```

## Docker Development

### Using Docker Compose

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild services
docker-compose up --build
```

### Individual Docker Builds

```bash
# Build backend
docker build -t deployio-backend .

# Build frontend
docker build -t deployio-frontend ./client

# Build AI service
docker build -t deployio-ai ./fastapi_service
```

## Database Management

### MongoDB Operations

```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/deployio

# Common operations
db.users.find()              # List all users
db.users.countDocuments()    # Count users
db.deployments.find()        # List deployments
```

### Database Seeding

```bash
# Seed development data
npm run seed

# Reset database
npm run db:reset

# Run migrations
npm run migrate
```

## AI Service Development

### Python Environment

```bash
# Create virtual environment
cd fastapi_service
python -m venv .venv

# Activate virtual environment
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run AI service
python main.py
```

### AI Model Configuration

```python
# fastapi_service/config/settings.py
AI_MODELS = {
    "stack_detection": "gpt-4",
    "dockerfile_generation": "gpt-4",
    "error_diagnosis": "gpt-3.5-turbo"
}
```

## Testing

### Backend Testing

```bash
# Run all backend tests
npm run test:server

# Run specific test file
npm test -- auth.test.js

# Run tests with coverage
npm run test:coverage
```

### Frontend Testing

```bash
# Run React tests
cd client
npm test

# Run E2E tests
npm run test:e2e
```

### AI Service Testing

```bash
cd fastapi_service
pytest tests/
pytest tests/test_stack_detection.py -v
```

## Debugging

### Backend Debugging (VS Code)

```json
{
  "name": "Debug Backend",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/server.js",
  "env": {
    "NODE_ENV": "development"
  },
  "console": "integratedTerminal"
}
```

### AI Service Debugging

```json
{
  "name": "Debug FastAPI",
  "type": "python",
  "request": "launch",
  "program": "${workspaceFolder}/fastapi_service/main.py",
  "console": "integratedTerminal",
  "cwd": "${workspaceFolder}/fastapi_service"
}
```

## Performance Monitoring

### Local Performance Testing

```bash
# Run performance benchmarks
npm run benchmark

# Network performance test
npm run test:network

# Memory usage analysis
npm run analyze:memory
```

### Monitoring Setup

```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Access monitoring dashboards
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
```

## Troubleshooting

### Common Issues

| Issue                       | Solution                                                     |
| --------------------------- | ------------------------------------------------------------ |
| MongoDB connection failed   | Check if MongoDB is running and connection string is correct |
| AI service timeout          | Verify OpenAI API key and check network connectivity         |
| Port already in use         | Kill processes on ports 3000, 5173, or 8000                  |
| Dependencies not installing | Delete node_modules and package-lock.json, then reinstall    |

### Logs and Debugging

```bash
# View all service logs
npm run logs

# Backend logs only
npm run logs:server

# AI service logs
cd fastapi_service && tail -f logs/app.log

# Check service health
curl http://localhost:3000/api/v1/health
curl http://localhost:8000/health
```

### Reset Development Environment

```bash
# Complete reset
npm run dev:reset

# This will:
# 1. Stop all services
# 2. Clear database
# 3. Remove node_modules
# 4. Reinstall dependencies
# 5. Restart services
```

## Contributing Guidelines

### Code Style

- **Backend**: Follow Node.js best practices with ESLint configuration
- **Frontend**: React functional components with hooks, Tailwind CSS
- **AI Service**: Python PEP 8 style guide with Black formatter
- **Commits**: Use conventional commits format

### Pull Request Process

1. Create feature branch from `main`
2. Write tests for new features
3. Ensure all tests pass
4. Update documentation
5. Submit pull request with clear description

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/ai-enhancement

# Make changes and test
npm run test
npm run lint

# Commit changes
git add .
git commit -m "feat: add enhanced stack detection"

# Push and create PR
git push origin feature/ai-enhancement
```

---

**Ready to contribute? Join our developer community and help build the future of AI-powered DevOps!**
