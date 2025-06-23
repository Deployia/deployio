# AI Service Integration - Backend Implementation Summary

## Overview

Updated the backend service to properly integrate with the newly completed AI service analysis endpoints, implementing JWT authentication, rate limiting, and development tools.

## Key Changes

### 1. AI Service Client (`aiServiceClient.js`)

- **Enhanced JWT Authentication**: Added support for both user tokens and demo tokens
- **New Functions**:
  - `generateDemoToken()` - Creates short-lived demo tokens (15min expiry)
  - `getDetailedAiServiceHealth()` - Detailed health check endpoint
- **Updated Health Checks**: Now target the correct AI service endpoints

### 2. Analysis Service (`analysisService.js`)

- **Complete Rewrite**: Rebuilt to match new AI service API structure
- **New Endpoints Support**:
  - `/analysis/analyze-repository` - Complete analysis
  - `/analysis/detect-stack` - Technology stack detection
  - `/analysis/analyze-code-quality` - Code quality metrics
  - `/analysis/analyze-dependencies` - Dependency analysis with security
  - `/analysis/progress/{operationId}` - Progress tracking
  - `/analysis/supported-technologies` - Available technologies
- **Smart Caching**: Different cache durations for demo vs authenticated users
- **Enhanced Fallbacks**: Detailed error context and graceful degradation
- **Flexible Authentication**: Supports both user tokens and demo access

### 3. Analysis Controller (`analysisController.js`)

- **New Endpoints**:
  - `POST /repository` - Complete repository analysis
  - `POST /stack` - Technology stack detection
  - `POST /code-quality` - Code quality analysis
  - `POST /dependencies` - Dependency analysis
  - `GET /progress/:operationId` - Progress tracking
  - `POST /demo` - Demo analysis (rate limited)
- **Legacy Compatibility**: Maintained existing endpoints for backward compatibility
- **Enhanced Error Handling**: Better error messages and status codes

### 4. Authentication & Rate Limiting

#### Demo Access Middleware (`demoAuthMiddleware.js`)

- **Dual Authentication**: Supports both authenticated users and demo tokens
- **Demo Token Validation**: Special handling for demo access
- **Flexible Access**: Graceful fallback to demo mode for invalid tokens

#### Rate Limiting

- **Demo Users**: 5 requests per 15 minutes (heavily limited)
- **Authenticated Users**: 50 requests per 15 minutes
- **Redis-backed**: Persistent rate limiting across restarts

### 5. Development Tools

#### Development Documentation (`/api/dev/docs`)

- **Complete API Documentation**: Interactive docs with examples
- **Auto-generated Demo Tokens**: Fresh tokens for testing
- **Request Examples**: curl and JavaScript examples
- **Development Only**: Only available in NODE_ENV=development

#### Demo Token Generation (`/api/dev/demo-token`)

- **On-demand Token Creation**: Generate fresh demo tokens
- **Usage Instructions**: Clear guidelines for token usage
- **Rate Limit Information**: Explains demo limitations

## Authentication Flow

### For Authenticated Users

```javascript
// User logs in normally and gets JWT token
const token = "user_jwt_token";

// Use token for AI service requests
Authorization: Bearer <user_token>
```

### For Demo Access

```javascript
// Generate demo token (development)
POST /api/dev/demo-token

// Use demo token for limited access
Authorization: Bearer <demo_token>

// Or use without token (falls back to demo)
// No Authorization header needed
```

### Internal AI Service Communication

```javascript
// Backend generates appropriate token
const token = user ? generateAiServiceToken(user) : generateDemoToken();

// Sends to AI service with internal header
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Internal-Service': 'deployio-backend'
}
```

## API Endpoints Summary

### Public (Demo) Endpoints

- `POST /api/v1/ai/analysis/demo` - Demo analysis (5/15min)
- `GET /api/v1/ai/analysis/technologies` - Supported technologies

### Authenticated Endpoints

- `POST /api/v1/ai/analysis/repository` - Complete analysis
- `POST /api/v1/ai/analysis/stack` - Stack detection
- `POST /api/v1/ai/analysis/code-quality` - Quality analysis
- `POST /api/v1/ai/analysis/dependencies` - Dependency analysis
- `GET /api/v1/ai/analysis/progress/:id` - Progress tracking

### Admin Endpoints

- `GET /api/v1/ai/analysis/health` - Health check
- `GET /api/v1/ai/analysis/health/detailed` - Detailed health

### Development Endpoints (dev mode only)

- `GET /api/dev/docs` - Complete API documentation
- `POST /api/dev/demo-token` - Generate demo token

### Legacy Endpoints (deprecated)

- `POST /api/v1/ai/analysis/stack/:projectId` - Project stack analysis
- `POST /api/v1/ai/analysis/full/:projectId` - Full project analysis

## Development Usage

### 1. Get API Documentation

```bash
curl http://localhost:3000/api/dev/docs
```

### 2. Generate Demo Token

```bash
curl -X POST http://localhost:3000/api/dev/demo-token
```

### 3. Test Demo Analysis

```bash
curl -X POST http://localhost:3000/api/v1/ai/analysis/demo \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/user/repo",
    "analysisType": "stack"
  }'
```

### 4. Test Authenticated Analysis

```bash
curl -X POST http://localhost:3000/api/v1/ai/analysis/repository \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <demo_token>" \
  -d '{
    "repositoryUrl": "https://github.com/user/repo",
    "analysisTypes": ["stack", "dependencies", "quality"]
  }'
```

## Configuration

### Environment Variables

```bash
# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=your_jwt_secret

# Development Mode
NODE_ENV=development
DEBUG_RATE_LIMIT=true
```

### AI Service Setup

Ensure the AI service is running with the analysis endpoints at:

- Base URL: `${AI_SERVICE_URL}/analysis/`
- Authentication: JWT tokens via Authorization header
- Internal Service ID: `X-Internal-Service: deployio-backend`

## Security Features

1. **JWT Authentication**: Secure token-based auth for AI service communication
2. **Rate Limiting**: Prevents abuse with Redis-backed limits
3. **Internal Service Validation**: AI service validates internal requests
4. **Demo Token Expiry**: Short-lived tokens (15min) for demo access
5. **Error Sanitization**: Safe error messages without sensitive details

## Future Enhancements

1. **User-specific Rate Limits**: Different limits based on user tier
2. **Advanced Caching**: Smart cache invalidation based on repository changes
3. **Analysis Webhooks**: Notify when long-running analyses complete
4. **Batch Analysis**: Support for multiple repositories
5. **Custom Analysis Types**: User-defined analysis configurations

## Architecture Benefits

1. **Modular Design**: Clean separation between service layers
2. **Backward Compatibility**: Legacy endpoints maintained during transition
3. **Graceful Degradation**: Fallback responses when AI service unavailable
4. **Development Friendly**: Comprehensive docs and tools for testing
5. **Production Ready**: Proper authentication, rate limiting, and error handling
