// DevOps Chat Service using Backend Server
// This communicates with the backend server which handles authentication and AI service communication

import api from "../utils/api";

class DevopsChatService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    this.apiEndpoint = `${this.baseURL}/api/v1/ai/chat`;
  }

  // Check if API is configured
  isConfigured() {
    return !!this.baseURL;
  }

  // Generate response using backend AI service
  async generateResponse(userMessage, context = {}) {
    if (!this.isConfigured()) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      const response = await api.post(
        `/ai/chat/devops`,
        {
          message: userMessage,
          context: context,
        },
        {
          headers: {
            ...this._getAuthHeaders(),
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        return response.data.data.message;
      } else {
        throw new Error(response.data.message || "API request failed");
      }
    } catch (error) {
      console.error("DevOps Chat Service Error:", error);

      // Return fallback if API fails
      return this.getFallbackResponse(userMessage);
    }
  }

  // Get authentication headers from stored tokens
  _getAuthHeaders() {
    const token = localStorage.getItem("token") || this._getCookieToken();
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }

  // Get token from cookies (fallback)
  _getCookieToken() {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "token") {
        return value;
      }
    }
    return null;
  }

  // Get system prompt for DeployBot
  getSystemPrompt(context = {}) {
    return `You are DeployBot, an intelligent DevOps AI assistant specializing in:

**Core Expertise:**
- Docker & Containerization (optimization, security, best practices)
- Kubernetes & Container Orchestration
- CI/CD Pipelines (GitHub Actions, Jenkins, GitLab CI)
- Infrastructure as Code (Terraform, CloudFormation, Pulumi)
- Cloud Platforms (AWS, Azure, GCP)
- DevOps Security & Compliance
- Monitoring & Observability
- Microservices Architecture

**Communication Style:**
- Provide clear, actionable advice
- Include code examples when relevant
- Use markdown formatting for better readability
- Structure responses with headers, bullet points, and code blocks
- Be concise but comprehensive
- Focus on production-ready solutions

**Response Format:**
Use markdown formatting:
- **Bold** for section headers
- \`inline code\` for commands/file names
- \`\`\`language blocks for code examples
- • Bullet points for lists
- 🔧 Relevant emojis for visual appeal

**Context:**
${context.activeFile ? `Currently viewing file: ${context.activeFile}` : ""}
${context.repository ? `Repository: ${context.repository}` : ""}

Always provide practical, industry-standard DevOps solutions.`;
  }

  // Get fallback response when API is not available
  getFallbackResponse(userMessage) {
    const responses = {
      docker: `🐳 **Docker Best Practices:**

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

      kubernetes: `☸️ **Kubernetes Essentials:**

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

      "ci/cd": `🚀 **CI/CD Pipeline Guide:**

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

      terraform: `🏗️ **Infrastructure as Code:**

**Terraform Basics:**
\`\`\`hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"
  
  tags = {
    Name = "WebServer"
  }
}
\`\`\`

**Best Practices:**
• Use modules for reusability
• Version your configurations
• Implement state management
• Use workspaces for environments`,

      security: `🔒 **DevOps Security:**

**Container Security:**
• Scan images for vulnerabilities
• Use distroless images
• Run as non-root user
• Keep dependencies updated

**Infrastructure Security:**
• Implement network policies
• Use secrets management (Vault)
• Enable audit logging
• Regular security assessments

**Code Security:**
• Static code analysis
• Dependency scanning
• Secret detection
• SAST/DAST integration`,
    };

    const userLower = userMessage.toLowerCase();
    for (const [keyword, response] of Object.entries(responses)) {
      if (userLower.includes(keyword)) {
        return response;
      }
    }

    return `I understand you're asking about **"${userMessage}"**

**I can help you with:**
• **Docker & Containers:** Optimization, security, best practices
• **Kubernetes:** Deployments, services, scaling strategies
• **CI/CD:** GitHub Actions, Jenkins, pipeline design
• **Infrastructure:** Terraform, AWS, Azure, GCP
• **Security:** Container scanning, RBAC, compliance
• **Monitoring:** Logging, metrics, observability

💡 **Tip:** Try asking about specific topics like "Docker best practices" or "Kubernetes deployment"

To get personalized responses from our AI assistant, please make sure you're logged in to your DeployIO account.`;
  }

  // Check service health
  async checkHealth() {
    try {
      const response = await api.get(`/ai/chat/health`, {
        timeout: 10000,
      });
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("DevOps chat health check failed:", error);
      return null;
    }
  }
}

export default new DevopsChatService();
