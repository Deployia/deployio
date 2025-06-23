# Backend API Documentation

This folder contains the OpenAPI/Swagger documentation for the DeployIO backend Express.js API.

## Files

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
