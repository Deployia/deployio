// Simple LLM Service using Groq API
// This is a client-side implementation for testing purposes
// In production, this should be moved to the backend

class DevopsChatService {
  constructor() {
    this.apiKey =
      import.meta.env.VITE_GROQ_API_KEY ||
      import.meta.env.VITE_APP_GROQ_API_KEY ||
      null;
    this.baseURL = "https://api.groq.com/openai/v1/chat/completions";
    this.model = "llama3-8b-8192"; // Fast and reliable model
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.apiKey && this.apiKey !== "your_groq_api_key_here";
  }

  // Generate response using Groq API
  async generateResponse(userMessage, context = {}) {
    if (!this.isConfigured()) {
      throw new Error("Groq API key not configured");
    }

    const systemPrompt = this.getSystemPrompt(context);

    try {
      const response = await fetch(this.baseURL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Groq API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return (
        data.choices[0]?.message?.content ||
        "Sorry, I could not generate a response."
      );
    } catch (error) {
      console.error("LLM Service Error:", error);
      throw error;
    }
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

To get personalized responses, configure your Groq API key in \`VITE_GROQ_API_KEY\` environment variable.`;
  }
}

export default new DevopsChatService();
