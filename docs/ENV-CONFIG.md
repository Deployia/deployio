# Environment Configuration Guide

This document explains how environment variables are handled across all services in the DeployIO application: Frontend (React), Backend (Node.js/Express), and FastAPI service.

## 🎯 Overview

DeployIO uses a multi-service architecture with different environment configuration approaches for each service:

- **Frontend (React + Vite)**: Build-time environment variables with `VITE_` prefix
- **Backend (Node.js/Express)**: Runtime environment variables for server configuration
- **FastAPI Service**: Python environment variables for API configuration

---

## 🌐 Frontend Environment Variables

### Environment Files

- `.env`: Default environment variables used during build
- `.env.local`: Local development overrides (not committed to git)
- `.env.production`: Production-specific variables

### Key Variables

```bash
# Application Environment
VITE_APP_ENV=development              # "development" or "production"

# API Endpoints
VITE_APP_BACKEND_URL=http://localhost:3000/api/v1    # Backend API base URL
VITE_APP_FASTAPI_URL=http://localhost:8000           # FastAPI service base URL

# Optional: OAuth Configuration (if needed on frontend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### Docker Build Process

1. Build arguments from `docker-compose.yml` are passed to Dockerfile
2. These arguments create a `.env` file during container build
3. Vite uses this `.env` file during the build process

---

## 🔧 Backend Environment Variables

### Core Configuration

```bash
# Server Configuration
PORT=3000                             # Server port
NODE_ENV=development                  # "development" | "production" | "test"

# Database
MONGO_URI=mongodb://localhost:27017/deployio    # MongoDB connection string
MONGO_URI_TEST=mongodb://localhost:27017/deployio_test  # Test database

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here       # JWT signing secret (minimum 32 chars)
JWT_EXPIRES_IN=1d                              # Token expiration time
JWT_COOKIE_EXPIRES_IN=1                        # Cookie expiration (days)

# CORS Configuration
FRONTEND_URL_DEV=http://localhost:5173          # Development frontend URL
FRONTEND_URL_PROD=https://deployio.tech         # Production frontend URL

# Session Configuration
SESSION_SECRET=your_session_secret_here         # Session signing secret
```

### Email Configuration

```bash
# Email Service (for password reset, notifications)
EMAIL_SERVICE=gmail                             # Email service provider
EMAIL_USER=your_email@domain.com               # Sender email address
EMAIL_PASSWORD=your_app_password_here           # App-specific password
EMAIL_FROM=noreply@deployio.tech               # From email address

# Password Reset
PASSWORD_RESET_EXPIRES=30                      # Token expiry in minutes
```

### OAuth Configuration

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback
```

### Optional Services

```bash
# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000                    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100                    # Max requests per window
```

---

## 🐍 FastAPI Environment Variables

### Core Configuration

```bash
# Server Configuration
FASTAPI_HOST=0.0.0.0                          # Host to bind to
FASTAPI_PORT=8000                             # Server port
FASTAPI_ENV=development                        # "development" | "production"

# CORS Configuration
FRONTEND_URL=http://localhost:5173             # Frontend URL for CORS
BACKEND_URL=http://localhost:3000              # Backend URL for communication

# Database (if FastAPI needs direct DB access)
MONGO_URI=mongodb://localhost:27017/deployio  # MongoDB connection string
```

### JWT Configuration (for auth verification)

```bash
# JWT Secret (should match backend)
JWT_SECRET=your_super_secret_jwt_key_here      # Same as backend JWT secret
JWT_ALGORITHM=HS256                            # JWT algorithm
```

### Optional Configuration

```bash
# Logging
LOG_LEVEL=INFO                                 # DEBUG | INFO | WARNING | ERROR
LOG_FORMAT=json                                # json | text

# Redis (if using caching)
REDIS_URL=redis://localhost:6379              # Redis connection string

# External APIs
API_KEY_EXTERNAL_SERVICE=your_api_key_here     # External service API keys
```

---

## 📁 Environment File Examples

### `.env.example` (Root Directory)

```bash
# === BACKEND CONFIGURATION ===
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/deployio
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRES_IN=1

# Frontend URLs
FRONTEND_URL_DEV=http://localhost:5173
FRONTEND_URL_PROD=https://deployio.tech

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@domain.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=noreply@deployio.tech

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# === FASTAPI CONFIGURATION ===
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
FASTAPI_ENV=development

# === FRONTEND CONFIGURATION ===
VITE_APP_ENV=development
VITE_APP_BACKEND_URL=http://localhost:3000/api/v1
VITE_APP_FASTAPI_URL=http://localhost:8000
```

---

## 🚀 Local Development Setup

### 1. Backend Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env  # or your preferred editor

# Install dependencies and start
npm install
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to client directory
cd client

# Create local environment file
cat > .env.local << EOL
VITE_APP_ENV=development
VITE_APP_BACKEND_URL=http://localhost:3000/api/v1
VITE_APP_FASTAPI_URL=http://localhost:8000
EOL

# Install dependencies and start
npm install
npm run dev
```

### 3. FastAPI Setup

```bash
# Navigate to FastAPI directory
cd fastapi_service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🐳 Production Deployment

### Docker Environment Variables

Environment variables are managed through `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL_PROD=https://deployio.tech

  fastapi:
    environment:
      - FASTAPI_ENV=production
      - FRONTEND_URL=https://deployio.tech
      - JWT_SECRET=${JWT_SECRET}

  frontend:
    build:
      args:
        - VITE_APP_ENV=production
        - VITE_APP_BACKEND_URL=/api/v1
        - VITE_APP_FASTAPI_URL=/fastapi
```

### Production Environment File

Create `.env.production`:

```bash
NODE_ENV=production
MONGO_URI=mongodb://your-production-mongo-uri
JWT_SECRET=your-super-secure-production-jwt-secret
EMAIL_USER=your-production-email@domain.com
EMAIL_PASSWORD=your-production-email-password
# ... other production values
```

---

## 🔍 Debugging Environment Variables

### Health Check Endpoints

Visit these URLs to verify configuration:

- **Frontend**: `http://localhost:5173/health` - Shows frontend environment info
- **Backend**: `http://localhost:3000/api/v1/health` - Shows backend status
- **FastAPI**: `http://localhost:8000/health` - Shows FastAPI status

### Console Debugging

Each service logs its configuration on startup (sensitive values are masked).

### Environment Verification Script

```bash
# Run verification script
./scripts/verify-cicd.sh

# Check specific service health
curl http://localhost:3000/api/v1/health  # Backend
curl http://localhost:8000/health         # FastAPI
```

---

## 🛡️ Security Best Practices

### 1. Secrets Management

- **Never commit `.env` files** to version control
- **Use strong, unique secrets** for JWT and sessions
- **Rotate secrets regularly** in production
- **Use environment-specific secrets**

### 2. Environment Separation

- **Development**: Use local services and test data
- **Production**: Use secure, production-grade services
- **Never use production secrets** in development

### 3. Validation

- **Validate required environment variables** on startup
- **Use default values** for non-critical variables
- **Fail fast** if critical variables are missing

---

## 🆘 Common Issues

| Problem                   | Solution                                                 |
| ------------------------- | -------------------------------------------------------- |
| **CORS errors**           | Check `FRONTEND_URL_*` variables match your frontend URL |
| **JWT errors**            | Ensure `JWT_SECRET` is same across backend and FastAPI   |
| **Email not working**     | Verify `EMAIL_*` configuration and app password          |
| **OAuth failures**        | Check client IDs and callback URLs                       |
| **API connection issues** | Verify `VITE_APP_*_URL` variables are correct            |

---

## 📖 Additional Resources

- **[MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)**
- **[JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)**
- **[Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)**
- **[FastAPI Settings](https://fastapi.tiangolo.com/advanced/settings/)**
