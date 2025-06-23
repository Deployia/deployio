// Modern Swagger Documentation Generator
// FastAPI-like automatic documentation system

const swaggerJsdoc = require("swagger-jsdoc");
const fs = require("fs");
const path = require("path");

/**
 * OpenAPI Schema Definitions
 */
const schemas = {
  User: {
    type: "object",
    properties: {
      _id: { type: "string", description: "User ID" },
      name: { type: "string", description: "User's full name" },
      email: { type: "string", format: "email", description: "User's email" },
      role: {
        type: "string",
        enum: ["user", "admin"],
        description: "User role",
      },
      isEmailVerified: {
        type: "boolean",
        description: "Email verification status",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  Project: {
    type: "object",
    properties: {
      _id: { type: "string", description: "Project ID" },
      name: { type: "string", description: "Project name" },
      description: { type: "string", description: "Project description" },
      status: {
        type: "string",
        enum: ["active", "inactive", "deploying", "failed"],
        description: "Project status",
      },
      owner: { $ref: "#/components/schemas/User" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  Deployment: {
    type: "object",
    properties: {
      _id: { type: "string", description: "Deployment ID" },
      projectId: { type: "string", description: "Associated project ID" },
      status: {
        type: "string",
        enum: ["pending", "building", "deploying", "success", "failed"],
        description: "Deployment status",
      },
      url: { type: "string", format: "uri", description: "Deployment URL" },
      branch: { type: "string", description: "Git branch" },
      commit: { type: "string", description: "Git commit hash" },
      logs: { type: "array", items: { type: "string" } },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  ApiKey: {
    type: "object",
    properties: {
      _id: { type: "string", description: "API Key ID" },
      name: { type: "string", description: "API Key name" },
      key: { type: "string", description: "API Key value (shown only once)" },
      isActive: { type: "boolean", description: "API Key status" },
      lastUsed: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  // Request/Response schemas
  RegisterRequest: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 50 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
    },
  },

  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },

  AuthResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      message: { type: "string" },
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string", description: "JWT token" },
        },
      },
    },
  },

  ApiResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      message: { type: "string" },
      data: { type: "object" },
      pagination: {
        type: "object",
        properties: {
          page: { type: "number" },
          limit: { type: "number" },
          total: { type: "number" },
          pages: { type: "number" },
        },
      },
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      message: { type: "string" },
      error: { type: "string" },
      stack: { type: "string", description: "Only in development" },
    },
  },
};

/**
 * Security schemes
 */
const securitySchemes = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
  apiKeyAuth: {
    type: "apiKey",
    in: "header",
    name: "X-API-Key",
  },
};

/**
 * Generate route documentation decorator
 */
function documentRoute(config) {
  return function (target, propertyKey, descriptor) {
    // Store documentation metadata on the function
    descriptor.value._swagger = config;
    return descriptor;
  };
}

/**
 * Auto-generate swagger documentation from routes
 */
function generateSwaggerSpec() {
  const baseConfig = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "DeployIO API",
        version: "1.0.0",
        description: `
          ## DeployIO - Modern Deployment Platform API
          
          A comprehensive API for managing deployments, projects, and users.
          
          ### Features
          - 🚀 **Fast Deployments** - Deploy your applications in seconds
          - 🔐 **Secure Authentication** - JWT-based auth with API keys
          - 📊 **Real-time Monitoring** - Live deployment status and logs
          - 🌐 **Multi-environment** - Support for staging and production
          
          ### Authentication
          This API uses JWT tokens for authentication. Include the token in the Authorization header:
          \`Authorization: Bearer <your-token>\`
          
          ### Rate Limiting
          API requests are rate-limited. Check response headers for current limits.
        `,
        contact: {
          name: "DeployIO Support",
          email: "support@deployio.dev",
          url: "https://deployio.dev/support",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url:
            process.env.NODE_ENV === "production"
              ? "https://api.deployio.dev"
              : "http://localhost:5000",
          description:
            process.env.NODE_ENV === "production"
              ? "Production server"
              : "Development server",
        },
      ],
      components: {
        schemas,
        securitySchemes,
        parameters: {
          PageParam: {
            name: "page",
            in: "query",
            description: "Page number",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          LimitParam: {
            name: "limit",
            in: "query",
            description: "Items per page",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
          SortParam: {
            name: "sort",
            in: "query",
            description: "Sort field and order (e.g., '-createdAt')",
            schema: { type: "string" },
          },
        },
        responses: {
          NotFound: {
            description: "Resource not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  message: "Resource not found",
                },
              },
            },
          },
          Unauthorized: {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  message: "Please authenticate",
                },
              },
            },
          },
          Forbidden: {
            description: "Access denied",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  message: "Access denied",
                },
              },
            },
          },
          ValidationError: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  message: "Validation failed",
                  error: "Invalid input data",
                },
              },
            },
          },
          RateLimitError: {
            description: "Rate limit exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  message: "Too many requests",
                },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        {
          name: "Authentication",
          description: "User authentication and authorization endpoints",
        },
        {
          name: "Users",
          description: "User management operations",
        },
        {
          name: "Projects",
          description: "Project management operations",
        },
        {
          name: "Deployments",
          description: "Deployment management and monitoring",
        },
        {
          name: "AI",
          description: "AI-powered deployment assistance",
        },
        {
          name: "Admin",
          description: "Administrative operations",
        },
        {
          name: "External",
          description: "External integrations and webhooks",
        },
        {
          name: "Health",
          description: "System health and monitoring",
        },
      ],
    },
    apis: [], // We'll populate this dynamically
  };

  return swaggerJsdoc(baseConfig);
}

/**
 * FastAPI-like route documentation helpers
 */
const SwaggerHelpers = {
  // Common response patterns
  responses: {
    success: (dataSchema, description = "Success") => ({
      200: {
        description,
        content: {
          "application/json": {
            schema: {
              allOf: [
                { $ref: "#/components/schemas/ApiResponse" },
                {
                  properties: {
                    data: dataSchema || { type: "object" },
                  },
                },
              ],
            },
          },
        },
      },
    }),

    created: (dataSchema, description = "Created successfully") => ({
      201: {
        description,
        content: {
          "application/json": {
            schema: {
              allOf: [
                { $ref: "#/components/schemas/ApiResponse" },
                {
                  properties: {
                    data: dataSchema || { type: "object" },
                  },
                },
              ],
            },
          },
        },
      },
    }),

    paginated: (itemSchema, description = "Paginated results") => ({
      200: {
        description,
        content: {
          "application/json": {
            schema: {
              allOf: [
                { $ref: "#/components/schemas/ApiResponse" },
                {
                  properties: {
                    data: {
                      type: "array",
                      items: itemSchema,
                    },
                  },
                },
              ],
            },
          },
        },
      },
    }),

    commonErrors: {
      400: { $ref: "#/components/responses/ValidationError" },
      401: { $ref: "#/components/responses/Unauthorized" },
      403: { $ref: "#/components/responses/Forbidden" },
      404: { $ref: "#/components/responses/NotFound" },
      429: { $ref: "#/components/responses/RateLimitError" },
    },
  },

  // Common parameters
  parameters: {
    pagination: [
      { $ref: "#/components/parameters/PageParam" },
      { $ref: "#/components/parameters/LimitParam" },
      { $ref: "#/components/parameters/SortParam" },
    ],
    id: (name = "id", description = "Resource ID") => ({
      name,
      in: "path",
      required: true,
      description,
      schema: { type: "string" },
    }),
  },

  // Security requirements
  security: {
    authenticated: [{ bearerAuth: [] }],
    apiKey: [{ apiKeyAuth: [] }],
    adminOnly: [{ bearerAuth: [] }], // We can add role checking logic later
  },
};

module.exports = {
  generateSwaggerSpec,
  documentRoute,
  SwaggerHelpers,
  schemas,
  securitySchemes,
};
