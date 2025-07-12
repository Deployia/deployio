const axios = require("axios");
const logger = require("@config/logger");

/**
 * AI Chat Service
 * Handles communication with AI service chatbot endpoints
 */
class AIChatService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
    this.internalServiceToken = "deployio-backend";
  }

  /**
   * Business chatbot - Public access
   * @param {string} message - User message
   * @param {string} sessionId - Session ID for conversation context
   * @returns {object} Chat response
   */
  async businessChat(message, sessionId = "default") {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/service/v1/chatbot/business`,
        {
          message,
          session_id: sessionId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Business chat service error:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Return fallback response if AI service is unavailable
      return this._getFallbackBusinessResponse(message);
    }
  }

  /**
   * DevOps chatbot - Authenticated access only
   * @param {string} message - User message
   * @param {object} context - Optional context (file, repository, etc.)
   * @returns {object} Chat response
   */
  async devOpsChat(message, context = {}) {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/service/v1/chatbot/devops`,
        {
          message,
          context,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Service": this.internalServiceToken,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data;
    } catch (error) {
      logger.error("DevOps chat service error:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Return fallback response if AI service is unavailable
      return this._getFallbackDevOpsResponse(message);
    }
  }

  /**
   * Reset business conversation
   * @param {string} sessionId - Session ID to reset
   * @returns {object} Reset confirmation
   */
  async resetBusinessConversation(sessionId) {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/service/v1/chatbot/business/reset`,
        null,
        {
          params: {
            session_id: sessionId,
          },
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Reset business conversation error:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Return success even if AI service fails
      return {
        success: true,
        message: "Conversation history reset",
        session_id: sessionId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get business welcome message
   * @returns {object} Welcome message
   */
  async getBusinessWelcome() {
    try {
      const response = await axios.get(
        `${this.aiServiceUrl}/service/v1/chatbot/business/welcome`,
        {
          timeout: 10000, // 10 second timeout
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Get business welcome error:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Return fallback welcome message
      return {
        message:
          "👋 Hi! I'm **DeployBot**. Ask me about:\n• **How deployio works**\n• **Pricing & plans**\n• **Tech help** (Docker, CI/CD)\n• **Getting started**\n\nWhat would you like to know?",
        suggestions: [
          "How does deployio work?",
          "Show me pricing",
          "Help with Docker",
          "How do I get started?",
        ],
        timestamp: new Date().toISOString(),
        session_id: "welcome",
      };
    }
  }

  /**
   * Get chatbot health status
   * @returns {object} Health status
   */
  async getChatbotHealth() {
    try {
      const response = await axios.get(
        `${this.aiServiceUrl}/service/v1/chatbot/health`,
        {
          timeout: 10000, // 10 second timeout
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Chatbot health check error:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      return {
        service: "Chatbot Services",
        status: "unavailable",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Fallback business response when AI service is unavailable
   * @param {string} userMessage - User's message
   * @returns {object} Fallback response
   */
  _getFallbackBusinessResponse(userMessage) {
    const userLower = userMessage.toLowerCase();

    // Pricing inquiries
    if (
      userLower.includes("price") ||
      userLower.includes("pricing") ||
      userLower.includes("cost") ||
      userLower.includes("plan")
    ) {
      return {
        message:
          "💰 **DeployIO Pricing:**\n\n• **Free**: $0/month - 3 projects, basic monitoring\n• **Pro**: $29/month - Unlimited projects, priority support\n• **Enterprise**: Custom pricing - Dedicated support, advanced features\n\nContact sales for custom Enterprise pricing!",
        suggestions: [
          "What's in Free tier?",
          "Enterprise features?",
          "Contact sales",
        ],
        timestamp: new Date().toISOString(),
        error: false,
      };
    }

    // Getting started inquiries
    if (
      userLower.includes("start") ||
      userLower.includes("begin") ||
      userLower.includes("how") ||
      userLower.includes("setup")
    ) {
      return {
        message:
          "🚀 **Getting Started with DeployIO:**\n\n1. Sign up at deployio.tech\n2. Connect your Git repository\n3. Let our AI analyze your code\n4. Review generated configurations\n5. Deploy with one click!\n\nNeed help? Check our documentation or start a free trial!",
        suggestions: ["Sign up now", "View documentation", "Contact support"],
        timestamp: new Date().toISOString(),
        error: false,
      };
    }

    // Technical inquiries
    if (
      userLower.includes("tech") ||
      userLower.includes("support") ||
      userLower.includes("framework") ||
      userLower.includes("language")
    ) {
      return {
        message:
          "🔧 **Supported Technologies:**\n\n• **Frontend**: React, Vue, Angular, Next.js\n• **Backend**: Node.js, Python, Java, Go\n• **Databases**: PostgreSQL, MongoDB, Redis\n• **Containers**: Docker, Kubernetes\n\nOur AI automatically detects your stack and optimizes deployment!",
        suggestions: [
          "Supported frameworks?",
          "Database options?",
          "Contact support",
        ],
        timestamp: new Date().toISOString(),
        error: false,
      };
    }

    // Default response
    return {
      message: `Thanks for asking about **"${userMessage}"**!\n\n🚀 **DeployIO** is an AI-powered deployment platform that:\n\n• Analyzes your code automatically\n• Generates optimal configurations\n• Deploys to any cloud platform\n• Monitors performance in real-time\n\nWant to learn more? Ask about pricing, getting started, or our supported technologies!`,
      suggestions: [
        "How does deployio work?",
        "Show me pricing",
        "Getting started guide",
      ],
      timestamp: new Date().toISOString(),
      error: false,
    };
  }

  /**
   * Fallback DevOps response when AI service is unavailable
   * @param {string} userMessage - User's message
   * @returns {object} Fallback response
   */
  _getFallbackDevOpsResponse(userMessage) {
    const userLower = userMessage.toLowerCase();

    // Docker inquiries
    if (userLower.includes("docker")) {
      return {
        message: `🐳 **Docker Best Practices:**

**Image Optimization:**
\`\`\`dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

**Key Tips:**
• Use multi-stage builds
• Run as non-root user
• Use Alpine images for smaller size
• Implement health checks`,
        timestamp: new Date().toISOString(),
        error: false,
      };
    }

    // Kubernetes inquiries
    if (userLower.includes("kubernetes") || userLower.includes("k8s")) {
      return {
        message: `☸️ **Kubernetes Essentials:**

**Deployment Configuration:**
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
\`\`\`

**Best Practices:**
• Always set resource limits
• Use health checks
• Implement RBAC
• Use namespaces for organization`,
        timestamp: new Date().toISOString(),
        error: false,
      };
    }

    // CI/CD inquiries
    if (
      userLower.includes("ci") ||
      userLower.includes("cd") ||
      userLower.includes("pipeline")
    ) {
      return {
        message: `🚀 **CI/CD Pipeline Guide:**

**GitHub Actions Example:**
\`\`\`yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Build & Deploy
      run: |
        docker build -t app .
        docker push app:latest
\`\`\`

**Pipeline Principles:**
• Test before deploy
• Use environment variables
• Implement rollback strategies
• Monitor deployment health`,
        timestamp: new Date().toISOString(),
        error: false,
      };
    }

    // Default DevOps response
    return {
      message: `I understand you're asking about **"${userMessage}"**

**I can help you with:**
• **Docker & Containers:** Optimization, security, best practices
• **Kubernetes:** Deployments, services, scaling strategies  
• **CI/CD:** GitHub Actions, Jenkins, pipeline design
• **Infrastructure:** Terraform, AWS, Azure, GCP
• **Security:** Container scanning, RBAC, compliance
• **Monitoring:** Logging, metrics, observability

💡 **Tip:** Try asking about specific topics like "Docker best practices" or "Kubernetes deployment"

Need more specific help? Feel free to ask about any DevOps topic!`,
      timestamp: new Date().toISOString(),
      error: false,
    };
  }
}

module.exports = new AIChatService();
