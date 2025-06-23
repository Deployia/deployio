const express = require("express");
const { generateDemoToken } = require("@middleware/demoAuthMiddleware");
const logger = require("@config/logger");

const router = express.Router();

/**
 * @desc Get API documentation and demo token for development
 * @route GET /api/dev/docs
 * @access Development only
 */
const getApiDocs = async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({
      success: false,
      message: "Not found",
    });
  }

  try {
    // Generate a demo token for API testing
    const demoToken = generateDemoToken();

    const apiDocs = {
      service: "DeployIO AI Analysis API",
      version: "1.0.0",
      environment: "development",
      baseUrl: `${req.protocol}://${req.get("host")}/api/v1/ai/analysis`,

      authentication: {
        demo_token: demoToken,
        note: "Use this token for testing in development. It expires in 15 minutes.",
        usage: "Include in Authorization header as 'Bearer <token>'",
      },

      rate_limits: {
        demo: "5 requests per 15 minutes",
        authenticated: "50 requests per 15 minutes",
      },

      endpoints: {
        public: {
          demo_analysis: {
            method: "POST",
            path: "/demo",
            description: "Demo repository analysis (limited features)",
            body: {
              repositoryUrl: "string (required)",
              branch: "string (default: main)",
              analysisType:
                "string (stack|quality|dependencies, default: stack)",
            },
            rate_limit: "5/15min",
          },
          supported_technologies: {
            method: "GET",
            path: "/technologies",
            description: "Get list of supported technologies",
            rate_limit: "No limit",
          },
        },

        authenticated: {
          full_analysis: {
            method: "POST",
            path: "/repository",
            description: "Complete repository analysis",
            headers: {
              Authorization: "Bearer <token>",
            },
            body: {
              repositoryUrl: "string (required)",
              branch: "string (default: main)",
              analysisTypes: "array (optional: [stack, dependencies, quality])",
              options: "object (optional analysis options)",
            },
          },

          stack_detection: {
            method: "POST",
            path: "/stack",
            description: "Technology stack detection only",
            headers: {
              Authorization: "Bearer <token>",
            },
            body: {
              repositoryUrl: "string (required)",
              branch: "string (default: main)",
              options: "object (optional)",
            },
          },

          code_quality: {
            method: "POST",
            path: "/code-quality",
            description: "Code quality analysis",
            headers: {
              Authorization: "Bearer <token>",
            },
            body: {
              repositoryUrl: "string (required)",
              branch: "string (default: main)",
              options: "object (optional)",
            },
          },

          dependencies: {
            method: "POST",
            path: "/dependencies",
            description: "Dependency analysis with security insights",
            headers: {
              Authorization: "Bearer <token>",
            },
            body: {
              repositoryUrl: "string (required)",
              branch: "string (default: main)",
              options: "object (optional)",
            },
          },

          progress: {
            method: "GET",
            path: "/progress/:operationId",
            description: "Get analysis progress for long-running operations",
            headers: {
              Authorization: "Bearer <token>",
            },
          },
        },

        admin: {
          health: {
            method: "GET",
            path: "/health",
            description: "AI service health check",
            headers: {
              Authorization: "Bearer <token>",
            },
          },
          detailed_health: {
            method: "GET",
            path: "/health/detailed",
            description: "Detailed AI service health check",
            headers: {
              Authorization: "Bearer <token>",
            },
          },
        },
      },

      example_requests: {
        demo_analysis: {
          curl: `curl -X POST ${req.protocol}://${req.get(
            "host"
          )}/api/v1/ai/analysis/demo \\
  -H "Content-Type: application/json" \\
  -d '{
    "repositoryUrl": "https://github.com/user/repo",
    "branch": "main",
    "analysisType": "stack"
  }'`,

          javascript: `fetch('${req.protocol}://${req.get(
            "host"
          )}/api/v1/ai/analysis/demo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    repositoryUrl: 'https://github.com/user/repo',
    branch: 'main',
    analysisType: 'stack'
  })
})`,
        },

        authenticated_analysis: {
          curl: `curl -X POST ${req.protocol}://${req.get(
            "host"
          )}/api/v1/ai/analysis/repository \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${demoToken}" \\
  -d '{
    "repositoryUrl": "https://github.com/user/repo",
    "branch": "main",
    "analysisTypes": ["stack", "dependencies", "quality"]
  }'`,

          javascript: `fetch('${req.protocol}://${req.get(
            "host"
          )}/api/v1/ai/analysis/repository', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${demoToken}'
  },
  body: JSON.stringify({
    repositoryUrl: 'https://github.com/user/repo',
    branch: 'main',
    analysisTypes: ['stack', 'dependencies', 'quality']
  })
})`,
        },
      },

      response_format: {
        success: {
          success: true,
          message: "Analysis completed successfully",
          data: {
            repository_url: "string",
            branch: "string",
            analysis_approach: "string",
            processing_time: "number",
            confidence_score: "number (0-1)",
            confidence_level: "string",
            technology_stack: "object",
            detected_files: "array",
            recommendations: "array",
            suggestions: "array",
            insights: "array",
            reasoning: "string",
            // ... additional fields based on analysis type
          },
        },
        error: {
          success: false,
          message: "Error description",
          error: "Detailed error information",
        },
      },

      ai_service_info: {
        internal_endpoint:
          process.env.AI_SERVICE_URL || "http://localhost:8000",
        authentication: "JWT tokens with internal service identification",
        caching:
          "Redis-based caching with different TTLs for demo vs authenticated users",
        fallback: "Graceful fallback when AI service is unavailable",
      },

      development_notes: {
        demo_mode:
          "Demo tokens have limited analysis features and heavy rate limiting",
        caching: "Results are cached - use forceRefresh option to bypass cache",
        progress_tracking: "Set trackProgress: true for long-running analyses",
        error_handling:
          "All endpoints include fallback responses when AI service is unavailable",
      },
    };

    res.status(200).json({
      success: true,
      message: "API documentation retrieved successfully",
      data: apiDocs,
    });
  } catch (error) {
    logger.error("Error generating API docs:", error);
    res.status(500).json({
      success: false,
      message: "Error generating API documentation",
      error: error.message,
    });
  }
};

/**
 * @desc Generate a new demo token for development
 * @route POST /api/dev/demo-token
 * @access Development only
 */
const generateDevDemoToken = async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({
      success: false,
      message: "Not found",
    });
  }

  try {
    const demoToken = generateDemoToken();

    res.status(200).json({
      success: true,
      message: "Demo token generated successfully",
      data: {
        token: demoToken,
        type: "demo",
        expires_in: "15 minutes",
        usage: "Include in Authorization header as 'Bearer <token>'",
        limitations: [
          "Rate limited to 5 requests per 15 minutes",
          "Limited analysis features",
          "No LLM enhancement",
          "Reduced recommendation depth",
        ],
      },
    });
  } catch (error) {
    logger.error("Error generating demo token:", error);
    res.status(500).json({
      success: false,
      message: "Error generating demo token",
      error: error.message,
    });
  }
};

// Development routes
router.get("/docs", getApiDocs);
router.post("/demo-token", generateDevDemoToken);

module.exports = router;
