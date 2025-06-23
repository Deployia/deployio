# DeployIO API Documentation

This directory contains the modern, FastAPI-like API documentation system for DeployIO.

## Features

- 🚀 **FastAPI-Style Documentation** - Comprehensive, auto-generated API docs
- 📊 **Interactive Testing** - Try out endpoints directly from the documentation
- 🔐 **Authentication Support** - JWT and API key authentication examples
- 📝 **Rich Examples** - Complete request/response examples for every endpoint
- 🏷️ **Organized by Tags** - Well-structured navigation by feature area
- 🎨 **Beautiful UI** - Custom styling for better developer experience

## Documentation Files

- `auth.swagger.js` - Authentication endpoints (login, register, OAuth)
- `users.swagger.js` - User management and profile operations
- `projects.swagger.js` - Project creation and management
- `deployments.swagger.js` - Deployment operations and monitoring
- `ai.swagger.js` - AI-powered deployment assistance
- `admin.swagger.js` - Administrative operations
- `health.swagger.js` - Health checks and external webhooks

## Accessing Documentation

In development mode, visit: http://localhost:5000/api/v1/docs

## Key Improvements Over Previous System

### 1. Comprehensive Coverage

- Every endpoint documented with detailed descriptions
- Complete request/response schemas
- Real-world examples for all operations

### 2. FastAPI-Like Experience

- Automatic schema generation
- Interactive "Try it out" functionality
- Persistent authentication for testing

### 3. Developer-Friendly

- Clear error responses with examples
- Pagination parameters documented
- Rate limiting information included

### 4. Professional Presentation

- Custom styling and branding
- Organized tag structure
- Rich markdown descriptions

## Schema Definitions

The system includes comprehensive schema definitions for:

- User objects and authentication flows
- Project configuration and settings
- Deployment status and logs
- AI conversation and analysis data
- Administrative analytics and metrics

## Authentication Examples

The documentation includes examples for:

- JWT Bearer token authentication
- API key authentication
- OAuth flows (Google)
- Rate limiting scenarios

## Testing Features

- **Try It Out** - Test endpoints directly from the docs
- **Persistent Auth** - Authenticate once, test multiple endpoints
- **Request Duration** - See how fast your API responds
- **Filtering** - Find endpoints quickly with search

## Adding New Endpoints

To document a new endpoint:

1. Add the OpenAPI specification to the appropriate file
2. Include comprehensive examples
3. Document all parameters and responses
4. Add appropriate tags and security requirements

Example:

```javascript
/**
 * @swagger
 * /api/v1/example:
 *   get:
 *     summary: Example endpoint
 *     description: Detailed description of what this endpoint does
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
```

## Best Practices

1. **Always include examples** - Real request/response examples
2. **Document all parameters** - Include validation rules and formats
3. **Use consistent schemas** - Leverage common response formats
4. **Add security requirements** - Specify authentication needs
5. **Provide clear descriptions** - Help developers understand the purpose

This documentation system provides a professional, comprehensive API reference that rivals the best API documentation in the industry.

- **`auth.swagger.js`** - Authentication endpoints documentation
- **`user.swagger.js`** - User management endpoints documentation

## Accessing Documentation

In development mode, the interactive Swagger UI is available at:

- **Local**: `http://localhost:3000/api/v1/docs`

## Adding New Documentation

To add documentation for new endpoints:

1. Create a new `.swagger.js` file in this folder
2. Follow the OpenAPI 3.0 specification format
3. Use JSDoc comments in your route files
4. The documentation will be automatically included in the Swagger UI

## Documentation Format

```javascript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   post:
 *     summary: Brief description
 *     tags: [YourTag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response
 */
```

## Related Files

- **Backend Configuration**: `config/init.js` - Swagger setup
- **Route Files**: `routes/*.js` - API endpoints
- **Main Documentation**: `../README.md` - Project documentation index
